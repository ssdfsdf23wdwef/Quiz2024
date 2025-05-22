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
            className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
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
        "mb-1 font-medium leading-none tracking-tight",
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
      className={twMerge("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  );
});

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
