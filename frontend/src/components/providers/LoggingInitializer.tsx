"use client";

import { useEffect } from "react";
import { setupLogging, getLogger, getFlowTracker } from "@/lib/logger.utils";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Loglama servislerini başlatan bileşen
 * - Konsol çıktısını yapılandırır
 * - Dosya loglamasını yapılandırır
 * - Sayfa gezinimlerini izler
 */
export default function LoggingInitializer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Loglama servislerini başlat ve yapılandır
    const { logger, flowTracker } = setupLogging({
      // Logger yapılandırması
      loggerOptions: {
        appName: "quiz-frontend",
        enabled: true,
        minLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
        enableConsole: true,
        enableFileLogging: true, // Dosya loglamasını aktifleştir
        logFilePath: "frontend-errors.log", // Hata log dosyası
        enableRemote: false,
        enableStackTrace: true,
      },
      // FlowTracker yapılandırması
      flowTrackerOptions: {
        enabled: true,
        consoleOutput: true,
        traceRenders: true,
        traceStateChanges: true,
        traceApiCalls: true,
        captureTimings: true,
      },
    });
    
    logger.info(
      "Loglama servisleri başlatıldı", 
      "LoggingInitializer", 
      "LoggingInitializer.tsx",
      42
    );
    
    flowTracker.trackStep(
      "Custom",
      "Loglama servisleri başlatıldı",
      "LoggingInitializer"
    );
    
    // Temizleme fonksiyonu
    return () => {
      logger.info(
        "Loglama servisleri kapatılıyor", 
        "LoggingInitializer", 
        "LoggingInitializer.tsx",
        56
      );
    };
  }, []);
  
  // Sayfa gezinimlerini izle
  useEffect(() => {
    const logger = getLogger();
    const flowTracker = getFlowTracker();
    
    logger.info(
      `Sayfa gezinildi: ${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
      "LoggingInitializer.RouteChange",
      "LoggingInitializer.tsx",
      69
    );
    
    flowTracker.trackStep(
      "Navigation",
      `Sayfa gezinildi: ${pathname}`,
      "RouteChange",
      { 
        pathname,
        searchParams: searchParams.toString() 
      }
    );
  }, [pathname, searchParams]);

  // Görsel olarak hiçbir şey render etmez
  return null;
} 