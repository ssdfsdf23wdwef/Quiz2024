"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlusSquare } from "react-icons/fi"; // Added FiPlusSquare
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <FiPlusSquare className="mx-auto text-5xl text-indigo-600 mb-3" />
          <h1 className="text-4xl font-bold text-gray-800">Yeni Ders Oluştur</h1>
          <p className="text-gray-600 mt-2">
            Yeni bir ders oluşturmak için lütfen ders adını girin.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/courses"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center transition-colors duration-300"
            >
              <FiArrowLeft className="mr-2 h-5 w-5" /> Kurs Listesine Geri Dön
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="courseName"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Ders Adı
              </label>
              <input
                type="text"
                id="courseName"
                className={`w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-300 shadow-sm hover:shadow-md ${
                  errors.courseName
                    ? "border-red-400 ring-red-300"
                    : "border-gray-300"
                }`}
                placeholder="Örn: İleri Seviye Matematik"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
              {errors.courseName && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.courseName}
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                href="/courses"
                className="w-full sm:w-auto px-6 py-3 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-300 text-center font-medium shadow-sm hover:shadow-md"
              >
                İptal
              </Link>
              <button
                type="submit"
                className={`w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
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
            </div>
          </form>
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          Bitirme Projesi - Course Management System &copy;{" "}
          {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
