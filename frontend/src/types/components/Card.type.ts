import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva("rounded-xl overflow-hidden transition-all duration-300", {
  variants: {
    variant: {
      default:
        "bg-elevated border border-primary/30 shadow-sm backdrop-blur-[2px]",
      flat: "bg-secondary",
      outline: "bg-transparent border border-primary/50",
      elevated: "bg-elevated shadow-md",
      glass: "bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/30",
      gradient: "bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-white/20 dark:border-slate-800/30",
    },
    padding: {
      none: "",
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
    hover: {
      true: "hover:shadow-lg hover:-translate-y-1 hover:border-brand-primary/30",
      subtle: "hover:shadow-md hover:-translate-y-0.5 hover:border-brand-primary/20",
      glow: "hover:shadow-lg hover:shadow-brand-primary/10 hover:-translate-y-0.5", 
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
    hover: "subtle",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}
