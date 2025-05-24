"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Card, CardBody, CardHeader, Progress, Chip, Accordion, AccordionItem,
  ScrollShadow, Divider, Tooltip, Modal, ModalContent, ModalHeader, ModalBody,
  ModalFooter, useDisclosure, Link, CircularProgress, Avatar, Tabs, Tab
} from "@nextui-org/react";
import {
  CheckCircle, XCircle, ListChecks, Target, Info, BarChart2, ChevronLeft, Medal,
  Award, BookOpen, AlertTriangle, Save, TrendingUp, TrendingDown, HelpCircle, Layers,
  Star, Trophy, Brain, Clock, ChevronRight, Sparkles, Zap, FileText, Users, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quiz, DifficultyLevel, AnalysisResult } from '../../../../types/quiz.type';
import { useQuizAnalysis } from '@/hooks/api/useQuizzes';
import quizService from '@/services/quiz.service';
import { ErrorService } from "@/services/error.service";



// localStorage'dan sonuçları almak için fonksiyon
const getQuizResultsFromStorage = (quizId: string): Quiz | null => {
  if (typeof window !== "undefined") {
    const storedResults = localStorage.getItem(`quizResult_${quizId}`);
    if (storedResults) {
      try {
        const parsed = JSON.parse(storedResults) as Quiz;
        // Eskiden kaydedilmiş sonuçlarda analysisResult olmayabilir, kontrol edelim
        if (parsed.questions && !parsed.analysisResult && parsed.userAnswers) {
           console.warn(`[DEBUG] localStorage'dan yüklenen quiz (${quizId}) için analysisResult eksik. Yeniden hesaplanacak.`);
           // Burada basit bir yeniden hesaplama tetiklenebilir veya null bırakılıp API'ye güvenilebilir.
           // Şimdilik, bu durumun API'den veri çekilerek çözülmesini bekleyelim.
        }
        return parsed;
      } catch (error) {
        console.error("localStorage sonuçları parse edilirken hata:", error);
        localStorage.removeItem(`quizResult_${quizId}`); // Bozuk veriyi temizle
        return null;
      }
    }
  }
  return null;
};

const checkIfQuizSavedToServer = (quizId: string): boolean => {
  if (typeof window !== "undefined") {
    // Backend'e kaydedilmişse farklı bir anahtar kullanılabilir veya API'den kontrol edilebilir.
    // Şimdilik basit localStorage kontrolü devam ediyor.
    return localStorage.getItem(`quizSavedToServer_${quizId}`) === 'true';
  }
  return false;
};

const markQuizAsSavedToServer = (quizId: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`quizSavedToServer_${quizId}`, 'true');
  }
};


