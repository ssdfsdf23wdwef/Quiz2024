"use client";

import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { QuizPreferences } from "./types";
import {
  FiArrowRight,
  FiPlay,
  FiBook,
  FiTarget,
  FiBarChart2,
  FiUser,
  FiClock
} from "react-icons/fi";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

// Lazy loading ile bileşenleri yükle
const ExamCreationWizard = lazy(
  () => import("@/components/home/ExamCreationWizard"),
);

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
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
  },
};

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showExamCreationWizard, setShowExamCreationWizard] = useState(false);

  const handleStartQuickQuiz = () => {
    router.push("/exams/quick");
  };

  const handleStartPersonalizedQuiz = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?returnUrl=/exams/create?type=personalized");
      return;
    }
    setShowExamCreationWizard(true);
  };

  const handleExamCreationComplete = (result: {
    file: File | null;
    quizType: "quick" | "personalized";
    preferences: QuizPreferences;
  }) => {
    const url = `/exams/create?type=${result.quizType}&fileName=${encodeURIComponent(result.file?.name || "")}`;
    router.push(url);
  };
  
  const navigateTo = (path: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${path}`);
      return;
    }
    router.push(path);
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {showExamCreationWizard ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Suspense
              fallback={
                <div className="flex justify-center my-10">
                  <Spinner size="lg" />
                </div>
              }
            >
              <ExamCreationWizard onComplete={handleExamCreationComplete} />
            </Suspense>
          </motion.div>
        ) : (
          <>
            {/* Hero Section with Enhanced Gradient Background */}
            <motion.div
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
                        Yapay Zeka Destekli Quiz Platformu
                      </span>
                    </motion.div>

                    <motion.h1
                      custom={1}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.2)] tracking-tight leading-tight"
                    >
                      Kişiselleştirilmiş Quiz Platformu
                    </motion.h1>

                    <motion.p
                      custom={2}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="text-xl md:text-2xl text-indigo-100/90 mb-8 max-w-2xl mx-auto font-light leading-relaxed"
                    >
                      Bilgi seviyenizi ölçün, eksiklerinizi tespit edin ve öğrenme sürecinizi
                      kişiselleştirilmiş bir deneyimle optimize edin.
                    </motion.p>

                    {/* Quiz Türü Seçimi */}
                    <motion.div
                      custom={3}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="grid md:grid-cols-2 gap-6 mb-10 max-w-4xl mx-auto"
                    >
                      {/* Hızlı Sınav Kartı */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-blue-500/20 p-3 rounded-lg">
                            <FiClock className="text-white text-xl" />
                          </div>
                          <span className="text-xs text-indigo-100/70 px-2 py-1 bg-white/10 rounded-full">
                            Üyelik Gerektirmez
                          </span>
                        </div>
                        <h3 className="text-white text-xl font-medium mb-3">Hızlı Sınav</h3>
                        <p className="text-indigo-100/80 mb-4">
                          Üyelik gerektirmeden istediğiniz konuda bilgi seviyenizi hemen test edin. 
                          Seçtiğiniz alanda temel bilgilerinizi ölçmek için ideal.
                        </p>
                        <motion.button
                          onClick={handleStartQuickQuiz}
                          variants={buttonHover}
                          initial="rest"
                          whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white font-medium rounded-xl px-5 py-3 text-base transition-all duration-300"
                        >
                          <FiPlay className="text-lg" />
                          <span>Hızlı Sınav Başlat</span>
                        </motion.button>
                      </div>

                      {/* Kişiselleştirilmiş Sınav Kartı */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-purple-500/20 p-3 rounded-lg">
                            <FiUser className="text-white text-xl" />
                          </div>
                          <span className="text-xs text-indigo-100/70 px-2 py-1 bg-white/10 rounded-full">
                            {isAuthenticated ? "Premium Özellik" : "Giriş Gerektirir"}
                          </span>
                        </div>
                        <h3 className="text-white text-xl font-medium mb-3">Kişiselleştirilmiş Sınav</h3>
                        <p className="text-indigo-100/80 mb-4">
                          Öğrenme geçmişiniz, performansınız ve hedeflerinize göre tamamen size özel 
                          sınavlar oluşturun ve ilerlemenizi takip edin.
                        </p>
                        <motion.button
                          onClick={handleStartPersonalizedQuiz}
                          variants={buttonHover}
                          initial="rest"
                          whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl px-5 py-3 text-base transition-all duration-300"
                        >
                          <FiTarget className="text-lg" />
                          <span>{isAuthenticated ? "Kişiselleştirilmiş Sınav Oluştur" : "Giriş Yap ve Başla"}</span>
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Platformun Özellikleri */}
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
                        onClick={() => navigateTo('/courses')}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all cursor-pointer group"
                      >
                        <div className="bg-purple-500/20 p-3 rounded-lg inline-block mb-3">
                          <FiBook className="text-white text-xl" />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-2">Dersler</h3>
                        <p className="text-indigo-100/70 text-sm">Çalışma alanlarınızı yönetin ve içerik ekleyin</p>
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
                        <p className="text-indigo-100/70 text-sm">İlerlemenizi takip edin ve güçlü/zayıf yönlerinizi görün</p>
                        <FiArrowRight className="text-white/50 mt-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
