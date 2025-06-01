"use client";

import React, { useState, useEffect } from "react";
import {} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

import courseService from "@/services/course.service";
import CourseList from "@/components/ui/CourseList";
import { Course } from "@/types/course.type";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/context/ThemeProvider";

// Loglayıcıyı al (providers.tsx'te başlatıldı)

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthStore();
  const { isDarkMode } = useTheme();

  // Kursları çekmek için TanStack Query kullanımı
  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses", user?.id],
    queryFn: async () => {
      try {
        const result = await courseService.getCourses();
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user, // Kullanıcı varsa aktifleştir
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  // Arama sonuçlarını logla
  useEffect(() => {
    if (searchTerm && courses.length > 0) {
    }
  }, [searchTerm, courses]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Hata mesajını oluştur
  const errorMessage = error
    ? "Dersler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
    : null;

  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900/20' : 'bg-gradient-to-br from-white to-blue-100/50'} p-4 sm:p-6 lg:p-8 transition-colors duration-300`}>
        {/* Decorative elements for visual interest */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-600/20 dark:to-indigo-600/20 -z-10 overflow-hidden">
          <div className={`absolute -top-24 -right-24 w-64 h-64 ${isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-400/10'} rounded-full blur-3xl`}></div>
          <div className={`absolute top-12 left-1/4 w-72 h-72 ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-400/10'} rounded-full blur-3xl`}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <CourseList
            courses={courses as Course[]}
            loading={isLoading}
            error={errorMessage}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
