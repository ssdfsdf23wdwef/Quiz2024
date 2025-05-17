import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { useLogDownloader } from '@/hooks/useLogDownloader';

interface LogDownloadButtonProps {
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LogDownloadButton = ({
  variant = 'flat',
  color = 'default',
  size = 'md',
  label = 'Log İşlemleri'
}: LogDownloadButtonProps) => {
  const {
    isDownloading,
    downloadFlowLogs,
    downloadErrorLogs,
    downloadAllLogs,
    clearFlowLogs,
    clearErrorLogs,
    clearAllLogs
  } = useLogDownloader();

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button 
          variant={variant} 
          color={color} 
          size={size}
          isDisabled={isDownloading}
        >
          {isDownloading ? 'İndiriliyor...' : label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Log İşlemleri">
        <DropdownItem key="header" className="font-bold" isReadOnly>
          Log İndirme
        </DropdownItem>
        <DropdownItem key="downloadErrorLogs" onClick={downloadErrorLogs}>
          Hata Loglarını İndir
        </DropdownItem>
        <DropdownItem key="downloadFlowLogs" onClick={downloadFlowLogs}>
          Akış Loglarını İndir
        </DropdownItem>
        <DropdownItem key="downloadAllLogs" onClick={downloadAllLogs}>
          Tüm Logları İndir
        </DropdownItem>
        
        <DropdownItem key="separator" className="h-px bg-default-200 my-1" aria-hidden />
        
        <DropdownItem key="header2" className="font-bold" isReadOnly>
          Log Temizleme
        </DropdownItem>
        <DropdownItem key="clearErrorLogs" onClick={clearErrorLogs} className="text-danger">
          Hata Loglarını Temizle
        </DropdownItem>
        <DropdownItem key="clearFlowLogs" onClick={clearFlowLogs} className="text-warning">
          Akış Loglarını Temizle
        </DropdownItem>
        <DropdownItem key="clearAllLogs" onClick={clearAllLogs} className="text-danger">
          Tüm Logları Temizle
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}; 