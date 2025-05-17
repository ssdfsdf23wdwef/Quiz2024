import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Button, Divider, Tabs, Tab } from '@nextui-org/react';
import { useLogDownloader } from '@/hooks/useLogDownloader';

/**
 * Log yönetim kartı - Dashboard veya ayarlar sayfasında kullanılabilir
 */
export const LogActions = () => {
  const {
    isDownloading,
    downloadFlowLogs,
    downloadErrorLogs,
    downloadAllLogs,
    clearFlowLogs,
    clearErrorLogs,
    clearAllLogs,
    getLogContents
  } = useLogDownloader();

  const [logStats, setLogStats] = useState({
    errorLogSize: 0,
    flowLogSize: 0,
    totalSize: 0
  });
  
  // Log istatistiklerini hesapla
  useEffect(() => {
    const updateStats = () => {
      const { flowLogs, errorLogs } = getLogContents();
      
      // Log boyutlarını hesapla (karakterler)
      const errorLogSize = (errorLogs?.length || 0);
      const flowLogSize = (flowLogs?.length || 0);
      
      setLogStats({
        errorLogSize,
        flowLogSize,
        totalSize: errorLogSize + flowLogSize
      });
    };
    
    // İlk yükleme ve her 5 saniyede bir güncelle
    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, [getLogContents]);
  
  // Boyutu formatla (B, KB, MB)
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bayt`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  return (
    <Card className="max-w-xl">
      <CardHeader className="flex justify-between items-center">
        <h4 className="text-xl font-bold">Log Yönetimi</h4>
        <Button 
          color="primary" 
          size="sm" 
          onClick={downloadAllLogs}
          isDisabled={isDownloading || logStats.totalSize === 0}
        >
          {isDownloading ? 'İndiriliyor...' : 'Tüm Logları İndir'}
        </Button>
      </CardHeader>
      
      <Divider />
      
      <CardBody>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-default-600">Hata Logları:</span>
            <span className="font-mono">{formatSize(logStats.errorLogSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-600">Akış Logları:</span>
            <span className="font-mono">{formatSize(logStats.flowLogSize)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Toplam:</span>
            <span className="font-mono">{formatSize(logStats.totalSize)}</span>
          </div>
        </div>
        
        <Divider className="my-3" />
        
        <Tabs aria-label="Log İşlemleri">
          <Tab key="download" title="İndir">
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                color="default" 
                variant="flat" 
                onClick={downloadErrorLogs}
                isDisabled={isDownloading || logStats.errorLogSize === 0}
              >
                Hata Logları
              </Button>
              <Button 
                color="default" 
                variant="flat" 
                onClick={downloadFlowLogs}
                isDisabled={isDownloading || logStats.flowLogSize === 0}
              >
                Akış Logları
              </Button>
              <Button 
                color="primary" 
                onClick={downloadAllLogs}
                isDisabled={isDownloading || logStats.totalSize === 0}
              >
                Tüm Loglar
              </Button>
            </div>
          </Tab>
          
          <Tab key="clear" title="Temizle">
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                color="warning" 
                variant="flat" 
                onClick={clearErrorLogs}
                isDisabled={logStats.errorLogSize === 0}
              >
                Hata Loglarını Temizle
              </Button>
              <Button 
                color="warning" 
                variant="flat" 
                onClick={clearFlowLogs}
                isDisabled={logStats.flowLogSize === 0}
              >
                Akış Loglarını Temizle
              </Button>
              <Button 
                color="danger" 
                onClick={clearAllLogs}
                isDisabled={logStats.totalSize === 0}
              >
                Tüm Logları Temizle
              </Button>
            </div>
          </Tab>
        </Tabs>
      </CardBody>
      
      <CardFooter className="text-small text-default-500">
        <p>
          Loglar tarayıcının depolama alanında saklanmaktadır. Tarayıcının önbelleğini temizlemeniz durumunda loglar silinecektir.
        </p>
      </CardFooter>
    </Card>
  );
}; 