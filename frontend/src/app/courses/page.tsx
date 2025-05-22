"use client";

import React, { useState, useEffect } from "react";
import {} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

import courseService from "@/services/course.service";
import CourseList from "@/components/ui/CourseList";
import { Course } from "@/types/course.type";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { getLogger, startFlow } from "@/lib/logger.utils";
import { FlowCategory } from "@/constants/logging.constants";

// Loglayıcıyı al (providers.tsx'te başlatıldı)
const logger = getLogger();

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthStore();

  // Sayfa yüklendiğinde flow başlat
  useEffect(() => {
    const pageFlow = startFlow(FlowCategory.Navigation, 'CoursesPageLoad');
    pageFlow.trackStep('Kurslar sayfası yükleniyor');
    
    return () => {
      pageFlow.end('Kurslar sayfasından çıkıldı');
    };
  }, []);

  // Kursları çekmek için TanStack Query kullanımı
  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses", user?.id],
    queryFn: async () => {
      logger.info('Kurslar getiriliyor', 'CoursesPage');
      try {
        const result = await courseService.getCourses();
        logger.info(`${result.length} kurs başarıyla getirildi`, 'CoursesPage');
        return result;
      } catch (err) {
        logger.error(`Kurslar getirilirken hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'CoursesPage', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    enabled: !!user, // Kullanıcı varsa aktifleştir
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  // Arama sonuçlarını logla
  useEffect(() => {
    if (searchTerm && courses.length > 0) {
      const filteredCount = courses.filter(
        (course) => course.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).length;
      
      logger.info(`Arama yapıldı: "${searchTerm}" - ${filteredCount} sonuç bulundu`, 'CoursesPage.Search');
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
