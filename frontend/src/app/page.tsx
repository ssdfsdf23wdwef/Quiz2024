"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { QuizPreferences } from "@/types/quiz";
import { Quiz } from "@/types";
import {
  FiPlay,
  FiTarget,
  FiUser,
  FiClock
} from "react-icons/fi";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import ExamCreationWizard from "@/components/home/ExamCreationWizard";

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
  const { isAuthenticated } = useAuth();
  const [showExamCreationWizard, setShowExamCreationWizard] = useState(false);
  const [currentQuizType, setCurrentQuizType] = useState<"quick" | "personalized">("personalized");

  const handleStartQuickQuiz = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?returnUrl=/exams/create?type=quick");
      return;
    }
    setShowExamCreationWizard(true);
    setCurrentQuizType("quick");
  };

  const handleStartPersonalizedQuiz = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?returnUrl=/exams/create?type=personalized");
      return;
    }
    setShowExamCreationWizard(true);
    setCurrentQuizType("personalized");
  };

  const handleExamCreationComplete = (result: {
    file: File | null;
    quizType: "quick" | "personalized";
    personalizedQuizType?: "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive";
    preferences: QuizPreferences;
    topicNameMap?: Record<string, string>;
    quiz?: Quiz;
    quizId?: string;
    documentId?: string;
    status?: 'success' | 'error';
  }) => {
    try {
      // URL'e quiz türünü ve dosya adını ekle
      const params = new URLSearchParams();
      params.set("type", result.quizType);
      
      // Personalized quiz tipi varsa onu da ekle
      if (result.personalizedQuizType) {
        params.set("personalizedType", result.personalizedQuizType);
      }
      
      // Dosya adını ekle (varsa)
      if (result.file) {
        params.set("fileName", encodeURIComponent(result.file.name));
      }

      // Eğer quiz ID ve belge ID varsa ekle
      if (result.quizId) {
        params.set("quizId", result.quizId);
      }

      if (result.documentId) {
        params.set("documentId", result.documentId);
      }
      
      console.log("Ana sayfada ExamCreationWizard tamamlandı, doğrudan quiz oluşturma API çağrısı yapılacak");
      
      // Quiz ID varsa doğrudan sınav sayfasına yönlendir
      if (result.quizId) {
        console.log(`Quiz ID mevcut (${result.quizId}), doğrudan sınav sayfasına yönlendiriliyor`);
        router.push(`/exams/${result.quizId}?mode=attempt`);
        return;
      }
      
      // Quiz oluşturma sayfasına yönlendir
      const url = `/exams/create?${params.toString()}&startQuiz=true`;
      router.push(url);
    } catch (error) {
      console.error("ExamCreationWizard tamamlama hatası:", error);
      // Basit hata durumunda da quiz oluşturma sayfasına yönlendir
      const url = `/exams/create?type=${result.quizType}`;
      router.push(url);
    }
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-4">
        {showExamCreationWizard ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Suspense
              fallback={
                <div className="flex justify-center my-6">
                  <Spinner size="lg" />
                </div>
              }
            >
              <ExamCreationWizard 
                quizType={currentQuizType} 
                onComplete={handleExamCreationComplete} 
              />
            </Suspense>
          </motion.div>
        ) : (
          <>
            {/* Hero Section with Enhanced Gradient Background */}
            <motion.div
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-500 to-violet-600 dark:from-indigo-700 dark:via-purple-600 dark:to-violet-700 shadow-2xl"
              variants={gradientVariants}
              initial="hidden"
              animate="visible"
              style={{
                backgroundSize: "300% 300%",
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute inset-0 bg-grid-white/[0.07] bg-[length:30px_30px]"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              {/* Glass overlay */}
              <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-transparent to-black/10"></div>

              {/* Enhanced lighting effect */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent"></div>

              {/* Floating circles with better depth */}
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
                className="absolute w-56 h-56 rounded-full bg-purple-400/20 blur-3xl"
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
                      <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-lg text-white text-sm font-medium border border-white/10 shadow-lg shadow-purple-900/20">
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
                      className="text-lg md:text-xl text-indigo-100 mb-6 max-w-2xl mx-auto font-light leading-relaxed"
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
                      className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto"
                    >
                      {/* Hızlı Sınav Kartı */}
                      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all group transform perspective-1000">
                        <div className="flex justify-between items-start mb-3">
                          <div className="bg-blue-500/20 p-3 rounded-lg shadow-lg shadow-blue-500/10 border border-blue-500/10">
                            <FiClock className="text-white text-lg" />
                          </div>
                          <span className="text-xs text-indigo-100/90 px-2.5 py-1 bg-white/10 rounded-full border border-white/10 shadow-sm">
                            Üyelik Gerektirmez
                          </span>
                        </div>
                        <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-sm">Hızlı Sınav</h3>
                        <p className="text-indigo-100/90 mb-4 text-sm">
                          Üyelik gerektirmeden istediğiniz konuda bilgi seviyenizi hemen test edin. 
                          Seçtiğiniz alanda temel bilgilerinizi ölçmek için ideal.
                        </p>
                        <motion.button
                          onClick={handleStartQuickQuiz}
                          variants={buttonHover}
                          initial="rest"
                          whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl px-5 py-3 text-base transition-all duration-300 shadow-lg shadow-blue-600/30"
                        >
                          <FiPlay className="text-lg" />
                          <span>Hızlı Sınav Başlat</span>
                        </motion.button>
                      </div>

                      {/* Kişiselleştirilmiş Sınav Kartı */}
                      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all group transform perspective-1000">
                        <div className="flex justify-between items-start mb-3">
                          <div className="bg-purple-500/20 p-3 rounded-lg shadow-lg shadow-purple-500/10 border border-purple-500/10">
                            <FiUser className="text-white text-lg" />
                          </div>
                          <span className="text-xs text-indigo-100/90 px-2.5 py-1 bg-white/10 rounded-full border border-white/10 shadow-sm">
                            {isAuthenticated ? "Premium Özellik" : "Giriş Gerektirir"}
                          </span>
                        </div>
                        <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-sm">Kişiselleştirilmiş Sınav</h3>
                        <p className="text-indigo-100/90 mb-4 text-sm">
                          Öğrenme geçmişiniz, performansınız ve hedeflerinize göre tamamen size özel 
                          sınavlar oluşturun ve ilerlemenizi takip edin.
                        </p>
                        <motion.button
                          onClick={handleStartPersonalizedQuiz}
                          variants={buttonHover}
                          initial="rest"
                          whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium rounded-xl px-5 py-3 text-base transition-all duration-300 shadow-lg shadow-purple-600/30"
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
    </PageTransition>
  );
}
