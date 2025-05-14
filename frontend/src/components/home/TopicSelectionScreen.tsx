"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiInfo,
  FiBook,
  FiAlertTriangle,
  FiPlus,
} from "react-icons/fi";
import { LearningTargetStatus } from "@/types/learningTarget";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

// TopicData arayüzünü de import et
import type { DetectedSubTopic as TopicData } from "@/types/learningTarget";

interface StatusStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  icon: React.ElementType;
}

export const getStatusStyle = (status: LearningTargetStatus): StatusStyle => {
  switch (status) {
    case "pending":
      return {
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
        label: "Başlamadı",
        icon: FiBook,
      };
    case "medium":
      return {
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
        label: "Devam Ediyor",
        icon: FiLoader,
      };
    case "failed":
      return {
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
        label: "Gözden Geçirilmeli",
        icon: FiAlertTriangle,
      };
    case "mastered":
      return {
        color: "text-green-500",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        label: "Tamamlandı",
        icon: FiCheck,
      };
    default:
      return {
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
        label: "Bilinmiyor",
        icon: FiInfo,
      };
  }
};

interface CourseData {
  id: string;
  name: string;
}

interface TopicSelectionScreenProps {
  detectedTopics: TopicData[];
  existingTopics?: TopicData[]; // Mevcut/kayıtlı konular
  availableCourses?: CourseData[]; // Mevcut kurslar
  selectedCourseId?: string; // Seçili kurs ID
  quizType: "quick" | "personalized";
  personalizedQuizType?:
    | "weakTopicFocused"
    | "learningObjectiveFocused"
    | "newTopicFocused"
    | "comprehensive";
  isLoading?: boolean;
  error?: string;
  onTopicsSelected: (selectedTopicIds: string[], courseId: string) => void;
  onCourseChange?: (courseId: string) => void;
  onCancel?: () => void;
}

