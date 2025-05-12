"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

/**
 * Analitik izleme ve performans ölçümü yapmak için kullanılan bileşen.
 * Bu bileşen yalnızca istemci tarafında yüklenir (dynamic import, SSR: false)
 */
export default function AnalyticsComponent() {
  const pathname = usePathname();

  // Sayfa değişikliklerini izle
  useEffect(() => {
    // Burası kullanıcı davranışlarını izlemek için Google Analytics,
    // Hotjar, Mixpanel gibi analitik servislerinin entegrasyon noktasıdır.
    // Bu örnek şu anda sadece konsolda sayfa görüntülemelerini kaydeder
    console.log("Sayfa görüntüleme:", pathname);

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
  }, [pathname]);

  return null; // Bu bileşen görsel bir çıktı üretmez
}
