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
  error,
  onTopicsSelected,
  onCourseChange,
  onCancel,
  initialSelectedTopicIds,
  onTopicSelectionChange = () => {},
  onInitialLoad = true,
  setOnInitialLoad = () => {},
}: TopicSelectionScreenProps) {
  // Mevcut konuları tut
  const [filteredTopics, setFilteredTopics] = useState<TopicData[]>(detectedTopics);
  const [selectedFilter, setSelectedFilter] = useState("all"); // Filtre durumunu ekleyelim
  const router = useRouter();

  // Seçili kurs kontrolü
  const [currentCourseId, setCurrentCourseId] = useState(
    selectedCourseId || ""
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

  // Tüm konuları seç/kaldır
  const handleToggleAll = useCallback((selectAll: boolean) => {
    console.log('[TopicSelectionScreen] handleToggleAll çağrıldı, selectAll:', selectAll);
    const updatedTopics = filteredTopics.map(topic => ({
      ...topic,
      isSelected: selectAll
    }));
    
    setFilteredTopics(updatedTopics);
    
    // Seçilen konu ID'lerini props olarak ilet
    const selectedIds = selectAll ? updatedTopics.map(t => t.id) : [];
    console.log('[TopicSelectionScreen] Tüm konular için seçim güncellendi:', selectedIds);
    onTopicSelectionChange(selectedIds);
  }, [filteredTopics, onTopicSelectionChange]);

  // İlk render sırasında konuların seçim durumunu kontrol et
  useEffect(() => {
    if (filteredTopics.length > 0 && initialSelectedTopicIds && initialSelectedTopicIds.length > 0 && onInitialLoad) {
      console.log('[TopicSelectionScreen] Başlangıç seçili konuları ayarlanıyor:', initialSelectedTopicIds);
      
      // Başlangıçta seçilmiş konular varsa bunları işaretle
      const updatedTopics = filteredTopics.map(topic => ({
        ...topic,
        isSelected: initialSelectedTopicIds.includes(topic.id)
      }));
      
      setFilteredTopics(updatedTopics);
      setOnInitialLoad(false);
    }
  }, [filteredTopics, initialSelectedTopicIds, onInitialLoad, setOnInitialLoad]);

  // Seçilen konuları takip et
  const handleTopicToggle = useCallback((id: string) => {
    console.log('[TopicSelectionScreen] handleTopicToggle çağrıldı:', id);
    const updatedTopics = filteredTopics.map(topic => {
      if (topic.id === id) {
        return { ...topic, isSelected: !topic.isSelected };
      }
      return topic;
    });
    
    setFilteredTopics(updatedTopics);
    
    // Seçilen konu ID'lerini props olarak ilet
    const selectedIds = updatedTopics.filter(t => t.isSelected).map(t => t.id);
    console.log('[TopicSelectionScreen] Seçilen konular güncellendi:', selectedIds);
    onTopicSelectionChange(selectedIds);
  }, [filteredTopics, onTopicSelectionChange]);

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

    // Tüm konuları otomatik olarak seçili hale getir (her koşulda)
    topics = topics.map((topic) => ({
      ...topic,
      isSelected: true
    }));

    setFilteredTopics(topics);
    console.log('[TSS useEffect] Detected topics prop:', JSON.stringify(detectedTopics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
    console.log('[TSS useEffect] Existing topics prop:', JSON.stringify(existingTopics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
    console.log('[TSS useEffect] quizType:', quizType, 'personalizedQuizType:', personalizedQuizType);
    console.log('[TSS useEffect] Final topics for setFilteredTopics:', JSON.stringify(topics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
    
    // Frontend'de tespit edilen konuları console'a yazdır
    console.log('\n=== FRONTEND - TESPİT EDİLEN KONULAR ===');
    console.log('Algılanan Konular:', detectedTopics.length);
    detectedTopics.forEach((topic, index) => {
      console.log(`\n[${index + 1}] ${topic.subTopicName || topic.name || 'İsimsiz Konu'}`);
      if (topic.parentTopic) {
        console.log(`  Ana Konu: ${topic.parentTopic}`);
      }
      console.log(`  ID: ${topic.id.substring(0, 8)}...`);
    });
    console.log('\n============================\n');
  }, [
    detectedTopics,
    existingTopics,
    quizType,
    personalizedQuizType,
    isLoading,
  ]);

  // useEffect ile tespit edilen konuların otomatik işaretlenmesi
  useEffect(() => {
    if (onInitialLoad && initialSelectedTopicIds && initialSelectedTopicIds.length > 0) {
      console.log('[TopicSelectionScreen] initialSelectedTopicIds var, bu konuları seçeceğiz:', initialSelectedTopicIds);
      // Burada kullanılacak güncel filteredTopics, props'tan gelen veya initialSelectedTopicIds'den filtrelenen olabilir
      const newFilteredTopics = filteredTopics.map(topic => ({
        ...topic,
        isSelected: initialSelectedTopicIds.includes(topic.id)
      }));
      
      setFilteredTopics(newFilteredTopics);
      
      // Seçili konu yoksa ve konular varsa ilk konuyu otomatik seç
      const hasAnySelected = newFilteredTopics.some(t => t.isSelected);
      if (!hasAnySelected && newFilteredTopics.length > 0) {
        console.log('[TopicSelectionScreen] Hiç seçili konu yok, ilk konu otomatik seçilecek:', newFilteredTopics[0].id);
        const updatedTopics = [...newFilteredTopics];
        updatedTopics[0].isSelected = true;
        setFilteredTopics(updatedTopics);
        // Seçim değişikliğini üst bileşene bildir
        const selectedIds = [updatedTopics[0].id];
        onTopicSelectionChange(selectedIds);
      } else if (hasAnySelected) {
        // Seçilen konuları üst bileşene bildir
        const selectedIds = newFilteredTopics.filter(t => t.isSelected).map(t => t.id);
        onTopicSelectionChange(selectedIds);
      }
      
      setOnInitialLoad(false);
    }
  }, [filteredTopics, initialSelectedTopicIds, onInitialLoad, onTopicSelectionChange]);

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

  // Konuları ana konulara göre grupla
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

  // Konuları seçip devam etme fonksiyonu
  const handleContinue = () => {
    if (!currentCourseId && quizType === 'personalized') { // Kişiselleştirilmiş sınav için kurs ID zorunlu
      alert("Lütfen bir ders seçin");
      return;
    }

    const topicsToSubmit = filteredTopics
      .filter((t) => t.isSelected)
      .map((t) => t.id);
      
    console.log('[TSS handleContinue] filteredTopics:', JSON.stringify(filteredTopics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
    console.log('[TSS handleContinue] Topics being submitted to onTopicsSelected:', JSON.stringify(topicsToSubmit));
    console.log('[TSS handleContinue] currentCourseId:', currentCourseId);

    if (topicsToSubmit.length === 0 && personalizedQuizType !== 'weakTopicFocused') { // Zayıf odaklı değilse konu seçimi zorunlu
      alert("Lütfen en az bir konu seçin");
      return;
    }
    
    // Hızlı sınav için kurs ID'si "quick" veya boş string olabilir, backend bunu handle etmeli. Şimdilik boş gönderelim.
    onTopicsSelected(topicsToSubmit, quizType === 'quick' ? "" : currentCourseId);
  };

  // Durum bilgisi için stil
  const getStatusInfo = useCallback((status?: LearningTargetStatusLiteral | string) => {
    if (!status) {
      return {
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        borderColor: "border-indigo-200 dark:border-indigo-700",
        label: "Yeni",
        icon: FiPlus,
      };
    }

    // Desteklenen değerlerle eşleştir
    const validStatusValues: LearningTargetStatusLiteral[] = ["pending", "medium", "failed", "mastered"];
    
    // String değerine dönüştür
    const statusStr = typeof status === 'string' ? status : String(status);
    
    // Desteklenen değerlerle eşleştir
    const statusLiteral = validStatusValues.includes(statusStr as LearningTargetStatusLiteral) 
      ? statusStr as LearningTargetStatusLiteral 
      : "pending";
    
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
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Konu Seçimi
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
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
        
        {/* Maksimum konu sınırı bilgisi */}
        <div className="mt-3 p-3 border border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-md flex items-center">
          <FiInfo className="min-w-5 w-5 h-5 mr-2" />
          <span className="text-sm">En fazla <strong>10 konu</strong> seçebilirsiniz. Bu sınır, AI'nin daha odaklı ve kaliteli sorular oluşturabilmesi için gereklidir.</span>
        </div>
      </div>

      {availableCourses && availableCourses.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ders Seçimi
          </label>
          <select
            value={currentCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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

      {/* Konu Listesi Başlığı ve Filtreler */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedFilter === "all"
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              Tümü ({topicCounts.all})
            </button>
            {topicCounts.new > 0 && (
              <button
                onClick={() => handleFilterChange("new")}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedFilter === "new"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                Yeni ({topicCounts.new})
              </button>
            )}
            {topicCounts.existing > 0 && (
              <button
                onClick={() => handleFilterChange("existing")}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedFilter === "existing"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                Mevcut ({topicCounts.existing})
              </button>
            )}
          </div>
          <button
            onClick={() => handleToggleAll(true)}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-sm hover:shadow flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Tümünü Seç
          </button>
        </div>
      </div>

      {/* Ana konulara göre gruplandırılmış liste */}
      <div className="space-y-6 mb-6">
        {Object.entries(groupedTopics).map(([parentTopic, topics]) => (
          <div key={parentTopic} className="border rounded-lg p-3 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2 dark:border-gray-700 flex items-center">
              <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              {parentTopic}
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({topics.length})</span>
            </h3>
            <div className="space-y-2">
              {topics.map((topic, index) => (
                <TopicCard 
                  key={`${topic.id}-${index}`} 
                  topic={topic} 
                  onToggle={handleTopicToggle} 
                  statusInfo={getStatusInfo(topic.status)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tek bir merkezi "Devam Et" butonu */}
      <div className="flex justify-center mt-8">
        <button 
          onClick={handleContinue}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
          disabled={topicCounts.selected === 0}
        >
          <span>{topicCounts.selected > 0 ? `${topicCounts.selected} Konu ile Devam Et` : "Konu Seçin"}</span>
        </button>
      </div>
    </div>
  );
}

// Konu kartı bileşeni
interface TopicCardProps {
  topic: TopicData;
  onToggle: (id: string) => void;
  statusInfo: StatusStyle;
}

function TopicCard({ topic, onToggle, statusInfo }: TopicCardProps) {
  // Konu adını düzgün bir şekilde göster
  const displayTopicName = () => {
    // '```json' gibi metinlerle başlayan konuları temizle
    let name = '';
    
    // Eğer subTopicName alanı varsa ve bir string ise
    if (typeof topic.subTopicName === 'string') {
      name = topic.subTopicName;
      
      // JSON formatı veya teknik bir değer ise, temizle
      if (name.startsWith('```') || name.startsWith('"```') || name.includes('subTopicName') || name.includes('normalizedSubTopicName')) {
        name = 'Konu ' + topic.id.substring(0, 8);
      }
    }
    // Eğer name alanı varsa
    else if (topic.name) {
      name = topic.name;
    }
    // Hiçbir şey yoksa ID'yi kullan
    else {
      name = 'Konu ' + topic.id.substring(0, 8);
    }
    
    // Özel karakterleri ve fazla boşlukları temizle
    name = name.replace(/^\W+/, '').replace(/\s+/g, ' ').trim();
    
    // Eğer name hala boşsa veya çok kısaysa, ön tanımlı bir metin kullan
    if (!name || name.length < 3) {
      return 'Konu ' + topic.id.substring(0, 8);
    }
    
    return name;
  };

  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`p-2 border rounded-lg cursor-pointer transition-colors ${
        topic.isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
      }`}
      onClick={() => onToggle(topic.id)}
    >
      <div className="flex items-center">
        <div
          className={`rounded-full min-w-5 w-5 h-5 mr-3 flex items-center justify-center ${
            topic.isSelected
              ? "bg-indigo-500 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {topic.isSelected && <FiCheck className="w-3 h-3" />}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {displayTopicName()}
          </h3>
          {topic.parentTopic && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {topic.parentTopic}
            </p>
          )}
        </div>
        <div className="flex items-center ml-2">
          <div
            className={`text-xs rounded-full px-2 py-0.5 flex items-center whitespace-nowrap ${statusInfo.bgColor} ${statusInfo.color}`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </div>
          {topic.isNew && (
            <div className="ml-1 text-xs rounded-full px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 whitespace-nowrap">
              Yeni
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
