import React, { useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiBook, FiAlertCircle, FiBookOpen, FiGrid, FiList, FiClock, FiArrowRight, FiTrash2 } from "react-icons/fi";
import CourseCard from "@/components/ui/CourseCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Course } from "@/types/course.type";
import { useQueryClient } from "@tanstack/react-query";
import courseService from "@/services/course.service";

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
  const [deletedCourseIds, setDeletedCourseIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const queryClient = useQueryClient();
  // Filter courses by search term and exclude deleted courses
  const filteredCourses = courses
    .filter(course => !deletedCourseIds.includes(course.id))
    .filter(course => course.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // In a real implementation, this would sort by updatedAt date
        // For now, we'll just use the id as a proxy for recency
        return b.id.localeCompare(a.id);
      }
    });

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

  // Handle course detail navigation using standard browser navigation
  const handleCourseDetail = (courseId: string) => {
    window.location.href = `/courses/${courseId}`;
  };

  // Common header section for both empty and non-empty states
  const renderHeader = () => (
    <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
      <div className="md:flex-grow">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-3 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
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
          className="flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg font-semibold text-base transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:from-blue-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transform hover:scale-105"
        >
          <FiPlus className="mr-2 h-5 w-5" />
          Yeni Ders
        </Link>
      </div>
    </div>
  );
  
  // Render controls for view mode and sorting
  const renderControls = () => {
    if (filteredCourses.length === 0) return null;
    
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Toplam {filteredCourses.length} ders</span>
        </div>
        
        <div className="flex space-x-4">
          {/* Sort controls */}
          <div className="flex items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Sırala:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
              className="text-sm border rounded-md py-1 px-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">İsme Göre</option>
              <option value="recent">Son Güncellenen</option>
            </select>
          </div>
          
          {/* View mode controls */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title="Izgara Görünümü"
            >
              <FiGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title="Liste Görünümü"
            >
              <FiList size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };


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
      {renderControls()}
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course}
              onDetail={handleCourseDetail}
              onDelete={(courseId) => {
                // Add the deleted course ID to the state
                setDeletedCourseIds(prev => [...prev, courseId]);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div 
              key={course.id}
              className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden cursor-pointer group relative"
              onClick={() => window.location.href = `/courses/${course.id}`}
            >
              {/* Left accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400"></div>
              
              <div className="flex items-center p-4 pl-6">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FiBook className="text-xl text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{course.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <FiClock className="mr-1" />
                    <span>Son güncelleme: 2 gün önce</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseDetail(course.id);
                    }}
                    className="mr-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <FiArrowRight size={20} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`"${course.name}" dersini silmek istediğinize emin misiniz?`)) {
                        courseService.deleteCourse(course.id).then(() => {
                          setDeletedCourseIds(prev => [...prev, course.id]);
                          queryClient.invalidateQueries({ queryKey: ["courses"] });
                        }).catch((error: any) => {
                          console.error("Ders silinirken bir hata oluştu:", error);
                          alert("Ders silinirken bir hata oluştu. Lütfen tekrar deneyin.");
                        });
                      }
                    }}
                    className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CourseList;
