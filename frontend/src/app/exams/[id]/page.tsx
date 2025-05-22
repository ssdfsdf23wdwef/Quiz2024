/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, Key, SetStateAction } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Clock, Flag, CheckCircle, XCircle, Info, ChevronLeft, ChevronRight, Award, ListChecks, BarChart3 } from "lucide-react";
import { Quiz, Question, QuizType, AnalysisResult, DifficultyLevel, QuizSubmissionPayload } from "@/types/quiz";
import quizService from "@/services/quiz.service";
import { ErrorService } from "@/services/error.service";
import { Button, Card, CardBody, Chip, Progress, Tooltip } from "@nextui-org/react";

// Sonuçları localStorage'a kaydetmek için fonksiyon
const storeQuizResultsInStorage = (quizId: string, resultsToStore: Quiz) => {
  if (typeof window !== 'undefined') {
    // Quiz arayüzüne uymayan alanları çıkararak sadece Quiz tipinde olanları sakla
    const { userAnswers, correctCount, totalQuestions, score, elapsedTime, timestamp, analysisResult, ...quizDataToStore } = resultsToStore;
    localStorage.setItem(`quizResult_${quizId}`, JSON.stringify(quizDataToStore));
    // Analiz sonuçlarını ayrı bir anahtarda sakla
    if (analysisResult) {
      localStorage.setItem(`quizAnalysis_${quizId}`, JSON.stringify({
        userAnswers,
        correctCount,
        totalQuestions,
        score,
        elapsedTime,
        timestamp,
        analysisResult
      }));
    }
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
        // Kullanıcıyı ana sayfaya veya sınav listesine yönlendir
        setTimeout(() => {
          router.push('/exams');
        }, 3000);
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
          // quiz: preparedQuiz, // Bu satır QuizSubmissionPayload tipine uymadığı için kaldırıldı veya yorumlandı
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4">
        <div className="text-center">
          <div className="w-20 h-20 border-t-4 border-b-4 border-indigo-600 dark:border-indigo-400 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-2">Sınav Yükleniyor...</h2>
          <p className="text-gray-600 dark:text-gray-400">Lütfen bekleyin, sınavınız hazırlanıyor.</p>
        </div>
      </div>
    );
  }

  // Sınav bulunamadı
  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md">
          <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Sınav Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Aradığınız sınav mevcut değil veya erişim yetkiniz bulunmuyor. Lütfen sınav listesine geri dönün.
          </p>
          <Link
            href="/exams"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-150 shadow-md hover:shadow-lg"
          >
            <ChevronLeft size={20} className="mr-2" />
            Sınav Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  const renderQuestionNavigation = () => {
    // Alt konuları grupla ve renklendir
    const subTopicColors: Record<string, { bg: string; text: string; ring: string; }> = {};
    const subTopicMap: Record<string, {count: number; displayName: string; normalizedName: string}> = {};
    
    console.log("[DEBUG] renderQuestionNavigation - Alt konu bilgileri işleniyor...");
    
    // Renk seçenekleri (daha canlı ve erişilebilir renkler)
    const colorOptions = [
      { bg: "bg-sky-100 dark:bg-sky-800/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-400 dark:ring-sky-500" },
      { bg: "bg-emerald-100 dark:bg-emerald-800/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-400 dark:ring-emerald-500" },
      { bg: "bg-amber-100 dark:bg-amber-800/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-400 dark:ring-amber-500" },
      { bg: "bg-rose-100 dark:bg-rose-800/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-400 dark:ring-rose-500" },
      { bg: "bg-violet-100 dark:bg-violet-800/40", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-400 dark:ring-violet-500" },
      { bg: "bg-cyan-100 dark:bg-cyan-800/40", text: "text-cyan-700 dark:text-cyan-300", ring: "ring-cyan-400 dark:ring-cyan-500" },
      { bg: "bg-pink-100 dark:bg-pink-800/40", text: "text-pink-700 dark:text-pink-300", ring: "ring-pink-400 dark:ring-pink-500" },
      { bg: "bg-lime-100 dark:bg-lime-800/40", text: "text-lime-700 dark:text-lime-300", ring: "ring-lime-400 dark:ring-lime-500" },
    ];
    
    // Alt konulara göre renk ataması yapma
    if (quiz.questions && quiz.questions.length > 0) {
      quiz.questions.forEach((q) => {
        const subTopic = q.subTopic || "Genel Konu";
        const normalizedSubTopic = q.normalizedSubTopic || "genel-konu";
        
        if (!subTopicMap[subTopic]) {
          subTopicMap[subTopic] = {
            count: 1,
            displayName: subTopic,
            normalizedName: normalizedSubTopic
          };
        } else {
          subTopicMap[subTopic].count++;
        }
      });
      
      const uniqueSubTopics = Object.keys(subTopicMap);
      uniqueSubTopics.forEach((subTopic, index) => {
        subTopicColors[subTopic] = colorOptions[index % colorOptions.length];
      });
    }
    
    const getSubTopicInfo = (question: Question) => {
      const subTopic = question.subTopic || "Genel Konu";
      const colorSet = subTopicColors[subTopic] || { bg: "bg-gray-200 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-200", ring: "ring-gray-400" };
      
      return {
        name: subTopic,
        normalizedName: question.normalizedSubTopic || "genel-konu",
        colorSet
      };
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg sticky top-24">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Soru Navigasyonu</h3>
          <Tooltip content="Renkler farklı alt konuları gösterir. İşaretli sorular bayrak ile belirtilir.">
            <div className="cursor-help p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <Info size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
          </Tooltip>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-5 gap-2 mb-4">
          {quiz.questions &&
            quiz.questions.map((question: Question, index: number) => {
              const isAnswered = userAnswers[question.id] !== undefined;
              const isCurrent = currentQuestionIndex === index;
              const isFlagged = flaggedQuestions.has(index);
              const subTopicInfo = getSubTopicInfo(question);

              return (
                <Tooltip key={question.id} content={`${index + 1}. Soru ${isFlagged ? '(İşaretli)' : ''} - ${subTopicInfo.name}`}>
                  <button
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-full h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-150 ease-in-out
                               focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                               ${
                                isCurrent 
                                  ? `${subTopicInfo.colorSet.bg} ${subTopicInfo.colorSet.text} ring-2 ${subTopicInfo.colorSet.ring} shadow-md scale-105` 
                                  : isAnswered 
                                    ? `${subTopicInfo.colorSet.bg} ${subTopicInfo.colorSet.text} opacity-70 hover:opacity-100` 
                                    : `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600`
                               }
                               relative`}
                  >
                    {index + 1}
                    {isFlagged && (
                      <Flag size={12} className="absolute top-1 right-1 text-red-500 dark:text-red-400" />
                    )}
                  </button>
                </Tooltip>
              );
            })}
        </div>
        
        {Object.keys(subTopicMap).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Alt Konu Lejantı:</p>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {Object.entries(subTopicMap).map(([subTopic, info]) => {
                const colorSet = subTopicColors[subTopic] || { bg: 'bg-gray-300', text: 'text-gray-600 dark:text-gray-400' }; // Fallback colorSet
                return (
                  <div key={subTopic} className="flex items-center">
                    <span className={`w-3 h-3 rounded-sm mr-2 ${colorSet.bg}`}></span>
                    <span className={`text-xs ${colorSet.text}`}>
                      {info.displayName} ({info.count})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const score = calculateScore();
    // Analiz sonuçlarını localStorage'dan al
    const quizAnalysisData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`quizAnalysis_${quiz.id}`) || '{}') : {};
    const analysis = quizAnalysisData.analysisResult || {};
    const userAnswersFromStorage = quizAnalysisData.userAnswers || userAnswers; // API hatası durumunda local userAnswers kullanılır

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 120 }}
            className="w-28 h-28 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 rounded-full flex flex-col items-center justify-center shadow-lg mb-6"
          >
            <Award size={40} className="text-white mb-1" />
            <span className="text-3xl font-bold text-white">{score}%</span>
          </motion.div>
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
            Sınav Tamamlandı!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Toplam puanınız: <span className="font-bold text-gray-900 dark:text-white">{score}%</span> (
            {
              quiz.questions.filter(
                (q) => userAnswersFromStorage[q.id] === q.correctAnswer, // userAnswersFromStorage kullanıldı
              ).length
            }
            /{quiz.questions.length} doğru)
          </p>
        </div>

        {/* Detaylı Sonuçlar ve Analiz */}
        {analysis.performanceBySubTopic && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Konu Bazlı Performans</h3>
            <div className="space-y-3">
              {Object.entries(analysis.performanceBySubTopic).map(([topic, data]: [string, any]) => (
                <div key={topic} className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{topic}</span>
                    <span className={`font-semibold ${data.scorePercent >= 75 ? 'text-green-600 dark:text-green-400' : data.scorePercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      %{data.scorePercent}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${data.scorePercent >= 75 ? 'bg-green-500' : data.scorePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${data.scorePercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.correctCount}/{data.questionCount} doğru</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 mb-10">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Yanıtlarınızın İncelenmesi</h3>
          {quiz.questions.map((question, index) => {
            const userAnswer = userAnswersFromStorage[question.id]; // userAnswersFromStorage kullanıldı
            const isCorrect = userAnswer === question.correctAnswer;
            const questionData = ensureQuestionSubTopics(question); // Ensure subtopics are present

            return (
              <div key={question.id} className={`p-5 rounded-lg shadow-md ${isCorrect ? 'bg-green-50 dark:bg-green-800/30 border-l-4 border-green-500' : 'bg-red-50 dark:bg-red-800/30 border-l-4 border-red-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-white">
                    Soru {index + 1}: <span className="text-sm text-gray-600 dark:text-gray-400">({questionData.subTopic || "Genel Konu"})</span>
                  </h4>
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-200 mb-3">{question.questionText}</p>
                <div className="space-y-2 text-sm">
                  <p className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    Sizin Cevabınız: <span className="font-normal">{userAnswer || "Boş bırakıldı"}</span>
                  </p>
                  {!isCorrect && (
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      Doğru Cevap: <span className="font-normal">{question.correctAnswer}</span>
                    </p>
                  )}
                </div>
                {question.explanation && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Açıklama:</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/exams"
            className="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors duration-150 shadow-sm hover:shadow-md"
          >
            <ListChecks size={18} className="mr-2" />
            Sınav Listesi
          </Link>
          <Link
            href={`/performance/quiz/${quiz.id}`} // Dinamik performans sayfasına yönlendirme
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-150 shadow-md hover:shadow-lg"
          >
            <BarChart3 size={18} className="mr-2" />
            Detaylı Performans Analizi
          </Link>
        </div>
      </motion.div>
    );
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const processedQuestion = ensureQuestionSubTopics(currentQuestion);
    const subTopicName = processedQuestion.subTopic || "Belirtilmemiş";
    const difficultyMap = {
      easy: { text: "Kolay", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-700/30" },
      medium: { text: "Orta", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-700/30" },
      hard: { text: "Zor", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-700/30" },
      mixed: { text: "Karma", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-700/30" },
    };
    const difficultyInfo = difficultyMap[processedQuestion.difficulty || 'medium'] || difficultyMap.medium;


    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400">
              Soru {currentQuestionIndex + 1} <span className="text-gray-500 dark:text-gray-400 font-normal text-xl">/ {quiz.questions.length}</span>
            </h2>
            <div className="mt-2 sm:mt-0 flex items-center space-x-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyInfo.bg} ${difficultyInfo.color}`}>
                {difficultyInfo.text}
              </span>
              <Tooltip content={flaggedQuestions.has(currentQuestionIndex) ? "İşareti Kaldır" : "Bu Soruyu İşaretle"}>
                <button
                  onClick={() => {
                    const newFlagged = new Set(flaggedQuestions);
                    if (newFlagged.has(currentQuestionIndex)) {
                      newFlagged.delete(currentQuestionIndex);
                    } else {
                      newFlagged.add(currentQuestionIndex);
                    }
                    setFlaggedQuestions(newFlagged);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    flaggedQuestions.has(currentQuestionIndex)
                      ? "bg-red-100 dark:bg-red-700/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-700/50"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Flag size={18} />
                </button>
              </Tooltip>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Alt Konu: <span className="font-medium text-gray-700 dark:text-gray-300">{subTopicName}</span>
          </p>
          
          <p className="mt-4 text-lg text-gray-800 dark:text-gray-100 leading-relaxed">{processedQuestion.questionText}</p>
          
        </div>

        <div className="space-y-4">
          {processedQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-150 ease-in-out transform hover:scale-[1.02]
                          flex items-center group
                          ${
                            userAnswers[processedQuestion.id] === option
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-700/30 dark:border-indigo-500 shadow-lg"
                              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700"
                          }`}
              onClick={() => {
                setUserAnswers((prev) => ({
                  ...prev,
                  [processedQuestion.id]: option,
                }));
              }}
            >
              <span className={`mr-3 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                              ${userAnswers[processedQuestion.id] === option ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 dark:border-gray-500 group-hover:border-indigo-500'}`}>
                {userAnswers[processedQuestion.id] === option && <CheckCircle size={14} className="text-white" />}
              </span>
              <span className={`text-md ${userAnswers[processedQuestion.id] === option ? 'text-indigo-800 dark:text-indigo-100 font-semibold' : 'text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300'}`}>
                {option}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors duration-150 shadow-sm hover:shadow-md mb-3 sm:mb-0"
          >
            <ChevronLeft size={20} className="mr-2" />
            Önceki Soru
          </button>

          <button
            onClick={() => {
              const isLast = currentQuestionIndex === quiz.questions.length - 1;
              if (isLast) {
                // Son soruysa ve tamamla butonuna basıldıysa, handleSubmit çağır
                handleSubmit();
              } else {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-150 shadow-md hover:shadow-lg disabled:bg-indigo-400 dark:disabled:bg-indigo-700"
            disabled={isSubmitting}
          >
            {currentQuestionIndex === quiz.questions.length - 1
              ? (isSubmitting ? "Gönderiliyor..." : "Sınavı Tamamla")
              : "Sonraki Soru"}
            {currentQuestionIndex !== quiz.questions.length - 1 && <ChevronRight size={20} className="ml-2" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 dark:from-gray-900 dark:to-indigo-900/50 text-gray-800 dark:text-gray-200 selection:bg-indigo-500 selection:text-white">
      <div className="container mx-auto px-4 py-8">
        {!showResults ? (
          <>
            {/* Header: Sınav Adı ve Zamanlayıcı */}
            <header className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400 mb-3 sm:mb-0 truncate max-w-xl" title={quiz.title}>
                  {quiz.title}
                </h1>
                {remainingTime !== null && !isCompleted && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-700/30 rounded-lg shadow-inner">
                    <Clock size={20} className="text-indigo-600 dark:text-indigo-300" />
                    <span className="text-lg font-semibold text-indigo-700 dark:text-indigo-200">
                      {formatTime(remainingTime)}
                    </span>
                  </div>
                )}
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <aside className="lg:col-span-4 xl:col-span-3">
                {renderQuestionNavigation()}
              </aside>

              <main className="lg:col-span-8 xl:col-span-9">
                {renderQuestion()}
              </main>
            </div>
          </>
        ) : (
          renderResults()
        )}
      </div>
    </div>
  );
}
