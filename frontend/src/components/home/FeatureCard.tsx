"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  buttonText: string;
  buttonColor?: "primary" | "success" | "orange";
  onClick: () => void;
}

export default function FeatureCard({
  icon,
  title,
  buttonText,
  buttonColor = "primary",
  onClick,
}: FeatureCardProps) {
  const buttonColors = {
    primary: "bg-indigo-600 hover:bg-indigo-700",
    success: "bg-green-600 hover:bg-green-700",
    orange: "bg-orange-500 hover:bg-orange-600",
  };

  return (
    <motion.div
      className="bg-white rounded-lg p-6 shadow-md flex flex-col items-center"
      whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-5xl text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-medium text-gray-800 mb-4">{title}</h3>
      <motion.button
        className={`mt-auto py-2 px-4 rounded-md text-white font-medium ${buttonColors[buttonColor]}`}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
}
