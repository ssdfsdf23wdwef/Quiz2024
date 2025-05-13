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
import { QuizPreferences } from "@/app/types";
import { DocumentUploader } from "../document";
import TopicSelectionScreen from "./TopicSelectionScreen";
import { ErrorService } from "@/services/error.service";
import ExamCreationProgress from "./ExamCreationProgress";
import CourseTopicSelector from "./CourseTopicSelector";
import courseService from "@/services/course.service";
import learningTargetService from "@/services/learningTarget.service";
import type { Course } from "@/types/course";
import type { DetectedSubTopic } from "@/types/learningTarget";

interface ExamCreationWizardProps {
  onComplete?: (result: {
    file: File | null;
    quizType: "quick" | "personalized";
    personalizedQuizType?:
      | "weakTopicFocused"
      | "newTopicFocused"
      | "comprehensive";
    preferences: QuizPreferences;
  }) => void;
}

export default function ExamCreationWizard({
  onComplete,
}: ExamCreationWizardProps) {
  const router = useRouter();

  // Adım yönetimi
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Dosya yükleme durumu
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  // Sınav türü
  const [quizType, setQuizType] = useState<"quick" | "personalized">("quick");
  const [personalizedQuizType, setPersonalizedQuizType] = useState<
    "weakTopicFocused" | "newTopicFocused" | "comprehensive"
  >("comprehensive");

  // Tercihler
  const [preferences, setPreferences] = useState<QuizPreferences>({
    questionCount: 10,
    difficulty: "mixed",
    timeLimit: undefined,
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

  // Kurs değişimi handler
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourseId(e.target.value);
    setSelectedTopicIds([]);
    setSelectedSubTopicIds([]);
  };

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
  const handleFileUploadComplete = (file: File) => {
    setSelectedFile(file);
    setUploadStatus("success");

    // Personalized türüyse veya hızlıysa bir sonraki adıma geç
    // Zayıf/Orta odaklı dışında belge yükleme sonrası Sınav Türü adımına gidilir
    if (
      quizType === "personalized" &&
      personalizedQuizType === "weakTopicFocused"
    ) {
      setCurrentStep(4); // Zayıf/Orta odaklıysa direkt tercihlere
    } else {
      setCurrentStep(2); // Diğer durumlarda Sınav Türü seçimine
    }
  };

  // Dosya yükleme hatası
  const handleFileUploadError = (errorMsg: string) => {
    setUploadStatus("error");
    ErrorService.showToast(errorMsg, "error");
  };

  // Konuları tespit et
  const handleTopicsDetected = (selectedTopics: string[]) => {
    // Tespit edilen konular seçildiğinde
    if (selectedTopics.length > 0) {
      setSelectedTopicIds(selectedTopics);

      // Tercihleri güncelle
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        topicIds: selectedTopics,
      }));
    }

    // Konu seçiminden sonra tercihler adımına geç
    setCurrentStep(4);
  };

  // Konu tespiti iptal
  const handleTopicDetectionCancel = () => {
    // Konu seçimi zorunlu olduğundan (weakTopicFocused hariç), iptal edilirse kullanıcı bilgilendirilmeli veya akış durmalı
    // Şimdilik bir sonraki adıma (tercihler) geçiyoruz, ancak bu mantık iyileştirilebilir.
    setCurrentStep(4);
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
    setSelectedSubTopicIds((prev) => {
      const updated = prev.includes(subTopicId)
        ? prev.filter((id) => id !== subTopicId)
        : [...prev, subTopicId];
      // Tercihleri güncelle
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        subTopicIds: updated,
      }));
      return updated;
    });
  };

  // Sınav türü işlemleri
  const handleQuizTypeSelect = (type: "quick" | "personalized") => {
    setQuizType(type);

    // Kişiselleştirilmiş sınav seçilirse tercihleri güncelle
    if (type === "personalized") {
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        personalizedQuizType: personalizedQuizType, // Mevcut alt türü koru
      }));
    } else {
      // Hızlı sınav seçilirse alt türü temizle
      setPreferences((prev: QuizPreferences) => ({
        ...prev,
        personalizedQuizType: undefined,
      }));
    }
  };

  // Kişiselleştirilmiş sınav alt türü
  const handlePersonalizedQuizTypeSelect = (
    type: "weakTopicFocused" | "newTopicFocused" | "comprehensive",
  ) => {
    setPersonalizedQuizType(type);
    setPreferences((prev: QuizPreferences) => ({
      ...prev,
      personalizedQuizType: type,
    }));
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
    // Adım 1 Doğrulama: Dosya Yükleme
    if (currentStep === 1 && (!selectedFile || uploadStatus !== "success")) {
      ErrorService.showToast("Lütfen geçerli bir dosya yükleyin.", "error");
      return;
    }

    // Adım 3 Doğrulama: Konu Seçimi (Personalized ve weakTopicFocused Dışında)
    if (
      currentStep === 3 &&
      quizType === "personalized" &&
      personalizedQuizType !== "weakTopicFocused" &&
      selectedTopicIds.length === 0
    ) {
      ErrorService.showToast("Lütfen en az bir konu seçin.", "error");
      return;
    }

    if (currentStep < totalSteps) {
      let nextStepTarget = currentStep + 1;

      // Akış Atlama Mantığı
      // 1. Hızlı Sınav: Adım 2'den Adım 4'e atla (Konu Seçimi yok)
      if (quizType === "quick" && currentStep === 2) {
        nextStepTarget = 4;
      }
      // 2. Zayıf/Orta Odaklı: Adım 2'den Adım 4'e atla (Dosya Yükleme ve Konu Seçimi yok)
      else if (
        quizType === "personalized" &&
        personalizedQuizType === "weakTopicFocused" &&
        currentStep === 2
      ) {
        nextStepTarget = 4; // Direkt tercihlere
      }
      // 3. Zayıf/Orta Odaklı (alternatif başlangıç): Eğer 1. adımdan sonra bu tür seçilirse, Adım 1'den 4'e atla
      else if (
        quizType === "personalized" &&
        personalizedQuizType === "weakTopicFocused" &&
        currentStep === 1
      ) {
        // Normalde bu akış olmaz, handleFileUploadComplete'den yönetiliyor
        // Güvenlik için buraya da ekleyebiliriz ama mevcut mantıkta buraya düşmemeli
        nextStepTarget = 4;
      }

      setCurrentStep(nextStepTarget);
    } else {
      // Tamamlandı
      if (onComplete) {
        // Son tercihleri oluştur
        const finalPreferences = {
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
          personalizedQuizType:
            quizType === "personalized" ? personalizedQuizType : undefined,
        };

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
        if (quizType === "personalized") {
          params.set("personalizedType", personalizedQuizType);
        }
        if (selectedFile && personalizedQuizType !== "weakTopicFocused") {
          params.set("fileName", selectedFile.name);
        }

        const url = `/exams/create?${params.toString()}`;
        router.push(url);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      let prevStepTarget = currentStep - 1;

      // Akış Geri Atlama Mantığı
      // 1. Hızlı Sınav veya Zayıf/Orta: Adım 4'ten Adım 2'ye dön
      if (
        currentStep === 4 &&
        (quizType === "quick" ||
          (quizType === "personalized" &&
            personalizedQuizType === "weakTopicFocused"))
      ) {
        prevStepTarget = 2;
      }
      // 2. Zayıf/Orta (alternatif): Adım 4'ten Adım 1'e (Eğer bu tür ilk adımdan sonra seçildiyse - pek olası değil)
      // Bu durumun oluşması zor, genellikle 2'den 4'e atlanır.

      setCurrentStep(prevStepTarget);
    }
  };

  // Render
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Sınav Oluştur
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
          Öğrenme sürecinizi kişiselleştirmek için adımları takip edin.
        </p>
      </div>

      <div className="p-6 md:p-8">
        <ExamCreationProgress currentStep={currentStep} totalSteps={totalSteps} />

        <AnimatePresence mode="wait">
          {/* Adım 1: Dosya Yükleme */}
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
                Desteklenen formatlar: PDF, DOCX, DOC, TXT (Maks 40MB). Lütfen
                şifresiz ve okunabilir belgeler yükleyin.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <b>Not:</b> &quot;Zayıf/Orta Odaklı&quot; kişiselleştirilmiş
                sınav türü için belge yüklemeniz gerekmez, bu adımı
                atlayabilirsiniz.
              </p>
            </motion.div>
          )}

          {/* Adım 2: Sınav Türü Seçimi */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                2. Sınav Türü Seçimi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Hızlı Sınav Seçeneği */}
                <div
                  className={`
                    border rounded-xl p-6 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                    ${
                      quizType === "quick"
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/50 shadow-md"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                  onClick={() => handleQuizTypeSelect("quick")}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400">
                      <FiClock className="text-xl" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Hızlı Sınav
                    </h4>
                  </div>

                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-14 list-disc list-inside">
                    <li>Tek belgeyi hızlıca değerlendirir</li>
                    <li>Öğrenme hedeflerini etkilemez</li>
                    <li>Sonuçlar kaydedilir</li>
                  </ul>
                </div>

                {/* Kişiselleştirilmiş Sınav Seçeneği */}
                <div
                  className={`
                     border rounded-xl p-6 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                    ${
                      quizType === "personalized"
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/50 shadow-md"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                  onClick={() => handleQuizTypeSelect("personalized")}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4 text-purple-600 dark:text-purple-400">
                      <FiTarget className="text-xl" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Kişiselleştirilmiş Sınav
                    </h4>
                  </div>

                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-14 list-disc list-inside">
                    <li>Öğrenme sürecini takip eder</li>
                    <li>Hedeflerinizi günceller</li>
                    <li>Detaylı analiz sunar</li>
                  </ul>
                </div>
              </div>

              {/* Kişiselleştirilmiş Sınav Alt Türleri */}
              {quizType === "personalized" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
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
                          Mevcut hedeflerinizdeki eksiklere odaklanın. (Belge
                          gerekmez)
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
                          Yeni konular ve mevcut hedeflerinizi birleştirin.
                          (Belge gerekir)
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Adım 3: Konu Seçimi */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                3. Konu Seçimi
              </h3>

              {quizType === "personalized" && (
                <>
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
                        Yüklediğiniz belgeden AI tarafından tespit edilen
                        konular aşağıdadır. Sınava dahil etmek istediklerinizi
                        seçin.
                      </p>
                      {/* AI Konu Tespiti ve Seçim Ekranı */}
                      {/* 
                         TODO: Gerçek AI Konu Tespiti implementasyonu
                         - Backend'den AI ile konu tespiti çağrısı yapılacak.
                         - Yükleme durumu (isLoading) yönetilecek.
                         - Hata durumu (error) yönetilecek.
                         - mockDetectedTopics yerine gerçek veriler kullanılacak.
                       */}
                      <TopicSelectionScreen
                        detectedTopics={[]}
                        onTopicsSelected={handleTopicsDetected}
                        onCancel={handleTopicDetectionCancel}
                        isLoading={false}
                        error={undefined}
                        quizType={quizType}
                      />
                    </>
                  )}
                </>
              )}

              {/* Ders ve Alt Konu Seçici (Opsiyonel, Genellikle Personalized/Kapsamlı içindir) */}
              {quizType === "personalized" && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Ders ve Alt Konu Seçimi{" "}
                  </h4>
                  <CourseTopicSelector
                    courses={courses}
                    selectedCourseId={selectedCourseId}
                    handleCourseChange={handleCourseChange}
                    courseTopics={courseTopics}
                    selectedTopicIds={selectedTopicIds}
                    handleTopicToggle={handleTopicToggle}
                    topicSubTopics={topicSubTopics}
                    selectedSubTopicIds={selectedSubTopicIds}
                    handleSubTopicToggle={handleSubTopicToggle}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Adım 4: Tercihler */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                4. Sınav Tercihleri
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
                        : personalizedQuizType === "newTopicFocused"
                          ? "Kişiselleştirilmiş: Yeni Konu Odaklı"
                          : "Kişiselleştirilmiş: Kapsamlı"}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-400 mt-1.5 ml-9">
                  {quizType === "quick" &&
                    "Tek bir belge içeriğini hızlıca değerlendirmek için. Öğrenme hedeflerini etkilemez."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "weakTopicFocused" &&
                    "Durumu zayıf veya orta olan mevcut öğrenme hedeflerinize odaklanır."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "newTopicFocused" &&
                    "Yüklenen belgedeki yeni konuları test eder ve ilk durumlarını belirler."}
                  {quizType === "personalized" &&
                    personalizedQuizType === "comprehensive" &&
                    "Yeni içerik ile tüm öğrenme hedeflerinizi birleştirir."}
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
