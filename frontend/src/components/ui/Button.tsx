"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-white hover:bg-brand-primary-hover hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-primary/20 focus-visible:ring-brand-primary",
        secondary:
          "bg-brand-secondary text-white hover:bg-brand-secondary-hover hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-secondary/20 focus-visible:ring-brand-secondary",
        outline:
          "border border-primary/50 bg-transparent hover:bg-interactive-hover hover:border-brand-primary/50 focus-visible:ring-brand-primary",
        ghost:
          "bg-transparent hover:bg-interactive-hover hover:shadow-sm focus-visible:ring-brand-primary",
        destructive:
          "bg-state-error text-white hover:bg-state-error/90 hover:-translate-y-0.5 hover:shadow-md hover:shadow-state-error/20 focus-visible:ring-state-error",
        success:
          "bg-state-success text-white hover:bg-state-success/90 hover:-translate-y-0.5 hover:shadow-md hover:shadow-state-success/20 focus-visible:ring-state-success",
        warning:
          "bg-state-warning text-white hover:bg-state-warning/90 hover:-translate-y-0.5 hover:shadow-md hover:shadow-state-warning/20 focus-visible:ring-state-warning",
        link: "text-brand-primary underline-offset-4 hover:underline hover:text-brand-primary-hover transition-all",
        glass: "bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/30 text-primary dark:text-white hover:bg-white/80 dark:hover:bg-slate-900/70 hover:shadow-md hover:-translate-y-0.5",
        soft: "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 hover:shadow-sm",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg",
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5 py-2",
        lg: "h-12 px-7 py-3 text-base",
        xl: "h-14 px-8 py-3.5 text-lg",
        icon: "aspect-square p-2",
      },
      fullWidth: {
        true: "w-full",
      },
      animation: {
        subtle: "hover:-translate-y-0.5 hover:shadow-md",
        bounce: "active:scale-95 transition-transform",
        glow: "hover:shadow-md hover:shadow-brand-primary/20",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
      animation: "bounce",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

/**
 * Yeniden kullanılabilir ve tüm varyantları destekleyen buton bileşeni
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, isLoading, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          buttonVariants({ variant, size, fullWidth, className }),
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
