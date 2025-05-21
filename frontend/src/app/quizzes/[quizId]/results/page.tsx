"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Progress, Chip, Accordion, AccordionItem, ScrollShadow, Divider, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Link } from "@nextui-org/react";
import { CheckCircle, XCircle, ListChecks, Target, Info, BarChart, ChevronLeft, Medal, Award, BookOpen, AlertTriangle, Save } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import type { Quiz, DifficultyLevel, AnalysisResult } from '../../../../types/quiz';
import { useQuizAnalysis } from '@/hooks/api/useQuizzes';
import quizService from '@/services/quiz.service';

// localStorage'dan sonuçları almak için fonksiyon
const getQuizResultsFromStorage = (quizId: string): Quiz | null => {
  if (typeof window !== "undefined") {
    const storedResults = localStorage.getItem(`quizResult_${quizId}`);
    if (storedResults) {
      try {
        return JSON.parse(storedResults) as Quiz;
      } catch (error) {
        console.error("Sonuçlar parse edilirken hata:", error);
        return null;
      }
    }
  }
  return null;
};

const checkIfQuizSaved = (quizId: string): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(`quizSaved_${quizId}`) === 'true';
  }
  return false;
};

const markQuizAsSaved = (quizId: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`quizSaved_${quizId}`, 'true');
  }
};

