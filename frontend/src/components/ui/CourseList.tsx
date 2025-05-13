import React from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiBook, FiAlertCircle } from "react-icons/fi";
import CourseCard from "@/components/ui/CourseCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Course } from "@/types/course";

// Türler için daha genel yaklaşım
interface CourseListProps {
  courses: Course[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const CourseList: React.FC<CourseListProps> = ({
  courses,
  loading,
  error,
  searchTerm,
  onSearchChange,
}) => {
  const filteredCourses = courses.filter(
    (course) =>
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 relative">
          <div className="w-full h-full border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FiBook className="text-lg text-indigo-500 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Dersler yükleniyor...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
          <FiAlertCircle className="text-3xl text-rose-500" />
        </div>
        <div className="text-lg text-rose-600 dark:text-rose-400">{error}</div>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <>
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
              Derslerim
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tüm derslerinizi yönetin, ilerlemenizi takip edin ve sınavlar
              oluşturun.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Ders ara..."
                className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <Link
              href="/courses/create"
              className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-xl"
            >
              <FiPlus className="mr-2" />
              Yeni Ders
            </Link>
          </div>
        </div>

        {searchTerm ? (
          <EmptyState
            title="Arama sonucu bulunamadı"
            description={`"${searchTerm}" araması için sonuç bulunamadı.`}
            actionText="Tüm Dersleri Görüntüle"
            actionLink="/courses"
            imageSrc="/images/empty-search.svg"
          />
        ) : (
          <EmptyState
            title="Henüz hiç ders eklemediniz"
            description="Kişiselleştirilmiş sınavlar oluşturmak ve ilerlemenizi takip etmek için ilk dersinizi ekleyin."
            actionText="İlk Dersi Ekle"
            actionLink="/courses/create"
            imageSrc="/images/empty-state.svg"
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Derslerim
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tüm derslerinizi yönetin, ilerlemenizi takip edin ve sınavlar
            oluşturun.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Ders ara..."
              className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <Link
            href="/courses/create"
            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            <FiPlus className="mr-2" />
            Yeni Ders
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </>
  );
};

export default CourseList;
