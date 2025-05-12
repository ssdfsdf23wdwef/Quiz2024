"use client";

import { motion } from "framer-motion";
import { FiClock, FiTarget, FiZap, FiAward } from "react-icons/fi";

interface QuizTypeStepProps {
  quizType: "quick" | "personalized";
  personalizedQuizType:
    | "weakTopicFocused"
    | "newTopicFocused"
    | "comprehensive";
  onQuizTypeSelect: (type: "quick" | "personalized") => void;
  onPersonalizedQuizTypeSelect: (
    type: "weakTopicFocused" | "newTopicFocused" | "comprehensive",
  ) => void;
}

export default function QuizTypeStep({
  quizType,
  personalizedQuizType,
  onQuizTypeSelect,
  onPersonalizedQuizTypeSelect,
}: QuizTypeStepProps) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        2. Sınav Türü
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Hızlı Sınav Seçeneği */}
        <div
          className={`
            border rounded-xl p-6 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02]
            ${
              quizType === "quick"
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/50 shadow-md"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600"
            }
          `}
          onClick={() => onQuizTypeSelect("quick")}
        >
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400">
              <FiClock className="text-xl" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Hızlı Sınav
            </h4>
          </div>

          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-14 list-disc list-inside">
            <li>Tek belgeyi hızlıca değerlendirir</li>
            <li>Öğrenme hedeflerini etkilemez</li>
            <li>Sonuçlar kaydedilir</li>
          </ul>
        </div>

        {/* Kişiselleştirilmiş Sınav Seçeneği */}
        <div
          className={`
             border rounded-xl p-6 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02]
            ${
              quizType === "personalized"
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/50 shadow-md"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600"
            }
          `}
          onClick={() => onQuizTypeSelect("personalized")}
        >
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4 text-purple-600 dark:text-purple-400">
              <FiTarget className="text-xl" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Kişiselleştirilmiş Sınav
            </h4>
          </div>

          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-14 list-disc list-inside">
            <li>Öğrenme sürecini takip eder</li>
            <li>Hedeflerinizi günceller</li>
            <li>Detaylı analiz sunar</li>
          </ul>
        </div>
      </div>

      {/* Kişiselleştirilmiş Sınav Alt Türleri */}
      {quizType === "personalized" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
            Sınav Odağı Seçin:
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {/* Zayıf/Orta Odaklı Sınav */}
            <div
              className={`
                flex items-center border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out
                ${
                  personalizedQuizType === "weakTopicFocused"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/50 shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                }
              `}
              onClick={() => onPersonalizedQuizTypeSelect("weakTopicFocused")}
            >
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 flex-shrink-0 text-red-600 dark:text-red-400">
                <FiZap />
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  Zayıf/Orta Odaklı
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Mevcut hedeflerinizdeki eksiklere odaklanın. (Belge gerekmez)
                </p>
              </div>
            </div>

            {/* Kapsamlı Sınav */}
            <div
              className={`
                flex items-center border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out
                ${
                  personalizedQuizType === "comprehensive"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/50 shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                }
              `}
              onClick={() => onPersonalizedQuizTypeSelect("comprehensive")}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400">
                <FiAward />
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  Kapsamlı
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Yeni konular ve mevcut hedeflerinizi birleştirin. (Belge
                  gerekir)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
