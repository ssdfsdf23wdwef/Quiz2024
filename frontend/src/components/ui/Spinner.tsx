"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { forwardRef } from "react";

<<<<<<< HEAD
export default function Spinner({
  size = "md",
  color = "primary",
}: {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "error";
}) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorMap = {
    primary: "border-brand-primary",
    secondary: "border-brand-secondary",
    accent: "border-brand-accent",
    success: "border-state-success",
    warning: "border-state-warning",
    error: "border-state-error",
  };

  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={`${sizeMap[size]} border-4 border-primary/30 rounded-full ${colorMap[color]} border-t-transparent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
=======
const spinnerVariants = cva("border-4 rounded-full border-t-transparent", {
  variants: {
    variant: {
      primary: "border-primary-500 dark:border-primary-400",
      secondary: "border-secondary-500 dark:border-secondary-400",
      success: "border-success-500 dark:border-success-400",
      warning: "border-warning-500 dark:border-warning-400",
      danger: "border-danger-500 dark:border-danger-400",
      neutral: "border-light-border dark:border-dark-border",
    },
    size: {
      xs: "w-4 h-4 border-2",
      sm: "w-5 h-5 border-2",
      md: "w-8 h-8",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
    },
    trackOpacity: {
      light: "border-light-background-tertiary dark:border-dark-bg-tertiary",
      medium: "border-light-border/50 dark:border-dark-border/50",
      dark: "border-light-border dark:border-dark-border",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    trackOpacity: "light",
  },
});

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof spinnerVariants> {
  centered?: boolean;
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
}

/**
 * Yükleme durumunu göstermek için kullanılan spinner bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    { className, variant, size, trackOpacity, centered = false, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          centered && "flex justify-center items-center",
          className
        )}
        {...props}
      >
        <motion.div
          className={twMerge(spinnerVariants({ variant, size, trackOpacity }))}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner };
export default Spinner;
