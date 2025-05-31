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
      className={`${className} cursor-pointer h-full relative group`}
      variant="glass"
      hover="glow"
      padding="lg"
      onClick={handleDetail}
    >
      {/* Top color accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary w-full absolute top-0 left-0 rounded-t-xl"></div>
      
      {/* Course icon */}
      <div className="mt-5 mb-4 flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center border border-brand-primary/20 shadow-sm group-hover:shadow-brand-primary/15 transition-all duration-300">
          <FiBook className="text-2xl text-brand-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>
      
      {/* Course content */}
      <div className="px-2 pb-3 pt-1 flex flex-col items-center">
        <h3 className="text-xl font-semibold text-primary text-center mb-3 group-hover:text-brand-primary transition-colors duration-300">
          {name}
        </h3>
        
        {/* Placeholder stats - these would be real in a full implementation */}
        <div className="flex items-center text-sm text-tertiary mb-5 px-2 py-1 bg-brand-primary/5 rounded-full">
          <FiClock className="mr-2 text-brand-secondary" />
          <span>Son güncelleme: 2 gün önce</span>
        </div>
        
        {/* View details button */}
        <div className="mt-auto w-full pt-3">
          <button 
            className="w-full py-2.5 px-4 bg-brand-primary/10 text-brand-primary font-medium rounded-xl flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md"
            onClick={handleDetail}
          >
            Detayları Görüntüle
            <FiArrowRight className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
      
      {/* Delete button - improved styling */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 p-2 rounded-full bg-state-error-bg/80 hover:bg-state-error text-state-error hover:text-white transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md border border-state-error-border scale-90 hover:scale-100"
        title="Dersi Sil"
        disabled={isDeleting}
      >
        <FiTrash2 className={`${isDeleting ? 'animate-pulse' : ''}`} />
      </button>
    </Card>
  );
};

export default CourseCard;