export default function TopicSelectionScreen({
  detectedTopics = [],
  existingTopics = [],
  availableCourses = [],
  selectedCourseId,
  quizType,
  personalizedQuizType = "comprehensive",
  isLoading = false,
  error,
  onTopicsSelected,
  onCourseChange,
  onCancel,
}: TopicSelectionScreenProps) {
  // Mevcut konuları tut
  const [filteredTopics, setFilteredTopics] = useState<TopicData[]>(detectedTopics);
  const [selectedFilter, setSelectedFilter] = useState("all"); // Filtre durumunu ekleyelim
  const router = useRouter();

  // Seçili kurs kontrolü
  const [currentCourseId, setCurrentCourseId] = useState(
    selectedCourseId || "",
  );

  // Kurs değişikliğini bildir
  const handleCourseChange = useCallback(
    (courseId: string) => {
      setCurrentCourseId(courseId);
      onCourseChange?.(courseId);
    },
    [onCourseChange],
  );
  
  // Filtre değişikliğini yönet
  const handleFilterChange = useCallback(
    (filter: "all" | "new" | "existing") => {
      setSelectedFilter(filter);
    },
    [],
  );

  // Sınav türüne göre görüntülenecek konuları filtrele
  useEffect(() => {
    if (isLoading) return;

    let topics: TopicData[] = [];

    if (quizType === "quick") {
      topics = [...detectedTopics];
    } else if (personalizedQuizType === "newTopicFocused") {
      topics = [...detectedTopics];
    } else if (personalizedQuizType === "learningObjectiveFocused") {
      // Öğrenme hedefi odaklı: Tüm mevcut konular + yeni konular
      topics = [...existingTopics, ...detectedTopics];
    } else if (personalizedQuizType === "weakTopicFocused") {
      topics = existingTopics.filter(
        (topic) => topic.status === "failed" || topic.status === "medium",
      );
    } else if (personalizedQuizType === "comprehensive") {
      const existingIds = new Set(existingTopics.map((t) => t.id));
      const uniqueDetectedTopics = detectedTopics.filter(
        (t) => !existingIds.has(t.id),
      );
      topics = [...uniqueDetectedTopics, ...existingTopics];
    }

    if (personalizedQuizType === "weakTopicFocused") {
      topics = topics.map((topic) => ({ ...topic, isSelected: true }));
    } else if (personalizedQuizType === "comprehensive" || personalizedQuizType === "learningObjectiveFocused") {
      topics = topics.map((topic) => ({
        ...topic,
        isSelected: topic.status === "failed" || topic.status === "medium",
      }));
    }

    setFilteredTopics(topics);
  }, [
    detectedTopics,
    existingTopics,
    quizType,
    personalizedQuizType,
    isLoading,
  ]);

  // Seçilen konuları takip et
  const handleToggleTopic = useCallback((topicId: string) => {
    setFilteredTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === topicId
          ? { ...topic, isSelected: !topic.isSelected }
          : topic,
      ),
    );
  }, []);

  // Konuların tümünü seç/kaldır
  const handleToggleAll = useCallback(
    (selected: boolean) => {
      // Şu anda görüntülenen filtreye göre uygula
      setFilteredTopics((prevTopics) =>
        prevTopics.map((topic) => {
          if (
            selectedFilter === "all" ||
            (selectedFilter === "new" && topic.isNew) ||
            (selectedFilter === "existing" && !topic.isNew)
          ) {
            return { ...topic, isSelected: selected };
          }
          return topic;
        }),
      );
    },
    [selectedFilter],
  );

  // Seçilen konuları gönder
  const handleSubmit = useCallback(() => {
    if (!currentCourseId) {
      alert("Lütfen bir ders seçin");
      return;
    }

    const selectedTopicIds = filteredTopics
      .filter((t) => t.isSelected)
      .map((t) => t.id);
    onTopicsSelected(selectedTopicIds, currentCourseId);
  }, [filteredTopics, currentCourseId, onTopicsSelected]);

  // Durum bilgisi için stil
  const getStatusInfo = useCallback((status?: LearningTargetStatus) => {
    if (!status) {
      return {
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        borderColor: "border-indigo-200 dark:border-indigo-700",
        label: "Yeni",
        icon: FiPlus,
      };
    }

    return getStatusStyle(status);
  }, []);

  // Çeşitli konu sayıları
  const topicCounts = useMemo(
    () => ({
      all: filteredTopics.length,
      new: filteredTopics.filter((t) => t.isNew).length,
      existing: filteredTopics.filter((t) => !t.isNew).length,
      selected: filteredTopics.filter((t) => t.isSelected).length,
      weak: filteredTopics.filter((t) => t.status === "failed").length,
      medium: filteredTopics.filter((t) => t.status === "medium").length,
      good: filteredTopics.filter((t) => t.status === "mastered").length,
    }),
    [filteredTopics],
  );

  // Görüntülenecek konuları filtrele
  const displayTopics = useMemo(
    () =>
      selectedFilter === "all"
        ? filteredTopics
        : selectedFilter === "new"
          ? filteredTopics.filter((t) => t.isNew)
          : filteredTopics.filter((t) => !t.isNew),
    [filteredTopics, selectedFilter],
  );

  const allSelected = useMemo(
    () => displayTopics.length > 0 && displayTopics.every((t) => t.isSelected),
    [displayTopics],
  );

  // Sınav türü başlığı
  const getQuizTypeTitle = useCallback(() => {
    if (quizType === "quick") {
      return "Hızlı Sınav - Konu Seçimi";
    }

    switch (personalizedQuizType) {
      case "weakTopicFocused":
        return "Zayıf/Orta Konulara Odaklı Sınav";
      case "learningObjectiveFocused":
        return "Öğrenme Hedefi Odaklı Sınav";
      case "newTopicFocused":
        return "Yeni Konulara Odaklı Sınav";
      case "comprehensive":
        return "Kapsamlı Sınav";
      default:
        return "Kişiselleştirilmiş Sınav";
    }
  }, [quizType, personalizedQuizType]);

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <FiLoader className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
        <p className="text-gray-700 dark:text-gray-300">
          Konular hazırlanıyor...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-6 flex flex-col items-center border rounded-lg bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
        <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mb-4" />
        <p className="text-red-700 dark:text-red-300 text-center mb-2">
          Konular hazırlanırken bir hata oluştu
        </p>
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Geri Dön
          </button>
        )}
      </div>
    );
  }

  if (filteredTopics.length === 0) {
    return (
      <div className="py-8 px-6 flex flex-col items-center justify-center border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <FiInfo className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">
          {personalizedQuizType === "weakTopicFocused"
            ? "Henüz zayıf veya orta düzeyde konunuz bulunmuyor."
            : "Belgede konu tespit edilemedi"}
        </h3>
        <div className="text-gray-700 dark:text-gray-300 mb-4 text-center max-w-lg">
          {personalizedQuizType === "weakTopicFocused" ? (
            <p>
              Sınavları çözmeye devam ettikçe, performansınıza göre zayıf ve güçlü olduğunuz konuları belirlemeye başlayacağız.
            </p>
          ) : (
            <div>
              <p>
                AI tarafından yüklenen belgede öğrenilebilir konular tespit edilemedi. Bu şu nedenlerden kaynaklanabilir:
              </p>
              <ul className="list-disc mt-2 ml-6 text-left">
                <li>Belge içeriği çok kısa veya yeterli kavramsal içerik bulunmuyor olabilir</li>
                <li>Belge formatı veya yapısı AI tarafından doğru analiz edilememiş olabilir</li>
                <li>Metin dili veya uzmanlık alanı AI tarafından işlenememiş olabilir</li>
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4 w-full max-w-lg">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400 mb-1">Manuel konu girişi yapın</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Çalışmak istediğiniz konuları kendiniz ekleyerek devam edebilirsiniz.
            </p>
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => router.push('/learning-goals/dashboard')}
            >
              <FiPlus className="mr-2" />
              Yeni Konu Ekle
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400 mb-1">Farklı bir belge yükleyin</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Daha fazla kavramsal içerik içeren bir ders materyali veya dokümandan tekrar yükleme yapabilirsiniz.
            </p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Belge Yükleme Ekranına Dön
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400 mb-1">Farklı bir sınav türü seçin</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Kişiselleştirilmiş sınav yerine &quot;Hızlı Sınav&quot; seçeneğini veya mevcut konularınız varsa &quot;Zayıf Konular&quot; odaklı modu deneyebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Açıklama */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {getQuizTypeTitle()}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {personalizedQuizType === "weakTopicFocused"
            ? "Yapay zeka, zayıf ve orta düzeydeki konularınızı analiz ederek özel bir sınav oluşturur."
            : personalizedQuizType === "learningObjectiveFocused"
              ? "Yapay zeka, belirlediğiniz öğrenme hedeflerine ulaşmanıza yardımcı olacak kişiselleştirilmiş bir sınav hazırlar."
              : personalizedQuizType === "newTopicFocused"
                ? "Yapay zeka, yüklediğiniz belgedeki yeni konuları analiz ederek bilgi seviyenizi ölçecek bir sınav oluşturur."
                : personalizedQuizType === "comprehensive"
                  ? "Yapay zeka, tüm konuları kapsayan kapsamlı bir sınav oluşturur. Zayıf ve orta düzeydeki konularınıza öncelik verir."
                  : "Yapay zeka, seçtiğiniz konulara uygun, hızlı bir şekilde analiz edilmiş sorular içeren bir sınav oluşturur."}
        </p>
      </div>

      {/* Kurs Seçimi */}
      {availableCourses.length > 0 && (
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="course"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Ders Seçin
          </label>
          <select
            id="course"
            value={currentCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm"
          >
            <option value="">Ders seçin...</option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedFilter === "all"
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Tümü ({topicCounts.all})
        </button>
        {topicCounts.new > 0 && (
          <button
            onClick={() => handleFilterChange("new")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedFilter === "new"
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Yeni ({topicCounts.new})
          </button>
        )}
        {topicCounts.existing > 0 && (
          <button
            onClick={() => handleFilterChange("existing")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedFilter === "existing"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Mevcut ({topicCounts.existing})
          </button>
        )}
      </div>

      {/* Konu Listesi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {allSelected ? "Tümünü Kaldır" : "Tümünü Seç"}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {topicCounts.selected} konu seçildi
          </span>
        </div>

        <div className="grid gap-3">
          {displayTopics.map((topic) => {
            const statusInfo = getStatusInfo(topic.status as LearningTargetStatus);
            const Icon = statusInfo.icon;

            return (
              <div
                key={topic.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  topic.isSelected
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                    : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={topic.isSelected}
                    onChange={() => handleToggleTopic(topic.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {topic.name || topic.subTopicName}
                    </div>
                    {topic.parentTopic && !topic.isMainTopic && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {topic.parentTopic}
                      </div>
                    )}
                    {topic.status && (
                      <div className={`text-sm ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`flex items-center px-2 py-1 rounded ${statusInfo.bgColor} ${statusInfo.borderColor}`}
                >
                  <Icon className={`w-4 h-4 ${statusInfo.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            İptal
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={topicCounts.selected === 0 || !currentCourseId}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            topicCounts.selected === 0 || !currentCourseId
              ? "bg-indigo-400 cursor-not-allowed dark:bg-indigo-600/50"
              : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          }`}
        >
          {topicCounts.selected} Konu ile Devam Et
        </button>
      </div>
    </div>
  );
}
