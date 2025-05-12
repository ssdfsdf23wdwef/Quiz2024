import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createTrackedStore } from "./zustand.middleware";
import { getLogger, getFlowTracker } from "../lib/logger.utils";

interface QuizUIState {
  selectedQuizId: string | null;
  setSelectedQuiz: (id: string | null) => void;
  resetStore: () => void;
}

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// QuizStore implementasyonu
const quizStoreImpl = (set, get, api) => {
  return {
    selectedQuizId: null,
    
    setSelectedQuiz: api.trackAction('setSelectedQuiz', (id) => {
      logger.debug(
        `Seçili quiz değiştiriliyor: ${id}`,
        'QuizStore.setSelectedQuiz',
        'useQuizStore.ts',
        23
      );
      
      flowTracker.trackStateChange(
        'selectedQuizId', 
        'QuizStore', 
        get().selectedQuizId, 
        id
      );
      
      set((state) => {
        state.selectedQuizId = id;
      });
    }),
    
    resetStore: api.trackAction('resetStore', () => {
      logger.debug(
        'Quiz store sıfırlanıyor',
        'QuizStore.resetStore',
        'useQuizStore.ts',
        40
      );
      
      flowTracker.trackStep(
        'State', 
        'Quiz store sıfırlandı', 
        'QuizStore'
      );
      
      set((state) => {
        state.selectedQuizId = null;
      });
    }),
  };
};

// Immer ile TrackedStore oluştur
export const useQuizStore = createTrackedStore<QuizUIState, typeof create>(
  create,
  'QuizStore',
  {
    enableLogging: true,
    enablePerformance: true,
    additionalMiddlewares: [immer]
  }
)(quizStoreImpl);

export const useSelectedQuiz = (quizzes: { id: string }[]) => {
  const { selectedQuizId } = useQuizStore();
  return selectedQuizId
    ? quizzes.find((quiz) => quiz.id === selectedQuizId)
    : null;
};
