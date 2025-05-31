/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import {
  FiTarget,
  FiZap,
  FiAward,
  FiArrowLeft,
  FiArrowRight,
  FiInfo,
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
} from "@/types";
import { toast } from "react-hot-toast";
import quizService from "@/services/quiz.service";
import { SubTopicItem as SubTopic } from "@/types/quiz.type"; // Updated import
import { LearningTarget } from "@/types/learningTarget.type";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/error.service"; 
import { Quiz } from "@/types";



interface ExamCreationWizardProps {
  quizType: "quick" | "personalized"; // Dışarıdan gelen sınav türü
  initialDocumentId?: string; // URL'den gelen belge ID'si
  initialTopics?: string[]; // URL'den gelen konular
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
    quiz?: Quiz; // Quiz nesnesi (quiz.service.ts'den dönen)
    quizId?: string;
    documentId?: string;
    status?: 'success' | 'error';
    error?: Error | ApiError; // Hata durumu
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
  initialDocumentId,
  initialTopics,
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
  const [selectedTopicsList, setSelectedTopicsList] = useState<string[]>(initialTopics || []);
  const [onInitialLoad, setOnInitialLoad] = useState<boolean>(true);

  // Sınav oluşturma durumu için yeni state
  const [quizCreationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Belge metni ve belge ID'si
  const [documentTextContent, setDocumentTextContent] = useState<string>("");
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string>(initialDocumentId || "");
  
  // Seçilen konular (alt konu olarak)
  const [selectedTopics, setSelectedTopics] = useState<SubTopic[]>([]);

  // Kişiselleştirilmiş sınav alt türü - sadece personalized modda kullanılıyor
  const [personalizedQuizType, setPersonalizedQuizType] = useState<
    "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive"
  >("comprehensive");

  const handlePersonalizedQuizTypeSelect = (
    type: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive",
  ) => {
    console.log(`🔄 Kişiselleştirilmiş sınav alt türü değişiyor: ${personalizedQuizType} -> ${type}`);
    setPersonalizedQuizType(type);
    
    // Tip uyumluluğunu sağlamak için preferences'ı uygun tipte güncelliyoruz
    const updatedPreferences: QuizPreferences = {
      ...preferences,
      // TypeScript ile uyumlu olması için tip dönüşümü yapıyoruz
      personalizedQuizType: type as "weakTopicFocused" | "newTopicFocused" | "comprehensive" | undefined,
    };
    
    console.log(`✅ Quiz tercihleri güncellendi: personalizedQuizType = ${type}`);
    setPreferences(updatedPreferences);
  };

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

  // URL'den belge ID ve konular alındıysa otomatik olarak işle
  useEffect(() => {
    if (initialDocumentId && initialDocumentId.trim() !== "" && currentStep === 1) {
      console.log('[ECW useEffect] URL üzerinden belge ID algılandı:', initialDocumentId);
      setUploadedDocumentId(initialDocumentId);
      
      // Belge metin içeriğini yükle
      documentService.getDocumentText(initialDocumentId)
        .then(response => {
          setDocumentTextContent(response.text);
          console.log('[ECW useEffect] Belge metni yüklendi, uzunluk:', response.text.length);
          
          // Konu teşhisi için adım 2'ye geç
          setCurrentStep(2);
          
          // Belge içeriğinden varsayılan konu oluştur
          if ((!initialTopics || initialTopics.length === 0) && response.text) {
            const defaultTopicId = `belge-${initialDocumentId.substring(0, 8)}`;
            const defaultTopic: DetectedSubTopic = {
              id: defaultTopicId,
              subTopicName: "Belge İçeriği",
              normalizedSubTopicName: defaultTopicId,
              isSelected: true
            };
            
            setDetectedTopics([defaultTopic]);
            setSelectedTopicIds([defaultTopicId]);
            setSelectedSubTopicIds([defaultTopicId]);
            
            const subTopicItem: SubTopic = {
              subTopic: "Belge İçeriği",
              normalizedSubTopic: defaultTopicId
            };
            setSelectedTopics([subTopicItem]);
            
            console.log('[ECW useEffect] Varsayılan konu oluşturuldu:', subTopicItem);
          }
        })
        .catch(error => {
          console.error('[ECW useEffect] Belge metni yüklenirken hata:', error);
          ErrorService.showToast("Belge içeriği yüklenemedi, lütfen tekrar deneyin.", "error");
        });
    }
    
    // İlk konular belirtilmişse
    if (initialTopics && initialTopics.length > 0 && currentStep === 1) {
      console.log('[ECW useEffect] URL üzerinden konular algılandı:', initialTopics);
      setSelectedTopicIds(initialTopics);
      setSelectedSubTopicIds(initialTopics);
      
      // Konu adları bilinmediğinden varsayılan isimleri kullan
      const subTopicItems: SubTopic[] = initialTopics.map((topicId, index) => ({
        subTopic: `Konu ${index + 1}`,
        normalizedSubTopic: topicId
      }));
      
      setSelectedTopics(subTopicItems);
      console.log('[ECW useEffect] URL konuları alt konulara dönüştürüldü:', subTopicItems);
      
      // Belge ve konular hazır, adım 3'e geç
      if (initialDocumentId) {
        setCurrentStep(3);
      }
    }
  }, [initialDocumentId, initialTopics, currentStep]);

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
    setUploadStatus("error");
    ErrorService.showToast(errorMsg, "error");
  };

