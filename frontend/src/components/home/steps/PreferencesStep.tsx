"use client";

import { motion } from "framer-motion";
import { FiClock, FiTarget } from "react-icons/fi";
import { QuizPreferences } from "@/app/types";

interface PreferencesStepProps {
  preferences: QuizPreferences;
  quizType: "quick" | "personalized";
  personalizedQuizType?:
    | "weakTopicFocused"
    | "newTopicFocused"
    | "comprehensive";
  useTimeLimit: boolean;
  onPreferenceChange: (key: keyof QuizPreferences, value: unknown) => void;
  onUseTimeLimitChange: (checked: boolean) => void;
  onTimeLimitInputChange: (value: string) => void;
}

export default function PreferencesStep({
  preferences,
  quizType,
  personalizedQuizType,
  useTimeLimit,
  onPreferenceChange,
  onUseTimeLimitChange,
  onTimeLimitInputChange,
}: PreferencesStepProps) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        4. Tercihler
      </h3>

      {/* Seçilen Sınav Türü Bilgisi */}
      <div className="mb-6 p-4 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-white ${quizType === "quick" ? "bg-blue-500" : "bg-purple-500"}`}
          >
            {quizType === "quick" ? (
              <FiClock size={14} />
            ) : (
              <FiTarget size={14} />
            )}
          </div>
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            {quizType === "quick"
              ? "Hızlı Sınav"
              : personalizedQuizType === "weakTopicFocused"
                ? "Kişiselleştirilmiş: Zayıf/Orta Odaklı"
                : personalizedQuizType === "newTopicFocused"
                  ? "Kişiselleştirilmiş: Yeni Konu Odaklı"
                  : "Kişiselleştirilmiş: Kapsamlı"}
          </span>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-400 mt-1.5 ml-9">
          {quizType === "quick" &&
            "Tek bir belge içeriğini hızlıca değerlendirmek için. Öğrenme hedeflerini etkilemez."}
          {quizType === "personalized" &&
            personalizedQuizType === "weakTopicFocused" &&
            "Durumu zayıf veya orta olan mevcut öğrenme hedeflerinize odaklanır."}
          {quizType === "personalized" &&
            personalizedQuizType === "newTopicFocused" &&
            "Yüklenen belgedeki yeni konuları test eder ve ilk durumlarını belirler."}
          {quizType === "personalized" &&
            personalizedQuizType === "comprehensive" &&
            "Yeni içerik ile tüm öğrenme hedeflerinizi birleştirir."}
        </p>
      </div>

      <div className="space-y-6">
        {/* Soru Sayısı */}
        <div>
          <label
            htmlFor="questionCount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Soru Sayısı
          </label>
          <div className="flex items-center">
            <input
              type="range"
              id="questionCount"
              min="5"
              max={quizType === "quick" ? 20 : 30}
              step="1"
              value={preferences.questionCount}
              onChange={(e) =>
                onPreferenceChange("questionCount", parseInt(e.target.value))
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
            />
            <span className="w-12 text-center text-sm font-medium text-gray-700 dark:text-gray-300 ml-4 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {preferences.questionCount}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {quizType === "quick" ? "5-20 arası." : "5-30 arası."} Daha fazla
            soru, daha detaylı analiz sağlar.
          </p>
        </div>

        {/* Zorluk Seviyesi */}
        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Zorluk Seviyesi
          </label>
          <select
            id="difficulty"
            value={preferences.difficulty}
            onChange={(e) =>
              onPreferenceChange(
                "difficulty",
                e.target.value as
                  | "beginner"
                  | "intermediate"
                  | "advanced"
                  | "mixed",
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="beginner">Kolay</option>
            <option value="intermediate">Orta</option>
            <option value="advanced">Zor</option>
            <option value="mixed">Karışık (Önerilen)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sınavdaki soruların zorluk seviyesini belirler.
          </p>
        </div>

        {/* Zaman Sınırı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zaman Sınırı (Opsiyonel)
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useTimeLimit"
                checked={useTimeLimit}
                onChange={(e) => onUseTimeLimitChange(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="useTimeLimit"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Zaman sınırı uygula
              </label>
            </div>
            {useTimeLimit && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                transition={{ duration: 0.3 }}
                className="flex items-center overflow-hidden"
              >
                <input
                  type="number"
                  id="timeLimitInput"
                  min="1"
                  max="180"
                  value={preferences.timeLimit || ""}
                  onChange={(e) => onTimeLimitInputChange(e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="örn: 30"
                />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  dakika
                </span>
              </motion.div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sınav için bir süre belirleyebilirsiniz.
          </p>
        </div>

        {/* Kapsamlı Sınav Özel Ayarı */}
        {quizType === "personalized" &&
          personalizedQuizType === "comprehensive" && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="prioritizeWeakAndMediumTopics"
                  checked={preferences.prioritizeWeakAndMediumTopics || false}
                  onChange={(e) =>
                    onPreferenceChange(
                      "prioritizeWeakAndMediumTopics",
                      e.target.checked,
                    )
                  }
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500 mt-0.5 flex-shrink-0"
                />
                <div className="ml-3">
                  <label
                    htmlFor="prioritizeWeakAndMediumTopics"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Başarısız ve Orta Konulara Öncelik Ver
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Seçildiğinde, durumu &apos;başarısız&apos; veya
                    &apos;orta&apos; olan konulara daha fazla soru (%60 ağırlık)
                    ayrılır.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );
}
