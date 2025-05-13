import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { Quiz } from "@/types";

interface QuizResultCardProps {
  quiz: Quiz;
}

// Custom quiz tipi (Bu uygulama içinde genişletilmiş olabilir)
interface CustomQuiz extends Quiz {
  title?: string;
}

/**
 * Sınav sonucu kartı bileşeni
 */
export const QuizResultCard: React.FC<QuizResultCardProps> = ({ quiz }) => {
  // Quiz'in custom title alanı olabilir, yoksa quizType kullanılır
  const title = "title" in quiz 
    ? (quiz as CustomQuiz).title || quiz.quizType || "Sınav"
    : quiz.quizType || "Sınav";
  
  const score = typeof quiz.score === "number" ? quiz.score : 0;
  const total = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  
  // timestamp'i tarih olarak format et
  const date = quiz.timestamp 
    ? typeof quiz.timestamp === "string" 
      ? quiz.timestamp 
      : new Date(quiz.timestamp).toLocaleString()
    : "";
  
  // Durum belirleme (örnek):
  let status: "başarılı" | "başarısız" | "devam" = "devam";
  if (score / (total || 1) >= 0.8) status = "başarılı";
  else if (score / (total || 1) < 0.5) status = "başarısız";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900 dark:text-white">
          {title}
        </div>
        <Badge
          variant={
            status === "başarılı"
              ? "success"
              : status === "devam"
                ? "warning"
                : "danger"
          }
          size="sm"
        >
          {status}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-sm mt-1">
        <span className="font-medium">Puan:</span>
        <span>
          {score} / {total}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-1">Tarih: {date}</div>
    </div>
  );
};

export default QuizResultCard;
