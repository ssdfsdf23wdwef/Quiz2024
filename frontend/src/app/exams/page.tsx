"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFileText,
  FiCalendar,
  FiClock,
  FiFilter,
  FiDownload,
  FiEye,
} from "react-icons/fi";
import { useQuizzes } from "@/hooks/api/useQuizzes";
import type { Quiz } from "../../types/quiz.type";
import { Spinner } from "@nextui-org/react";
import { useTheme } from "@/context/ThemeProvider";

// Sınav türü için güzel etiketler
const QUIZ_TYPE_INFO = {
  quick: {
    label: "Hızlı Sınav",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  personalized: {
    label: "Kişiselleştirilmiş Sınav",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
};

// Yardımcı fonksiyonlar
const formatDate = (dateValue: string | Date) => {
  // Date'i string'e dönüştürme
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Sınav başlığı üretici yardımcı fonksiyon
const getQuizTitle = (quiz: Quiz) =>
  quiz.sourceDocument?.fileName ||
  `${QUIZ_TYPE_INFO[quiz.quizType as keyof typeof QUIZ_TYPE_INFO]?.label || "Sınav"} - ${formatDate(quiz.timestamp)}`;

// Sınav kartı bileşeni
const ExamItem = ({ quiz, index }: { quiz: Quiz; index: number }) => {
  const { isDarkMode } = useTheme();
  const quizType =
    quiz.quizType === "quick" || quiz.quizType === "personalized"
      ? quiz.quizType
      : "quick";
  const typeInfo = QUIZ_TYPE_INFO[quizType];
  // Başlık: sourceDocument varsa dosya adı, yoksa quizType ve tarih
  const title = getQuizTitle(quiz);
  // Soru sayısı: totalQuestions
  const questionsCount = quiz.totalQuestions;
  // Oluşturulma tarihi: timestamp
  const createdAt = quiz.timestamp;
  // Süre: elapsedTime (varsa), yoksa "-"
  const duration = quiz.elapsedTime ? Math.round(quiz.elapsedTime / 60) : "-";
  
  return (
    <motion.tr
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group transition-colors ${
        isDarkMode 
          ? 'hover:bg-gray-800/80' 
          : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
            isDarkMode 
              ? 'bg-blue-600/10 text-blue-400' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {questionsCount} Soru
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
            typeInfo.bgColor
          } ${typeInfo.textColor} ${typeInfo.borderColor}`}
        >
          {typeInfo.label}
        </span>
      </td>
      <td className={`px-4 py-4 whitespace-nowrap text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <div className="flex items-center">
          <FiCalendar className={`w-4 h-4 mr-1.5 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          {formatDate(createdAt)}
        </div>
      </td>
      <td className={`px-4 py-4 whitespace-nowrap text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <div className="flex items-center">
          <FiClock className={`w-4 h-4 mr-1.5 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          {duration} dk
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end space-x-2">
          <Link
            href={`/exams/${quiz.id}`}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              isDarkMode
                ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                : 'text-blue-600 bg-blue-100 hover:bg-blue-200'
            }`}
          >
            <FiEye className="w-4 h-4" />
          </Link>
          <button className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
            isDarkMode
              ? 'text-gray-400 bg-gray-700/50 hover:bg-gray-700'
              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
          }`}>
            <FiDownload className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

export default function ExamsPage() {
  const router = useRouter();
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { isDarkMode } = useTheme();

  const { data: quizzes, isLoading, error, isError } = useQuizzes();

  useEffect(() => {
    if (!quizzes) {
      setFilteredQuizzes([]);
      return;
    }

    // Array.from kullanarak array olduğundan emin oluyoruz
    let result = Array.isArray(quizzes) ? quizzes : [];

    // Arama filtresi
    if (searchTerm) {
      result = result.filter((quiz: Quiz) =>
        getQuizTitle(quiz).toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Tür filtresi
    if (selectedType !== "all") {
      result = result.filter((quiz: Quiz) => quiz.quizType === selectedType);
    }

    setFilteredQuizzes(result);
  }, [searchTerm, selectedType, quizzes]);

  const handleCreateNewExam = () => {
    router.push("/exams/create");
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        <Spinner label="Sınavlar yükleniyor..." color="primary" />
      </div>
    );
  }

  if (isError || !quizzes) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        <div className={`font-semibold text-lg ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          {error instanceof Error
            ? error.message
            : "Sınavlar yüklenirken bir hata oluştu."}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto">
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Sınavlarım
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Geçmiş sınavlarınızı görüntüleyin ve yeni sınavlar oluşturun.
          </motion.p>
        </div>

        {/* Filtreler ve arama */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Sınav ara..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 transition-all duration-300`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>

            <div className="relative">
              <select
                className={`appearance-none pl-10 pr-10 py-2.5 rounded-xl border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300`}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Tüm Sınavlar</option>
                <option value="quick">Hızlı Sınav</option>
                <option value="personalized">Kişiselleştirilmiş Sınav</option>
              </select>
              <FiFilter className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateNewExam}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-xl ${
              isDarkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'
            }`}
          >
            <FiPlus className="mr-2" />
            Yeni Sınav
          </button>
        </motion.div>

        {/* Sonuçları göster: Yükleniyor, hata veya veri tablosu */}
        {filteredQuizzes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="shadow-md rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th
                      scope="col"
                      className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Sınav
                    </th>
                    <th
                      scope="col"
                      className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Tür
                    </th>
                    <th
                      scope="col"
                      className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Tarih
                    </th>
                    <th
                      scope="col"
                      className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Süre
                    </th>
                    <th
                      scope="col"
                      className={`px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                {filteredQuizzes.map((quiz, idx) => (
                  <ExamItem key={quiz.id} quiz={quiz} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-20 flex flex-col items-center justify-center text-center"
          >
            <div className="w-32 h-32 relative mb-8">
              <div className={`absolute inset-0 rounded-3xl rotate-6 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-400 opacity-20' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-300 opacity-10'
              }`}></div>
              <div className={`absolute inset-0 rounded-3xl flex items-center justify-center border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <FiFileText className={`text-6xl bg-clip-text ${
                  isDarkMode
                    ? 'text-transparent bg-gradient-to-br from-blue-400 to-blue-300'
                    : 'text-transparent bg-gradient-to-br from-blue-600 to-blue-400'
                }`} />
              </div>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Henüz hiç sınav bulunamadı
            </h3>
            <p className={`mb-8 max-w-md ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {searchTerm || selectedType !== "all"
                ? "Filtrelerinize uygun sınav bulunamadı. Lütfen arama kriterlerinizi değiştirin."
                : "Kişiselleştirilmiş sınavlar oluşturmak için yeni sınav ekleyin."}
            </p>
            <button
              onClick={handleCreateNewExam}
              className={`inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl ${
                isDarkMode ? 'shadow-blue-500/30' : 'shadow-blue-500/40'
              }`}
            >
              <FiPlus className="mr-2" />
              İlk Sınavı Oluştur
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
