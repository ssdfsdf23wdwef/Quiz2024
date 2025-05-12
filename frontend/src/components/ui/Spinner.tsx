"use client";

import { motion } from "framer-motion";

export default function Spinner({
  size = "md",
  color = "indigo",
}: {
  size?: "sm" | "md" | "lg";
  color?: "indigo" | "green" | "amber" | "red";
}) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorMap = {
    indigo: "border-indigo-600",
    green: "border-green-600",
    amber: "border-amber-600",
    red: "border-red-600",
  };

  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={`${sizeMap[size]} border-4 border-gray-200 rounded-full ${colorMap[color]} border-t-transparent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
