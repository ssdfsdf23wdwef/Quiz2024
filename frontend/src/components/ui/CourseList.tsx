import React from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiBook, FiAlertCircle, FiBookOpen } from "react-icons/fi";
import CourseCard from "@/components/ui/CourseCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Course } from "@/types/course.type";

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
          <div className="w-full h-full border-4 border-sky-200 dark:border-sky-700 border-t-sky-500 dark:border-t-sky-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FiBook className="text-lg text-sky-500 dark:text-sky-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Dersler yükleniyor...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
          <FiAlertCircle className="text-3xl text-rose-500 dark:text-rose-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Bir Sorun Oluştu</h2>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">{error}</p>
      </div>
    );
  }

  // Common header section for both empty and non-empty states
  const renderHeader = () => (
    <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
      <div className="md:flex-grow">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-3">
          Derslerim
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Tüm derslerinizi yönetin, ilerlemenizi takip edin ve sınavlar oluşturun.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="relative flex-grow sm:flex-grow-0">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl" />
          <input
            type="text"
            placeholder="Ders ara..."
            className="w-full pl-12 pr-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-300 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 border-slate-300 dark:border-slate-600"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Link
          href="/courses/create"
          className="flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg font-semibold text-base transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transform hover:scale-105"
        >
          <FiPlus className="mr-2 h-5 w-5" />
          Yeni Ders
        </Link>
      </div>
    </div>
  );


  if (filteredCourses.length === 0) {
    return (
      <>
        {renderHeader()}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 sm:p-8 md:p-10 mt-8">
          {searchTerm ? (
            <EmptyState
              title="Arama Sonucu Bulunamadı"
              description={`"${searchTerm}" ile eşleşen bir ders bulunamadı. Farklı bir anahtar kelime deneyin veya arama terimini temizleyin.`}
              actionText="Aramayı Temizle"
              onActionClick={() => onSearchChange("")} // Clear search
              icon={<FiSearch className="text-sky-500 text-5xl" />}
            />
          ) : (
            <EmptyState
              title="Henüz Dersiniz Yok"
              description="Görünüşe göre henüz bir ders oluşturmadınız. Hemen başlayın ve öğrenme yolculuğunuzu kişiselleştirin!"
              actionText="İlk Dersini Oluştur"
              actionLink="/courses/create"
              icon={<FiBookOpen className="text-sky-500 text-5xl" />} 
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {renderHeader()}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </>
  );
};

export default CourseList;
