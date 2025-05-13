"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-800 text-white dark:bg-neutral-700 dark:text-white",
        primary:
          "border-transparent bg-primary-500 text-white dark:bg-primary-700",
        secondary:
          "border-transparent bg-secondary-500 text-white dark:bg-secondary-700",
        success:
          "border-transparent bg-success-500 text-white dark:bg-success-700",
        warning:
          "border-transparent bg-warning-500 text-white dark:bg-warning-700",
        danger:
          "border-transparent bg-danger-500 text-white dark:bg-danger-700",
        outline:
          "text-light-text-primary border-light-border dark:text-dark-text-primary dark:border-dark-border",
      },
      size: {
        sm: "h-4 text-[0.625rem]",
        md: "h-5",
        lg: "h-6 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Etiket veya durum göstergesi olarak kullanılan küçük rozet bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(badgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
