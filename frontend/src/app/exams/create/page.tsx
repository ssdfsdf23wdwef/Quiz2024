"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import courseService from "@/services/course.service";
import quizService from "@/services/quiz.service";
import { LearningTarget } from "@/types/learningTarget";
import { FiArrowLeft, FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import {
  QuizGenerationOptions,
  QuizType,
  PersonalizedQuizType,
  DifficultyLevel,
} from "@/types/quiz";
import ErrorService from "@/services/error.service";

export default function CreateExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  // Form durumu
  const [quizType, setQuizType] = useState<QuizType>("quick");
  const [personalizedQuizType, setPersonalizedQuizType] =
    useState<PersonalizedQuizType | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [prioritizeWeakAndMediumTopics, setPrioritizeWeakAndMediumTopics] =
    useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [processingQuiz, setProcessingQuiz] = useState(false);

  // Kurs bilgilerini çek
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => (courseId ? courseService.getCourseById(courseId) : null),
    enabled: !!courseId,
  });

  // Kursun öğrenme hedeflerini çek
  const { data: relatedData, isLoading: relatedLoading } = useQuery({
    queryKey: ["courseRelated", courseId],
    queryFn: () =>
      courseId ? courseService.getCourseRelatedItems(courseId) : null,
    enabled: !!courseId,
  });

  // Öğrenme hedeflerini durumlara göre ayır
  const learningTargets = useMemo(
    () => relatedData?.learningTargets || [],
    [relatedData],
  );
  const pendingTargets = learningTargets.filter((t) => t.status === "pending");
  const failedTargets = learningTargets.filter((t) => t.status === "failed");
  const mediumTargets = learningTargets.filter((t) => t.status === "medium");
  // const masteredTargets = learningTargets.filter(t => t.status === 'mastered'); // Removed as unused

  // Zayıf/orta konular
  const weakAndMediumTargets = useMemo(
    () => [...failedTargets, ...mediumTargets],
    [failedTargets, mediumTargets],
  );

  // Quiz oluşturma mutation'ı
  const generateQuizMutation = useMutation({
    mutationFn: (options: QuizGenerationOptions) =>
      quizService.generateQuiz(options),
    onSuccess: (data: { id?: string }) => {
      // Başarılı olursa quiz sonuç sayfasına yönlendir
      if (data && data.id) {
        router.push(`/exams/${data.id}`);
      } else {
        setProcessingQuiz(false);
        ErrorService.showToast(
          "Sınav oluşturuldu ancak ID bilgisi alınamadı.",
          "warning",
        );
      }
    },
    onError: (error) => {
      setProcessingQuiz(false);
      ErrorService.showToast(
        "Sınav oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        "error",
      );
      console.error("Quiz oluşturma hatası:", error);
    },
  });

  // Kurs ID değiştiğinde personalized quiz tipini sıfırla
  useEffect(() => {
    if (!courseId) {
      router.replace("/courses");
      return;
    }

    // Personalized quiz tipini sıfırla
    setPersonalizedQuizType(null);

    // Seçili konuları sıfırla
    setSelectedTopics([]);
  }, [courseId, router]);

  // Quiz tipi değiştiğinde personalized quiz tipini sıfırla
  useEffect(() => {
    if (quizType !== "personalized") {
      setPersonalizedQuizType(null);
    } else if (!personalizedQuizType) {
      // Eğer personalized seçildi ama alt tip seçilmediyse, varsayılan olarak comprehensive seç
      setPersonalizedQuizType("comprehensive");
    }
  }, [quizType, personalizedQuizType]);

  // Personalized quiz tipi değiştiğinde seçili konuları güncelle
  useEffect(() => {
    // Zayıf/Orta odaklı seçildiğinde, zayıf ve orta konuları otomatik seç
    if (
      personalizedQuizType === "weakTopicFocused" &&
      weakAndMediumTargets.length > 0
    ) {
      setSelectedTopics(
        weakAndMediumTargets.map((t) => t.normalizedSubTopicName),
      );
    }
    // Yeni konu odaklı seçildiğinde, bekleyen konuları otomatik seç
    else if (
      personalizedQuizType === "newTopicFocused" &&
      pendingTargets.length > 0
    ) {
      setSelectedTopics(pendingTargets.map((t) => t.normalizedSubTopicName));
    }
    // Kapsamlı seçildiğinde, tüm konuları seç (varsayılan olarak)
    else if (personalizedQuizType === "comprehensive") {
      setSelectedTopics(learningTargets.map((t) => t.normalizedSubTopicName));
    }
  }, [
    personalizedQuizType,
    weakAndMediumTargets,
    pendingTargets,
    learningTargets,
  ]);

  // Konu seçimi işlemi
  const handleTopicToggle = (normalizedName: string) => {
    setSelectedTopics((prev) =>
      prev.includes(normalizedName)
        ? prev.filter((t) => t !== normalizedName)
        : [...prev, normalizedName],
    );
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (processingQuiz) return;

    // Sınav oluşturma seçenekleri
    const quizOptions: QuizGenerationOptions = {
      quizType,
      courseId: courseId || undefined,
      personalizedQuizType:
        quizType === "personalized" ? personalizedQuizType : null,
      selectedSubTopics: selectedTopics.length > 0 ? selectedTopics : undefined,
      preferences: {
        questionCount,
        difficulty,
        timeLimit: timeLimit || undefined,
        prioritizeWeakAndMediumTopics: prioritizeWeakAndMediumTopics,
      },
    };

    setProcessingQuiz(true);
    generateQuizMutation.mutate(quizOptions);
  };

  // Yükleniyor durumu
  const isLoading = courseLoading || relatedLoading;

  // Sınav modunun seçilebilirliğini kontrol et
  const canSelectWeakTopicFocused = weakAndMediumTargets.length > 0;
  const canSelectNewTopicFocused = pendingTargets.length > 0;

  if (!courseId) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Ders ID'si bulunamadı.</p>
        <Link href="/courses" className="text-indigo-600 hover:underline">
          Dersler sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-6"
        >
          <FiArrowLeft className="mr-2" /> Derse Dön
        </Link>

        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          {isLoading
            ? "Yükleniyor..."
            : `${course?.name || "Ders"} için Sınav Oluştur`}
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center my-12">
            <Spinner size="lg" />
          </div>
        ) : processingQuiz ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mt-4"
          >
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-20 h-20 relative mb-6">
                <div className="absolute top-0 right-0 bottom-0 left-0 animate-spin border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Sınav Oluşturuluyor
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
                Sorular hazırlanıyor. Lütfen bekleyin...
              </p>

              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mt-4">
                <motion.div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  initial={{ width: "10%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            {/* Sınav Türü Seçimi */}
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                Sınav Türü
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${
                    quizType === "quick"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => setQuizType("quick")}
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">
                    Hızlı Sınav
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tek belgeyi hızlıca değerlendir. Öğrenme hedeflerini
                    etkilemez.
                  </p>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer ${
                    quizType === "personalized"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => setQuizType("personalized")}
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">
                    Kişiselleştirilmiş Sınav
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Öğrenme hedeflerine göre özelleştirilmiş sınav. Hedeflerin
                    durumunu günceller.
                  </p>
                </div>
              </div>
            </div>

            {/* Kişiselleştirilmiş Sınav Alt Türleri */}
            {quizType === "personalized" && (
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                  Kişiselleştirilmiş Sınav Türü
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer ${
                      !canSelectWeakTopicFocused
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${
                      personalizedQuizType === "weakTopicFocused"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => {
                      if (canSelectWeakTopicFocused) {
                        setPersonalizedQuizType("weakTopicFocused");
                      }
                    }}
                  >
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">
                      Zayıf/Orta Odaklı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Başarısız veya orta seviyedeki konulara odaklanır.
                    </p>
                    {!canSelectWeakTopicFocused && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Zayıf veya orta seviyede konu bulunamadı.
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer ${
                      !canSelectNewTopicFocused
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${
                      personalizedQuizType === "newTopicFocused"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => {
                      if (canSelectNewTopicFocused) {
                        setPersonalizedQuizType("newTopicFocused");
                      }
                    }}
                  >
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">
                      Yeni Konu Odaklı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Henüz test edilmemiş (beklemede) konulara odaklanır.
                    </p>
                    {!canSelectNewTopicFocused && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Beklemede olan konu bulunamadı.
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer ${
                      personalizedQuizType === "comprehensive"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => setPersonalizedQuizType("comprehensive")}
                  >
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">
                      Kapsamlı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tüm konuları kapsayan genel bir sınav.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sınav Ayarları */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-4">
                Sınav Ayarları
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Soru Sayısı */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Soru Sayısı: {questionCount}
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Zorluk Seviyesi */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Zorluk Seviyesi
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as DifficultyLevel)
                    }
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                    <option value="mixed">Karışık</option>
                  </select>
                </div>

                {/* Zaman Sınırı */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Zaman Sınırı (dakika, opsiyonel)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={timeLimit || ""}
                    onChange={(e) =>
                      setTimeLimit(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="Sınırsız"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  />
                </div>

                {/* Kapsamlı Sınav için Öncelik Ayarı */}
                {quizType === "personalized" &&
                  personalizedQuizType === "comprehensive" && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="prioritizeWeakTopics"
                        checked={prioritizeWeakAndMediumTopics}
                        onChange={(e) =>
                          setPrioritizeWeakAndMediumTopics(e.target.checked)
                        }
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label
                        htmlFor="prioritizeWeakTopics"
                        className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        Başarısız ve Orta Konulara Öncelik Ver (%60 ağırlık)
                      </label>
                      <div className="ml-2 group relative">
                        <FiHelpCircle className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        <div className="absolute left-full ml-2 w-64 bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-xs text-gray-600 dark:text-gray-300 hidden group-hover:block z-10">
                          Bu seçenek, kapsamlı sınavda başarısız ve orta
                          seviyedeki konulara %60 ağırlık verir. Böylece zayıf
                          olduğunuz konulara daha fazla odaklanabilirsiniz.
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Konu Seçimi (Personalized - Comprehensive için) */}
            {quizType === "personalized" &&
              personalizedQuizType === "comprehensive" &&
              learningTargets.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">
                      Sınava Dahil Edilecek Konular
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTopics(
                            learningTargets.map(
                              (t) => t.normalizedSubTopicName,
                            ),
                          )
                        }
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Tümünü Seç
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTopics([])}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Hiçbirini Seçme
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {learningTargets.map((target) => (
                        <div key={target.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`topic-${target.id}`}
                            checked={selectedTopics.includes(
                              target.normalizedSubTopicName,
                            )}
                            onChange={() =>
                              handleTopicToggle(target.normalizedSubTopicName)
                            }
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`topic-${target.id}`}
                            className="ml-2 text-sm text-gray-700 dark:text-gray-200 flex items-center"
                          >
                            {target.subTopicName}
                            <span
                              className={`ml-2 inline-block w-2 h-2 rounded-full
                            ${target.status === "pending" && "bg-gray-400"}
                            ${target.status === "failed" && "bg-red-500"}
                            ${target.status === "medium" && "bg-yellow-500"}
                            ${target.status === "mastered" && "bg-green-500"}
                          `}
                            ></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedTopics.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      En az bir konu seçmelisiniz.
                    </p>
                  )}
                </div>
              )}

            {/* Gönder Butonu */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={
                  processingQuiz ||
                  (quizType === "personalized" && selectedTopics.length === 0)
                }
                className={`px-6 py-2 rounded-lg font-medium text-white 
                  ${
                    processingQuiz ||
                    (quizType === "personalized" && selectedTopics.length === 0)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }
                `}
              >
                Sınav Oluştur
              </button>
            </div>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
