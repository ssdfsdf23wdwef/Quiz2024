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
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      case 'trace': return 'text-purple-500';
      default: return 'text-gray-700';
    }
  };
  
  // Akış kategorisine göre renk belirleme
  const getFlowCategoryColor = (category: FlowCategory): string => {
    switch(category) {
      case 'Navigation': return 'text-green-600';
      case 'API': return 'text-blue-600';
      case 'Auth': return 'text-purple-600';
      case 'Component': return 'text-cyan-600';
      case 'State': return 'text-amber-600';
      case 'Render': return 'text-rose-600';
      case 'User': return 'text-indigo-600';
      case 'Custom': return 'text-gray-600';
      default: return 'text-gray-600';
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
        height: '100%'
      }
    : {
        position: 'fixed',
        zIndex: 9999,
        width: position === 'bottom' ? width : 500,
        height: position === 'bottom' ? height : '90vh',
        ...(position === 'bottom' 
          ? { bottom: 0, left: 0, right: 0 } 
          : { right: 0, top: '10vh', bottom: '10vh' })
      };
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg flex flex-col"
      style={panelStyle}
    >
      {/* Panel başlığı */}
      <div className="bg-gray-100 dark:bg-gray-900 p-2 flex items-center justify-between border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            🔍 Logger Panel {process.env.NODE_ENV === 'development' ? '(DEV)' : ''}
          </span>
          
          <div className="ml-4 flex space-x-1">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 text-xs rounded ${activeTab === 'logs' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Loglar
            </button>
            <button 
              onClick={() => setActiveTab('flows')}
              className={`px-3 py-1 text-xs rounded ${activeTab === 'flows' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Akışlar
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshData}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="Yenile"
          >
            <FiRefreshCw size={16} />
          </button>
          
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 ${autoRefresh 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-600 dark:text-gray-400'}`}
            title={autoRefresh ? 'Otomatik yenileme açık' : 'Otomatik yenileme kapalı'}
          >
            <FiClock size={16} />
          </button>
          
          <button 
            onClick={exportData}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="JSON olarak dışa aktar"
          >
            <FiDownload size={16} />
          </button>
          
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title={isMaximized ? 'Küçült' : 'Büyüt'}
          >
            {isMaximized ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Kapat"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      {/* Arama ve filtre araçları */}
      <div className="bg-gray-50 dark:bg-gray-850 p-2 border-b border-gray-300 dark:border-gray-700 flex flex-wrap items-center gap-2">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Arama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
        </div>
        
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
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
                      : 'text-gray-400 dark:text-gray-600 border-gray-300 dark:border-gray-700'
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
                      : 'text-gray-400 dark:text-gray-600 border-gray-300 dark:border-gray-700'
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
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Temizle
        </button>
      </div>
      
      {/* Log içeriği */}
      <div className="overflow-auto flex-grow bg-white dark:bg-gray-850 font-mono text-xs">
        {activeTab === 'logs' && (
          <table className="min-w-full">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-24">Zaman</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-16">Seviye</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700">Mesaj</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-48">Bağlam</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Log kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-800 ${
                      entry.level === 'error' ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-10' : 
                      entry.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-10' : ''
                    }`}
                  >
                    <td className="p-2 text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className={`p-2 font-semibold ${getLogLevelColor(entry.level)}`}>
                      {entry.level.toUpperCase()}
                    </td>
                    <td className="p-2 text-gray-900 dark:text-gray-200">
                      {entry.message}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-500">
                            metadata
                          </summary>
                          <pre className="mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32 text-gray-600 dark:text-gray-300">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      {entry.stackTrace && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-500">
                            stack trace
                          </summary>
                          <pre className="mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32 text-gray-600 dark:text-gray-300">
                            {entry.stackTrace}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">
                      {entry.context}
                      {entry.filePath && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
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
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-24">Zaman</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-24">Kategori</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700">Mesaj</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-40">Bağlam</th>
                <th className="p-2 text-left border-b border-gray-300 dark:border-gray-700 w-20">Süre</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Akış kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                filteredFlows.map((step, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="p-2 text-gray-500 dark:text-gray-400">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </td>
                    <td className={`p-2 font-semibold ${getFlowCategoryColor(step.category)}`}>
                      {step.category}
                    </td>
                    <td className="p-2 text-gray-900 dark:text-gray-200">
                      {step.message}
                      {step.metadata && Object.keys(step.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-500">
                            metadata
                          </summary>
                          <pre className="mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32 text-gray-600 dark:text-gray-300">
                            {JSON.stringify(step.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">
                      {step.context}
                    </td>
                    <td className="p-2 text-gray-500 dark:text-gray-400">
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
      <div className="bg-gray-100 dark:bg-gray-900 p-2 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
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