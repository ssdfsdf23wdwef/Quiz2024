import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  Quiz,
  QuizGenerationOptions,
  QuizSubmissionPayload,
  AnalysisResult,
  FailedQuestion,
} from "../types/quiz.type";
import quizService from "../services/quiz.service";
import adapterService from "../services/adapter.service";
import {
  ApiQuiz,
  ApiAnalysisResult,
  ApiFailedQuestion,
} from "../services/adapter.service";

/**
 * Hook Yapılandırma Seçenekleri
 */
interface UseQuizzesOptions {
  courseId?: string;
  config?: UseQueryOptions<Quiz[]>;
}

interface UseQuizOptions {
  enabled?: boolean;
  config?: UseQueryOptions<Quiz>;
}

interface UseFailedQuestionsOptions {
  courseId?: string;
  config?: UseQueryOptions<FailedQuestion[]>;
}

interface UseQuizAnalysisOptions {
  enabled?: boolean;
  config?: UseQueryOptions<AnalysisResult>;
}

/**
 * Sınavları getirme hook'ları
 */
export const useQuizzes = ({ courseId, config }: UseQuizzesOptions = {}) => {
  return useQuery<Quiz[]>({
    queryKey: courseId ? ["quizzes", "course", courseId] : ["quizzes"],
    queryFn: async () => {
      const apiQuizzes = await quizService.getQuizzes(courseId);
      if (!Array.isArray(apiQuizzes))
        throw new Error("API'den beklenen quiz listesi gelmedi");
      if (!apiQuizzes.every((q) => typeof q === "object" && q !== null))
        throw new Error("API'den beklenen quiz listesi gelmedi");
      return adapterService.toQuizzes(apiQuizzes as ApiQuiz[]);
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
    ...config,
  });
};

export const useQuiz = (
  id: string,
  { enabled = true, config }: UseQuizOptions = {},
) => {
  return useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const apiQuiz = await quizService.getQuizById(id);
      if (!apiQuiz || typeof apiQuiz !== "object")
        throw new Error("API'den beklenen quiz gelmedi");
      return adapterService.toQuiz(apiQuiz as ApiQuiz);
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 dakika
    ...config,
  });
};

export const useQuizAnalysis = (
  id: string,
  { enabled = true, config }: UseQuizAnalysisOptions = {},
) => {
  return useQuery<AnalysisResult>({
    queryKey: ["quiz", id, "analysis"],
    queryFn: async () => {
      const apiAnalysis = await quizService.getQuizAnalysis(id);
      if (!apiAnalysis || typeof apiAnalysis !== "object")
        throw new Error("API'den beklenen analiz gelmedi");
      return adapterService.toAnalysisResult(apiAnalysis as ApiAnalysisResult);
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 dakika
    ...config,
  });
};

export const useFailedQuestions = ({
  courseId,
  config,
}: UseFailedQuestionsOptions = {}) => {
  return useQuery<FailedQuestion[]>({
    queryKey: courseId ? ["failed-questions", courseId] : ["failed-questions"],
    queryFn: async () => {
      const apiFailedQuestions = await quizService.getFailedQuestions(courseId);
      if (!Array.isArray(apiFailedQuestions))
        throw new Error("API'den beklenen failed questions listesi gelmedi");
      if (!apiFailedQuestions.every((q) => typeof q === "object" && q !== null))
        throw new Error("API'den beklenen failed questions listesi gelmedi");
      return adapterService.toFailedQuestions(
        apiFailedQuestions as ApiFailedQuestion[],
      );
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
    ...config,
  });
};

/**
 * Sınav oluşturma ve gönderme hook'ları
 */
export const useGenerateQuiz = (
  options?: UseMutationOptions<Quiz, Error, QuizGenerationOptions>,
) => {
  return useMutation<Quiz, Error, QuizGenerationOptions>({
    mutationFn: async (generationOptions: QuizGenerationOptions) => {
      const apiQuiz = await quizService.generateQuiz(generationOptions);
      
      if (!apiQuiz || typeof apiQuiz !== "object")
        throw new Error("API'den beklenen quiz gelmedi");
      
      return adapterService.toQuiz(apiQuiz as ApiQuiz);
    },
    ...options,
  });
};

export const useSubmitQuiz = (
  options?: UseMutationOptions<Quiz, Error, QuizSubmissionPayload>,
) => {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, QuizSubmissionPayload>({
    mutationFn: async (payload: QuizSubmissionPayload) => {
      const apiQuiz = await quizService.submitQuiz(payload);
      
      if (!apiQuiz || typeof apiQuiz !== "object")
        throw new Error("API'den beklenen quiz gelmedi");
      
      return adapterService.toQuiz(apiQuiz as ApiQuiz);
    },
    onSuccess: (data, variables, context) => {
      // Sınav ve analiz verilerini cache'e ekle
      queryClient.setQueryData(["quiz", data.id], data);

      // İlgili tüm listeleri invalidate et
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["failed-questions"] });

      // Eğer sonuçta analiz varsa, onu da cache'e ekle
      if (data.analysisResult) {
        queryClient.setQueryData(
          ["quiz", data.id, "analysis"],
          data.analysisResult,
        );
      }

      // Eğer bir ders ile ilişkiliyse, ders hedeflerini invalidate et
      if (data.courseId) {
        queryClient.invalidateQueries({
          queryKey: ["learning-targets", "course", data.courseId],
        });
        queryClient.invalidateQueries({
          queryKey: ["learning-targets", "status", data.courseId],
        });
      }

      // Kullanıcı tanımlı onSuccess callback'i çağır
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

export const useDeleteQuiz = (
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await quizService.deleteQuiz(id);
    },
    onSuccess: (result, deletedId, context) => {
      // Cache'ten sinavı sil
      queryClient.removeQueries({ queryKey: ["quiz", deletedId] });
      queryClient.removeQueries({ queryKey: ["quiz", deletedId, "analysis"] });

      // İlgili listeleri güncelle
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });

      // Kullanıcı tanımlı onSuccess callback'i çağır
      if (options?.onSuccess) {
        options.onSuccess(result, deletedId, context);
      }
    },
    ...options,
  });
};
