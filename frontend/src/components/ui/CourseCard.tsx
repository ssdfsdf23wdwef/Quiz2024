import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { Course } from "@/types/course.type";
import { FiTrash2, FiBook, FiArrowRight, FiClock } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import courseService from "@/services/course.service";

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
      className={`${className} bg-primary shadow-md hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden cursor-pointer h-full relative group`}
      variant="outline"
      hover={false}
      onClick={handleDetail}
    >
      {/* Top color accent bar */}
      <div className="h-2 bg-gradient-to-r from-brand-primary to-brand-secondary w-full absolute top-0 left-0"></div>
      
      {/* Course icon */}
      <div className="mt-6 mb-3 flex justify-center">
        <div className="w-16 h-16 rounded-full bg-state-info-bg flex items-center justify-center">
          <FiBook className="text-2xl text-state-info" />
        </div>
      </div>
      
      {/* Course content */}
      <div className="px-5 pb-5 pt-2 flex flex-col items-center">
        <h3 className="text-xl font-bold text-primary text-center mb-2">
          {name}
        </h3>
        
        {/* Placeholder stats - these would be real in a full implementation */}
        <div className="flex items-center text-sm text-tertiary mb-4">
          <FiClock className="mr-1" />
          <span>Son güncelleme: 2 gün önce</span>
        </div>
        
        {/* View details button */}
        <div className="mt-auto w-full pt-2">
          <button 
            className="w-full py-2 px-4 bg-transparent text-brand-primary font-medium rounded-lg flex items-center justify-center group-hover:bg-interactive-hover transition-colors duration-200"
            onClick={handleDetail}
          >
            Detayları Görüntüle
            <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
      
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 p-2 rounded-full bg-state-error-bg hover:bg-state-error-bg/80 text-state-error transition-colors duration-200 z-10 opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md border border-state-error-border"
        title="Dersi Sil"
        disabled={isDeleting}
      >
        <FiTrash2 className={`${isDeleting ? 'animate-pulse' : ''}`} />
      </button>
    </Card>
  );
};

export default CourseCard;
