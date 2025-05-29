import React, { useState, useEffect, useCallback } from 'react';
import { getLogger, getFlowTracker } from '@/lib/logger.utils';
import { FiX, FiMaximize, FiMinimize, FiFilter, FiDownload, FiClock, FiRefreshCw } from 'react-icons/fi';

// Log seviyesi türleri
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Akış kategorisi türleri
type FlowCategory = 
  | 'Navigation'
  | 'Component'
  | 'State'
  | 'API'
  | 'Auth'
  | 'Render'
  | 'User'
  | 'Custom';

// Log girdisi tipi
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  filePath?: string;
  lineNumber?: number;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

// Akış adımı tipi
interface FlowStep {
  id: string;
  timestamp: number;
  category: FlowCategory;
  message: string;
  context: string;
  timing?: number;
  metadata?: Record<string, unknown>;
}

interface LoggerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'logs' | 'flows';
  position?: 'bottom' | 'right';
  width?: number | string;
  height?: number | string;
  initialMaximized?: boolean;
}

/**
 * LoggerPanel bileşeni
 * Sadece development modunda logger ve flow-tracker verilerini görüntüler
 */
const LoggerPanel: React.FC<LoggerPanelProps> = ({
  isOpen,
  onClose,
  defaultTab = 'logs',
  position = 'bottom',
  width = '100%',
  height = 300,
  initialMaximized = false
}) => {
  // Servis örnekleri
  const logger = getLogger();
  const flowTracker = getFlowTracker();
  
  // Durum değişkenleri
  const [activeTab, setActiveTab] = useState<'logs' | 'flows'>(defaultTab);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [logLevelFilter, setLogLevelFilter] = useState<LogLevel[]>(['error', 'warn', 'info']);
  const [flowCategoryFilter, setFlowCategoryFilter] = useState<FlowCategory[]>([
    'Navigation', 'API', 'Auth', 'User'
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMaximized, setIsMaximized] = useState(initialMaximized);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Log verilerini yenile
  const refreshData = useCallback(() => {
    setLogEntries(logger.getLogHistory());
    setFlowSteps(flowTracker.getSteps());
  }, [logger, flowTracker]);
  
  // Component mount olduğunda verileri yükle
  useEffect(() => {
    refreshData();
    
    // Auto-refresh için timer
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh && isOpen) {
      interval = setInterval(refreshData, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshData, autoRefresh, isOpen]);
  
  // Log seviyesi filtresini değiştirme
  const toggleLogLevel = useCallback((level: LogLevel) => {
    setLogLevelFilter(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  }, []);
  
  // Akış kategorisi filtresini değiştirme
  const toggleFlowCategory = useCallback((category: FlowCategory) => {
    setFlowCategoryFilter(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);
  
  // Log verisini JSON olarak dışa aktarma
  const exportData = useCallback(() => {
    const exportObj = {
      logs: logger.getLogHistory(),
      flows: flowTracker.getSteps(),
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFilename = `app-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFilename);
    linkElement.click();
  }, [logger, flowTracker]);
  
  // Log geçmişini temizleme
  const clearHistory = useCallback(() => {
    logger.clearHistory();
    flowTracker.clearHistory();
    refreshData();
  }, [logger, flowTracker, refreshData]);
  
  // Log seviyesine göre renk belirleme
  const getLogLevelColor = (level: LogLevel): string => {
    switch(level) {
      case 'error': return 'text-state-error';
      case 'warn': return 'text-state-warning';
      case 'info': return 'text-state-info';
      case 'debug': return 'text-tertiary';
      case 'trace': return 'text-accent';
      default: return 'text-primary';
    }
  };
  
  // Akış kategorisine göre renk belirleme
  const getFlowCategoryColor = (category: FlowCategory): string => {
    switch(category) {
      case 'Navigation': return 'text-state-success';
      case 'API': return 'text-state-info';
      case 'Auth': return 'text-accent';
      case 'Component': return 'text-info';
      case 'State': return 'text-state-warning';
      case 'Render': return 'text-state-error';
      case 'User': return 'text-brand-primary';
      case 'Custom': return 'text-tertiary';
      default: return 'text-tertiary';
    }
  };
  
  // Filtreleme ve arama uygulanmış log girdileri
  const filteredLogs = logEntries
    .filter(entry => logLevelFilter.includes(entry.level))
    .filter(entry => {
      if (!searchTerm) return true;
      return (
        entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.context && entry.context.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  
  // Filtreleme ve arama uygulanmış akış adımları
  const filteredFlows = flowSteps
    .filter(step => flowCategoryFilter.includes(step.category))
    .filter(step => {
      if (!searchTerm) return true;
      return (
        step.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (step.context && step.context.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  
  // Eğer panel kapalıysa hiçbir şey gösterme
  if (!isOpen) return null;
  
  // Panel konumu ve boyutu ayarları
  const panelStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        width: '100%',
        height: '100%',
        boxShadow: 'var(--shadow-xl)', // Using theme shadow variable
        backgroundColor: 'rgb(var(--color-bg-elevated))' // Using theme background variable
      }
    : {
        position: 'fixed',
        zIndex: 9999,
        width: position === 'bottom' ? width : 500,
        height: position === 'bottom' ? height : '90vh',
        boxShadow: 'var(--shadow-lg)', // Using theme shadow variable
        backgroundColor: 'rgb(var(--color-bg-elevated))', // Using theme background variable
        ...(position === 'bottom' 
          ? { bottom: 0, left: 0, right: 0 } 
          : { right: 0, top: '10vh', bottom: '10vh' })
      };
  
  return (
    <div 
      className="bg-primary border border-primary shadow-lg flex flex-col"
      style={panelStyle}
    >
      {/* Panel başlığı */}
      <div className="bg-secondary p-2 flex items-center justify-between border-b border-primary">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-primary">
            🔍 Logger Panel {process.env.NODE_ENV === 'development' ? '(DEV)' : ''}
          </span>
          
          <div className="ml-4 flex space-x-1">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 text-xs rounded ${activeTab === 'logs' 
                ? 'bg-brand-primary text-inverse' 
                : 'bg-interactive-disabled text-secondary'}`}
            >
              Loglar
            </button>
            <button 
              onClick={() => setActiveTab('flows')}
              className={`px-3 py-1 text-xs rounded ${activeTab === 'flows' 
                ? 'bg-brand-primary text-inverse' 
                : 'bg-interactive-disabled text-secondary'}`}
            >
              Akışlar
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshData}
            className="p-1 text-secondary hover:text-brand-primary"
            title="Yenile"
          >
            <FiRefreshCw size={16} />
          </button>
          
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 ${autoRefresh 
              ? 'text-state-success' 
              : 'text-tertiary'}`}
            title={autoRefresh ? 'Otomatik yenileme açık' : 'Otomatik yenileme kapalı'}
          >
            <FiClock size={16} />
          </button>
          
          <button 
            onClick={exportData}
            className="p-1 text-secondary hover:text-brand-primary"
            title="JSON olarak dışa aktar"
          >
            <FiDownload size={16} />
          </button>
          
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-secondary hover:text-brand-primary"
            title={isMaximized ? 'Küçült' : 'Büyüt'}
          >
            {isMaximized ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-1 text-secondary hover:text-state-error"
            title="Kapat"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      {/* Arama ve filtre araçları */}
      <div className="bg-secondary p-2 border-b border-primary flex flex-wrap items-center gap-2">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Arama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-primary rounded 
                       bg-primary text-primary"
          />
        </div>
        
        <div className="flex items-center">
          <span className="text-xs text-tertiary flex items-center">
            <FiFilter className="mr-1" size={12} /> Filtrele:
          </span>
          
          {activeTab === 'logs' && (
            <div className="flex ml-2 space-x-1">
              {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => toggleLogLevel(level)}
                  className={`px-2 py-0.5 text-xs rounded border ${
                    logLevelFilter.includes(level)
                      ? `${getLogLevelColor(level)} border-current bg-opacity-10 bg-current`
                      : 'text-tertiary border-secondary'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          
          {activeTab === 'flows' && (
            <div className="flex ml-2 space-x-1 flex-wrap">
              {(['Navigation', 'API', 'Auth', 'User', 'State', 'Component'] as FlowCategory[]).map(category => (
                <button
                  key={category}
                  onClick={() => toggleFlowCategory(category)}
                  className={`px-2 py-0.5 text-xs rounded border ${
                    flowCategoryFilter.includes(category)
                      ? `${getFlowCategoryColor(category)} border-current bg-opacity-10 bg-current`
                      : 'text-tertiary border-secondary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={clearHistory}
          className="px-2 py-1 text-xs bg-state-error text-inverse rounded hover:bg-state-error/90"
        >
          Temizle
        </button>
      </div>
      
      {/* Log içeriği */}
      <div className="overflow-auto flex-grow bg-primary font-mono text-xs">
        {activeTab === 'logs' && (
          <table className="min-w-full">
            <thead className="sticky top-0 bg-secondary">
              <tr>
                <th className="p-2 text-left border-b border-primary text-primary w-24">Zaman</th>
                <th className="p-2 text-left border-b border-primary text-primary w-16">Seviye</th>
                <th className="p-2 text-left border-b border-primary text-primary">Mesaj</th>
                <th className="p-2 text-left border-b border-primary text-primary w-48">Bağlam</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-tertiary">
                    Log kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-interactive-hover border-b border-primary ${
                      entry.level === 'error' ? 'bg-state-error-bg' : 
                      entry.level === 'warn' ? 'bg-state-warning-bg' : ''
                    }`}
                  >
                    <td className="p-2 text-tertiary">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className={`p-2 font-semibold ${getLogLevelColor(entry.level)}`}>
                      {entry.level.toUpperCase()}
                    </td>
                    <td className="p-2 text-primary">
                      {entry.message}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-tertiary cursor-pointer hover:text-brand-primary">
                            metadata
                          </summary>
                          <pre className="mt-1 p-1 bg-secondary rounded overflow-auto max-h-32 text-secondary">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      {entry.stackTrace && (
                        <details className="mt-1">
                          <summary className="text-xs text-tertiary cursor-pointer hover:text-brand-primary">
                            stack trace
                          </summary>
                          <pre className="mt-1 p-1 bg-secondary rounded overflow-auto max-h-32 text-secondary">
                            {entry.stackTrace}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="p-2 text-secondary">
                      {entry.context}
                      {entry.filePath && (
                        <div className="text-xs text-tertiary truncate">
                          {entry.filePath}
                          {entry.lineNumber && `:${entry.lineNumber}`}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        
        {activeTab === 'flows' && (
          <table className="min-w-full">
            <thead className="sticky top-0 bg-secondary">
              <tr>
                <th className="p-2 text-left border-b border-primary text-primary w-24">Zaman</th>
                <th className="p-2 text-left border-b border-primary text-primary w-24">Kategori</th>
                <th className="p-2 text-left border-b border-primary text-primary">Mesaj</th>
                <th className="p-2 text-left border-b border-primary text-primary w-40">Bağlam</th>
                <th className="p-2 text-left border-b border-primary text-primary w-20">Süre</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-tertiary">
                    Akış kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                filteredFlows.map((step, index) => (
                  <tr
                    key={index}
                    className="hover:bg-interactive-hover border-b border-primary"
                  >
                    <td className="p-2 text-tertiary">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </td>
                    <td className={`p-2 font-semibold ${getFlowCategoryColor(step.category)}`}>
                      {step.category}
                    </td>
                    <td className="p-2 text-primary">
                      {step.message}
                      {step.metadata && Object.keys(step.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-tertiary cursor-pointer hover:text-brand-primary">
                            metadata
                          </summary>
                          <pre className="mt-1 p-1 bg-secondary rounded overflow-auto max-h-32 text-secondary">
                            {JSON.stringify(step.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="p-2 text-secondary">
                      {step.context}
                    </td>
                    <td className="p-2 text-tertiary">
                      {step.timing ? `${step.timing.toFixed(2)}ms` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Panel alt bilgisi */}
      <div className="bg-secondary p-2 border-t border-primary text-xs text-tertiary flex justify-between">
        <div>
          {activeTab === 'logs' ? `${filteredLogs.length} log gösteriliyor` : `${filteredFlows.length} akış adımı gösteriliyor`}
        </div>
        <div>
          Son yenileme: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default LoggerPanel;