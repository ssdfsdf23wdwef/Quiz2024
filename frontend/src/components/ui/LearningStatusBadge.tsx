"use client";

import { FC } from "react";
import { LearningTargetStatus } from "@/types/learningTarget";
import { motion } from "framer-motion";
import { getStatusStyle } from "@/lib/statusConfig";

interface LearningStatusBadgeProps {
  status: LearningTargetStatus;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
}

const LearningStatusBadge: FC<LearningStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = "md",
  showLabel = true,
  animate = false,
}) => {
  const config = getStatusStyle(status);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  // Icon boyutunu belirle
  const iconSize =
    size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  // Animasyon varyantları
  const variants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  };

  return (
    <motion.span
      className={`inline-flex items-center rounded-full border ${config.bgColor} ${config.color} ${config.borderColor} ${sizeClasses[size]} font-medium`}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
      variants={animate ? variants : undefined}
    >
      {showIcon && (
        <span className="mr-1">
          <span className={iconSize}>{config.icon}</span>
        </span>
      )}
      {showLabel && config.label}
    </motion.span>
  );
};

export default LearningStatusBadge;