export default function QuizResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [resultData, setResultData] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isQuizSaved, setIsQuizSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const {isOpen: isSaveConfirmOpen, onOpen: onSaveConfirmOpen, onClose: onSaveConfirmClose} = useDisclosure();

  const { data: apiAnalysisData, isLoading: isAnalysisLoading, error: analysisApiError } = useQuizAnalysis(id);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading || isAnalysisLoading) {
      timeoutId = setTimeout(() => {
        if (isLoading || isAnalysisLoading) { // Hala yükleniyorsa
          console.warn('Sınav sonuçları yükleme zaman aşımı - 15 saniye geçti');
          setIsLoading(false);
          setError('Sınav sonuçları yüklenirken zaman aşımı oluştu. Lütfen sayfayı yenileyin.');
        }
      }, 15000);
    }
    return () => clearTimeout(timeoutId);
  }, [isLoading, isAnalysisLoading]);

  useEffect(() => {
    if (id) {
      setIsQuizSaved(checkIfQuizSavedToServer(id));
    }
  }, [id]);

  useEffect(() => {
    const fetchAndProcessQuizData = async () => {
      if (!id) {
        setError("Sınav ID'si bulunamadı.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      let dataFromStorage = getQuizResultsFromStorage(id);

      if (dataFromStorage) {
        console.log("[DEBUG] Quiz sonuçları localStorage'dan yüklendi:", dataFromStorage);
        // quizType eksikse varsayılan ata
        if (!dataFromStorage.quizType) {
          dataFromStorage.quizType = "quick"; // veya 'personalized' olabilir, duruma göre
          console.warn("[DEBUG] localStorage verisinde quizType eksik, 'quick' olarak atandı.");
        }
        // analysisResult yoksa veya eksikse API'dan gelecek veriyi bekle
        if (!dataFromStorage.analysisResult) {
             console.warn(`[DEBUG] localStorage'dan yüklenen quiz (${id}) için analysisResult eksik. API'dan analiz verisi beklenecek.`);
        }
        setResultData(dataFromStorage);
      } else {
        console.log("[DEBUG] Quiz sonuçları localStorage'da bulunamadı, API'dan çekiliyor...");
        try {
          const apiQuizData = await quizService.getQuizById(id);
          if (apiQuizData) {
            console.log("[DEBUG] Temel Quiz verileri API'dan yüklendi:", apiQuizData);
            if (!apiQuizData.quizType) {
              apiQuizData.quizType = "quick";
               console.warn("[DEBUG] API verisinde quizType eksik, 'quick' olarak atandı.");
            }
            // API'den gelen quiz datası userAnswers veya analysisResult içermeyebilir.
            // Bunlar ya localStorage'dan (ExamPage sonrası) ya da useQuizAnalysis'ten gelmeli.
            // Şimdilik temel veriyi set et, analysisResult daha sonra birleşecek.
            setResultData(apiQuizData);
          } else {
            setError("Sınav sonuçları API'dan bulunamadı.");
            setIsLoading(false);
            return;
          }
        } catch (apiFetchError) {
          console.error("[DEBUG] API'dan quiz verileri alınırken hata:", apiFetchError);
          setError("Sınav temel verilerini yüklerken bir hata oluştu.");
          setIsLoading(false);
          return;
        }
      }
      // setIsLoading(false) burada çağrılmıyor, çünkü apiAnalysisData bekleniyor olabilir.
    };

    fetchAndProcessQuizData();
  }, [id]);

  useEffect(() => {
    if (resultData && apiAnalysisData) {
      console.log("[DEBUG] API'dan analiz verisi geldi, resultData ile birleştiriliyor:", apiAnalysisData);
      
      // Gelen API analiz verisini types/quiz.ts içindeki AnalysisResult'a uygun hale getir.
      const processedApiAnalysis: AnalysisResult = {
        overallScore: apiAnalysisData.overallScore || 0,
        performanceBySubTopic: {},
        performanceByDifficulty: apiAnalysisData.performanceByDifficulty || {
          easy: { count: 0, correct: 0, score: 0 },
          medium: { count: 0, correct: 0, score: 0 },
          hard: { count: 0, correct: 0, score: 0 },
          mixed: { count: 0, correct: 0, score: 0 },
        },
        performanceCategorization: apiAnalysisData.performanceCategorization || {
          mastered: [], medium: [], failed: []
        },
        recommendations: apiAnalysisData.recommendations || []
      };

      if (apiAnalysisData.performanceBySubTopic) {
        Object.entries(apiAnalysisData.performanceBySubTopic as AnalysisResult['performanceBySubTopic']).forEach(([key, value]) => {
          let statusForProcessedApi: "pending" | "failed" | "medium" | "mastered";

          const incomingStatus = value.status ? String(value.status).toLowerCase() : null;

          if (incomingStatus === "pending") {
            statusForProcessedApi = "pending";
          } else if (incomingStatus === "failed") {
            statusForProcessedApi = "failed";
          } else if (incomingStatus === "medium") {
            statusForProcessedApi = "medium";
          } else if (incomingStatus === "mastered") {
            statusForProcessedApi = "mastered";
          } else { 
            const score = typeof value.scorePercent === 'number' ? value.scorePercent : 0;
            if (score >= 75) statusForProcessedApi = "mastered";
            else if (score >= 50) statusForProcessedApi = "medium";
            else statusForProcessedApi = "failed";
          }
          
          processedApiAnalysis.performanceBySubTopic[key] = {
            scorePercent: typeof value.scorePercent === 'number' ? value.scorePercent : 0,
            status: statusForProcessedApi,
            questionCount: typeof value.questionCount === 'number' ? value.questionCount : 0,
            correctCount: typeof value.correctCount === 'number' ? value.correctCount : 0,
          };
        });
      }
      
      setResultData(prev => prev ? { ...prev, analysisResult: processedApiAnalysis } : null);
       console.log("[DEBUG] API analizi ile güncellenmiş resultData:", resultData);
    }

    // Yükleme durumunu kontrol et
    if(!isAnalysisLoading && resultData) { // Hem temel data hem de analiz datası (veya denemesi) tamamlandıysa
        setIsLoading(false);
        if (analysisApiError && resultData.quizType === "quick" && !isQuizSaved && !resultData.analysisResult) {
             setWarning("Sınav sonuçları sunucudan yüklenemedi. Sonuçlar yerel olarak hesaplandı. İsterseniz kaydedebilirsiniz.");
        } else if (analysisApiError && !resultData.analysisResult) {
             setWarning("Sınav analizleri sunucudan yüklenirken bir sorun oluştu. Gösterilen analizler yerel olarak hesaplanmış olabilir.");
        }
    }

  }, [apiAnalysisData, resultData, isAnalysisLoading, analysisApiError, isQuizSaved]);


  // Fallback: resultData yüklendi ama analysisResult hala yoksa (ne localStorage'dan ne de API'den)
  useEffect(() => {
    if (!isLoading && resultData && !resultData.analysisResult) {
      console.warn("[DEBUG] resultData yüklendi ancak analysisResult yok. Yerel fallback analiz hesaplanıyor.");
      const localAnalysis = calculateLocalAnalysis(resultData);
      setResultData(prev => prev ? { ...prev, analysisResult: localAnalysis } : null);
      if (resultData.quizType === "quick" && !isQuizSaved) {
         setWarning("Sınav analizleri sunucudan alınamadı ve yerel olarak hesaplandı. Sonuçlarınızı kaydetmek için aşağıdaki butonu kullanabilirsiniz.");
      }
    }
  }, [isLoading, resultData, isQuizSaved]);


  const calculateLocalAnalysis = (quizData: Quiz): AnalysisResult => {
    // Bu fonksiyon, !resultData.analysisResult durumunda çağrılan
    // mevcut kodunuzdaki analiz hesaplama mantığını içermeli.
    // Kısaca özetliyorum, detayları mevcut kodunuzdan alabilirsiniz.
    const correctCount = quizData.correctCount ?? quizData.questions.reduce((count, q) => 
        (quizData.userAnswers?.[q.id] === q.correctAnswer ? count + 1 : count), 0);
    const totalQuestions = quizData.questions.length;
    const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const performanceBySubTopic: AnalysisResult['performanceBySubTopic'] = {};
    const subTopics = new Set(quizData.questions.map(q => q.subTopic || 'Diğer Konular'));
    
    subTopics.forEach(subTopic => {
      const subTopicQuestions = quizData.questions.filter(q => (q.subTopic || 'Diğer Konular') === subTopic);
      const subTopicCorrectCount = subTopicQuestions.reduce((count, q) => 
          (quizData.userAnswers?.[q.id] === q.correctAnswer ? count + 1 : count), 0);
      const subTopicScore = subTopicQuestions.length > 0 ? Math.round((subTopicCorrectCount / subTopicQuestions.length) * 100) : 0;
      let status: "pending" | "failed" | "medium" | "mastered" = "failed";
      if (subTopicScore >= 75) status = "mastered";
      else if (subTopicScore >= 50) status = "medium";
      
      performanceBySubTopic[subTopic] = {
        scorePercent: subTopicScore, status,
        questionCount: subTopicQuestions.length, correctCount: subTopicCorrectCount
      };
    });

    // performanceByDifficulty ve performanceCategorization da benzer şekilde hesaplanmalı.
    // (Mevcut kodunuzdaki mantığı buraya taşıyın)
    // ... (Hesaplamalar) ...
    
    return {
      overallScore,
      performanceBySubTopic,
      performanceByDifficulty: { /* ... */ } as AnalysisResult['performanceByDifficulty'],
      performanceCategorization: { /* ... */ } as AnalysisResult['performanceCategorization'],
      recommendations: ["Bu analiz, sunucudan veri alınamadığı için yerel olarak hesaplanmıştır."]
    };
  };


  const handleSaveQuiz = async () => {
    if (!resultData) return;
    setIsSaving(true);
    onSaveConfirmClose();
    try {
      // TODO: Backend entegrasyonu
      // const savedQuiz = await quizService.saveQuickQuiz(resultData);
      // setResultData(savedQuiz); // Eğer API yeni ID veya güncellenmiş veri dönerse
      // markQuizAsSavedToServer(savedQuiz.id);
      // if (id !== savedQuiz.id) router.replace(`/exams/${savedQuiz.id}/results`, { scroll: false });

      // Şimdilik lokal işaretleme
      markQuizAsSavedToServer(resultData.id);
      setIsQuizSaved(true);
      setWarning(null);
      ErrorService.showToast("Sınav başarıyla kaydedildi!", "success", "İşlem Başarılı");
    } catch (error) {
      console.error("Sınav kaydedilirken hata:", error);
      ErrorService.showToast("Sınav kaydedilirken bir hata oluştu.", "error", "Hata");
    } finally {
      setIsSaving(false);
    }
  };

  const getOverallStatusChip = (score: number) => {
    if (score >= 75) return <Chip color="success" variant="flat" startContent={<TrendingUp size={16}/>}>Çok İyi</Chip>;
    if (score >= 50) return <Chip color="warning" variant="flat" startContent={<Layers size={16}/>}>Gelişmekte</Chip>;
    return <Chip color="danger" variant="flat" startContent={<TrendingDown size={16}/>}>Zayıf</Chip>;
  };
  
  const getIconForAnswer = (userAnswer?: string, correctAnswer?: string, isCorrect?: boolean) => {
    // isCorrect parametresi öncelikli
    if (isCorrect === true) return <Tooltip content="Doğru Cevap"><CheckCircle className="text-green-400" size={20}/></Tooltip>;
    if (isCorrect === false) return <Tooltip content="Yanlış Cevap"><XCircle className="text-red-400" size={20}/></Tooltip>;
    
    // isCorrect yoksa, userAnswer ve correctAnswer ile kontrol et
    if (userAnswer && correctAnswer) {
       return userAnswer === correctAnswer ? 
         <Tooltip content="Doğru Cevap"><CheckCircle className="text-green-400" size={20}/></Tooltip> : 
         <Tooltip content="Yanlış Cevap"><XCircle className="text-red-400" size={20}/></Tooltip>;
    }
    return <Tooltip content="Cevaplanmadı"><HelpCircle className="text-gray-500" size={20}/></Tooltip>;
  };

  const getDifficultyName = (difficulty: DifficultyLevel | undefined): string => {
    if (!difficulty) return 'Belirsiz';
    switch (difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      case 'mixed': return 'Karışık';
      default: return String(difficulty);
    }
  };

  const formatSubTopicName = (subTopic: string | undefined): string => {
    if (!subTopic || subTopic.trim() === '') return "Diğer Konular";
    return subTopic.split(/[-_.\s]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };
  
  // --- RENDER KISMI --- //

  if (isLoading) { // Sadece isLoading, isAnalysisLoading ayrıca ele alınıyor
    return (
      <div className="container mx-auto p-4 text-center flex justify-center items-center min-h-screen">
        <Card className="max-w-md mx-auto p-8 bg-gray-800 shadow-xl">
          <CardBody className="items-center justify-center">
            <CircularProgress aria-label="Yükleniyor..." size="lg" color="secondary" className="mb-4" />
            <p className="text-lg text-gray-300">Sınav sonuçları yükleniyor...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center flex justify-center items-center min-h-screen">
        <Card className="max-w-md mx-auto p-8 bg-gray-800 shadow-xl">
          <CardBody className="items-center justify-center">
            <XCircle size={48} className="text-danger mb-4" />
            <p className="text-lg text-red-400">{error}</p>
            <Button 
              color="secondary" 
              variant="ghost"
              className="mt-6"
              startContent={<ChevronLeft size={18} />}
              onPress={() => router.back()}
            >
              Geri Dön
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!resultData || !resultData.analysisResult) { // analysisResult da kontrol ediliyor
    // Bu durum, veri yükleme hatası veya eksik veri anlamına gelir.
    // Eğer isLoading false ise ve buradaysak, bir sorun var.
    return (
      <div className="container mx-auto p-4 text-center flex justify-center items-center min-h-screen">
        <Card className="max-w-md mx-auto p-8 bg-gray-800 shadow-xl">
          <CardBody className="items-center justify-center">
            <Info size={48} className="text-warning mb-4" />
            <p className="text-lg text-yellow-400">Sınav sonuçları veya analiz verileri tam olarak yüklenemedi.</p>
            <p className="text-sm text-gray-400 mt-2">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
            <Button 
              color="secondary" 
              variant="ghost"
              className="mt-6"
              startContent={<ChevronLeft size={18} />}
              onPress={() => router.back()}
            >
              Geri Dön
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const analysisData = resultData.analysisResult;
  const { userAnswers = {}, questions = [] } = resultData;
  const correctCount = resultData.correctCount ?? questions.reduce((count, q) => (userAnswers[q.id] === q.correctAnswer ? count + 1 : count), 0);
  const totalQuestions = resultData.totalQuestions ?? questions.length;
  const wrongCount = totalQuestions - correctCount;

  const processedQuestions = questions.map(q => ({
    ...q,
    userAnswer: userAnswers[q.id] || "Cevaplanmadı",
    isCorrect: userAnswers[q.id] === q.correctAnswer,
  }));

  const questionsBySubTopic = processedQuestions.reduce((acc, q) => {
    const subTopicKey = q.subTopic || 'Diğer Konular';
    if (!acc[subTopicKey]) acc[subTopicKey] = [];
    acc[subTopicKey].push(q);
    return acc;
  }, {} as Record<string, typeof processedQuestions>);

  const difficultyColors: Record<DifficultyLevel | 'default', string> = {
    easy: "bg-green-500/20 text-green-300 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    hard: "bg-red-500/20 text-red-300 border-red-500/30",
    mixed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    default: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  };

  // Zorluk seviyesi etiketini al
  function getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      easy: "Kolay",
      medium: "Orta",
      hard: "Zor",
      mixed: "Karışık"
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-900 transition-colors duration-300">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-400/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {warning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 shadow-lg backdrop-blur-sm">
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={24} />
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{warning}</p>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Main Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
                <div className="bg-white dark:bg-slate-800 rounded-3xl">
                  <CardHeader className="p-8">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar
                            size="lg"
                            className="w-16 h-16 ring-4 ring-blue-500/20 bg-gradient-to-br from-blue-500 to-purple-600"
                            fallback={<Trophy className="text-white" size={32} />}
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <Sparkles className="text-white" size={12} />
                          </div>
                        </div>
                        <div>
                          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
                            {resultData.title || "Sınav Sonuçları"}
                          </h1>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{new Date(resultData.timestamp).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>{resultData.elapsedTime ? `${Math.round(resultData.elapsedTime / 60)} dk` : 'Süre kaydedilmedi'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText size={16} />
                              <span>ID: {id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getModernStatusChip(analysisData.overallScore)}
                        <Button
                          as={Link}
                          href={resultData.courseId ? `/courses/${resultData.courseId}` : "/exams"}
                          variant="bordered"
                          size="lg"
                          className="border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300"
                          startContent={<ChevronLeft size={18} />}
                        >
                          Geri Dön
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Score Overview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
          >
            <ModernScoreCard
              icon={<Brain className="text-blue-500" size={32} />}
              title="Genel Başarı"
              value={`${analysisData.overallScore}%`}
              progress={analysisData.overallScore}
              color="blue"
              delay={0}
            />
            <ModernScoreCard
              icon={<ListChecks className="text-indigo-500" size={32} />}
              title="Toplam Soru"
              value={totalQuestions.toString()}
              subtitle={`${questions.length} soru yanıtlandı`}
              color="indigo"
              delay={0.1}
            />
            <ModernScoreCard
              icon={<CheckCircle className="text-green-500" size={32} />}
              title="Doğru Cevap"
              value={correctCount.toString()}
              subtitle={`${Math.round((correctCount / totalQuestions) * 100)}% doğruluk`}
              color="green"
              delay={0.2}
            />
            <ModernScoreCard
              icon={<XCircle className="text-red-500" size={32} />}
              title="Yanlış Cevap"
              value={wrongCount.toString()}
              subtitle={`${Math.round((wrongCount / totalQuestions) * 100)}% hata`}
              color="red"
              delay={0.3}
            />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs 
            aria-label="Analiz Sekmeleri" 
            variant="underlined"
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            disallowEmptySelection
            classNames={{
              tabList: "gap-6 w-full relative rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-2 border border-slate-200 dark:border-slate-700",
              cursor: "w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg",
              tab: "max-w-fit px-6 py-3 h-12 font-semibold",
              tabContent: "group-data-[selected=true]:text-white group-data-[selected=false]:text-slate-600 dark:group-data-[selected=false]:text-slate-400"
            }}
          >
            <Tab 
              key="overview" 
              title={
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} />
                  <span>Genel Bakış</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Performance by Topic */}
                <div className="lg:col-span-1">
                  <ModernAnalysisCard
                    icon={<Target className="text-purple-500" size={24} />}
                    title="Konu Performansı"
                    className="h-full"
                  >
                    <ScrollShadow className="space-y-3 max-h-[400px]">
                      {analysisData.performanceBySubTopic && Object.keys(analysisData.performanceBySubTopic).length > 0 ? (
                        Object.entries(analysisData.performanceBySubTopic).map(([subTopic, stp], index) => (
                          <motion.div
                            key={subTopic}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                          >
                            <TopicPerformanceItem
                              title={formatSubTopicName(subTopic)}
                              score={stp.scorePercent}
                              correct={stp.correctCount}
                              total={stp.questionCount}
                              index={index + 1}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <EmptyStateMessage message="Konu performans verisi bulunamadı." />
                      )}
                    </ScrollShadow>
                  </ModernAnalysisCard>
                </div>

                {/* Difficulty Analysis */}
                <div className="lg:col-span-1">
                  <ModernAnalysisCard
                    icon={<Award className="text-amber-500" size={24} />}
                    title="Zorluk Analizi"
                    className="h-full"
                  >
                    <div className="space-y-4">
                      {analysisData.performanceByDifficulty && Object.values(analysisData.performanceByDifficulty).some(d => d.count > 0) ? (
                        Object.entries(analysisData.performanceByDifficulty)
                          .filter(([, data]) => data.count > 0)
                          .map(([difficulty, data], index) => (
                            <motion.div
                              key={difficulty}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <DifficultyAnalysisItem
                                difficulty={difficulty as DifficultyLevel}
                                score={data.score}
                                correct={data.correct}
                                total={data.count}
                              />
                            </motion.div>
                          ))
                      ) : (
                        <EmptyStateMessage message="Zorluk seviyesi verisi bulunamadı." />
                      )}
                    </div>
                  </ModernAnalysisCard>
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-1">
                  <ModernAnalysisCard
                    icon={<BookOpen className="text-emerald-500" size={24} />}
                    title="Öneriler & Değerlendirme"
                    className="h-full"
                  >
                    <div className="space-y-6">
                      {analysisData.performanceCategorization && (
                        <>
                          {analysisData.performanceCategorization.mastered?.length > 0 && (
                            <RecommendationSection
                              title="Uzmanlaştığınız Konular"
                              items={analysisData.performanceCategorization.mastered.map(formatSubTopicName)}
                              icon={<Medal size={20} />}
                              color="text-green-500"
                              bgColor="bg-green-50 dark:bg-green-950/30"
                            />
                          )}
                          {analysisData.performanceCategorization.medium?.length > 0 && (
                            <RecommendationSection
                              title="Geliştirilebilecek Konular"
                              items={analysisData.performanceCategorization.medium.map(formatSubTopicName)}
                              icon={<Target size={18} />}
                              color="text-amber-500"
                              bgColor="bg-amber-50 dark:bg-amber-950/30"
                            />
                          )}
                          {analysisData.performanceCategorization.failed?.length > 0 && (
                            <RecommendationSection
                              title="Tekrar Edilmesi Gereken Konular"
                              items={analysisData.performanceCategorization.failed.map(formatSubTopicName)}
                              icon={<AlertTriangle size={18} />}
                              color="text-red-500"
                              bgColor="bg-red-50 dark:bg-red-950/30"
                            />
                          )}
                        </>
                      )}
                      
                      {analysisData.recommendations && analysisData.recommendations.length > 0 && (
                        <RecommendationSection
                          title="Kişisel Öneriler"
                          items={analysisData.recommendations}
                          icon={<Zap size={20} />}
                          color="text-blue-500"
                          bgColor="bg-blue-50 dark:bg-blue-950/30"
                        />
                      )}
                    </div>
                  </ModernAnalysisCard>
                </div>
              </div>
            </Tab>

            <Tab 
              key="questions" 
              title={
                <div className="flex items-center gap-2">
                  <ListChecks size={18} />
                  <span>Soru Detayları</span>
                </div>
              }
            >
              <div className="mt-8">
                <ModernAnalysisCard
                  icon={<ListChecks className="text-blue-500" size={24} />}
                  title="Soru Bazlı Analiz"
                  className="overflow-hidden"
                >
                  {Object.keys(questionsBySubTopic).length > 0 ? (
                    <Accordion 
                      selectionMode="multiple" 
                      variant="splitted"
                      className="gap-4"
                      itemClasses={{
                        base: "group-[.is-splitted]:shadow-lg group-[.is-splitted]:bg-gradient-to-r group-[.is-splitted]:from-white group-[.is-splitted]:to-blue-50/50 dark:group-[.is-splitted]:from-slate-800 dark:group-[.is-splitted]:to-slate-800/80 group-[.is-splitted]:rounded-2xl border border-slate-200 dark:border-slate-700 group-[.is-splitted]:hover:border-blue-300 dark:group-[.is-splitted]:hover:border-blue-600 transition-all duration-300",
                        trigger: "p-6 text-lg font-semibold text-slate-800 dark:text-slate-200 data-[hover=true]:bg-blue-50/50 dark:data-[hover=true]:bg-blue-950/30 rounded-2xl transition-colors",
                        indicator: "text-slate-500 dark:text-slate-400",
                        title: "text-slate-800 dark:text-slate-100",
                        subtitle: "text-sm text-slate-500 dark:text-slate-400 font-normal",
                        content: "pt-0 pb-6 px-6 text-slate-700 dark:text-slate-300"
                      }}
                    >
                      {Object.entries(questionsBySubTopic).map(([subTopic, subTopicQuestions]) => (
                        <AccordionItem 
                          key={subTopic}
                          aria-label={subTopic}
                          title={formatSubTopicName(subTopic)}
                          indicator={({ isOpen }) => <ChevronRight size={20} className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}/>}
                          subtitle={
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <ListChecks size={14} />
                                {subTopicQuestions.length} soru
                              </span>
                              <span className="flex items-center gap-1">
                                <BarChart2 size={14} /> 
                                {subTopicQuestions.length > 0 ? Math.round(subTopicQuestions.filter(q => q.isCorrect).length / subTopicQuestions.length * 100) : 0}% başarı
                              </span>
                            </div>
                          }
                        >
                          <div className="space-y-6">
                            {subTopicQuestions.map((q, index) => (
                              <ModernQuestionCard
                                key={q.id}
                                question={q}
                                index={index + 1}
                                userAnswer={q.userAnswer}
                                isCorrect={q.isCorrect}
                              />
                            ))}
                          </div>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <EmptyStateMessage message="Soru bazlı analiz verisi bulunamadı." />
                  )}
                </ModernAnalysisCard>
              </div>
            </Tab>
          </Tabs>
        </motion.div>

        {/* Save Quiz Button */}
        {resultData && resultData.quizType === 'quick' && !isQuizSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center"
          >
            <Button 
              color="success"
              size="lg"
              className="font-bold text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              startContent={<Save size={24} />}
              onPress={onSaveConfirmOpen}
              isLoading={isSaving}
              isDisabled={isSaving}
            >
              Sınavı Kalıcı Olarak Kaydet
            </Button>
          </motion.div>
        )}
        
        {/* Save Confirmation Modal */}
        <Modal 
          isOpen={isSaveConfirmOpen} 
          onClose={onSaveConfirmClose} 
          backdrop="blur" 
          classNames={{
            base: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-3xl", 
            header: "text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700", 
            body: "text-slate-700 dark:text-slate-300 py-6", 
            footer: "border-t border-slate-200 dark:border-slate-700 pt-6"
          }}
        >
          <ModalContent>
            <ModalHeader className="text-xl font-bold">Sınavı Kaydet</ModalHeader>
            <ModalBody>
              <p className="text-lg">Bu hızlı sınavı ve sonuçlarını hesabınıza kalıcı olarak kaydetmek istediğinizden emin misiniz?</p>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="light" 
                onPress={onSaveConfirmClose} 
                isDisabled={isSaving} 
                className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
              >
                İptal
              </Button>
              <Button 
                color="success" 
                onPress={handleSaveQuiz} 
                isLoading={isSaving} 
                isDisabled={isSaving} 
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl"
              >
                Evet, Kaydet
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
} 

// Yardımcı Bileşenler (Sayfanın altında veya ayrı bir dosyada olabilir)
const InfoPill: React.FC<{icon: React.ReactNode, label: string, value: string}> = ({icon, label, value}) => (
  <div className="p-5 bg-gray-700/40 rounded-lg shadow-md flex flex-col items-center justify-center">
    <div className="mb-2 text-primary">{icon}</div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm font-medium text-gray-400 mt-1">{label}</p>
  </div>
);

type CardBodyProps = {
  className?: string;
  [key: string]: unknown;
};

const AnalysisCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  cardBodyProps?: CardBodyProps;
}> = ({ title, icon, children, cardBodyProps }) => (
  <Card className="bg-gray-800/60 shadow-xl rounded-xl border border-gray-700/60 backdrop-blur-sm">
    <CardHeader className="p-5">
      <h2 className="text-xl font-semibold flex items-center gap-2.5 text-gray-100">
        {icon} {title}
      </h2>
    </CardHeader>
    <Divider className="bg-gray-700/50"/>
    <CardBody className="p-5" {...cardBodyProps}>
      {children}
    </CardBody>
  </Card>
);

const EmptyStateMessage: React.FC<{message: string}> = ({message}) => (
  <p className="text-sm text-gray-500 text-center py-6 italic">{message}</p>
);

const CategorizationList: React.FC<{title: string, items: string[], icon: React.ReactNode, color: string}> = ({title, items, icon, color}) => (
  <div>
    <h4 className={`font-semibold flex items-center gap-2 mb-1.5 ${color}`}>
      {icon} {title}:
    </h4>
    <ul className="list-disc list-inside pl-2 text-sm space-y-1 text-gray-300">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  </div>
);

// Modern Helper Components
interface ModernScoreCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  color: string;
  delay: number;
}

const ModernScoreCard: React.FC<ModernScoreCardProps> = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  progress, 
  color, 
  delay 
}) => {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800",
    indigo: "from-indigo-500/10 to-indigo-600/10 border-indigo-200 dark:border-indigo-800",
    green: "from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800",
    red: "from-red-500/10 to-red-600/10 border-red-200 dark:border-red-800",
    purple: "from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800",
    amber: "from-amber-500/10 to-amber-600/10 border-amber-200 dark:border-amber-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="group"
    >
      <Card className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden`}>
        <CardBody className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-700/50 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            {progress !== undefined && (
              <div className="text-right">
                <CircularProgress
                  size="sm"
                  value={progress}
                  color={color === 'green' ? 'success' : color === 'red' ? 'danger' : color === 'amber' ? 'warning' : 'primary'}
                  strokeWidth={3}
                  classNames={{
                    svg: "w-12 h-12 drop-shadow-sm",
                    value: "text-xs font-bold",
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

interface ModernAnalysisCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ModernAnalysisCard: React.FC<ModernAnalysisCardProps> = ({ 
  icon, 
  title, 
  children, 
  className = "" 
}) => (
  <Card className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl overflow-hidden ${className}`}>
    <CardHeader className="p-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
    </CardHeader>
    <CardBody className="p-6 pt-2">
      {children}
    </CardBody>
  </Card>
);

interface TopicPerformanceItemProps {
  title: string;
  score: number;
  correct: number;
  total: number;
  index: number;
}

const TopicPerformanceItem: React.FC<TopicPerformanceItemProps> = ({ 
  title, 
  score, 
  correct, 
  total, 
  index 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "success";
    if (score >= 50) return "warning";
    return "danger";
  };

  return (
    <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-all duration-300 group-hover:scale-105">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
            {index}
          </div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm" title={title}>
            {title.length > 20 ? `${title.substring(0, 20)}...` : title}
          </h4>
        </div>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <Progress 
        value={score} 
        size="md" 
        color={getProgressColor(score)}
        className="mb-2"
        classNames={{
          track: "bg-slate-200 dark:bg-slate-600",
          indicator: "bg-gradient-to-r"
        }}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
        {correct}/{total} doğru
      </p>
    </div>
  );
};

interface DifficultyAnalysisItemProps {
  difficulty: DifficultyLevel;
  score: number;
  correct: number;
  total: number;
}

const DifficultyAnalysisItem: React.FC<DifficultyAnalysisItemProps> = ({ 
  difficulty, 
  score, 
  correct, 
  total 
}) => {
  const getDifficultyConfig = (difficulty: DifficultyLevel) => {
    const configs = {
      easy: { color: "success", icon: "🟢", label: "Kolay", bg: "bg-green-50 dark:bg-green-950/30" },
      medium: { color: "warning", icon: "🟡", label: "Orta", bg: "bg-amber-50 dark:bg-amber-950/30" },
      hard: { color: "danger", icon: "🔴", label: "Zor", bg: "bg-red-50 dark:bg-red-950/30" },
      mixed: { color: "primary", icon: "🔵", label: "Karışık", bg: "bg-blue-50 dark:bg-blue-950/30" }
    };
    return configs[difficulty] || configs.medium;
  };

  const config = getDifficultyConfig(difficulty);

  return (
    <div className={`p-4 rounded-2xl ${config.bg} border border-slate-200 dark:border-slate-600`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <Chip 
            size="sm" 
            variant="flat" 
            className="font-semibold"
            color={config.color as any}
          >
            {config.label}
          </Chip>
        </div>
        <Chip 
          size="sm" 
          variant="flat" 
          className="font-bold"
          color={score >= 75 ? 'success' : score >= 50 ? 'warning' : 'danger'}
        >
          {score}%
        </Chip>
      </div>
      <Progress 
        value={score} 
        size="md" 
        color={score >= 75 ? 'success' : score >= 50 ? 'warning' : 'danger'}
        className="mb-2"
      />
      <p className="text-xs text-slate-600 dark:text-slate-400 text-right">
        {correct}/{total} doğru
      </p>
    </div>
  );
};

interface RecommendationSectionProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({ 
  title, 
  items, 
  icon, 
  color, 
  bgColor 
}) => (
  <div className={`p-4 rounded-2xl ${bgColor} border border-slate-200 dark:border-slate-600`}>
    <h4 className={`font-bold flex items-center gap-2 mb-3 ${color}`}>
      {icon} {title}
    </h4>
    <ul className="space-y-2">
      {items.slice(0, 3).map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0"></div>
          <span>{item}</span>
        </li>
      ))}
      {items.length > 3 && (
        <li className="text-xs text-slate-500 dark:text-slate-400 italic">
          +{items.length - 3} madde daha...
        </li>
      )}
    </ul>
  </div>
);

interface ModernQuestionCardProps {
  question: any;
  index: number;
  userAnswer: string;
  isCorrect: boolean;
}

const ModernQuestionCard: React.FC<ModernQuestionCardProps> = ({ 
  question, 
  index, 
  userAnswer, 
  isCorrect 
}) => {
  const getDifficultyConfig = (difficulty: DifficultyLevel) => {
    const configs = {
      easy: { color: "success", label: "Kolay", icon: "🟢" },
      medium: { color: "warning", label: "Orta", icon: "🟡" },
      hard: { color: "danger", label: "Zor", icon: "🔴" },
      mixed: { color: "primary", label: "Karışık", icon: "🔵" }
    };
    return configs[difficulty] || configs.medium;
  };

  const difficultyConfig = getDifficultyConfig(question.difficulty);

  return (
    <Card className={`border-l-4 ${isCorrect ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'} backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
      <CardBody className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center">
                  {index}
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">
                  Soru {index}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color={difficultyConfig.color as any}
                  startContent={<span>{difficultyConfig.icon}</span>}
                >
                  {difficultyConfig.label}
                </Chip>
                {isCorrect ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : (
                  <XCircle className="text-red-500" size={24} />
                )}
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              {question.questionText}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Seçenekler:</h5>
          <div className="grid gap-2">
            {question.options.map((option: string) => {
              const isUserAnswer = option === userAnswer;
              const isCorrectAnswer = option === question.correctAnswer;
              
              let bgClass = "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600";
              let textClass = "text-slate-700 dark:text-slate-300";
              let borderClass = "border-slate-300 dark:border-slate-600";
              let iconElement = null;

              if (isCorrectAnswer) {
                bgClass = "bg-green-100 dark:bg-green-950/30";
                textClass = "text-green-800 dark:text-green-200";
                borderClass = "border-green-400 dark:border-green-600";
                iconElement = <CheckCircle size={18} className="text-green-600" />;
              } else if (isUserAnswer) {
                bgClass = "bg-red-100 dark:bg-red-950/30";
                textClass = "text-red-800 dark:text-red-200";
                borderClass = "border-red-400 dark:border-red-600";
                iconElement = <XCircle size={18} className="text-red-600" />;
              }

              return (
                <div
                  key={option}
                  className={`p-3 rounded-xl border-2 ${bgClass} ${borderClass} ${textClass} transition-all duration-200 flex items-center gap-3`}
                >
                  {iconElement || <div className="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-500"></div>}
                  <span className="flex-grow font-medium">{option}</span>
                  {isUserAnswer && (
                    <span className="text-xs font-bold opacity-75">
                      (Sizin Seçiminiz)
                    </span>
                  )}
                  {isCorrectAnswer && !isUserAnswer && (
                    <span className="text-xs font-bold opacity-75">
                      (Doğru Cevap)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h6 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Açıklama:</h6>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const getModernStatusChip = (score: number) => {
  if (score >= 75) {
    return (
      <Chip 
        color="success" 
        variant="flat" 
        size="lg"
        className="font-bold"
        startContent={<Trophy size={18} />}
      >
        Mükemmel
      </Chip>
    );
  }
  if (score >= 50) {
    return (
      <Chip 
        color="warning" 
        variant="flat" 
        size="lg"
        className="font-bold"
        startContent={<TrendingUp size={18} />}
      >
        İyi
      </Chip>
    );
  }
  return (
    <Chip 
      color="danger" 
      variant="flat" 
      size="lg"
      className="font-bold"
      startContent={<TrendingDown size={18} />}
    >
      Geliştirilmeli
    </Chip>
  );
};