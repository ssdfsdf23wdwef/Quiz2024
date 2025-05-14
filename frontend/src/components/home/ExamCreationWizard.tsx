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
import { useRouter } from "next/navigation";
import { QuizPreferences, DetectedSubTopic, Course } from "@/types";
import { DocumentUploader } from "../document";
import TopicSelectionScreen from "./TopicSelectionScreen";
import { ErrorService } from "@/services/error.service";
import ExamCreationProgress from "./ExamCreationProgress";
import CourseTopicSelector from "./CourseTopicSelector";
import courseService from "@/services/course.service";
import learningTargetService from "@/services/learningTarget.service";
import documentService from "@/services/document.service";
import authService from "@/services/auth.service";
import axios from "axios";

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
  }) => void;
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
    // Önceki seçilen alt konuları filtrele
    const validSubTopicIds = selectedSubTopicIds.filter((id) => {
      const subTopic = topicSubTopics.find(
        (st: DetectedSubTopic) => st.id === id,
      );
      return subTopic && selectedTopicIds.includes(subTopic.id);
    });

    // Sadece değişiklik varsa state güncelle
    const isSame =
      validSubTopicIds.length === selectedSubTopicIds.length &&
      validSubTopicIds.every((id, idx) => id === selectedSubTopicIds[idx]);
    if (!isSame) {
      setSelectedSubTopicIds(validSubTopicIds);
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        topicIds: [...selectedTopicIds],
        subTopicIds: [...validSubTopicIds],
      }));
    } else {
      // Eğer değişiklik yoksa yine de preferences güncellensin ki step geçişlerinde kaybolmasın
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        topicIds: [...selectedTopicIds],
        subTopicIds: [...validSubTopicIds],
      }));
    }
  }, [selectedTopicIds, selectedSubTopicIds, topicSubTopics]);

  // Dosya yükleme işlemi tamamlandığında
  const handleFileUploadComplete = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus("success");

    try {
      console.log(`📂 Dosya yükleme başarılı: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Dosya yükleme işlemi
      console.log(`📤 Dosya backend'e yükleniyor...`);
      let uploadedDocument = null;
      
      try {
        // Backend tarafından yeni eklenen Document yanıtından ID'yi alıyoruz
        uploadedDocument = await documentService.uploadDocument(
          file,
          undefined,
          (progress) => {
            console.log(`📤 Yükleme ilerleme: %${progress.toFixed(0)}`);
          }
        );
        
        const documentId = uploadedDocument.id;
        console.log(`📄 Belge yükleme başarılı! Belge ID: ${documentId}`);
      } catch (uploadError) {
        console.error(`❌ HATA: Dosya yükleme başarısız! ${uploadError instanceof Error ? uploadError.message : 'Bilinmeyen hata'}`);
        
        // Firebase Storage hatası için daha açıklayıcı mesaj
        if (uploadError instanceof Error && uploadError.message?.includes('bucket does not exist')) {
          ErrorService.showToast(
            "Firebase Storage hatası: Storage bucket yapılandırması eksik veya hatalı. Sistem yöneticinize başvurun.",
            "error"
          );
        } else if (uploadError && typeof uploadError === 'object' && 'response' in uploadError && 
                  uploadError.response && typeof uploadError.response === 'object' && 
                  'status' in uploadError.response && uploadError.response.status === 500) {
          ErrorService.showToast(
            "Sunucu hatası: Dosya yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            "error"
          );
        } else {
          ErrorService.showToast(
            `Dosya yükleme hatası: ${uploadError instanceof Error ? uploadError.message : 'Bilinmeyen hata'}`,
            "error"
          );
        }
        
        setUploadStatus("error");
        return;
      }
      
      // Kişiselleştirilmiş sınav ve Zayıf/Orta odaklı seçilmişse direkt tercihlere geç
      if (
        quizType === "personalized" &&
        personalizedQuizType === "weakTopicFocused"
      ) {
        console.log(`✓ Kişiselleştirilmiş sınav (Zayıf/Orta) seçildi: Konu tespiti atlanıyor`);
        // Direkt ayarlar adımına geç
        setCurrentStep(3);
        return;
      }

      // Döküman ID'si mevcut olduğunda konuları tespit et
      const documentId = uploadedDocument?.id;
      
      if (documentId) {
        try {
          console.log(`🔍 Belge ID ${documentId} için konu tespiti başlatılıyor...`);
          
          // Konuları tespit et - metin boş ama belge ID'si ile istek yapılıyor
          console.log(`Konu tespiti için belge ID kullanılıyor: ${documentId}`);
          const detectedTopicsRequest = {
            documentId: documentId,
            documentText: "", // Boş metin, backend belge ID'den metni alacak
            courseId: selectedCourseId || ""
          };
          
          // Token yenileme işlemi
          try {
            console.log(`🔑 Kimlik doğrulama token'ı yenileniyor...`);
            await authService.refreshToken();
            console.log(`✅ Token yenileme başarılı!`);
          } catch (tokenError) {
            console.error(`❌ Token yenileme hatası:`, tokenError);
            // Token yenileme hatası aldıysak, kullanıcının oturumunu tekrar giriş yapması gerekebilir
            ErrorService.showToast(
              "Oturum süresi dolmuş olabilir. Lütfen sayfayı yenileyip tekrar giriş yapın.",
              "error"
            );
            setUploadStatus("error");
            return;
          }
          
          // Yeni token alındıktan sonra Manuel olarak axios ile istek yapalım
          const token = localStorage.getItem("auth_token");
          if (!token) {
            throw new Error("Kimlik doğrulama token'ı bulunamadı");
          }
          
          console.log(`🔍 Yeni token ile konu tespiti yapılıyor...`);
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/learning-targets/detect-topics`;
          
          const response = await axios.post(
            apiUrl,
            detectedTopicsRequest,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`✅ Konular başarıyla tespit edildi:`, response.data);
          
          // Sunucudan gelen yanıtı doğru formatta işle
          let processedTopics: DetectedSubTopic[] = [];
          const responseData = response.data;
          
          if (responseData && 'topics' in responseData && Array.isArray(responseData.topics)) {
            // Yeni format - alt konu yapısı mevcut
            processedTopics = responseData.topics.map((topic: DetectedSubTopic) => ({
              id: topic.normalizedSubTopicName, // id için normalizedSubTopicName kullan
              subTopicName: topic.subTopicName,
              normalizedSubTopicName: topic.normalizedSubTopicName,
              isSelected: false
            }));
            console.log(`📊 API'den gelen konular işlendi:`, processedTopics);
          } else if (Array.isArray(responseData)) {
            // Eski format - düz string dizisi veya doğrudan DetectedSubTopic dizisi
            if (responseData.length > 0 && 'id' in responseData[0]) {
              // Zaten DetectedSubTopic formatında
              processedTopics = responseData as DetectedSubTopic[];
            } else {
              // String dizisi veya diğer format
              processedTopics = responseData.map((topic: unknown) => {
                if (typeof topic === 'string') {
                  return {
                    id: topic,
                    subTopicName: topic, 
                    normalizedSubTopicName: topic,
                    isSelected: false
                  };
                } else if (topic && typeof topic === 'object') {
                  // Type guard: topic is object
                  const topicObj = topic as Record<string, unknown>;
                  // Her türlü özellik kontrolünü yap
                  const topicName = typeof topicObj.subTopicName === 'string' ? topicObj.subTopicName : 
                                   (typeof topicObj.name === 'string' ? topicObj.name as string : '');
                                   
                  const normalizedName = typeof topicObj.normalizedSubTopicName === 'string' ? topicObj.normalizedSubTopicName as string :
                                        (typeof topicObj.normalizedName === 'string' ? topicObj.normalizedName as string : topicName);
                                      
                  return {
                    id: normalizedName || topicName,
                    subTopicName: topicName,
                    normalizedSubTopicName: normalizedName,
                    isSelected: false
                  };
                } else {
                  // Geçersiz veri durumunda boş bir item dön
                  return {
                    id: 'unknown',
                    subTopicName: 'Bilinmeyen Konu', 
                    normalizedSubTopicName: 'unknown',
                    isSelected: false
                  };
                }
              });
            }
            console.log(`📊 Formatlanmış konular:`, processedTopics);
          } else {
            console.error(`❌ HATA: Beklenmeyen yanıt formatı:`, responseData);
            processedTopics = [];
          }
          
          if (processedTopics.length > 0) {
            setDetectedTopics(processedTopics);
            setCurrentStep(2); // Konu seçim ekranına geç
          } else {
            console.error(`❌ HATA: Tespit edilen konu yok!`);
            ErrorService.showToast(
              "Belgede konu tespit edilemedi. Lütfen başka bir belge deneyin.",
              "error"
            );
          }
        } catch (error) {
          console.error(`❌ HATA: Konu tespiti başarısız! ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
          ErrorService.showToast(
            `Konular tespit edilirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
            "error"
          );
        }
      } else {
        console.error(`❌ HATA: Belge ID bulunamadı!`);
        ErrorService.showToast(
          "Belge yüklendi ancak ID alınamadı. Lütfen tekrar deneyin.",
          "error"
        );
      }
    } catch (error) {
      console.error(`❌ HATA: Dosya yükleme işlemi başarısız! ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      ErrorService.showToast(
        `Dosya işlenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        "error"
      );
      setUploadStatus("error");
    }
  };

  // Dosya yükleme hatası
  const handleFileUploadError = (errorMsg: string) => {
    console.error(`❌ HATA: Dosya yükleme hatası: ${errorMsg}`);
    setUploadStatus("error");
    ErrorService.showToast(errorMsg, "error");
  };

  // Konuları tespit et
  const handleTopicsDetected = (selectedTopics: string[]) => {
    // Tespit edilen konular seçildiğinde
    console.log(`📋 KONULAR SEÇİLDİ: ${selectedTopics.length} adet konu seçildi`);
    console.log(`🔍 Seçilen konular: ${selectedTopics.join(', ')}`);
    
    if (selectedTopics.length > 0) {
      setSelectedTopicIds(selectedTopics);
      console.log(`✅ Seçilen konular state'e kaydedildi: ${selectedTopics.length} adet`);

      // Tercihleri güncelle
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        topicIds: selectedTopics,
      }));
      console.log(`✅ Quiz tercihleri güncellendi. Konu ID'leri: ${selectedTopics.length} adet`);
    } else {
      console.warn(`⚠️ Hiç konu seçilmedi!`);
    }

    // Konu seçiminden sonra tercihler adımına geç (artık adım 3)
    console.log(`🔄 Adım 3'e (Tercihler) geçiliyor...`);
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
      let nextStep = currentStep + 1;

      // Akış Atlama Mantığı
      // Zayıf/Orta Odaklı: Adım 1'den Adım 3'e atla (Konu Seçimi yok)
      if (
        quizType === "personalized" &&
        personalizedQuizType === "weakTopicFocused" &&
        currentStep === 1
      ) {
        console.log(`🔄 Akış değişikliği: Zayıf/Orta odaklı sınav türü için Adım 1'den Adım 3'e atlıyoruz`);
        nextStep = 3;
      }

      console.log(`✅ Adım ${currentStep}'den Adım ${nextStep}'e ilerletiliyor...`);
      setCurrentStep(nextStep);
    } else {
      // Tamamlandı
      console.log(`🏁 Tüm adımlar tamamlandı (${currentStep}/${totalSteps}). Sınav oluşturma için gerekli veriler hazırlanıyor...`);
      if (onComplete) {
        // Son tercihleri oluştur
        const finalPreferences: QuizPreferences = {
          ...preferences,
          topicIds:
            quizType === "personalized" &&
            personalizedQuizType !== "weakTopicFocused"
              ? selectedTopicIds
              : undefined,
          subTopicIds:
            quizType === "personalized" &&
            personalizedQuizType !== "weakTopicFocused"
              ? selectedSubTopicIds
              : undefined,
        };

        console.log(`📊 SINAV BİLGİLERİ:
        - Tür: ${quizType}
        - Alt tür: ${quizType === "personalized" ? personalizedQuizType : "N/A"}
        - Soru sayısı: ${preferences.questionCount}
        - Zorluk: ${preferences.difficulty}
        - Süre: ${preferences.timeLimit ? preferences.timeLimit + ' dakika' : 'Limitsiz'}
        - Seçilen konular: ${selectedTopicIds.length > 0 ? selectedTopicIds.length : 'Yok'}
        - Seçilen alt konular: ${selectedSubTopicIds.length > 0 ? selectedSubTopicIds.length : 'Yok'}
        `);

        console.log(`🔄 onComplete fonksiyonu çağrılıyor...`);
        onComplete({
          file:
            quizType === "personalized" &&
            personalizedQuizType === "weakTopicFocused"
              ? null
              : selectedFile, // Zayıf odaklıda dosya yok
          quizType,
          personalizedQuizType:
            quizType === "personalized" ? personalizedQuizType : undefined,
          preferences: finalPreferences,
        });
      } else {
        // Sınav oluşturma sayfasına yönlendir
        const params = new URLSearchParams();
        params.set("type", quizType);
        if (quizType === "personalized" && personalizedQuizType) {
          params.set("personalizedType", personalizedQuizType);
        }
        if (selectedFile && (quizType !== "personalized" || personalizedQuizType !== "weakTopicFocused")) {
          params.set("fileName", selectedFile.name);
        }

        const url = `/exams/create?${params.toString()}`;
        console.log(`🔄 Yönlendirme: ${url} adresine yönlendiriliyor...`);
        router.push(url);
      }
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
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {quizType === "personalized" ? "Konu Seçimi" : "2. Konu Seçimi"}
                </h4>

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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Yüklediğiniz belgeden yapay zeka tarafından tespit edilen konular aşağıdadır. Sınava dahil etmek istediklerinizi seçin.
                    </p>
                    {/* AI Konu Tespiti ve Seçim Ekranı */}
                    <TopicSelectionScreen
                      detectedTopics={detectedTopics}
                      existingTopics={courseTopics} 
                      availableCourses={courses}
                      selectedCourseId={selectedCourseId}
                      quizType={quizType}
                      personalizedQuizType={personalizedQuizType}
                      onTopicsSelected={handleTopicsDetected}
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
            disabled={currentStep === 1 && uploadStatus !== "success"} // İlk adımda yükleme bitmeden ilerlemeyi engelle
          >
            {currentStep === totalSteps ? "Sınavı Oluştur" : "Devam Et"}{" "}
            <FiArrowRight className="ml-1.5" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
