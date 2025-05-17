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

  const hasAttemptedInitialProcessing = useRef(false);

  // handleCreateQuiz fonksiyonunu useCallback ile sarmala
  const handleCreateQuiz = useCallback(async (formData: CreateQuizFormDataTypeInternal) => {
    console.log('[CreateExamPage handleCreateQuiz] Received formData:', JSON.stringify({
      ...formData,
      document: formData.document ? { name: formData.document.name, size: formData.document.size } : null
    }));
    console.log('[CreateExamPage handleCreateQuiz] DETAY: formData.preferences.topicIds:', JSON.stringify(formData.preferences?.topicIds || []));
    console.log('[CreateExamPage handleCreateQuiz] DETAY: formData.selectedTopics:', JSON.stringify(formData.selectedTopics || []));
    console.log('[CreateExamPage handleCreateQuiz] DETAY: document ve documentId durumu:', {
      documentVar: !!formData.document,
      documentIdVar: !!formData.documentId,
      documentType: formData.document ? typeof formData.document : 'null',
      documentIdType: formData.documentId ? typeof formData.documentId : 'undefined'
    });
    
    if (isSubmitting && !processingQuiz) return;
      
    setIsSubmitting(true);
    setProcessingQuiz(true);
    setCreationResultInternal(null); 

    try {
      console.log("✏️ Quiz oluşturuluyor (handleCreateQuiz):", formData);

      const { quizType, courseId, preferences: formPreferences, selectedTopics: formSelectedTopics, document, documentId: formDocumentId } = formData;
      console.log('[CreateExamPage handleCreateQuiz] formPreferences.topicIds:', JSON.stringify(formPreferences?.topicIds || []));
      console.log('[CreateExamPage handleCreateQuiz] formSelectedTopics:', JSON.stringify(formSelectedTopics || []));
      console.log('[CreateExamPage handleCreateQuiz] document present:', !!document, 'formDocumentId present:', formDocumentId);

      // Belge kontrolü: Dosya yoksa veya ID yoksa ve seçili konular da yoksa uyarı ver
      const hasSelectedTopics = 
        (formPreferences?.topicIds && formPreferences.topicIds.length > 0) || 
        (formSelectedTopics && formSelectedTopics.length > 0);
      
      const isQuickQuiz = quizType === 'quick';
      
      if (isQuickQuiz && !document && !formDocumentId && !hasSelectedTopics) {
        const errorMsg = "Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.";
        console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg);
        toast.error(errorMsg);
        setProcessingQuiz(false);
        setIsSubmitting(false);
        return;
      }

      // Önce belge içeriğini oku, sonra validasyon kontrolü yap
      let documentTextInternal: string | undefined;
      if (document) {
        try {
          // Dosyanın çok küçük olup olmadığını kontrol et (placeholder dosya hariç)
          if (document.size < 50 && document.name && document.name.includes("placeholder")) {
            console.log('[CreateExamPage handleCreateQuiz] Placeholder dosya tespit edildi, belge metni kontrolü atlanıyor');
          } else {
            documentTextInternal = await document.text();
            console.log('[CreateExamPage handleCreateQuiz] Document text extracted, length:', documentTextInternal?.length);
            
            // Belge içeriğinin tamamen boş olması durumu
            if (!documentTextInternal || documentTextInternal.trim().length === 0) {
              if (!hasSelectedTopics) {
                const errorMsg = "Belge içeriği boş ve hiçbir konu seçilmemiş. Lütfen geçerli bir belge yükleyin veya en az bir konu seçin.";
                console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg);
                toast.error(errorMsg);
                setProcessingQuiz(false);
                setIsSubmitting(false);
                return;
              }
              console.log('[CreateExamPage handleCreateQuiz] Uyarı: Belge içeriği boş, ancak konu seçildiği için devam ediliyor');
            }
            // Hızlı sınav için içerik kontrolü sadece gerçek içerik varsa yap
            else if (documentTextInternal.trim().length < 100 && isQuickQuiz && !hasSelectedTopics) { 
              const errorMsg = `Belge metni çok kısa (${documentTextInternal.trim().length} karakter). Hızlı sınav için ya en az 100 karakter uzunluğunda metin gerekli ya da konu seçmelisiniz.`;
              console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg);
              toast.error(errorMsg);
              setProcessingQuiz(false);
              setIsSubmitting(false);
              return;
            }
          }
        } catch (textError) {
          console.error("[CreateExamPage handleCreateQuiz] Belge metni okunurken hata:", textError);
          // Sadece placeholder olmayan gerçek dosyalar için hata göster
          if (document.size > 50) { // Gerçek dosya
            toast.error("Belge içeriği okunamadı. Lütfen geçerli bir dosya yükleyin.");
            setProcessingQuiz(false);
            setIsSubmitting(false);
            return;
          } else {
            console.log("[CreateExamPage handleCreateQuiz] Placeholder dosya okuma hatası, konu seçimi ile devam ediliyor");
          }
        }
      }

      const effectiveTopics = (formPreferences?.topicIds && formPreferences.topicIds.length > 0)
        ? formPreferences.topicIds
        : (formSelectedTopics && formSelectedTopics.length > 0) 
        ? formSelectedTopics 
        : [];
      console.log('[CreateExamPage handleCreateQuiz] effectiveTopics:', JSON.stringify(effectiveTopics));

      // Validasyon mantığını düzeltiyorum:
      // 1. Personalized ve weakTopicFocused değilse konu gerekir
      // 2. Hızlı sınav ve belge/belgeid yoksa konu gerekir
      // 3. Hızlı sınav ve belge varsa konu isteğe bağlı olabilir
      const isPersonalizedRequiringTopics = quizType === 'personalized' && personalizedTypeLocal !== 'weakTopicFocused';
      const hasDocument = !!document || !!formDocumentId || !!documentTextInternal;
      const isQuickWithoutDocument = quizType === 'quick' && !hasDocument;
      
      console.log('[CreateExamPage handleCreateQuiz] Validasyon durumu:', {
        isPersonalizedRequiringTopics,
        hasDocument,
        isQuickWithoutDocument,
        topicsEmpty: !effectiveTopics || effectiveTopics.length === 0
      });
      
      if ((isPersonalizedRequiringTopics || isQuickWithoutDocument) && (!effectiveTopics || effectiveTopics.length === 0)) {
        const errorMsg = isQuickWithoutDocument
          ? "Hızlı sınav için ya belge yüklemeli ya da en az bir konu seçmelisiniz."
          : "En az bir konu seçmelisiniz. Kişiselleştirilmiş sınavlar için konu seçimi zorunludur.";
        console.error('[CreateExamPage handleCreateQuiz] Validation failed:', errorMsg, 'Effective topics:', JSON.stringify(effectiveTopics));
        toast.error(errorMsg);
        setProcessingQuiz(false);
        setIsSubmitting(false);
        return;
      }

      // Eğer seçilen konu yok ve belge içeriği de yoksa uyarı ver
      if (!hasDocument && effectiveTopics.length === 0) { 
        const errorMsg = "Hızlı sınav için geçerli belge, belge ID veya en az bir konu seçimi gerekli.";
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
          quizType: quizType,
          personalizedQuizType: quizType === 'personalized' ? (personalizedTypeLocal || formPreferences.personalizedQuizType) : undefined,
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
        quizType: formData.quizType,
        personalizedQuizType: formData.personalizedQuizType,
        preferences: formData.preferences as CreateQuizFormDataTypeInternal['preferences'],
        topicNameMap: formData.topicNames || {},
        status: 'error', 
        error: { name: 'QuizCreationError', message: messageToShow, status: (error as ApiError)?.status || 500 } as ApiError
      });
    } finally {
      setProcessingQuiz(false);
      setIsSubmitting(false);
    }
  }, [router, personalizedTypeLocal]);

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

        // Belge veya konu kontrolü: URL'den gelen istekte de doğrulama yapalım
        const hasSelectedTopics = topicIds.length > 0;
        const hasDocumentInfo = !!result.file || !!result.documentId;
        const isQuickQuiz = result.quizType === 'quick';

        if (isQuickQuiz && !hasDocumentInfo && !hasSelectedTopics) {
          console.error('[CreateExamPage useEffect_inline_processing] HATA: Hızlı sınav için belge veya konu seçimi gerekli!');
          toast.error("Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.");
          setProcessingQuiz(false);
          setIsSubmitting(false);
          return;
        }

        // Dosya adı URL'den geliyorsa ve documentId yoksa, bu durumu loglayalım
        if (fileNameParam && !result.documentId) {
          console.log('[CreateExamPage useEffect_inline_processing] UYARI: fileNameParam var ama result.documentId yok!');
          console.log('[CreateExamPage useEffect_inline_processing] fileNameParam:', fileNameParam);
          
          // DocumentId yoksa ve dosya adı URL'den geldiyse, ama konu seçimi de yoksa uyarı ver
          if (!hasSelectedTopics) {
            console.error('[CreateExamPage useEffect_inline_processing] HATA: DocumentId yok, dosya adı var ama konu seçilmemiş');
            toast.error("Belge ID bulunamadı ve hiçbir konu seçilmemiş. Lütfen en az bir konu seçin.");
            setProcessingQuiz(false);
            setIsSubmitting(false);
            return;
          }
        }

        // Veri referanslarını korumak için deep clone yapalım
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

        console.log('[CreateExamPage useEffect_inline_processing] Constructed formData for handleCreateQuiz:', JSON.stringify(formData));
        console.log('[CreateExamPage useEffect_inline_processing] KONTROL: formData.preferences.topicIds:', formData.preferences.topicIds);
        console.log('[CreateExamPage useEffect_inline_processing] KONTROL: formData.selectedTopics:', formData.selectedTopics);
        
        await handleCreateQuiz(formData);
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
