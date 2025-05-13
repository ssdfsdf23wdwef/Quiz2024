import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiInfo, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import { LearningTargetStatusLiteral, DetectedSubTopic } from "@/types";
import documentService from "@/services/document.service";

interface TopicDetectorProps {
  fileUrl: string;
  fileName?: string;
  onTopicsSelected: (selectedTopics: string[]) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
}

export default function TopicDetector({
  fileUrl,
  fileName,
  onTopicsSelected,
  onCancel,
  onError,
}: TopicDetectorProps) {
  // State tanımlamaları
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<DetectedSubTopic[]>([]);

  // Konu tespiti işlemi
  useEffect(() => {
    // Boş fileUrl kontrolü
    if (!fileUrl) {
      setError("Dosya URL'si bulunamadı.");
      setIsLoading(false);
      return;
    }

    const detectTopics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // API'den konuları getir
        // Not: Bu metod şu anda implementasyonu olmadığından, hata fırlatır
        // TODO: Gerçek API entegrasyonu tamamlandığında bu kısmı güncelle
        try {
          const detectedTopics = await documentService.detectTopics(fileUrl);
          setTopics(detectedTopics);
        } catch (e) {
          // Geçici olarak sahte veri kullan
          const mockTopics: DetectedSubTopic[] = [
            { 
              id: "topic1", 
              subTopicName: "Geçici Konu 1",
              normalizedSubTopicName: "gecici_konu_1",
              isSelected: true, 
              name: "Geçici Konu 1",
              status: "pending", 
              isNew: true 
            },
            { 
              id: "topic2", 
              subTopicName: "Geçici Konu 2",
              normalizedSubTopicName: "gecici_konu_2",
              isSelected: true,
              name: "Geçici Konu 2",
              status: "pending" 
            }
          ];
          setTopics(mockTopics);
        }
      } catch (error) {
        // Hata durumunu güncelle
        const errorMessage = (error as Error)?.message || "Bir hata oluştu.";
        setError(errorMessage);

        // Hata callback'ini çağır
        if (onError) {
          onError(errorMessage);
        }

        // Statik logError metodunu kullanalım
        console.error("Konu tespit hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Konu tespiti işlemini başlat
    detectTopics();
  }, [fileUrl, onError]);

  // Tüm konuları seçme/seçimi kaldırma
  const toggleAll = useCallback((select: boolean) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) => ({
        ...topic,
        isSelected: select,
      })),
    );
  }, []);

  // Tek bir konunun seçimini değiştirme
  const toggleTopic = useCallback((id: string) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, isSelected: !topic.isSelected } : topic,
      ),
    );
  }, []);

  // Seçilen konuları gönderme
  const handleConfirm = useCallback(() => {
    const selectedTopicIds = topics
      .filter((topic) => topic.isSelected)
      .map((topic) => topic.id);

    onTopicsSelected(selectedTopicIds);
  }, [topics, onTopicsSelected]);

  // Durum sınıfları
  const getStatusClass = useCallback((status?: LearningTargetStatusLiteral) => {
    switch (status) {
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "mastered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  }, []);

  // Hata durumu gösterimi
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              Konu Tespiti Başarısız
            </h2>
          </div>

          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-red-700 dark:text-red-300">
                {error ||
                  "Belgeden otomatik olarak konu çıkarılamadı. Lütfen farklı bir belge deneyin veya belgenin içeriğini kontrol edin."}
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Bu durumda aşağıdaki seçenekleri deneyebilirsiniz:
            </p>

            <ul className="list-disc pl-5 mb-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Farklı bir belge yüklemeyi deneyin</li>
              <li>
                Belgenizin formatını kontrol edin (PDF, Word veya metin dosyası
                olmalı)
              </li>
              <li>
                Belgenin içeriğini zenginleştirin veya daha açık ifadeler içeren
                bir belge deneyin
              </li>
              <li>
                Yüklediğiniz belgenin dili sisteminizin desteklediği diller
                arasında olduğundan emin olun
              </li>
            </ul>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={onCancel}
            >
              İptal
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Yükleniyor durumu
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Konular Tespit Ediliyor
            </h2>
          </div>

          <div className="p-6 flex flex-col items-center justify-center py-10">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 dark:border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Yapay zeka belgenizdeki konuları tespit ediyor...
            </p>
            {fileName && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                &quot;{fileName}&quot; dosyası analiz ediliyor
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Normal durum - konu seçim ekranı
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Konu Seçimi
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Belgenizde tespit edilen konuları seçin veya düzenleyin
          </p>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiInfo className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Bu liste yapay zeka tarafından oluşturulan{" "}
                  <strong>önerilerdir</strong>. Son seçim size aittir. Sınava
                  dahil etmek istediğiniz konuları seçili bırakın, dahil etmek
                  istemediklerinizin seçimini kaldırın.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Tespit Edilen Konular ({topics.filter((t) => t.isSelected).length}
              /{topics.length})
            </h3>

            <div className="flex space-x-3">
              <button
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={() => toggleAll(true)}
              >
                Tümünü Seç
              </button>
              <button
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                onClick={() => toggleAll(false)}
              >
                Tümünü Kaldır
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 max-h-80 overflow-y-auto">
            {topics.length === 0 ? (
              <div className="text-center py-12">
                <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Belgede tespit edilebilen konu bulunamadı.
                </p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  Farklı bir belge yüklemeyi veya konuları manuel olarak seçmeyi
                  deneyebilirsiniz.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {topics.map((topic) => (
                  <motion.li
                    key={topic.id}
                    className="py-3 flex items-center"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mr-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-600"
                          checked={topic.isSelected}
                          onChange={() => toggleTopic(topic.id)}
                        />
                      </label>
                    </div>

                    <div className="flex-grow">
                      <p className="text-gray-800 dark:text-gray-200">
                        {topic.name}
                      </p>
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      {topic.isNew ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          Yeni
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(topic.status)}`}
                        >
                          {topic.status || "Yeni"}
                        </span>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={onCancel}
          >
            İptal
          </button>

          <button
            className={`px-4 py-2 rounded-md text-white flex items-center ${
              topics.some((t) => t.isSelected)
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleConfirm}
            disabled={!topics.some((t) => t.isSelected)}
          >
            Devam Et <FiChevronRight className="ml-2" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
