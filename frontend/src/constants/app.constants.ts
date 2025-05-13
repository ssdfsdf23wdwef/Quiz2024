// frontend/src/constants/app.constants.ts
export const APP_NAME = "Quiz Platform";
export const APP_VERSION = "1.0.0";

export const DEFAULT_LANGUAGE = "tr";

// Örnek meta veri sabitleri (layout.tsx'den taşınabilir)
export const METADATA_DEFAULT_TITLE = "quiz - Akıllı Sınav Hazırlama ve Öğrenme Platformu";
export const METADATA_DEFAULT_DESCRIPTION = "Kişiselleştirilmiş sınavlarla öğrenmenizi geliştirin";

// frontend/src/types/status.ts dosyasından taşınacak STATUS_SCORE_RANGES
export const STATUS_SCORE_RANGES = {
  failed: { min: 0, max: 49 },
  medium: { min: 50, max: 69 },
  mastered: { min: 70, max: 100 },
} as const; 