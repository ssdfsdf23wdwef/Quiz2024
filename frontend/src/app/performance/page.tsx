"use client";

import { useState } from "react";
import {
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiFile,
  FiDownload,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import courseService from "../../services/course.service";
import { useAuthStore } from "../../store/auth.store";

export default function PerformancePage() {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month",
  );

  // Gerçek performans/analiz verisini çek
  const {
    data: dashboard,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      // Kullanıcının ilk dersini örnek olarak al
      const courses = await courseService.getCourses();
      const firstCourseId = courses[0]?.id;
      if (!firstCourseId) return null;
      return courseService.getCourseDashboard(firstCourseId);
    },
    enabled: !!user,
  });

  // Basit performans kartı bileşeni
  const PerformanceCard = ({
    title,
    value,
    icon,
    color = "indigo",
    trend = 0,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: "indigo" | "green" | "amber" | "red";
    trend?: number;
  }) => {
    // Renk ayarları
    const colorClasses = {
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        iconBg: "bg-indigo-100",
        iconText: "text-indigo-600",
      },
      green: {
        bg: "bg-green-50",
        text: "text-green-600",
        iconBg: "bg-green-100",
        iconText: "text-green-600",
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
      },
      red: {
        bg: "bg-red-50",
        text: "text-red-600",
        iconBg: "bg-red-100",
        iconText: "text-red-600",
      },
    };

    const colors = colorClasses[color];

    return (
      <motion.div
        className={`p-6 rounded-lg shadow-sm ${colors.bg}`}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm mb-1">{title}</p>
            <h3 className={`text-2xl font-bold ${colors.text}`}>{value}</h3>

            {trend !== 0 && (
              <div
                className={`flex items-center mt-2 ${trend > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {trend > 0 ? "↑" : "↓"}
                <span className="text-xs ml-1">
                  {Math.abs(trend)}% son 30 günde
                </span>
              </div>
            )}
          </div>

          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.iconBg} ${colors.iconText}`}
          >
            {icon}
          </div>
        </div>
      </motion.div>
    );
  };

  // Basit analiz kartı
  const AnalysisCard = ({
    title,
    children,
    action,
  }: {
    title: string;
    children: React.ReactNode;
    action?: { label: string; icon: React.ReactNode; onClick: () => void };
  }) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

          {action && (
            <button
              onClick={action.onClick}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </button>
          )}
        </div>

        {children}
      </div>
    );
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Zamanı seçme işlevi
  const handleTimeRangeChange = (range: "week" | "month" | "year") => {
    setTimeRange(range);
  };

  // Kolay/Orta/Zor sorular için son 5 sınavdan difficulty performansını hesapla
  const getDifficultyPerformance = () => {
    if (!dashboard) return { easy: 0, medium: 0, hard: 0 };
    const lastQuizzes = (dashboard.recentQuizzes as RecentQuiz[]).slice(0, 5);
    const difficultyTotals: Record<
      "easy" | "medium" | "hard",
      { score: number; count: number }
    > = {
      easy: { score: 0, count: 0 },
      medium: { score: 0, count: 0 },
      hard: { score: 0, count: 0 },
    };
    lastQuizzes.forEach(
      (
        quiz: RecentQuiz & {
          analysisResult?: {
            performanceByDifficulty?: Record<
              "easy" | "medium" | "hard",
              { score: number }
            >;
          };
        },
      ) => {
        const analysis = quiz.analysisResult;
        if (analysis && analysis.performanceByDifficulty) {
          (
            Object.entries(analysis.performanceByDifficulty) as [
              "easy" | "medium" | "hard",
              { score: number },
            ][]
          ).forEach(([diff, val]) => {
            if (difficultyTotals[diff]) {
              difficultyTotals[diff].score += val.score;
              difficultyTotals[diff].count += 1;
            }
          });
        }
      },
    );
    return {
      easy: difficultyTotals.easy.count
        ? Math.round(difficultyTotals.easy.score / difficultyTotals.easy.count)
        : 0,
      medium: difficultyTotals.medium.count
        ? Math.round(
            difficultyTotals.medium.score / difficultyTotals.medium.count,
          )
        : 0,
      hard: difficultyTotals.hard.count
        ? Math.round(difficultyTotals.hard.score / difficultyTotals.hard.count)
        : 0,
    };
  };
  const difficultyPerformance = getDifficultyPerformance();

  // Haftalık ilerleme için son 7 sınavı günlere dağıt
  const getWeeklyProgress = () => {
    if (!dashboard) return [];
    const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const last7 = dashboard.recentQuizzes.slice(0, 7);
    return days.map((day, i) => ({
      day,
      score: last7[i]?.score ?? 0,
    }));
  };
  const weeklyProgress = getWeeklyProgress();

  // Son Sınavlar tablosunda quiz objesini tipli kullan
  type RecentQuiz = {
    id: string;
    quizType: string;
    timestamp: string;
    score: number;
    totalQuestions: number;
    elapsedTime?: number;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Yükleniyor...</div>
    );
  }
  if (isError || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Veri yüklenemedi.
      </div>
    );
  }

  // dashboard.stats, dashboard.learningTargets, dashboard.recentQuizzes, dashboard.stats.averageScore gibi alanlar kullanılabilir

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Performans Analizi
        </h1>
        <p className="text-gray-600">
          Öğrenme performansınızı ve gelişiminizi analiz edin.
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-500" />
          <span className="text-gray-600">Zaman Aralığı:</span>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${timeRange === "week" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => handleTimeRangeChange("week")}
            >
              Hafta
            </button>
            <button
              className={`px-3 py-1 text-sm ${timeRange === "month" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => handleTimeRangeChange("month")}
            >
              Ay
            </button>
            <button
              className={`px-3 py-1 text-sm ${timeRange === "year" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => handleTimeRangeChange("year")}
            >
              Yıl
            </button>
          </div>
        </div>

        <button className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100">
          <FiDownload className="mr-2" />
          Rapor İndir
        </button>
      </div>

      {/* Üst Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PerformanceCard
          title="Genel Skor"
          value={`${dashboard.stats.averageScore}%`}
          icon={<FiBarChart2 className="w-6 h-6" />}
          color="indigo"
          trend={5}
        />

        <PerformanceCard
          title="Kolay Sorular"
          value={`${difficultyPerformance.easy}%`}
          icon={<FiTrendingUp className="w-6 h-6" />}
          color="green"
          trend={2}
        />

        <PerformanceCard
          title="Orta Sorular"
          value={`${difficultyPerformance.medium}%`}
          icon={<FiPieChart className="w-6 h-6" />}
          color="amber"
          trend={-3}
        />

        <PerformanceCard
          title="Zor Sorular"
          value={`${difficultyPerformance.hard}%`}
          icon={<FiTrendingUp className="w-6 h-6" />}
          color="red"
          trend={8}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Haftalık İlerleme */}
        <div className="lg:col-span-2">
          <AnalysisCard
            title="Haftalık İlerleme"
            action={{
              label: "Detaylar",
              icon: <FiBarChart2 className="w-4 h-4" />,
              onClick: () => console.log("Detaylar tıklandı"),
            }}
          >
            <div className="h-64 flex items-end">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-48 flex items-end justify-center px-1">
                    <motion.div
                      className="w-full bg-indigo-500 rounded-t-md"
                      style={{ height: `${day.score}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${day.score}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-2">{day.day}</div>
                </div>
              ))}
            </div>
          </AnalysisCard>
        </div>
      </div>

      {/* Son Sınavlar */}
      <AnalysisCard
        title="Son Sınavlar"
        action={{
          label: "Tümünü Gör",
          icon: <FiFile className="w-4 h-4" />,
          onClick: () => console.log("Tümünü gör tıklandı"),
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Sınav Tarihi</th>
                <th className="px-6 py-3">Tür</th>
                <th className="px-6 py-3">Puan</th>
                <th className="px-6 py-3">Süre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(dashboard?.recentQuizzes as RecentQuiz[]).map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quiz.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        quiz.quizType === "quick"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {quiz.quizType === "quick"
                        ? "Hızlı Sınav"
                        : "Kişiselleştirilmiş Sınav"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quiz.score}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof quiz.elapsedTime === "number"
                      ? `${Math.round(quiz.elapsedTime / 60)} dk`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalysisCard>
    </>
  );
}
