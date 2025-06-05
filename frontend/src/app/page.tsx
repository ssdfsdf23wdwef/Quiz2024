"use client";

import { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from 'next/navigation';
import { QuizPreferences } from "@/types/quiz.type";
import { Quiz } from "@/types";
import {
<<<<<<< HEAD
  FiTarget,
  FiUser,
  FiClock,
  FiZap
=======
  FiArrowRight,
  FiPlay,
  FiBook,
  FiTarget,
  FiBarChart2
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
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
<<<<<<< HEAD
      ease: "easeInOut",
=======
      ease: "linear",
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
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
<<<<<<< HEAD
    scale: 1.03,
    y: -2,
    boxShadow: "0 12px 25px -4px rgba(88, 28, 235, 0.5)",
    transition: { duration: 0.3, ease: "easeOut" }
=======
    scale: 1.05,
    boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
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
  
<<<<<<< HEAD
  if (isAuthInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-primary">
        <Spinner size="lg" />
      </div>
    );
  }
=======
  const navigateTo = (path: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${path}`);
      return;
    }
    router.push(path);
  };
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96

  return (
    <PageTransition>
      <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-2 py-8 md:py-16 bg-transparent">
        <div className="w-full max-w-5xl mx-auto">
          {showExamCreationWizard ? (
            <motion.div
<<<<<<< HEAD
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
=======
              className="relative overflow-hidden rounded-3xl mb-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-700 dark:via-purple-700 dark:to-blue-700 shadow-2xl shadow-indigo-500/20"
              variants={gradientVariants}
              initial="hidden"
              animate="visible"
              style={{
                backgroundSize: "300% 300%",
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute inset-0 bg-grid-white/[0.06] bg-[length:30px_30px]"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              
              {/* Glass overlay */}
              <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-transparent to-black/10"></div>

              {/* Floating circles */}
              <motion.div
                className="absolute w-72 h-72 rounded-full bg-white/10 blur-3xl"
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
                className="absolute w-56 h-56 rounded-full bg-purple-500/20 blur-3xl"
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
                className="absolute w-48 h-48 rounded-full bg-blue-500/15 blur-3xl"
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

              <div className="relative py-20 md:py-28 px-6 md:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center">
                    <motion.div
                      custom={0.5}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible" 
                      className="mb-4 inline-block"
                    >
                      <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium">
                        Yapay Zeka Destekli Öğrenme Platformu
                      </span>
                    </motion.div>

                    <motion.h1
                      custom={1}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.2)] tracking-tight leading-tight"
                    >
                      Kişiselleştirilmiş Öğrenme Platformu
                    </motion.h1>

                    <motion.p
                      custom={2}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="text-xl md:text-2xl text-indigo-100/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
                    >
                      Kişisel öğrenme materyallerinizden yapay zeka destekli,
                      kişiselleştirilmiş sınavlar oluşturun ve öğrenme
                      hedeflerinizi takip edin.
                    </motion.p>

                    <motion.div
                      custom={3}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="flex justify-center items-center gap-4 flex-wrap mb-10"
                    >
                      <motion.button
                        onClick={handleStartExamCreation}
                        variants={buttonHover}
                        initial="rest"
                        whileHover="hover"
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-3 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold rounded-xl px-8 py-4 md:py-5 md:px-10 text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-50 to-white z-0 opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                        <span className="relative z-10 flex items-center">
                          <FiPlay className="text-2xl text-indigo-600 mr-2" />
                          <span>Sınav Oluştur</span>
                        </span>
                        <motion.span
                          className="relative z-10 ml-1"
                          animate={{ x: [0, 5, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                          }}
                        >
                          <FiArrowRight className="text-xl text-indigo-600" />
                        </motion.span>
                      </motion.button>

                      <motion.button
                        onClick={handleViewCourses}
                        variants={buttonHover}
                        initial="rest"
                        whileHover="hover"
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 bg-indigo-100/20 backdrop-blur-md text-white hover:bg-indigo-100/30 font-medium rounded-xl px-6 py-4 md:py-5 md:px-8 text-lg transition-all duration-300 border border-white/20"
                      >
                        <FiBook className="text-xl" />
                        <span>Derslerim</span>
                      </motion.button>
                    </motion.div>
                    
                    {/* Feature Cards */}
                    <motion.div
                      custom={4}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 max-w-4xl mx-auto"
                    >
                      <div 
                        onClick={() => navigateTo('/learning-goals')}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all cursor-pointer group"
                      >
                        <div className="bg-indigo-500/20 p-3 rounded-lg inline-block mb-3">
                          <FiTarget className="text-white text-xl" />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-2">Öğrenme Hedefleri</h3>
                        <p className="text-indigo-100/70 text-sm">Kişisel öğrenme hedeflerinizi belirleyin ve takip edin</p>
                        <FiArrowRight className="text-white/50 mt-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                      
                      <div 
                        onClick={() => navigateTo('/exams')}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all cursor-pointer group"
                      >
                        <div className="bg-purple-500/20 p-3 rounded-lg inline-block mb-3">
                          <FiPlay className="text-white text-xl" />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-2">Sınavlar</h3>
                        <p className="text-indigo-100/70 text-sm">Kişiselleştirilmiş sınavlarla bilginizi test edin</p>
                        <FiArrowRight className="text-white/50 mt-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                      
                      <div 
                        onClick={() => navigateTo('/performance')}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all cursor-pointer group"
                      >
                        <div className="bg-blue-500/20 p-3 rounded-lg inline-block mb-3">
                          <FiBarChart2 className="text-white text-xl" />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-2">Performans</h3>
                        <p className="text-indigo-100/70 text-sm">İlerlemenizi takip edin ve geliştirin</p>
                        <FiArrowRight className="text-white/50 mt-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </div>
                </div>
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
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
