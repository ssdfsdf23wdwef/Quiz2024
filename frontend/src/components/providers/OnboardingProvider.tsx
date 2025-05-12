import React, { createContext, useContext, useState, ReactNode } from "react";
import Joyride, { CallBackProps, Step } from "react-joyride";

interface OnboardingContextType {
  startTour: () => void;
  isTourRunning: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const steps: Step[] = [
  {
    target: "#course-area",
    content:
      "Ders(Çalışma Alanı) seçimi ile tüm ilerlemenizi bu alanda takip edebilirsiniz.",
    title: "Ders Alanı",
    disableBeacon: true,
  },
  {
    target: "#document-upload",
    content:
      "Belge yükleyerek sistemin sizin için otomatik konu ve hedef çıkarmasını sağlayabilirsiniz.",
    title: "Belge Yükleme",
  },
  {
    target: "#topic-selection",
    content:
      "Konu Seçim Ekranı ile hangi konulara odaklanmak istediğinizi belirleyin.",
    title: "Konu Seçimi",
  },
  {
    target: "#learning-goal-status",
    content:
      "Her öğrenme hedefinin 4 seviyeli bir durumu vardır: Beklemede, Başarısız, Orta, Başarılı.",
    title: "Öğrenme Hedefi Durumları",
  },
  {
    target: "#quiz-types",
    content:
      "Farklı sınav türleriyle (Hızlı, Kişiselleştirilmiş, Yeni, Kapsamlı) kendinizi test edebilirsiniz.",
    title: "Sınav Türleri",
  },
  {
    target: "#dashboard",
    content: "Öğrenme Takip Paneli ile tüm ilerlemenizi grafiklerle izleyin.",
    title: "Öğrenme Takip Paneli",
  },
];

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [run, setRun] = useState(false);

  const startTour = () => setRun(true);
  const handleJoyrideCallback = (data: CallBackProps) => {
    if (data.status === "finished" || data.status === "skipped") {
      setRun(false);
    }
  };

  return (
    <OnboardingContext.Provider value={{ startTour, isTourRunning: run }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        locale={{
          back: "Geri",
          close: "Kapat",
          last: "Son",
          next: "İleri",
          skip: "Atla",
        }}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: "#4054B2",
          },
        }}
      />
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};
