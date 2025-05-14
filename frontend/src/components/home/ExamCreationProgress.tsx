import React from "react";

interface ExamCreationProgressProps {
  currentStep: number;
  totalSteps: number;
  quizType?: "quick" | "personalized"; // Opsiyonel sınav türü
}

const ExamCreationProgress: React.FC<ExamCreationProgressProps> = ({
  currentStep,
  totalSteps,
  quizType,
}) => (
  <div className="mb-10">
    <div className="flex items-center justify-between mb-2">
      <div className="w-full">
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
    {/* Step indicators can be added here if needed */}
    <div className="flex justify-between">
      <div
        className={`flex flex-col items-center ${
          currentStep >= 1
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-400 dark:text-gray-600"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 1
              ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
          }`}
        >
          1
        </div>
        <span className="text-xs mt-1">Dosya</span>
      </div>
      <div
        className={`flex flex-col items-center ${
          currentStep >= 2
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-400 dark:text-gray-600"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 2
              ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
          }`}
        >
          2
        </div>
        <span className="text-xs mt-1">
          {quizType === "personalized" ? "Odak/Konular" : "Konular"}
        </span>
      </div>
      <div
        className={`flex flex-col items-center ${
          currentStep >= 3
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-400 dark:text-gray-600"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 3
              ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
          }`}
        >
          3
        </div>
        <span className="text-xs mt-1">Tercihler</span>
      </div>
    </div>
  </div>
);

export default ExamCreationProgress;