export default function QuizResultPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const [resultData, setResultData] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isQuizSaved, setIsQuizSaved] = useState(false);
  const {isOpen: isSaveConfirmOpen, onOpen: onSaveConfirmOpen, onClose: onSaveConfirmClose} = useDisclosure();

  // API'dan analiz sonuçlarını almak için TanStack Query kullanımı
  const { data: apiAnalysisData, isLoading: isAnalysisLoading, error: analysisError } = useQuizAnalysis(quizId);

  useEffect(() => {
    setIsQuizSaved(checkIfQuizSaved(quizId));
  }, [quizId]);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        // Önce localStorage'dan verileri kontrol et
        const storedData = getQuizResultsFromStorage(quizId);
        
        if (storedData) {
          console.log("Quiz sonuçları localStorage'dan yüklendi:", storedData);
          
          if (!storedData.quizType) {
            storedData.quizType = "quick";
            console.warn("Quiz sonuçlarında quizType eksik, varsayılan değer atandı: 'quick'");
          }
          
          setResultData(storedData);
          
          const apiFetchFailed = analysisError || !apiAnalysisData;
          if (apiFetchFailed && storedData.quizType === "quick" && !isQuizSaved) {
            setWarning("Sınav sonuçları sunucuya kaydedilemedi. Sonuçlarınızı kaydetmek için aşağıdaki butonu kullanabilirsiniz.");
          } else if (apiFetchFailed) {
             setWarning("Sınav sonuçları sunucudan yüklenirken bir sorun oluştu. Bazı analizler eksik olabilir.");
          }

        } else {
          // LocalStorage'da yoksa API'dan çek
          console.log("Quiz sonuçları localStorage'da bulunamadı, API'dan çekiliyor...");
          try {
            const apiData = await quizService.getQuizById(quizId);
            if (apiData) {
              console.log("Quiz sonuçları API'dan yüklendi:", apiData);
              
              if (!apiData.quizType) {
                apiData.quizType = "quick";
                console.warn("API'dan gelen quiz sonuçlarında quizType eksik, varsayılan değer atandı: 'quick'");
              }
              
              setResultData(apiData);
            } else {
              setError("Sınav sonuçları bulunamadı.");
            }
          } catch (apiError) {
            console.error("API'dan quiz verileri alınırken hata:", apiError);
            setError("Sınav sonuçlarını yüklerken bir hata oluştu.");
          }
        }
      } catch (e) {
        console.error("Quiz sonuçları yüklenirken hata:", e);
        setError("Beklenmeyen bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      fetchQuizData();
    }
  }, [quizId, apiAnalysisData, analysisError, isQuizSaved]);

  // API'dan analiz verileri geldiğinde, eğer resultData analiz sonuçlarına sahip değilse güncelle
  useEffect(() => {
    if (apiAnalysisData && resultData && !resultData.analysisResult) {
      const processedAnalysisData: AnalysisResult = {
        ...apiAnalysisData,
        performanceBySubTopic: Object.entries(apiAnalysisData.performanceBySubTopic || {}).reduce((acc, [key, value]) => {
          let validStatus: "medium" | "pending" | "failed" | "mastered" = "pending";
          
          if (typeof value.status === 'string') {
            if (['medium', 'pending', 'failed', 'mastered'].includes(value.status)) {
              validStatus = value.status as "medium" | "pending" | "failed" | "mastered";
            } else {
              if (value.scorePercent >= 75) validStatus = "mastered";
              else if (value.scorePercent >= 50) validStatus = "medium";
              else validStatus = "failed";
            }
          }
          
          acc[key] = {
            ...value,
            status: validStatus
          };
          
          return acc;
        }, {} as AnalysisResult['performanceBySubTopic'])
      };
      
      setResultData(prev => prev ? {...prev, analysisResult: processedAnalysisData} : null);
    }
  }, [apiAnalysisData, resultData]);

  const handleSaveQuiz = async () => {
    if (!resultData) {
      return;
    }
    setIsSaving(true);
    onSaveConfirmClose();
    try {
      // Lokal çözüm: Doğrudan localStorage'da kayıtlı olarak işaretle
      markQuizAsSaved(resultData.id);
      setIsQuizSaved(true);
      setWarning(null); // Uyarıyı kaldır
      
      // Kullanıcıya bildir - alert yerine toast kullanıyoruz
      toast.success("Sınav başarıyla kaydedildi!");
      
      /* 
      // TODO: Backend entegrasyonu hazır olduğunda bu kod aktif edilecek
      // Sınav ID'sinin sonuna bir belirteç ekleyerek geçici ID olduğunu belirt
      const temporaryQuizId = resultData.id.endsWith("-temp") ? resultData.id : `${resultData.id}-temp`;
      const quizToSave = {
        ...resultData,
        id: temporaryQuizId,
        quizType: resultData.quizType || "quick",
      };

      const savedQuiz = await quizService.saveQuickQuiz(quizToSave);
      setResultData(savedQuiz);
      markQuizAsSaved(savedQuiz.id);
      setIsQuizSaved(true);
      setWarning(null);

      // Eğer URL eski (geçici) ID'yi içeriyorsa, yeni ID ile güncelle
      if (quizId !== savedQuiz.id) {
        router.replace(`/quizzes/${savedQuiz.id}/results`, { scroll: false });
      }
      */

    } catch (error) {
      console.error("Sınav kaydedilirken hata:", error);
      toast.error("Sınav kaydedilirken bir hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const getOverallStatusChip = (score: number) => {
    if (score >= 75) return <Chip color="success" variant="flat">Başarılı</Chip>;
    if (score >= 50) return <Chip color="warning" variant="flat">Orta</Chip>;
    return <Chip color="danger" variant="flat">Başarısız</Chip>;
  };
  
  const getIconForAnswer = (userAnswer: string, correctAnswer: string) => {
    return userAnswer === correctAnswer ? 
      <Tooltip content="Doğru Cevap"><CheckCircle className="text-green-500" /></Tooltip> : 
      <Tooltip content="Yanlış Cevap"><XCircle className="text-red-500" /></Tooltip>;
  };

  const getDifficultyName = (difficulty: DifficultyLevel) => {
    switch(difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      case 'mixed': return 'Karışık';
      default: return 'Bilinmiyor';
    }
  };

  if (isLoading || isAnalysisLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto p-8 mt-10">
          <CardBody className="items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg">Sınav sonuçları yükleniyor...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto p-8 mt-10">
          <CardBody className="items-center justify-center">
            <XCircle size={48} className="text-danger mb-4" />
            <p className="text-lg">{error}</p>
            <Button 
              color="primary" 
              variant="light"
              className="mt-4"
              startContent={<ChevronLeft size={16} />}
              onPress={() => router.back()}
            >
              Geri Dön
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto p-8 mt-10">
          <CardBody className="items-center justify-center">
            <Info size={48} className="text-warning mb-4" />
            <p className="text-lg">Bu sınava ait sonuç bulunamadı.</p>
            <Button 
              color="primary" 
              variant="light"
              className="mt-4"
              startContent={<ChevronLeft size={16} />}
              onPress={() => router.back()}
            >
              Geri Dön
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!resultData.analysisResult) {
    const correctCount = resultData.correctCount || resultData.questions.reduce((count, q) => {
      const userAnswer = resultData.userAnswers?.[q.id];
      return userAnswer === q.correctAnswer ? count + 1 : count;
    }, 0);
    
    // AI yanıtından gelen sorularla çalışalım
    // Not: totalQuestions değişkeni loglama ve debug için kullanılıyor, 
    // ileride daha detaylı analiz ve hata ayıklama için saklanıyor
    const totalQuestions = resultData.questions.length;
    
    const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    // Alt konuların kontrolü ve düzenlenmesi
    const subTopicsInQuestions = resultData.questions
      .map(q => q.subTopic || q.subTopicName || q.normalizedSubTopicName || q.normalizedSubTopic)
      .filter(Boolean); // undefined ve null değerleri filtrele
    
    console.log("Sınavdaki alt konular:", subTopicsInQuestions);
    
    // Alt konu sayısı kontrolü
    const uniqueSubTopics = [...new Set(subTopicsInQuestions)];
    console.log("Benzersiz alt konular:", uniqueSubTopics);
    
    // Mevcut verileri analiz edelim
    console.log("JSON soru verileri:", JSON.stringify(resultData.questions.slice(0, 3), null, 2)); // İlk 3 soruyu yazdıralım
    
    // Alt konu yoksa veya sadece bir alt konu varsa, suni alt konular oluştur
    if (uniqueSubTopics.length <= 1) {
      console.warn("Not: Yalnızca bir alt konu tespit edildi. Sınav oluşturulurken alt konular doğru şekilde belirlendi mi?");
      
      // Backend'den gelen sorular için log tut
      console.log("Sorulardaki mevcut veriler:", resultData.questions.map(q => ({
        id: q.id,
        subTopic: q.subTopic,
        subTopicName: q.subTopicName,
        normalizedSubTopic: q.normalizedSubTopic,
        normalizedSubTopicName: q.normalizedSubTopicName,
        difficulty: q.difficulty
      })));
      
  
      
      // Önce subTopicName alanını subTopic'e kopyalayalım, varsa
      resultData.questions.forEach(q => {
        if (!q.subTopic && q.subTopicName) {
          q.subTopic = q.subTopicName;
          console.log(`Soru ${q.id} için subTopicName -> subTopic kopyalandı: ${q.subTopicName}`);
        }
      });
      
      // Sorulardan eksik alt konu adlarını çıkarmaya çalışalım
      // Soru metni içinden potansiyel alt konu adlarını çıkarma
      const extractedTopics = resultData.questions.map(q => {
        // Soruda "Alt konu" veya benzeri ifadelerle başlayan bir metin var mı kontrol et
        const questionText = q.questionText || "";
        const explanationText = q.explanation || "";
        
        // subTopic yoksa, soru metninden ve açıklamadan alt konu çıkarmaya çalış
        if (!q.subTopic) {
          // Konu adı içerebilecek kritik kelimeler
          const keyTopicWords = ["kümeleme", "mesafe", "algoritma", "veri", "matris", "hiyerarşik", "k-means"];
          
          // Bu kelimelerden birini içeren cümleler potansiyel alt konu olabilir
          const matchedTopic = keyTopicWords.find(word => 
            questionText.toLowerCase().includes(word.toLowerCase()) || 
            explanationText.toLowerCase().includes(word.toLowerCase())
          );
          
          if (matchedTopic) {
            return matchedTopic.charAt(0).toUpperCase() + matchedTopic.slice(1); // İlk harfi büyük yap
          }
        }
        
        return q.subTopic || null;
      });
      
      // Eksik alt konuları oluştur
      const questionsPerSubTopic = 2; // Her alt konuya 2 soru düşecek şekilde
      
      for (let i = 0; i < resultData.questions.length; i++) {
        // Halihazırda atanmış bir konu adı varsa kullan
        if (resultData.questions[i].subTopic) {
          continue; // Bu sorunun zaten alt konusu var, değiştirme
        }
        
        // Çıkarılan konu adlarını kullan
        if (extractedTopics[i]) {
          resultData.questions[i].subTopic = extractedTopics[i] as string;
          continue;
        }
        
        // Hiçbir şekilde çıkarılamadıysa, otomatik alt konu ata
        const subTopicIndex = Math.floor(i / questionsPerSubTopic);
        const subTopicName = `Alt Konu ${subTopicIndex + 1}`;
        resultData.questions[i].subTopic = subTopicName;
      }
      
      console.log("Alt konular düzenlendi:", 
        [...new Set(resultData.questions.map(q => q.subTopic || 'Genel'))]);
    }
    
    const performanceBySubTopic: AnalysisResult['performanceBySubTopic'] = {};
    const subTopics = new Set(resultData.questions.map(q => q.subTopic || q.subTopicName || 'Genel'));
    
    subTopics.forEach(subTopic => {
      const subTopicQuestions = resultData.questions.filter(q => (q.subTopic || q.subTopicName || 'Genel') === subTopic);
      const subTopicCorrectCount = subTopicQuestions.reduce((count, q) => {
        const userAnswer = resultData.userAnswers?.[q.id];
        return userAnswer === q.correctAnswer ? count + 1 : count;
      }, 0);
      
      const subTopicScore = subTopicQuestions.length > 0 ? Math.round((subTopicCorrectCount / subTopicQuestions.length) * 100) : 0;
      let status: "medium" | "pending" | "failed" | "mastered" = "pending";
      
      if (subTopicScore >= 75) status = "mastered";
      else if (subTopicScore >= 50) status = "medium";
      else status = "failed";
      
      performanceBySubTopic[subTopic] = {
        scorePercent: subTopicScore,
        status,
        questionCount: subTopicQuestions.length,
        correctCount: subTopicCorrectCount
      };
    });
    
    const performanceByDifficulty: AnalysisResult['performanceByDifficulty'] = {
      easy: { count: 0, correct: 0, score: 0 },
      medium: { count: 0, correct: 0, score: 0 },
      hard: { count: 0, correct: 0, score: 0 },
      mixed: { count: 0, correct: 0, score: 0 }
    };
    
    ['easy', 'medium', 'hard', 'mixed'].forEach(difficulty => {
      const difficultyQuestions = resultData.questions.filter(q => q.difficulty === difficulty);
      const difficultyCorrectCount = difficultyQuestions.reduce((count, q) => {
        const userAnswer = resultData.userAnswers?.[q.id];
        return userAnswer === q.correctAnswer ? count + 1 : count;
      }, 0);
      
      performanceByDifficulty[difficulty as DifficultyLevel] = {
        count: difficultyQuestions.length,
        correct: difficultyCorrectCount,
        score: difficultyQuestions.length > 0 ? Math.round((difficultyCorrectCount / difficultyQuestions.length) * 100) : 0
      };
    });
    
    const performanceCategorization: AnalysisResult['performanceCategorization'] = {
      failed: [],
      medium: [],
      mastered: []
    };
    
    Object.entries(performanceBySubTopic).forEach(([subTopic, data]) => {
      if (data.status === 'mastered') {
        performanceCategorization.mastered.push(subTopic);
      } else if (data.status === 'medium') {
        performanceCategorization.medium.push(subTopic);
      } else if (data.status === 'failed') {
        performanceCategorization.failed.push(subTopic);
      }
    });
    
    resultData.analysisResult = {
      overallScore,
      performanceBySubTopic,
      performanceByDifficulty,
      performanceCategorization,
      recommendations: [
        "Bu analiz, API'den analiz verisi alınamadığı için yerel olarak hesaplanmıştır.",
      ]
    };
    
    if (!warning && resultData.quizType === "quick" && !isQuizSaved) {
        setWarning("Sınav sonuçları sunucuya kaydedilemedi. Sonuçlarınızı kaydetmek için aşağıdaki butonu kullanabilirsiniz.");
    }
  }

  const analysisData = resultData.analysisResult;

  if (!resultData.userAnswers) {
    resultData.userAnswers = {};
  }

  if (resultData.correctCount === undefined) {
    resultData.correctCount = resultData.questions.reduce((count, q) => {
      const userAnswer = resultData.userAnswers?.[q.id];
      return userAnswer === q.correctAnswer ? count + 1 : count;
    }, 0);
  }

  if (resultData.totalQuestions === undefined) {
    resultData.totalQuestions = resultData.questions.length;
  }

  const processedQuestions = resultData.questions.map(q => {
    const userAnswer = resultData.userAnswers?.[q.id];
    const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
    return {
      ...q,
      userAnswer: userAnswer || "Cevaplanmadı",
      isCorrect,
    };
  });

  const questionsBySubTopic = processedQuestions.reduce((acc, q) => {
    const subTopic = q.subTopic || q.subTopicName || 'Genel';
    if (!acc[subTopic]) {
      acc[subTopic] = [];
    }
    acc[subTopic].push(q);
    return acc;
  }, {} as Record<string, typeof processedQuestions>);

  // RENK VE STİL SABİTLERİ
  const difficultyColors: Record<DifficultyLevel, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
    mixed: "bg-blue-100 text-blue-700",
  };
  const difficultyBorderColors: Record<DifficultyLevel, string> = {
    easy: "border-green-500",
    medium: "border-yellow-500",
    hard: "border-red-500",
    mixed: "border-blue-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="container mx-auto">
        {warning && (
          <Card className="mb-6 bg-yellow-500/10 border border-yellow-500/30 shadow-lg">
            <CardBody className="flex flex-row items-center gap-3 p-3.5">
              <AlertTriangle className="text-yellow-400" size={24} />
              <p className="text-sm text-yellow-300 font-medium">{warning}</p>
            </CardBody>
          </Card>
        )}

        {/* ÜST BAŞLIK VE GENEL BİLGİLER */}    
        <Card className="mb-8 bg-gray-800/50 shadow-2xl rounded-xl border border-gray-700/50">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-6">
            <div className="flex-grow">
              <h1 className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                {resultData.title}
              </h1>
              <p className="text-xs text-gray-400 mt-1.5">Sınav ID: {quizId}</p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-shrink-0">
              {getOverallStatusChip(analysisData.overallScore)} 
              <Button 
                as={Link}
                href={resultData.courseId ? `/courses/${resultData.courseId}` : "/dashboard"} // Kurs ID varsa kursa, yoksa dashboarda yönlendir
                color="primary"
                variant="ghost"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                size="md"
                startContent={<ChevronLeft size={18} />}
              >
                Geri Dön
              </Button>
            </div>
          </CardHeader>
          <Divider className="bg-gray-700/50"/>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 text-center">
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm font-medium text-gray-400 mb-2">Genel Başarı</p>
                <Progress
                  value={analysisData.overallScore}
                  color={analysisData.overallScore >= 75 ? "success" : analysisData.overallScore >= 50 ? "warning" : "danger"}
                  classNames={{
                    indicator: "bg-gradient-to-r from-purple-500 to-pink-500",
                    label: "font-bold text-xl text-white",
                    value: "text-gray-300 text-sm"
                  }}
                  showValueLabel={true}
                  size="lg"
                />
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm font-medium text-gray-400 mb-2">Toplam Soru</p>
                <p className="text-4xl font-bold text-white">{resultData.totalQuestions}</p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm font-medium text-green-300 mb-2">Doğru Cevap</p>
                <p className="text-4xl font-bold text-green-400">{resultData.correctCount}</p>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg">
                <p className="text-sm font-medium text-red-300 mb-2">Yanlış Cevap</p>
                <p className="text-4xl font-bold text-red-400">{resultData.totalQuestions - resultData.correctCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ANA İÇERİK GRID'İ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* SOL SÜTUN: ANALİZLER VE ÖNERİLER */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-gray-800/50 shadow-xl rounded-xl border border-gray-700/50">
              <CardHeader className="p-5">
                <h2 className="text-xl font-semibold flex items-center gap-2.5 text-gray-100">
                  <Target size={22} className="text-purple-400"/> Alt Konu Performansı
                </h2>
                {(analysisData.performanceBySubTopic && Object.keys(analysisData.performanceBySubTopic).length <= 1) && (
                  <p className="text-xs text-red-400 mt-1">Not: Yalnızca bir alt konu tespit edildi. Sınav oluşturulurken alt konular doğru şekilde belirlendi mi?</p>
                )}
              </CardHeader>
              <Divider className="bg-gray-700/50"/>
              <CardBody className="p-5">
                <ScrollShadow hideScrollBar className="space-y-1 max-h-[calc(100vh-500px)] lg:max-h-[600px] pr-1">
                  {analysisData.performanceBySubTopic && Object.entries(analysisData.performanceBySubTopic).length > 0 ? (
                    Object.entries(analysisData.performanceBySubTopic).map(([subTopicName, stp], index) => (
                      <div 
                        key={subTopicName} 
                        className="flex flex-col py-3 px-3 border-b border-gray-700/40 last:border-b-0 hover:bg-gray-700/20 transition-colors rounded-md"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-100 pr-2">
                            {index + 1}. {subTopicName}
                          </span>
                          <span 
                            className={`text-sm font-bold ${
                              stp.scorePercent >= 75 ? 'text-green-400' : 
                              stp.scorePercent >= 50 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}
                          >
                            %{stp.scorePercent}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <Progress
                            value={stp.scorePercent}
                            color={stp.scorePercent >= 75 ? "success" : stp.scorePercent >= 50 ? "warning" : "danger"}
                            size="sm"
                            classNames={{
                              indicator: `${stp.scorePercent >= 75 ? 'bg-green-500' : stp.scorePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`
                            }}
                            className="flex-grow"
                          />
                          <span className="text-xs font-normal text-gray-400 whitespace-nowrap">
                            {stp.correctCount}/{stp.questionCount}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Alt konu performans verisi bulunamadı.</p>
                  )}
                </ScrollShadow>
              </CardBody>
            </Card>

            <Card className="bg-gray-800/50 shadow-xl rounded-xl border border-gray-700/50">
              <CardHeader className="p-5">
                <h2 className="text-xl font-semibold flex items-center gap-2.5 text-gray-100">
                  <Award size={22} className="text-purple-400"/> Zorluk Seviyesine Göre
                </h2>
              </CardHeader>
              <Divider className="bg-gray-700/50"/>
              <CardBody className="p-5 space-y-4">
                {analysisData.performanceByDifficulty && Object.entries(analysisData.performanceByDifficulty)
                  .filter(([, data]) => data.count > 0) 
                  .map(([difficulty, data]) => (
                  <div key={difficulty} className="p-3.5 bg-gray-700/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <Chip 
                        size="md" 
                        variant="flat" 
                        className={`${difficultyColors[difficulty as DifficultyLevel]} font-medium border ${difficultyBorderColors[difficulty as DifficultyLevel]}`}
                      >
                        {getDifficultyName(difficulty as DifficultyLevel)}
                      </Chip>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        className={`${data.score >= 75 ? 'bg-green-500/20 text-green-300' : data.score >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'} font-semibold`}
                      >
                        {data.score}%
                      </Chip>
                    </div>
                    <Progress
                      value={data.score}
                      size="sm"
                      className="mb-1.5"
                      classNames={{
                        indicator: `${data.score >= 75 ? 'bg-green-500' : data.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`
                      }}
                    />
                     <p className="text-xs text-gray-400 text-right font-medium">{data.correct} / {data.count} doğru</p>
                  </div>
                ))}
                {Object.values(analysisData.performanceByDifficulty).every(d => d.count === 0) && (
                  <p className="text-sm text-gray-500 text-center py-6">Zorluk seviyesi verisi bulunamadı.</p>
                )}
              </CardBody>
            </Card>
            
            <Card className="bg-gray-800/50 shadow-xl rounded-xl border border-gray-700/50">
              <CardHeader className="p-5">
                <h2 className="text-xl font-semibold flex items-center gap-2.5 text-gray-100">
                  <BookOpen size={22} className="text-purple-400"/> Değerlendirme & Öneriler
                </h2>
              </CardHeader>
              <Divider className="bg-gray-700/50"/>
              <CardBody className="p-5 space-y-5">
                {analysisData.performanceCategorization && 
                 (analysisData.performanceCategorization.mastered?.length > 0 || 
                  analysisData.performanceCategorization.medium?.length > 0 || 
                  analysisData.performanceCategorization.failed?.length > 0) ? (
                  <div className="space-y-4">
                    {analysisData.performanceCategorization.mastered?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-400 flex items-center gap-2 mb-1.5">
                          <Medal size={20} /> Uzmanlaşılan Konular:
                        </h4>
                        <ul className="list-disc list-inside pl-2 text-sm space-y-1 text-gray-300">
                          {analysisData.performanceCategorization.mastered.map(s => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {analysisData.performanceCategorization.medium?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-400 flex items-center gap-2 mb-1.5">
                          <Target size={18} /> Geliştirilebilecek Konular:
                        </h4>
                        <ul className="list-disc list-inside pl-2 text-sm space-y-1 text-gray-300">
                          {analysisData.performanceCategorization.medium.map(s => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {analysisData.performanceCategorization.failed?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-400 flex items-center gap-2 mb-1.5">
                          <AlertTriangle size={18} /> Tekrar Edilmesi Gereken Konular:
                        </h4>
                        <ul className="list-disc list-inside pl-2 text-sm space-y-1 text-gray-300">
                          {analysisData.performanceCategorization.failed.map(s => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                   <p className="text-sm text-gray-500 text-center py-6">Konu bazlı değerlendirme bulunmamaktadır.</p>
                )}

                {(analysisData.recommendations && analysisData.recommendations.length > 0) && <Divider className="my-5 bg-gray-700/50" />} 

                {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-1.5 text-blue-400">
                      <Info size={20} /> Öneriler:
                    </h4>
                    <ul className="list-disc list-inside pl-2 text-sm space-y-1 text-gray-300">
                      {analysisData.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-3">Ek öneri bulunmamaktadır.</p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* SAĞ SÜTUN: SORU BAZLI ANALİZ */}
          <div className="lg:col-span-8">
            <Card className="bg-gray-800/50 shadow-xl rounded-xl border border-gray-700/50">
              <CardHeader className="p-5">
                <h2 className="text-xl font-semibold flex items-center gap-2.5 text-gray-100">
                  <ListChecks size={22} className="text-purple-400"/> Soru Bazlı Analiz
                </h2>
              </CardHeader>
              <Divider className="bg-gray-700/50"/>
              <CardBody className="p-5">
                {Object.entries(questionsBySubTopic).length > 0 ? (
                  <Accordion 
                    selectionMode="multiple" 
                    variant="splitted"
                    className="gap-3"
                    itemClasses={{
                      base: "p-0 group-[.is-splitted]:shadow-xl group-[.is-splitted]:bg-gray-700/30 group-[.is-splitted]:rounded-lg",
                      trigger: "p-4 text-base font-medium text-gray-200 data-[hover=true]:bg-gray-700/50 rounded-lg transition-colors",
                      indicator: "text-gray-400",
                      title: "text-gray-100",
                      subtitle: "text-xs text-gray-400 font-normal",
                      content: "pt-0 pb-3 px-4 text-sm text-gray-300 leading-relaxed"
                    }}
                  >
                    {Object.entries(questionsBySubTopic).map(([subTopic, questions]) => (
                      <AccordionItem 
                        key={subTopic}
                        aria-label={subTopic}
                        title={subTopic}
                        indicator={({ isOpen }) => <ChevronLeft size={20} className={`transition-transform ${isOpen ? "-rotate-90" : ""}`}/>}
                        subtitle={
                          <div className="flex items-center gap-3">
                            <span>{questions.length} soru</span>
                            <span className="flex items-center">
                              <BarChart size={12} className="mr-1" /> 
                              {questions.length > 0 ? Math.round(questions.filter(q => q.isCorrect).length / questions.length * 100) : 0}%
                            </span>
                          </div>
                        }
                      >
                        <div className="space-y-4 mt-2">
                          {questions.map((q, index) => (
                            <Card 
                              key={q.id} 
                              className={`bg-gray-700/50 shadow-md border-l-4 ${q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'} hover:bg-gray-600/50 transition-colors`}
                            >
                              <CardBody className="p-4 space-y-3.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-2">
                                       <p className="font-semibold text-sm text-gray-200">Soru {index + 1}</p>
                                       <Chip 
                                        size="sm" 
                                        variant="bordered" 
                                        className={`${difficultyColors[q.difficulty].replace("bg-", "border-").replace("-100", "-500/50")} ${difficultyColors[q.difficulty].replace("bg-", "text-").replace("-100", "-400")} font-medium`}
                                      >
                                        {getDifficultyName(q.difficulty)}
                                      </Chip>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{q.questionText}</p>
                                  </div>
                                  <div className="flex-shrink-0 mt-1">
                                    {getIconForAnswer(q.userAnswer, q.correctAnswer)}
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="font-medium text-xs text-gray-400 mb-2">Seçenekler:</p>
                                  <ul className="space-y-2">
                                    {q.options.map((opt) => (
                                      <li key={opt} 
                                          className={`p-3 rounded-md text-sm flex items-center transition-all shadow-sm
                                            ${opt === q.correctAnswer ? 'bg-green-500/15 text-green-300 ring-1 ring-green-500/30' : ''}
                                            ${opt === q.userAnswer && opt !== q.correctAnswer ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30' : ''}
                                            ${opt !== q.userAnswer && opt !== q.correctAnswer ? 'bg-gray-600/40 hover:bg-gray-600/70 text-gray-300' : ''}
                                          `}
                                      >
                                        {opt === q.correctAnswer && <CheckCircle size={18} className="mr-2.5 flex-shrink-0 text-green-400" />}
                                        {opt === q.userAnswer && opt !== q.correctAnswer && <XCircle size={18} className="mr-2.5 flex-shrink-0 text-red-400" />}
                                        {opt !== q.userAnswer && opt !== q.correctAnswer && <div className="w-[18px] h-[18px] mr-2.5 flex-shrink-0" />}
                                        
                                        <span className="flex-grow">{opt}</span>
                                        {opt === q.userAnswer && <span className="ml-2 text-xs font-normal text-gray-400">(Sizin Cevabınız)</span>}
                                        {opt === q.correctAnswer && opt !== q.userAnswer && <span className="ml-2 text-xs font-normal text-gray-400">(Doğru Cevap)</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {q.explanation && (
                                  <Card className="bg-gray-700/60 mt-3.5 shadow-inner">
                                    <CardBody className="p-3.5">
                                      <p className="text-xs text-gray-300 leading-relaxed flex items-start">
                                        <Info size={16} className="mr-2 text-blue-400 flex-shrink-0 mt-0.5" /> 
                                        <div><span className="font-semibold mr-1 text-blue-300">Açıklama:</span> {q.explanation}</div>
                                      </p>
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
                ) : (
                  <p className="text-sm text-gray-500 text-center py-10">Soru bazlı analiz verisi bulunamadı.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {resultData && resultData.quizType === 'quick' && !isQuizSaved && (
          <div className="mt-12 mb-6 text-center">
            <Button 
              color="success"
              variant="solid"
              size="lg"
              className="font-semibold shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-8 rounded-lg transition-all transform hover:scale-105"
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
              <p>Bu hızlı sınavı ve sonuçlarını hesabınıza kalıcı olarak kaydetmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
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

        <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  );
} 