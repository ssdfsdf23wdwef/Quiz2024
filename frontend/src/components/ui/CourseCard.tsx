import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { Course } from "@/types/course.type";
import { FiTrash2, FiBook, FiArrowRight, FiClock } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import courseService from "@/services/course.service";
import { useTheme } from "@/context/ThemeProvider";

interface CourseCardProps {
  course: Pick<Course, "id" | "name">; // Only need id and name
  className?: string;
  onDetail?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  className = "",
  onDetail,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { isDarkMode } = useTheme();
  const { id, name } = course;

  const handleDetail = () => {
    if (onDetail) onDetail(id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (isDeleting) return; // Prevent multiple clicks

    if (window.confirm(`"${name}" dersini silmek istediğinize emin misiniz?`)) {
      try {
        setIsDeleting(true);
        await courseService.deleteCourse(id);
        // Invalidate courses query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        if (onDelete) onDelete(id);
      } catch (error) {
        console.error("Ders silinirken bir hata oluştu:", error);
        alert("Ders silinirken bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card
      className={`${className} cursor-pointer h-full relative group overflow-hidden max-w-xs mx-auto transition-all duration-300 ${!isDarkMode ? 'bg-white !border-gray-200/70' : ''}`}
      variant={isDarkMode ? "glass" : "default"}
      hover="glow"
      padding="md"
      onClick={handleDetail}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 dark:from-primary-500/10 dark:to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
      
      {/* Top color accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 dark:from-primary-400 dark:to-secondary-400 w-full absolute top-0 left-0 rounded-t-xl transition-colors duration-300"></div>
      
      <div className="flex items-center mb-3">
        {/* Course icon - smaller and to the left */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/30 shadow-sm transition-all duration-300 relative overflow-hidden mr-3 group-hover:shadow-md group-hover:border-primary-200 dark:group-hover:border-primary-700/50">
          <FiBook className="text-lg text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
        
        {/* Course title - moved next to icon */}
        <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-2">
          {name}
        </h3>
        
        {/* Delete button - repositioned and smaller */}
        <button
          onClick={handleDelete}
          className="ml-auto p-1.5 rounded-full bg-white/80 dark:bg-neutral-800/80 text-error-500 dark:text-error-400 hover:bg-error-500 hover:text-white dark:hover:bg-error-500 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md border border-error-100 dark:border-error-800 scale-90 hover:scale-100 focus:outline-none focus:ring-2 focus:ring-error-300 dark:focus:ring-error-700 focus:ring-opacity-50"
          title="Dersi Sil"
          aria-label="Dersi Sil"
          disabled={isDeleting}
        >
          <FiTrash2 className={`text-sm ${isDeleting ? 'animate-pulse' : ''}`} />
        </button>
      </div>
      
      {/* Last updated info - more compact */}
      <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400 bg-blue-900/10 border-blue-800/20 group-hover:border-blue-700/30' : 'text-gray-500 bg-blue-50/50 border-blue-100/50 group-hover:border-blue-200/70'} mb-3 px-2 py-1 rounded-md border transition-colors duration-300`}>
        <FiClock className={`mr-1.5 ${isDarkMode ? 'text-blue-400/70' : 'text-blue-500/70'} transition-colors duration-300`} />
        <span>Son güncelleme: 2 gün önce</span>
      </div>
      
      {/* View details button - more compact */}
      <button 
        className={`w-full py-1.5 px-3 ${isDarkMode ? 'bg-gray-800/80 text-blue-400 border-blue-800/50 group-hover:bg-blue-600 focus:ring-blue-700' : 'bg-white text-blue-600 border-blue-100 group-hover:bg-blue-600 focus:ring-blue-300'} text-sm font-medium rounded-lg flex items-center justify-center group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md border group-hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
        onClick={handleDetail}
        aria-label="Ders detaylarını görüntüle"
      >
        Detaylar
        <FiArrowRight className="ml-1.5 group-hover:translate-x-1 transition-transform duration-300" />
      </button>
    </Card>
  );
};

export default CourseCard;
