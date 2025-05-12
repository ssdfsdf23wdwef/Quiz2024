"use client";

import {
  FiZap,
  FiTarget,
  FiLayers,
  FiPlus,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface QuizTypeSelectionProps {
  fileName: string;
  fileSize: number;
  onClose: () => void;
  onSelect: (type: "quick" | "personalized") => void;
  onPersonalizedTypeSelect: (
    type: "weakTopicFocused" | "comprehensive" | "newTopicFocused",
  ) => void;
  selectedType: "quick" | "personalized";
  selectedPersonalizedType: string;
  needsDocument: boolean;
  setNeedsDocument: (value: boolean) => void;
}

export default function QuizTypeSelection({
  fileName,
  fileSize,
  onClose,
  onSelect,
  onPersonalizedTypeSelect,
  selectedType,
  selectedPersonalizedType,
  setNeedsDocument,
}: QuizTypeSelectionProps) {
  const router = useRouter();

  const handleQuizTypeSelect = (type: "quick" | "personalized") => {
    onSelect(type);

    // Belge gerektiren türler için otomatik ayarla
    if (type === "quick") {
      setNeedsDocument(true);
    }
  };

  const handlePersonalizedTypeSelect = (
    type: "weakTopicFocused" | "comprehensive" | "newTopicFocused",
  ) => {
    onPersonalizedTypeSelect(type);

    // Belge gerektiren türler
    if (type === "comprehensive" || type === "newTopicFocused") {
      setNeedsDocument(true);
    } else {
      setNeedsDocument(false);
    }
  };

  const handleContinue = () => {
    if (!selectedType) return;

    // Sınav oluşturma sayfasına yönlendir
    router.push(
      `/exams/create?type=${selectedType}&fileName=${encodeURIComponent(fileName)}`,
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Sınav Türü Seçimi
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Yüklenen dosya: <span className="font-medium">{fileName}</span> (
            {(fileSize / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiInfo className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  PRD&apos;ye göre, Hızlı Sınav belge içeriği hakkında genel bir
                  değerlendirme sunar ve öğrenme hedeflerinizi etkilemez.
                  Kişiselleştirilmiş Sınav ise, seçilen ders kapsamında öğrenme
                  hedeflerinizi günceller.
                </p>
              </div>
            </div>
          </div>

          {/* Ana Sınav Türleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Hızlı Sınav */}
            <motion.div
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                selectedType === "quick"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
              }`}
              onClick={() => handleQuizTypeSelect("quick")}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-4">
                  <FiZap className="text-2xl text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  Hızlı Sınav
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Belgeye dayalı hızlı bir değerlendirme. Diğer sınavlardan
                bağımsızdır ve öğrenme hedeflerinizi etkilemez.
              </p>

              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-2 mt-0.5">
                    <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Hızlı hazırlanır
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-2 mt-0.5">
                    <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Belge yükleme zorunludur
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-2 mt-0.5">
                    <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Öğrenme hedeflerinizi etkilemez
                  </span>
                </li>
              </ul>

              <div className="text-right">
                <span
                  className={`text-sm font-medium ${selectedType === "quick" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {selectedType === "quick" ? "Seçildi" : "Seç"}
                </span>
              </div>
            </motion.div>

            {/* Kişiselleştirilmiş Sınav */}
            <motion.div
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                selectedType === "personalized"
                  ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
              }`}
              onClick={() => handleQuizTypeSelect("personalized")}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                  <FiTarget className="text-2xl text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  Kişiselleştirilmiş Sınav
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Seçilen bir ders kapsamında, öğrenme hedeflerinizi takip eden ve
                güncelleyen kişiselleştirilmiş sınav.
              </p>

              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2 mt-0.5">
                    <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    4 seviyeli hedef durumu takibi
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2 mt-0.5">
                    <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Öğrenme hedeflerinizi günceller
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2 mt-0.5">
                    <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Ders seçimi gerektirir
                  </span>
                </li>
              </ul>

              <div className="text-right">
                <span
                  className={`text-sm font-medium ${selectedType === "personalized" ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {selectedType === "personalized" ? "Seçildi" : "Seç"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Kişiselleştirilmiş Sınav Türleri */}
          {selectedType === "personalized" && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                Kişiselleştirilmiş Sınav Türü
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Geliştirilmesi Gereken Konu Odaklı Sınav */}
                <motion.div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPersonalizedType === "weakTopicFocused"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                  }`}
                  onClick={() =>
                    handlePersonalizedTypeSelect("weakTopicFocused")
                  }
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col items-center mb-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3">
                      <FiTarget className="text-xl text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">
                      Geliştirilmesi Gereken Konular
                    </h4>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Başarısız veya orta seviyedeki konulara odaklanır. Belge
                      gerekmez.
                    </p>

                    <div className="mt-3 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 py-1 px-2 rounded-full">
                      Belge gerekmez
                    </div>
                  </div>
                </motion.div>

                {/* Kapsamlı Sınav */}
                <motion.div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPersonalizedType === "comprehensive"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                  }`}
                  onClick={() => handlePersonalizedTypeSelect("comprehensive")}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col items-center mb-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3">
                      <FiLayers className="text-xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">
                      Kapsamlı Sınav
                    </h4>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Yeni belge içeriği ve mevcut hedefleri birlikte
                      değerlendirir.
                    </p>

                    <div className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 py-1 px-2 rounded-full">
                      Belge zorunlu
                    </div>
                  </div>
                </motion.div>

                {/* Yeni Konu Odaklı Sınav */}
                <motion.div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPersonalizedType === "newTopicFocused"
                      ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                  }`}
                  onClick={() =>
                    handlePersonalizedTypeSelect("newTopicFocused")
                  }
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col items-center mb-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-3">
                      <FiPlus className="text-xl text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">
                      Yeni Konu Odaklı
                    </h4>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Sadece belgeden tespit edilen yeni konuları değerlendirir.
                    </p>

                    <div className="mt-3 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 py-1 px-2 rounded-full">
                      Belge zorunlu
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            İptal
          </button>

          <button
            className={`px-4 py-2 rounded-md text-white flex items-center ${
              selectedType &&
              (selectedType !== "personalized" || selectedPersonalizedType)
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleContinue}
            disabled={
              !selectedType ||
              (selectedType === "personalized" && !selectedPersonalizedType)
            }
          >
            Devam Et <FiArrowRight className="ml-2" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
