"use client";

import React, { useState } from "react";
import {} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

import courseService from "@/services/course.service";
import CourseList from "@/components/CourseList";
import { Course } from "@/types/course";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";

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
    queryFn: () => courseService.getCourses(),
    enabled: !!user, // Kullanıcı varsa aktifleştir
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Hata mesajını oluştur
  const errorMessage = error
    ? "Dersler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
    : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
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
