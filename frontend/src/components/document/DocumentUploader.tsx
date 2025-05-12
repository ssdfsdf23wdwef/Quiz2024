import React, { useState, useRef, useCallback } from "react";
import { FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import documentService from "@/services/document.service";

interface DocumentUploaderProps {
  onFileUpload: (file: File, fileUrl: string) => void;

  onError?: (message: string) => void;

  maxSize?: number; // Size in MB

  className?: string;

  allowedFileTypes?: string[];
}

const DEFAULT_ALLOWED_TYPES = [".pdf", ".docx", ".doc", ".txt"];

export default function DocumentUploader({
  onFileUpload,
  onError,
  maxSize = 10,
  className = "",
  allowedFileTypes = DEFAULT_ALLOWED_TYPES,
}: DocumentUploaderProps) {
  // ----- State Definitions -----
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "validating" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- Environment Check -----
  // Using process.env requires appropriate build tool setup (like Vite, Create React App, Next.js)
  const isDevelopment = process.env.NODE_ENV === "development";

  // ----- Core Upload Logic -----
  const uploadFile = useCallback(
    async (file: File) => {
      setUploadStatus("uploading");
      setUploadProgress(0); // Reset progress before starting

      // --- Development/Test Mode Simulation ---
      if (isDevelopment) {
        console.log("Geliştirme modu: Dosya yüklemesi simüle ediliyor.");
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setUploadProgress(Math.min(progress, 100));
          if (progress >= 100) {
            clearInterval(interval);
            setUploadStatus("success");
            const mockFileUrl = `mock://uploaded/${encodeURIComponent(file.name)}`;
            // Callback needs the actual file object and the mock URL
            onFileUpload(file, mockFileUrl);
          }
        }, 150); // Simulate upload time
        return; // Skip real upload
      }

      // --- Production Mode: Real Upload ---
      try {
        // Düzgün tip kullanımı
        const response = await documentService.uploadDocument(file);

        setUploadStatus("success");
        if (onFileUpload) {
          // Dosya URL'sini yanıttan al
          const fileUrl = response.document.storageUrl || "";
          onFileUpload(file, fileUrl);
        }
      } catch (error) {
        const friendlyMessage = (error as Error)?.message || "Bir hata oluştu.";
        setErrorMessage(friendlyMessage);
        setUploadStatus("error");
        if (onError) {
          onError(friendlyMessage);
        }
        // Hata loglaması için console.error kullan
        console.error("Dosya yükleme hatası:", error);
      }
    },
    [onFileUpload, onError, isDevelopment],
  ); // Include isDevelopment dependency

  // ----- File Selection and Validation -----
  const handleFileSelection = useCallback(
    async (file: File | null) => {
      if (!file) {
        resetUpload(); // Reset if no file is selected (e.g., user cancels dialog)
        return;
      }

      setUploadStatus("validating"); // Indicate validation is happening
      setErrorMessage(""); // Clear previous errors
      setSelectedFile(file); // Set the file temporarily for display

      try {
        // 1. File Type Check
        const fileExtension = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase();
        if (!allowedFileTypes.includes(fileExtension)) {
          throw new Error(
            `Desteklenmeyen dosya türü (${fileExtension}). İzin verilenler: ${allowedFileTypes.join(", ")}`,
          );
        }

        // 2. File Size Check
        const maxSizeInBytes = maxSize * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          throw new Error(
            `Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimum ${maxSize}MB olabilir.`,
          );
        }

        // Validation successful, proceed to upload
        // Use a microtask/timeout to ensure 'validating' state renders briefly if needed
        // Although `await uploadFile` will likely handle the transition smoothly.
        await uploadFile(file);
      } catch (error) {
        const msg = (error as Error)?.message || "Bir hata oluştu.";
        setErrorMessage(msg);
        setUploadStatus("error");
        setSelectedFile(null); // Clear selected file on validation error
        if (onError) onError(msg);
        // No need to log validation errors usually, unless desired
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowedFileTypes, maxSize, uploadFile, onError],
  ); // resetUpload might be needed if validation fails immediately

  // ----- Drag and Drop Event Handlers -----
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (uploadStatus !== "uploading" && uploadStatus !== "success") {
        setIsDragging(true);
      }
    },
    [uploadStatus],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (uploadStatus === "uploading" || uploadStatus === "success") {
        return; // Don't allow drop while uploading or after success
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileSelection(file);
        e.dataTransfer.clearData(); // Recommended practice
      }
    },
    [handleFileSelection, uploadStatus],
  );

  // ----- Input Change Handler -----
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        handleFileSelection(file);
      } else {
        // Handle case where user cancels file selection dialog
        if (uploadStatus !== "success") {
          // Don't reset if a file was already successfully uploaded
          resetUpload();
        }
      }
    },
    [handleFileSelection, uploadStatus],
  ); // Add dependencies

  // ----- Click Handler to Trigger Input -----
  const handleClick = useCallback(() => {
    // Don't trigger file input if already uploading, successful, or has error (use reset button)
    if (uploadStatus === "idle" || uploadStatus === "validating") {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }, [uploadStatus]); // Depend on uploadStatus

  // ----- Reset Function -----
  const resetUpload = useCallback(() => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setErrorMessage("");
    setIsDragging(false); // Ensure dragging state is reset

    // Reset the file input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []); // No dependencies needed here usually

  // ----- Dynamic Styling -----
  const getBorderColor = () => {
    if (isDragging) return "border-indigo-600 dark:border-indigo-500";
    if (uploadStatus === "error") return "border-red-500 dark:border-red-500";
    if (uploadStatus === "success")
      return "border-green-500 dark:border-green-500";
    return "border-gray-300 hover:border-indigo-500 dark:border-gray-700 dark:hover:border-indigo-400";
  };

  const getBackgroundColor = () => {
    if (isDragging) return "bg-indigo-50 dark:bg-indigo-900/20";
    if (uploadStatus === "error") return "bg-red-50 dark:bg-red-900/10";
    if (uploadStatus === "success") return "bg-green-50 dark:bg-green-900/10";
    return "bg-white dark:bg-gray-800/50"; // Default background
  };

  const getCursorStyle = () => {
    switch (uploadStatus) {
      case "uploading":
        return "cursor-default"; // No action while uploading
      case "success":
      case "error":
        return "cursor-default"; // Use buttons for actions
      case "idle":
      case "validating":
      default:
        return "cursor-pointer"; // Allow click/drag
    }
  };

  // ----- Render Logic -----
  const renderContent = () => {
    switch (uploadStatus) {
      case "success":
        return (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FiCheck
                className="text-3xl text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
            </div>
            <p
              className="text-gray-800 dark:text-gray-200 font-medium mb-1 text-lg"
              aria-live="polite"
            >
              Belge Başarıyla Yüklendi
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm break-all px-4">
              {selectedFile?.name}
            </p>
            <button
              type="button" // Prevent form submission if inside a form
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering handleClick on the parent div
                resetUpload();
              }}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Farklı Belge Yükle
            </button>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FiAlertCircle
                className="text-3xl text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <p
              className="text-red-700 dark:text-red-300 font-medium mb-2 text-lg"
              aria-live="assertive"
            >
              Yükleme Hatası
            </p>
            {/* Display error message */}
            <p className="text-red-600 dark:text-red-400 mb-4 max-w-md text-sm">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tekrar Dene
            </button>
          </div>
        );
      case "validating":
      case "uploading":
        // Combine validating and uploading visually, as validation is usually quick
        return (
          <div className="flex flex-col items-center text-center">
            {/* Simple Spinner or Progress Bar */}
            <div className="w-12 h-12 mb-4 border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p
              className="text-gray-800 dark:text-gray-200 font-medium mb-1 text-lg"
              aria-live="polite"
            >
              {uploadStatus === "validating"
                ? "Doğrulanıyor..."
                : `Yükleniyor... ${uploadProgress}%`}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm break-all px-4">
              {selectedFile?.name}
            </p>
            {uploadStatus === "uploading" &&
              !isDevelopment && ( // Show progress bar only during actual upload
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <motion.div
                    className="bg-indigo-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }} // Smooth transition
                  />
                </div>
              )}
          </div>
        );
      case "idle":
      default:
        return (
          <div className="flex flex-col items-center text-center">
            <FiUpload
              className="text-5xl text-indigo-600 dark:text-indigo-400 mb-4"
              aria-hidden="true"
            />
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
              Belge Yükleyin
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
              Dosyayı buraya sürükleyin veya tıklayın
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              İzin verilen türler:{" "}
              {allowedFileTypes
                .map((ext) => ext.substring(1).toUpperCase())
                .join(", ")}{" "}
              (Maks. {maxSize}MB)
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors duration-200 ease-in-out relative ${getBorderColor()} ${getBackgroundColor()} ${getCursorStyle()}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button" // Makes it behave like a button for assistive technologies
        tabIndex={0} // Makes it focusable
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }} // Allow activation with Enter/Space
        aria-label={
          uploadStatus === "idle"
            ? `Dosya yüklemek için tıklayın veya sürükleyin. İzin verilen türler: ${allowedFileTypes.join(", ")}, Maksimum boyut: ${maxSize}MB`
            : "Dosya yükleme alanı"
        }
        whileHover={{
          scale:
            uploadStatus === "idle" || uploadStatus === "validating"
              ? 1.02
              : 1.0,
        }} // Hover effect only when interactive
        whileTap={{
          scale:
            uploadStatus === "idle" || uploadStatus === "validating"
              ? 0.98
              : 1.0,
        }} // Tap effect only when interactive
      >
        <input
          type="file"
          className="hidden" // Visually hidden but accessible
          onChange={handleFileChange}
          ref={fileInputRef}
          accept={allowedFileTypes.join(",")} // Set accepted file types on input
          aria-hidden="true" // Hide from accessibility tree as the div handles interaction
        />

        {/* Animate presence for smooth transitions between states */}
        <AnimatePresence mode="wait">
          <motion.div
            key={uploadStatus} // Key change triggers animation
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center min-h-[150px]" // Ensure consistent height
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Error message area */}
      {uploadStatus === "error" && errorMessage && (
        <div className="mt-3 flex items-center justify-center text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2 text-sm">
          <FiAlertCircle className="mr-2 text-xl text-red-500" />
          <span>
            {errorMessage.includes("dosya türü") ||
            errorMessage.includes("İzin verilenler:")
              ? `Desteklenmeyen dosya türü. Lütfen sadece ${allowedFileTypes.map((ext) => ext.substring(1).toUpperCase()).join(", ")} dosyalarını yükleyin.`
              : errorMessage}
          </span>
        </div>
      )}
    </div>
  );
}
