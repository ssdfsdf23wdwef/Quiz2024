"use client";

import { motion } from "framer-motion";

export default function Spinner({
  size = "md",
  color = "primary",
}: {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "error";
}) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorMap = {
    primary: "border-brand-primary",
    secondary: "border-brand-secondary",
    accent: "border-brand-accent",
    success: "border-state-success",
    warning: "border-state-warning",
    error: "border-state-error",
  };

  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={`${sizeMap[size]} border-4 border-primary/30 rounded-full ${colorMap[color]} border-t-transparent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