  // Konuları tespit et
  const handleTopicsDetected = (selectedTopics: string[], courseId: string) => {
   

    if (courseId) {
      setSelectedCourseId(courseId);
    }

    if (selectedTopics && selectedTopics.length > 0) {
      setSelectedTopicIds(selectedTopics); // Update state
      console.log('[ECW handleTopicsDetected] setSelectedTopicIds called with:', JSON.stringify(selectedTopics));
      
      // Alt konular oluştur ve güncelle
      const subTopicItems: SubTopic[] = selectedTopics.map(topicId => {
        const topic = detectedTopics.find(t => t.id === topicId);
        if (!topic) {
          console.warn(`[ECW handleTopicsDetected] UYARI: ${topicId} ID'li konu bulunamadı!`);
          return {
            subTopic: topicId,  // Konu bulunamazsa ID'yi kullan
            normalizedSubTopic: topicId
          };
        }
        return {
          subTopic: topic.subTopicName,
          normalizedSubTopic: topic.id
        };
      });
      
      console.log('[ECW handleTopicsDetected] Created subTopicItems:', JSON.stringify(subTopicItems));
      setSelectedTopics(subTopicItems);
      
      // Alt konu ID'lerini güncelle
      const subTopicIds = selectedTopics.map(topicId => topicId);
      setSelectedSubTopicIds(subTopicIds);
      console.log('[ECW handleTopicsDetected] setSelectedSubTopicIds called with:', JSON.stringify(subTopicIds));
      
      // Tercihleri güncelle
      setPreferences(prev => ({
          ...prev,
        topicIds: selectedTopics,
        subTopicIds: subTopicIds
      }));
    } else {
      // Seçilen konular boş ama belge ID varsa, varsayılan bir konu oluştur
      if (uploadedDocumentId) {
        console.log('[ECW handleTopicsDetected] Seçilen konular boş ancak belge yüklenmiş, varsayılan konu oluşturuluyor');
        
        const fileName = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "Belge İçeriği";
        const defaultTopicId = `default-${uploadedDocumentId.substring(0, 8)}`;
        
        // Tek bir varsayılan konu oluştur
        const defaultTopics = [defaultTopicId];
        setSelectedTopicIds(defaultTopics);
        
        // Aynı konu ID'sini alt konu olarak da kullan
        setSelectedSubTopicIds(defaultTopics);
        
        // Görüntülenecek alt konu nesnesi oluştur
        const subTopicItem: SubTopic = {
          subTopic: fileName,
          normalizedSubTopic: defaultTopicId
        };
        setSelectedTopics([subTopicItem]);
        
        console.log('[ECW handleTopicsDetected] Varsayılan konu oluşturuldu:', defaultTopicId, fileName);
        
        // Tercihleri güncelle
        setPreferences(prev => ({
          ...prev,
          topicIds: defaultTopics,
          subTopicIds: defaultTopics
        }));
      }
    }
    
    // Adım 3'e geç
    if (currentStep === 2) {
    setCurrentStep(3);
    }
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

  // Konu seçimlerini değiştirme fonksiyonu - topicSelectionScreen için
  const handleTopicSelectionChange = (selectedTopicIds: string[]) => {
    console.log(`[ECW handleTopicSelectionChange] Konu seçimleri değişiyor: ${selectedTopicIds.length} konu seçildi`);
    
    // Seçilen konu ID'lerini güncelle
    setSelectedTopicIds(selectedTopicIds);
    
    // Seçilen konuların listesini de güncelleyelim
    setSelectedTopicsList(selectedTopicIds);
    
    // Konu listesini güncelle
    const updatedTopics: SubTopic[] = selectedTopicIds.map(topicId => {
      const topic = detectedTopics.find(t => t.id === topicId);
      return {
        subTopic: topic ? topic.subTopicName : topicId,
        normalizedSubTopic: topicId
      };
    });
    
    console.log(`[ECW handleTopicSelectionChange] Güncellenmiş konu listesi: ${JSON.stringify(updatedTopics)}`);
    setSelectedTopics(updatedTopics);
    
    // Alt konuları da güncelle
    setSelectedSubTopicIds(selectedTopicIds);
    
    // Tercihleri güncelle
    setPreferences(prev => ({
      ...prev,
      topicIds: selectedTopicIds,
      subTopicIds: selectedTopicIds
    }));
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
      setPreferences((prev) => ({
        ...prev,
        subTopicIds: updated,
      }));
      console.log(`✅ Quiz tercihleri güncellendi. Alt konu ID'leri: ${updated.length} adet`);
      
      return updated;
    });

