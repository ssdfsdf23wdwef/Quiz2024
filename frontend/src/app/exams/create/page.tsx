"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import quizService from "@/services/quiz.service";
import { FiClipboard } from "react-icons/fi";
import { motion } from "framer-motion";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@nextui-org/react";
import { QuizType } from "@/types";
import {
  DifficultyLevel,
  QuizGenerationOptions,
  SubTopicItem,
} from "@/types/quiz";
import { ErrorService } from "@/services/error.service";
import ExamCreationWizard from "@/components/home/ExamCreationWizard";
import { toast } from "react-hot-toast";
import { ApiError } from "@/services/error.service";
import { AxiosError } from "axios";
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
  const [creationResultInternal, setCreationResultInternal] = useState<ExamCreationResultInternal | null>(null);
  const [courseIdLocal, setCourseIdLocal] = useState<string | undefined>(undefined);

  const coursesLoading = false; 

  // handleCreateQuiz fonksiyonunu useCallback ile sarmala
  const handleCreateQuiz = useCallback(async (formData: CreateQuizFormDataTypeInternal) => {
    console.log('[CreateExamPage handleCreateQuiz] Received formData:', JSON.stringify(formData));
    if (isSubmitting && !processingQuiz) return;

    setIsSubmitting(true);
    setProcessingQuiz(true);
    setCreationResultInternal(null); 

    try {
      console.log("✏️ Quiz oluşturuluyor (handleCreateQuiz):", formData);

      const { quizType, courseId, preferences: formPreferences, selectedTopics: formSelectedTopics, document, documentId: formDocumentId } = formData;
      console.log('[CreateExamPage handleCreateQuiz] formPreferences.topicIds:', JSON.stringify(formPreferences?.topicIds));
      console.log('[CreateExamPage handleCreateQuiz] formSelectedTopics:', JSON.stringify(formSelectedTopics));
      console.log('[CreateExamPage handleCreateQuiz] document present:', !!document, 'formDocumentId present:', formDocumentId);

      const effectiveTopics = (formPreferences?.topicIds && formPreferences.topicIds.length > 0)
        ? formPreferences.topicIds
        : (formSelectedTopics && formSelectedTopics.length > 0) 
        ? formSelectedTopics 
        : [];
      console.log('[CreateExamPage handleCreateQuiz] effectiveTopics:', JSON.stringify(effectiveTopics));

      if ((quizType === 'quick' || (quizType === 'personalized' && personalizedTypeLocal !== 'weakTopicFocused')) && (!effectiveTopics || effectiveTopics.length === 0)) {
        const errorMsg = "En az bir konu seçmelisiniz (handleCreateQuiz validation). Hızlı veya konu odaklı kişiselleştirilmiş sınavlar için konu gereklidir.";
        console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg, 'Effective topics:', JSON.stringify(effectiveTopics));
        toast.error(errorMsg);
        setProcessingQuiz(false);
        setIsSubmitting(false);
        return;
      }

      let documentTextInternal: string | undefined;
      if (document) {
        try {
          documentTextInternal = await document.text();
          console.log('[CreateExamPage handleCreateQuiz] Document text extracted, length:', documentTextInternal?.length);
          if (documentTextInternal && documentTextInternal.length < 100 && quizType === 'quick') { 
            const errorMsg = `Belge metni çok kısa. Hızlı sınav için en az 100 karakter olmalıdır (handleCreateQuiz validation). Gerçek uzunluk: ${documentTextInternal.length}`;
            console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg);
            toast.error(errorMsg);
            setProcessingQuiz(false);
            setIsSubmitting(false);
            return;
          }
        } catch (textError) {
          console.error("[CreateExamPage handleCreateQuiz] Belge metni okunurken hata:", textError);
          toast.error("Belge içeriği okunamadı.");
          setProcessingQuiz(false);
          setIsSubmitting(false);
          return;
        }
      } else if (quizType === 'quick' && !formDocumentId && !(documentTextInternal && documentTextInternal.length >= 100) ) { 
        const errorMsg = "Hızlı sınav için geçerli belge, belge ID veya yeterli uzunlukta belge metni gerekli fakat sağlanmadı (handleCreateQuiz validation).";
        console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg);
        toast.error(errorMsg);
        setProcessingQuiz(false);
        setIsSubmitting(false);
        return;
      }
      
      const quizOptions: QuizGenerationOptions = {
        quizType: quizType as QuizType,
        courseId: courseId || undefined,
        documentText: documentTextInternal, 
        documentId: formDocumentId,
        selectedSubTopics: (formPreferences.subTopicIds || []).map((id: string) => ({ subTopic: id, normalizedSubTopic: id }) as SubTopicItem),
        preferences: { 
            questionCount: formPreferences.questionCount,
            difficulty: formPreferences.difficulty as DifficultyLevel,
            timeLimit: formPreferences.timeLimit, 
        },
        personalizedQuizType: quizType === 'personalized' ? (personalizedTypeLocal || formPreferences.personalizedQuizType) : undefined,
      };
      console.log('[CreateExamPage handleCreateQuiz] quizOptions to be sent to API:', JSON.stringify(quizOptions));

      const resultQuizFromService: Quiz = await quizService.generateQuiz(quizOptions) as Quiz; 
      console.log("✅ Quiz oluşturma başarılı (handleCreateQuiz):", resultQuizFromService);
      
      if (resultQuizFromService && resultQuizFromService.id) {
        setCreationResultInternal({
          file: document || null, 
          quizType: quizTypeLocal,
          personalizedQuizType: personalizedTypeLocal,
          preferences: formPreferences as CreateQuizFormDataTypeInternal['preferences'], 
          topicNameMap: formData.topicNames || {},  
          status: 'success', 
          quizId: resultQuizFromService.id, 
          quiz: resultQuizFromService 
        });
        toast.success("Sınav başarıyla oluşturuldu!");
        router.push(`/exams/${resultQuizFromService.id}`);
      } else {
        console.error("[CreateExamPage handleCreateQuiz] API'den geçerli bir quiz ID dönmedi:", resultQuizFromService);
        throw new Error("Sınav oluşturuldu ancak ID alınamadı.");
      }

    } catch (error) {
      console.error("❌ Quiz oluşturma hatası (handleCreateQuiz):", error);
      const errorContext = `[CreateExamPage handleCreateQuiz] Quiz Type: ${formData?.quizType}, Course ID: ${formData?.courseId}`; 
      ErrorService.handleError(error as Error | AxiosError, errorContext); 
      const defaultMessage = "Sınav oluşturulurken bir hata oluştu. Daha fazla bilgi için konsolu kontrol edin.";
      const messageToShow = error instanceof ApiError ? error.message : (error instanceof Error ? error.message : defaultMessage);

      setCreationResultInternal({
        file: formData.document || null, 
        quizType: quizTypeLocal,
        personalizedQuizType: personalizedTypeLocal,
        preferences: formData.preferences as CreateQuizFormDataTypeInternal['preferences'],
        topicNameMap: formData.topicNames || {},
        status: 'error', 
        error: { name: 'QuizCreationError', message: messageToShow, status: (error as ApiError)?.status || 500 } as ApiError
      });
    } finally {
      setProcessingQuiz(false);
      setIsSubmitting(false);
    }
  }, [isSubmitting, processingQuiz, personalizedTypeLocal, quizTypeLocal, router, courseIdLocal, setCreationResultInternal, setIsSubmitting, setProcessingQuiz]);

  // handleExamCreationComplete fonksiyonunu useCallback ile sarmala ve useEffect'den önce tanımla
  const handleExamCreationComplete = useCallback(async (result: ExamCreationResultInternal) => {
    console.log('[CreateExamPage handleExamCreationComplete] Received result:', JSON.stringify(result));
    setProcessingQuiz(true);
    setIsSubmitting(true);

    const topicIds = result.preferences.topicIds || [];
    const subTopicIds = result.preferences.subTopicIds || [];
    console.log('[CreateExamPage handleExamCreationComplete] Extracted topicIds:', JSON.stringify(topicIds));
    console.log('[CreateExamPage handleExamCreationComplete] Extracted subTopicIds:', JSON.stringify(subTopicIds));

    const formData: CreateQuizFormDataTypeInternal = {
      quizType: result.quizType,
      personalizedQuizType: result.personalizedQuizType,
      document: result.file, 
      documentId: result.documentId,
      courseId: result.preferences.courseId || courseIdLocal,
      preferences: {
        ...result.preferences,
        topicIds: topicIds, 
        subTopicIds: subTopicIds,
      },
      selectedTopics: topicIds, 
      topicNames: result.topicNameMap || {},
    };

    console.log('[CreateExamPage handleExamCreationComplete] Constructed formData for handleCreateQuiz:', JSON.stringify(formData));
    await handleCreateQuiz(formData);
  }, [courseIdLocal, handleCreateQuiz, setProcessingQuiz, setIsSubmitting]); // handleCreateQuiz'i bağımlılıklara ekle

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
      setPersonalizedTypeLocal(personalizedQuizTypeParam || undefined); // null ise undefined
    }
    if (courseIdParam) {
      setCourseIdLocal(courseIdParam);
    }

    if (startQuizParam === "true") {
      console.log('[CreateExamPage useEffect startQuiz] Start. quizType:', typeParam, 'personalizedType:', personalizedQuizTypeParam, 'courseId:', courseIdParam, 'documentId:', documentIdParam);
      if (fileNameParam && !documentIdParam) {
        console.log('[CreateExamPage useEffect startQuiz] fileNameParam:', fileNameParam);
        console.warn("[CreateExamPage useEffect startQuiz] fileNameParam mevcut ama documentId eksik.");
      }

      const result: ExamCreationResultInternal = {
        file: null, 
        quizType: typeParam || "quick",
        personalizedQuizType: personalizedQuizTypeParam || undefined,
        preferences: {
          questionCount: parseInt(searchParams.get("questionCount") || "10"),
          difficulty: (searchParams.get("difficulty") as GlobalQuizPreferences['difficulty']) || "mixed",
          timeLimit: searchParams.get("timeLimit") ? parseInt(searchParams.get("timeLimit")!) : undefined,
          topicIds: searchParams.get("topicIds")?.split(',') || [],
          subTopicIds: searchParams.get("subTopicIds")?.split(',') || [],
          courseId: courseIdParam || undefined,
          personalizedQuizType: personalizedQuizTypeParam || undefined,
        },
        topicNameMap: {},
        documentId: documentIdParam || undefined,
      };
      console.log('[CreateExamPage useEffect startQuiz] Constructed result for handleExamCreationComplete:', JSON.stringify(result));
      handleExamCreationComplete(result);
    }
  }, [searchParams, startQuizParam, handleExamCreationComplete]);

  const currentQuizTypeForWizard = searchParams.get("type") as QuizType || quizTypeLocal;

  if (coursesLoading && quizTypeLocal === 'personalized' ) { 
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {(!startQuizParam || startQuizParam !== 'true') && !creationResultInternal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ExamCreationWizard
              quizType={currentQuizTypeForWizard} 
              onComplete={handleExamCreationComplete}
            />
          </motion.div>
        )}

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
