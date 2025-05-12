"use client";

import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";

interface TouchFeedbackProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  whileHover?: string | TargetAndTransition;
  whileTap?: string | TargetAndTransition;
  scaleFactor?: number;
}

export default function TouchFeedback({
  children,
  className = "",
  onClick,
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
  scaleFactor = 0.97,
}: TouchFeedbackProps) {
  const [isTouched, setIsTouched] = useState(false);

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };

  return (
    <motion.div
      className={`touch-feedback ${className}`}
      whileHover={whileHover}
      whileTap={whileTap}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      animate={{
        scale: isTouched ? scaleFactor : 1,
        transition: { duration: 0.1 },
      }}
      style={{
        willChange: "transform",
        WebkitTapHighlightColor: "transparent",
        transform: "translateZ(0)",
      }}
    >
      {children}
    </motion.div>
  );
}
