"use client";

import { motion } from "framer-motion";
import { DocumentUploader } from "../../document";

interface FileUploadStepProps {
  onFileUpload: (file: File, uploadedFileUrl: string) => void;
  onError: (errorMsg: string) => void;
}

export default function FileUploadStep({
  onFileUpload,
  onError,
}: FileUploadStepProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        1. Dosya
      </h3>

      <DocumentUploader
        onFileUpload={onFileUpload}
        onError={onError}
        maxSize={40} // MB cinsinden
        allowedFileTypes={[".pdf", ".docx", ".doc", ".txt"]}
        className="mb-4"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Desteklenen formatlar: PDF, DOCX, DOC, TXT (Maks 40MB). Lütfen şifresiz
        ve okunabilir belgeler yükleyin.
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        <b>Not:</b> &quot;Zayıf/Orta Odaklı&quot; kişiselleştirilmiş sınav türü
        için belge yüklemeniz gerekmez, bu adımı atlayabilirsiniz.
      </p>
    </motion.div>
  );
}
