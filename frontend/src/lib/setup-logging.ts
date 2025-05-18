import axios from 'axios';

// Frontend'den backend'e log göndermek için fonksiyon
export async function sendLogToBackend(logData: {
  level: string;
  message: string | object;
  context?: string;
  details?: any;
}) {
  try {
    // Objeleri JSON string'e dönüştürerek gönder
    const formattedLogData = {
      ...logData,
      timestamp: new Date().toISOString(),
      message: typeof logData.message === 'object' 
        ? JSON.stringify(logData.message) 
        : logData.message,
      details: logData.details ? JSON.stringify(logData.details) : undefined
    };
    
    await axios.post('/api/logs/frontend', formattedLogData);
  } catch (error) {
    // API hatası durumunda sadece konsola yaz (döngüye girmemek için API'yi tekrar çağırma)
    console.error('Log gönderme hatası:', error);
  }
}

// Log seviyesi tipleri
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Logger metotları için tip
interface LogFunction {
  (message: string | object, context?: string, details?: any): void;
}

// Daha güvenli bir şekilde konsol override
const safeConsoleOverride = () => {
  // Orijinal konsol metodları
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  // Sadece desteklenen metodları override et
  console.error = function(...args: any[]) {
    originalError.apply(console, args);
    sendLogToBackend({
      level: 'error',
      message: args[0] || '',
      context: 'Console',
      details: args.length > 1 ? args.slice(1) : undefined
    });
  };
  
  console.warn = function(...args: any[]) {
    originalWarn.apply(console, args);
    sendLogToBackend({
      level: 'warn',
      message: args[0] || '',
      context: 'Console',
      details: args.length > 1 ? args.slice(1) : undefined
    });
  };
  
  console.info = function(...args: any[]) {
    originalInfo.apply(console, args);
    sendLogToBackend({
      level: 'info',
      message: args[0] || '',
      context: 'Console',
      details: args.length > 1 ? args.slice(1) : undefined
    });
  };
  
  console.debug = function(...args: any[]) {
    originalDebug.apply(console, args);
    sendLogToBackend({
      level: 'debug',
      message: args[0] || '',
      context: 'Console',
      details: args.length > 1 ? args.slice(1) : undefined
    });
  };
};

// Logging yapılandırmasını oluştur
export function configureLogging() {
  // Tarayıcı ortamında değilsek çık
  if (typeof window === 'undefined') {
    return;
  }
  
  // Global hata yakalayıcı ekle
  window.addEventListener('error', (event) => {
    sendLogToBackend({
      level: 'error',
      message: `Yakalanmamış hata: ${event.message}`,
      context: 'Window.onerror',
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null
      }
    });
  });
  
  // Promise rejection yakalayıcı
  window.addEventListener('unhandledrejection', (event) => {
    sendLogToBackend({
      level: 'error',
      message: 'Yakalanmamış Promise hatası',
      context: 'UnhandledPromiseRejection',
      details: {
        reason: event.reason ? (event.reason.stack || event.reason.toString()) : 'Bilinmeyen'
      }
    });
  });
  
  // Konsol metotlarını override et (istenirse)
  // Not: Bu kısım flood yapabilir, sadece geliştirme sırasında kullanılabilir
  // safeConsoleOverride();
  
  // Logger servisini global olarak ayarla
  window.appLogger = {
    error: (message: string | object, context?: string, details?: any) => {
      sendLogToBackend({ level: 'error', message, context, details });
    },
    warn: (message: string | object, context?: string, details?: any) => {
      sendLogToBackend({ level: 'warn', message, context, details });
    },
    info: (message: string | object, context?: string, details?: any) => {
      sendLogToBackend({ level: 'info', message, context, details });
    },
    debug: (message: string | object, context?: string, details?: any) => {
      sendLogToBackend({ level: 'debug', message, context, details });
    }
  };
  
  // Başlangıç logu
  sendLogToBackend({
    level: 'info',
    message: 'Frontend log sistemi başlatıldı',
    context: 'LogSetup'
  });
  
  return window.appLogger;
}

// TypeScript için global değişken tanımı
declare global {
  interface Window {
    appLogger: {
      error: LogFunction;
      warn: LogFunction;
      info: LogFunction;
      debug: LogFunction;
    };
  }
} 