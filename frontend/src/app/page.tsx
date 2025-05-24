"use client";

import { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from 'next/navigation';
import { QuizPreferences } from "@/types/quiz.type";
import { Quiz } from "@/types";
import {
  FiTarget,
  FiPlay,
  FiAward,
  FiArrowLeft,
  FiArrowRight,
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
      duration: 30,
      ease: "linear",
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
    boxShadow: "0 10px 25px -5px rgba(88, 28, 235, 0.5)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
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

  const handleStartQuickQuiz = () => {
    if (!isAuthenticated && !isAuthInitializing) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent('/exams/create?type=quick')}`, { scroll: false });
      return;
    }
    if (isAuthenticated && !isAuthInitializing) {
      updateWizardState(true, 'quick');
    }
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
    personalizedQuizType?: "weakTopicFocused" | "newTopicFocused" | "comprehensive";
    preferences: QuizPreferences;
    topicNameMap?: Record<string, string>;
    quiz?: Quiz;
    quizId?: string;
    documentId?: string;
    status?: 'success' | 'error';
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          {showExamCreationWizard ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 md:p-10"
            >
              <Suspense
                fallback={
                  <div className="flex justify-center my-6">
                    <Spinner size="lg" />
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
            </motion.div>
          ) : (
            <>
              <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 dark:from-sky-600 dark:via-indigo-600 dark:to-violet-700 shadow-2xl"
                variants={gradientVariants}
                initial="hidden"
                animate="visible"
                style={{
                  backgroundSize: "300% 300%",
                }}
              >
                <div className="absolute inset-0 bg-grid-white/[0.07] bg-[length:30px_30px]"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                
                <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-transparent to-black/10"></div>

                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent"></div>

                <motion.div
                  className="absolute w-72 h-72 rounded-full bg-white/15 blur-3xl"
                  animate={{
                    x: [0, 40, 0],
                    y: [0, -40, 0],
                    opacity: [0.5, 0.6, 0.5],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ top: "-15%", left: "10%" }}
                />

                <motion.div
                  className="absolute w-56 h-56 rounded-full bg-sky-400/20 blur-3xl"
                  animate={{
                    x: [0, -50, 0],
                    y: [0, 30, 0],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 13,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ bottom: "5%", right: "15%" }}
                />
                
                <motion.div
                  className="absolute w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl"
                  animate={{
                    x: [0, 60, 0],
                    y: [0, 60, 0],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ bottom: "20%", left: "25%" }}
                />

                <div className="relative py-14 md:py-20 px-6 md:px-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                      <motion.div
                        custom={0.5}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible" 
                        className="mb-3 inline-block"
                      >
                        <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-lg text-white text-sm font-medium border border-white/10 shadow-lg shadow-indigo-900/20">
                          Yapay Zeka Destekli Quiz Platformu
                        </span>
                      </motion.div>

                      <motion.h1
                        custom={1}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="text-3xl md:text-5xl font-bold mb-4 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.3)] tracking-tight leading-tight"
                      >
                        Kişiselleştirilmiş Quiz Platformu
                      </motion.h1>

                      <motion.p
                        custom={2}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="text-lg md:text-xl text-sky-100 dark:text-sky-200 mb-6 max-w-2xl mx-auto font-light leading-relaxed"
                      >
                        Bilgi seviyenizi ölçün, eksiklerinizi tespit edin ve öğrenme sürecinizi
                        kişiselleştirilmiş bir deneyimle optimize edin.
                      </motion.p>

                      <motion.div
                        custom={3}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto"
                      >
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all group transform perspective-1000">
                          <div className="flex justify-between items-start mb-3">
                            <div className="bg-sky-500/20 p-3 rounded-lg shadow-lg shadow-sky-500/10 border border-sky-500/10">
                              <FiClock className="text-white text-lg" />
                            </div>
                            <span className="text-xs text-sky-100/90 dark:text-sky-200/90 px-2.5 py-1 bg-white/10 rounded-full border border-white/10 shadow-sm">
                              Üyelik Gerektirmez
                            </span>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-sm">Hızlı Sınav</h3>
                          <p className="text-sky-100/90 dark:text-sky-200/90 mb-4 text-sm">
                            Üyelik gerektirmeden istediğiniz konuda bilgi seviyenizi hemen test edin. 
                            Seçtiğiniz alanda temel bilgilerinizi ölçmek için ideal.
                          </p>
                          <motion.button
                            onClick={() => updateWizardState(true, 'quick')}
                            variants={buttonHover}
                            whileHover="hover"
                            whileTap="rest"
                            className="inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-4 rounded-full bg-white/10 backdrop-blur-lg text-white font-medium text-lg sm:text-xl hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 mb-4"
                          >
                            <FiZap className="w-6 h-6 mr-2" />
                            Hızlı Sınav Oluştur
                          </motion.button>


                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all group transform perspective-1000">
                          <div className="flex justify-between items-start mb-3">
                            <div className="bg-indigo-500/20 p-3 rounded-lg shadow-lg shadow-indigo-500/10 border border-indigo-500/10">
                              <FiUser className="text-white text-lg" />
                            </div>
                            <span className="text-xs text-sky-100/90 dark:text-sky-200/90 px-2.5 py-1 bg-white/10 rounded-full border border-white/10 shadow-sm">
                              {isAuthenticated ? "Premium Özellik" : "Giriş Gerektirir"}
                            </span>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-sm">Kişiselleştirilmiş Sınav</h3>
                          <p className="text-sky-100/90 dark:text-sky-200/90 mb-4 text-sm">
                            Öğrenme geçmişiniz, performansınız ve hedeflerinize göre tamamen size özel 
                            sınavlar oluşturun ve ilerlemenizi takip edin.
                          </p>
                          <motion.button
                            onClick={() => handleStartPersonalizedQuiz()}
                            variants={buttonHover}
                            initial="rest"
                            whileHover="hover"
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium rounded-xl px-5 py-3 text-base transition-all duration-300 shadow-lg shadow-indigo-600/30 dark:shadow-indigo-700/30"
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
