"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Belirli bir yükseklik (string veya number)
   */
  height?: string | number;
  /**
   * Belirli bir genişlik (string veya number)
   */
  width?: string | number;
  /**
   * Yuvarlak kenarlı (avatar vs. için)
   */
  circle?: boolean;
  /**
   * Kenarları tamamen yuvarlak
   */
  rounded?: boolean;
  /**
   * Animasyonu devre dışı bırak
   */
  disableAnimation?: boolean;
}

/**
 * İçerik yüklenirken görüntülenecek yükleme iskeleti bileşeni
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, height, width, circle, rounded, disableAnimation, ...props },
    ref,
  ) => {
    // Style objesi
    const style: React.CSSProperties = {};

    // Boyutlar verildiyse ekle
    if (height) style.height = height;
    if (width) style.width = width;

    return (
      <div
        ref={ref}
        className={twMerge(
          "bg-interactive-disabled", // Updated to theme variable
          disableAnimation ? "" : "animate-pulse",
          circle && "rounded-full",
          rounded && "rounded-md",
          !circle && !rounded && "rounded",
          className,
        )}
        style={style}
        aria-hidden="true"
        aria-label="Yükleniyor..."
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";

export { Skeleton };

/**
 * Metin satırları için iskelet yükleyici bileşeni
 */
export const SkeletonText = ({
  className,
  lines = 3,
  lastLineWidth = "70%",
  ...props
}: {
  lines?: number;
  lastLineWidth?: string | number;
  className?: string;
}) => {
  return (
    <div className={twMerge("space-y-2", className)} {...props}>
      {Array(lines)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: i === lines - 1 && lastLineWidth ? lastLineWidth : "100%",
            }}
          />
        ))}
    </div>
  );
};

/**
 * Kart iskelet yükleyici bileşeni
 */
export const SkeletonCard = ({
  className,
  header = true,
  ...props
}: {
  header?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={twMerge(
        "rounded-lg border border-primary shadow-sm bg-primary", // Updated to theme variables
        className,
      )}
      {...props}
    >
      {header && <Skeleton className="h-40 rounded-none" />}
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
};

/**
 * Avatar/profil resmi iskelet yükleyici bileşeni
 */
export const SkeletonAvatar = ({
  size = "md",
  className,
  ...props
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <Skeleton circle className={twMerge(sizeMap[size], className)} {...props} />
  );
};
