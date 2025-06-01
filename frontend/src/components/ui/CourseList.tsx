import React, { useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiBook, FiAlertCircle, FiBookOpen, FiGrid, FiList, FiClock, FiArrowRight, FiTrash2 } from "react-icons/fi";
import CourseCard from "@/components/ui/CourseCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Course } from "@/types/course.type";
import { useQueryClient } from "@tanstack/react-query";
import courseService from "@/services/course.service";
import { useTheme } from "@/context/ThemeProvider";

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
  const { isDarkMode } = useTheme();
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
        <div className="w-20 h-20 relative">
          {/* Outer spinning ring with gradient */}
          <div className="w-full h-full border-4 border-gray-100 dark:border-gray-800/30 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
          
          {/* Inner spinning ring (opposite direction) */}
          <div className="absolute inset-2 border-4 border-gray-100 dark:border-gray-800/30 border-b-indigo-500 dark:border-b-indigo-400 rounded-full animate-spin-slow-reverse"></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <FiBook className="text-2xl text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        </div>
        
        <div className="mt-6 flex flex-col items-center">
          <p className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-1">
            Dersler yükleniyor
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lütfen bekleyin...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          {/* Error background glow effect */}
          <div className="absolute -inset-4 bg-rose-500/10 dark:bg-rose-400/10 rounded-full blur-xl"></div>
          
          {/* Error icon with animated pulse */}
          <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 border-2 border-rose-200 dark:border-rose-700 flex items-center justify-center mb-4 shadow-md shadow-rose-500/10 dark:shadow-rose-400/10 relative z-10">
            <FiAlertCircle className="text-4xl text-rose-500 dark:text-rose-400 animate-pulse-slow" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mt-6 mb-2">Bir Sorun Oluştu</h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">{error}</p>
        
        {/* Retry button */}
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/20 dark:shadow-blue-500/10 transition-all duration-200 font-medium"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  // Handle course detail navigation using standard browser navigation
  const handleCourseDetail = (courseId: string) => {
    window.location.href = `/courses/${courseId}`;
  };

  // Common header section for both empty and non-empty states
  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="md:flex-grow">
        <h1 className={`text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent transition-colors duration-300`}>
          Derslerim
        </h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm transition-colors duration-300`}>
          Tüm derslerinizi yönetin, ilerlemenizi takip edin ve sınavlar oluşturun.
        </p>
      </div>
      <div className="flex flex-row items-center gap-2 w-full md:w-auto">
        <div className="relative flex-grow md:flex-grow-0">
          <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-blue-300' : 'text-blue-400'} text-lg transition-colors duration-300`} />
          <input
            type="text"
            placeholder="Ders ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full md:w-56 pl-9 pr-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800/90 border-gray-800/30 text-gray-200 hover:border-blue-600 focus:ring-blue-400' : 'bg-white/80 border-gray-200/70 text-gray-700 hover:border-blue-300 focus:ring-blue-500'} backdrop-blur-md border focus:outline-none focus:ring-1 shadow-sm text-sm transition-all duration-300`}
          />
        </div>
        <Link
          href="/courses/create"
          className={`flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:ring-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-300'} text-white font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap text-sm focus:ring-2 focus:ring-opacity-50 outline-none`}
        >
          <FiPlus className="text-base transition-transform duration-300 group-hover:scale-110" />
          <span>Yeni Ders</span>
        </Link>
      </div>
    </div>
  );
  
  // Render controls for view mode and sorting
  const renderControls = () => {
    if (filteredCourses.length === 0) return null;
    
    return (
      <div className={`mb-4 flex flex-wrap items-center justify-between ${isDarkMode ? 'bg-gray-800/90 border-gray-800/30' : 'bg-white/80 border-gray-200/70'} backdrop-blur-md p-2 rounded-lg shadow-sm border transition-colors duration-300`}>
        <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} px-2 transition-colors duration-300`}>
          <span className="font-medium">Toplam {filteredCourses.length} ders</span>
        </div>
        
        <div className="flex space-x-2">
          {/* Sort controls */}
          <div className="flex items-center">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-1.5 transition-colors duration-300`}>
              Sırala:
            </span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
              className={`text-xs border rounded-md py-1 px-2 ${isDarkMode ? 'bg-gray-700/90 text-gray-200 border-gray-600 hover:border-blue-600 focus:ring-blue-400' : 'bg-white/90 text-gray-700 border-gray-200 hover:border-blue-300 focus:ring-blue-500'} focus:outline-none focus:ring-1 transition-all duration-300`}
            >
              <option value="name">İsme Göre</option>
              <option value="recent">Son Güncellenen</option>
            </select>
          </div>
          
          {/* View mode controls */}
          <div className={`flex items-center ${isDarkMode ? 'bg-gray-700/40' : 'bg-gray-100/80'} rounded-md p-0.5 transition-colors duration-300`}>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all duration-300 ${viewMode === 'grid' 
                ? `${isDarkMode ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600'} shadow-sm` 
                : `${isDarkMode ? 'text-gray-400 hover:bg-gray-600/80 hover:text-blue-300' : 'text-gray-500 hover:bg-white/80 hover:text-blue-500'}`}`}
              title="Izgara Görünümü"
              aria-label="Izgara Görünümü"
            >
              <FiGrid size={14} className="transition-transform duration-300 hover:scale-110" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all duration-300 ${viewMode === 'list' 
                ? `${isDarkMode ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600'} shadow-sm` 
                : `${isDarkMode ? 'text-gray-400 hover:bg-gray-600/80 hover:text-blue-300' : 'text-gray-500 hover:bg-white/80 hover:text-blue-500'}`}`}
              title="Liste Görünümü"
              aria-label="Liste Görünümü"
            >
              <FiList size={14} className="transition-transform duration-300 hover:scale-110" />
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
              className={`${isDarkMode ? 'bg-gray-800/90 border-gray-800/30' : 'bg-white border-gray-200/70'} backdrop-blur-md shadow-sm hover:shadow-md border transition-all duration-300 rounded-xl overflow-hidden cursor-pointer group relative`}
              onClick={() => window.location.href = `/courses/${course.id}`}
            >
              {/* Left accent with improved gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-l transition-colors duration-300"></div>
              
              {/* Hover effect background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-blue-900/10 to-transparent' : 'from-blue-50 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="flex items-center p-3 pl-6 relative">
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-gray-800/20 border-gray-700/30 group-hover:border-blue-700/50 group-hover:shadow-blue-500/10' : 'bg-gray-50 border-gray-100 group-hover:border-blue-200 group-hover:shadow-blue-300/10'} border flex items-center justify-center transition-all duration-300 group-hover:shadow-md`}>
                    <FiBook className={`text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'} transition-colors duration-300`}>{course.name}</h3>
                  <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    <FiClock className={`mr-1.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} transition-colors duration-300`} />
                    <span>Son güncelleme: 2 gün önce</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseDetail(course.id);
                    }}
                    className={`mr-2 p-1.5 rounded-full ${isDarkMode ? 'text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 focus:ring-blue-700' : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-blue-300'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    aria-label="Dersi görüntüle"
                  >
                    <FiArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
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
                    className={`p-1.5 rounded-full ${isDarkMode ? 'text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 focus:ring-rose-700' : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600 focus:ring-rose-300'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    aria-label="Dersi sil"
                  >
                    <FiTrash2 size={16} className="transition-transform duration-300 hover:scale-110" />
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
