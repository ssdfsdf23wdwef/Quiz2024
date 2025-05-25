import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva("rounded-lg overflow-hidden transition-all", {
  variants: {
    variant: {
      default:
        "bg-elevated border border-primary shadow-sm",
      flat: "bg-secondary",
      outline: "bg-transparent border border-primary",
      elevated: "bg-elevated shadow-md",
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
