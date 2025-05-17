import { useQuery } from '@tanstack/react-query';
import quizService from '@/services/quiz.service';
import { ErrorService } from '@/services/error.service';
import { Quiz } from '@/types';

/**
 * Tüm sınavları getirir
 */
export function useQuizzes(courseId?: string) {
  return useQuery<Quiz[], Error>({
    queryKey: ['quizzes', courseId],
    queryFn: async () => {
      try {
        const response = await quizService.getQuizzes(courseId);
        // API yanıtını Quiz tipine dönüştür
        return response as unknown as Quiz[];
      } catch (error) {
        ErrorService.showToast('Sınavlar yüklenirken bir hata oluştu', 'error');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
    refetchOnWindowFocus: false,
  });
}

/**
 * ID'ye göre sınav getirir
 */
export function useQuiz(quizId: string | undefined | null) {
  return useQuery<Quiz, Error>({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      if (!quizId) {
        throw new Error('Sınav ID\'si belirtilmedi');
      }
      try {
        const response = await quizService.getQuizById(quizId);
        // API yanıtını Quiz tipine dönüştür
        return response as unknown as Quiz;
      } catch (error) {
        ErrorService.showToast('Sınav yüklenirken bir hata oluştu', 'error');
        throw error;
      }
    },
    enabled: !!quizId,
    staleTime: 1000 * 60 * 5, // 5 dakika
    refetchOnWindowFocus: false,
  });
}

/**
 * ID'ye göre sınav analiz sonuçlarını getirir
 */
export function useQuizAnalysis(quizId: string | undefined | null) {
  return useQuery({
    queryKey: ['quiz-analysis', quizId],
    queryFn: async () => {
      if (!quizId) {
        throw new Error('Sınav ID\'si belirtilmedi');
      }
      try {
        return await quizService.getQuizAnalysis(quizId);
      } catch (error) {
        ErrorService.showToast('Sınav analizi yüklenirken bir hata oluştu', 'error');
        throw error;
      }
    },
    enabled: !!quizId,
    staleTime: 1000 * 60 * 5, // 5 dakika
    refetchOnWindowFocus: false,
  });
}

/**
 * Başarısız soruları getirir
 */
export function useFailedQuestions(courseId?: string) {
  return useQuery({
    queryKey: ['failed-questions', courseId],
    queryFn: async () => {
      try {
        return await quizService.getFailedQuestions(courseId);
      } catch (error) {
        ErrorService.showToast('Başarısız sorular yüklenirken bir hata oluştu', 'error');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
    refetchOnWindowFocus: false,
  });
}

export default {
  useQuizzes,
  useQuiz,
  useQuizAnalysis,
  useFailedQuestions,
}; 