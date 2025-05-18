/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiTarget,
  FiZap,
  FiAward,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentUploader } from "../document";
import TopicSelectionScreen from "./TopicSelectionScreen";
import { ErrorService } from "@/services/error.service";
import ExamCreationProgress from "./ExamCreationProgress";
import CourseTopicSelector from "./CourseTopicSelector";
import courseService from "@/services/course.service";
import learningTargetService from "@/services/learningTarget.service";
import documentService from "@/services/document.service";
import axios from "axios";
import {
  Course,
  DetectedSubTopic,
  QuizPreferences,
  QuizGenerationOptions,
  DifficultyLevel
} from "@/types";
import { toast } from "react-hot-toast";
import quizService from "@/services/quiz.service";
import { SubTopicItem } from "@/types/quiz";
import { LearningTarget } from "@/types/learningTarget";
import { useRouter } from "next/navigation";

interface ExamCreationWizardProps {
  quizType: "quick" | "personalized"; // Dışarıdan gelen sınav türü
  onComplete?: (result: {
    file: File | null;
    quizType: "quick" | "personalized";
    personalizedQuizType?:
      | "weakTopicFocused"
      | "learningObjectiveFocused"
      | "newTopicFocused"
      | "comprehensive";
    preferences: QuizPreferences;
    topicNameMap: Record<string, string>;
  }) => void;
}

// API yanıt tipleri için interface tanımları
interface TopicResponse {
  subTopicName: string;
  normalizedSubTopicName: string;
}

interface TopicsResponseData {
  topics?: TopicResponse[];
  message?: string;
}

