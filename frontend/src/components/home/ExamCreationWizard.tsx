/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import {
  FiClock,
  FiTarget,
  FiArrowRight,
  FiArrowLeft,
  FiZap,
  FiAward,
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
import { Course, DetectedSubTopic, QuizPreferences } from "@/types";

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

  // Sınav oluşturma durumu için yeni state
  const [quizCreationLoading] = useState(false);

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
    learningTargetService.getLearningTargets(selectedCourseId).then((targets) => {
      // DetectedSubTopic tipine dönüştür
      const detected: DetectedSubTopic[] = targets.map((t) => ({
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
    } else if (value === "") {
      // Input boşsa state'i undefined yapabiliriz ama kullanıcı deneyimi için 0 veya 1 gibi min değer daha iyi olabilir.
      // Şimdilik minimum 1 varsayalım.
      handlePreferenceChange("timeLimit", 1);
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
        console.log(`[ECW detectTopicsFromUploadedFile] 📄 Belge yükleme başarılı! Belge ID: ${documentId}`);
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
            processedTopics = (responseData as TopicsResponseData).topics!.map((topic: TopicResponse) => ({
              id: topic.normalizedSubTopicName || topic.subTopicName || generateId('topic'),
              subTopicName: topic.subTopicName || 'Bilinmeyen Konu',
              normalizedSubTopicName: normalizeStr(topic.normalizedSubTopicName || topic.subTopicName),
              isSelected: false 
            }));
            console.log(`[ECW detectTopicsFromUploadedFile] ✓ ${processedTopics.length} konu işlendi (yeni format)`);
          } else if (Array.isArray(responseData)) {
            console.log(`[ECW detectTopicsFromUploadedFile] 📋 Eski API formatı tespit edildi (dizi)`);
            if (responseData.length > 0 && typeof responseData[0] === 'object' && responseData[0] !== null && 'id' in responseData[0]){
              processedTopics = responseData.map((topic: any) => ({
                id: topic.id || topic.normalizedSubTopicName || topic.subTopicName || generateId('detected'),
                subTopicName: topic.subTopicName || topic.name || 'Bilinmeyen Konu',
                normalizedSubTopicName: normalizeStr(topic.normalizedSubTopicName || topic.id || topic.subTopicName),
                status: topic.status,
                isNew: topic.isNew,
                isSelected: false,
                parentTopic: topic.parentTopic
              } as DetectedSubTopic));
            } else {
              processedTopics = responseData.map((topic: any, index: number) => {
                if (typeof topic === 'string') {
                  return {
                    id: normalizeStr(topic) || generateId(`str-${index}`),
                    subTopicName: topic, 
                    normalizedSubTopicName: normalizeStr(topic),
                    isSelected: false
                  } as DetectedSubTopic;
                }
                return {
                  id: normalizeStr(String(topic.id || topic.normalizedSubTopicName || topic.subTopicName)) || generateId(`obj-${index}`),
                  subTopicName: String(topic.subTopicName || topic.name || `Bilinmeyen Konu ${index + 1}`),
                  normalizedSubTopicName: normalizeStr(String(topic.normalizedSubTopicName || topic.id || topic.subTopicName)),
                  isSelected: false
                } as DetectedSubTopic;
              });
            }
            console.log(`[ECW detectTopicsFromUploadedFile] ✓ ${processedTopics.length} konu işlendi (eski format - dizi)`);
          } else {
            console.error(`[ECW detectTopicsFromUploadedFile] ❌ HATA: Beklenmeyen API yanıt formatı:`, responseData);
            processedTopics = [];
          }
          
          console.log(`[ECW detectTopicsFromUploadedFile] 📊 Son işlenen konular (${processedTopics.length}):`, JSON.stringify(processedTopics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
          
          if (processedTopics.length > 0) {
            setDetectedTopics(processedTopics);
            setTopicDetectionStatus("success");
            console.log('[ECW detectTopicsFromUploadedFile] ✅ Konu tespiti başarılı, adım 2\'ye geçiliyor.');
            setCurrentStep(2); 
            ErrorService.showToast(`${processedTopics.length} konu tespit edildi.`, "success");
          } else {
             console.warn(`[ECW detectTopicsFromUploadedFile] ⚠️ UYARI: Tespit edilen konu yok!`);
            ErrorService.showToast("Belgede konu tespit edilemedi. Varsayılan konular kullanılacak.", "info");
            const defaultTopics = generateDefaultTopicsFromFileName(file.name);
            setDetectedTopics(defaultTopics);
            setTopicDetectionStatus("success");
            console.log('[ECW detectTopicsFromUploadedFile] ℹ️ Konu tespit edilemedi, dosya adından varsayılan konular oluşturuldu, adım 2\'ye geçiliyor.');
            setCurrentStep(2);
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

  // handleFinalSubmit fonksiyonunu güçlendirelim
  const handleFinalSubmit = async () => {
    console.log('[ECW handleFinalSubmit] Start.');
    console.log('[ECW handleFinalSubmit] Current selectedTopicIds STATE:', JSON.stringify(selectedTopicIds));
    console.log('[ECW handleFinalSubmit] Current selectedSubTopicIds STATE:', JSON.stringify(selectedSubTopicIds));
    console.log('[ECW handleFinalSubmit] Current detectedTopics STATE:', JSON.stringify(detectedTopics.map(t => ({id: t.id, name: t.subTopicName, selected: t.isSelected}))));
    console.log('[ECW handleFinalSubmit] Current preferences STATE:', JSON.stringify(preferences));
    try {
      console.log("🏁 Tüm adımlar tamamlandı (3/3). Sınav oluşturma için gerekli veriler hazırlanıyor...");
      
      // Seçilen konu ve alt konuların durumunu kontrol et ve logla
      console.log("🔍 Seçilen konular kontrol ediliyor:", {
        selectedTopicIdsFromState: selectedTopicIds, // Renamed for clarity
        selectedSubTopicIdsFromState: selectedSubTopicIds, // Renamed for clarity
        quizType: quizType,
        personalizedQuizType: personalizedQuizType
      });
      
      const effectiveTopicIds = (() => {
        if (selectedTopicIds && selectedTopicIds.length > 0) {
          console.log('[ECW handleFinalSubmit] Using selectedTopicIds from state for effectiveTopicIds:', JSON.stringify(selectedTopicIds));
          return selectedTopicIds;
        } else if (detectedTopics && detectedTopics.length > 0) {
          const selectedFromDetected = detectedTopics.filter(t => t.isSelected).map(t => t.id);
          if (selectedFromDetected.length > 0) {
            console.log(`[ECW handleFinalSubmit] ⚠️ selectedTopicIds state boş, detectedTopics'den ${selectedFromDetected.length} seçili konu bulundu. Bunlar kullanılacak:`, JSON.stringify(selectedFromDetected));
            return selectedFromDetected;
          }
        }
        console.log('[ECW handleFinalSubmit] effectiveTopicIds is empty after all checks.');
        return [];
      })();
      
      const effectiveSubTopicIds = (() => {
        if (selectedSubTopicIds && selectedSubTopicIds.length > 0) {
            console.log('[ECW handleFinalSubmit] Using selectedSubTopicIds from state for effectiveSubTopicIds:', JSON.stringify(selectedSubTopicIds));
          return selectedSubTopicIds;
        } else if (detectedTopics && detectedTopics.length > 0) {
          // This fallback for subtopics might not be correct if subtopics aren't 1:1 with topics
          const selectedFromDetected = detectedTopics.filter(t => t.isSelected).map(t => t.id);
          if (selectedFromDetected.length > 0) {
            console.log(`[ECW handleFinalSubmit] ⚠️ selectedSubTopicIds state boş, detectedTopics'den (varsayılan olarak ana konular) ${selectedFromDetected.length} seçili alt konu bulundu:`, JSON.stringify(selectedFromDetected));
            return selectedFromDetected;
          }
        }
        console.log('[ECW handleFinalSubmit] effectiveSubTopicIds is empty after all checks.');
        return [];
      })();
      
      console.log("[ECW handleFinalSubmit] 🔄 Kullanılacak effectiveTopicIds:", JSON.stringify(effectiveTopicIds));
      console.log("[ECW handleFinalSubmit] 🔄 Kullanılacak effectiveSubTopicIds:", JSON.stringify(effectiveSubTopicIds));
      
      // Son tercihleri oluştur
      const finalPreferences: QuizPreferences = {
        ...preferences,
        topicIds:
          (quizType === "personalized" && personalizedQuizType !== "weakTopicFocused") 
            ? effectiveTopicIds 
            : (quizType === "quick" && effectiveTopicIds.length > 0 ? effectiveTopicIds : undefined),
        subTopicIds:
          (quizType === "personalized" && personalizedQuizType !== "weakTopicFocused") 
            ? effectiveSubTopicIds 
            : (quizType === "quick" && effectiveSubTopicIds.length > 0 ? effectiveSubTopicIds : undefined)
      };
      console.log('[ECW handleFinalSubmit] Final preferences for result:', JSON.stringify(finalPreferences));

      const topicNameMap: Record<string, string> = {};
      if (detectedTopics) {
        detectedTopics.forEach(topic => {
          topicNameMap[topic.id] = topic.subTopicName;
        });
      }
      console.log('[ECW handleFinalSubmit] topicNameMap created:', JSON.stringify(topicNameMap));

      const result = {
        file:
          quizType === "personalized" &&
          personalizedQuizType === "weakTopicFocused"
            ? null
            : selectedFile, 
        quizType,
        personalizedQuizType:
          quizType === "personalized" ? personalizedQuizType : undefined,
        preferences: finalPreferences,
        topicNameMap: topicNameMap
      };

      console.log('[ECW handleFinalSubmit] Final result object for onComplete:', JSON.stringify(result));
      console.log(
        `📊 SINAV BİLGİLERİ (handleFinalSubmit):
        - Tür: ${result.quizType}
        - Alt tür: ${result.personalizedQuizType || "N/A"}
        - Soru sayısı: ${result.preferences.questionCount}
        - Zorluk: ${result.preferences.difficulty}
        - Süre: ${result.preferences.timeLimit ? `${result.preferences.timeLimit} dakika` : "Limitsiz"}
        - Seçilen konular (topicIds): ${result.preferences.topicIds?.join(', ') || "Yok"}
        - Seçilen alt konular (subTopicIds): ${result.preferences.subTopicIds?.join(', ') || "Yok"}
        `
      );

      if (!result || !result.quizType) {
        console.error("[ECW handleFinalSubmit] ⚠️ Geçersiz sınav oluşturma sonucu");
        ErrorService.showToast("Sınav oluşturma verileri hazırlanamadı. Lütfen tekrar deneyin.", "error");
        return;
      }

      if (typeof onComplete === 'function') {
        console.log("[ECW handleFinalSubmit] 🔄 onComplete fonksiyonu çağrılıyor...");
        onComplete(result);
      } else {
        console.error("[ECW handleFinalSubmit] ⚠️ onComplete fonksiyonu tanımlı değil");
        ErrorService.showToast("Sınav oluşturma işlemi tamamlanamadı. İşlev tanımlı değil.", "error");
      }
    } catch (error) {
      console.error("[ECW handleFinalSubmit] ❌ Hata:", error);
      ErrorService.showToast("Sınav oluşturma bilgileri hazırlanamadı. Lütfen tekrar deneyin.", "error");
    }
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                {quizType === "personalized" ? "3. Sınav Tercihleri" : "3. Sınav Tercihleri"}
              </h3>

              {/* Seçilen Sınav Türü Bilgisi */}
              <div className="mb-6 p-4 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-white ${quizType === "quick" ? "bg-blue-500" : "bg-purple-500"}`}
                  >
                    {quizType === "quick" ? (
                      <FiClock size={14} />
                    ) : (
                      <FiTarget size={14} />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    {quizType === "quick"
                      ? "Hızlı Sınav"
                      : personalizedQuizType === "weakTopicFocused"
                        ? "Kişiselleştirilmiş: Zayıf/Orta Odaklı"
                        : personalizedQuizType === "learningObjectiveFocused"
                          ? "Kişiselleştirilmiş: Öğrenme Hedefi Odaklı"
                          : personalizedQuizType === "newTopicFocused"
                            ? "Kişiselleştirilmiş: Yeni Konu Odaklı"
                            : "Kişiselleştirilmiş: Kapsamlı"}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-400 mt-1.5 ml-9">
                  {quizType === "quick" &&
                    "Tek bir belge içeriğini yapay zeka ile hızlıca analiz eder ve değerlendirir. Anında sonuç ve detaylı geri bildirim alırsınız."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "weakTopicFocused" &&
                    "Yapay zeka, geçmiş performansınızı analiz ederek zayıf olduğunuz konulara odaklanır. Eksiklerinizi tamamlamanıza yardımcı olacak kişiselleştirilmiş sorular sunar."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "learningObjectiveFocused" &&
                    "Belirlediğiniz öğrenme hedeflerine ulaşma durumunuzu yapay zeka yardımıyla ölçer. Hedeflerinize ilerleyişinizi görselleştirir ve kişiselleştirilmiş öneriler sunar."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "newTopicFocused" &&
                    "Yüklenen belgeden yapay zeka ile tespit edilen yeni konuları test eder ve bilgi seviyenizi ölçer. Yeni öğrenme alanlarını keşfetmenizi sağlar."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "comprehensive" &&
                    "Yapay zeka, yeni içerik ile mevcut öğrenme hedeflerinizi birleştirerek kapsamlı bir sınav oluşturur. Tüm bilgi alanlarınızı dengeli şekilde değerlendirir."}
                </p>
              </div>

              <div className="space-y-6">
                {/* Soru Sayısı */}
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
                      max={quizType === "quick" ? 20 : 30} // Kişiselleştirilmiş için limit artırılabilir
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

                {/* Zorluk Seviyesi */}
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

                {/* Zaman Sınırı */}
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
                          max="180" // Makul bir üst limit
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
