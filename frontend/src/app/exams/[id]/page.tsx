/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, Key, SetStateAction } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiClock, FiX } from "react-icons/fi";
import { Quiz, Question, QuizType } from "@/types/quiz";
import quizService from "@/services/quiz.service";
import { ErrorService } from "@/services/error.service";

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
        console.log(`🔄 Sınav verileri yükleniyor: ID=${quizId}`);
        
        const quizData = await quizService.getQuizById(quizId);
        console.log(`✅ Sınav verileri yüklendi:`, quizData);
        
        setQuiz({
          ...quizData,
          quizType: quizData.quizType as QuizType,
        } as Quiz);
        
        // Zamanlayıcıyı ayarla
        if (quizData.preferences?.timeLimit) {
          setRemainingTime(quizData.preferences.timeLimit * 60); // Dakika -> Saniye
        }
      } catch (error) {
        console.error(`❌ Sınav verileri yüklenemedi:`, error);
        ErrorService.showToast("Sınav verileri yüklenemedi. Lütfen tekrar deneyin.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [params.id]);

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

  const handleSubmit = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    setIsCompleted(true);

    try {
      // API'ye yanıtları gönder
      const payload = {
        quizId: quiz.id,
        userAnswers: userAnswers,
        elapsedTime: quiz.preferences.timeLimit ? (quiz.preferences.timeLimit * 60) - (remainingTime || 0) : undefined
      };
      
      console.log(`🔄 Sınav yanıtları gönderiliyor:`, payload);
      const result = await quizService.submitQuiz(payload);
      console.log(`✅ Sınav yanıtları gönderildi:`, result);

      setShowResults(true);
    } catch (error) {
      console.error("❌ Sınav gönderme hatası:", error);
      ErrorService.showToast("Sınav yanıtları gönderilemedi. Lütfen tekrar deneyin.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
          <p className="text-gray-600">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Sınav bulunamadı
  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sınav Bulunamadı</h2>
        <p className="text-gray-600 mb-6">Aradığınız sınav bulunamadı veya erişim izniniz yok.</p>
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

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Soru {currentQuestionIndex + 1}/{quiz.questions.length}
          </h2>
          <p className="text-gray-700">{currentQuestion.questionText}</p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                userAnswers[currentQuestion.id] === option
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
              }`}
              onClick={() => {
                setUserAnswers({
                  ...userAnswers,
                  [currentQuestion.id]: option,
                });
              }}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                    userAnswers[currentQuestion.id] === option
                      ? "bg-indigo-500 text-white"
                      : "border border-gray-300"
                  }`}
                >
                  {userAnswers[currentQuestion.id] === option && (
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
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
    <div className="container mx-auto px-4 py-8">
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

            {remainingTime !== null && (
              <div
                className={`flex items-center py-2 px-4 rounded-full ${
                  remainingTime < 60
                    ? "bg-red-100 text-red-800"
                    : remainingTime < 300
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-800"
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
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    İlerleme
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Tamamlanan</span>
                        <span>
                          {
                            Object.keys(userAnswers).length
                          }/{quiz.questions.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
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
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>İşaretlenen</span>
                        <span>
                          {flaggedQuestions.size}/{quiz.questions.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
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
                          : "border-amber-500 text-amber-500"
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
                        if (
                          window.confirm("Sınavı tamamlamak istiyor musunuz?")
                        ) {
                          handleSubmit();
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Gönderiliyor..." : "Sınavı Tamamla"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderQuestion()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        renderResults()
      )}
    </div>
  );
}
