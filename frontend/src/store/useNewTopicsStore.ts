import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createTrackedStore } from "./zustand.middleware";
import { getLogger, getFlowTracker } from "../lib/logger.utils";
import { LearningTarget } from "@/types/learningTarget.type";
import learningTargetService from "@/services/learningTarget.service";
import { StateCreator } from "zustand";
import { FlowCategory } from "../constants/logging.constants";

/**
 * Yeni Konular State arayüzü
 */
interface NewTopicsState {
  // AI'dan gelen önerilen yeni konu başlıkları
  suggestedNewTopics: string[];
  // Kullanıcının onaylamak üzere seçtiği yeni konu başlıkları  
  selectedNewTopicsForConfirmation: string[];
  // Backend'den dönen, onaylanmış ve kaydedilmiş yeni öğrenme hedefleri
  confirmedNewLearningTargets: LearningTarget[];
  
  // Loading states
  isLoadingSuggestedTopics: boolean;
  errorLoadingSuggestedTopics: string | null;
  isConfirmingTopics: boolean;
  errorConfirmingTopics: string | null;
}

/**
 * Yeni Konular Actions arayüzü
 */
interface NewTopicsActions {
  // Yeni konu önerileri yükle
  loadSuggestedNewTopics: (
    courseId: string, 
    lessonContext: string, 
    existingTopicNames: string[]
  ) => Promise<void>;
  
  // Bir konuyu onay listesine ekle/çıkar
  toggleTopicForConfirmation: (topicName: string) => void;
  
  // Önerilen konuları temizle
  clearSuggestedTopics: () => void;
  
  // Seçilen konuları onayla ve kaydet
  confirmSelectedTopics: (courseId: string) => Promise<boolean>;
  
  // Tüm state'i sıfırla
  resetNewTopicsState: () => void;
}

/**
 * Tam NewTopics Store arayüzü
 */
interface NewTopicsStore extends NewTopicsState, NewTopicsActions {}

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// NewTopicsStore implementasyonu
const newTopicsStoreImpl: StateCreator<
  NewTopicsStore,
  [],
  [],
  NewTopicsStore
