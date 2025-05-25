import { cva, type VariantProps } from "class-variance-authority";

export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-lg",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-primary border-primary [&>svg]:text-secondary",
        info: "bg-state-info-bg text-primary border-state-info-border [&>svg]:text-state-info",
        success:
          "bg-state-success-bg text-primary border-state-success-border [&>svg]:text-state-success",
        warning:
          "bg-state-warning-bg text-primary border-state-warning-border [&>svg]:text-state-warning",
        error:
          "bg-state-error-bg text-primary border-state-error-border [&>svg]:text-state-error",
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
