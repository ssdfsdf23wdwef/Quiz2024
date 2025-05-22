/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, Key, SetStateAction } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiClock, FiX } from "react-icons/fi";
import { Quiz, Question, QuizType, AnalysisResult, DifficultyLevel, QuizSubmissionPayload } from "@/types/quiz";
import quizService from "@/services/quiz.service";
import { ErrorService } from "@/services/error.service";
import { Button, Card, CardBody, Chip, Progress, Tooltip } from "@nextui-org/react";
import { Flag, ChevronRight, ChevronLeft, Info } from "lucide-react";

// Sonuçları localStorage'a kaydetmek için fonksiyon
const storeQuizResultsInStorage = (quizId: string, resultsToStore: Quiz) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`quizResult_${quizId}`, JSON.stringify(resultsToStore));
  }
};

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sınav verilerini yükle
  useEffect(() => {
    async function loadQuiz() {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const quizId = Array.isArray(params.id) ? params.id[0] : params.id;
        console.log(`[DEBUG] 🔄 Sınav verileri yükleniyor: ID=${quizId}`);
        
        // Hata ile çakışma ihtimali olan ID kontrolü
        if (quizId.startsWith('error_fallback') || quizId.startsWith('fallback') || quizId.startsWith('parsed_fallback')) {
          console.error(`[DEBUG] ❌ Geçersiz sınav ID formatı: ${quizId}`);
          ErrorService.showToast("Geçersiz sınav formatı. Ana sayfaya yönlendiriliyorsunuz.", "error", "Sınav Hatası");
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }
        
        const quizData = await quizService.getQuizById(quizId);
        console.log("[DEBUG] quizService.getQuizById'den gelen quizData:", JSON.stringify(quizData, null, 2));
        
        if (!quizData || !quizData.id) {
          throw new Error('Sınav verileri eksik veya boş');
        }
        
        console.log("[DEBUG] ✅ Sınav verileri yüklendi (işlenmeden önce):", JSON.stringify(quizData, null, 2));
        
        // Her bir soruyu ensureQuestionSubTopics ile işle
        if (quizData.questions && Array.isArray(quizData.questions)) {
          quizData.questions = quizData.questions.map(q => {
            const processedQ = ensureQuestionSubTopics(q);
            // console.log(`[DEBUG] Soru işlendi: ${q.id} -> subTopic: ${processedQ.subTopic}, normalized: ${processedQ.normalizedSubTopic}`);
            return processedQ;
          });
          console.log(`[DEBUG] ✅ Soru alt konu bilgileri kontrol edildi ve tamamlandı. İşlenmiş sorular:`, JSON.stringify(quizData.questions, null, 2));
        } else {
          console.warn("[DEBUG] quizData.questions bulunamadı veya dizi değil:", quizData.questions);
        }
        
        setQuiz({
          ...quizData,
          quizType: quizData.quizType as QuizType,
        } as Quiz);
        
        // Zamanlayıcıyı ayarla
        if (quizData.preferences?.timeLimit) {
          setRemainingTime(quizData.preferences.timeLimit * 60); // Dakika -> Saniye
        }
      } catch (error) {
        console.error(`[DEBUG] ❌ Sınav verileri yüklenemedi:`, error);
        ErrorService.showToast("Sınav bulunamadı veya erişim hatası oluştu.", "error", "Sınav Yükleme");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [params.id]); // ensureQuestionSubTopics bağımlılıklardan çıkarıldı, çünkü sayfa içinde tanımlı ve değişmiyor.

  // Quiz state değiştiğinde logla
  useEffect(() => {
    if (quiz) {
      console.log("[DEBUG] Quiz state güncellendi:", JSON.stringify(quiz, null, 2));
      // Özellikle soruları ve alt konularını kontrol edelim
      if (quiz.questions) {
        quiz.questions.forEach((q, index) => {
          console.log(`[DEBUG] Quiz state - Soru ${index + 1} (${q.id}): subTopic='${q.subTopic}', normalizedSubTopic='${q.normalizedSubTopic}'`);
        });
      }
    }
  }, [quiz]);

  // Timer
  useEffect(() => {
    if (!quiz || isCompleted || showResults || !remainingTime) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          // handleSubmit yerine doğrudan submit için state değerleri güncelleyelim
          setIsCompleted(true);
          setIsSubmitting(true);
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, isCompleted, showResults, remainingTime]);

  // Zamanlayıcı sıfırlandığında submit işlemini gerçekleştir
  useEffect(() => {
    // Sadece zamanlayıcı tamamlandığında ve isCompleted true olduğunda
    if (remainingTime === 0 && isCompleted && isSubmitting) {
      handleSubmit();
    }
  }, [remainingTime, isCompleted, isSubmitting]);

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Sorunun alt konu bilgilerini kontrol eder ve eksikse tamamlar
   * Bu fonksiyon, backend'den gelen eksik verileri tamamlar
   */
  const ensureQuestionSubTopics = (question: Question): Question => {
    // Derin kopya oluştur (orijinal nesneyi değiştirmemek için)
    const updatedQuestion = JSON.parse(JSON.stringify(question)) as Question;
    
    // Alt konu bilgilerinin tam kontrolü
    // Her türlü durum için kontrol yapıyor (null, undefined, boş string)
    const hasValidSubTopic = !!updatedQuestion.subTopic && updatedQuestion.subTopic.trim() !== '';
    const hasValidNormalizedSubTopic = !!updatedQuestion.normalizedSubTopic && updatedQuestion.normalizedSubTopic.trim() !== '';
    
    console.log(`[DEBUG] ensureQuestionSubTopics - ID: ${updatedQuestion.id} - Gelen: subTopic='${question.subTopic}', normSubTopic='${question.normalizedSubTopic}' -> hasValidSubTopic: ${hasValidSubTopic}, hasValidNormalizedSubTopic: ${hasValidNormalizedSubTopic}`);
    
    // Alt konu kontrolü ve düzeltme
    if (!hasValidSubTopic && !hasValidNormalizedSubTopic) {
      // Her ikisi de geçersizse, varsayılan değerleri ata
      console.log(`[DEBUG] ensureQuestionSubTopics - ID: ${updatedQuestion.id} - Her iki alan da eksik veya boş, varsayılan değer atanıyor`);
      updatedQuestion.subTopic = "Genel Konu";
      updatedQuestion.normalizedSubTopic = "genel-konu";
    } else if (hasValidSubTopic && !hasValidNormalizedSubTopic) {
      // subTopic var ama normalizedSubTopic yoksa, normalizedSubTopic oluştur
      console.log(`[DEBUG] ensureQuestionSubTopics - ID: ${updatedQuestion.id} - normalizedSubTopic eksik, subTopic'ten oluşturuluyor: "${updatedQuestion.subTopic}"`);
      updatedQuestion.normalizedSubTopic = updatedQuestion.subTopic
        .toLowerCase()
        .trim() // Ensure trimming before normalization
        .replace(/\\s+/g, '-')
        .replace(/[^a-z0-9\\-]/g, '');
    } else if (!hasValidSubTopic && hasValidNormalizedSubTopic) {
      // normalizedSubTopic var ama subTopic yoksa, subTopic oluştur
      console.log(`[DEBUG] ensureQuestionSubTopics - ID: ${updatedQuestion.id} - subTopic eksik, normalizedSubTopic'ten oluşturuluyor: "${updatedQuestion.normalizedSubTopic}"`);
      updatedQuestion.subTopic = updatedQuestion.normalizedSubTopic
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      // Her ikisi de var, normalizedSubTopic'in doğru format olduğundan emin ol
      console.log(`[DEBUG] ensureQuestionSubTopics - ID: ${updatedQuestion.id} - Her iki alan da var, format kontrolü yapılıyor`);
      const expectedNormalizedSubTopic = updatedQuestion.subTopic
        .toLowerCase()
        .trim() // Ensure trimming before normalization
        .replace(/\\s+/g, '-')
        .replace(/[^a-z0-9\\-]/g, '');
      
      // Eğer normalizedSubTopic beklenen formatla uyuşmuyorsa veya boşsa düzelt
      if (updatedQuestion.normalizedSubTopic !== expectedNormalizedSubTopic || !updatedQuestion.normalizedSubTopic.trim()) {
        console.log(`[DEBUG] ensureQuestionSubTopics - ID: ${updatedQuestion.id} - normalizedSubTopic yeniden formatlanıyor veya boş olduğu için düzeltiliyor`);
        console.log(`[DEBUG] Mevcut: "${updatedQuestion.normalizedSubTopic}", Beklenen: "${expectedNormalizedSubTopic}"`);
        updatedQuestion.normalizedSubTopic = expectedNormalizedSubTopic || "genel-konu"; // Fallback if expected is empty
      }
    }

    // Zorluk seviyesi kontrolü - varsayılan olarak 'medium' kullan
    if (!updatedQuestion.difficulty) {
      updatedQuestion.difficulty = 'medium';
    }
    
    // Question type kontrolü
    if (!updatedQuestion.questionType) {
      updatedQuestion.questionType = 'multiple_choice';
    }
    
    // Status kontrolü
    if (!updatedQuestion.status) {
      updatedQuestion.status = 'active';
    }
    
    console.log(`[DEBUG] ensureQuestionSubTopics - Sonuç - ID: ${updatedQuestion.id}, subTopic: "${updatedQuestion.subTopic}", normalizedSubTopic: "${updatedQuestion.normalizedSubTopic}"`);
    return updatedQuestion;
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return;
    
    try {
    setIsSubmitting(true);
    setIsCompleted(true);

      // Soruların alt konu bilgilerini kontrol et ve eksikse doldur
      const preparedQuestions = quiz.questions.map(ensureQuestionSubTopics);

      // Sorular düzeltilmiş olarak quizi güncelle
      const preparedQuiz = {
        ...quiz,
        questions: preparedQuestions
      };

      // Quiz ID kontrol et
      if (!preparedQuiz.id || preparedQuiz.id === 'undefined') {
        console.error("❌ Quiz ID tanımsız! Submitting işlemi yapılamıyor.");
        ErrorService.showToast("Sınav kimliği bulunamadı. Lütfen ana sayfaya dönün.", "error");
        setIsSubmitting(false);
        return;
      }

      // Önce sonuçları lokal olarak hesapla ve sakla
      const quizResult = calculateAndStoreResults(preparedQuiz);
      
      try {
      // API'ye yanıtları gönder
        const payload: QuizSubmissionPayload = {
          quizId: preparedQuiz.id,
          quiz: preparedQuiz,
          userAnswers: userAnswers,
          // elapsedTime'ı basit bir sayı olarak gönder, null/undefined olmamasını sağla
          elapsedTime: preparedQuiz.preferences?.timeLimit 
            ? (preparedQuiz.preferences.timeLimit * 60) - (remainingTime || 0) 
            : 0
        };
      
      console.log(`🔄 Sınav yanıtları gönderiliyor:`, payload);
      
        // API bağlantı hatalarında bile ilerleyebilmek için try/catch içine alındı
        const result = await quizService.submitQuiz(payload);
        console.log(`✅ Sınav yanıtları gönderildi:`, result);
      } catch (apiError) {
        console.error("⚠️ API yanıt hatası (sonuçlar yine de gösterilecek):", apiError);
        ErrorService.showToast("Sınav sonuçları sunucuya kaydedilemedi, ancak sonuçlarınızı görebilirsiniz.", "warning");
        // API hatası olsa da devam ediyoruz - lokalde hesaplanmış sonuçlarla
      }

      // Sonuç sayfasına yönlendir - DÜZELTME: Doğru URL formatını kullanıyoruz
      router.push(`/exams/${preparedQuiz.id}/results`);
    } catch (error) {
      setIsSubmitting(false);
      setIsCompleted(false);
      console.error("❌ Sınav tamamlanırken hata:", error);
      ErrorService.showToast("Sınav tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.", "error");
    }
  };

  const calculateAndStoreResults = (quizToProcess = quiz) => {
    if (!quizToProcess) return null;
    
    // Doğru cevapları say
    const correctCount = Object.entries(userAnswers).reduce(
      (count, [questionId, answer]) => {
        const question = quizToProcess.questions.find(q => q.id === questionId);
        return question && question.correctAnswer === answer ? count + 1 : count;
      }, 0);
    
    const totalQuestions = quizToProcess.questions.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    // Alt konuları grupla ve performans analiz et
    const subTopicPerformance: Record<string, { correct: number, total: number, score: number }> = {};
    const difficultyPerformance: Record<string, { correct: number, total: number, score: number }> = {
      easy: { correct: 0, total: 0, score: 0 },
      medium: { correct: 0, total: 0, score: 0 },
      hard: { correct: 0, total: 0, score: 0 },
      mixed: { correct: 0, total: 0, score: 0 }
    };
    
    quizToProcess.questions.forEach(q => {
      // Soruların alt konu bilgilerini kontrol et ve düzelt
      const subTopic = q.subTopic || "Genel";
      const normalizedSubTopic = q.normalizedSubTopic || subTopic.toLowerCase().replace(/\s+/g, '-');
      
      // Eksik alanları tamamla
      if (!q.subTopic) q.subTopic = subTopic;
      if (!q.normalizedSubTopic) q.normalizedSubTopic = normalizedSubTopic;
      
      const difficulty = q.difficulty || "mixed";
      const isCorrect = userAnswers[q.id] === q.correctAnswer;
      
      // Alt konu performansı
      if (!subTopicPerformance[subTopic]) {
        subTopicPerformance[subTopic] = { correct: 0, total: 0, score: 0 };
      }
      subTopicPerformance[subTopic].total++;
      if (isCorrect) {
        subTopicPerformance[subTopic].correct++;
      }
      
      // Zorluk seviyesi performansı
      difficultyPerformance[difficulty].total++;
      if (isCorrect) {
        difficultyPerformance[difficulty].correct++;
      }
    });
    
    // Alt konu ve zorluk seviyesi skorlarını hesapla
    Object.values(subTopicPerformance).forEach(perf => {
      perf.score = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;
    });
    Object.values(difficultyPerformance).forEach(perf => {
      perf.score = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;
    });
    
    // Analiz sonucunu hazırla
    const performanceBySubTopic: Record<string, {
      scorePercent: number;
      status: "mastered" | "medium" | "failed";
      questionCount: number;
      correctCount: number;
    }> = {};
    
    Object.entries(subTopicPerformance).forEach(([topic, perf]) => {
      let status: "mastered" | "medium" | "failed" = "failed";
      if (perf.score >= 75) status = "mastered";
      else if (perf.score >= 50) status = "medium";
      
      performanceBySubTopic[topic] = {
        scorePercent: perf.score,
        status,
        questionCount: perf.total,
        correctCount: perf.correct
      };
    });
    
    const performanceByDifficulty: Record<string, {
      count: number;
      correct: number;
      score: number;
    }> = {};
    
    Object.entries(difficultyPerformance).forEach(([difficulty, perf]) => {
      if (perf.total > 0) {
        performanceByDifficulty[difficulty] = {
          count: perf.total,
          correct: perf.correct,
          score: perf.score
        };
      }
    });
    
    // Kategorizasyon
    const performanceCategorization = {
      mastered: [] as string[],
      medium: [] as string[],
      failed: [] as string[]
    };
    
    Object.entries(performanceBySubTopic).forEach(([topic, data]) => {
      if (data.status === 'mastered') performanceCategorization.mastered.push(topic);
      else if (data.status === 'medium') performanceCategorization.medium.push(topic);
      else performanceCategorization.failed.push(topic);
    });
    
    // Sonuçları oluştur
    const quizResult = {
      ...quizToProcess,
      userAnswers,
      correctCount,
      totalQuestions,
      score: scorePercent,
      elapsedTime: quizToProcess.preferences?.timeLimit 
        ? (quizToProcess.preferences.timeLimit * 60) - (remainingTime || 0) 
        : 0,
      timestamp: new Date().toISOString(),
      analysisResult: {
        overallScore: scorePercent,
      performanceBySubTopic,
      performanceCategorization,
      performanceByDifficulty,
        recommendations: []
      }
    };
    
    // LocalStorage'a kaydet - eksiksiz veri aktarımı için
    if (window && window.localStorage) {
      console.log("✅ Sınav sonuçları hesaplandı ve kaydedilecek:", quizResult);
      try {
        storeQuizResultsInStorage(quizToProcess.id, quizResult);
        console.log("✅ Sınav sonuçları localStorage'a kaydedildi");
      } catch (error) {
        console.error("❌ LocalStorage'a kayıt sırasında hata:", error);
      }
    }
    
    return quizResult;
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    
    let correctCount = 0;
    quiz.questions.forEach((question) => {
      if (userAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    return Math.round((correctCount / quiz.questions.length) * 100);
  };

  // Yükleme durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Sınav bulunamadı
  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Sınav Bulunamadı</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Aradığınız sınav bulunamadı veya erişim izniniz yok.</p>
        <Link
          href="/exams"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Sınavlarım
        </Link>
      </div>
    );
  }

  const renderQuestionNavigation = () => {
    // Alt konuları grupla ve renklendir
    const subTopicColors: Record<string, string> = {};
    const subTopicMap: Record<string, {count: number; displayName: string; normalizedName: string}> = {};
    
    console.log("[DEBUG] renderQuestionNavigation - Alt konu bilgileri işleniyor...");
    
    // Renk seçenekleri
    const colorOptions = [
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 ring-indigo-300",
      "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 ring-blue-300",
      "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 ring-teal-300",
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 ring-green-300",
      "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 ring-amber-300",
      "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 ring-rose-300",
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 ring-purple-300",
      "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 ring-cyan-300",
    ];
    
    // Alt konulara göre renk ataması yapma
    if (quiz.questions && quiz.questions.length > 0) {
      // Her soru için alt konu bilgilerini topla
      quiz.questions.forEach((q, index) => {
        const subTopic = q.subTopic || "Genel Konu";
        const normalizedSubTopic = q.normalizedSubTopic || "genel-konu";
        
        // Alt konu istatistiklerini topla
        if (!subTopicMap[subTopic]) {
          // İlk kez karşılaşılan alt konu
          subTopicMap[subTopic] = {
            count: 1,
            displayName: subTopic,
            normalizedName: normalizedSubTopic
          };
        } else {
          // Mevcut alt konuya ait soru sayısını artır
          subTopicMap[subTopic].count++;
        }
      });
      
      // Toplanan alt konulara renk ata
      const uniqueSubTopics = Object.keys(subTopicMap);
      console.log(`[DEBUG] renderQuestionNavigation - Benzersiz alt konular (${uniqueSubTopics.length}): ${uniqueSubTopics.join(', ')}`);
      
      // Her benzersiz alt konuya bir renk ata
      uniqueSubTopics.forEach((subTopic, index) => {
        subTopicColors[subTopic] = colorOptions[index % colorOptions.length];
      });
    }
    
    // Alt konu bilgisini gösterme fonksiyonu
    const getSubTopicInfo = (question: Question) => {
      // subTopic yoksa veya boş string ise "Genel Konu" göster
      const subTopic = question.subTopic || "Genel Konu";
      const color = subTopicColors[subTopic] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      
      return {
        name: subTopic,
        normalizedName: question.normalizedSubTopic || "genel-konu",
        color
      };
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">Sorular</h3>
          <Tooltip content="Renkler farklı alt konuları gösterir">
            <div className="cursor-help">
              <Info size={16} className="text-gray-500 dark:text-gray-400" />
            </div>
          </Tooltip>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {quiz.questions &&
            quiz.questions.map((question: Question, index: number) => {
              const isAnswered = userAnswers[question.id] !== undefined;
              const isCurrent = currentQuestionIndex === index;
              const isFlagged = flaggedQuestions.has(index);
              const subTopicInfo = getSubTopicInfo(question);
              console.log(`[DEBUG] Nav - Soru ${index + 1}: subTopic='${question.subTopic}', infoName='${subTopicInfo.name}', infoColor='${subTopicInfo.color}'`);

              return (
                <button
                  key={question.id}
                  className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium relative
                  ${isCurrent ? "bg-indigo-600 text-white" : ""}
                  ${!isCurrent && isAnswered ? subTopicInfo.color : ""}
                  ${!isCurrent && !isAnswered ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" : ""}
                  ${isFlagged ? "ring-2 ring-amber-500" : ""}
                  hover:bg-indigo-500 hover:text-white transition-colors
                `}
                  onClick={() => setCurrentQuestionIndex(index)}
                  title={`Alt Konu: ${subTopicInfo.name}`}
                >
                  {index + 1}
                </button>
              );
            })}
        </div>
        
        {/* Alt konu lejantı */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Alt Konular:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(subTopicMap).map(([subTopic, info]) => (
              <span 
                key={info.normalizedName} 
                className={`text-xs px-2 py-1 rounded-full ${subTopicColors[subTopic]} flex items-center gap-1`}
              >
                <span>{info.displayName}</span>
                <span className="bg-white/30 dark:bg-black/20 rounded-full px-1 text-[10px]">{info.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const score = calculateScore();

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">{score}%</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Sınav Tamamlandı!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Toplam puanınız: <span className="font-semibold text-gray-800 dark:text-white">{score}%</span> (
            {
              quiz.questions.filter(
                (q) => userAnswers[q.id] === q.correctAnswer,
              ).length
            }
            /{quiz.questions.length} doğru)
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {quiz.questions.map((question, index) => {
            const isCorrect =
              userAnswers[question.id] === question.correctAnswer;

            return (
              <div
                key={question.id}
                className={`p-4 rounded-md border ${
                  isCorrect
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30"
                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30"
                }`}
              >
                <div className="flex items-start mb-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                      isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {isCorrect ? <FiCheck size={14} /> : <FiX size={14} />}
                  </div>
                  <h3 className="text-gray-800 dark:text-gray-100 font-medium">
                    Soru {index + 1}: {question.questionText}
                  </h3>
                </div>

                <div className="ml-8 space-y-2">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Sizin cevabınız:</span>{" "}
                    {userAnswers[question.id] || "Cevap verilmedi"}
                  </div>

                  {!isCorrect && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-800 dark:text-gray-200">Doğru cevap:</span>{" "}
                      {question.correctAnswer}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="text-sm mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-800 dark:text-gray-200">Açıklama:</span>{" "}
                      {question.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/exams"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Sınavlarım
          </Link>
          <Link
            href="/performance"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Performans Analizi
          </Link>
        </div>
      </motion.div>
    );
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    // Soru nesnesini güvenli bir şekilde işle ve alt konu bilgilerini doğru şekilde çıkar
    const processedQuestion = ensureQuestionSubTopics(currentQuestion);
    console.log("[DEBUG] renderQuestion - İşlenmiş soru:", processedQuestion);

    // Alt konu bilgisini düzenle - varsa kullan, yoksa varsayılan göster
    const subTopicName = processedQuestion.subTopic;
    const normalizedSubTopicName = processedQuestion.normalizedSubTopic;
    
    // Alt konu adını düzgün formatlama (ilk harfler büyük)
    const formattedSubTopic = subTopicName
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Soru {currentQuestionIndex + 1}/{quiz.questions.length}
          </h2>
            <div className="mt-2 sm:mt-0">
              <span className="px-3 py-1 text-sm rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                Alt Konu: {formattedSubTopic}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-200">{processedQuestion.questionText}</p>
          
          {/* Zorluk seviyesi gösterimi */}
          {processedQuestion.difficulty && (
            <div className="mt-2 flex items-center">
              <span className={`text-xs px-2 py-1 rounded-md ${
                processedQuestion.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                processedQuestion.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                processedQuestion.difficulty === 'hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                {processedQuestion.difficulty === 'easy' ? 'Kolay' :
                 processedQuestion.difficulty === 'medium' ? 'Orta' :
                 processedQuestion.difficulty === 'hard' ? 'Zor' : 'Karışık'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {processedQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                userAnswers[processedQuestion.id] === option
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:text-white"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-200"
              }`}
              onClick={() => {
                setUserAnswers({
                  ...userAnswers,
                  [processedQuestion.id]: option,
                });
              }}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                    userAnswers[processedQuestion.id] === option
                      ? "bg-indigo-500 text-white"
                      : "border border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {userAnswers[processedQuestion.id] === option && (
                    <FiCheck size={12} />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Önceki Soru
          </button>

          <button
            onClick={() => {
              const isLast = currentQuestionIndex === quiz.questions.length - 1;

              if (isLast) {
                // Kullanıcıya onay sor
                if (window.confirm("Sınavı tamamlamak istiyor musunuz?")) {
                  handleSubmit();
                }
              } else {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {currentQuestionIndex === quiz.questions.length - 1
              ? "Sınavı Tamamla"
              : "Sonraki Soru"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {!showResults ? (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <Link
                href="/exams"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center mb-2"
              >
                <FiArrowLeft className="mr-2" />
                Sınavlarım
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {quiz.quizType === "quick"
                  ? "Hızlı Sınav"
                  : "Kişiselleştirilmiş Sınav"}
              </h1>
            </div>

            {remainingTime !== null && (
            <div
              className={`flex items-center py-2 px-4 rounded-full ${
                remainingTime < 60
                    ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                    : remainingTime < 300
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
              }`}
            >
              <FiClock className="mr-2" />
                <span>{formatTime(remainingTime)}</span>
            </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              {renderQuestionNavigation()}

              <div className="sticky top-8">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                    İlerleme
                </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Tamamlanan</span>
                        <span>
                          {
                            Object.keys(userAnswers).length
                          }/{quiz.questions.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (Object.keys(userAnswers).length /
                                quiz.questions.length) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                  </div>

                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>İşaretlenen</span>
                        <span>
                          {flaggedQuestions.size}/{quiz.questions.length}
                    </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (flaggedQuestions.size / quiz.questions.length) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => {
                        const currFlag = flaggedQuestions.has(
                          currentQuestionIndex,
                        );

                        if (currFlag) {
                          const newFlags = new Set(flaggedQuestions);
                          newFlags.delete(currentQuestionIndex);
                          setFlaggedQuestions(newFlags);
                        } else {
                          const newFlags = new Set(flaggedQuestions);
                          newFlags.add(currentQuestionIndex);
                          setFlaggedQuestions(newFlags);
                        }
                      }}
                      className={`px-4 py-2 border rounded-md ${
                        flaggedQuestions.has(currentQuestionIndex)
                          ? "bg-amber-500 text-white border-amber-500"
                          : "border-amber-500 text-amber-500 dark:text-amber-400 dark:border-amber-400"
                      }`}
                    >
                      {flaggedQuestions.has(currentQuestionIndex)
                        ? "İşareti Kaldır"
                        : "Soruyu İşaretle"}
                    </button>
                  </div>

                  <div className="mt-8">
                    <button
                      onClick={() => {
                        if (window.confirm("Sınavı tamamlamak istiyor musunuz?")) {
                          handleSubmit();
                        }
                      }}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Sınavı Tamamla
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">{renderQuestion()}</div>
          </div>
        </>
      ) : (
        renderResults()
      )}
    </div>
  );
}
