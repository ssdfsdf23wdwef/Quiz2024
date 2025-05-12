"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiUpload,
  FiFileText,
  FiX,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { useDropzone } from "react-dropzone";

interface DocumentUploadScreenProps {
  onFileSelected: (file: File) => void;
  onSkip: () => void;
  isUploading: boolean;
  error?: string;
  supportedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export default function DocumentUploadScreen({
  onFileSelected,
  onSkip,
  isUploading = false,
  error,
  supportedFileTypes = [".pdf", ".docx", ".doc", ".txt"],
  maxFileSizeMB = 10,
}: DocumentUploadScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      const file = files[0];

      // Dosya boyutu kontrolü
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        alert(`Dosya boyutu çok büyük. Maksimum ${maxFileSizeMB}MB olmalıdır.`);
        return;
      }

      // Dosya tipi kontrolü
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!supportedFileTypes.includes(fileExtension)) {
        alert(
          `Desteklenmeyen dosya türü. Desteklenen türler: ${supportedFileTypes.join(", ")}`,
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileChange,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"
    >
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
        Belge Yükleme
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
        Sınav oluşturmak için bir ders notu, makale veya benzer bir belge
        yükleyin. Yapay zeka belgedeki konuları tespit ederek sınav soruları
        üretecektir.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex">
            <FiAlertCircle className="text-red-500 flex-shrink-0 mr-2 h-5 w-5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/10"
            }
          `}
        >
          <input {...getInputProps()} ref={fileInputRef} />

          <div className="flex flex-col items-center justify-center py-4">
            <FiUpload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-medium">Belgenizi sürükleyip bırakın</span>{" "}
              veya buraya tıklayın
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF, Word ve metin dosyaları desteklenir (max. {maxFileSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/30 border rounded-lg p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded">
                <FiFileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-4 mt-5">
        {selectedFile ? (
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className={`
              flex items-center justify-center px-4 py-2 rounded font-medium text-white
              ${
                isUploading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
              transition-colors duration-200 flex-1
            `}
          >
            {isUploading ? (
              <>
                <FiLoader className="animate-spin h-4 w-4 mr-2" />
                Yükleniyor...
              </>
            ) : (
              "Belgeyi Yükle"
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 
            rounded font-medium cursor-not-allowed"
          >
            Belge Seçin
          </button>
        )}

        <button
          onClick={onSkip}
          disabled={isUploading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
          rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          Bu Adımı Atla
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>
          * Belge yüklemeden de sınav oluşturabilirsiniz. Bu durumda konuları
          kendiniz seçmeniz gerekecektir.
        </p>
      </div>
    </motion.div>
  );
}
