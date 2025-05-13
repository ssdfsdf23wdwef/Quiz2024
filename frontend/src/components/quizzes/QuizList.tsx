import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// QuizListItem türünü burada tanımlıyoruz
export interface QuizListItem {
  id: string;
  title: string;
  status: "hazır" | "tamamlandı" | "devam ediyor";
  questionCount: number;
  createdAt: string;
}

interface QuizListProps {
  quizzes: QuizListItem[];
  onSelect?: (quizId: string) => void;
}

/**
 * Quiz listesini gösteren atomik bileşen
 */
export const QuizList: React.FC<QuizListProps> = ({ quizzes, onSelect }) => {
  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        Hiç sınav bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {quiz.title}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {quiz.questionCount} soru
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Oluşturulma: {quiz.createdAt}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                quiz.status === "hazır"
                  ? "primary"
                  : quiz.status === "tamamlandı"
                    ? "success"
                    : "warning"
              }
              size="sm"
            >
              {quiz.status}
            </Badge>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onSelect?.(quiz.id)}
            >
              Görüntüle
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizList;
