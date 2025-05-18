"use client";

import { useEffect } from "react";
import { getLogger, getFlowTracker, mapToTrackerCategory } from "@/lib/logger.utils";
import { usePathname, useSearchParams } from "next/navigation";
import { FlowCategory } from "@/constants/logging.constants";

/**
 * Loglama servislerini başlatan bileşen DEĞİL, sadece ek loglamalar yapar.
 * Ana başlatma providers.tsx içinde yapılır.
 */
export default function LoggingInitializer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Loglama servisleri providers.tsx içinde zaten başlatılmış olmalı
    const logger = getLogger();
    const flowTracker = getFlowTracker();
    
    logger.info(
      "LoggingInitializer aktif ve sayfa gezinmelerini izliyor", 
      "LoggingInitializer", 
      // "LoggingInitializer.tsx", // Dosya yolu gereksiz olabilir, logger zaten ekleyebilir
      // 0 // Satır no gereksiz
    );
    
    flowTracker.trackStep(
      mapToTrackerCategory(FlowCategory.Custom),
      "LoggingInitializer aktif",
      "LoggingInitializer"
    );
    
  }, []); // Sadece bir kere çalışsın
  
  // Sayfa gezinimlerini izle
  useEffect(() => {
    const logger = getLogger();
    const flowTracker = getFlowTracker();
    const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    
    logger.info(
      `Sayfa gezinildi: ${fullPath}`,
      "LoggingInitializer.RouteChange"
      // "LoggingInitializer.tsx",
      // 0
    );
    
    flowTracker.trackStep(
      mapToTrackerCategory(FlowCategory.Navigation),
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