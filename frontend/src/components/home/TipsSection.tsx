"use client";

import React from "react";
import { FiAward } from "react-icons/fi";
import { motion } from "framer-motion";

interface TipsSectionProps {
  tip?: string;
  onCreateQuiz?: () => void;
  severity?: "info" | "warning" | "success";
}

export default function TipsSection({
  tip = "İşletim Sistemleri: 'Senkronizasyon' konusunda performansınızı artırmak için pratik yapın!",
  onCreateQuiz,
  severity = "info",
}: TipsSectionProps) {
  const bgColors = {
    info: "bg-blue-50 dark:bg-blue-900/20",
    warning: "bg-amber-50 dark:bg-amber-900/20",
    success: "bg-green-50 dark:bg-green-900/20",
  };

  const borderColors = {
    info: "border-blue-100 dark:border-blue-800",
    warning: "border-amber-100 dark:border-amber-800",
    success: "border-green-100 dark:border-green-800",
  };

  const iconColors = {
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-green-600 dark:text-green-400",
  };

  return (
    <div
      className={`rounded-lg border shadow-sm ${bgColors[severity]} ${borderColors[severity]} overflow-hidden`}
    >
      <div className="p-5">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <FiAward className={`w-6 h-6 ${iconColors[severity]}`} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
              Öğrenme İpucu
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{tip}</p>
          </div>
        </div>

        <div className="mt-1">
          <h4 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-2">
            Popüler Konular
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Veri Yapıları
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                25 sınav tamamlandı
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Algoritma Analizi
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                18 sınav tamamlandı
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {onCreateQuiz && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
            onClick={onCreateQuiz}
          >
            Sınav Oluştur
          </motion.button>
        )}
      </div>
    </div>
  );
}
