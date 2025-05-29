"use client";

import React, { useState, useEffect } from "react";
import {} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

import courseService from "@/services/course.service";
import CourseList from "@/components/ui/CourseList";
import { Course } from "@/types/course.type";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";

// Loglayıcıyı al (providers.tsx'te başlatıldı)

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthStore();

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
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
