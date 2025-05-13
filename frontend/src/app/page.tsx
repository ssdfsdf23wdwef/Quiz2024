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
  FiBarChart2
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

  const handleStartExamCreation = () => {
    if (!isAuthenticated) {
      // Giriş yapmamış kullanıcıları login sayfasına yönlendir
      router.push("/auth/login?returnUrl=/exams/create");
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

  const handleViewCourses = () => {
    if (!isAuthenticated) {
      // Giriş yapmamış kullanıcıları login sayfasına yönlendir
      router.push("/auth/login?returnUrl=/courses");
      return;
    }
    router.push("/courses");
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
              </div>
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
