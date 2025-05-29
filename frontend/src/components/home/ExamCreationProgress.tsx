import React from "react";
import { FiBook, FiSettings, FiFileText, FiTarget, FiList } from "react-icons/fi";

interface ExamCreationProgressProps {
  currentStep: number;
  totalSteps: number;
  quizType?: "quick" | "personalized"; // Opsiyonel sınav türü
}

const ExamCreationProgress: React.FC<ExamCreationProgressProps> = ({
  currentStep,
  totalSteps,
  quizType,
}) => {
  // Hızlı sınav için 3 adım, kişiselleştirilmiş sınav için 5 adım göster
  const actualTotalSteps = quizType === "personalized" ? 5 : 3;
  
  return (
  <div className="mb-10 bg-elevated rounded-lg p-5 shadow-sm border border-border-secondary">
    <h3 className="text-lg font-semibold text-primary mb-5 flex items-center">
      <span className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2">
        <FiTarget className="text-brand-primary" />
      </span>
      Sınav Oluşturma İlerlemesi
    </h3>
    
    <div className="flex items-center justify-between mb-4">
      <div className="w-full">
        <div className="relative">
          <div className="overflow-hidden h-3 text-xs flex rounded-full bg-surface">
            <div
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              className="shadow-sm flex flex-col text-center whitespace-nowrap text-inverse justify-center bg-brand-primary transition-all duration-500 rounded-full"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-between px-2">
      {/* Ders Seçimi - Hızlı sınav için bu adım yok */}
      {quizType === "personalized" ? (
        <div
          className={`flex flex-col items-center ${
            currentStep >= 1
              ? "text-brand-primary"
              : "text-tertiary"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
              currentStep >= 1
                ? "bg-brand-primary text-white ring-2 ring-brand-primary/20"
                : "bg-surface text-tertiary border border-border-secondary"
            }`}
          >
            <FiBook className="w-4 h-4" />
          </div>
          <span className={`text-xs mt-2 font-medium ${currentStep >= 1 ? "text-primary" : "text-tertiary"}`}>Ders</span>
        </div>
      ) : null}

      {/* Sınav Türü - Sadece kişiselleştirilmiş sınav için */}
      {quizType === "personalized" ? (
        <div
          className={`flex flex-col items-center ${
            currentStep >= 2
              ? "text-brand-primary"
              : "text-tertiary"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
              currentStep >= 2
                ? "bg-brand-primary text-white ring-2 ring-brand-primary/20"
                : "bg-surface text-tertiary border border-border-secondary"
            }`}
          >
            <FiTarget className="w-4 h-4" />
          </div>
          <span className={`text-xs mt-2 font-medium ${currentStep >= 2 ? "text-primary" : "text-tertiary"}`}>Sınav Türü</span>
        </div>
      ) : null}

      {/* Dosya Yükleme */}
      <div
        className={`flex flex-col items-center ${
          currentStep >= (quizType === "personalized" ? 3 : 1)
            ? "text-brand-primary"
            : "text-tertiary"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
            currentStep >= (quizType === "personalized" ? 3 : 1)
              ? "bg-brand-primary text-white ring-2 ring-brand-primary/20"
              : "bg-surface text-tertiary border border-border-secondary"
          }`}
        >
          <FiFileText className="w-4 h-4" />
        </div>
        <span className={`text-xs mt-2 font-medium ${currentStep >= (quizType === "personalized" ? 3 : 1) ? "text-primary" : "text-tertiary"}`}>Dosya</span>
      </div>

      {/* Alt Konu Seçimi */}
      <div
        className={`flex flex-col items-center ${
          currentStep >= (quizType === "personalized" ? 4 : 2)
            ? "text-brand-primary"
            : "text-tertiary"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
            currentStep >= (quizType === "personalized" ? 4 : 2)
              ? "bg-brand-primary text-white ring-2 ring-brand-primary/20"
              : "bg-surface text-tertiary border border-border-secondary"
          }`}
        >
          <FiList className="w-4 h-4" />
        </div>
        <span className={`text-xs mt-2 font-medium ${currentStep >= (quizType === "personalized" ? 4 : 2) ? "text-primary" : "text-tertiary"}`}>Alt Konular</span>
      </div>

      {/* Tercihler */}
      <div
        className={`flex flex-col items-center ${
          currentStep >= (quizType === "personalized" ? 5 : 3)
            ? "text-brand-primary"
            : "text-tertiary"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
            currentStep >= (quizType === "personalized" ? 5 : 3)
              ? "bg-brand-primary text-white ring-2 ring-brand-primary/20"
              : "bg-surface text-tertiary border border-border-secondary"
          }`}
        >
          <FiSettings className="w-4 h-4" />
        </div>
        <span className={`text-xs mt-2 font-medium ${currentStep >= (quizType === "personalized" ? 5 : 3) ? "text-primary" : "text-tertiary"}`}>Tercihler</span>
      </div>
    </div>
  </div>
);
};

export default ExamCreationProgress;
