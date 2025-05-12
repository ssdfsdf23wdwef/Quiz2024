import React from "react";
import QuizList from "./QuizList";
import { useQuizzes } from "@/hooks/useQuizQuery";
import { useQuizStore } from "@/store/useQuizStore";

const QuizDashboard: React.FC = () => {
  // Zustand store'dan sadece UI state action'ı al
  const setSelectedQuiz = useQuizStore((state) => state.setSelectedQuiz);

  // TanStack Query ile verileri getir
  const { data: quizzes, isLoading, error } = useQuizzes();

  const handleSelectQuiz = (id: string) => {
    setSelectedQuiz(id);
  };

  if (isLoading) {
    return <div className="text-center py-6">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        Bir hata oluştu. Lütfen tekrar deneyin.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <QuizList quizzes={quizzes || []} onSelect={handleSelectQuiz} />
    </div>
  );
};

export default QuizDashboard;
