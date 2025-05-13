import React, { useMemo } from "react";
import Image from "next/image";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  BookOpen,
  Users,
  Clock,
  Star,
  ChevronRight,
  Share2,
} from "lucide-react";
import type { Course } from "@/types/course";

interface CourseCardProps {
  course: Course;
  className?: string;
  onEnroll?: (courseId: string) => void;
  onShare?: (courseId: string) => void;
  onDetail?: (courseId: string) => void;
  layout?: "horizontal" | "vertical";
  hideActions?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  className = "",
  onEnroll,
  onShare,
  onDetail,
  layout = "vertical",
  hideActions = false,
}) => {
  const {
    id,
    name,
    description = "",
    title = name,
    imageUrl = "/images/default-course.png",
    instructorName = "Eğitmen Bilgisi Yok",
    level = "Başlangıç",
    duration = "0",
    studentCount = 0,
    rating = 0,
    category = "Genel",
    tags = [],
    isFeatured = false,
    isNew = false,
  } = course as Course & {
    title?: string;
    imageUrl?: string;
    instructorName?: string;
    level?: "Başlangıç" | "Orta" | "İleri";
    duration?: string;
    studentCount?: number;
    rating?: number;
    category?: string;
    tags?: string[];
    isFeatured?: boolean;
    isNew?: boolean;
  };

  // Seviye seviyesine göre badge rengi belirle
  const levelVariant = useMemo(() => {
    switch (level) {
      case "Başlangıç":
        return "success" as const;
      case "Orta":
        return "warning" as const;
      case "İleri":
        return "danger" as const;
      default:
        return "default" as const;
    }
  }, [level]);

  // Derecelendirme yıldızı oluştur
  const ratingStars = useMemo(() => {
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  }, [rating]);

  const handleEnroll = () => {
    if (onEnroll) onEnroll(id);
  };

  const handleShare = () => {
    if (onShare) onShare(id);
  };

  const handleDetail = () => {
    if (onDetail) onDetail(id);
  };

  // Card içeriği
  const cardContent = (
    <>
      <div
        className={`relative ${layout === "horizontal" ? "h-36 w-36 min-w-36" : "h-48 w-full"}`}
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover rounded-md"
        />
        {isFeatured && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" size="sm">
              Öne Çıkan
            </Badge>
          </div>
        )}
        {isNew && (
          <div className="absolute top-2 right-2">
            <Badge variant="success" size="sm">
              Yeni
            </Badge>
          </div>
        )}
      </div>

      <div
        className={`flex flex-col ${layout === "horizontal" ? "ml-4" : "mt-4"}`}
      >
        <div className="flex justify-between items-start">
          <Badge variant="secondary" size="sm">
            {category}
          </Badge>
          {ratingStars}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={levelVariant} size="sm">
            {level}
          </Badge>
        </div>
        <h3 className="text-lg font-bold mt-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center mt-3 gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{level}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{studentCount.toLocaleString("tr-TR")} Öğrenci</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" size="sm">
              +{tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Eğitmen: </span>
          <span className="font-medium">{instructorName}</span>
        </div>

        {!hideActions && (
          <div className="flex mt-4 gap-2">
            <Button onClick={handleEnroll} size="sm" variant="default">
              <span className="sr-only">Kaydol</span>
              Kaydol
            </Button>
            <Button onClick={handleDetail} size="sm" variant="secondary">
              <span className="sr-only">Detaylar</span>
              Detaylar
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              onClick={handleShare}
              size="sm"
              variant="ghost"
              className="ml-auto px-2"
            >
              <span className="sr-only">Paylaş</span>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <Card
      className={`${className} ${layout === "horizontal" ? "flex" : ""}`}
      variant="elevated"
      hover={true}
      {...(onDetail ? { onClick: hideActions ? handleDetail : undefined } : {})}
    >
      {cardContent}
    </Card>
  );
};

export default CourseCard;
