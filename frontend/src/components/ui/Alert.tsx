"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import {
  RiAlertLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
} from "react-icons/ri";
import type { AlertProps } from "@/types/components/Alert.type";
import { alertVariants } from "@/types/components/Alert.type";

<<<<<<< HEAD
=======
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-lg",
  {
    variants: {
      variant: {
        default:
          "bg-light-background-secondary text-light-text-primary border-light-border dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:border-dark-border [&>svg]:text-light-text-secondary dark:[&>svg]:text-dark-text-secondary",
        info: "bg-primary-50 text-primary-900 border-primary-200 dark:bg-primary-950/30 dark:text-primary-100 dark:border-primary-900 [&>svg]:text-primary-500",
        success:
          "bg-success-50 text-success-900 border-success-200 dark:bg-success-950/30 dark:text-success-100 dark:border-success-900 [&>svg]:text-success-500",
        warning:
          "bg-warning-50 text-warning-900 border-warning-200 dark:bg-warning-950/30 dark:text-warning-100 dark:border-warning-900 [&>svg]:text-warning-500",
        error:
          "bg-danger-50 text-danger-900 border-danger-200 dark:bg-danger-950/30 dark:text-danger-100 dark:border-danger-900 [&>svg]:text-danger-500",
      },
      dismissible: {
        true: "pr-8",
      },
    },
    defaultVariants: {
      variant: "default",
      dismissible: false,
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onDismiss?: () => void;
}

/**
 * Kullanıcıya bildirim göstermek için kullanılan uyarı bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, dismissible, onDismiss, children, ...props }, ref) => {
    // Varyanta göre görüntülenecek ikon
    const variantIcon = {
      default: <RiAlertLine />,
      info: <RiInformationLine />,
      success: <RiCheckLine />,
      warning: <RiAlertLine />,
      error: <RiErrorWarningLine />,
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={twMerge(alertVariants({ variant, dismissible, className }))}
        {...props}
      >
        {variant && variantIcon[variant]}
        {children}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
<<<<<<< HEAD
            className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
=======
            className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
            aria-label="Uyarıyı kapat"
          >
            <RiCloseLine className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = "Alert";

/**
 * Uyarı başlığı bileşeni
 */
const AlertTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h5
      ref={ref}
      className={twMerge(
        "mb-1 font-medium leading-none tracking-tight text-light-text-primary dark:text-dark-text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </h5>
  );
});

AlertTitle.displayName = "AlertTitle";

/**
 * Uyarı açıklama metni bileşeni
 */
const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={twMerge("text-sm text-light-text-secondary dark:text-dark-text-secondary [&_p]:leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  );
});

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
