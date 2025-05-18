"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import quizService from "@/services/quiz.service";
import { FiClipboard } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@nextui-org/react";
import { QuizType } from "@/types";
import {
  QuizGenerationOptions,
  SubTopicItem,
} from "@/types/quiz";
import { ErrorService } from "@/services/error.service";
import ExamCreationWizard from "@/components/home/ExamCreationWizard";
import { toast } from "react-hot-toast";
import { ApiError } from "@/services/error.service";
import { Quiz, QuizPreferences as GlobalQuizPreferences } from "@/types";

// Sayfa içinde kullanılacak tipler (geçici)
// export type CreatePage_QuizCreationResult = any; // Geçici çözüm
// export type CreatePage_CreateQuizFormData = any; // Geçici çözüm

interface ExamCreationResultInternal {
  file: File | null;
  quizType: QuizType;
  personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null;
  preferences: GlobalQuizPreferences & { courseId?: string; topicIds?: string[]; subTopicIds?: string[]; personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null; };
  topicNameMap: Record<string, string>;
  error?: ApiError;
  quizId?: string;
  quiz?: Quiz;
  status?: 'success' | 'error';
  documentId?: string;
}

// formData için daha spesifik bir tip, CreatePage_CreateQuizFormData yerine
interface CreateQuizFormDataTypeInternal {
  quizType: QuizType;
  personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null;
  document?: File | null;
  documentId?: string;
  courseId?: string;
  preferences: GlobalQuizPreferences & { topicIds?: string[]; subTopicIds?: string[]; personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null; };
  selectedTopics: string[];
  topicNames: Record<string, string>; 
}

/**
 * Dosya içeriğini metin olarak okumak için yardımcı fonksiyon
 */
const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Dosya metin olarak okunamadı'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Dosya okuma hatası'));
    reader.readAsText(file);
  });
};

function CreateExamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startQuizParam = searchParams.get("startQuiz");

  const [quizTypeLocal, setQuizTypeLocal] = useState<QuizType>("quick");
  const [personalizedTypeLocal, setPersonalizedTypeLocal] = useState<
    "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | undefined
  >(undefined); // null yerine undefined
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [processingQuiz, setProcessingQuiz] = useState(false);
  const [creationResultInternal, setCreationResultInternal] = useState<Parameters<NonNullable<React.ComponentProps<typeof ExamCreationWizard>["onComplete"]>>[0] | null>(null);
  const [courseIdLocal, setCourseIdLocal] = useState<string | undefined>(undefined);

  const coursesLoading = false; 

  const hasAttemptedInitialProcessing = useRef(false);

  // Quiz oluşturma
  const handleCreateQuiz = useCallback(async (formData: CreateQuizFormDataTypeInternal) => {
    try {
      console.log('[CreateExamPage handleCreateQuiz] Start. quizType:', formData.quizType, 'courseId:', formData.courseId);
      setProcessingQuiz(true);
      setIsSubmitting(true);
      
      // Hata kontrolü
      if (formData.quizType === 'quick' && !formData.document && !formData.documentId && (!formData.selectedTopics || formData.selectedTopics.length === 0)) {
        const errorMsg = "Belge metni veya konular zorunludur";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Quiz oluşturma parametreleri
      const quizOptions: QuizGenerationOptions = {
        quizType: formData.quizType,
        courseId: formData.courseId,
        personalizedQuizType: formData.personalizedQuizType || null,
        // Konu seçimlerini SubTopicItem formatına dönüştür
        selectedSubTopics: formData.selectedTopics.map(id => ({ 
          subTopic: formData.topicNames[id] || id,
          normalizedSubTopic: id
        })),
        preferences: {
          questionCount: formData.preferences.questionCount || 10,
          difficulty: formData.preferences.difficulty || 'mixed',
          timeLimit: formData.preferences.timeLimit || 30,
        }
      };

      // Belge ID varsa document-based quiz olduğunu belirt
      if (formData.documentId) {
        console.log('[CreateExamPage handleCreateQuiz] Document ID ile quiz oluşturuluyor:', formData.documentId);
        quizOptions.documentId = formData.documentId;
      } 
      // Dosya varsa içeriğini al
      else if (formData.document) {
        console.log('[CreateExamPage handleCreateQuiz] Dosya ile quiz oluşturuluyor');
        try {
          const fileContent = await readFileAsText(formData.document);
          if (!fileContent || fileContent.trim().length < 100) {
            const errorMsg = "Belge metni çok kısa veya boş";
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
          quizOptions.documentText = fileContent;
        } catch (fileError) {
          console.error('[CreateExamPage handleCreateQuiz] Dosya okuma hatası:', fileError);
          throw new Error(`Dosya okunamadı: ${fileError instanceof Error ? fileError.message : 'Bilinmeyen hata'}`);
        }
      }

      // Quiz oluştur
      console.log('[CreateExamPage handleCreateQuiz] Quiz oluşturuluyor, opsiyonlar:', quizOptions);
      const resultQuizFromService = await quizService.generateQuiz(quizOptions);
      console.log('[CreateExamPage handleCreateQuiz] Quiz oluşturuldu:', resultQuizFromService);

      // Sonuç sayfasına yönlendirme yap
      if (resultQuizFromService && resultQuizFromService.id) {
        toast.success('Sınav başarıyla oluşturuldu!');
        router.push(`/exams/${resultQuizFromService.id}`);
      } else {
        throw new Error("Sınav oluşturuldu ama ID alınamadı.");
      }
    } catch (error) {
      // Detaylı hata bilgilerini logla
      console.error(`[CreateExamPage handleCreateQuiz] Quiz Type: ${formData.quizType}, Course ID: ${formData.courseId}] Sınav oluşturulurken bir hata oluştu:`, error);
      
      // Hata mesajını kullanıcıya göster
      let errorMessage = 'Sınav oluşturulurken bir hata oluştu';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Belirli hata mesajları için daha açıklayıcı bilgiler
        if (error.message.includes('Belge metni çok kısa')) {
          errorMessage = 'Belge metni çok kısa veya boş. Lütfen daha uzun bir belge yükleyin.';
        } else if (error.message.includes('Belge ID bulunamadı')) {
          errorMessage = 'Belge bilgisi bulunamadı. Lütfen geçerli bir belge yükleyin veya konu seçin.';
        }
      }
      
      toast.error(errorMessage);
      ErrorService.handleError(error, "Sınav oluşturma");
      
      setCreationResultInternal({
        status: 'error',
        error: error instanceof ApiError ? error : new ApiError(error instanceof Error ? error.message : String(error), { 
          status: 400, 
          original: { error, context: "createQuiz" } 
        }),
        quizType: formData.quizType,
        file: formData.document || null,
        preferences: formData.preferences,
        topicNameMap: formData.topicNames
      });
    } finally {
      setProcessingQuiz(false);
      setIsSubmitting(false);
    }
  }, [router]);

  useEffect(() => {
    const typeParam = searchParams.get("type") as QuizType | null;
    const personalizedQuizTypeParam = searchParams.get("personalizedQuizType") as
      | "weakTopicFocused"
      | "learningObjectiveFocused"
      | "newTopicFocused"
      | "comprehensive" | null;
    const courseIdParam = searchParams.get("courseId");
    const fileNameParam = searchParams.get("fileName"); 
    const documentIdParam = searchParams.get("documentId");

    if (typeParam) {
      setQuizTypeLocal(typeParam);
    }
    if (personalizedQuizTypeParam) {
      setPersonalizedTypeLocal(personalizedQuizTypeParam || undefined);
    }
    if (courseIdParam) {
      setCourseIdLocal(courseIdParam);
    }

    if (startQuizParam === "true" && !hasAttemptedInitialProcessing.current) {
      hasAttemptedInitialProcessing.current = true;
      
      console.log('[CreateExamPage useEffect startQuiz] Start. quizType:', typeParam, 'personalizedType:', personalizedQuizTypeParam, 'courseId:', courseIdParam, 'documentId:', documentIdParam);
      
      if (fileNameParam) {
        console.log('[CreateExamPage useEffect startQuiz] fileNameParam:', fileNameParam);
        if (!documentIdParam) {
          console.warn("[CreateExamPage useEffect startQuiz] fileNameParam mevcut ama documentId eksik.");
        }
      }

      let placeholderFile: File | null = null;
      if (fileNameParam) {
        try {
          const emptyBlob = new Blob([''], { type: 'application/octet-stream' });
          placeholderFile = new File([emptyBlob], fileNameParam, { type: 'application/octet-stream' });
          console.log('[CreateExamPage useEffect startQuiz] URL file adından placeholder File nesnesi oluşturuldu:', placeholderFile.name);
        } catch (error) {
          console.error('[CreateExamPage useEffect startQuiz] Placeholder file oluşturma hatası:', error);
        }
      }

      // URL'den gelen topicIds ve subTopicIds parametrelerini al
      const topicIdsParam = searchParams.get("topicIds");
      const subTopicIdsParam = searchParams.get("subTopicIds");
      
      // Eğer topicIds veya subTopicIds parametreleri boşsa, en az bir default konu oluştur
      const topicIds = topicIdsParam?.split(',') || [];
      const subTopicIds = subTopicIdsParam?.split(',') || [];
      
      // Eğer hiç konu yoksa ve document ID varsa, default bir konu ID'si oluştur
      const defaultTopicId = documentIdParam ? `default-topic-${documentIdParam.substring(0, 8)}` : 'default-topic-general';
      const defaultSubTopicId = defaultTopicId;
      
      // Varsayılan konu adı
      const defaultTopicName = fileNameParam 
        ? decodeURIComponent(fileNameParam).replace(/\.[^/.]+$/, "") // Dosya uzantısını kaldır
        : 'Genel Konu';
      
      // Konu topicNameMap'ini oluştur
      const topicNameMap: Record<string, string> = {};
      if (topicIds.length === 0 && documentIdParam) {
        topicNameMap[defaultTopicId] = defaultTopicName;
      }

      const resultData: ExamCreationResultInternal = {
        file: placeholderFile,
        quizType: typeParam || "quick",
        personalizedQuizType: personalizedQuizTypeParam || undefined,
        preferences: {
          questionCount: parseInt(searchParams.get("questionCount") || "10"),
          difficulty: (searchParams.get("difficulty") as GlobalQuizPreferences['difficulty']) || "mixed",
          timeLimit: searchParams.get("timeLimit") ? parseInt(searchParams.get("timeLimit")!) : undefined,
          topicIds: topicIds.length > 0 ? topicIds : documentIdParam ? [defaultTopicId] : [],
          subTopicIds: subTopicIds.length > 0 ? subTopicIds : documentIdParam ? [defaultSubTopicId] : [],
          courseId: courseIdParam || undefined,
          personalizedQuizType: personalizedQuizTypeParam || undefined,
        },
        topicNameMap: Object.keys(topicNameMap).length > 0 ? topicNameMap : {},
        documentId: documentIdParam || undefined,
      };
      console.log('[CreateExamPage useEffect startQuiz] Constructed resultData for processing:', JSON.stringify({
        ...resultData,
        file: resultData.file ? { name: resultData.file.name, size: resultData.file.size, type: resultData.file.type } : null
      }, null, 2));
      
      setCreationResultInternal(resultData as Parameters<NonNullable<React.ComponentProps<typeof ExamCreationWizard>["onComplete"]>>[0]);
    }
  }, [searchParams, startQuizParam, router]);

  const currentQuizTypeForWizard = searchParams.get("type") as QuizType || quizTypeLocal;

  const handleWizardComplete = useCallback((result: Parameters<NonNullable<React.ComponentProps<typeof ExamCreationWizard>["onComplete"]>>[0]) => {
    console.log('[CreateExamPage] ExamCreationWizard onComplete. Result:', result);
    setIsSubmitting(false);
    setProcessingQuiz(false);

    if (result.status === 'success' && result.quizId) {
      console.log("[CreateExamPage] Wizard sınavı başarıyla oluşturdu. ID:", result.quizId);
      
      // Sonuç değişkenine ata
      setCreationResultInternal(result);
      
      // Sınav sayfasına otomatik yönlendir
      console.log("[CreateExamPage] Sınav sayfasına yönlendiriliyor:", `/exams/${result.quizId}`);
      
      // Biraz gecikme ekleyerek state'in doğru güncellenmesini sağla
      setTimeout(() => {
        // Doğrudan sınav URL'ine yönlendir
        const examUrl = `/exams/${result.quizId}`;
        console.log("[CreateExamPage] Son yönlendirme:", examUrl);
        
        // Router yerine doğrudan window.location kullan (daha güvenilir)
        window.location.href = examUrl;
      }, 500);
    } else if (result.status === 'error') {
      const errorMsg = result.error?.message || 'Sınav sihirbazı bir hatayla tamamlandı.';
      toast.error(errorMsg);
      ErrorService.handleError(result.error || new Error(errorMsg), "Sınav oluşturma sihirbazı tamamlama");
      setCreationResultInternal(result);
    }
  }, []);

  if (coursesLoading && quizTypeLocal === 'personalized' ) { 
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {(!startQuizParam || creationResultInternal) && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ExamCreationWizard
                quizType={quizTypeLocal}
                initialFormData={creationResultInternal}
                onComplete={handleWizardComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {(processingQuiz || (creationResultInternal && !creationResultInternal.error && creationResultInternal.status === 'success')) && (
          <div className="text-center py-10">
            <Spinner size="lg" color="indigo" />
            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
              {creationResultInternal?.quizId ? "Sınavınız Hazır!" : "Sınavınız Oluşturuluyor..."}
            </p>
            {creationResultInternal?.quizId && creationResultInternal.quiz && (
              <div className="mt-6 max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">Sınav Bilgileri</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Sınav ID:</strong> {creationResultInternal.quizId}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Soru Sayısı:</strong> {creationResultInternal.quiz.questions?.length || creationResultInternal.quiz.totalQuestions}</p>
                <div className="mt-6 flex flex-col space-y-3">
                  <Button 
                    onClick={() => router.push(`/exams/${creationResultInternal.quizId}`)} 
                    color="primary" 
                    className="w-full"
                  >
                    Sınava Başla
                  </Button>
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/exams/${creationResultInternal.quizId}`}
                      className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/exams/${creationResultInternal.quizId}`);
                        toast.success("Sınav linki kopyalandı!");
                      }}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                      title="Linki Kopyala"
                    >
                      <FiClipboard className="w-4 h-4" />
                    </button>
                  </div>
                  <Button 
                    onClick={() => router.push("/")} 
                    variant="bordered" 
                    className="w-full"
                  >
                    Ana Sayfaya Dön
                  </Button>
                </div>
              </div>
            )}
            </div>
        )}

        {creationResultInternal && creationResultInternal.error && creationResultInternal.status === 'error' && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mt-4 max-w-lg mx-auto text-center">
            <h3 className="text-lg font-semibold mb-2">Sınav Oluşturulamadı</h3>
            {creationResultInternal.error.message && <p className="text-sm">{creationResultInternal.error.message}</p>}
            <Button onClick={() => router.push("/")} color="default" className="mt-4">
              Ana Sayfaya Dön
            </Button>
          </div>
        )}

        {!(processingQuiz || creationResultInternal) && startQuizParam === 'true' && (
            <div className="text-center py-10">
                <p className="text-lg text-gray-600 dark:text-gray-400">Sınav bilgileri işleniyor, lütfen bekleyin...</p>
                <Spinner size="md" />
            </div>
        )}

      </div>
    </PageTransition>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>}>
      <CreateExamPageContent />
    </Suspense>
  );
}
