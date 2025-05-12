"use client";

import { motion } from "framer-motion";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiAlertTriangle,
} from "react-icons/fi";
import { QuizPreferences, QuizQuestion } from "@/app/types";
import Confetti from "react-dom-confetti";
import { useState, useEffect } from "react";

interface ResultsReviewStepProps {
  quizType: "quick" | "personalized";
  personalizedQuizType?:
    | "weakTopicFocused"
    | "newTopicFocused"
    | "comprehensive";
  selectedCourseName?: string;
  selectedCourseId?: string;
  selectedTopics?: string[];
  preferences: QuizPreferences;
  generatedQuestions: QuizQuestion[];
  isGenerating: boolean;
  generationError: string | null;
  onRegenerate: () => void;
}

export default function ResultsReviewStep({
  quizType,
  personalizedQuizType,
  selectedCourseName,
  selectedTopics,
  preferences,
  generatedQuestions,
  isGenerating,
  generationError,
  onRegenerate,
}: ResultsReviewStepProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (generatedQuestions.length > 0 && !isGenerating) {
      // Biraz gecikme ile konfeti efektini başlat
      const timer = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(timer);
    }
  }, [generatedQuestions, isGenerating]);

  // Konfeti konfigürasyonu
  const confettiConfig = {
    angle: 90,
    spread: 100,
    startVelocity: 40,
    elementCount: 70,
    dragFriction: 0.12,
    duration: 2000,
    stagger: 3,
    width: "10px",
    height: "10px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
  };

  if (isGenerating) {
    return (
      <motion.div
        key="generateLoading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="animate-pulse flex flex-col items-center text-center">
          <div className="h-10 w-10 mb-4 rounded-full bg-indigo-200 dark:bg-indigo-700 flex items-center justify-center">
            <svg
              className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Sınav Oluşturuluyor
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            Belirlediğiniz kriterlere göre kaliteli sorular hazırlanıyor. Bu
            işlem birkaç saniye sürebilir...
          </p>
        </div>
      </motion.div>
    );
  }

  if (generationError) {
    return (
      <motion.div
        key="generateError"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-8"
      >
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Sınav Oluşturulamadı
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            {generationError}
          </p>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors shadow-md"
          >
            Tekrar Dene
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative"
    >
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
        <Confetti active={showConfetti} config={confettiConfig} />
      </div>

      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        5. Sınav Hazır!
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-3">
            <FiCheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {quizType === "quick"
                ? "Hızlı Sınav"
                : "Kişiselleştirilmiş Sınav"}{" "}
              Başarıyla Oluşturuldu
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Sınav Detayları
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FiFileText className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {generatedQuestions.length} Soru
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {preferences.difficulty === "mixed"
                        ? "Karışık Zorluk"
                        : preferences.difficulty === "beginner"
                          ? "Kolay Zorluk"
                          : preferences.difficulty === "intermediate"
                            ? "Orta Zorluk"
                            : "Zor Zorluk"}
                    </div>
                  </div>
                </li>

                {preferences.timeLimit && (
                  <li className="flex items-start">
                    <FiClock className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {preferences.timeLimit} dakika
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Zaman sınırı
                      </div>
                    </div>
                  </li>
                )}

                {quizType === "personalized" && (
                  <li className="flex items-start">
                    <FiTrendingUp className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {personalizedQuizType === "weakTopicFocused"
                          ? "Zayıf/Orta Odaklı"
                          : personalizedQuizType === "newTopicFocused"
                            ? "Yeni Konu Odaklı"
                            : "Kapsamlı"}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Kişiselleştirme türü
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {quizType === "personalized" && selectedCourseName && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Kapsam
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedCourseName}
                  </p>

                  {selectedTopics && selectedTopics.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Seçilen konular:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTopics.slice(0, 3).map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                        {selectedTopics.length > 3 && (
                          <span className="inline-flex text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                            +{selectedTopics.length - 3} konu daha
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Örnek Sorular
          </h4>
          <div className="space-y-3">
            {generatedQuestions.slice(0, 2).map((question, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {question.text}
                </p>
                <div className="space-y-1.5">
                  {question.options.slice(0, 2).map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center">
                      <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600 mr-2"></div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {option}
                      </p>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                    (+ {question.options.length - 2} seçenek daha)
                  </div>
                </div>
              </div>
            ))}

            {generatedQuestions.length > 2 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
                + {generatedQuestions.length - 2} soru daha
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
