"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import quizService from "@/services/quiz.service";
import { FiClipboard } from "react-icons/fi";
import { motion } from "framer-motion";
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
  const [creationResultInternal, setCreationResultInternal] = useState<ExamCreationResultInternal | null>(null);
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

      const resultData: ExamCreationResultInternal = {
        file: placeholderFile,
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
      console.log('[CreateExamPage useEffect startQuiz] Constructed resultData for processing:', JSON.stringify({
        ...resultData,
        file: resultData.file ? { name: resultData.file.name, size: resultData.file.size } : null
      }));
      
      (async (result: ExamCreationResultInternal) => {
        console.log('[CreateExamPage useEffect_inline_processing] Received result:', JSON.stringify(result));
        console.log('[CreateExamPage useEffect_inline_processing] VERİ DETAY: result.file:', result.file);
        console.log('[CreateExamPage useEffect_inline_processing] VERİ DETAY: result.preferences:', JSON.stringify(result.preferences));
        setProcessingQuiz(true);
        setIsSubmitting(true);

        const topicIds = result.preferences.topicIds || [];
        const subTopicIds = result.preferences.subTopicIds || [];
        console.log('[CreateExamPage useEffect_inline_processing] Extracted topicIds:', JSON.stringify(topicIds));
        console.log('[CreateExamPage useEffect_inline_processing] Extracted subTopicIds:', JSON.stringify(subTopicIds));

        // Belge ve konu kontrolü
        const hasSelectedTopics = topicIds.length > 0;
        const hasDocumentInfo = !!result.file || !!result.documentId;
        const isQuickQuiz = result.quizType === 'quick';

        // Dosya adı URL'den geliyorsa ancak konu ve belge ID'si yoksa
        if (fileNameParam && !result.documentId && !hasSelectedTopics) {
          console.log('[CreateExamPage useEffect_inline_processing] fileNameParam var ama documentId ve topicIds yok');
          
          try {
            // Önce varsayılan konu oluşturalım - en azından kullanıcı ilerleyebilsin
            const defaultTopicId = `default-topic-${new Date().getTime()}`;
            const defaultTopicName = fileNameParam.replace(/\.[^/.]+$/, ""); // Dosya uzantısını kaldırıp dosya adını konu olarak kullan
            
            // topicNameMap ve preferences güncelleme
            const updatedTopicNameMap = { ...result.topicNameMap };
            updatedTopicNameMap[defaultTopicId] = defaultTopicName;
            
            result.topicNameMap = updatedTopicNameMap;
            result.preferences.topicIds = [defaultTopicId];
            result.preferences.subTopicIds = [defaultTopicId];
            
            console.log('[CreateExamPage useEffect_inline_processing] Varsayılan konu oluşturuldu:', defaultTopicId, defaultTopicName);
            toast.success(`Varsayılan konu oluşturuldu: "${defaultTopicName}"`);
            
            // Gerekli değişkenleri güncelle
            const formData: CreateQuizFormDataTypeInternal = {
              quizType: result.quizType,
              personalizedQuizType: result.personalizedQuizType,
              document: result.file,
              documentId: result.documentId,
              courseId: result.preferences.courseId || courseIdLocal,
              preferences: JSON.parse(JSON.stringify(result.preferences)),
              selectedTopics: result.preferences.topicIds.slice(), // Yeni güncellenmiş topicIds'yi kullan
              topicNames: JSON.parse(JSON.stringify(result.topicNameMap)),
            };
            
            console.log('[CreateExamPage useEffect_inline_processing] Varsayılan konu ile formData hazırlandı');
            // Şimdi quiz oluşturmaya devam et
            await handleCreateQuiz(formData);
            return;
          } catch (error) {
            console.error('[CreateExamPage useEffect_inline_processing] Varsayılan konu oluşturma hatası:', error);
            setProcessingQuiz(false);
            setIsSubmitting(false);
            toast.error("Belge bilgilerini işlerken bir hata oluştu. Lütfen yeniden deneyin.");
            return;
          }
        }

        // Hızlı sınav ve belge yoksa, konu seçimi zorunlu
        if (isQuickQuiz && !hasDocumentInfo && !hasSelectedTopics) {
          console.error('[CreateExamPage useEffect_inline_processing] HATA: Hızlı sınav için belge veya konu seçimi gerekli!');
          toast.error("Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.");
          setProcessingQuiz(false);
          setIsSubmitting(false);
          return;
        }

        // Veri referanslarını korumak için deep clone
        const formData: CreateQuizFormDataTypeInternal = {
          quizType: result.quizType,
          personalizedQuizType: result.personalizedQuizType,
          document: result.file,
          documentId: result.documentId,
          courseId: result.preferences.courseId || courseIdLocal,
          preferences: JSON.parse(JSON.stringify(result.preferences)),
          selectedTopics: topicIds.slice(), // Array kopyası
          topicNames: JSON.parse(JSON.stringify(result.topicNameMap || {})),
        };

        console.log('[CreateExamPage useEffect_inline_processing] FormData hazırlandı:', JSON.stringify({
          ...formData,
          document: formData.document ? { name: formData.document.name, size: formData.document.size } : null
        }));

        try {
          await handleCreateQuiz(formData);
        } catch (error) {
          console.error('[CreateExamPage useEffect_inline_processing] Quiz oluşturulurken hata:', error);
          setProcessingQuiz(false);
          setIsSubmitting(false);
        }
      })(resultData);
    }
  }, [searchParams, startQuizParam, handleCreateQuiz, courseIdLocal]);

  const currentQuizTypeForWizard = searchParams.get("type") as QuizType || quizTypeLocal;

  const onWizardComplete = useCallback(async (result: ExamCreationResultInternal) => {
    console.log('[CreateExamPage onWizardComplete] Received result:', JSON.stringify(result));
    console.log('[CreateExamPage onWizardComplete] DETAY: preferences.topicIds:', result.preferences.topicIds);
    console.log('[CreateExamPage onWizardComplete] DETAY: preferences.subTopicIds:', result.preferences.subTopicIds);
    console.log('[CreateExamPage onWizardComplete] DETAY: topicNameMap anahtarları:', Object.keys(result.topicNameMap || {}));
    setProcessingQuiz(true);
    setIsSubmitting(true);

    const topicIds = result.preferences.topicIds || [];
    const subTopicIds = result.preferences.subTopicIds || [];

    // Doğrulama kontrollerini ekle
    const hasSelectedTopics = topicIds.length > 0;
    const hasDocumentInfo = !!result.file || !!result.documentId;
    const isQuickQuiz = result.quizType === 'quick';
    
    // Hızlı sınav ise ve belge veya konu yoksa uyarı ver
    if (isQuickQuiz && !hasDocumentInfo && !hasSelectedTopics) {
      console.error('[CreateExamPage onWizardComplete] HATA: Hızlı sınav için belge veya konu seçimi gerekli!');
      toast.error("Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.");
      setProcessingQuiz(false);
      setIsSubmitting(false);
      return;
    }
    
    // Kişiselleştirilmiş sınav ise ve konu seçilmemişse uyarı ver (weakTopicFocused tipi dışında)
    const isPersonalizedRequiringTopics = result.quizType === 'personalized' && 
      result.personalizedQuizType !== 'weakTopicFocused';
      
    if (isPersonalizedRequiringTopics && !hasSelectedTopics) {
      console.error('[CreateExamPage onWizardComplete] HATA: Kişiselleştirilmiş sınav için konu seçimi gerekli!');
      toast.error("Kişiselleştirilmiş sınav için en az bir konu seçmelisiniz.");
      setProcessingQuiz(false);
      setIsSubmitting(false);
        return;
      }
      
    const formData: CreateQuizFormDataTypeInternal = {
        quizType: result.quizType,
        personalizedQuizType: result.personalizedQuizType,
        document: result.file,
      documentId: result.documentId,
      courseId: result.preferences.courseId || courseIdLocal,
      preferences: {
        ...JSON.parse(JSON.stringify(result.preferences)),
        topicIds: topicIds.slice(),
        subTopicIds: subTopicIds.slice(),
      },
      selectedTopics: topicIds.slice(),
      topicNames: { ...result.topicNameMap },
    };
    
    console.log('[CreateExamPage onWizardComplete] Constructed formData for handleCreateQuiz:', JSON.stringify(formData));
    console.log('[CreateExamPage onWizardComplete] KONTROL: formData.preferences.topicIds:', formData.preferences.topicIds);
    console.log('[CreateExamPage onWizardComplete] KONTROL: formData.selectedTopics:', formData.selectedTopics);
    
    await handleCreateQuiz(formData);
  }, [courseIdLocal, handleCreateQuiz, setProcessingQuiz, setIsSubmitting]);

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
              onComplete={onWizardComplete}
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
