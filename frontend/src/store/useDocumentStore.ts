import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createTrackedStore } from "./zustand.middleware";
import { getLogger, getFlowTracker } from "../lib/logger.utils";

interface DocumentState {
  // State
  isLoading: boolean; // Sadece UI state (örn: mutation loading) için kullanılabilir
  selectedDocumentId: string | null;

  // Actions
  setSelectedDocument: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetStore: () => void;
}

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// DocumentStore implementasyonu
const documentStoreImpl = (set, get, api) => {
  // İzlenen aksiyonlar
  return {
    // Initial state
    isLoading: false,
    selectedDocumentId: null,

    // Actions
    setSelectedDocument: api.trackAction('setSelectedDocument', (id) => {
      logger.debug(
        `Seçili belge değiştiriliyor: ${id}`,
        'DocumentStore.setSelectedDocument',
        'useDocumentStore.ts',
        30
      );
      
      flowTracker.trackStateChange(
        'selectedDocumentId', 
        'DocumentStore', 
        get().selectedDocumentId, 
        id
      );
      
      set((state) => {
        state.selectedDocumentId = id;
      });
    }),

    setIsLoading: api.trackAction('setIsLoading', (loading) => {
      logger.debug(
        `Yükleme durumu değiştiriliyor: ${loading}`,
        'DocumentStore.setIsLoading',
        'useDocumentStore.ts',
        47
      );
      
      set((state) => {
        state.isLoading = loading;
      });
    }),

    resetStore: api.trackAction('resetStore', () => {
      logger.debug(
        'Document store sıfırlanıyor',
        'DocumentStore.resetStore',
        'useDocumentStore.ts',
        58
      );
      
      flowTracker.trackStep(
        'State', 
        'Belge store sıfırlandı', 
        'DocumentStore'
      );
      
      set((state) => {
        state.isLoading = false;
        state.selectedDocumentId = null;
      });
    }),
  };
};

// Immer ile TrackedStore oluştur
export const useDocumentStore = createTrackedStore<DocumentState, typeof create>(
  create,
  'DocumentStore',
  {
    enableLogging: true,
    enablePerformance: true,
    additionalMiddlewares: [immer]
  }
)(documentStoreImpl);
