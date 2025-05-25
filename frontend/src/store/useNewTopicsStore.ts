import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createTrackedStore } from "./zustand.middleware";
import { getLogger, getFlowTracker, mapToTrackerCategory } from "../lib/logger.utils";
import { LearningTarget } from "@/types/learningTarget.type";
import learningTargetService from "@/services/learningTarget.service";
import { StateCreator, StoreApi } from "zustand";
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

// Define type for extended API with trackAction
interface ExtendedApi extends StoreApi<NewTopicsStore> {
  trackAction?: <F extends (...args: any[]) => any>(
    actionName: string,
    fn: F
  ) => F;
}

/**
 * Combined interface (State + Actions)
 */
interface NewTopicsStore extends NewTopicsState, NewTopicsActions {}

// Logger
const logger = getLogger();
const flowTracker = getFlowTracker();

// NewTopicsStore implementasyonu
const newTopicsStoreImpl: StateCreator<
  NewTopicsStore,
  [],
  [["zustand/immer", never]],
  NewTopicsStore
> = (set, get, api: ExtendedApi) => {
  return {
    // Initial state
    suggestedNewTopics: [],
    selectedNewTopicsForConfirmation: [],
    confirmedNewLearningTargets: [],
    isLoadingSuggestedTopics: false,
    errorLoadingSuggestedTopics: null,
    isConfirmingTopics: false,
    errorConfirmingTopics: null,

    // Actions
    loadSuggestedNewTopics: async (
      courseId: string,
      lessonContext: string,
      existingTopicNames: string[] = []
    ) => {
      logger.debug(
        `Yeni konu önerileri yükleniyor: courseId=${courseId}, contextLength=${lessonContext.length}, existingTopicsCount=${existingTopicNames.length}`,
        'NewTopicsStore.loadSuggestedNewTopics'
      );
      
      flowTracker.trackStep(
        mapToTrackerCategory(FlowCategory.State),
        `Yeni konu önerileri yükleme başlatıldı - courseId: ${courseId}`,
        'NewTopicsStore'
      );

      // Loading state
      set((state) => ({
        ...state,
        isLoadingSuggestedTopics: true,
        errorLoadingSuggestedTopics: null
      }));

      try {
        // API call
        const suggestedTopics = await learningTargetService.detectNewTopics(
          courseId,
          lessonContext,
          existingTopicNames
        );

        // Başarılı sonuç (Successful result)
        flowTracker.trackStep(
          mapToTrackerCategory(FlowCategory.State),
          `Yeni konu önerileri başarıyla yüklendi - ${suggestedTopics.length} konu`,
          'NewTopicsStore'
        );

        logger.debug(
          `Yeni konu önerileri yüklendi: ${suggestedTopics.length} konu bulundu`,
          'NewTopicsStore.loadSuggestedNewTopics',
          undefined,
          undefined,
          { courseId, suggestedCount: suggestedTopics.length, topics: suggestedTopics }
        );

        set((state) => ({
          ...state,
          suggestedNewTopics: suggestedTopics,
          isLoadingSuggestedTopics: false
        }));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        
        logger.error(
          `Yeni konu önerileri yüklenirken hata oluştu: ${errorMessage}`,
          'NewTopicsStore.loadSuggestedNewTopics',
          undefined,
          undefined,
          error instanceof Error ? error : new Error(errorMessage),
          { courseId }
        );

        flowTracker.trackStep(
          mapToTrackerCategory(FlowCategory.Error),
          `Yeni konu önerileri yüklenirken hata: ${errorMessage}`,
          'NewTopicsStore'
        );

        set((state) => ({
          ...state,
          suggestedNewTopics: [],
          isLoadingSuggestedTopics: false,
          errorLoadingSuggestedTopics: errorMessage
        }));
      }
    },    
    
    toggleTopicForConfirmation: (topicName: string) => {
      logger.debug(
        `Konu onay durumu değiştiriliyor: ${topicName}`,
        'NewTopicsStore.toggleTopicForConfirmation',
        undefined,
        "125"
      );

      const currentSelected = get().selectedNewTopicsForConfirmation;
      const isCurrentlySelected = currentSelected.includes(topicName);

      flowTracker.trackStep(
        mapToTrackerCategory(FlowCategory.State),
        `Konu onay durumu: ${topicName} - ${isCurrentlySelected ? 'çıkarıldı' : 'eklendi'}`,
        'NewTopicsStore'
      );

      set((state) => {
        // Create a new array based on whether the topic is already selected
        const newSelectedTopics = isCurrentlySelected 
          // Konu seçili ise, listeden çıkar (If selected, remove from list)
          ? state.selectedNewTopicsForConfirmation.filter(name => name !== topicName)
          // Konu seçili değilse, listeye ekle (If not selected, add to list)
          : [...state.selectedNewTopicsForConfirmation, topicName];
          
        return {
          ...state,
          selectedNewTopicsForConfirmation: newSelectedTopics
        };
      });

      logger.debug(
        `Konu onay durumu değiştirildi: ${topicName} - ${isCurrentlySelected ? 'listeden çıkarıldı' : 'listeye eklendi'}`,
        'NewTopicsStore.toggleTopicForConfirmation',
        undefined,
        "144",
        { topicName, isSelected: !isCurrentlySelected, selectedCount: get().selectedNewTopicsForConfirmation.length }
      );
    },

    // Use simple function instead of trackAction for type safety
    clearSuggestedTopics: () => {
      logger.debug(
        'Önerilen konular temizleniyor',
        'NewTopicsStore.clearSuggestedTopics',
        undefined,
        "152"
      );

      flowTracker.trackStep(
        mapToTrackerCategory(FlowCategory.State),
        'Önerilen konular ve seçim listesi temizlendi',
        'NewTopicsStore'
      );

      set((state) => ({
        ...state,
        suggestedNewTopics: [],
        selectedNewTopicsForConfirmation: []
      }));
    },

    // Use simple function instead of trackAction for type safety
    confirmSelectedTopics: async (courseId: string): Promise<boolean> => {
      const selectedTopics = get().selectedNewTopicsForConfirmation;
      
      logger.debug(
        `Seçilen konular onaylanıyor: courseId=${courseId}, selectedCount=${selectedTopics.length}`,
        'NewTopicsStore.confirmSelectedTopics',
        undefined,
        "169",
        { courseId, selectedTopics }
      );

      flowTracker.trackStep(
        mapToTrackerCategory(FlowCategory.State),
        `Seçilen konular onaylanıyor - ${selectedTopics.length} konu`,
        'NewTopicsStore'
      );

      if (selectedTopics.length === 0) {
        const errorMessage = 'Onaylanacak konu seçilmedi';
        logger.error(
          errorMessage,
          'NewTopicsStore.confirmSelectedTopics',
          undefined,
          "184",
          { courseId, selectedTopics, error: new Error(errorMessage) }
        );

        flowTracker.trackStep(
          mapToTrackerCategory(FlowCategory.Error),
          `Seçilen konular onaylanırken hata: ${errorMessage}`,
          'NewTopicsStore'
        );

        set((state) => ({
          ...state,
          errorConfirmingTopics: errorMessage
        }));

        return false;
      }

      // Loading state başlat (Start loading state)
      set((state) => ({
        ...state,
        isConfirmingTopics: true,
        errorConfirmingTopics: null
      }));

      try {
        const confirmedTargets = await learningTargetService.confirmNewTopics(
          courseId,
          selectedTopics
        );

        // Başarılı sonuç
        flowTracker.trackStep(
          mapToTrackerCategory(FlowCategory.State),
          `Konular başarıyla onaylandı ve kaydedildi - ${confirmedTargets.length} öğrenme hedefi`,
          'NewTopicsStore'
        );

        logger.info(
          `Konular başarıyla onaylandı ve kaydedildi: ${confirmedTargets.length} öğrenme hedefi`,
          'NewTopicsStore.confirmSelectedTopics',
          undefined,
          "203",
          { courseId, confirmedCount: confirmedTargets.length, targetIds: confirmedTargets.map(t => t.id) }
        );

        // Return the updated state object as required by Zustand
        set((state) => ({
          ...state,
          confirmedNewLearningTargets: confirmedTargets,
          selectedNewTopicsForConfirmation: [],
          suggestedNewTopics: [],
          isConfirmingTopics: false,
          errorConfirmingTopics: null
          // Başarılı onaylama sonrası temizlik (cleanup after successful confirmation)
        }));

        return true;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        
        logger.error(
          `Konular onaylanırken hata oluştu: ${errorMessage}`,
          'NewTopicsStore.confirmSelectedTopics',
          undefined,
          "220",
          { courseId, selectedTopics, error: error instanceof Error ? error : new Error(errorMessage) }
        );

        flowTracker.trackStep(
          mapToTrackerCategory(FlowCategory.Error),
          `Konular onaylanırken hata: ${errorMessage}`,
          'NewTopicsStore'
        );

        set((state) => ({
          ...state,
          isConfirmingTopics: false,
          errorConfirmingTopics: errorMessage
        }));

        return false;
      }
    },

    // Use simple function instead of trackAction for type safety
    resetNewTopicsState: () => {
      logger.debug(
        'NewTopics store sıfırlanıyor',
        'NewTopicsStore.resetNewTopicsState',
        undefined,
        "239"
      );

      flowTracker.trackStep(
        mapToTrackerCategory(FlowCategory.State),
        'NewTopics store tüm state\'leri sıfırlandı',
        'NewTopicsStore'
      );

      set((state) => ({
        ...state,
        suggestedNewTopics: [],
        selectedNewTopicsForConfirmation: [],
        confirmedNewLearningTargets: [],
        isLoadingSuggestedTopics: false,
        errorLoadingSuggestedTopics: null,
        isConfirmingTopics: false,
        errorConfirmingTopics: null
      }));
    }
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
