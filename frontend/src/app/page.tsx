"use client";

import { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from 'next/navigation';
import { QuizPreferences } from "@/types/quiz.type";
import { Quiz } from "@/types";
import {
  FiTarget,
  FiUser,
  FiClock,
  FiZap
} from "react-icons/fi";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import QuickQuizWizard from "@/components/home/ExamCreationWizard.quick-quiz";
import PersonalizedQuizWizard from "@/components/home/ExamCreationWizard.personalized-quiz";

const gradientVariants = {
  hidden: {
    backgroundPosition: "0% 50%",
  },
  visible: {
    backgroundPosition: "100% 50%",
    transition: {
      repeat: Infinity,
      repeatType: "mirror" as const,
      duration: 20,
      ease: "easeInOut",
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.15,
      duration: 0.6,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

const buttonHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -2,
    boxShadow: "0 12px 25px -4px rgba(88, 28, 235, 0.5)",
    transition: { duration: 0.3, ease: "easeOut" }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" }
  }
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated, isInitializing: isAuthInitializing } = useAuth();
  const [showExamCreationWizard, setShowExamCreationWizard] = useState(false);
  const [currentQuizType, setCurrentQuizType] = useState<'quick' | 'personalized'>('quick');

  // Handle URL parameters on initial load
  useEffect(() => {
    const type = searchParams?.get('wizard');
    if (type === 'quick' || type === 'personalized') {
      setCurrentQuizType(type);
      setShowExamCreationWizard(true);
    }
  }, [searchParams]);

  // Update URL when wizard state changes
  const updateWizardState = (show: boolean, type: 'quick' | 'personalized') => {
    const params = new URLSearchParams(searchParams?.toString());
    
    if (show) {
      params.set('wizard', type);
    } else {
      params.delete('wizard');
    }
    
    // Update URL without causing a page refresh
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
    
    setCurrentQuizType(type);
    setShowExamCreationWizard(show);
  };


  const handleStartPersonalizedQuiz = () => {
    if (!isAuthenticated && !isAuthInitializing) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent('/exams/create?type=personalized')}`, { scroll: false });
      return;
    }
    if (isAuthenticated && !isAuthInitializing) {
      updateWizardState(true, 'personalized');
    }
  };

  const handleExamCreationComplete = (result: {
    file: File | null;
    quizType: "quick" | "personalized";
    personalizedQuizType?: "weakTopicFocused" | "newTopicFocused" | "comprehensive" | "learningObjectiveFocused";
    preferences: QuizPreferences;
    topicNameMap?: Record<string, string>;
    quiz?: Quiz;
    quizId?: string;
    documentId?: string;
    status?: 'success' | 'error';
    error?: Error;
  }) => {
    try {
      const params = new URLSearchParams();
      params.set("type", result.quizType);
      
      if (result.personalizedQuizType) {
        params.set("personalizedType", result.personalizedQuizType);
      }
      
      if (result.file) {
        params.set("fileName", encodeURIComponent(result.file.name));
      }

      if (result.quizId) {
        params.set("quizId", result.quizId);
      }

      if (result.documentId) {
        params.set("documentId", result.documentId);
      }
      
      console.log("Ana sayfada ExamCreationWizard tamamlandı, doğrudan quiz oluşturma API çağrısı yapılacak");
      
      if (result.quizId) {
        console.log(`Quiz ID mevcut (${result.quizId}), doğrudan sınav sayfasına yönlendiriliyor`);
  router.push(`/exams/${result.quizId}?mode=attempt`, { scroll: false });
        return;
      }
      
      const url = `/exams/create?${params.toString()}&startQuiz=true`;
      router.push(url, { scroll: false });
    } catch (error) {
      console.error("ExamCreationWizard tamamlama hatası:", error);
      const url = `/exams/create?type=${result.quizType}`;
      router.push(url, { scroll: false });
    }
  };
  
  if (isAuthInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-2 py-8 md:py-16 bg-transparent">
        <div className="w-full max-w-5xl mx-auto">
          {showExamCreationWizard ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Subtle background effects */}
              <div className="relative z-10">
                <Suspense
                  fallback={
                    <div className="flex justify-center my-4">
                      <Spinner size="lg" color="primary" />
                    </div>
                  }
                >
                {currentQuizType === 'quick' ? (
                  <QuickQuizWizard 
                    quizType={currentQuizType} 
                    onComplete={handleExamCreationComplete} 
                  />
                ) : (
                  <PersonalizedQuizWizard 
                    quizType={currentQuizType} 
                    onComplete={handleExamCreationComplete} 
                  />
                )}
                </Suspense>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-primary via-brand-secondary to-purple-600 shadow-2xl border border-white/20"
                variants={gradientVariants}
                initial="hidden"
                animate="visible"
                style={{ backgroundSize: "300% 300%" }}
              >
                <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
                <div className="absolute inset-0 bg-grid-white/[0.08] bg-[length:24px_24px]" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <div className="absolute inset-0 backdrop-blur-[2px] bg-gradient-to-b from-transparent to-black/10" />
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/15 to-transparent" />
                
                <motion.div
                  className="absolute w-60 h-60 rounded-full bg-brand-primary/20 blur-[80px]"
                  animate={{ x: [0, 30, 0], y: [0, -30, 0], opacity: [0.5, 0.7, 0.5], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  style={{ top: "-10%", left: "10%" }}
                />
                <motion.div
                  className="absolute w-48 h-48 rounded-full bg-blue-400/25 blur-[60px]"
                  animate={{ x: [0, -40, 0], y: [0, 20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 0.9, 1] }}
                  transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                  style={{ bottom: "5%", right: "15%" }}
                />
                <motion.div
                  className="absolute w-40 h-40 rounded-full bg-purple-500/20 blur-[70px]"
                  animate={{ x: [0, 40, 0], y: [0, 40, 0], opacity: [0.2, 0.5, 0.2], scale: [1.1, 0.95, 1.1] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                  style={{ bottom: "15%", left: "25%" }}
                />
                <motion.div
                  className="absolute w-32 h-32 rounded-full bg-cyan-300/15 blur-[50px]"
                  animate={{ x: [-15, 20, -15], y: [15, -15, 15], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                  style={{ top: "25%", right: "25%" }}
                />
                <div className="relative py-12 md:py-16 px-4 md:px-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                      <motion.div
                        custom={0.5}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="mb-4 inline-block"
                      >
                        <span className="px-4 py-1.5 rounded-full bg-white/25 backdrop-blur-xl text-white text-xs font-medium border border-white/20 shadow-md inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                          Yapay Zeka Destekli Quiz Platformu
                        </span>
                      </motion.div>
                      <motion.h1
                        custom={1}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="text-3xl md:text-5xl font-bold mb-4 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] tracking-tight leading-tight drop-shadow-lg bg-clip-text bg-gradient-to-r from-white to-blue-100"
                      >
                        Kişiselleştirilmiş Quiz Platformu
                      </motion.h1>
                      <motion.p
                        custom={2}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="text-base md:text-xl text-white/90 mb-6 max-w-xl mx-auto font-light leading-relaxed"
                      >
                        Bilgi seviyenizi ölçün, eksiklerinizi tespit edin ve öğrenme sürecinizi kişiselleştirilmiş bir deneyimle optimize edin.
                      </motion.p>
                      <motion.div
                        custom={3}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
                      >
                        <div className="bg-white/15 hover:bg-white/20 transition-all backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg group flex flex-col h-full relative overflow-hidden">
                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-70 pointer-events-none" />
                          
                          {/* Highlight effect */}
                          <div className="absolute -top-20 -right-20 w-36 h-36 bg-blue-400/20 blur-2xl rounded-full group-hover:bg-blue-400/30 transition-all duration-700 ease-in-out" />
                          
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="bg-sky-500/30 p-3 rounded-xl shadow-lg border border-sky-500/20 group-hover:scale-105 transition-transform duration-300">
                              <FiClock className="text-white text-lg" />
                            </div>
                            <span className="text-xs text-white/90 px-3 py-1.5 bg-white/15 rounded-full border border-white/20 shadow-sm backdrop-blur-md font-medium">
                              Üyelik Gerektirmez
                            </span>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-md group-hover:translate-x-1 transition-transform duration-300">Hızlı Sınav</h3>
                          <p className="text-white/85 mb-5 text-sm leading-relaxed">
                            Üyelik gerektirmeden istediğiniz konuda bilgi seviyenizi hemen test edin. Seçtiğiniz alanda temel bilgilerinizi ölçmek için ideal.
                          </p>
                          <motion.button
                            onClick={() => updateWizardState(true, 'quick')}
                            variants={buttonHover}
                            whileHover="hover"
                            whileTap="tap"
                            className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white/20 backdrop-blur-xl text-white font-medium text-base hover:bg-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 shadow-md border border-white/10"
                          >
                            <FiZap className="w-5 h-5 mr-2 animate-pulse" />
                            Hızlı Sınav Oluştur
                          </motion.button>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/20 to-blue-500/20 hover:from-purple-600/30 hover:to-blue-500/30 transition-all backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg group flex flex-col h-full relative overflow-hidden">
                          {/* Subtle animation effect */}
                          <motion.div 
                            className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[40px] rounded-full" 
                            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                          />
                          
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="bg-purple-500/30 p-3 rounded-xl shadow-lg border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                              <FiUser className="text-white text-lg" />
                            </div>
                            <span className="text-xs text-white/90 px-3 py-1.5 bg-white/15 rounded-full border border-white/20 shadow-sm backdrop-blur-md font-medium">
                              {isAuthenticated ? "Premium Özellik" : "Giriş Gerektirir"}
                            </span>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-md group-hover:translate-x-1 transition-transform duration-300">Kişiselleştirilmiş Sınav</h3>
                          <p className="text-white/85 mb-5 text-sm leading-relaxed">
                            Öğrenme geçmişiniz, performansınız ve hedeflerinize göre tamamen size özel sınavlar oluşturun ve ilerlemenizi takip edin.
                          </p>
                          <motion.button
                            onClick={() => handleStartPersonalizedQuiz()}
                            variants={buttonHover}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            className="mt-auto w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg px-6 py-3 text-base transition-all duration-300 shadow-md border border-white/10"
                          >
                            <FiTarget className="text-lg" />
                            <span>{isAuthenticated ? "Kişiselleştirilmiş Sınav Oluştur" : "Giriş Yap ve Başla"}</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
