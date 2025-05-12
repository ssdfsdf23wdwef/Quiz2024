"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CreateCoursePage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    courseName?: string;
    topics?: string;
  }>({});

  const addTopic = () => {
    if (!currentTopic.trim()) return;

    // Aynı konu adı zaten var mı kontrol et
    if (topics.includes(currentTopic.trim())) {
      setErrors((prev) => ({
        ...prev,
        topics: "Bu konu zaten eklenmiş.",
      }));
      return;
    }

    setTopics([...topics, currentTopic.trim()]);
    setCurrentTopic("");
    setErrors((prev) => ({ ...prev, topics: undefined }));
  };

  const removeTopic = (index: number) => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const validateForm = () => {
    const newErrors: {
      courseName?: string;
      topics?: string;
    } = {};

    if (!courseName.trim()) {
      newErrors.courseName = "Ders adı gereklidir.";
    }

    if (topics.length === 0) {
      newErrors.topics = "En az bir konu eklemelisiniz.";
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
      // Burada normalde Firebase Firestore kullanacaktık

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Başarılı kayıt sonrası courses sayfasına yönlendir
      router.push("/courses");
    } catch (error) {
      console.error("Ders oluşturma hatası:", error);
      alert("Ders oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center">
        <Link
          href="/courses"
          className="text-indigo-600 hover:text-indigo-800 mr-4"
        >
          <FiArrowLeft className="inline-block mr-1" /> Geri
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Yeni Ders Oluştur</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="courseName"
              className="block text-gray-700 text-sm font-medium mb-2"
            >
              Ders Adı
            </label>
            <input
              type="text"
              id="courseName"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.courseName ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Örn: İşletim Sistemleri"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
            {errors.courseName && (
              <p className="mt-1 text-sm text-red-600">{errors.courseName}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Konular
            </label>
            <div className="flex">
              <input
                type="text"
                className={`flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.topics ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Örn: Hafıza Yönetimi"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTopic();
                  }
                }}
              />
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                onClick={addTopic}
              >
                <FiPlus />
              </button>
            </div>
            {errors.topics && (
              <p className="mt-1 text-sm text-red-600">{errors.topics}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{topic}</span>
                  <button
                    type="button"
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                    onClick={() => removeTopic(index)}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Dersin içerdiği konuları ekleyin. Her bir konu için yazıp Enter
              tuşuna basın veya Ekle butonuna tıklayın.
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href="/courses"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mr-4"
            >
              İptal
            </Link>
            <button
              type="submit"
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-indigo-700"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Oluşturuluyor..." : "Ders Oluştur"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
