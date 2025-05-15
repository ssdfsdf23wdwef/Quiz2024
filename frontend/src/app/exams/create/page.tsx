"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import courseService from "@/services/course.service";
import quizService from "@/services/quiz.service";
import { FiArrowLeft } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import {
  QuizGenerationOptions,
} from "@/types/quiz";
import { ErrorService } from "@/services/error.service";
import ExamCreationWizard from "@/components/home/ExamCreationWizard";

// Form verileri için tip tanımı
interface CreateQuizFormData {
  quizType: "quick" | "personalized";
  personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null;
  document?: File | null;
  courseId?: string;
  preferences: {
    questionCount: number;
    difficulty: string; 
    timeLimit?: number;
    topicIds?: string[];
    subTopicIds?: string[];
  };
  selectedTopics: string[];
  topicNames?: Record<string, string>;
}

// Wizard sonuç veri tipi
interface ExamCreationResult {
  file: File | null;
  quizType: "quick" | "personalized";
  personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive";
  preferences: {
    questionCount: number;
    difficulty: string;
    timeLimit?: number;
    topicIds?: string[];
    subTopicIds?: string[];
  };
}

export default function CreateExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const typeParam = searchParams.get("type");

  // Temel durumlar
  const [processingQuiz, setProcessingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizType] = useState<"quick" | "personalized">(
    typeParam === "personalized" ? "personalized" : "quick"
  );

  // Ana sayfadan startQuiz=true parametresi ile gelindi mi?
  const startQuizParam = searchParams.get("startQuiz");
  const fileNameParam = searchParams.get("fileName");

  // Kurs yükleme durumu izleme
  const { isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => (courseId ? courseService.getCourseById(courseId) : null),
    enabled: !!courseId,
  });

  // Kurs ID değiştiğinde quizType kontrolü
  useEffect(() => {
    // Kişiselleştirilmiş sınav için courseId zorunlu, hızlı sınav için değil
    if (quizType === "personalized" && !courseId) {
      ErrorService.showToast("Kişiselleştirilmiş sınav için bir ders seçmelisiniz", "warning");
      router.replace("/courses");
    }
  }, [courseId, router, quizType]);

  // startQuiz parametresi varsa direkt quiz oluşturma işlemine geçelim
  useEffect(() => {
    // Ana sayfadan startQuiz=true ile yönlendirildiyse ve henüz işlem başlatılmadıysa
    if (startQuizParam === "true" && !processingQuiz && !isSubmitting) {
      console.log("🚀 startQuiz=true parametresi algılandı, direkt quiz oluşturma işlemine geçiliyor");
      
      // Dosya adı bilgisi varsa kullan
      const documentFile: File | null = null;
      if (fileNameParam) {
        console.log(`📄 Dosya adı parametresi algılandı: ${fileNameParam}`);
        // Not: Gerçek bir File nesnesi oluşturamayız, ama adını bilebiliriz
      }

      // Personalized quiz tipini doğru tipte tanımla
      const personalizedType = searchParams.get("personalizedType") as 
        "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | undefined;
      
      // ExamCreationResult'a benzer bir yapı oluştur
      const result: ExamCreationResult = {
        file: documentFile,
        quizType: quizType,
        personalizedQuizType: personalizedType,
        preferences: {
          questionCount: 10, // Varsayılan değerler
          difficulty: "mixed",
          timeLimit: undefined,
          topicIds: [],
          subTopicIds: []
        }
      };
      
      // Otomatik olarak handleExamCreationComplete çağır
      handleExamCreationComplete(result);
    }
  }, [startQuizParam, processingQuiz, isSubmitting, quizType, searchParams]);

  // Quiz oluşturma işlemi
  const handleCreateQuiz = async (formData: CreateQuizFormData) => {
    try {
      if (isSubmitting) return;
      
      setIsSubmitting(true);
      setProcessingQuiz(true);
      
      console.log("✏️ Quiz oluşturuluyor:", formData);
      
      const { quizType, courseId, preferences, selectedTopics } = formData;
      console.log("🔑 Seçilen konular:", selectedTopics);
      console.log("🔑 Tercihler içindeki konular:", preferences.topicIds);
      console.log("🔑 Tercihler içindeki alt konular:", preferences.subTopicIds);

      // Konu bilgilerini kontrol et
      const hasTopics = Array.isArray(selectedTopics) && selectedTopics.length > 0;
      // Optional chaining kullanarak daha güvenli bir şekilde subTopicIds kontrol edelim
      const subTopicIds = preferences?.subTopicIds;
      const hasSubTopics = Array.isArray(subTopicIds) && subTopicIds.length > 0;
      
      // Quiz oluşturma seçeneklerini hazırla
    const quizOptions: QuizGenerationOptions = {
      quizType,
      courseId: courseId || undefined,
        personalizedQuizType: formData.personalizedQuizType || null,
        
        // Konu ve alt konu bilgilerini hazırla
        selectedSubTopics: hasTopics 
          ? selectedTopics.map(topicId => ({
              subTopic: formData.topicNames?.[topicId] || topicId,
              normalizedSubTopic: topicId
            })) 
          : (
            // Eğer özel alt konular varsa onları kullan
            hasSubTopics 
              ? subTopicIds.map(subTopicId => ({
                  subTopic: formData.topicNames?.[subTopicId] || subTopicId,
                  normalizedSubTopic: subTopicId
                }))
              : undefined
          ),
          
        sourceDocument: formData.document 
          ? {
              fileName: formData.document.name,
              storagePath: formData.document.name // Gerçek storage path burada bilinmiyor
            } 
          : null,
        preferences: {
          questionCount: preferences.questionCount,
          difficulty: preferences.difficulty === 'beginner' ? 'easy' : 
                      preferences.difficulty === 'intermediate' ? 'medium' :
                      preferences.difficulty === 'advanced' ? 'hard' : 'mixed',
          timeLimit: preferences.timeLimit,
          prioritizeWeakAndMediumTopics: true
        }
      };

      // Konu bilgilerini log'a yaz
      console.log("📝 Quiz oluşturma seçenekleri:", quizOptions);
      console.log("📋 Seçilen konular ve alt konular:", {
        selectedTopics: selectedTopics || [],
        topicIds: preferences.topicIds || [],
        subTopicIds: preferences.subTopicIds || [],
        selectedSubTopicsForAPI: quizOptions.selectedSubTopics || []
      });
      
      try {
        console.log("🚀 quizService.generateQuiz çağrılıyor...");
        console.log("📮 API endpointi: /quizzes");
        
        // Sınavı oluştur
        const result = await quizService.generateQuiz(quizOptions);
        
        console.log("✅ API isteği başarılı. Quiz oluşturuldu:", result);
        console.log("🆔 Quiz ID:", result?.id);
        
        // Sınav sayfasına yönlendir
        if (result && result.id) {
          console.log("🧭 Yönlendirme: /exams/" + result.id);
          router.push(`/exams/${result.id}`);
        } else {
          console.error("❌ API yanıt verdi ama ID eksik:", result);
          setError("Sınav oluşturuldu ancak ID alınamadı. Lütfen derslerinizi kontrol edin.");
          setProcessingQuiz(false);
          setIsSubmitting(false);
        }
      } catch (apiError) {
        console.error("❌ Quiz API çağrısı hatası:", apiError);
        
        // Hata mesajını daha detaylı alalım
        let errorMessage = "API isteği sırasında bir hata oluştu.";
        
        if (apiError instanceof Error) {
          errorMessage = `Hata: ${apiError.message}`;
          console.error("❌ Hata detayları:", apiError.message);
          console.error("❌ Hata tipi:", apiError.name);
          console.error("❌ Hata yığını:", apiError.stack);
        }
        
        // Kullanıcıya uygun mesaj göster
        setError(`${errorMessage} Lütfen tekrar deneyin.`);
        setProcessingQuiz(false);
        setIsSubmitting(false);
        
        // 3 saniye sonra kullanıcıyı yönlendir
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (error) {
      console.error("❌ Quiz oluşturma genel hatası:", error);
      setError("Sınav oluşturulurken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      setProcessingQuiz(false);
      setIsSubmitting(false);
    }
  };

  // ExamCreationWizard tamamlandığında
  const handleExamCreationComplete = (result: ExamCreationResult) => {
    try {
      console.log("✅ Sınav oluşturma sihirbazı tamamlandı:", result);
      
      if (!result) {
        console.error("⚠️ Sınav oluşturma sonucu boş");
        setError("Sınav oluşturma sonucu alınamadı");
        return;
      }
      
      // Konu ve alt konuları konsola yazdır (debug)
      console.log("📋 Konu bilgileri:", {
        topicIds: result.preferences.topicIds,
        subTopicIds: result.preferences.subTopicIds
      });
      
      // ExamCreationWizard'dan gelen sonuçla direkt olarak quiz oluşturma işlemini başlat
      const formData: CreateQuizFormData = {
        quizType: result.quizType,
        personalizedQuizType: result.personalizedQuizType,
        document: result.file,
        courseId: courseId || undefined,
      preferences: {
          ...result.preferences,
          // topicIds ve subTopicIds değerlerini eksplisit olarak kopyala
          topicIds: result.preferences.topicIds || [],
          subTopicIds: result.preferences.subTopicIds || []
        },
        // Seçilen konuları result.preferences.topicIds'den al ve undefined değilse kullan
        selectedTopics: result.preferences.topicIds || [],
        // Konu isimleri mapini ekle (boş obje yerine gerçek değerler olmalı)
        topicNames: {}
      };
      
      // Oluşturulan formData'yı logla
      console.log("🔍 Oluşturulan formData:", formData);
      
      handleCreateQuiz(formData);
    } catch (error) {
      console.error("❌ handleExamCreationComplete hatası:", error);
      setError("Sınav oluşturma verisi işlenirken hata oluştu");
      setProcessingQuiz(false);
      setIsSubmitting(false);
    }
  };

  // Yükleniyor durumu
  const isLoading = (quizType === "personalized" && courseLoading);

  if (quizType === "personalized" && !courseId) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Kişiselleştirilmiş sınav için ders ID&apos;si gereklidir.</p>
        <Link href="/courses" className="text-indigo-600 hover:underline">
          Dersler sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={courseId ? `/courses/${courseId}` : "/"}
          className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-6"
        >
          <FiArrowLeft className="mr-2" /> {courseId ? "Derse Dön" : "Ana Sayfaya Dön"}
        </Link>

        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          {isLoading
            ? "Yükleniyor..."
            : "Sınav Oluştur"}
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center my-12">
            <Spinner size="lg" />
          </div>
        ) : processingQuiz ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mt-4"
          >
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-20 h-20 relative mb-6">
                <div className="absolute top-0 right-0 bottom-0 left-0 animate-spin border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Sınav Oluşturuluyor
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
                Sorular hazırlanıyor. Lütfen bekleyin...
              </p>

              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mt-4">
                <motion.div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  initial={{ width: "10%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <ExamCreationWizard 
              quizType={quizType} 
              onComplete={handleExamCreationComplete} 
            />

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mt-4">
                {error}
              </div>
            )}
            </div>
        )}
      </div>
    </PageTransition>
  );
}