export default function ExamCreationWizard({
  quizType, // Dışarıdan gelen sınav türü
  onComplete,
}: ExamCreationWizardProps) {
  const router = useRouter();

  // Adım yönetimi
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Sınav türü seçimi kaldırıldığı için 4'ten 3'e düşürüldü

  // Dosya yükleme durumu
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  // Konu tespiti durumu için yeni state
  const [topicDetectionStatus, setTopicDetectionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Seçilen konuları takip etmek için state (TopicSelectionScreen için)
  const [selectedTopicsList, setSelectedTopicsList] = useState<string[]>([]);
  const [onInitialLoad, setOnInitialLoad] = useState<boolean>(true);

  // Sınav oluşturma durumu için yeni state
  const [quizCreationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Belge metni ve belge ID'si
  const [documentTextContent, setDocumentTextContent] = useState<string>("");
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string>("");
  
  // Seçilen konular (alt konu olarak)
  const [selectedTopics, setSelectedTopics] = useState<SubTopicItem[]>([]);

  // Kişiselleştirilmiş sınav alt türü - sadece personalized modda kullanılıyor
  const [personalizedQuizType, setPersonalizedQuizType] = useState<
    "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive"
  >("comprehensive");

  // Tercihler
  const [preferences, setPreferences] = useState<QuizPreferences>({
    questionCount: 10,
    difficulty: "mixed",
    timeLimit: undefined,
    personalizedQuizType: quizType === "personalized" ? "comprehensive" : undefined, 
  });
  const [useTimeLimit, setUseTimeLimit] = useState<boolean>(false);
  const [timeLimitValue, setTimeLimitValue] = useState<number | undefined>(undefined);

  // Kurs ve konu seçimi
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubTopicIds, setSelectedSubTopicIds] = useState<string[]>([]);

  // Kurslar ve konu/alt konu state'leri
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTopics, setCourseTopics] = useState<DetectedSubTopic[]>([]);
  const [topicSubTopics, setTopicSubTopics] = useState<DetectedSubTopic[]>([]);

  // Tespit edilen konular
  const [detectedTopics, setDetectedTopics] = useState<DetectedSubTopic[]>([]);

  // TopicSelectionScreen'den seçilen konular değiştiğinde bu fonksiyon çağrılacak
  const handleTopicSelectionChange = useCallback((selectedTopics: string[]) => {
    console.log('[ECW handleTopicSelectionChange] Seçilen konular güncellendi:', selectedTopics);
    setSelectedTopicsList(selectedTopics);
    // Burada seçilen konuları doğrudan diğer state'lere de ekleyebiliriz
    setSelectedTopicIds(selectedTopics);
    setSelectedSubTopicIds(selectedTopics);
    
    // Seçilen konuları alt konular olarak da güncelle
    const subTopicItems: SubTopicItem[] = selectedTopics.map(topicId => {
      const topic = detectedTopics.find(t => t.id === topicId);
      return {
        subTopic: topic?.subTopicName || topicId,
        normalizedSubTopic: topic?.normalizedSubTopicName || topicId,
      };
    });
    setSelectedTopics(subTopicItems);
    
    setPreferences(prev => ({
      ...prev,
      topicIds: selectedTopics,
      subTopicIds: selectedTopics
    }));
  }, [detectedTopics, setSelectedTopicIds, setSelectedSubTopicIds, setSelectedTopics]);

  // Kursları yükle
  useEffect(() => {
    courseService.getCourses().then((data) => {
      setCourses(data);
      if (!selectedCourseId && data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    });
  }, []);

  // Seçili kurs değişince konuları yükle
  useEffect(() => {
    if (!selectedCourseId) return;
    learningTargetService.getLearningTargets(selectedCourseId).then((targets: LearningTarget[]) => {
      // DetectedSubTopic tipine dönüştür
      const detected: DetectedSubTopic[] = targets.map((t: LearningTarget) => ({
        id: t.id,
        subTopicName: t.subTopicName,
        normalizedSubTopicName: t.normalizedSubTopicName,
        status: t.status,
      }));
      setCourseTopics(detected);
    });
  }, [selectedCourseId]);

  // Seçili konulara göre alt konuları filtrele (örnek: burada alt konu = konu ile aynı, gerçek alt konu ilişkisi yoksa)
  useEffect(() => {
    // Eğer alt konu ilişkisi varsa burada filtrelenmeli, yoksa courseTopics'i kullan
    setTopicSubTopics(
      courseTopics.filter((t) => selectedTopicIds.includes(t.id)),
    );
  }, [selectedTopicIds, courseTopics]);

  // Konu seçimi değiştiğinde alt konu seçimlerini güncelle
  useEffect(() => {
    console.log('[ECW useEffect] selectedTopicIds changed:', JSON.stringify(selectedTopicIds));
    console.log('[ECW useEffect] selectedSubTopicIds before processing:', JSON.stringify(selectedSubTopicIds));
    console.log('[ECW useEffect] topicSubTopics for filtering:', JSON.stringify(topicSubTopics.map(t => t.id)));

    // Önceki seçilen alt konuları filtrele
    const validSubTopicIds = selectedSubTopicIds.filter((id) => {
      const subTopic = topicSubTopics.find(
        (st: DetectedSubTopic) => st.id === id,
      );
      // Ensure subTopic exists and its parent topic (which is subTopic.id itself in this simplified model) is in selectedTopicIds
      // This logic might need adjustment if subTopics have a different parentTopicId field
      return subTopic && selectedTopicIds.includes(subTopic.id); 
    });

    console.log('[ECW useEffect] validSubTopicIds after filtering:', JSON.stringify(validSubTopicIds));

    // Sadece değişiklik varsa state güncelle
    const isSame = validSubTopicIds.length === selectedSubTopicIds.length &&
      validSubTopicIds.every((id, idx) => id === selectedSubTopicIds[idx]);

    if (!isSame) {
      setSelectedSubTopicIds(validSubTopicIds);
      console.log('[ECW useEffect] setSelectedSubTopicIds called with:', JSON.stringify(validSubTopicIds));
      setPreferences((prev) => {
        const newPrefs = {
          ...prev,
          topicIds: [...selectedTopicIds],
          subTopicIds: [...validSubTopicIds],
        };
        console.log('[ECW useEffect] Preferences updated (due to subTopicIds change):', JSON.stringify(newPrefs));
        return newPrefs;
      });
    } else {
      // Eğer değişiklik yoksa yine de preferences güncellensin ki step geçişlerinde kaybolmasın
      // This part ensures preferences.topicIds is also up-to-date if only selectedTopicIds changed without affecting subTopicIds selection logic
      setPreferences((prev: QuizPreferences) => {
        const newPrefs = {
          ...prev,
          topicIds: [...selectedTopicIds], // Ensure latest selectedTopicIds are in prefs
          subTopicIds: [...validSubTopicIds], // And latest validSubTopicIds
        };
        // Log only if there's a meaningful change to preferences from selectedTopicIds part
        if (JSON.stringify(prev.topicIds) !== JSON.stringify(selectedTopicIds) || JSON.stringify(prev.subTopicIds) !== JSON.stringify(validSubTopicIds)) {
            console.log('[ECW useEffect] Preferences updated (potentially from selectedTopicIds directly or ensuring consistency):', JSON.stringify(newPrefs));
        }
        return newPrefs;
      });
    }
  }, [selectedTopicIds, selectedSubTopicIds, topicSubTopics]);

  // Dosya yükleme işlemi tamamlandığında
  const handleFileUploadComplete = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus("success");
    // Belge metnini temizle (yeni dosya yüklendiğinde)
    setDocumentTextContent("");
    // Document ID'yi sıfırla
    setUploadedDocumentId("");
    console.log(`📂 Dosya yükleme başarılı: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  // Dosya yükleme hatası
  const handleFileUploadError = (errorMsg: string) => {
    console.error(`❌ HATA: Dosya yükleme hatası: ${errorMsg}`);
    setUploadStatus("error");
    ErrorService.showToast(errorMsg, "error");
  };

  // Konuları tespit et
  const handleTopicsDetected = (selectedTopics: string[], courseId: string) => {
    console.log('[ECW handleTopicsDetected] Received selectedTopics:', JSON.stringify(selectedTopics));
    console.log('[ECW handleTopicsDetected] Received courseId:', courseId);

    if (courseId) {
      setSelectedCourseId(courseId);
    }

    if (selectedTopics && selectedTopics.length > 0) {
      setSelectedTopicIds(selectedTopics); // Update state
      console.log('[ECW handleTopicsDetected] setSelectedTopicIds called with:', JSON.stringify(selectedTopics));
      setPreferences((prev: QuizPreferences) => {
        const newPrefs = {
          ...prev,
          topicIds: selectedTopics,
          subTopicIds: selectedTopics, // Alt konular konularla aynı (basitleştirilmiş versiyon)
        };
        console.log('[ECW handleTopicsDetected] Preferences updated to:', JSON.stringify(newPrefs));
        return newPrefs;
      });
    } else {
      console.warn('[ECW handleTopicsDetected] Received empty or no selectedTopics.');
      // If no topics are selected (e.g., user de-selected all), ensure states are cleared
      setSelectedTopicIds([]);
      setPreferences((prev: QuizPreferences) => {
        const newPrefs = {
          ...prev,
          topicIds: [],
          subTopicIds: [], // Alt konular konularla aynı (basitleştirilmiş versiyon)
        };
        console.log('[ECW handleTopicsDetected] Preferences cleared due to no selected topics:', JSON.stringify(newPrefs));
        return newPrefs;
      });
    }
    console.log('[ECW handleTopicsDetected] Moving to step 3.');
    setCurrentStep(3);
  };

  // Konu tespiti iptal
  const handleTopicDetectionCancel = () => {
    console.log(`❌ Konu tespiti kullanıcı tarafından iptal edildi!`);
    // Konu seçimi zorunlu olduğundan (weakTopicFocused hariç), iptal edilirse kullanıcı bilgilendirilmeli veya akış durmalı
    // Şimdilik bir sonraki adıma (tercihler) geçiyoruz, ancak bu mantık iyileştirilebilir.
    console.log(`🔄 Adım 3'e (Tercihler) geçiliyor...`);
    setCurrentStep(3);
  };

  // Konu seçimini değiştir
  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId],
    );
  };

  // Alt konu seçimini değiştir
  const handleSubTopicToggle = (subTopicId: string) => {
    console.log(`🔄 Alt konu seçimi değişiyor: ${subTopicId}`);
    
    setSelectedSubTopicIds((prev) => {
      const updated = prev.includes(subTopicId)
        ? prev.filter((id) => id !== subTopicId)
        : [...prev, subTopicId];
      
      console.log(`${prev.includes(subTopicId) ? "➖ Alt konu kaldırıldı:" : "➕ Alt konu eklendi:"} ${subTopicId}`);
      console.log(`✅ Güncel alt konu sayısı: ${updated.length}`);
      
      // Tercihleri güncelle
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        subTopicIds: updated,
      }));
      console.log(`✅ Quiz tercihleri güncellendi. Alt konu ID'leri: ${updated.length} adet`);
      
      return updated;
    });
  };

  // Kişiselleştirilmiş sınav alt türü
  const handlePersonalizedQuizTypeSelect = (
    type: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive",
  ) => {
    console.log(`🔄 Kişiselleştirilmiş sınav alt türü değişiyor: ${personalizedQuizType} -> ${type}`);
    setPersonalizedQuizType(type);
    
    // Tip hatası giderme: QuizPreferences tipine uygun olacak şekilde
    const updatedPreferences: QuizPreferences = {
      ...preferences,
      personalizedQuizType: type,
    };
    
    console.log(`✅ Quiz tercihleri güncellendi: personalizedQuizType = ${type}`);
    setPreferences(updatedPreferences);
  };

  // Tercih işlemleri
  const handlePreferenceChange = (
    key: keyof QuizPreferences,
    value: unknown,
  ) => {
    setPreferences((prev: QuizPreferences) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Zaman sınırı checkbox değişimi
  const handleUseTimeLimitChange = (checked: boolean) => {
    setUseTimeLimit(checked);
    if (!checked) {
      // Zaman sınırı kullanılmıyorsa değeri sıfırla
      handlePreferenceChange("timeLimit", undefined);
    } else {
      // Zaman sınırı ilk kez seçiliyorsa varsayılan bir değer ata (örn: 20dk)
      if (preferences.timeLimit === undefined) {
        handlePreferenceChange("timeLimit", 20);
      }
    }
  };

  // Zaman sınırı input değişimi
  const handleTimeLimitInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    // Geçerli bir sayı ise veya boş ise güncelle
    if (!isNaN(numValue) && numValue >= 1) {
      handlePreferenceChange("timeLimit", numValue);
      setTimeLimitValue(numValue);
    } else if (value === "") {
      // Input boşsa state'i undefined yapabiliriz ama kullanıcı deneyimi için 0 veya 1 gibi min değer daha iyi olabilir.
      // Şimdilik minimum 1 varsayalım.
      handlePreferenceChange("timeLimit", 1);
      setTimeLimitValue(1);
    }
  };

  // Adım işlemleri
  const nextStep = () => {
    console.log(`📋 SINAV OLUŞTURMA AŞAMASI: ${currentStep}/${totalSteps} adımdan bir sonrakine geçiliyor...`);
    
    // Adım 1 Doğrulama: Dosya Yükleme
    if (currentStep === 1 && (!selectedFile || uploadStatus !== "success")) {
      console.error(`❌ HATA: Dosya yükleme başarısız. Durum: ${uploadStatus}`);
      ErrorService.showToast("Lütfen geçerli bir dosya yükleyin.", "error");
      return;
    }

    // Eğer adım 1'den 2'ye geçiyorsak ve dosya yüklüyse konu tespitini başlat
    if (currentStep === 1 && selectedFile && uploadStatus === "success" && topicDetectionStatus !== "loading") {
      // Zayıf/Orta odaklı kişiselleştirilmiş sınav için konu tespiti atlanabilir
      if (quizType === "personalized" && personalizedQuizType === "weakTopicFocused") {
        console.log(`🔄 Akış değişikliği: Zayıf/Orta odaklı sınav türü için Adım 1'den Adım 3'e atlıyoruz`);
        setCurrentStep(3);
        return;
      }

      // Konu tespiti durumunu yükleniyor olarak ayarla
      setTopicDetectionStatus("loading");

      // Konu tespiti fonksiyonunu çağır
      detectTopicsFromUploadedFile(selectedFile)
      return;
    }

    // Adım 2 Doğrulama: Konu Seçimi (Personalized ve weakTopicFocused Dışında)
    if (
      currentStep === 2 &&
      quizType === "personalized" &&
      personalizedQuizType !== "weakTopicFocused" &&
      selectedTopicIds.length === 0
    ) {
      console.error(`❌ HATA: Konu seçimi yapılmadı. Seçilen konular: ${selectedTopicIds.length}`);
      ErrorService.showToast("Lütfen en az bir konu seçin.", "error");
      return;
    }

    if (currentStep < totalSteps) {
      let nextStepNumber = currentStep + 1;

      // Akış Atlama Mantığı
      // Zayıf/Orta Odaklı: Adım 1'den Adım 3'e atla (Konu Seçimi yok)
      if (
        quizType === "personalized" &&
        personalizedQuizType === "weakTopicFocused" &&
        currentStep === 1
      ) {
        console.log(`🔄 Akış değişikliği: Zayıf/Orta odaklı sınav türü için Adım 1'den Adım 3'e atlıyoruz`);
        nextStepNumber = 3;
      }

      console.log(`✅ Adım ${currentStep}'den Adım ${nextStepNumber}'e ilerletiliyor...`);
      setCurrentStep(nextStepNumber);
    } else {
      // Son adımda handleFinalSubmit fonksiyonunu çağır
      handleFinalSubmit();
    }
  };

  // Bir önceki adıma dön
  const prevStep = () => {
    console.log(`⏪ GERİ: Adım ${currentStep}'den bir öncekine dönülüyor...`);
    
    if (currentStep > 1) {
      let prevStep = currentStep - 1;

      // Konu Seçimini Atlayan Durumlar İçin Geri Gitme Mantığı
      if (
        quizType === "personalized" &&
        personalizedQuizType === "weakTopicFocused" &&
        currentStep === 3
      ) {
        console.log(`🔄 Akış değişikliği: Zayıf/Orta odaklı sınav türü için Adım 3'ten Adım 1'e dönüyoruz`);
        prevStep = 1;
      }

      console.log(`✅ Adım ${currentStep}'den Adım ${prevStep}'e geri dönülüyor...`);
      setCurrentStep(prevStep);
    }
  };

  // CourseTopicSelector ve TopicSelectionScreen arasında uyumluluk sağlayan adapter fonksiyonları
  
  // TopicSelectionScreen için courseId string alacak şekilde adapter
  const handleCourseChangeForTopicSelection = (courseId: string) => {
    setSelectedCourseId(courseId);
    
    // Kurs değiştiğinde seçilen konuları sıfırla
    setSelectedTopicIds([]);
    setSelectedSubTopicIds([]);
  };
  
  // CourseTopicSelector için event alacak şekilde adapter
  const handleCourseChangeAdapter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    handleCourseChangeForTopicSelection(courseId);
  };

  /**
   * TopicSelectionScreen bileşeni
   */
  // TopicSelectionScreenWithAdapter bileşenini kaldırıyorum

  // Dosya adından varsayılan konular oluştur (konu tespit edilemediğinde)
  const generateDefaultTopicsFromFileName = (fileName: string): Array<{
    id: string;
    subTopicName: string;
    normalizedSubTopicName: string;
    isSelected: boolean;
  }> => {
    try {
      // Dosya adını ve uzantısını ayır
      const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
      
      // Dosya adını boşluk, tire, alt çizgi gibi karakterlere göre böl
      const parts = nameWithoutExt.split(/[\s\-_]+/).filter(part => part.length > 2);
      
      // Dosya adı parçaları yeterince anlamlı değilse genel konular kullan
      if (parts.length === 0) {
        return [
          {
            id: 'default-document',
            subTopicName: 'Belge İçeriği',
            normalizedSubTopicName: 'belge-icerigi',
            isSelected: true
          },
          {
            id: 'default-general',
            subTopicName: 'Genel Konular',
            normalizedSubTopicName: 'genel-konular',
            isSelected: false
          }
        ];
      }
      
      // Dosya adı parçalarından konular oluştur
      const topics = parts.map((part, index) => {
        // İlk harfi büyük diğerleri küçük olacak şekilde formatla
        const formattedName = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        const normalizedName = formattedName.toLowerCase()
          .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
          .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-');
        
        return {
          id: `default-${normalizedName}`,
          subTopicName: formattedName,
          normalizedSubTopicName: normalizedName,
          isSelected: index === 0 // İlk konu otomatik seçili
        };
      });
      
      // Dosya adından oluşturulan konulara ek olarak genel bir konu daha ekle
      topics.push({
        id: 'default-content',
        subTopicName: 'Belge İçeriği',
        normalizedSubTopicName: 'belge-icerigi',
        isSelected: false
      });
      
      return topics;
    } catch (error) {
      console.error(`⚠️ Varsayılan konular oluşturulurken hata:`, error);
      
      // Hata durumunda en basit bir konu listesi döndür
      return [
        {
          id: 'error-default',
          subTopicName: 'Belge İçeriği',
          normalizedSubTopicName: 'belge-icerigi',
          isSelected: true
        }
      ];
    }
  };

  // Yüklenen dosyadan konuları tespit eden fonksiyon
  const detectTopicsFromUploadedFile = async (file: File) => {
    try {
      console.log(`[ECW detectTopicsFromUploadedFile] 📂 Dosya konu tespiti başlatılıyor: ${file.name}`);
      
      let uploadedDocument = null;
      try {
        uploadedDocument = await documentService.uploadDocument(
          file,
          undefined,
          (progress) => {
            console.log(`[ECW detectTopicsFromUploadedFile] 📤 Yükleme ilerleme: %${progress.toFixed(0)}`);
          }
        );
        const documentId = uploadedDocument.id;
        // BELGE ID'SINI STATE'E KAYDET
        setUploadedDocumentId(documentId);
        console.log(`[ECW detectTopicsFromUploadedFile] 📄 Belge yükleme başarılı! Belge ID: ${documentId}`);

        // Belge metni yükleme işlemini hemen başlat
        try {
          console.log(`[ECW detectTopicsFromUploadedFile] 📄 Belge metni yükleniyor (ID: ${documentId})...`);
          const docTextResponse = await documentService.getDocumentText(documentId);
          
          if (docTextResponse && docTextResponse.text && docTextResponse.text.trim() !== '') {
            setDocumentTextContent(docTextResponse.text);
            console.log(`[ECW detectTopicsFromUploadedFile] ✅ Belge metni başarıyla yüklendi (${docTextResponse.text.length} karakter)`);
          } else {
            console.warn(`[ECW detectTopicsFromUploadedFile] ⚠️ Belge metni boş veya geçersiz format`);
          }
        } catch (textError) {
          console.error(`[ECW detectTopicsFromUploadedFile] ❌ Belge metni yüklenirken hata: ${textError instanceof Error ? textError.message : 'Bilinmeyen hata'}`);
          // Metin yükleme hatası olsa bile konu tespiti devam edebilir
        }
      } catch (uploadError) {
        console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: Dosya yükleme başarısız! ${uploadError instanceof Error ? uploadError.message : 'Bilinmeyen hata'}`);
        ErrorService.showToast(
          `Dosya yükleme hatası: ${uploadError instanceof Error ? uploadError.message : 'Bilinmeyen hata'}`,
          "error"
        );
        setTopicDetectionStatus("error");
        return;
      }

      const documentId = uploadedDocument?.id;
      if (documentId) {
        try {
          console.log(`[ECW detectTopicsFromUploadedFile] 🔍 Belge ID ${documentId} için konu tespiti başlatılıyor...`);
          const detectedTopicsRequest = {
            documentId: documentId,
            ...(quizType === "personalized" && selectedCourseId ? { courseId: selectedCourseId } : {})
          };
          console.log(`[ECW detectTopicsFromUploadedFile] 📤 Konu tespiti isteği gönderilecek:`, detectedTopicsRequest);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (quizType === "personalized") {
            try {
              const token = localStorage.getItem("auth_token");
              if (!token) console.warn("[ECW detectTopicsFromUploadedFile] ⚠️ Token bulunamadı, anonim istek gönderilecek");
              else { headers['Authorization'] = `Bearer ${token}`; console.log("[ECW detectTopicsFromUploadedFile] 🔑 Authorization token başarıyla eklendi"); }
            } catch (tokenError) {
              console.warn(`[ECW detectTopicsFromUploadedFile] ⚠️ Token alma hatası: ${tokenError instanceof Error ? tokenError.message : 'Bilinmeyen hata'}`);
            }
          }
          console.log(`[ECW detectTopicsFromUploadedFile] 🔍 ${quizType === "personalized" ? "Yetkilendirilmiş" : "Anonim"} konu tespiti isteği gönderiliyor...`);
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/learning-targets/detect-topics`;
          console.log(`[ECW detectTopicsFromUploadedFile] 🌐 API isteği: POST ${apiUrl}`);
          
          const response = await axios.post(apiUrl, detectedTopicsRequest, { headers });
          console.log(`[ECW detectTopicsFromUploadedFile] ✅ Konu tespiti yanıtı alındı. Durum kodu: ${response.status}`);
          console.log(`[ECW detectTopicsFromUploadedFile] 📊 Yanıt verileri:`, JSON.stringify(response.data));
          
          if (!response.data) {
            console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: Boş yanıt alındı!`);
            ErrorService.showToast("Yanıt alınamadı. Lütfen tekrar deneyin.", "error");
            setTopicDetectionStatus("error");
            return;
          }
          
          let processedTopics: DetectedSubTopic[] = [];
          const responseData = response.data as TopicsResponseData | DetectedSubTopic[] | string[];
          console.log(`[ECW detectTopicsFromUploadedFile] 🔍 Yanıt formatı değerlendiriliyor:`, { isObject: typeof responseData === 'object', hasTopics: responseData && 'topics' in responseData, isArray: Array.isArray(responseData), type: typeof responseData });
          
          const generateId = (base: string = 'generated') => `${base}-${Math.random().toString(36).substring(2, 9)}`;
          const normalizeStr = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-');

          if (responseData && typeof responseData === 'object' && 'topics' in responseData && Array.isArray((responseData as TopicsResponseData).topics)) {
            console.log(`[ECW detectTopicsFromUploadedFile] 📋 Yeni API formatı tespit edildi (topics nesnesi)`);
            processedTopics = (responseData as TopicsResponseData).topics!.map((topic: TopicResponse): DetectedSubTopic => ({
              id: topic.normalizedSubTopicName || topic.subTopicName || generateId('topic'),
              subTopicName: topic.subTopicName || 'Bilinmeyen Konu',
              normalizedSubTopicName: normalizeStr(topic.normalizedSubTopicName || topic.subTopicName),
              isSelected: false,
              status: undefined, 
              isNew: undefined,
              parentTopic: undefined,
            }));
            console.log(`[ECW detectTopicsFromUploadedFile] ✓ ${processedTopics.length} konu işlendi (yeni format)`);
          } else if (Array.isArray(responseData)) {
            console.log(`[ECW detectTopicsFromUploadedFile] 📋 Eski API formatı tespit edildi (dizi)`);
            processedTopics = responseData.map((topic: unknown, index: number): DetectedSubTopic => {
              if (typeof topic === 'string') {
                return {
                  id: normalizeStr(topic) || generateId(`str-${index}`),
                  subTopicName: topic, 
                  normalizedSubTopicName: normalizeStr(topic),
                  isSelected: false,
                  status: undefined, isNew: undefined, parentTopic: undefined,
                };
              } else if (typeof topic === 'object' && topic !== null) {
                  const t = topic as Partial<DetectedSubTopic & { name?: string }>;
                  return {
                    id: normalizeStr(String(t.id || t.normalizedSubTopicName || t.subTopicName)) || generateId(`obj-${index}`),
                    subTopicName: String(t.subTopicName || t.name || `Bilinmeyen Konu ${index + 1}`),
                    normalizedSubTopicName: normalizeStr(String(t.normalizedSubTopicName || t.id || t.subTopicName)),
                    isSelected: false,
                    status: t.status, 
                    isNew: t.isNew, 
                    parentTopic: t.parentTopic,
                  };
              }
              // Fallback for unexpected topic structure
              console.warn('[ECW detectTopicsFromUploadedFile] Unexpected topic structure in array:', topic);
              return {
                id: generateId(`fallback-${index}`),
                subTopicName: 'Hatalı Konu Yapısı',
                normalizedSubTopicName: 'hatali-konu-yapisi',
                isSelected: false,
                status: undefined, isNew: undefined, parentTopic: undefined,
              };
            });
            console.log(`[ECW detectTopicsFromUploadedFile] ✓ ${processedTopics.length} konu işlendi (eski format - dizi)`);
          } else {
            console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: Beklenmeyen API yanıt formatı:`, responseData);
            processedTopics = [];
          }
          
          console.log(`[ECW detectTopicsFromUploadedFile] 📊 Son işlenen konular (${processedTopics.length}):`, JSON.stringify(processedTopics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
          
          if (processedTopics.length > 0) {
            setDetectedTopics(processedTopics);
            setTopicDetectionStatus("success");
            console.log(`[ECW detectTopicsFromUploadedFile] ✅ Konu tespiti başarılı, adım 2'ye geçiliyor.`);
            setCurrentStep(2); 
            ErrorService.showToast(`${processedTopics.length} konu tespit edildi.`, "success");

            // Eğer hızlı sınav ise ve konular tespit edildiyse, ilk konuyu otomatik seç
            if (quizType === "quick" && processedTopics.length > 0) {
              const firstTopicId = processedTopics[0].id;
              const updatedTopics = processedTopics.map((topic, index) => index === 0 ? { ...topic, isSelected: true } : topic);
              setDetectedTopics(updatedTopics); 
              setSelectedTopicIds([firstTopicId]);
              setSelectedSubTopicIds([firstTopicId]); 
              if (firstTopicId) { 
                setPreferences(prev => ({ ...prev, topicIds: [firstTopicId!], subTopicIds: [firstTopicId!] })); // Non-null assertion
              }
              console.log(`[ECW detectTopicsFromUploadedFile] Hızlı sınav için ilk konu (${firstTopicId}) otomatik seçildi ve detectedTopics güncellendi.`);
            }

          } else { 
            console.warn(`[ECW detectTopicsFromUploadedFile] ⚠️ UYARI: Tespit edilen konu yok!`);
            ErrorService.showToast("Belgede konu tespit edilemedi. Varsayılan konular kullanılacak.", "info");
            const defaultTopics = generateDefaultTopicsFromFileName(file.name);
            
            if (quizType === "quick" && defaultTopics.length > 0) {
              let firstDefaultTopicId: string | undefined = undefined;
              const updatedDefaultTopics = defaultTopics.map(topic => {
                if (!firstDefaultTopicId && topic.isSelected) {
                  firstDefaultTopicId = topic.id;
                  return topic; 
                } 
                return topic;
              });

              if (!firstDefaultTopicId && defaultTopics.length > 0) {
                 firstDefaultTopicId = defaultTopics[0].id; // This should be a string
                 if (firstDefaultTopicId) { // Ensure it's not undefined after assignment (though it shouldn't be)
                    updatedDefaultTopics[0].isSelected = true;
                 } else {
                    console.error("[ECW detectTopicsFromUploadedFile] defaultTopics[0].id was unexpectedly undefined.")
                 }
              }
              
              setDetectedTopics(updatedDefaultTopics);
              setTopicDetectionStatus("success");
              console.log('[ECW detectTopicsFromUploadedFile] ℹ️ Konu tespit edilemedi, dosya adından varsayılan konular oluşturuldu, adım 2\'ye geçiliyor.');
              setCurrentStep(2);

              if (firstDefaultTopicId) {
                setSelectedTopicIds([firstDefaultTopicId]);
                setSelectedSubTopicIds([firstDefaultTopicId]);
                setPreferences(prev => ({ ...prev, topicIds: [firstDefaultTopicId!], subTopicIds: [firstDefaultTopicId!] })); 
                console.log(`[ECW detectTopicsFromUploadedFile] Hızlı sınav için ilk varsayılan konu (${firstDefaultTopicId}) otomatik seçildi ve detectedTopics güncellendi.`);
              } else {
                console.log(`[ECW detectTopicsFromUploadedFile] Hızlı sınav için varsayılan konu bulunamadı veya seçilemedi.`);
              }
            } else {
              setDetectedTopics(defaultTopics);
              setTopicDetectionStatus("success");
              console.log('[ECW detectTopicsFromUploadedFile] ℹ️ Konu tespit edilemedi (hızlı sınav değil veya varsayılan konu yok), adım 2\'ye geçiliyor.');
              setCurrentStep(2);
            }
          }
        } catch (error: unknown) {
          console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: API isteği başarısız!`, error);
          setTopicDetectionStatus("error");
          
          // Hata AxiosError tipinde mi kontrol et
          const isAxiosError = axios.isAxiosError(error);
          
          // Hata detaylarını kapsamlı bir şekilde logla
          console.error(`🔍 Hata detayları:`, { 
            message: isAxiosError ? error.message : String(error),
            status: isAxiosError && error.response ? error.response.status : 'N/A',
            statusText: isAxiosError && error.response ? error.response.statusText : 'N/A',
            data: isAxiosError && error.response ? error.response.data : {},
            config: isAxiosError ? {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
            } : {}
          });
          
              ErrorService.showToast(
            `Konu tespiti başarısız oldu: ${isAxiosError && error.response ? error.response.status : 'Bağlantı hatası'}`,
                "error"
              );
          
          // Hızlı sınav için hatasız devam et (PRD'ye göre hata toleransı yüksek olmalı)
          if (quizType === "quick") {
            console.log("🚀 Hızlı sınav için boş konu listesiyle devam ediliyor");
            const defaultTopics = generateDefaultTopicsFromFileName(file.name);
            setDetectedTopics(defaultTopics);
            setTopicDetectionStatus("success");
            setCurrentStep(2);
          }
        }
      } else {
        console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: Belge ID bulunamadı!`);
        setTopicDetectionStatus("error");
        ErrorService.showToast(
          "Belge yüklendi ancak ID alınamadı. Lütfen tekrar deneyin.",
          "error"
        );
      }
    } catch (error) {
      console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: Dosya işleme genel hata! ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      setTopicDetectionStatus("error");
      ErrorService.showToast(
        `Dosya işlenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        "error"
      );
    }
  };

  // Final gönderim işleyicisi
  const handleFinalSubmit = async () => {
    console.log("[ExamCreationWizard] Final submit çağrılıyor...");
    
    if (isSubmitting) {
      console.log("[ExamCreationWizard] İşlem zaten devam ediyor, tekrar submit engellendi");
        return;
      }
      
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      console.log("[ExamCreationWizard] Sınav oluşturma başlıyor...");
      
      // Belge metni kontrolü - ID varsa ama içerik yoksa tekrar almayı dene
      if (uploadedDocumentId && !documentTextContent) {
        console.log("[ExamCreationWizard] Belge ID var ama belge metni yok. Belge metnini almayı deneyeceğim...");
        try {
          toast.loading("Belge metni alınıyor...");
          const docTextResponse = await documentService.getDocumentText(uploadedDocumentId);
          
          if (docTextResponse && docTextResponse.text && docTextResponse.text.trim() !== '') {
            console.log(`[ExamCreationWizard] Belge metni alındı: ${docTextResponse.text.length} karakter`);
            setDocumentTextContent(docTextResponse.text);
            toast.dismiss();
            toast.success("Belge metni alındı, sınav oluşturuluyor...");
          } else {
            console.warn("[ExamCreationWizard] Belge metni alınamadı veya boş");
            toast.dismiss();
            // Uyarı göster ama devam et - backend belge ID'sini kullanabilir
            toast.error("Belge metni alınamadı, belge ID ile devam ediliyor");
          }
        } catch (docError) {
          console.error("[ExamCreationWizard] Belge metni alma hatası:", docError);
          toast.dismiss();
          toast.error("Belge metni alınamadı, devam ediliyor...");
          // Hatayı göster ama işlemi devam ettir - belge ID ile devam edebiliriz
        }
      }
      
      // Minimum belge metni veya belge ID kontrolü
      if (!uploadedDocumentId && (!documentTextContent || documentTextContent.trim().length < 100)) {
        // Yeterli içerik olmadan devam etme, ama seçilmiş konular varsa onlarla devam edebiliriz
        if (selectedTopics && selectedTopics.length > 0) {
          console.log("[ExamCreationWizard] Belge metni yok ama seçilmiş konular var, devam ediliyor");
          // Sadece bir bilgilendirme toast'ı göster
          toast.loading("Seçilen konularla sınav oluşturuluyor...");
        } else {
        setIsSubmitting(false);
          toast.error("Sınav oluşturmak için belge metni, belge ID veya seçilmiş konular gereklidir");
          console.error("[ExamCreationWizard] Geçerli bir belge metin içeriği, ID'si veya konu seçimi yok");
        return;
      }
      } else {
        toast.loading("Sınav oluşturuluyor...");
      }
      
      console.log("[ExamCreationWizard] Sınav tercihleri hazırlanıyor...");
      
      // Seçilen konuları düzgün formata dönüştür
      const formattedSelectedSubTopics = selectedTopics.map(topic => ({
        subTopic: topic.subTopic,
        normalizedSubTopic: topic.normalizedSubTopic,
      }));
      
      // Quiz oluşturma seçenekleri
      const difficultyMapping: Record<string, DifficultyLevel> = {
        'beginner': 'easy',
        'intermediate': 'medium',
        'advanced': 'hard',
        'mixed': 'mixed'
      };
      
      const quizOptions: QuizGenerationOptions = {
        quizType,
        preferences: {
          questionCount: preferences.questionCount,
          difficulty: difficultyMapping[preferences.difficulty] || 'mixed',
          timeLimit: useTimeLimit && timeLimitValue ? timeLimitValue : undefined
        },
        documentText: documentTextContent || undefined,
        documentId: uploadedDocumentId || undefined,
        selectedSubTopics: formattedSelectedSubTopics.length > 0 ? formattedSelectedSubTopics : null
      };
      
      if (quizType === "personalized" && personalizedQuizType) {
        quizOptions.personalizedQuizType = personalizedQuizType;
      }
      
      console.log("[ExamCreationWizard] Sınav oluşturma isteği gönderiliyor...", {
        quizType,
        hasDocumentText: !!documentTextContent,
        documentTextLength: documentTextContent?.length || 0,
        hasDocumentId: !!uploadedDocumentId,
        selectedTopicsCount: formattedSelectedSubTopics.length,
        preferences: quizOptions.preferences
      });
      
      // Quiz oluştur - en fazla 3 deneme yap
      let generatedQuiz;
      let attemptCount = 0;
      let lastError = null;
      const maxAttempts = 3;
      
      while (attemptCount < maxAttempts) {
        try {
          attemptCount++;
          console.log(`[ExamCreationWizard] Sınav oluşturma denemesi #${attemptCount}`);
          
          generatedQuiz = await quizService.generateQuiz(quizOptions);
          
          // Başarılı sınav oluşturma kontrolü
          if (generatedQuiz && generatedQuiz.id) {
            // Soru sayısını kontrol et
            if (!generatedQuiz.questions || !Array.isArray(generatedQuiz.questions) || generatedQuiz.questions.length === 0) {
              console.warn(`[ExamCreationWizard] Sınav oluşturuldu ama soru yok! ID: ${generatedQuiz.id}`);
              if (attemptCount < maxAttempts) {
                console.log(`[ExamCreationWizard] Tekrar deneniyor (${attemptCount}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Biraz daha uzun bekle
                continue;
              }
            }
            
            // Başarılı
            break;
          } else {
            // Sınav oluştu ama ID yok veya başka bir sorun var
            console.warn("[ExamCreationWizard] Sınav nesnesi geçersiz veya ID yok, tekrar deneniyor...");
            
            if (attemptCount < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Biraz daha uzun bekle
              continue;
            }
          }
        } catch (error) {
          lastError = error;
          console.error(`[ExamCreationWizard] Sınav oluşturma hatası (Deneme ${attemptCount}/${maxAttempts}):`, error);
          
          // Son deneme mi?
          if (attemptCount >= maxAttempts) {
            break; // Son denemeydi, döngüden çık
          }
          
          // Tekrar deneyin
          await new Promise(resolve => setTimeout(resolve, 1500)); // Daha uzun bekle
        }
      }
      
      // Başarısız olduğunda bile sınav döndürmüş olabilir
      if (!generatedQuiz && lastError) {
        throw lastError; // En son hatayı fırlat
      }
      
      // Sınav oluşturuldu mu kontrol et
      if (!generatedQuiz || !generatedQuiz.id) {
        throw new Error("Sınav oluşturulamadı. Lütfen tekrar deneyin.");
      }
      
      console.log("[ExamCreationWizard] Sınav başarıyla oluşturuldu:", {
        quizId: generatedQuiz.id,
        questionCount: generatedQuiz.questions?.length || 0
      });
      
      toast.dismiss();
      toast.success(`Sınav başarıyla oluşturuldu! ${generatedQuiz.questions?.length || 0} soru hazır.`);
      
      // Başarılı sonuç ile dönüş yap
      if (onComplete) {
        // İhtiyaç duyulan topicNameMap formatını oluştur
        const topicMap: Record<string, string> = {};
        selectedTopics.forEach(topic => {
          const key = topic.normalizedSubTopic;
          const value = topic.subTopic;
          if (key && value) {
            topicMap[key] = value;
          }
        });
        
        onComplete({
          file: selectedFile,
          quizType,
          personalizedQuizType,
          preferences: preferences,
          topicNameMap: topicMap
        });
      }
      
      // Sonuç sayfasına yönlendir
      router.push(`/exams/${generatedQuiz.id}`);
    } catch (error: unknown) {
      toast.dismiss();
      
      // Detaylı hata loglama
      console.error("[ExamCreationWizard] Sınav oluşturma hatası:", error);
      
      // Hatayı kullanıcıya görüntüle
      let errorMsg = "Sınav oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.";
      
      if (error instanceof Error) {
        const errorDetails = {
          message: error.message,
          stack: error.stack,
          name: error.name,
          timestamp: new Date().toISOString(),
          documentId: uploadedDocumentId,
          hasDocumentText: !!documentTextContent,
          documentTextLength: documentTextContent?.length || 0,
          selectedTopicsCount: selectedTopicIds.length
        };
        
        // Konsola detaylı hata bilgisi
        console.error("[ExamCreationWizard] Detaylı hata bilgisi:", errorDetails);
        
        // Hata mesajını düzenle
        if (error.message.includes("Belge metni zorunludur") || error.message.includes("belge metni") || error.message.includes("dokuman") || error.message.includes("döküman")) {
          errorMsg = "Sınav oluşturmak için belge metni gereklidir. Lütfen bir belge yükleyin veya konuları manuel olarak seçin.";
        } else if (error.message.includes("Hiç soru bulunamadı") || error.message.includes("Geçersiz API yanıtı")) {
          errorMsg = "Yüklenen belgeden soru oluşturulamadı. Lütfen farklı bir belge deneyin veya başka konular seçin.";
        } else if (error.message.includes("Belge metni çok kısa")) {
          errorMsg = "Belge metni çok kısa. Lütfen daha uzun bir belge kullanın.";
        } else if (error.message.includes("timeout") || error.message.includes("zaman aşımı")) {
          errorMsg = "Sınav oluşturma işlemi zaman aşımına uğradı. Lütfen daha kısa bir belge kullanın veya daha az soru oluşturmayı deneyin.";
        } else if (error.message.includes("Geçersiz yanıt") || error.message.includes("undefined")) {
          errorMsg = "Sistemde beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        } else if (error.message.includes("prepareQuizPayload")) {
          errorMsg = "Sınav verileri hazırlanamadı. Lütfen yeniden başlatın ve tekrar deneyin.";
        } else if (error.message.includes("payload") || error.message.includes("istek")) {
          errorMsg = "Sınav isteği oluşturulamadı. Lütfen tüm alanları doldurduğunuzdan emin olun.";
        } else if (error.message.includes("Unexpected end of JSON")) {
          errorMsg = "API JSON hatası oluştu. Lütfen daha kısa bir belge ile tekrar deneyin.";
        }
      }
      
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adım 3 (ya da son adım): Tercihler
  const renderPreferencesStep = () => {
    return (
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-bold">Sınav Tercihleri</h2>
          
          {/* Seçilen konu ve dosya bilgileri */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Sınav İçeriği</h3>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex items-center text-sm">
                <span className="font-medium mr-1">Belge:</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {selectedFile ? selectedFile.name : (documentTextContent ? 'Metin içeriği' : 'Belge yok')}
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className="font-medium mr-1">Seçili Konu Sayısı:</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {selectedTopicsList.length} konu
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className="font-medium mr-1">Belge Metni:</span>
                <span className={`${documentTextContent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {documentTextContent ? `Yüklendi (${documentTextContent.length} karakter)` : 'Yüklenmedi'}
                </span>
              </div>
            </div>
            
            {/* Belge metni durumu bildirimi */}
            {!documentTextContent && uploadedDocumentId && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded mt-2 text-sm">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">Belge metni henüz yüklenmedi!</p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Sınav oluşturmak için belge metni gereklidir. Lütfen şunları deneyin:
                </p>
                <ul className="list-disc pl-5 mt-1 text-yellow-700 dark:text-yellow-300">
                  <li>Sayfayı yenileyip tekrar deneyin</li>
                  <li>Belgeyi tekrar yükleyin</li>
                  <li>Daha küçük boyutlu bir belge kullanın</li>
                </ul>
                <div className="mt-3">
                  <button 
                    onClick={async () => {
                      try {
                        toast.loading("Belge metni yükleniyor...");
                        const docTextResponse = await documentService.getDocumentText(uploadedDocumentId);
                        
                        if (docTextResponse && docTextResponse.text && docTextResponse.text.trim() !== '') {
                          setDocumentTextContent(docTextResponse.text);
                          console.log(`Belge metni manuel olarak yüklendi: ${docTextResponse.text.length} karakter`);
                          toast.dismiss();
                          toast.success("Belge metni başarıyla yüklendi!");
                        } else {
                          toast.dismiss();
                          toast.error("Belge metni yüklenemedi, metin boş veya geçersiz!");
                        }
                      } catch (error) {
                        console.error("Belge metni yükleme hatası:", error);
                        toast.dismiss();
                        toast.error("Belge metni yüklenirken hata oluştu!");
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md flex items-center space-x-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Belge Metnini Yeniden Yükle
                  </button>
                </div>
              </div>
            )}
            
            {/* Hata mesajı */}
            {errorMessage && (
              <div className="bg-red-50 text-red-700 p-2 rounded mt-2 text-sm">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Soru sayısı seçimi ve diğer tercihler */}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="questionCount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Soru Sayısı
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="questionCount"
                  min="5"
                  max={quizType === "quick" ? 20 : 30}
                  step="1"
                  value={preferences.questionCount}
                  onChange={(e) =>
                    handlePreferenceChange(
                      "questionCount",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <span className="w-12 text-center text-sm font-medium text-gray-700 dark:text-gray-300 ml-4 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {preferences.questionCount}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {quizType === "quick" ? "5-20 arası." : "5-30 arası."} Daha
                fazla soru, daha detaylı analiz sağlar.
              </p>
            </div>

            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Zorluk Seviyesi
              </label>
              <select
                id="difficulty"
                value={preferences.difficulty}
                onChange={(e) =>
                  handlePreferenceChange(
                    "difficulty",
                    e.target.value as
                      | "beginner"
                      | "intermediate"
                      | "advanced"
                      | "mixed",
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="beginner">Kolay</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">Zor</option>
                <option value="mixed">Karışık (Önerilen)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sınavdaki soruların zorluk seviyesini belirler.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zaman Sınırı
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useTimeLimit"
                    checked={useTimeLimit}
                    onChange={(e) =>
                      handleUseTimeLimitChange(e.target.checked)
                    }
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="useTimeLimit"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Zaman sınırı uygula
                  </label>
                </div>
                {useTimeLimit && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center overflow-hidden"
                  >
                    <input
                      type="number"
                      id="timeLimitInput"
                      min="1"
                      max="180"
                      value={preferences.timeLimit || ""}
                      onChange={(e) =>
                        handleTimeLimitInputChange(e.target.value)
                      }
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="örn: 30"
                    />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      dakika
                    </span>
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sınav için bir süre belirleyebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {quizType === "quick" ? "Hızlı Sınav Oluştur" : "Kişiselleştirilmiş Sınav Oluştur"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
          Yapay zeka destekli kişiselleştirilmiş öğrenme deneyimi için adımları takip edin.
        </p>
      </div>

      <div className="p-6 md:p-8">
        <ExamCreationProgress 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          quizType={quizType} 
        />

        <AnimatePresence mode="wait">
          {/* Adım 1: Belge Yükleme */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                1. Belge Yükleme
              </h3>

              <DocumentUploader
                onFileUpload={handleFileUploadComplete}
                onError={handleFileUploadError}
                maxSize={40} // MB cinsinden
                allowedFileTypes={[".pdf", ".docx", ".doc", ".txt"]}
                className="mb-4"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Desteklenen formatlar: PDF, DOCX, DOC, TXT (Maks 40MB). Yapay zeka bu belgeleri analiz ederek sizin için en uygun soruları oluşturacaktır.
              </p>
              {quizType === "personalized" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <b>Not:</b> Kişiselleştirilmiş sınav türü için farklı odak seçenekleri bir sonraki adımda sunulacaktır.
                  {personalizedQuizType === "weakTopicFocused" ? " Zayıf/Orta Odaklı sınav türü için belge yüklemeniz gerekmez." : ""}
                </p>
              )}
              
              {/* Konu tespiti yüklenme durumu */}
              {topicDetectionStatus === "loading" && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Belge içeriği analiz ediliyor ve konular tespit ediliyor...
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Bu işlem belge boyutuna bağlı olarak 10-30 saniye sürebilir. Lütfen bekleyin.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Adım 2: Kişiselleştirilmiş Sınav Alt Türü veya Konu Seçimi */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {quizType === "personalized" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    2. Sınav Odağı ve Konu Seçimi
                  </h3>
                  
                  {/* Kişiselleştirilmiş Sınav Alt Türleri */}
                  <div className="mt-2 mb-6">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Sınav Odağı Seçin:
                    </h4>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Zayıf/Orta Odaklı Sınav */}
                      <div
                        className={`
                          flex items-center border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out
                          ${
                            personalizedQuizType === "weakTopicFocused"
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/50 shadow-sm"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("weakTopicFocused")
                        }
                      >
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 flex-shrink-0 text-red-600 dark:text-red-400">
                          <FiZap />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                            Zayıf/Orta Odaklı
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Yapay zeka, geçmiş performansınıza göre zayıf olduğunuz konulara odaklanır. (Belge gerekmez)
                          </p>
                        </div>
                      </div>

                      {/* Öğrenme Hedefi Odaklı Sınav */}
                      <div
                        className={`
                          flex items-center border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out
                          ${
                            personalizedQuizType === "learningObjectiveFocused"
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/50 shadow-sm"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("learningObjectiveFocused")
                        }
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0 text-green-600 dark:text-green-400">
                          <FiTarget />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                            Öğrenme Hedefi Odaklı
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Belirlediğiniz öğrenme hedeflerine ulaşma durumunuzu yapay zeka yardımıyla ölçer. (Belge gerekir)
                          </p>
                        </div>
                      </div>

                      {/* Yeni Konu Odaklı Sınav */}
                      <div
                        className={`
                          flex items-center border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out
                          ${
                            personalizedQuizType === "newTopicFocused"
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/50 shadow-sm"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("newTopicFocused")
                        }
                      >
                        <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-3 flex-shrink-0 text-yellow-600 dark:text-yellow-400">
                          <FiZap />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                            Yeni Konu Odaklı
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Yüklenen belgeden yapay zeka ile tespit edilen yeni konuları test eder. (Belge gerekir)
                          </p>
                        </div>
                      </div>

                      {/* Kapsamlı Sınav */}
                      <div
                        className={`
                          flex items-center border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out
                          ${
                            personalizedQuizType === "comprehensive"
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/50 shadow-sm"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("comprehensive")
                        }
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400">
                          <FiAward />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                            Kapsamlı
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Yapay zeka, yeni içerik ile mevcut öğrenme hedeflerinizi birleştiren karma bir sınav oluşturur. (Belge gerekir)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Konu Seçimi - Hem hızlı sınav hem de kişiselleştirilmiş sınav için */}
              <div className={quizType === "personalized" ? "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700" : ""}>
             

                {personalizedQuizType === "weakTopicFocused" ? (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-200">
                    <p className="text-sm font-medium">Bilgi:</p>
                    <p className="text-sm">
                      Zayıf/Orta Odaklı Sınav seçildiğinde, durumu
                      &lsquo;başarısız&apos; veya &#39;orta&#39; olan mevcut
                      öğrenme hedefleriniz otomatik olarak kullanılır. Bu
                      adımda ek konu seçimi gerekmez.
                    </p>
                  </div>
                ) : (
                  <>
                   
                    {/* AI Konu Tespiti ve Seçim Ekranı */}
                    <TopicSelectionScreen
                      detectedTopics={detectedTopics}
                      existingTopics={courseTopics} 
                      availableCourses={courses}
                      selectedCourseId={selectedCourseId}
                      quizType={quizType}
                      personalizedQuizType={personalizedQuizType}
                      isLoading={topicDetectionStatus === "loading"}
                      error={undefined}
                      onTopicsSelected={(selectedTopics, courseId) => {
                        // topicId ve courseId parametrelerini birleştir
                        handleTopicsDetected(selectedTopics, courseId);
                      }}
                      onCourseChange={handleCourseChangeForTopicSelection}
                      onCancel={handleTopicDetectionCancel}
                      initialSelectedTopicIds={selectedTopicIds}
                      onTopicSelectionChange={handleTopicSelectionChange}
                      onInitialLoad={onInitialLoad}
                      setOnInitialLoad={setOnInitialLoad}
                    />
                  </>
                )}

                {/* Ders ve Alt Konu Seçici - Kişiselleştirilmiş sınav için gerekli */}
                {quizType === "personalized" && personalizedQuizType !== "weakTopicFocused" && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Ders ve Alt Konu Seçimi
                    </h4>
                    <CourseTopicSelector
                      courses={courses}
                      selectedCourseId={selectedCourseId}
                      handleCourseChange={handleCourseChangeAdapter}
                      courseTopics={courseTopics}
                      selectedTopicIds={selectedTopicIds}
                      handleTopicToggle={handleTopicToggle}
                      topicSubTopics={topicSubTopics}
                      selectedSubTopicIds={selectedSubTopicIds}
                      handleSubTopicToggle={handleSubTopicToggle}
                      quizType={quizType}
                      personalizedQuizType={personalizedQuizType}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Adım 3: Tercihler */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderPreferencesStep()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gezinme Butonları */}
        <div className="flex justify-between mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              currentStep === 1
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            }`}
          >
            <FiArrowLeft className="mr-1.5" size={16} /> Geri
          </button>

          <button
            onClick={nextStep}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-sm flex items-center transition-colors shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={
              (currentStep === 1 && uploadStatus !== "success") || // İlk adımda yükleme bitmeden ilerlemeyi engelle
              topicDetectionStatus === "loading" || // Konu tespiti devam ederken ilerlemeyi engelle
              quizCreationLoading // Sınav oluşturma devam ederken butonu devre dışı bırak
            }
          >
            {currentStep === totalSteps 
              ? quizCreationLoading 
                ? "Sınav Oluşturuluyor..."
                : "Sınavı Oluştur" 
              : "Devam Et"
            }{" "}
            {topicDetectionStatus === "loading" || quizCreationLoading ? (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
            <FiArrowRight className="ml-1.5" size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