    // selectedTopics listesini güncelle (handleFinalSubmit'e gönderilecek olan)
    // Alt konu nesnesini bul
    const subTopic = detectedTopics.find(topic => topic.id === subTopicId);
    
    if (subTopic) {
      setSelectedTopics(prev => {
        // Alt konu zaten var mı kontrol et
        const existingIndex = prev.findIndex(item => item.normalizedSubTopic === subTopicId);
        
        if (existingIndex >= 0) {
          // Alt konu varsa listeden çıkar
          console.log(`✅ Konu selectedTopics listesinden kaldırıldı: ${subTopicId}`);
          return prev.filter(item => item.normalizedSubTopic !== subTopicId);
        } else {
          // Alt konu yoksa listeye ekle
          const newSubTopicItem = {
            subTopic: subTopic.subTopicName,
            normalizedSubTopic: subTopicId
          };
          console.log(`✅ Konu selectedTopics listesine eklendi:`, newSubTopicItem);
          return [...prev, newSubTopicItem];
        }
      });
      console.log(`✅ selectedTopics listesi güncellendi. Şu anda seçili konular:`, selectedTopics);
    } else {
      console.warn(`⚠️ Uyarı: ${subTopicId} ID'sine sahip konu bulunamadı!`);
    }
  };

  // Kişiselleştirilmiş sınav alt türü

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
          
          // Türkçe karakterleri koruyan daha iyi bir normalleştirme fonksiyonu
          const normalizeStr = (str: string = '') => {
            if (!str) return '';
            
            // Adım 1: Trim yapılır
            const trimmed = str.trim();
            
            // Adım 2: Küçük harfe dönüştürülür
            const lowercased = trimmed.toLowerCase();
            
            // Adım 3: Boşluklar çizgiye dönüştürülür
            const replaced = lowercased.replace(/\s+/g, '-');
            
            // Adım 4: Diğer özel karakterler temizlenir ama Türkçe karakterler korunur
            const normalized = replaced.replace(/[^a-z0-9çğıöşüñ\-]/g, '');
            
            console.log(`[ECW normalizeStr] Normalleştirme: "${str}" --> "${normalized}"`);
            
            return normalized;
          };

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
            // Tüm konuları seçili olarak ayarla
            const selectedTopics = processedTopics.map(topic => ({
              ...topic,
              isSelected: true
            }));
            
            setDetectedTopics(selectedTopics);
            setTopicDetectionStatus("success");
            console.log(`[ECW detectTopicsFromUploadedFile] ✅ Konu tespiti başarılı, adım 2'ye geçiliyor.`);
            setCurrentStep(2); 
            ErrorService.showToast(`${processedTopics.length} konu tespit edildi.`, "success");

            // Tüm konuları otomatik olarak seç
            const allTopicIds = selectedTopics.map(topic => topic.id);
            setSelectedTopicIds(allTopicIds);
            setSelectedSubTopicIds(allTopicIds); 
            setPreferences(prev => ({ 
              ...prev, 
              topicIds: allTopicIds,
              subTopicIds: allTopicIds 
            }));
            console.log(`[ECW detectTopicsFromUploadedFile] Tüm konular (${allTopicIds.length}) otomatik seçildi.`);
          } else { 
            console.warn(`[ECW detectTopicsFromUploadedFile] ⚠️ UYARI: Tespit edilen konu yok!`);
            ErrorService.showToast("Belgede konu tespit edilemedi. Varsayılan konular kullanılacak.", "info");
            
            // Varsayılan bir konu oluştur
            const defaultTopicId = `default-${uploadedDocumentId.substring(0, 8)}`;
            const defaultTopicName = selectedFile 
              ? selectedFile.name.replace(/\.[^/.]+$/, "") // Dosya uzantısını kaldır
              : "Belge İçeriği";
            
            const defaultTopic: DetectedSubTopic = {
              id: defaultTopicId,
              subTopicName: defaultTopicName,
              normalizedSubTopicName: defaultTopicName.toLowerCase().replace(/\s+/g, '-'),
              isSelected: true,
              status: undefined,
              isNew: true
            };
            
            const defaultTopics = [defaultTopic];
              setDetectedTopics(defaultTopics);
              setTopicDetectionStatus("success");
            
            setSelectedTopicIds([defaultTopicId]);
            setSelectedSubTopicIds([defaultTopicId]);
            
            // Alt konu olarak da ekle
            const subTopicItem: SubTopic = {
              subTopic: defaultTopicName,
              normalizedSubTopic: defaultTopicId // Değiştirildi: ID'yi kullan, daha tutarlı olması için
            };
            setSelectedTopics([subTopicItem]);
            
            setPreferences(prev => ({
              ...prev,
              topicIds: [defaultTopicId],
              subTopicIds: [defaultTopicId]
            }));
            
            console.log('[ECW detectTopicsFromUploadedFile] ℹ️ Varsayılan konu oluşturuldu, adım 2\'ye geçiliyor.');
              setCurrentStep(2);
            console.log(`[ECW detectTopicsFromUploadedFile] Varsayılan konu ID: ${defaultTopicId}, isim: ${defaultTopicName}`);
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
    if (isSubmitting) return;
      setIsSubmitting(true);
      setErrorMessage(null);
    console.log(
      "[ECW handleFinalSubmit] Başlatıldı. Seçili konular:",
      JSON.stringify(selectedTopics),
      "Tercihler:",
      JSON.stringify(preferences),
      "Dosya:",
      selectedFile?.name,
      "Belge ID:",
      uploadedDocumentId,
      "Metin İçeriği Var Mı:",
      !!documentTextContent,
    );
    
    // Kullanıcıya işlemin başladığını bildiren tost mesajı göster
    toast.loading("Sınav oluşturuluyor... Lütfen bekleyin", {
      duration: 10000, // 10 saniye sonra otomatik kapanır
      id: "quiz-generation-toast"
    });
    
    // Hızlı bir son kontrol yapalım - belge yüklendiyse ama alt konu yoksa
    if (uploadedDocumentId && (!selectedTopics || selectedTopics.length === 0)) {
      console.log("[ECW handleFinalSubmit] Belge yüklendi fakat alt konu seçilmedi - otomatik konu oluşturuluyor");
      
      // Varsayılan bir konu oluştur
      const fileName = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "Belge";
      const defaultTopicId = `belge-${uploadedDocumentId.substring(0, 8)}`;
      
      // Alt konu olarak ekle
      const subTopicItem: SubTopic = {
        subTopic: `${fileName} İçeriği`,
        normalizedSubTopic: defaultTopicId
      };
      
      // State'leri güncelle
      setSelectedTopicIds([defaultTopicId]);
      setSelectedSubTopicIds([defaultTopicId]);
      setSelectedTopics([subTopicItem]);
      
    }

    if (quizType === "quick") {
      if (
        !selectedFile &&
        !uploadedDocumentId &&
        selectedTopics.length === 0
      ) {
        toast.error(
          "Lütfen bir dosya yükleyin veya en az bir konu seçin.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    // Diğer quiz tipleri için diğer doğrulamalar
    if (quizType === "personalized") {
      if (!selectedCourseId) {
        toast.error("Lütfen bir kurs seçin.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      
      // Çalışacağımız konuların listesi - varsayılan bir konu eklememiz gerekebilir
      let topicsToUse = [...selectedTopics];
      
      // Eğer topicsToUse boşsa ve bir belge yüklenmişse, otomatik bir konu oluştur
      if (topicsToUse.length === 0 && (uploadedDocumentId || selectedFile)) {
        const fileName = selectedFile?.name || 'belge';
        const defaultTopicId = `belge-${uploadedDocumentId ? uploadedDocumentId.substring(0, 8) : new Date().getTime()}`;
        topicsToUse = [{
          subTopic: `${fileName.replace(/\.[^/.]+$/, "")} İçeriği`,
          normalizedSubTopic: defaultTopicId
        }];
        
        // State güncellemesi - gerçek bir uygulamada burada yapılmaz ama tutarlılık için ekleyelim
        setSelectedTopicIds([defaultTopicId]);
        setSelectedSubTopicIds([defaultTopicId]);
      }
      
      // API için alt konu nesnelerini oluştur
      const mappedSubTopics = topicsToUse.map((topic) => {
        return {
          subTopic: topic.subTopic,
          normalizedSubTopic: topic.normalizedSubTopic,
        };
      });

      
      // HATA KONTROLÜ: Alt konu sayısı 0 ise, belge ID kontrolü yap
      if (mappedSubTopics.length === 0) {
        
        if (uploadedDocumentId || selectedFile) {
          
        } else {
          toast.error("Lütfen en az bir konu seçin veya bir belge yükleyin.");
          setIsSubmitting(false);
          return;
        }
      }
      
      // preferences.subTopicIds var mı kontrol et
      if (!preferences.subTopicIds || preferences.subTopicIds.length === 0) {
        
        // preferences nesnesini güncelle - doğrudan güncellemek yerine setPreferences kullanmak daha güvenli
        const updatedPreferences = {
          ...preferences,
          subTopicIds: mappedSubTopics.map(topic => topic.normalizedSubTopic)
        };
        setPreferences(updatedPreferences);
      }
      
    // Sınav oluşturma seçenekleri
      const quizOptions: QuizGenerationOptions = {
      quizType: quizType === "quick" ? "general" : quizType,
      courseId: selectedCourseId || undefined,
      personalizedQuizType:
        quizType === "personalized" ? personalizedQuizType : undefined,
      // Kullanılan API'ye göre doğru formatı seçiyoruz
      selectedSubTopics: mappedSubTopics.map(topic => topic.normalizedSubTopic),
      documentId: uploadedDocumentId || undefined,
      preferences: {
        questionCount: preferences.questionCount,
        difficulty: preferences.difficulty as "easy" | "medium" | "hard" | "mixed",
        timeLimit: preferences.timeLimit,
        prioritizeWeakAndMediumTopics: true,
      },
    };


    try {
      
        const quiz = await quizService.generateQuiz(quizOptions);
    
        
    

      const wizardResultData = {
          file: selectedFile,
          quizType: quizType,
          personalizedQuizType,
          preferences: preferences,
          topicNameMap: selectedTopics.reduce((acc, item) => {
            acc[item.normalizedSubTopic] = item.subTopic;
          return acc;
        }, {} as Record<string, string>),
          quiz: quiz,
          quizId: quiz?.id,
        documentId: uploadedDocumentId || undefined,
          status: quiz?.id ? 'success' as const : 'error' as const,
          error: quiz?.id ? undefined : new ApiError("Sınav oluşturulamadı veya ID alınamadı."),
      };

      

        // Başarı durumuna göre yönlendir
        if (quiz?.id) {
          
          if (onComplete) {
            onComplete(wizardResultData);
          } else {
            router.push(`/exams/${quiz.id}/results`);
          }
        } else {
          setErrorMessage("Sınav oluşturuldu ancak ID alınamadı.");
        }
      } catch (error) {
        
        // Detaylı hata bilgisi
        const errorDetails = {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          apiError: error instanceof ApiError ? {
            cause: error.cause,
            name: error.name,
            message: error.message
          } : undefined
        };
        
        // Daha detaylı hata bilgisi
        if (error instanceof ApiError) {
          setErrorMessage(`API Hatası: ${error.message}`);
        } else {
          setErrorMessage(`Hata: ${error instanceof Error ? error.message : String(error)}`);
        }
        
    
      }
    } catch (error) {
      setErrorMessage(`Beklenmeyen hata: ${error instanceof Error ? error.message : String(error)}`);

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
          <div className="bg-secondary p-4 rounded-md">
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
                          toast.dismiss();
                          toast.success("Belge metni başarıyla yüklendi!");
                        } else {
                          toast.dismiss();
                          toast.error("Belge metni yüklenemedi, metin boş veya geçersiz!");
                        }
                      } catch (error) {
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
                  className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="w-12 text-center text-sm font-medium text-primary ml-4 bg-secondary px-2 py-0.5 rounded">
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
                      | "easy"
                      | "medium"
                      | "hard"
                      | "mixed",
                  )
                }
                className="w-full px-3 py-2 border border-primary rounded-md bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-brand-primary text-sm"
              >
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
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
                      className="w-20 px-2 py-1 border border-primary rounded-md bg-primary text-primary focus:outline-none focus:ring-1 focus:ring-border-focus text-sm"
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
    <div className="max-w-3xl mx-auto overflow-hidden relative backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-xl dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-800">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/80 to-indigo-50/50 dark:from-gray-800/50 dark:via-gray-900/80 dark:to-indigo-900/30 -z-10 opacity-80"></div>
      
      {/* Header with gradient border */}
      <div className="p-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 relative overflow-hidden">
        {/* Subtle accent gradient */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-80"></div>
        
        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-100 dark:to-blue-100">
          {quizType === "quick" ? "Hızlı Sınav Oluştur" : "Kişiselleştirilmiş Sınav Oluştur"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
          Yapay zeka destekli kişiselleştirilmiş öğrenme deneyimi için adımları takip edin.
        </p>
      </div>

      <div className="p-6 md:p-8 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
        {/* Progress indicator with enhanced styling */}
        <div className="mb-8">
          <ExamCreationProgress 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            quizType={quizType} 
          />
        </div>

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
              
              {/* Konu tespiti yüklenme durumu - modern glass effect */}
              {topicDetectionStatus === "loading" && (
                <div className="mt-6 p-5 backdrop-blur-sm bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl shadow-sm relative overflow-hidden">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 -z-10 animate-pulse"></div>
                  
                  <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 dark:border-blue-400 border-b-transparent"></div>
                    </div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                      Belge içeriği analiz ediliyor ve konular tespit ediliyor...
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-300 dark:to-indigo-400">
                      2. Sınav Odağı ve Konu Seçimi
                    </h3>
                    <div className="h-0.5 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 opacity-80"></div>
                  </div>
                  
                  {/* Kişiselleştirilmiş Sınav Alt Türleri */}
                  <div className="mt-2 mb-6">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <FiTarget className="mr-2 text-indigo-500 dark:text-indigo-400" />
                      Sınav Odağı Seçin:
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Zayıf/Orta Odaklı Sınav - Glass card with gradient */}
                      <div
                        className={`
                          flex items-center p-4 cursor-pointer transition-all duration-300 rounded-xl relative backdrop-blur-sm
                          ${
                            personalizedQuizType === "weakTopicFocused"
                              ? "bg-gradient-to-r from-indigo-50/90 to-blue-50/90 dark:from-indigo-900/30 dark:to-blue-900/30 border border-indigo-200/70 dark:border-indigo-700/50 shadow-md"
                              : "bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/70 shadow-sm hover:shadow"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("weakTopicFocused")
                        }
                      >
                        {/* Accent gradient line at top */}
                        {personalizedQuizType === "weakTopicFocused" && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-xl"></div>
                        )}
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

                      {/* Öğrenme Hedefi Odaklı Sınav - Glass card with gradient */}
                      <div
                        className={`
                          flex items-center p-4 cursor-pointer transition-all duration-300 rounded-xl relative backdrop-blur-sm
                          ${
                            personalizedQuizType === "learningObjectiveFocused"
                              ? "bg-gradient-to-r from-violet-50/90 to-indigo-50/90 dark:from-violet-900/30 dark:to-indigo-900/30 border border-violet-200/70 dark:border-violet-700/50 shadow-md"
                              : "bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/70 shadow-sm hover:shadow"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("learningObjectiveFocused")
                        }
                      >
                        {/* Accent gradient line at top */}
                        {personalizedQuizType === "learningObjectiveFocused" && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-t-xl"></div>
                        )}
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

                      {/* Yeni Konu Odaklı Sınav - Glass card with gradient */}
                      <div
                        className={`
                          flex items-center p-4 cursor-pointer transition-all duration-300 rounded-xl relative backdrop-blur-sm
                          ${
                            personalizedQuizType === "newTopicFocused"
                              ? "bg-gradient-to-r from-blue-50/90 to-cyan-50/90 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200/70 dark:border-blue-700/50 shadow-md"
                              : "bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/70 shadow-sm hover:shadow"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("newTopicFocused")
                        }
                      >
                        {/* Accent gradient line at top */}
                        {personalizedQuizType === "newTopicFocused" && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl"></div>
                        )}
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

                      {/* Kapsamlı Sınav - Glass card with gradient */}
                      <div
                        className={`
                          flex items-center p-4 cursor-pointer transition-all duration-300 rounded-xl relative backdrop-blur-sm
                          ${
                            personalizedQuizType === "comprehensive"
                              ? "bg-gradient-to-r from-purple-50/90 to-indigo-50/90 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200/70 dark:border-purple-700/50 shadow-md"
                              : "bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/70 shadow-sm hover:shadow"
                          }
                        `}
                        onClick={() =>
                          handlePersonalizedQuizTypeSelect("comprehensive")
                        }
                      >
                        {/* Accent gradient line at top */}
                        {personalizedQuizType === "comprehensive" && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-xl"></div>
                        )}
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
                  <div className="mb-6 p-5 backdrop-blur-sm bg-gradient-to-r from-amber-50/90 to-yellow-50/90 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-100/80 dark:border-amber-800/30 rounded-xl shadow-sm text-amber-800 dark:text-amber-200 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-400 dark:from-amber-500 dark:to-yellow-500"></div>
                    <div className="pl-4">
                      <div className="flex items-center mb-2">
                        <FiInfo className="mr-2 text-amber-500 dark:text-amber-400" />
                        <p className="text-sm font-medium">Bilgi:</p>
                      </div>
                      <p className="text-sm leading-relaxed">
                        Zayıf/Orta Odaklı Sınav seçildiğinde, durumu
                        &lsquo;başarısız&apos; veya &#39;orta&#39; olan mevcut
                        öğrenme hedefleriniz otomatik olarak kullanılır. Bu
                        adımda ek konu seçimi gerekmez.
                      </p>
                    </div>
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
                      
                        handleTopicSelectionChange(selectedTopics);
                        
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

        {/* Navigation Buttons with modern styling */}
        <div className="flex justify-between mt-10 pt-6 border-t border-gray-200/50 dark:border-gray-800/30">
          {/* Back button with subtle glass effect */}
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-5 py-2.5 rounded-xl flex items-center text-sm font-medium transition-all duration-300 backdrop-blur-sm relative ${currentStep === 1
              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
              : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white/50 dark:bg-gray-800/30 hover:bg-white/80 dark:hover:bg-gray-800/50 shadow-sm hover:shadow"}`}
          >
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 opacity-0 ${currentStep !== 1 ? "group-hover:opacity-10" : ""} -z-10`}></div>
            <FiArrowLeft className="mr-2" size={16} /> Geri
          </button>

          {/* Next/Submit button with gradient */}
          <button
            onClick={nextStep}
            className={`px-6 py-2.5 text-white font-medium rounded-xl text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow relative overflow-hidden ${(currentStep === 1 && uploadStatus !== "success") || topicDetectionStatus === "loading" || quizCreationLoading
              ? "opacity-70 cursor-not-allowed bg-indigo-500"
              : "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"}`}
            disabled={
              (currentStep === 1 && uploadStatus !== "success") || // İlk adımda yükleme bitmeden ilerlemeyi engelle
              topicDetectionStatus === "loading" || // Konu tespiti devam ederken ilerlemeyi engelle
              quizCreationLoading // Sınav oluşturma devam ederken butonu devre dışı bırak
            }
          >
            {/* Subtle animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            
            <span className="relative z-10 flex items-center">
              {currentStep === totalSteps 
                ? quizCreationLoading 
                  ? "Sınav Oluşturuluyor..."
                  : "Sınavı Oluştur" 
                : "Devam Et"
              }{" "}
              {topicDetectionStatus === "loading" || quizCreationLoading ? (
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
              ) : (
                <FiArrowRight className="ml-2" size={16} />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
