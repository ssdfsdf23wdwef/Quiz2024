"use client";

import { useState, useEffect } from "react";
import { FiArrowLeft, FiDownload, FiShare2, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";

import quizService from "@/services/quiz.service";
import { ErrorService } from "@/services/error.service";
import QuizAnalysis from "@/components/ui/QuizAnalysis";
import Spinner from "@/components/ui/Spinner";
import { Quiz } from "@/types";

// Genişletilmiş Quiz tipi tanımı
interface ExtendedQuiz extends Quiz {
  title?: string;
  totalTime?: number;
  completed?: boolean;
}

export default function QuickQuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sınav verilerini yükle
  useEffect(() => {
    async function loadQuiz() {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const quizId = Array.isArray(params.id) ? params.id[0] : params.id;
        console.log(`🔄 Hızlı sınav sonuçları yükleniyor: ID=${quizId}`);
        
        const quizData = await quizService.getQuizById(quizId);
        console.log(`✅ Sınav sonuçları yüklendi:`, quizData);
        
        // Sınav tamamlanmamışsa hata göster
        const extendedQuiz = quizData as ExtendedQuiz;
        if (!extendedQuiz.completed) {
          setError("Bu sınav henüz tamamlanmamış");
          setLoading(false);
          return;
        }
        
        setQuiz(quizData as Quiz);
      } catch (error) {
        console.error(`❌ Sınav sonuçları yüklenemedi:`, error);
        ErrorService.showToast("Sınav sonuçları yüklenemedi", "error");
        setError("Sınav sonuçları yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [params.id]);

  // Tarih formatı
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Zorluk seviyesi çevirisi
  const getDifficultyText = (difficulty: string | undefined) => {
    if (!difficulty) return 'Karışık';
    
    switch (difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      default: return 'Karışık';
    }
  };

  // Quiz içeriğini render eden yardımcı fonksiyon
  const renderQuizContent = () => {
    if (!quiz) return null;
    
    const extendedQuiz = quiz as ExtendedQuiz;
    const quizTitle = extendedQuiz.title || "Hızlı Sınav";
    const quizDate = quiz.timestamp ? formatDate(quiz.timestamp.toString()) : formatDate(new Date());
    
    // Süre formatı
    const formatTime = () => {
      if (extendedQuiz.totalTime && extendedQuiz.totalTime > 0) {
        const totalTime = extendedQuiz.totalTime;
        return `${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}`;
      } else if (quiz.elapsedTime && quiz.elapsedTime > 0) {
        return `${Math.floor(quiz.elapsedTime / 60)}:${(quiz.elapsedTime % 60).toString().padStart(2, '0')}`;
      }
      return 'Belirtilmemiş';
    };
    
    return (
      <>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{quizTitle}</h2>
            <p className="text-gray-500 mt-1">{quizDate}</p>
          </div>

          <div className="mt-2 md:mt-0 flex items-center space-x-3">
            {/* Sınav türü etiketi */}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Hızlı Sınav
            </span>
            
            {/* Başarı yüzdesi etiketi */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                quiz.score >= 80
                  ? "bg-green-100 text-green-800"
                  : quiz.score >= 60
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              %{quiz.score} Başarı
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
          <div>
            <p className="text-sm text-gray-500">Tamamlanma Süresi</p>
            <p className="font-medium">{formatTime()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Soru Sayısı</p>
            <p className="font-medium">{quiz.questions?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Zorluk Seviyesi</p>
            <p className="font-medium">
              {quiz.preferences?.difficulty ? 
                getDifficultyText(quiz.preferences.difficulty) : 
                'Karışık'}
            </p>
          </div>
        </div>
      </>
    );
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner color="indigo" />
          <p className="mt-2 text-gray-600">Sınav sonuçları yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error || !quiz) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error || "Sınav bulunamadı. Lütfen geçerli bir sınav ID'si ile tekrar deneyin."}</p>
        <Link
          href="/exams"
          className="text-red-700 font-medium hover:underline mt-2 inline-block"
        >
          Sınavlara Dön
        </Link>
      </div>
    );
  }

  // Performans analiz sayfasına yönlendirme
  const handleViewPerformance = () => {
    router.push("/performance");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Üst Başlık ve Butonlar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/exams"
            className="text-indigo-600 hover:text-indigo-800 mr-4"
          >
            <FiArrowLeft className="inline-block mr-1" /> Geri
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Hızlı Sınav Sonuçları
          </h1>
        </div>

        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            <FiDownload className="mr-1" /> PDF İndir
          </button>
          <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            <FiShare2 className="mr-1" /> Paylaş
          </button>
        </div>
      </div>

      {/* Sınav Özeti */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow p-6 mb-6"
      >
        {renderQuizContent()}
      </motion.div>

      {/* Detaylı Performans Analizi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <QuizAnalysis quiz={quiz} />
      </motion.div>

      {/* Genel Performans Sayfasına Yönlendirme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow p-6 mt-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiRefreshCw className="mr-2" /> Performans Analizi
        </h3>

        <p className="text-gray-600 mb-4">
          Tüm sınavlarınızın toplu performans analizini görmek, gelişim alanlarınızı 
          tespit etmek ve öğrenme sürecinizi daha detaylı takip etmek için genel 
          performans sayfasını ziyaret edebilirsiniz.
        </p>

        <div className="flex justify-end">
          <button 
            onClick={handleViewPerformance}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Performans Sayfasına Git
          </button>
        </div>
      </motion.div>

      {/* Soru Detayları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow p-6 mt-6"
      >
        <h3 className="text-lg font-semibold mb-4">Soru Detayları</h3>

        <div className="space-y-6">
          {quiz.questions?.map((question, index) => {
            const userAnswer = quiz.userAnswers && quiz.userAnswers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div
                key={question.id}
                className={`p-4 rounded-lg border ${
                  isCorrect
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                }`}
              >
                <div className="flex items-start mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded mr-2 ${
                      isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {isCorrect ? "Doğru" : "Yanlış"}
                  </span>
                  <h4 className="text-gray-800 dark:text-gray-100 font-medium flex-grow">
                    {index + 1}. {question.questionText}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      question.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : question.difficulty === "medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getDifficultyText(question.difficulty)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {question.options.map((option, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-sm ${
                        option === question.correctAnswer
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : option === userAnswer
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>

                <div className="text-sm mt-3">
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    Açıklama:
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {question.explanation || "Bu soru için açıklama bulunmamaktadır."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
} 