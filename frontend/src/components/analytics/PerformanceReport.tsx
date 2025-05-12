import React, { useState, useEffect } from 'react';
import { getFlowTracker } from '@/lib/logger.utils';

// Flowtracker'dan gelen adım tipi
interface FlowStep {
  id: string;
  timestamp: number;
  category: string;
  message: string;
  context: string;
  timing?: number;
  metadata?: Record<string, unknown>;
}

// Flowtracker'dan gelen sekans tipi
interface FlowSequence {
  id: string;
  name: string;
  steps: FlowStep[];
  startTime: number;
  endTime?: number;
  totalDuration?: number;
}

interface PerformanceMetric {
  category: string;
  operation: string;
  averageDuration: number;
  callCount: number;
}

interface FlowSequenceSummary {
  name: string;
  averageDuration: number;
  count: number;
  steps: number;
}

interface PerformanceReportProps {
  timeframe?: '1h' | '24h' | '7d' | 'all';
  showApiCalls?: boolean;
}

/**
 * Uygulama performans metriklerini gösteren bileşen
 */
const PerformanceReport: React.FC<PerformanceReportProps> = ({
  timeframe = 'all',
  showApiCalls = true
}) => {
  const flowTracker = getFlowTracker();
  
  // Durum değişkenleri
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [sequences, setSequences] = useState<FlowSequenceSummary[]>([]);
  
  // Performans metriklerini hesapla
  useEffect(() => {
    // Akış adımlarını getir
    const allSteps = flowTracker.getSteps() as FlowStep[];
    
    // Zaman filtrelemesi
    const filteredSteps = allSteps.filter(step => {
      if (timeframe === 'all') return true;
      
      const stepTime = new Date(step.timestamp).getTime();
      const now = Date.now();
      
      switch (timeframe) {
        case '1h': return (now - stepTime) <= 60 * 60 * 1000;
        case '24h': return (now - stepTime) <= 24 * 60 * 60 * 1000;
        case '7d': return (now - stepTime) <= 7 * 24 * 60 * 60 * 1000;
        default: return true;
      }
    });
    
    // Kategori bazında metrikleri hesapla
    const metricMap = new Map<string, {
      totalDuration: number;
      count: number;
      category: string;
      operation: string;
    }>();
    
    filteredSteps.forEach(step => {
      if (!step.timing) return;
      
      const key = `${step.category}_${step.context}`;
      const existing = metricMap.get(key);
      
      if (existing) {
        existing.totalDuration += step.timing;
        existing.count += 1;
      } else {
        metricMap.set(key, {
          totalDuration: step.timing,
          count: 1,
          category: step.category,
          operation: step.context
        });
      }
    });
    
    // Ortalama süreleri hesapla
    const calculatedMetrics: PerformanceMetric[] = Array.from(metricMap.values())
      .map(({ totalDuration, count, category, operation }) => ({
        category,
        operation,
        averageDuration: totalDuration / count,
        callCount: count
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration);
    
    setMetrics(calculatedMetrics);
    
    // Akış sekanslarını analiz et
    const allSequences = flowTracker.getSequences() as FlowSequence[];
    
    // İlk önce map olarak topla, sonra diziye dönüştür
    const sequenceSummaryMap: Record<string, FlowSequenceSummary> = {};
    
    allSequences
      .filter(seq => seq.endTime) // Sadece tamamlanmış sekanslar
      .forEach(sequence => {
        const { name, totalDuration, steps } = sequence;
        
        if (!sequenceSummaryMap[name]) {
          sequenceSummaryMap[name] = {
            name,
            averageDuration: totalDuration || 0,
            count: 1,
            steps: steps.length
          };
        } else {
          sequenceSummaryMap[name].averageDuration = 
            (sequenceSummaryMap[name].averageDuration * sequenceSummaryMap[name].count + (totalDuration || 0)) / 
            (sequenceSummaryMap[name].count + 1);
          sequenceSummaryMap[name].count += 1;
          sequenceSummaryMap[name].steps += steps.length;
        }
      });
    
    // Map'i diziye dönüştür ve sırala
    const sequenceSummaryArray = Object.values(sequenceSummaryMap)
      .sort((a, b) => b.averageDuration - a.averageDuration);
    
    setSequences(sequenceSummaryArray);
    
  }, [flowTracker, timeframe]);
  
  // Eğer hiç veri yoksa
  if (metrics.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Performans verisi henüz toplanmadı veya bulunamadı.
        </p>
      </div>
    );
  }
  
  // Kategori bazında performans özeti
  const categoryMetrics = metrics.reduce((acc: Record<string, { totalTime: number, count: number }>, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = { totalTime: metric.averageDuration * metric.callCount, count: metric.callCount };
    } else {
      acc[metric.category].totalTime += metric.averageDuration * metric.callCount;
      acc[metric.category].count += metric.callCount;
    }
    return acc;
  }, {});
  
  // API çağrıları (filtreli)
  const apiMetrics = metrics.filter(m => m.category === 'API' && showApiCalls);
  const topApiMetrics = apiMetrics.slice(0, 10); // En yavaş 10 API çağrısı
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Performans Özeti
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(categoryMetrics).map(([category, { totalTime, count }]) => (
            <div key={category} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">{category}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">İşlem sayısı:</span> 
                  <span className="font-medium ml-2">{count}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Toplam süre:</span> 
                  <span className="font-medium ml-2">{totalTime.toFixed(2)} ms</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Ortalama:</span> 
                  <span className="font-medium ml-2">{(totalTime / count).toFixed(2)} ms</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Toplam İşlemler</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Toplam {metrics.reduce((sum, m) => sum + m.callCount, 0)} işlem kaydedildi, 
            toplamda {metrics.reduce((sum, m) => sum + (m.averageDuration * m.callCount), 0).toFixed(0)} ms sürdü.
          </p>
        </div>
      </div>
      
      {showApiCalls && apiMetrics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            En Yavaş API Çağrıları (Top 10)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlem</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Çağrı Sayısı</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ortalama (ms)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topApiMetrics.map((metric, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{metric.operation}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{metric.callCount}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{metric.averageDuration.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{(metric.averageDuration * metric.callCount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {sequences.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            İş Akışı Performansı
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akış Adı</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Çalışma Sayısı</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adım Sayısı</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ortalama Süre (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sequences.map((seq, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{seq.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{seq.count}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{seq.steps}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{seq.averageDuration.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-500 dark:text-gray-400 italic text-right pt-2">
        * Bu rapor sadece geliştirme ortamında kullanılabilir.
      </div>
    </div>
  );
};

export default PerformanceReport; 