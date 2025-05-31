"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../../context/ThemeProvider";
import {
  FiCheck,
  FiLoader,
  FiInfo,
  FiBook,
  FiAlertTriangle,
  FiPlus,
} from "react-icons/fi";
import { LearningTargetStatusLiteral } from "@/types/learningTarget.type";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

// TopicData arayüzünü de import et
import type { DetectedSubTopic as TopicData } from "@/types/learningTarget.type";

interface StatusStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  icon: React.ElementType;
}

export const getStatusStyle = (status: LearningTargetStatusLiteral | undefined): StatusStyle => {
  switch (status) {
    case "pending":
      return {
        color: "text-tertiary",
        bgColor: "bg-secondary",
        borderColor: "border-primary",
        label: "Başlamadı",
        icon: FiBook,
      };
    case "medium":
      return {
        color: "text-state-info",
        bgColor: "bg-state-info-bg",
        borderColor: "border-state-info-border",
        label: "Devam Ediyor",
        icon: FiLoader,
      };
    case "failed":
      return {
        color: "text-state-warning",
        bgColor: "bg-state-warning-bg",
        borderColor: "border-state-warning-border",
        label: "Gözden Geçirilmeli",
        icon: FiAlertTriangle,
      };
    case "mastered":
      return {
        color: "text-state-success",
        bgColor: "bg-state-success-bg",
        borderColor: "border-state-success-border",
        label: "Tamamlandı",
        icon: FiCheck,
      };
    default:
      return {
        color: "text-tertiary",
        bgColor: "bg-secondary",
        borderColor: "border-primary",
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
  initialSelectedTopicIds?: string[];
  onTopicSelectionChange: (selectedTopicIds: string[]) => void;
  onInitialLoad: boolean;
  setOnInitialLoad: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TopicSelectionScreen({
  detectedTopics = [],
  existingTopics = [],
  availableCourses = [],
  selectedCourseId,
  quizType,
  personalizedQuizType = "comprehensive",
  isLoading = false,
  error, // error prop'u şu an kullanılmıyor, ancak gelecekte kullanılabilir.
  onTopicsSelected,
  onCourseChange,
  onCancel, // onCancel prop'u şu an kullanılmıyor.
  initialSelectedTopicIds,
  onTopicSelectionChange = () => {},
  onInitialLoad = true,
  setOnInitialLoad = () => {},
}: TopicSelectionScreenProps) {
  const [filteredTopics, setFilteredTopics] = useState<TopicData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [currentCourseId, setCurrentCourseId] = useState(
    selectedCourseId || ""
  );

  const handleCourseChange = useCallback(
    (courseId: string) => {
      setCurrentCourseId(courseId);
      onCourseChange?.(courseId);
    },
    [onCourseChange],
  );

  const handleFilterChange = useCallback(
    (filter: "all" | "new" | "existing") => {
      setSelectedFilter(filter);
    },
    [],
  );

  useEffect(() => {
    if (isLoading) {
      // Yükleme sırasında konuları temizleyebilir veya bir yükleme göstergesi gösterebilirsiniz.
      // setFilteredTopics([]); // İsteğe bağlı: yüklenirken listeyi temizle
      return;
    }

    const existingTopicIds = new Set(existingTopics.map((t) => t.id));
    let baseTopicsRaw: TopicData[] = [];

    if (quizType === "quick") {
      baseTopicsRaw = [...detectedTopics];
    } else if (personalizedQuizType === "newTopicFocused") {
      baseTopicsRaw = [...detectedTopics];
    } else if (personalizedQuizType === "learningObjectiveFocused") {
      const uniqueDetected = detectedTopics.filter(
        (t) => !existingTopicIds.has(t.id),
      );
      baseTopicsRaw = [...existingTopics, ...uniqueDetected];
    } else if (personalizedQuizType === "weakTopicFocused") {
      baseTopicsRaw = existingTopics.filter(
        (topic) => topic.status === "failed" || topic.status === "medium",
      );
    } else if (personalizedQuizType === "comprehensive") {
      const uniqueDetected = detectedTopics.filter(
        (t) => !existingTopicIds.has(t.id),
      );
      baseTopicsRaw = [...uniqueDetected, ...existingTopics];
    }

    let finalTopicsWithSelection: TopicData[];

    if (onInitialLoad) {
      let initialSelectionIds: string[];
      if (initialSelectedTopicIds && initialSelectedTopicIds.length > 0) {
        initialSelectionIds = initialSelectedTopicIds;
      } else {
        if (personalizedQuizType !== 'weakTopicFocused') {
            initialSelectionIds = baseTopicsRaw.map(t => t.id);
        } else {
            initialSelectionIds = []; // Zayıf konu odaklıysa başlangıçta hiçbirini seçme (veya özel bir mantık)
        }
      }
      
      finalTopicsWithSelection = baseTopicsRaw.map(topic => ({
        ...topic,
        isSelected: initialSelectionIds.includes(topic.id),
      }));
      
      // Sonsuz döngüyü önlemek için useEffect'in dışında bir kez çağıralım
      setTimeout(() => {
        onTopicSelectionChange(initialSelectionIds);
      }, 0);
      setOnInitialLoad(false);
    } else {
      // Başlangıç yüklemesi değilse (örn: detectedTopics değişti),
      // orijinal kod tüm konuları tekrar seçili yapıyordu. Bu davranışı koruyoruz.
      // İstenirse, mevcut seçimler korunabilir.
      finalTopicsWithSelection = baseTopicsRaw.map(topic => ({
        ...topic,
        isSelected: true, // Orijinal davranış: bağımlılıklar değişince tümünü seç
      }));
      
      // Sonsuz döngüyü önlemek için useEffect'in dışında bir kez çağıralım
      const selectedIds = finalTopicsWithSelection.filter(t => t.isSelected).map(t => t.id);
      setTimeout(() => {
        onTopicSelectionChange(selectedIds);
      }, 0);
    }
    
    setFilteredTopics(finalTopicsWithSelection);

  }, [
    detectedTopics,
    existingTopics,
    quizType,
    personalizedQuizType,
    isLoading,
    initialSelectedTopicIds,
    onInitialLoad,
    setOnInitialLoad,
    onTopicSelectionChange,
  ]);


  const handleToggleAll = useCallback((selectAll: boolean) => {
    const updatedTopics = filteredTopics.map(topic => ({
      ...topic,
      isSelected: selectAll
    }));
    setFilteredTopics(updatedTopics);
    const selectedIds = selectAll ? updatedTopics.map(t => t.id) : [];
    onTopicSelectionChange(selectedIds);
  }, [filteredTopics, onTopicSelectionChange]);

  const handleTopicToggle = useCallback((id: string) => {
    const updatedTopics = filteredTopics.map(topic => {
      if (topic.id === id) {
        return { ...topic, isSelected: !topic.isSelected };
      }
      return topic;
    });
    setFilteredTopics(updatedTopics);
    const selectedIds = updatedTopics.filter(t => t.isSelected).map(t => t.id);
    onTopicSelectionChange(selectedIds);
  }, [filteredTopics, onTopicSelectionChange]);

  const topicCounts = useMemo(
    () => ({
      all: filteredTopics.length,
      new: filteredTopics.filter((t) => t.isNew).length, // isNew property TopicData'da olmalı
      existing: filteredTopics.filter((t) => !t.isNew).length, // isNew property TopicData'da olmalı
      selected: filteredTopics.filter((t) => t.isSelected).length,
      weak: filteredTopics.filter((t) => t.status === "failed").length,
      medium: filteredTopics.filter((t) => t.status === "medium").length,
      good: filteredTopics.filter((t) => t.status === "mastered").length,
    }),
    [filteredTopics],
  );

  const displayTopics = useMemo(
    () =>
      selectedFilter === "all"
        ? filteredTopics
        : selectedFilter === "new"
          ? filteredTopics.filter((t) => t.isNew) // isNew property TopicData'da olmalı
          : filteredTopics.filter((t) => !t.isNew), // isNew property TopicData'da olmalı
    [filteredTopics, selectedFilter],
  );

  const groupedTopics = useMemo(() => {
    const groups: Record<string, TopicData[]> = {};
    displayTopics.forEach((topic) => {
      const parentTopic = topic.parentTopic || 'Diğer Konular';
      if (!groups[parentTopic]) {
        groups[parentTopic] = [];
      }
      groups[parentTopic].push(topic);
    });
    return groups;
  }, [displayTopics]);

  const handleContinue = () => {
    if (!currentCourseId && quizType === 'personalized') {
      alert("Lütfen bir ders seçin");
      return;
    }

    const topicsToSubmit = filteredTopics
      .filter((t) => t.isSelected)
      .map((t) => t.id);

    if (topicsToSubmit.length === 0 && personalizedQuizType !== 'weakTopicFocused') {
      alert("Lütfen en az bir konu seçin");
      return;
    }
    
    onTopicsSelected(topicsToSubmit, quizType === 'quick' ? "" : currentCourseId);
  };

  const getStatusInfo = useCallback((status?: LearningTargetStatusLiteral | string) => {
    if (!status) {
      return {
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        borderColor: "border-indigo-200 dark:border-indigo-700",
        label: "Yeni", // Varsayılan olarak 'Yeni' etiketi, eğer konu durumu yoksa
        icon: FiPlus,
      };
    }
    const validStatusValues: LearningTargetStatusLiteral[] = ["pending", "medium", "failed", "mastered"];
    const statusStr = typeof status === 'string' ? status : String(status);
    const statusLiteral = validStatusValues.includes(statusStr as LearningTargetStatusLiteral) 
      ? statusStr as LearningTargetStatusLiteral 
      : "pending"; // Bilinmeyen bir durum gelirse 'pending' varsay
    return getStatusStyle(statusLiteral);
  }, []);

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

  if (filteredTopics.length === 0) { // isLoading false ise ve konu yoksa bu blok çalışır
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
              onClick={() => router.push('/')} // Belge yükleme sayfasına yönlendirme
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
    <div className={`relative p-6 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${isDarkMode ? 'bg-gray-900/70 border-gray-700/40 shadow-gray-950/30' : 'bg-white/80 border-gray-200/50 shadow-gray-400/20'}`}>
      <div className={`absolute left-0 top-0 w-full h-1.5 bg-gradient-to-r ${isDarkMode ? 'from-sky-600 via-cyan-600 to-teal-600' : 'from-sky-500 via-cyan-500 to-teal-500'} opacity-90`}></div>
      <div className="mb-6 pt-2">
        <h2 className={`text-2xl font-bold mb-2 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 shadow-md ${isDarkMode ? 'bg-gradient-to-br from-sky-700/50 to-cyan-700/60' : 'bg-gradient-to-br from-sky-100 to-cyan-100'}`}>
            <FiBook className={`${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
          </span>
          Konu Seçimi
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {quizType === "quick"
            ? "Yüklediğiniz belgedeki tespit edilen konular aşağıdadır. Sınava dahil etmek istediklerinizi seçin."
            : personalizedQuizType === "weakTopicFocused"
            ? "Geliştirmeniz gereken alanları içeren özel bir sınav oluşturulacak."
            : personalizedQuizType === "learningObjectiveFocused"
            ? "Öğrenme hedeflerinize göre özel bir sınav oluşturulacak."
            : personalizedQuizType === "newTopicFocused"
            ? "Henüz çalışmadığınız yeni konulara odaklanan bir sınav oluşturulacak."
            : "Çalışma durumunuza uygun kapsamlı bir sınav oluşturulacak."}
        </p>
        <div className={`mt-4 p-3.5 rounded-xl border flex items-center backdrop-blur-md shadow-md ${isDarkMode ? 'bg-sky-900/30 border-sky-700/50 text-sky-300 shadow-sky-950/20' : 'bg-sky-50/80 border-sky-200/70 text-sky-700 shadow-sky-300/30'}`}>
          <FiInfo className={`min-w-5 w-5 h-5 mr-2.5 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
          <span className="text-sm">En fazla <strong>10 konu</strong> seçebilirsiniz. Bu sınır, AI'nin daha odaklı ve kaliteli sorular oluşturabilmesi için gereklidir.</span>
        </div>
      </div>

      {availableCourses && availableCourses.length > 0 && (
        <div className="mb-6 pt-1">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Ders Seçimi
          </label>
          <select
            value={currentCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 backdrop-blur-md focus:ring-2 ${isDarkMode ? 'bg-gray-800/60 border-gray-600/80 focus:ring-sky-500 focus:border-sky-500 text-gray-100 placeholder-gray-500' : 'bg-white/70 border-gray-300/80 focus:ring-sky-500 focus:border-sky-500 text-gray-900 placeholder-gray-400'} shadow-sm focus:shadow-md`}
          >
            <option value="">Ders seçin</option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${selectedFilter === "all"
                  ? (isDarkMode ? 'bg-sky-600 text-white hover:bg-sky-500' : 'bg-sky-500 text-white hover:bg-sky-600')
                  : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              Tümü ({topicCounts.all})
            </button>
            {topicCounts.new > 0 && (
              <button
                onClick={() => handleFilterChange("new")}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${selectedFilter === "new"
                    ? (isDarkMode ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-teal-500 text-white hover:bg-teal-600')
                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                }`}
              >
                Yeni ({topicCounts.new})
              </button>
            )}
            {topicCounts.existing > 0 && (
              <button
                onClick={() => handleFilterChange("existing")}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${selectedFilter === "existing"
                    ? (isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-500 text-white hover:bg-indigo-600')
                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                }`}
              >
                Mevcut ({topicCounts.existing})
              </button>
            )}
          </div>
          <button
            onClick={() => handleToggleAll(true)}
            className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Tümünü Seç
          </button>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        {Object.entries(groupedTopics).map(([parentTopic, topics]) => (
          <div key={parentTopic} className={`rounded-xl p-4 transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-gray-800/50 border border-gray-700/60 shadow-lg shadow-gray-950/20 hover:shadow-gray-900/30' : 'bg-white/70 border border-gray-200/70 shadow-lg shadow-gray-300/30 hover:shadow-gray-300/50'}`}>
            <h3 className={`text-lg font-semibold mb-3 border-b pb-2.5 flex items-center ${isDarkMode ? 'text-sky-300 border-gray-700' : 'text-sky-700 border-gray-200'}`}>
              <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2.5 ${isDarkMode ? 'bg-sky-500' : 'bg-sky-600'}`}></span>
              {parentTopic}
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({topics.length})</span>
            </h3>
            <div className="space-y-2">
              {topics.map((topic, index) => (
                <TopicCard
                  key={`${topic.id}-${index}`} // Index kullanımı ideal değil, ID'ler zaten eşsiz olmalı.
                  topic={topic}
                  onToggle={handleTopicToggle}
                  statusInfo={getStatusInfo(topic.status || (topic.isNew ? undefined : "pending"))} // isNew varsa ve status yoksa 'Yeni' göster
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={handleContinue}
          className={`px-10 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white focus:ring-emerald-500 focus:ring-offset-gray-900 disabled:from-gray-600 disabled:to-gray-700' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white focus:ring-emerald-500 focus:ring-offset-white disabled:from-gray-400 disabled:to-gray-500'}`}
          disabled={topicCounts.selected === 0 && personalizedQuizType !== 'weakTopicFocused'} // Zayıf konu odaklı değilse ve seçili konu yoksa disable et
        >
          <span>{topicCounts.selected > 0 ? `${topicCounts.selected} Konu ile Devam Et` : (personalizedQuizType === 'weakTopicFocused' ? "Devam Et (Zayıf Konular)" : "Konu Seçin")}</span>
        </button>
      </div>
    </div>
  );
}

interface TopicCardProps {
  topic: TopicData & { isSelected?: boolean }; // isSelected TopicData'da olabilir veya olmayabilir.
  onToggle: (id: string) => void;
  statusInfo: StatusStyle;
}

function TopicCard({ topic, onToggle, statusInfo }: TopicCardProps) {
  const { isDarkMode } = useTheme();
  const displayTopicName = () => {
    let name = '';
    if (typeof topic.subTopicName === 'string') {
      name = topic.subTopicName;
      if (name.startsWith('```') || name.startsWith('"```') || name.includes('subTopicName') || name.includes('normalizedSubTopicName')) {
        name = 'Konu ' + topic.id.substring(0, 8);
      }
    }
    else if (topic.name) { // 'name' alanı TopicData'da olmayabilir, kontrol ekledim.
      name = topic.name;
    }
    else {
      name = 'Konu ' + topic.id.substring(0, 8);
    }
    name = name.replace(/^\W+/, '').replace(/\s+/g, ' ').trim();
    if (!name || name.length < 3) {
      return 'Konu ' + topic.id.substring(0, 8);
    }
    return name;
  };

  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 ease-in-out border hover:shadow-lg
        ${topic.isSelected
          ? `bg-gradient-to-r ${statusInfo.bgColor || (isDarkMode ? 'from-sky-600 to-cyan-700' : 'from-sky-500 to-cyan-600')} ${isDarkMode ? 'opacity-90 shadow-md shadow-sky-950/30' : 'opacity-95 shadow-md shadow-sky-400/40'} border-transparent`
          : `${isDarkMode ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/60 shadow-sm shadow-gray-950/10' : 'bg-white/50 border-gray-200/60 hover:bg-gray-50/70 shadow-sm shadow-gray-300/20'}`
        }`}
      onClick={() => onToggle(topic.id)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0"> {/* Added flex-1 min-w-0 for better text wrapping */}
        <div
          className={`rounded-md min-w-6 w-6 h-6 flex items-center justify-center transition-all duration-200 ${
            topic.isSelected
              ? (isDarkMode ? 'bg-white/20 text-white border border-white/30' : 'bg-white/30 text-white border border-white/40')
              : (isDarkMode ? 'bg-gray-700 border-gray-500' : 'bg-gray-100 border-gray-300')
          }`}
        >
          {topic.isSelected && <FiCheck className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white' : 'text-white'}`} />}
        </div>

        <div className="flex-1 min-w-0"> {/* Added flex-1 min-w-0 */}
          <h3 className="font-medium text-sm text-primary truncate"> {/* Added truncate for very long names */}
            {displayTopicName()}
          </h3>
          {topic.parentTopic && (
            <p className="text-xs text-tertiary mt-0.5 truncate"> {/* Added truncate */}
              {topic.parentTopic}
            </p>
          )}
        </div>
      </div> {/* Moved closing div for left part */}

      {/* Right part (status and new badge) */}
      <div className="flex items-center gap-2 ml-2 flex-shrink-0"> {/* Added ml-2 and flex-shrink-0 */}
        <div
          className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap
          ${topic.isSelected
            ? (isDarkMode ? 'bg-white/20 text-white border border-white/30' : 'bg-white/30 text-white border border-white/40')
            : `${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`
          }
        `}>
          <StatusIcon className="w-3 h-3 mr-1.5" />
          {statusInfo.label}
        </div>
        {topic.isNew && ( // isNew property TopicData'da olmalı
          <div className="text-xs rounded-lg px-2.5 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 whitespace-nowrap font-medium">
            Yeni
          </div>
        )}
      </div>
    </div>
  );
}