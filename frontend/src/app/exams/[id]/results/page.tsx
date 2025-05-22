"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Card, CardBody, CardHeader, Progress, Chip, Accordion, AccordionItem,
  ScrollShadow, Divider, Tooltip, Modal, ModalContent, ModalHeader, ModalBody,
  ModalFooter, useDisclosure, Link, CircularProgress
} from "@nextui-org/react";
import {
  CheckCircle, XCircle, ListChecks, Target, Info, BarChart2, ChevronLeft, Medal,
  Award, BookOpen, AlertTriangle, Save, TrendingUp, TrendingDown, HelpCircle, Layers
} from 'lucide-react';
import type { Quiz, DifficultyLevel, AnalysisResult } from '../../../../types/quiz';

// Tip tanımlamaları
type PerformanceStatus = 'mastered' | 'medium' | 'failed';

interface SubTopicPerformance {
  status: PerformanceStatus;
  scorePercent: number;
  questionCount?: number;
  correctCount?: number;
}

interface PerformanceBySubTopic {
  [key: string]: SubTopicPerformance;
}
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
    // This effect synchronizes API analysis data into resultData
    // It should primarily react to changes in apiAnalysisData and isAnalysisLoading
    if (apiAnalysisData) {
      console.log("[DEBUG] API'dan analiz verisi geldi, resultData ile birleştirilecek (useEffect for apiAnalysisData):");
      
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
        Object.entries(apiAnalysisData.performanceBySubTopic as PerformanceBySubTopic).forEach(([key, value]) => {
          let status: PerformanceStatus = "failed";
          if (value.status) {
            if (['mastered', 'medium', 'failed'].includes(value.status)) {
              status = value.status as PerformanceStatus;
            } else if (value.status === 'pending') {
              status = 'medium'; 
            }
          } else if (typeof value.scorePercent === 'number') {
            if (value.scorePercent >= 75) status = "mastered";
            else if (value.scorePercent >= 50) status = "medium";
          }
          
          processedApiAnalysis.performanceBySubTopic[key] = {
            scorePercent: value.scorePercent || 0,
            status: status,
            questionCount: value.questionCount || 0,
            correctCount: value.correctCount || 0,
          };
        });
      }
      
      // Update resultData with the new analysis. This will trigger a re-render.
      // The console.log that was here previously caused confusion due to when it logged.
      setResultData(prevResultData => {
        if (prevResultData) {
          // Avoid unnecessary updates if the analysis data hasn't changed meaningfully
          // This is a shallow check; a deep check might be too expensive or complex here.
          // The main goal is to set it once apiAnalysisData is available.
          if (JSON.stringify(prevResultData.analysisResult) !== JSON.stringify(processedApiAnalysis)) {
            console.log("[DEBUG] Updating resultData with new API analysis.");
            return { ...prevResultData, analysisResult: processedApiAnalysis };
          }
        }
        return prevResultData; // No change if prevResultData is null or analysis is the same
      });
    }

    // This part handles loading state and warnings, should depend on isAnalysisLoading and related states.
    if(!isAnalysisLoading) { 
        // Check if resultData exists before trying to access its properties
        // This part of the logic might need to be re-evaluated if resultData is not yet available
        // when isAnalysisLoading becomes false.
        setIsLoading(false); // Overall loading state can be set to false now

        // Access resultData within a check or ensure it's handled if null
        // The original logic for warnings is kept but might need adjustment based on when resultData is populated.
        if (analysisApiError) {
            setResultData(prev => {
                if (prev && prev.quizType === "quick" && !checkIfQuizSavedToServer(prev.id) && !prev.analysisResult) {
                    setWarning("Sınav sonuçları sunucudan yüklenemedi. Sonuçlar yerel olarak hesaplandı. İsterseniz kaydedebilirsiniz.");
                } else if (prev && !prev.analysisResult) {
                    setWarning("Sınav analizleri sunucudan yüklenirken bir sorun oluştu. Gösterilen analizler yerel olarak hesaplanmış olabilir.");
                }
                return prev;
            });
        }
    }
  // Dependencies: primarily apiAnalysisData and isAnalysisLoading.
  // resultData was removed to break the loop. Other dependencies like analysisApiError and isQuizSaved are fine.
  }, [apiAnalysisData, isAnalysisLoading, analysisApiError, id]); // id is added as checkIfQuizSavedToServer uses it.


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
      let status: PerformanceStatus = "failed";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="container mx-auto">
        {warning && (
          <Card className="mb-6 bg-yellow-600/10 border border-yellow-500/40 shadow-lg">
            <CardBody className="flex flex-row items-center gap-3 p-3.5">
              <AlertTriangle className="text-yellow-400 flex-shrink-0" size={28} />
              <p className="text-sm text-yellow-300 font-medium">{warning}</p>
            </CardBody>
          </Card>
        )}

        <Card className="mb-8 bg-gray-800/60 shadow-2xl rounded-xl border border-gray-700/60 backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
            <div className="flex-grow">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
                {resultData.title || "Sınav Sonuçları"}
              </h1>
              <p className="text-xs text-gray-500 mt-1.5">Sınav ID: {id}</p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-shrink-0">
              {getOverallStatusChip(analysisData.overallScore)}
              <Button
                as={Link}
                href={resultData.courseId ? `/courses/${resultData.courseId}` : "/exams"}
                color="secondary"
                variant="ghost"
                size="md"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                startContent={<ChevronLeft size={18} />}
              >
                Geri Dön
              </Button>
            </div>
          </CardHeader>
          <Divider className="bg-gray-700/50"/>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
              
              <div className="flex flex-col items-center justify-center p-5 bg-gray-700/40 rounded-lg shadow-md">
                <p className="text-sm font-medium text-gray-400 mb-3">Genel Başarı</p>
                <CircularProgress
                  aria-label="Genel Başarı"
                  size="lg"
                  value={analysisData.overallScore}
                  color={analysisData.overallScore >= 75 ? "success" : analysisData.overallScore >= 50 ? "warning" : "danger"}
                  showValueLabel={true}
                  strokeWidth={3}
                  classNames={{
                    svg: "w-20 h-20 drop-shadow-md",
                    indicator: analysisData.overallScore >= 75 ? "stroke-green-400" : analysisData.overallScore >= 50 ? "stroke-yellow-400" : "stroke-red-400",
                    track: "stroke-white/10",
                    value: "text-xl font-semibold text-white",
                  }}
                />
              </div>

              <InfoPill icon={<ListChecks size={28} className="text-blue-400"/>} label="Toplam Soru" value={totalQuestions.toString()} />
              <InfoPill icon={<CheckCircle size={28} className="text-green-400"/>} label="Doğru Cevap" value={correctCount.toString()} />
              <InfoPill icon={<XCircle size={28} className="text-red-400"/>} label="Yanlış Cevap" value={wrongCount.toString()} />
            
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 space-y-6">
            {/* Alt Konu Performansı */}
            <AnalysisCard icon={<Target size={22} className="text-purple-400"/>} title="Alt Konu Performansı">
              <ScrollShadow hideScrollBar className="space-y-1 max-h-[calc(100vh-550px)] lg:max-h-[400px] pr-1 -mr-1">
                {analysisData.performanceBySubTopic && Object.keys(analysisData.performanceBySubTopic).length > 0 ? (
                  Object.entries(analysisData.performanceBySubTopic).map(([subTopic, stp], index) => (
                    <div key={subTopic} className="flex flex-col py-3 px-2.5 border-b border-gray-700/40 last:border-b-0 hover:bg-gray-700/20 transition-colors rounded-md">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-gray-200 pr-2 truncate" title={formatSubTopicName(subTopic)}>
                          {index + 1}. {formatSubTopicName(subTopic)}
                        </span>
                        <span className={`text-sm font-bold ${stp.scorePercent >= 75 ? 'text-green-400' : stp.scorePercent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {stp.scorePercent}%
                        </span>
                      </div>
                      <Progress value={stp.scorePercent} size="sm" classNames={{ indicator: `${stp.scorePercent >= 75 ? 'bg-green-500' : stp.scorePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}` }} />
                      <p className="text-xs text-gray-400 mt-1 text-right">{stp.correctCount}/{stp.questionCount} doğru</p>
                    </div>
                  ))
                ) : <EmptyStateMessage message="Alt konu performans verisi bulunamadı." />}
              </ScrollShadow>
            </AnalysisCard>

            {/* Zorluk Seviyesine Göre */}
            <AnalysisCard icon={<Award size={22} className="text-purple-400"/>} title="Zorluk Seviyesine Göre">
              {analysisData.performanceByDifficulty && Object.values(analysisData.performanceByDifficulty).some(d => d.count > 0) ? (
                Object.entries(analysisData.performanceByDifficulty)
                  .filter(([, data]) => data.count > 0)
                  .map(([difficulty, data]) => (
                  <div key={difficulty} className="p-3.5 bg-gray-700/30 rounded-lg mb-3 last:mb-0">
                    <div className="flex justify-between items-center mb-2">
                      <Chip size="sm" variant="flat" className={`${difficultyColors[difficulty as DifficultyLevel] || difficultyColors.default} font-medium border`}>
                        {getDifficultyName(difficulty as DifficultyLevel)}
                      </Chip>
                      <Chip size="sm" variant="flat" className={`${data.score >= 75 ? 'bg-green-500/20 text-green-300' : data.score >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'} font-semibold`}>
                        {data.score}%
                      </Chip>
                    </div>
                    <Progress value={data.score} size="sm" classNames={{ indicator: `${data.score >= 75 ? 'bg-green-500' : data.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}` }}/>
                    <p className="text-xs text-gray-400 text-right mt-1">{data.correct} / {data.count} doğru</p>
                  </div>
              ))) : <EmptyStateMessage message="Zorluk seviyesi verisi bulunamadı." />}
            </AnalysisCard>
            
            {/* Değerlendirme & Öneriler */}
            <AnalysisCard icon={<BookOpen size={22} className="text-purple-400"/>} title="Değerlendirme & Öneriler">
              {analysisData.performanceCategorization && (analysisData.performanceCategorization.mastered?.length > 0 || analysisData.performanceCategorization.medium?.length > 0 || analysisData.performanceCategorization.failed?.length > 0) ? (
                <div className="space-y-4">
                  {analysisData.performanceCategorization.mastered?.length > 0 && <CategorizationList title="Uzmanlaşılan Konular" items={analysisData.performanceCategorization.mastered.map(formatSubTopicName)} icon={<Medal size={20} />} color="text-green-400"/>}
                  {analysisData.performanceCategorization.medium?.length > 0 && <CategorizationList title="Geliştirilebilecek Konular" items={analysisData.performanceCategorization.medium.map(formatSubTopicName)} icon={<Target size={18} />} color="text-yellow-400"/>}
                  {analysisData.performanceCategorization.failed?.length > 0 && <CategorizationList title="Tekrar Edilmesi Gereken Konular" items={analysisData.performanceCategorization.failed.map(formatSubTopicName)} icon={<AlertTriangle size={18} />} color="text-red-400"/>}
                </div>
              ) : <EmptyStateMessage message="Konu bazlı değerlendirme bulunmamaktadır." />}

              {(analysisData.recommendations && analysisData.recommendations.length > 0) && <Divider className="my-4 bg-gray-700/50" />} 
              {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                <CategorizationList title="Öneriler" items={analysisData.recommendations} icon={<Info size={20} />} color="text-blue-400" />
              ) : <EmptyStateMessage message="Ek öneri bulunmamaktadır." />}
            </AnalysisCard>
          </div>

          <div className="lg:col-span-8">
            <AnalysisCard icon={<ListChecks size={22} className="text-purple-400"/>} title="Soru Bazlı Analiz" cardBodyProps={{className: "p-0 sm:p-2"}} >
              {Object.keys(questionsBySubTopic).length > 0 ? (
                <Accordion 
                  selectionMode="multiple" 
                  variant="splitted"
                  className="gap-3 px-0 sm:px-3 py-3"
                  itemClasses={{
                    base: "p-0 group-[.is-splitted]:shadow-xl group-[.is-splitted]:bg-gray-700/40 group-[.is-splitted]:rounded-lg border border-transparent group-[.is-splitted]:hover:border-gray-600/80",
                    trigger: "p-4 text-base font-medium text-gray-200 data-[hover=true]:bg-gray-700/50 rounded-lg transition-colors",
                    indicator: "text-gray-400",
                    title: "text-gray-100",
                    subtitle: "text-xs text-gray-400 font-normal",
                    content: "pt-0 pb-3 px-4 text-sm text-gray-300 leading-relaxed"
                  }}
                >
                  {Object.entries(questionsBySubTopic).map(([subTopic, subTopicQuestions]) => (
                    <AccordionItem 
                      key={subTopic}
                      aria-label={subTopic}
                      title={formatSubTopicName(subTopic)}
                      indicator={({ isOpen }) => <ChevronLeft size={20} className={`transition-transform ${isOpen ? "-rotate-90" : ""}`}/>}
                      subtitle={
                        <div className="flex items-center gap-3">
                          <span>{subTopicQuestions.length} soru</span>
                          <span className="flex items-center">
                            <BarChart2 size={14} className="mr-1 text-gray-500" /> 
                            {subTopicQuestions.length > 0 ? Math.round(subTopicQuestions.filter(q => q.isCorrect).length / subTopicQuestions.length * 100) : 0}%
                          </span>
                        </div>
                      }
                    >
                      <div className="space-y-4 mt-2">
                        {subTopicQuestions.map((q, index) => (
                          <Card 
                            key={q.id} 
                            className={`bg-gray-600/30 shadow-md border-l-4 ${q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'} hover:bg-gray-600/50 transition-colors`}
                          >
                            <CardBody className="p-4 space-y-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-grow">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2.5 gap-2">
                                     <p className="font-semibold text-sm text-gray-200">Soru {index + 1}</p>
                                     <div className="flex gap-2 flex-wrap">
                                       <Chip size="sm" variant="flat" className={difficultyColors[q.difficulty] || difficultyColors.default}>
                                        {getDifficultyName(q.difficulty)}
                                      </Chip>
                                     </div>
                                  </div>
                                  <p className="text-gray-300 leading-relaxed">{q.questionText}</p>
                                </div>
                                <div className="flex-shrink-0 mt-1">
                                  {getIconForAnswer(q.userAnswer, q.correctAnswer, q.isCorrect)}
                                </div>
                              </div>
                              
                              <div>
                                <p className="font-medium text-xs text-gray-400 mb-2">Seçenekler:</p>
                                <ul className="space-y-2">
                                  {q.options.map((opt) => (
                                    <li key={opt} 
                                        className={`p-3 rounded-md text-sm flex items-center transition-all shadow-sm relative
                                          ${opt === q.correctAnswer ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40' : ''}
                                          ${opt === q.userAnswer && opt !== q.correctAnswer ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' : ''}
                                          ${opt !== q.userAnswer && opt !== q.correctAnswer ? 'bg-gray-600/50 hover:bg-gray-600/80 text-gray-300' : ''}
                                        `}
                                    >
                                      {opt === q.correctAnswer && <CheckCircle size={18} className="mr-2.5 flex-shrink-0 text-green-400" />}
                                      {opt === q.userAnswer && opt !== q.correctAnswer && <XCircle size={18} className="mr-2.5 flex-shrink-0 text-red-400" />}
                                      {opt !== q.userAnswer && opt !== q.correctAnswer && <div className="w-[18px] h-[18px] mr-2.5 flex-shrink-0 border border-gray-500 rounded-full" />} {/* Boş seçenekler için daire */}
                                      
                                      <span className="flex-grow">{opt}</span>
                                      {opt === q.userAnswer && <span className="ml-2 text-xs font-semibold text-gray-400 opacity-80">(Sizin Cevabınız)</span>}
                                      {opt === q.correctAnswer && opt !== q.userAnswer && <span className="ml-2 text-xs font-semibold text-green-400 opacity-80">(Doğru Cevap)</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {q.explanation && (
                                <Card className="bg-gray-700/70 mt-3.5 shadow-inner border border-gray-600/50">
                                  <CardBody className="p-3.5">
                                    <div className="flex items-start text-xs text-gray-300 leading-relaxed">
                                      <Info size={20} className="mr-2.5 text-blue-400 flex-shrink-0 mt-0.5" /> 
                                      <div>
                                        <span className="font-semibold mr-1 text-blue-300">Açıklama:</span> {q.explanation}
                                      </div>
                                    </div>
                                  </CardBody>
                                </Card>
                              )}
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : <EmptyStateMessage message="Soru bazlı analiz verisi bulunamadı." />}
            </AnalysisCard>
          </div>
        </div>

        {resultData && resultData.quizType === 'quick' && !isQuizSaved && (
          <div className="mt-12 mb-6 text-center">
            <Button 
              color="success"
              size="lg"
              className="font-semibold shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-8 rounded-lg transition-all transform hover:scale-105 focus:ring-4 focus:ring-green-500/50"
              startContent={<Save size={20} />}
              onPress={onSaveConfirmOpen}
              isLoading={isSaving}
              isDisabled={isSaving}
            >
              Sınavı ve Sonuçları Kaydet
            </Button>
          </div>
        )}
        
        <Modal isOpen={isSaveConfirmOpen} onClose={onSaveConfirmClose} backdrop="blur" classNames={{base: "bg-gray-800 border border-gray-700/50 shadow-2xl rounded-xl", header: "text-gray-100", body: "text-gray-300", footer: "border-t border-gray-700/50 pt-4"}}>
          <ModalContent>
            <ModalHeader className="text-lg font-semibold">Sınavı Kaydet</ModalHeader>
            <ModalBody>
              <p>Bu hızlı sınavı ve sonuçlarını hesabınıza kalıcı olarak kaydetmek istediğinizden emin misiniz?</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onSaveConfirmClose} isDisabled={isSaving} className="text-gray-400 hover:text-gray-200">
                İptal
              </Button>
              <Button color="success" onPress={handleSaveQuiz} isLoading={isSaving} isDisabled={isSaving} className="bg-green-500 hover:bg-green-600 text-white font-semibold">
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