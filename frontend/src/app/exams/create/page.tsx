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
    console.log('[CreateExamPage handleCreateQuiz] DETAY: document:', formData.document ? `${formData.document.name} (${formData.document.size} bytes)` : 'Belge yok');
    console.log('[CreateExamPage handleCreateQuiz] DETAY: documentId:', formData.documentId || 'ID yok');

    try {
      setCurrentStep('processing');

      // Belge kontrolü
      if (formData.quizType === 'quick') {
        let documentTextInternal = '';
        
        if (formData.document) {
          try {
            documentTextInternal = await formData.document.text();
            console.log('[CreateExamPage handleCreateQuiz] Belge metni okundu, uzunluk:', documentTextInternal.length);
          } catch (error) {
            console.error('[CreateExamPage handleCreateQuiz] Belge metni okuma hatası:', error);
            throw new Error("Belge okunamadı. Lütfen geçerli bir belge yükleyin.");
          }
        }
        
        // Belge metni kontrolü (minimum 100 karakter)
        if (documentTextInternal && documentTextInternal.trim().length < 100) {
          const errorMsg = `Belge metni çok kısa (${documentTextInternal.trim().length} karakter). En az 100 karakter olmalıdır.`;
          console.error('[CreateExamPage handleCreateQuiz] Belge metni çok kısa:', errorMsg);
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // Belge veya konu seçimi kontrolü
        // Etkili konular: Ya preferences.topicIds var ya da selectedTopics var
        const effectiveTopics = (formData.preferences?.topicIds?.length ?? 0) > 0 
          ? formData.preferences.topicIds 
          : formData.selectedTopics || [];
        
        // Belge yoksa ve belge ID yoksa ve konu seçilmemişse hata ver
        if (!formData.document && !formData.documentId && effectiveTopics.length === 0) {
          console.error('[CreateExamPage handleCreateQuiz] Hızlı sınav için belge veya konu seçimi gerekli!');
          toast.error("Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.");
          throw new Error("Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.");
        }
        
        // Belge ID var ama belge yok ve konu da seçilmemişse uyarı göster
        if (formData.documentId && !formData.document && effectiveTopics.length === 0) {
          console.warn('[CreateExamPage handleCreateQuiz] UYARI: DocumentId var ama konu seçilmemiş. Belge içeriğinin alınamama ihtimali var.');
          toast.warning("Belge ID var ama konu seçilmemiş. Devam edilirse içerik alınamayabilir.");
        }
      }

      console.log('[CreateExamPage handleCreateQuiz] Quiz Type:', formData.quizType, 'Course ID:', formData.courseId || 'Kurs ID yok');

      // Sınav tipine göre options hazırla
      const quizOptions: QuizGenerationOptions = {
        quizType: formData.quizType,
        personalizedQuizType: formData.personalizedQuizType,
        documentText: formData.document ? await formData.document.text() : undefined,
        documentId: formData.documentId,
        selectedSubTopics: formData.selectedTopics,
        preferences: {
          questionCount: formData.preferences.questionCount || 10,
          difficulty: formData.preferences.difficulty || 'mixed',
          timeLimit: formData.preferences.timeLimit || 30,
          courseId: formData.courseId,
          topicIds: formData.preferences.topicIds,
          subTopicIds: formData.preferences.subTopicIds,
          personalizedQuizType: formData.personalizedQuizType,
        },
      };

      // Quiz oluştur
      const resultQuizFromService = await quizService.generateQuiz(quizOptions);
      console.log('[CreateExamPage handleCreateQuiz] Quiz oluşturuldu:', resultQuizFromService);

      // Sonuç sayfasına yönlendirme yap
      if (resultQuizFromService && resultQuizFromService.id) {
        router.push(`/exams/${resultQuizFromService.id}`);
      } else {
        throw new Error("Sınav oluşturuldu ama ID alınamadı.");
      }
    } catch (error) {
      console.error(`[CreateExamPage handleCreateQuiz] Quiz Type: ${formData.quizType}, Course ID: ${formData.courseId}] Sınav oluşturulurken bir hata oluştu:`, error);
      ErrorService.handleError(error, "Sınav oluşturma");
      setCurrentStep('error');
      setCreationResult({
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
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

        // Belge veya konu kontrolü: URL'den gelen istekte de doğrulama yapalım
        const hasSelectedTopics = topicIds.length > 0;
        const hasDocumentInfo = !!result.file || !!result.documentId;
        const isQuickQuiz = result.quizType === 'quick';

        // Hızlı sınav ve belge var, ama documentId yok durumu için işlem yapalım
        if (isQuickQuiz && !hasDocumentInfo && !hasSelectedTopics) {
          console.error('[CreateExamPage useEffect_inline_processing] HATA: Hızlı sınav için belge veya konu seçimi gerekli!');
          toast.error("Hızlı sınav için ya belge yüklemelisiniz ya da en az bir konu seçmelisiniz.");
          setProcessingQuiz(false);
          setIsSubmitting(false);
          return;
        }

        // Dosya adı URL'den geliyorsa ve documentId yoksa, bu durumu ele alalım
        if (fileNameParam && !result.documentId) {
          console.log('[CreateExamPage useEffect_inline_processing] UYARI: fileNameParam var ama result.documentId yok!');
          console.log('[CreateExamPage useEffect_inline_processing] fileNameParam:', fileNameParam);
          
          // Eğer konular tespit edildiyse (topicNameMap'de varsa) onları kullan
          if (result.topicNameMap && Object.keys(result.topicNameMap).length > 0) {
            console.log('[CreateExamPage useEffect_inline_processing] Konu isimleri mevcut, konular kullanılacak:', Object.keys(result.topicNameMap));
            // İlk tespit edilen konuyu otomatik olarak seç
            if (!hasSelectedTopics && Object.keys(result.topicNameMap).length > 0) {
              const firstTopic = Object.keys(result.topicNameMap)[0];
              console.log('[CreateExamPage useEffect_inline_processing] İlk konu otomatik seçiliyor:', firstTopic);
              
              // İlk konuyu seç ve preferences'a ekle
              result.preferences.topicIds = [firstTopic];
              toast(`"${result.topicNameMap[firstTopic]}" konusu otomatik olarak seçildi.`);
            }
          } else {
            // Konu isimleri yoksa ve belge varsa konuları otomatik tespit etmeyi dene
            if (result.file && result.file.size > 0 && !hasSelectedTopics) {
              try {
                console.log('[CreateExamPage useEffect_inline_processing] Dosyadan konular tespit edilmeye çalışılıyor...');
                
                // Belge metnini oku
                const formData = new FormData();
                formData.append('file', result.file);
                
                // Dosya yükleme ve konu tespitini aşamalı olarak yapalım
                const documentUploadResponse = await fetch('/api/documents/upload', {
                  method: 'POST',
                  body: formData
                });
                
                if (!documentUploadResponse.ok) {
                  throw new Error(`Belge yükleme başarısız: ${documentUploadResponse.status} ${documentUploadResponse.statusText}`);
                }
                
                const documentData = await documentUploadResponse.json();
                console.log('[CreateExamPage useEffect_inline_processing] Belge yüklendi:', documentData);
                
                // Belge ID'sini kaydet
                if (documentData && documentData.id) {
                  result.documentId = documentData.id;
                  console.log('[CreateExamPage useEffect_inline_processing] Belge ID alındı:', result.documentId);
                  
                  // Konuları tespit et
                  const topicsResponse = await fetch('/api/learning-targets/detect-topics', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ documentId: result.documentId }),
                  });
                  
                  if (!topicsResponse.ok) {
                    throw new Error(`Konu tespiti başarısız: ${topicsResponse.status} ${topicsResponse.statusText}`);
                  }
                  
                  const topicsData = await topicsResponse.json();
                  console.log('[CreateExamPage useEffect_inline_processing] Tespit edilen konular:', topicsData);
                  
                  if (topicsData && topicsData.topics && topicsData.topics.length > 0) {
                    // Konu ID ve isimlerini kaydet
                    const topicNameMap: Record<string, string> = {};
                    const topicIds: string[] = [];
                    
                    for (const topic of topicsData.topics) {
                      topicNameMap[topic.id] = topic.name;
                      topicIds.push(topic.id);
                    }
                    
                    // En az bir konu varsa, ilk konuyu otomatik seç
                    if (topicIds.length > 0) {
                      result.topicNameMap = topicNameMap;
                      result.preferences.topicIds = [topicIds[0]];
                      toast(`"${topicNameMap[topicIds[0]]}" konusu otomatik olarak tespit edildi ve seçildi.`);
                      console.log('[CreateExamPage useEffect_inline_processing] Konu otomatik seçildi:', topicNameMap[topicIds[0]]);
                      // Artık konu seçildi, devam edebiliriz
                      // Not: hasSelectedTopics state değişkenidir, burada topicIds kontrolü ile devam ediyoruz
                    }
                  }
                }
              } catch (error) {
                console.error('[CreateExamPage useEffect_inline_processing] Konu tespiti sırasında hata:', error);
                // Hata oluşsa bile devam etmeyi deneyelim
              }
            }
          
            // Konular hala yoksa ve konu seçilmemişse hata ver
            // Konu ID'lerini yeniden kontrol et
            const updatedHasSelectedTopics = (result.preferences.topicIds || []).length > 0;
            if (!updatedHasSelectedTopics) {
              console.error('[CreateExamPage useEffect_inline_processing] HATA: DocumentId yok, dosya adı var ama konu seçilmemiş');
              toast.error("Belge ID bulunamadı ve hiçbir konu seçilmemiş. Lütfen en az bir konu seçin.");
              setProcessingQuiz(false);
              setIsSubmitting(false);
              return;
            }
          }
        }

        // Veri referanslarını korumak için deep clone yapalım
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
