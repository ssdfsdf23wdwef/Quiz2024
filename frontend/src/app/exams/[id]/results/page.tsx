"use client";

import { useState, useEffect } from "react";
import { FiArrowLeft, FiDownload, FiShare2, FiRefreshCw } from "react-icons/fi";
import MainLayout from "@/components/layout/MainLayout";
import QuizAnalysis from "@/components/ui/QuizAnalysis";
import Link from "next/link";
import quizService from "@/services/quiz.service";
import { Question, Quiz, QuizType, PersonalizedQuizType, DifficultyLevel } from "@/types/quiz";

// API'dan gelen tipi Quiz tipine dönüştürmek için yardımcı bir tip tanımlıyorum
type ApiQuiz = Omit<Quiz, 'selectedSubTopics'> & {
  selectedSubTopics?: unknown | null; // Backend API'sinden gelen kısım
};

interface ResultsPageProps {
  params: {
    id: string;
  };
}

// Sınav sonuç detayları için genişletilmiş tip, Quiz tipini genişleterek
interface QuizResultDetails extends Quiz {
  fileName?: string;
  formattedTime?: string;
  userLevel?: string;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const [quiz, setQuiz] = useState<QuizResultDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Sınav verilerini yükle
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        // Gerçek API'den veri çekiyoruz
        const quizData = await quizService.getQuizById(params.id) as ApiQuiz;
        
        // Eğer backend'den gelen selectedSubTopics alt konu nesneleri içeriyorsa, 
        // bunları sadece string dizisine dönüştür
        const selectedTopics = Array.isArray(quizData.selectedSubTopics)
          ? quizData.selectedSubTopics.map((item: any) => 
              typeof item === 'string' ? item : item.subTopic)
          : null;
        
        // API tiplerini frontend tiplerine dönüştür ve ek bilgileri ekle
        const enhancedQuizData: QuizResultDetails = {
          ...quizData,
          // API'den gelen değerleri özellikle cast et
          quizType: quizData.quizType as QuizType,
          personalizedQuizType: quizData.personalizedQuizType as PersonalizedQuizType | null,
          selectedSubTopics: selectedTopics,
          questions: quizData.questions.map(q => ({
            ...q,
            difficulty: q.difficulty as DifficultyLevel
          })),
          preferences: {
            ...quizData.preferences,
            difficulty: quizData.preferences.difficulty as DifficultyLevel,
            timeLimit: quizData.preferences.timeLimit || undefined,
            prioritizeWeakAndMediumTopics: quizData.preferences.prioritizeWeakAndMediumTopics || undefined
          },
          // Ek bilgiler
          fileName: quizData.sourceDocument?.fileName || `Sınav #${quizData.id}`,
          formattedTime: quizData.elapsedTime ? `${Math.floor(quizData.elapsedTime / 60)}:${(quizData.elapsedTime % 60).toString().padStart(2, '0')}` : 'Bilinmiyor',
          userLevel: quizData.preferences.difficulty === 'easy' 
            ? 'beginner' 
            : quizData.preferences.difficulty === 'medium' 
              ? 'intermediate' 
              : 'advanced'
        };
        
        setQuiz(enhancedQuizData);
        setLoading(false);
      } catch (error) {
        console.error("Sınav verileri yüklenirken hata:", error);
        setLoading(false);
      }
    };

    fetchQuiz();
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

  // Sınav türü etiketi
  const QuizTypeTag = ({ type }: { type: "quick" | "personalized" }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        type === "quick"
          ? "bg-indigo-100 text-indigo-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {type === "quick" ? "Hızlı Sınav" : "Kişiselleştirilmiş Sınav"}
    </span>
  );

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </>
    );
  }

  if (!quiz) {
    return (
      <>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>
            Sınav bulunamadı. Lütfen geçerli bir sınav ID&apos;si ile tekrar
            deneyin.
          </p>
          <Link
            href="/exams"
            className="text-red-700 font-medium hover:underline mt-2 inline-block"
          >
            Sınavlara Dön
          </Link>
        </div>
      </>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/exams"
            className="text-indigo-600 hover:text-indigo-800 mr-4"
          >
            <FiArrowLeft className="inline-block mr-1" /> Geri
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Sınav Sonuçları</h1>
        </div>

        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <FiDownload className="mr-1" /> PDF İndir
          </button>
          <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <FiShare2 className="mr-1" /> Paylaş
          </button>
        </div>
      </div>

      {/* Sınav Özeti */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{quiz.fileName}</h2>
            <p className="text-gray-500 mt-1">{formatDate(quiz.timestamp.toString())}</p>
          </div>

          <div className="mt-2 md:mt-0 flex items-center space-x-3">
            <QuizTypeTag type={quiz.quizType} />
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
            <p className="font-medium">{quiz.formattedTime}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Soru Sayısı</p>
            <p className="font-medium">{quiz.questions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Zorluk Seviyesi</p>
            <p className="font-medium">
              {quiz.userLevel === "beginner"
                ? "Başlangıç"
                : quiz.userLevel === "intermediate"
                  ? "Orta"
                  : quiz.userLevel === "advanced"
                    ? "İleri"
                    : "Karışık"}
            </p>
          </div>
        </div>
      </div>

      {/* Detaylı Analiz */}
      <QuizAnalysis quiz={quiz} />

      {/* Öğrenme Hedefleri Güncelleme (Sadece Kişiselleştirilmiş Sınav için) */}
      {quiz.quizType === "personalized" && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiRefreshCw className="mr-2" /> Öğrenme Hedefleri Güncelleme
          </h3>

          <p className="text-gray-600 mb-4">
            Bu kişiselleştirilmiş sınav sonuçlarına göre öğrenme hedefleriniz
            güncellenebilir. Bu, gelecekteki sınavların içeriğini ve odak
            noktalarını etkileyecektir.
          </p>

          <div className="flex justify-end">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Öğrenme Hedeflerini Güncelle
            </button>
          </div>
        </div>
      )}

      {/* Soru Detayları */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Soru Detayları</h3>

        <div className="space-y-6">
          {quiz?.questions.map((question: Question, index: number) => {
            const userAnswer = quiz.userAnswers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div
                key={question.id}
                className={`p-4 rounded-lg border ${
                  isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex justify-between">
                  <h4 className="font-medium">Soru {index + 1}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      isCorrect
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {isCorrect ? "Doğru" : "Yanlış"}
                  </span>
                </div>

                <p className="mt-2">{question.questionText}</p>

                <div className="mt-3 space-y-2">
                  {question.options?.map((option: string, optIndex: number) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded ${
                        option === question.correctAnswer
                          ? "bg-green-200 text-green-800"
                          : option === userAnswer &&
                              option !== question.correctAnswer
                            ? "bg-red-200 text-red-800"
                            : "bg-gray-100"
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded">
                    <p className="text-sm font-medium">Açıklama:</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  Konu: {question.subTopic} | Zorluk:{" "}
                  {question.difficulty === "easy"
                    ? "Kolay"
                    : question.difficulty === "medium"
                      ? "Orta"
                      : "Zor"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
