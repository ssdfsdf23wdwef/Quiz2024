"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

// Global gtag fonksiyonu için tip tanımı
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Analitik izleme ve performans ölçümü yapmak için kullanılan bileşen.
 * Bu bileşen yalnızca istemci tarafında yüklenir (dynamic import, SSR: false)
 */
export default function AnalyticsComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sayfa görüntüleme ve etkinlikleri izleme
  useEffect(() => {
    // Yeni sayfa yüklemesini izle
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    // Sayfa görünümünü kaydet
    trackPageView(url);

    // Sadece geliştirme modunda konsola log
    if (process.env.NODE_ENV === "development") {
      console.log(`📊 [Analytics] Sayfa görüntülendi: ${url}`);
    }

    // Web Vitals metriklerini izle
    const reportWebVital = (metric: Metric) => {
      // Metrikleri konsola yazdır (geliştirme aşamasında)
      console.log("Web Vital metriği:", metric);

      // TODO: Metrikleri analitik servisine gönder
      // Örnek: analytics.sendMetric(metric);
    };

    onCLS(reportWebVital);
    onFCP(reportWebVital);
    onINP(reportWebVital);
    onLCP(reportWebVital);
    onTTFB(reportWebVital);

    // Performance timeline ölçümü
    if (window.performance) {
      // Navigasyon zamanlaması
      setTimeout(() => {
        if (window.performance.getEntriesByType) {
          const navEntry = window.performance.getEntriesByType(
            "navigation",
          )[0] as PerformanceNavigationTiming;
          if (navEntry) {
            console.log(
              "DNS: ",
              Math.round(navEntry.domainLookupEnd - navEntry.domainLookupStart),
            );
            console.log(
              "TCP: ",
              Math.round(navEntry.connectEnd - navEntry.connectStart),
            );
            console.log(
              "TLS: ",
              Math.round(
                navEntry.secureConnectionStart > 0
                  ? navEntry.connectEnd - navEntry.secureConnectionStart
                  : 0,
              ),
            );
            console.log(
              "TTFB: ",
              Math.round(navEntry.responseStart - navEntry.requestStart),
            );
            console.log(
              "Content Download: ",
              Math.round(navEntry.responseEnd - navEntry.responseStart),
            );
            console.log(
              "DOM Interactive: ",
              Math.round(navEntry.domInteractive - navEntry.responseEnd),
            );
            console.log(
              "DOM Content Loaded: ",
              Math.round(
                navEntry.domContentLoadedEventEnd -
                  navEntry.domContentLoadedEventStart,
              ),
            );
            console.log(
              "DOM Complete: ",
              Math.round(navEntry.domComplete - navEntry.domInteractive),
            );
            console.log(
              "Load Event: ",
              Math.round(navEntry.loadEventEnd - navEntry.loadEventStart),
            );
            console.log(
              "Total Time: ",
              Math.round(navEntry.loadEventEnd - navEntry.startTime),
            );
          }
        }
      }, 1000);
    }
  }, [pathname, searchParams]);

  // Sayfa görüntüleme izleme fonksiyonu
  function trackPageView(url: string) {
    // Gerçek bir uygulamada bu fonksiyon, Google Analytics, Mixpanel,
    // veya kendi backend analytics API'nizi çağırır.
    
    try {
      // Örnek: Google Analytics'e gönderim
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("config", process.env.NEXT_PUBLIC_GA_ID as string, {
          page_path: url,
        });
      }
      
      // Örnek: Kendi backend'inize gönderim
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   body: JSON.stringify({ path: url, event: 'page_view' }),
      //   headers: { 'Content-Type': 'application/json' }
      // })
    } catch (error) {
      console.error("[Analytics] Hata:", error);
    }
  }

  // Bu bileşen görünür bir şey render etmez
  return null;
}
