import React from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiTarget,
} from "react-icons/fi";
import { LearningTargetStatus } from "../types/learningTarget.type";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { CourseStatus, CourseStatusInfo } from "../types/status.type"; // Güncellendi

// Durum bilgileri için sabit tanımlamalar
export const STATUS_INFO: Record<CourseStatus, CourseStatusInfo> = {
  başarılı: {
    label: "başarılı",
    color: "text-state-success",
    bgColor: "bg-state-success-bg",
    borderColor: "border-state-success-border",
    icon: <FiCheckCircle className="text-state-success" />,
    description: "Hedeflere ulaşıldı",
  },
  orta: {
    label: "orta",
    color: "text-state-warning",
    bgColor: "bg-state-warning-bg",
    borderColor: "border-state-warning-border",
    icon: <FiClock className="text-state-warning" />,
    description: "Gelişim devam ediyor",
  },
  başarısız: {
    label: "başarısız",
    color: "text-state-error",
    bgColor: "bg-state-error-bg",
    borderColor: "border-state-error-border",
    icon: <FiAlertCircle className="text-state-error" />,
    description: "İyileştirme gerekli",
  },
  beklemede: {
    label: "beklemede",
    color: "text-state-info",
    bgColor: "bg-state-info-bg",
    borderColor: "border-state-info-border",
    icon: <FiTarget className="text-state-info" />,
    description: "Henüz başlanmadı",
  },
};

// Durum rengine göre ilerleme çubuğu rengi döndürür
export const getStatusProgressColor = (
  status: CourseStatus,
): "default" | "success" | "warning" | "danger" => {
  switch (status) {
    case "başarılı":
      return "success";
    case "orta":
      return "warning";
    case "başarısız":
      return "danger";
    default:
      return "default";
  }
};

/**
 * Öğrenme Hedefi durumlarına karşılık gelen stil ve görsel bilgileri
 * @see PRD 4.5.2 ve 4.7.1
 */
export const statusConfig: Record<LearningTargetStatus, CourseStatusInfo> = { // StatusInfo -> CourseStatusInfo olarak güncellendi
  pending: {
    label: "beklemede" as CourseStatus, // Tip uyumu için eklendi
    color: "text-secondary",
    bgColor: "bg-secondary/20",
    borderColor: "border-secondary",
    icon: <Clock className="text-secondary" />,
    description: "",
  },
  failed: {
    label: "başarısız" as CourseStatus, // Tip uyumu için eklendi
    color: "text-state-error",
    bgColor: "bg-state-error-bg",
    borderColor: "border-state-error-border",
    icon: <XCircle className="text-state-error" />,
    description: "",
  },
  medium: {
    label: "orta" as CourseStatus, // Tip uyumu için eklendi
    color: "text-state-warning",
    bgColor: "bg-state-warning-bg",
    borderColor: "border-state-warning-border",
    icon: <AlertCircle className="text-state-warning" />,
    description: "",
  },
  mastered: {
    label: "başarılı" as CourseStatus, // Tip uyumu için eklendi
    color: "text-state-success",
    bgColor: "bg-state-success-bg",
    borderColor: "border-state-success-border",
    icon: <CheckCircle className="text-state-success" />,
    description: "",
  },
};

/**
 * Durum değerine göre stil bilgilerini döndüren yardımcı fonksiyon
 */
export function getStatusStyle(status: LearningTargetStatus): CourseStatusInfo { // StatusInfo -> CourseStatusInfo olarak güncellendi
  return statusConfig[status];
}
