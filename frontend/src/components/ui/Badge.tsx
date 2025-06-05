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
<<<<<<< HEAD
          "border-transparent bg-tertiary text-primary",
=======
          "border-transparent bg-neutral-800 text-white dark:bg-neutral-700 dark:text-white",
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
        primary:
          "border-transparent bg-brand-primary text-white",
        secondary:
          "border-transparent bg-brand-secondary text-white",
        success:
          "border-transparent bg-state-success text-white",
        warning:
          "border-transparent bg-state-warning text-white",
        danger:
          "border-transparent bg-state-error text-white",
        outline:
<<<<<<< HEAD
          "text-primary border-primary",
=======
          "text-light-text-primary border-light-border dark:text-dark-text-primary dark:border-dark-border",
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
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
