"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface LazyLoadProps {
  /**
   * Yüklenecek içerik bileşeni
   */
  children: ReactNode;
  /**
   * Yükleme durumunda gösterilecek iskelet bileşeni
   */
  placeholder?: ReactNode;
  /**
   * İçeriğin görünür olması için gereken yüzde (0-1 arası)
   */
  threshold?: number;
  /**
   * Yükleme sırasında kullanılacak minimum gecikme (ms cinsinden)
   */
  delay?: number;
  /**
   * Lazy load'u devre dışı bırak ve içeriği hemen göster
   */
  disabled?: boolean;
  /**
   * Özel CSS sınıfı
   */
  className?: string;
  /**
   * İçerik yüklenirken çalıştırılacak callback
   */
  onVisible?: () => void;
  /**
   * İskelet yükleyici tipi
   */
  skeletonType?: "card" | "text" | "avatar" | "custom";
  /**
   * İskelet yükleyici boyutları (skeletonType custom olduğunda)
   */
  skeletonProps?: {
    height?: string | number;
    width?: string | number;
  };
}

/**
 * İçeriği görünür olana kadar yüklememe ve iskelet gösterme bileşeni
 */
export function LazyLoad({
  children,
  placeholder,
  threshold = 0.1,
  delay = 300,
  disabled = false,
  className = "",
  onVisible,
  skeletonType,
  skeletonProps,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // IntersectionObserver ile element görünürlüğünü izle
  useEffect(() => {
    // Eğer devre dışı bırakıldıysa, hemen görünür say
    if (disabled) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Görünür olduğunda gecikmeli olarak yükle
          setTimeout(() => {
            setIsVisible(true);
            // Görünür callback fonksiyonunu çağır
            if (onVisible) onVisible();
          }, delay);

          // Bu elementi artık izleme
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold },
    );

    // Referans varsa gözlemlemeye başla
    if (ref.current) {
      observer.observe(ref.current);
    }

    // Temizlik fonksiyonu
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [disabled, threshold, delay, onVisible]);

  // Tam yüklenme durumunu izle
  useEffect(() => {
    if (isVisible) {
      // Bir sonraki render döngüsünde yüklenmiş olarak işaretle
      // Bu, iskelet animasyonunun daha akıcı geçişi için
      const timeoutId = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  // Özel placeholder yoksa, skeleton tipine göre varsayılan skeleton göster
  const defaultPlaceholder = () => {
    if (skeletonType === "card") {
      return <Skeleton className="h-40 w-full rounded-md" />;
    } else if (skeletonType === "text") {
      return (
        <div className="space-y-2 w-full">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    } else if (skeletonType === "avatar") {
      return <Skeleton circle className="h-12 w-12" />;
    } else {
      // Custom veya belirtilmemiş tüm tiplerde
      return (
        <Skeleton
          className="rounded-md"
          height={skeletonProps?.height || "100%"}
          width={skeletonProps?.width || "100%"}
        />
      );
    }
  };

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <div
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {children}
        </div>
      ) : (
        placeholder || defaultPlaceholder()
      )}
    </div>
  );
}
