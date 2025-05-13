// frontend/src/constants/file.constants.ts

// DocumentUploader.tsx'den taşınacak varsayılan dosya tipleri
export const DEFAULT_ALLOWED_FILE_TYPES = [".pdf", ".docx", ".doc", ".txt"];

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; 