> = (set, get, api) => {
  return {
    // Initial state
    suggestedNewTopics: [],
    selectedNewTopicsForConfirmation: [],
    confirmedNewLearningTargets: [],
    isLoadingSuggestedTopics: false,
    errorLoadingSuggestedTopics: null,
    isConfirmingTopics: false,
    errorConfirmingTopics: null,// Actions
    loadSuggestedNewTopics: async (
      courseId: string, 
      lessonContext: string, 
      existingTopicNames: string[]
    ) => {
      logger.debug(
        `Yeni konu önerileri yükleniyor: courseId=${courseId}, contextLength=${lessonContext.length}, existingTopicsCount=${existingTopicNames.length}`,
        'NewTopicsStore.loadSuggestedNewTopics'
      );      flowTracker.trackStep(
        FlowCategory.State,
        `Yeni konu önerileri yükleme başlatıldı - courseId: ${courseId}`,
        { context: 'NewTopicsStore' }
      );

      // Loading state başlat
      set((state: NewTopicsStore) => {
        state.isLoadingSuggestedTopics = true;
        state.errorLoadingSuggestedTopics = null;
        return state;
      });try {
        const suggestedTopics = await learningTargetService.detectNewTopics(
          courseId,
          lessonContext,
          existingTopicNames
        );

        // Başarılı sonuç
        flowTracker.trackStep(
          FlowCategory.State,
          `Yeni konu önerileri başarıyla yüklendi - ${suggestedTopics.length} konu`,
          'NewTopicsStore'
        );

        logger.info(
          `Yeni konu önerileri başarıyla yüklendi: ${suggestedTopics.length} konu`,
          'NewTopicsStore.loadSuggestedNewTopics',
          undefined,
          undefined,
          { courseId, suggestedCount: suggestedTopics.length, topics: suggestedTopics }
        );

        set((state) => {
          state.suggestedNewTopics = suggestedTopics;
          state.isLoadingSuggestedTopics = false;
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        
        logger.error(
          `Yeni konu önerileri yüklenirken hata oluştu: ${errorMessage}`,
          'NewTopicsStore.loadSuggestedNewTopics',
          undefined,
          undefined,
          error instanceof Error ? error : undefined,
          { courseId, error }
        );

        flowTracker.trackStep(
          FlowCategory.Error,
          `Yeni konu önerileri yüklenirken hata: ${errorMessage}`,
          'NewTopicsStore'
        );

        set((state) => {
          state.suggestedNewTopics = [];
          state.isLoadingSuggestedTopics = false;
          state.errorLoadingSuggestedTopics = errorMessage;
        });
      }
    },    toggleTopicForConfirmation: (topicName: string) => {
      logger.debug(
        `Konu onay durumu değiştiriliyor: ${topicName}`,
        'NewTopicsStore.toggleTopicForConfirmation'
      );

      const currentSelected = get().selectedNewTopicsForConfirmation;
      const isCurrentlySelected = currentSelected.includes(topicName);

      flowTracker.trackStep(
        FlowCategory.State,
        `Konu onay durumu: ${topicName} - ${isCurrentlySelected ? 'çıkarıldı' : 'eklendi'}`,
        'NewTopicsStore'
      );

      set((state) => {
        if (isCurrentlySelected) {
          // Konu seçili ise, listeden çıkar
          state.selectedNewTopicsForConfirmation = state.selectedNewTopicsForConfirmation.filter(
            name => name !== topicName
          );
        } else {
          // Konu seçili değilse, listeye ekle
          state.selectedNewTopicsForConfirmation.push(topicName);
        }
      });

      logger.debug(
        `Konu onay durumu güncellendi: ${topicName} - ${isCurrentlySelected ? 'çıkarıldı' : 'eklendi'}`,
        'NewTopicsStore.toggleTopicForConfirmation',
        undefined,
        undefined,
        { 
          topicName, 
          isSelected: !isCurrentlySelected, 
          selectedCount: get().selectedNewTopicsForConfirmation.length 
        }
      );
    },

    clearSuggestedTopics: api.trackAction('clearSuggestedTopics', () => {
      logger.debug(
        'Önerilen konular temizleniyor',
        'NewTopicsStore.clearSuggestedTopics',
        'useNewTopicsStore.ts',
        152
      );

      flowTracker.trackStep(
        'NewTopicsStore',
        'Önerilen konular ve seçim listesi temizlendi'
      );

      set((state) => {
        state.suggestedNewTopics = [];
        state.selectedNewTopicsForConfirmation = [];
      });
    }),

    confirmSelectedTopics: api.trackAction('confirmSelectedTopics', async (courseId: string): Promise<boolean> => {
      const selectedTopics = get().selectedNewTopicsForConfirmation;
      
      logger.debug(
        `Seçilen konular onaylanıyor: courseId=${courseId}, selectedCount=${selectedTopics.length}`,
        'NewTopicsStore.confirmSelectedTopics',
        'useNewTopicsStore.ts',
        169,
        { courseId, selectedTopics }
      );

      flowTracker.trackStep(
        'NewTopicsStore',
        `Seçilen konular onaylanıyor - ${selectedTopics.length} konu`
      );

      if (selectedTopics.length === 0) {
        const errorMessage = 'Onaylanacak konu seçilmedi';
        logger.warn(
          errorMessage,
          'NewTopicsStore.confirmSelectedTopics',
          'useNewTopicsStore.ts',
          179
        );

        set((state) => {
          state.errorConfirmingTopics = errorMessage;
        });

        return false;
      }

      // Loading state başlat
      set((state) => {
        state.isConfirmingTopics = true;
        state.errorConfirmingTopics = null;
      });

      try {
        const confirmedTargets = await learningTargetService.confirmNewTopics(
          courseId,
          selectedTopics
        );

        // Başarılı sonuç
        flowTracker.trackStep(
          'NewTopicsStore',
          `Konular başarıyla onaylandı ve kaydedildi - ${confirmedTargets.length} öğrenme hedefi`
        );

        logger.info(
          `Konular başarıyla onaylandı ve kaydedildi: ${confirmedTargets.length} öğrenme hedefi`,
          'NewTopicsStore.confirmSelectedTopics',
          'useNewTopicsStore.ts',
          203,
          { courseId, confirmedCount: confirmedTargets.length, targetIds: confirmedTargets.map(t => t.id) }
        );

        set((state) => {
          state.confirmedNewLearningTargets = confirmedTargets;
          state.isConfirmingTopics = false;
          // Başarılı onaylama sonrası temizlik
          state.suggestedNewTopics = [];
          state.selectedNewTopicsForConfirmation = [];
        });

        return true;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        
        logger.error(
          `Konular onaylanırken hata oluştu: ${errorMessage}`,
          'NewTopicsStore.confirmSelectedTopics',
          'useNewTopicsStore.ts',
          220,
          { courseId, selectedTopics, error }
        );

        flowTracker.trackStep(
          'NewTopicsStore',
          `Konular onaylanırken hata: ${errorMessage}`
        );

        set((state) => {
          state.isConfirmingTopics = false;
          state.errorConfirmingTopics = errorMessage;
        });

        return false;
      }
    }),

    resetNewTopicsState: api.trackAction('resetNewTopicsState', () => {
      logger.debug(
        'NewTopics store sıfırlanıyor',
        'NewTopicsStore.resetNewTopicsState',
        'useNewTopicsStore.ts',
        239
      );

      flowTracker.trackStep(
        'NewTopicsStore',
        'NewTopics store tüm state\'leri sıfırlandı'
      );

      set((state) => {
        state.suggestedNewTopics = [];
        state.selectedNewTopicsForConfirmation = [];
        state.confirmedNewLearningTargets = [];
        state.isLoadingSuggestedTopics = false;
        state.errorLoadingSuggestedTopics = null;
        state.isConfirmingTopics = false;
        state.errorConfirmingTopics = null;
      });
    }),
  };
};

// Immer ile TrackedStore oluştur
export const useNewTopicsStore = createTrackedStore<NewTopicsStore, typeof create>(
  create,
  'NewTopicsStore',
  {
    enableLogging: true,
    enablePerformance: true,
    additionalMiddlewares: [immer]
  }
)(newTopicsStoreImpl);

// Selector hooks
export const useNewTopicsLoading = () => {
  const { isLoadingSuggestedTopics, isConfirmingTopics } = useNewTopicsStore();
  return isLoadingSuggestedTopics || isConfirmingTopics;
};

export const useNewTopicsErrors = () => {
  const { errorLoadingSuggestedTopics, errorConfirmingTopics } = useNewTopicsStore();
  return {
    loadingError: errorLoadingSuggestedTopics,
    confirmingError: errorConfirmingTopics,
    hasError: !!(errorLoadingSuggestedTopics || errorConfirmingTopics)
  };
};

export const useSelectedTopicsCount = () => {
  const { selectedNewTopicsForConfirmation } = useNewTopicsStore();
  return selectedNewTopicsForConfirmation.length;
};

export const useCanConfirmTopics = () => {
  const { selectedNewTopicsForConfirmation, isConfirmingTopics } = useNewTopicsStore();
  return selectedNewTopicsForConfirmation.length > 0 && !isConfirmingTopics;
};
