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

  // Quiz oluşturma işlemi
  const handleCreateQuiz = async (formData: CreateQuizFormData) => {
    try {
      if (isSubmitting) return;
      
      setIsSubmitting(true);
      setProcessingQuiz(true);
      
      console.log("✏️ Quiz oluşturuluyor:", formData);
      
      const { quizType, courseId, preferences, selectedTopics } = formData;
      
      // Quiz oluşturma seçeneklerini hazırla
      const quizOptions: QuizGenerationOptions = {
        quizType,
        courseId: courseId || undefined,
        personalizedQuizType: formData.personalizedQuizType || null,
        selectedSubTopics: selectedTopics.length > 0 
          ? selectedTopics.map(topicId => ({
              subTopic: formData.topicNames?.[topicId] || topicId,
              normalizedSubTopic: topicId
            })) 
          : undefined,
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

      console.log("📝 Quiz oluşturma seçenekleri:", quizOptions);
      
      try {
        // Sınavı oluştur
        const result = await quizService.generateQuiz(quizOptions);
        console.log("✅ Quiz oluşturuldu:", result);
        
        // Sınav sayfasına yönlendir
        if (result && result.id) {
          router.push(`/exams/${result.id}`);
        } else {
          console.error("❌ Quiz oluşturuldu ancak ID alınamadı");
          setError("Sınav oluşturuldu ancak ID alınamadı");
          setProcessingQuiz(false);
          setIsSubmitting(false);
        }
      } catch (apiError) {
        console.error("❌ Quiz API çağrısı hatası:", apiError);
        setError("API isteği sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        setProcessingQuiz(false);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("❌ Quiz oluşturma genel hatası:", error);
      setError("Sınav oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
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
      
      // ExamCreationWizard'dan gelen sonuçla direkt olarak quiz oluşturma işlemini başlat
      const formData: CreateQuizFormData = {
        quizType: result.quizType,
        personalizedQuizType: result.personalizedQuizType,
        document: result.file,
      courseId: courseId || undefined,
        preferences: result.preferences,
        selectedTopics: result.preferences.topicIds || [],
        topicNames: {}
      };
      
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
