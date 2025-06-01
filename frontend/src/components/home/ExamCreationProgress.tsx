import React from "react";
import { FiBook, FiSettings, FiFileText, FiTarget, FiList, FiCheckCircle } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";
import "./tooltip.css";

interface ExamCreationProgressProps {
  currentStep: number;
  totalSteps: number;
  quizType?: "quick" | "personalized";
  onStepClick?: (step: number) => void; // Adıma tıklandığında çağrılacak fonksiyon
  children?: React.ReactNode; // İçerik alanı için children prop'u
}

const ExamCreationProgress: React.FC<ExamCreationProgressProps> = ({
  currentStep,
  totalSteps,
  quizType = "quick",
  onStepClick,
  children
}) => {
  // Hızlı sınav için 3 adım, kişiselleştirilmiş sınav için 5 adım
  const actualTotalSteps = quizType === "personalized" ? 5 : 3;
  
  // Adım başlıkları
  const stepTitles = {
    personalized: [
      "Ders Seçimi",
      "Sınav Türü",
      "Dosya Yükleme",
      "Alt Konular",
      "Tercihler"
    ],
    quick: [
      "Dosya Yükleme",
      "Alt Konular",
      "Tercihler"
    ]
  };

  // Adım ikonları
  const stepIcons = {
    personalized: [
      <FiBook key="book" className="w-5 h-5" />,
      <FiTarget key="target" className="w-5 h-5" />,
      <FiFileText key="file" className="w-5 h-5" />,
      <FiList key="list" className="w-5 h-5" />,
      <FiSettings key="settings" className="w-5 h-5" />
    ],
    quick: [
      <FiFileText key="file" className="w-5 h-5" />,
      <FiList key="list" className="w-5 h-5" />,
      <FiSettings key="settings" className="w-5 h-5" />
    ]
  };

  // Geçerli adım başlığı
  const currentStepTitle = quizType === "personalized" 
    ? stepTitles.personalized[currentStep - 1] 
    : stepTitles.quick[currentStep - 1];

  // Adıma tıklama işleyicisi
  const handleStepClick = (step: number) => {
    // Sadece tamamlanmış adımlara tıklanabilir
    if (step < currentStep && onStepClick) {
      onStepClick(step);
    }
  };

  // Tema durumunu al
  const { isDarkMode } = useTheme();

  return (
    <div className="flex w-full h-full">
      {/* Sol taraf - Adım listesi */}
      <div className={`w-64 p-5 flex flex-col ${isDarkMode ? 'bg-gray-900 shadow-lg' : 'bg-gray-50 shadow-md'}`}>
        <h2 className="text-lg font-semibold mb-6 text-primary">Sınav Oluşturma</h2>
        
        <div className="flex flex-col space-y-1 flex-grow">
          {/* Adım listesi */}
          {(quizType === "personalized" ? stepTitles.personalized : stepTitles.quick).map((title, index) => {
            // Adım numarası (1-tabanlı)
            const stepNumber = index + 1;
            // Adımın durumu (tamamlandı, aktif, bekliyor)
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;
            
            return (
              <div 
                key={`step-${stepNumber}`}
                onClick={() => handleStepClick(stepNumber)}
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${isCompleted ? "cursor-pointer hover:bg-surface" : isActive ? "bg-surface" : "opacity-60"}`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${isCompleted ? "bg-green-500 text-white" : isActive ? "bg-brand-primary text-white ring-2 ring-brand-primary/20" : "bg-surface text-tertiary border border-border-secondary"}`}
                >
                  {isCompleted ? (
                    <FiCheckCircle className="w-5 h-5" />
                  ) : (
                    quizType === "personalized" ? stepIcons.personalized[index] : stepIcons.quick[index]
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium ${isActive ? "text-primary" : isCompleted ? "text-primary" : "text-tertiary"}`}>
                    {title}
                  </span>
                  <span className="text-xs text-tertiary">
                    {isCompleted ? "Tamamlandı" : isActive ? "Devam Ediyor" : "Bekliyor"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* İlerleme bilgisi */}
        <div className="mt-auto pt-4">
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Sağ taraf - İçerik alanı */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">{currentStepTitle}</h1>
          <p className="text-tertiary">
            {currentStep === 1 && quizType === "quick" && "Sınav oluşturmak için bir dosya yükleyin."}
            {currentStep === 1 && quizType === "personalized" && "Sınav oluşturmak için bir ders seçin."}
            {currentStep === 2 && quizType === "personalized" && "Oluşturmak istediğiniz sınav türünü seçin."}
            {currentStep === (quizType === "personalized" ? 3 : 1) && "Konuları tespit etmek için bir dosya yükleyin."}
            {currentStep === (quizType === "personalized" ? 4 : 2) && "Sınavda yer alacak alt konuları seçin."}
            {currentStep === (quizType === "personalized" ? 5 : 3) && "Sınav tercihlerinizi belirleyin."}
          </p>
        </div>
        
        {/* İçerik alanı */}
        <div className="bg-elevated rounded-lg p-6 border border-border-secondary shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExamCreationProgress;
