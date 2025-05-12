import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import LoggerPanel from '@/components/ui/LoggerPanel';

interface DevLoggerContextType {
  isLoggerPanelOpen: boolean;
  openLoggerPanel: () => void;
  closeLoggerPanel: () => void;
  toggleLoggerPanel: () => void;
}

const DevLoggerContext = createContext<DevLoggerContextType | undefined>(undefined);

interface DevLoggerProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Dev ortamındaki loglama panel görünürlüğünü kontrol eden provider
 */
export const DevLoggerProvider: React.FC<DevLoggerProviderProps> = ({ 
  children,
  defaultOpen = false
}) => {
  // Panel durumu
  const [isLoggerPanelOpen, setIsLoggerPanelOpen] = useState(defaultOpen);

  // Klavye kısayolu ile loglama panelini aç/kapat
  useEffect(() => {
    // Sadece development modunda çalışır
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + L tuş kombinasyonu ile paneli aç/kapat
      if (event.altKey && event.key === 'l') {
        setIsLoggerPanelOpen((prev) => !prev);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Panel kontrol metodları
  const openLoggerPanel = useCallback(() => setIsLoggerPanelOpen(true), []);
  const closeLoggerPanel = useCallback(() => setIsLoggerPanelOpen(false), []);
  const toggleLoggerPanel = useCallback(() => setIsLoggerPanelOpen(prev => !prev), []);

  // Context değeri
  const contextValue: DevLoggerContextType = {
    isLoggerPanelOpen,
    openLoggerPanel,
    closeLoggerPanel,
    toggleLoggerPanel
  };

  return (
    <DevLoggerContext.Provider value={contextValue}>
      {children}
      
      {/* Sadece development modunda loglama panelini göster */}
      {process.env.NODE_ENV === 'development' && (
        <LoggerPanel 
          isOpen={isLoggerPanelOpen}
          onClose={closeLoggerPanel}
          position="bottom"
          height={300}
        />
      )}
    </DevLoggerContext.Provider>
  );
};

/**
 * Loglama panelini kontrol etmek için hook
 */
export const useDevLogger = (): DevLoggerContextType => {
  const context = useContext(DevLoggerContext);
  
  if (context === undefined) {
    throw new Error('useDevLogger must be used within a DevLoggerProvider');
  }
  
  return context;
};

export default DevLoggerProvider; 