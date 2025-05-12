"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiUpload, FiFileText, FiCheck, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import documentService from "@/services/document.service";

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
}

export default function UploadSection({ onFileUpload }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    // Dosya tipi kontrolü documentService'e taşındı
    setSelectedFile(file);
    setUploadStatus("idle");
    setErrorMessage("");
    onFileUpload(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus("uploading");
      setUploadProgress(0);

      // Document servisi aracılığıyla dosya yükleme
      // Bu servis, dosyayı backend API'ye gönderir ve HttpOnly cookie ile kimlik doğrulama yapar
      await documentService.uploadDocument(
        selectedFile,
        undefined, // Herhangi bir kurs ID'si olmadan
        (progress: number) => setUploadProgress(progress)
      );

      setUploadStatus("success");
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      );
      setUploadStatus("error");
    }
  }, [selectedFile]);

  // Dosya seçildiğinde otomatik yükleme başlat
  useEffect(() => {
    if (selectedFile && uploadStatus === "idle") {
      handleUpload();
    }
  }, [selectedFile, uploadStatus, handleUpload]);

  return (
    <div>
      <motion.div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
            : uploadStatus === "error"
              ? "border-red-500 hover:border-red-600"
              : uploadStatus === "success"
                ? "border-green-500 hover:border-green-600"
                : "border-gray-300 hover:border-indigo-500 dark:border-gray-700 dark:hover:border-indigo-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          ref={fileInputRef}
          accept=".pdf,.docx,.txt"
        />

        <div className="flex flex-col items-center">
          {uploadStatus === "success" ? (
            <>
              <FiCheck className="text-5xl text-green-500 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {selectedFile?.name}
              </p>
              <p className="text-green-600 dark:text-green-400 font-medium">
                Dosya başarıyla yüklendi!
              </p>
            </>
          ) : uploadStatus === "error" ? (
            <>
              <FiAlertCircle className="text-5xl text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                {errorMessage}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Lütfen tekrar deneyin
              </p>
            </>
          ) : uploadStatus === "uploading" ? (
            <>
              <div className="relative mb-4">
                <FiFileText className="text-5xl text-indigo-600 mb-4" />
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {selectedFile?.name}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Yükleniyor... {uploadProgress.toFixed(0)}%
              </p>
            </>
          ) : selectedFile ? (
            <>
              <FiFileText className="text-5xl text-indigo-600 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {selectedFile.name}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <FiUpload className="text-5xl text-indigo-600 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF, Word veya metin dosyası yükleyin
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Sürükle bırak veya tıklayarak dosya seçin
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Dosya formatı bilgisi */}
      <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Desteklenen formatlar: PDF, DOCX, TXT (Maks. 10MB)
      </div>
    </div>
  );
}
