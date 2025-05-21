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
 * Sınav analiz sonuçlarını getirir
 */
export function useQuizAnalysis(quizId: string | undefined) {
  return useQuery({
    queryKey: ['quizAnalysis', quizId],
    queryFn: async () => {
      try {
        if (!quizId) {
          throw new Error('Quiz ID belirtilmedi');
        }
        return await quizService.getQuizAnalysis(quizId);
      } catch (error) {
        // Detaylı hata kaydı
        console.error(`Quiz analizi yüklenirken hata: ${quizId}`, error);
        
        // localStorage'dan quiz alalım ve onunla analiz yapmayı deneyelim
        if (typeof window !== "undefined") {
          try {
            const storedQuiz = localStorage.getItem(`quizResult_${quizId}`);
            if (storedQuiz) {
              const quiz = JSON.parse(storedQuiz);
              if (quiz.analysisResult) {
                console.log("Analiz localStorage'dan elde edildi:", quiz.analysisResult);
                return quiz.analysisResult;
              }
            }
          } catch (storageError) {
            console.error("Quiz sonuçları localStorage'dan çekilemedi:", storageError);
          }
        }
        
        // Hata mesajını daha bilgilendirici yapalım
        if (error instanceof Error) {
          throw new Error(`Quiz analizi alınamadı: ${error.message}`);
        }
        throw new Error('Quiz analizi alınamadı: Bilinmeyen hata');
      }
    },
    enabled: !!quizId,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 60, // 1 saat
    retry: (failureCount) => {
      // İlk iki denemede tekrar dene (toplam 3 deneme)
      // Ancak storage'da veri varsa tekrar denemeyi azalt
      const hasLocalData = typeof window !== 'undefined' && 
                            localStorage.getItem(`quizResult_${quizId}`) !== null;
      
      // LocalStorage'da veri varsa sadece 1 kez daha dene
      if (hasLocalData) {
        return failureCount < 1;
      }
      
      // Normal durumda 2 kez dene (toplam 3 deneme)
      return failureCount < 2;
    },
  });
}

/**
 * Başarısız soruları getirir
 */
export function useFailedQuestions(courseId?: string) {
  return useQuery({
    queryKey: ['failedQuestions', courseId],
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

const quizApi = {
  useQuizzes,
  useQuiz,
  useQuizAnalysis,
  useFailedQuestions,
};

export default quizApi;