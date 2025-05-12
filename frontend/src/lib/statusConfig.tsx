import React from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiTarget,
} from "react-icons/fi";
import { LearningTargetStatus } from "../types/learningTarget";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

// Durum tipi doğrudan tanımla
export type CourseStatus = "başarılı" | "orta" | "başarısız" | "beklemede";

// Durum bilgileri için model tanımı
export interface StatusInfo {
  label: CourseStatus;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}

// Durum bilgileri için sabit tanımlamalar
export const STATUS_INFO: Record<CourseStatus, StatusInfo> = {
  başarılı: {
    label: "başarılı",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: <FiCheckCircle className="text-emerald-500" />,
    description: "Hedeflere ulaşıldı",
  },
  orta: {
    label: "orta",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: <FiClock className="text-amber-500" />,
    description: "Gelişim devam ediyor",
  },
  başarısız: {
    label: "başarısız",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    icon: <FiAlertCircle className="text-rose-500" />,
    description: "İyileştirme gerekli",
  },
  beklemede: {
    label: "beklemede",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    icon: <FiTarget className="text-sky-500" />,
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
export const statusConfig: Record<LearningTargetStatus, StatusInfo> = {
  pending: {
    label: "beklemede",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    icon: <Clock className="text-gray-500" />,
    description: "",
  },
  failed: {
    label: "başarısız",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: <XCircle className="text-red-600" />,
    description: "",
  },
  medium: {
    label: "orta",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: <AlertCircle className="text-yellow-600" />,
    description: "",
  },
  mastered: {
    label: "başarılı",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: <CheckCircle className="text-green-600" />,
    description: "",
  },
};

/**
 * Durum değerine göre stil bilgilerini döndüren yardımcı fonksiyon
 */
export function getStatusStyle(status: LearningTargetStatus): StatusInfo {
  return statusConfig[status];
}
