import React, { useState, useRef, useCallback } from "react";
import { FiUpload, FiCheck, FiAlertCircle, FiFile } from "react-icons/fi";
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
        // Simulate progress with more realistic increments
        let progress = 0;
        const interval = setInterval(() => {
          // Random increment between 5-15 for more realistic progress simulation
          const increment = Math.floor(Math.random() * 10) + 5;
          progress += increment;
          setUploadProgress(Math.min(progress, 100));
          if (progress >= 100) {
            clearInterval(interval);
            setUploadStatus("success");
            const mockFileUrl = `mock://uploaded/${encodeURIComponent(file.name)}`;
            // Callback needs the actual file object and the mock URL
            onFileUpload(file, mockFileUrl);
          }
        }, 200); // Slightly slower for better visual effect
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
    if (isDragging) return "border-indigo-500/70 dark:border-indigo-400/70";
    if (uploadStatus === "error") return "border-red-500/70 dark:border-red-400/70";
    if (uploadStatus === "success") return "border-green-500/70 dark:border-green-400/70";
    return "border-gray-300/50 hover:border-indigo-400/70 dark:border-gray-600/50 dark:hover:border-indigo-400/70";
  };

  const getBackgroundColor = () => {
    if (isDragging) return "bg-gradient-to-br from-indigo-50/90 via-indigo-100/80 to-indigo-50/90 dark:from-indigo-900/30 dark:via-indigo-800/20 dark:to-indigo-900/10";
    if (uploadStatus === "error") return "bg-gradient-to-br from-red-50/90 via-red-100/80 to-red-50/90 dark:from-red-900/30 dark:via-red-800/20 dark:to-red-900/10";
    if (uploadStatus === "success") return "bg-gradient-to-br from-green-50/90 via-green-100/80 to-green-50/90 dark:from-green-900/30 dark:via-green-800/20 dark:to-green-900/10";
    return "bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 dark:from-gray-800/50 dark:via-gray-900/40 dark:to-gray-800/30"; // Default background
  };
  
  const getGlassEffect = () => {
    return "backdrop-filter backdrop-blur-lg bg-opacity-80 dark:bg-opacity-60 shadow-sm dark:shadow-gray-900/30";
  };
  
  const getHoverEffect = () => {
    if (uploadStatus === "idle" || uploadStatus === "validating") {
      return "hover:shadow-md hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/20 transition-shadow duration-300";
    }
    return "";
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
            <motion.div 
              className="mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/20 flex items-center justify-center shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <FiCheck
                  className="text-2xl text-green-600 dark:text-green-400"
                  aria-hidden="true"
                />
              </motion.div>
            </motion.div>
            <motion.p
              className="text-gray-800 dark:text-gray-200 font-medium mb-1 text-base"
              aria-live="polite"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Belge Başarıyla Yüklendi
            </motion.p>
            <motion.div 
              className="flex items-center mb-3 text-sm text-gray-600 dark:text-gray-300 px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 rounded-full backdrop-blur-sm max-w-[90%] shadow-sm"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <FiFile className="flex-shrink-0 mr-1.5 text-green-500 dark:text-green-400" />
              <span className="truncate">{selectedFile?.name}</span>
            </motion.div>
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="px-3.5 py-1.5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-gray-300/60 dark:border-gray-600/60 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
            >
              Farklı Belge Yükle
            </motion.button>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center text-center">
            <motion.div 
              className="mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <FiAlertCircle
                  className="text-2xl text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </motion.div>
            </motion.div>
            <motion.p
              className="text-red-700 dark:text-red-300 font-medium mb-1 text-base"
              aria-live="assertive"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Yükleme Hatası
            </motion.p>
            {/* Display error message */}
            <motion.p 
              className="text-red-600 dark:text-red-400 mb-3 max-w-[90%] text-xs px-3 py-1.5 bg-red-50/80 dark:bg-red-900/20 rounded-lg backdrop-blur-sm shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              {errorMessage}
            </motion.p>
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="px-3.5 py-1.5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-gray-300/60 dark:border-gray-600/60 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
            >
              Tekrar Dene
            </motion.button>
          </div>
        );
      case "validating":
      case "uploading":
        // Combine validating and uploading visually, as validation is usually quick
        return (
          <div className="flex flex-col items-center text-center">
            {/* Improved Spinner */}
            <motion.div 
              className="w-12 h-12 mb-3 rounded-full bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-center shadow-inner"
              animate={{ 
                boxShadow: [
                  "inset 0 2px 4px rgba(0,0,0,0.1)",
                  "inset 0 3px 6px rgba(0,0,0,0.15)",
                  "inset 0 2px 4px rgba(0,0,0,0.1)"
                ]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut" 
              }}
            >
              <div className="w-8 h-8 border-3 border-indigo-100 dark:border-indigo-800/50 border-t-indigo-500 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </motion.div>
            <motion.p
              className="text-gray-800 dark:text-gray-200 font-medium mb-1 text-base"
              aria-live="polite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {uploadStatus === "validating"
                ? "Doğrulanıyor..."
                : `Yükleniyor... ${uploadProgress}%`}
            </motion.p>
            <motion.div 
              className="flex items-center mb-3 text-sm text-gray-600 dark:text-gray-300 px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 rounded-full backdrop-blur-sm max-w-[90%] shadow-sm"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FiFile className="flex-shrink-0 mr-1.5 text-indigo-500 dark:text-indigo-400" />
              <span className="truncate">{selectedFile?.name}</span>
            </motion.div>
            {uploadStatus === "uploading" &&
              !isDevelopment && ( // Show progress bar only during actual upload
                <motion.div 
                  className="w-[90%] bg-gray-200/70 dark:bg-gray-700/70 rounded-full h-1.5 mt-1 overflow-hidden shadow-inner"
                  initial={{ opacity: 0, scaleX: 0.95 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }} // Smoother transition
                  />
                </motion.div>
              )}
          </div>
        );
      case "idle":
      default:
        return (
          <div className="flex flex-col items-center text-center">
            <motion.div 
              className="mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 flex items-center justify-center shadow-sm"
              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(79, 70, 229, 0.15)" }}
              animate={{ 
                y: [0, -3, 0],
                transition: { 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 2.5,
                  ease: "easeInOut" 
                }
              }}
            >
              <FiUpload
                className="text-2xl text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
            </motion.div>
            <motion.p 
              className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Belge Yükleyin
            </motion.p>
            <motion.p 
              className="text-gray-600 dark:text-gray-400 mb-2 text-xs"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Dosyayı buraya sürükleyin veya tıklayın
            </motion.p>
            <motion.div 
              className="inline-flex items-center px-2.5 py-1 bg-indigo-50/70 dark:bg-indigo-900/20 rounded-full text-xs text-indigo-700 dark:text-indigo-300 backdrop-blur-sm shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 25 }}
            >
              <span>
                {allowedFileTypes
                  .map((ext) => ext.substring(1).toUpperCase())
                  .join(", ")}{" "}
                (Maks. {maxSize}MB)
              </span>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`border border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all duration-300 ease-in-out relative overflow-hidden ${getBorderColor()} ${getBackgroundColor()} ${getGlassEffect()} ${getHoverEffect()} ${getCursorStyle()}`}
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
        initial={{ opacity: 0, y: 5 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileHover={{
          scale:
            uploadStatus === "idle" || uploadStatus === "validating"
              ? 1.01
              : 1.0,
          boxShadow: uploadStatus === "idle" || uploadStatus === "validating" 
              ? "0 8px 20px rgba(79, 70, 229, 0.15)" 
              : "none",
          borderColor: uploadStatus === "idle" ? "rgba(99, 102, 241, 0.5)" : undefined,
          transition: { duration: 0.2 }
        }} // Hover effect only when interactive
        whileTap={{
          scale:
            uploadStatus === "idle" || uploadStatus === "validating"
              ? 0.985
              : 1.0,
          transition: { duration: 0.1 }
        }} // Tap effect only when interactive
      >
        <input
          type="file"
          className="hidden" // Visually hidden but accessible
          onChange={handleFileChange}
          ref={fileInputRef}
          accept={allowedFileTypes.join(",")}
          aria-hidden="true" 
        />

        {/* Add subtle background patterns/elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10 dark:opacity-5 pointer-events-none">
          <motion.div 
            className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-indigo-200 dark:bg-indigo-700 blur-xl"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut" 
            }}
          ></motion.div>
          <motion.div 
            className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-indigo-300 dark:bg-indigo-600 blur-xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              ease: "easeInOut",
              delay: 1
            }}
          ></motion.div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={uploadStatus} // Key change triggers animation
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} // Custom cubic bezier for smooth feel
            className="flex flex-col items-center justify-center min-h-[110px] z-10 relative" // More compact height
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
