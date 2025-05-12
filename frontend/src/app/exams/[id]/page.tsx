/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, Key, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiClock, FiX } from "react-icons/fi";
import { Quiz, Question } from "@/types/quiz";

export default function ExamPage() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz>({} as Quiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null | undefined>(
    quiz.elapsedTime,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Timer
  useEffect(() => {
    if (isCompleted || showResults) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, showResults]);

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Yükleme yapılması gereken bir durum olabilir - gelecekteki geliştirme için
  // useEffect(() => {
  //   // Firebase'den veri çekilecek
  // }, [params.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsCompleted(true);

    try {
      // Gerçek uygulamada Firebase'e gönderilecek
      // Burada mock bir davranış uygulayalım
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setShowResults(true);
    } catch (error) {
      console.error("Sınav gönderme hatası:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.questions.forEach((question) => {
      if (userAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    return Math.round((correctCount / quiz.questions.length) * 100);
  };

  const renderQuestionNavigation = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Sorular</h3>
        <div className="grid grid-cols-5 gap-2">
          {quiz.questions &&
            quiz.questions.map((question: Question, index: number) => {
              const isAnswered = userAnswers[question.id] !== undefined;
              const isCurrent = currentQuestionIndex === index;
              const isFlagged = flaggedQuestions.has(index);

              return (
                <button
                  key={question.id}
                  className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium
                  ${isCurrent ? "bg-indigo-600 text-white" : ""}
                  ${isAnswered && !isCurrent ? "bg-indigo-100 text-indigo-800" : ""}
                  ${!isAnswered && !isCurrent ? "bg-gray-100 text-gray-800" : ""}
                  ${isFlagged ? "ring-2 ring-amber-500" : ""}
                  hover:bg-indigo-500 hover:text-white transition-colors
                `}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </button>
              );
            })}
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
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-indigo-600">{score}%</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Sınav Tamamlandı!
          </h2>
          <p className="text-gray-600">
            Toplam puanınız: <span className="font-semibold">{score}%</span> (
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
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
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
                  <h3 className="text-gray-800 font-medium">
                    Soru {index + 1}: {question.questionText}
                  </h3>
                </div>

                <div className="ml-8 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Sizin cevabınız:</span>{" "}
                    {userAnswers[question.id] || "Cevap verilmedi"}
                  </div>

                  {!isCorrect && (
                    <div className="text-sm">
                      <span className="font-medium">Doğru cevap:</span>{" "}
                      {question.correctAnswer}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="text-sm mt-2 p-2 bg-gray-100 rounded">
                      <span className="font-medium">Açıklama:</span>{" "}
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
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
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

  function renderQuestion(
    _currentQuestion: unknown,
    _currentQuestionIndex: number,
  ): React.ReactNode {
    console.log("currentQuestion", currentQuestion);
    return <div>Test</div>;
  }

  return (
    <>
      {!showResults ? (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <Link
                href="/exams"
                className="text-indigo-600 hover:text-indigo-800 flex items-center mb-2"
              >
                <FiArrowLeft className="mr-2" />
                Sınavlarım
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">
                {quiz.quizType === "quick"
                  ? "Hızlı Sınav"
                  : "Kişiselleştirilmiş Sınav"}
              </h1>
            </div>

            <div
              className={`flex items-center py-2 px-4 rounded-full ${
                remainingTime !== null &&
                remainingTime !== undefined &&
                remainingTime < 60
                  ? "bg-red-100 text-red-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              <FiClock className="mr-2" />
              <span className="font-medium">
                {formatTime(remainingTime || 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {currentQuestion &&
                  renderQuestion(currentQuestion, currentQuestionIndex)}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              {renderQuestionNavigation()}

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Sınav Özeti
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Soru:</span>
                    <span className="font-medium">{quiz.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cevaplanan:</span>
                    <span className="font-medium">
                      {Object.keys(userAnswers).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cevapsız:</span>
                    <span className="font-medium">
                      {quiz.questions.length - Object.keys(userAnswers).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">İşaretlenen:</span>
                    <span className="font-medium">{flaggedQuestions.size}</span>
                  </div>
                </div>

                <button
                  className={`w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleSubmit}
                  disabled={isSubmitting || isCompleted}
                >
                  {isSubmitting ? "Gönderiliyor..." : "Sınavı Bitir"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        renderResults()
      )}
    </>
  );
}
