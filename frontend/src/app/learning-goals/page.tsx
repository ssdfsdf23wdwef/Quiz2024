"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiFilter, FiRefreshCw } from "react-icons/fi";
import LearningProgress from "@/components/ui/LearningProgress";
import { ThemeProvider } from "../../context/ThemeProvider";
import courseService from "../../services/course.service";
import { useLearningTargets } from "../../hooks/useLearningTargetQuery";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth.store";

export default function LearningGoalsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<string | "all">(
    "all",
  );

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Kursları backend'den çek
  const {
    data: coursesRaw = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseService.getCourses(),
    enabled: !!user,
  });
  const courses = coursesRaw as Array<{
    id: string;
    name?: string;
    title?: string;
  }>;

  // Seçili kursun öğrenme hedeflerini çek
  const {
    data: learningTargets = [],
    isLoading: targetsLoading,
    refetch: refetchTargets,
  } = useLearningTargets(
    selectedCourseId !== "all" ? selectedCourseId : courses[0]?.id || undefined,
  );

  // LearningProgress için weakTopics ve strongTopics'i hazırla
  const getTopicsForProgress = () => {
    interface WeakTopic {
      failCount: number;
      successCount: number;
      lastAttempt: string;
      status: string;
      subTopicId: string;
    }

    const weakTopics: Record<string, WeakTopic> = {};
    const strongTopics: string[] = [];
    if (!learningTargets || learningTargets.length === 0)
      return { weakTopics, strongTopics };
    learningTargets.forEach((target) => {
      if (target.status === "mastered") {
        strongTopics.push(target.subTopicName);
      } else {
        weakTopics[target.subTopicName] = {
          failCount: target.failCount ?? 0,
          successCount: target.successCount ?? 0,
          lastAttempt: target.lastAttempt ?? "",
          status: "active",
          subTopicId: target.id,
        };
      }
    });
    return { weakTopics, strongTopics };
  };

  const { weakTopics, strongTopics } = getTopicsForProgress();

  const loading = coursesLoading || targetsLoading;

  // Kullanıcı giriş yapmamışsa yükleniyor göster
  if (!user) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Öğrenme Hedefleri
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="all">Tüm Dersler</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name || course.title}
                </option>
              ))}
            </select>
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => {
              refetchCourses();
              refetchTargets();
            }}
          >
            <FiRefreshCw className="mr-1" /> Yenile
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <LearningProgress weakTopics={weakTopics} strongTopics={strongTopics} />
      )}
    </ThemeProvider>
  );
}
