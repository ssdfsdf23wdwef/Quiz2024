/**
 * Belge (Document) modelini temsil eden interface
 * @see PRD 7.8 (PRD'de 7.8 olarak geçiyor, model açıklaması Document)
 */
export interface Document {
  id: string;
  userId: string;
  courseId?: string | null;
  fileName: string;
  storagePath: string;
  storageUrl: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  createdAt: string;
}

/**
 * Belge tipini tanımlayan arayüz (Document'tan türetilmiş, extractedText opsiyonel)
 */
export interface DocumentType
  extends Omit<Document, "extractedText" | "courseId"> {
  courseId?: string;
  extractedText?: string;
}

/**
 * Yeni belge yükleme için gerekli alanlar (Backend'in beklediği formata uygun)
 */
export interface DocumentUploadPayload {
  file: File;
  courseId?: string;
}

/**
 * Belge yükleme sınırlamaları (Backend ile uyumlu)
 */
export const DOCUMENT_UPLOAD_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB (Backend'deki sınırla aynı)
  allowedFileTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    ".pdf",
    ".docx",
    ".txt",
  ],
  maxSizeFormatted: "10MB",
};

/**
 * Belge ekleme cevabı
 */
export interface DocumentUploadResponse {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  extractedText: string;
}

/**
 * Belge silme cevabı
 */
export interface DocumentDeleteResponse {
  id: string;
  success: boolean;
}
