"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const cardVariants = cva("rounded-lg overflow-hidden transition-all", {
  variants: {
    variant: {
      default:
        "bg-light-background dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border shadow-soft",
      flat: "bg-light-background dark:bg-dark-bg-secondary",
      outline: "bg-transparent border border-light-border dark:border-dark-border",
      elevated: "bg-light-background dark:bg-dark-bg-secondary shadow-md",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
    hover: {
      true: "hover:shadow-md hover:-translate-y-1",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
    hover: false,
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Yeniden kullanılabilir kart bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          cardVariants({ variant, padding, hover, className }),
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

/**
 * Kart başlığı bileşeni
 */
const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={twMerge("flex flex-col space-y-1.5 p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

/**
 * Kart başlığı metni bileşeni
 */
const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={twMerge(
        "font-semibold text-lg text-light-text-primary dark:text-dark-text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

/**
 * Kart açıklama metni bileşeni
 */
const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={twMerge("text-sm text-light-text-secondary dark:text-dark-text-secondary", className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

/**
 * Kart içerik alanı bileşeni
 */
const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={twMerge("p-4 pt-0", className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

/**
 * Kart alt alanı (footer) bileşeni
 */
const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={twMerge("flex items-center p-4 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
