import { LucideIcon } from "lucide-react";
import { LearningTargetStatus } from "./learningTarget";

/**
 * Öğrenme Hedefi durumlarına karşılık gelen stil ve görsel bilgileri
 */
export interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

/**
 * Öğrenme Hedefi durumlarına karşılık gelen başarı yüzdesi aralıkları
 * @see PRD 4.5.2
 */
export const STATUS_SCORE_RANGES = {
  failed: { min: 0, max: 49 },
  medium: { min: 50, max: 69 },
  mastered: { min: 70, max: 100 },
} as const;

/**
 * Başarı yüzdesine göre durum belirleme yardımcı fonksiyonu
 */
export function getStatusFromScore(scorePercent: number): LearningTargetStatus {
  if (scorePercent >= STATUS_SCORE_RANGES.mastered.min) return "mastered";
  if (scorePercent >= STATUS_SCORE_RANGES.medium.min) return "medium";
  if (scorePercent >= STATUS_SCORE_RANGES.failed.min) return "failed";
  return "pending";
}

// UI için yardımcı tipler ve fonksiyonlar (PRD dışı, UI amaçlı tutulabilir)
