import React from "react";
import { Card } from "@/components/ui/Card";
import type { Course } from "@/types/course";

interface CourseCardProps {
  course: Pick<Course, "id" | "name">; // Only need id and name
  className?: string;
  onDetail?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  className = "",
  onDetail,
}) => {
  const { id, name } = course;

  const handleDetail = () => {
    if (onDetail) onDetail(id);
  };

  return (
    <Card
      className={`${className} bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden cursor-pointer h-full`}
      variant="outline"
      hover={false} // Manual hover effect via className if needed, or rely on Card's internal
      onClick={handleDetail} // Make the whole card clickable for detail view
    >
      <div className="p-4 flex flex-col justify-center items-center text-center h-full">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {name}
        </h3>
      </div>
    </Card>
  );
};

export default CourseCard;
