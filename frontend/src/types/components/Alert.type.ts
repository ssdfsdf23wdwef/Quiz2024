import { cva, type VariantProps } from "class-variance-authority";

export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-lg",
  {
    variants: {
      variant: {
        default:
          "bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 [&>svg]:text-gray-500 dark:[&>svg]:text-gray-400",
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
