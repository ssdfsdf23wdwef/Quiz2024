"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlusSquare, FiBookOpen } from "react-icons/fi"; // Added FiBookOpen
import Link from "next/link";
import { motion } from "framer-motion";
import courseService from "@/services/course.service"; // Import courseService

export default function CreateCoursePage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    courseName?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      courseName?: string;
    } = {};

    if (!courseName.trim()) {
      newErrors.courseName = "Ders adı gereklidir.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the courseService to create the course
      await courseService.createCourse({ name: courseName });

      // Başarılı kayıt sonrası courses sayfasına yönlendir
      router.push("/courses");
    } catch (error) {
      console.error("Ders oluşturma hatası:", error);
      // Display a more specific error message if possible
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "Lütfen tekrar deneyin.";
      setErrors((prev) => ({
        ...prev,
        courseName: `Ders oluşturulamadı: ${errorMessage}`,
      }));
      alert(`Ders oluşturulurken bir hata oluştu. ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-full shadow-lg mb-4">
            <FiBookOpen className="text-white text-4xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white">
            Yeni Ders Oluştur
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3 text-lg">
            Oluşturacağınız dersin adını girerek başlayın.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 md:p-10">
          <div className="mb-8">
            <Link
              href="/courses"
              className="inline-flex items-center text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition-colors duration-300 group"
            >
              <FiArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />{" "}
              Kurs Listesine Geri Dön
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="courseName"
                className="block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2.5"
              >
                Ders Adı
              </label>
              <div className="relative">
                <FiPlusSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl" />
                <input
                  type="text"
                  id="courseName"
                  className={`w-full pl-12 pr-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 transition-all duration-300 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 placeholder-slate-400 dark:placeholder-slate-500 ${
                    errors.courseName
                      ? "border-red-400 dark:border-red-500 ring-red-300 dark:ring-red-500/50"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                  placeholder="Örn: İleri Seviye Matematik"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  aria-describedby={
                    errors.courseName ? "courseName-error" : undefined
                  }
                />
              </div>
              {errors.courseName && (
                <p
                  id="courseName-error"
                  className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
                >
                  {errors.courseName}
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row-reverse justify-start gap-3 sm:gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg font-semibold text-base transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "transform hover:scale-105"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Oluşturuluyor...
                  </span>
                ) : (
                  "Dersi Oluştur"
                )}
              </button>
              <Link
                href="/courses"
                className="w-full sm:w-auto px-8 py-3 border border-slate-400 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 text-center font-semibold text-base shadow-sm hover:shadow-md transform hover:scale-105"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
        <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
          qQuiz Platformu &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
