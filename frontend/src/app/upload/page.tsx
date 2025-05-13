"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiUpload, FiFile, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import courseService from "@/services/course.service";
import PageTransition from "@/components/transitions/PageTransition";
import Spinner from "@/components/ui/Spinner";
import ErrorService from "@/services/error.service";
import { useAuth } from "@/hooks/auth/useAuth";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { user, idToken } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [processingFile, setProcessingFile] = useState<boolean>(false);

  // Kurs bilgilerini çek
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => (courseId ? courseService.getCourseById(courseId) : null),
    enabled: !!courseId,
  });

  // Dosya yükleme mutation'ı
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      setUploadProgress(0);

      // FormData oluştur
      const formData = new FormData();
      formData.append("file", file);

      if (courseId) {
        formData.append("courseId", courseId);
      }

      // Dosya yükleme işlemi
      return new Promise<{ id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(
          "POST",
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/upload`,
        );

        // Auth header ekle
        if (idToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
        }

        // İlerleme takibi
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        // Yükleme tamamlandığında
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploading(false);
            setProcessingFile(true);

            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Sunucu yanıtı işlenemedi"));
            }
          } else {
            setUploading(false);
            reject(new Error(`Yükleme hatası: ${xhr.status}`));
          }
        };

        // Hata durumunda
        xhr.onerror = () => {
          setUploading(false);
          reject(new Error("Ağ hatası oluştu"));
        };

        // İstek gönder
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      // Dosya işleme tamamlandığında
      setTimeout(() => {
        setProcessingFile(false);
        router.push(`/courses/${courseId}`);
        ErrorService.showToast(
          "Dosya başarıyla yüklendi ve işlendi!",
          "success",
        );
      }, 2000);
    },
    onError: (error) => {
      setUploading(false);
      setProcessingFile(false);
      ErrorService.showToast(
        "Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        "error",
      );
      console.error("Dosya yükleme hatası:", error);
    },
  });

  // Dosya seçme işlemi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Dosya seçme butonunu tetikle
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Seçilen dosyayı kaldır
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Dosya yükleme işlemini başlat
  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  // Dosya boyutunu formatla
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!courseId) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Ders ID&apos;si bulunamadı.</p>
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
          {courseLoading
            ? "Yükleniyor..."
            : `${course?.name || "Ders"} için Dosya Yükle`}
        </h1>

        {courseLoading ? (
          <div className="flex justify-center items-center my-12">
            <Spinner size="lg" />
          </div>
        ) : processingFile ? (
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
                Dosya İşleniyor
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
                Dosyanız yüklendi ve şimdi içerik çıkarılıyor. Bu işlem dosya
                boyutuna bağlı olarak biraz zaman alabilir.
              </p>

              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mt-4">
                <motion.div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  initial={{ width: "10%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                Dosya Yükleme
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                PDF, DOCX, PPTX veya TXT formatındaki dosyalarınızı
                yükleyebilirsiniz. Sistem, dosyanızdan öğrenme hedeflerini
                otomatik olarak çıkaracaktır.
              </p>
            </div>

            {/* Dosya seçme alanı */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                selectedFile
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-300 dark:border-gray-700"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              onClick={selectedFile ? undefined : triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.pptx,.txt"
                disabled={uploading}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full mb-4">
                    <FiFile
                      className="text-indigo-600 dark:text-indigo-400"
                      size={32}
                    />
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {formatFileSize(selectedFile.size)}
                  </p>

                  {!uploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedFile();
                      }}
                      className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <FiTrash2 className="mr-1" />
                      <span>Dosyayı Kaldır</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center cursor-pointer">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                    <FiUpload
                      className="text-gray-600 dark:text-gray-400"
                      size={32}
                    />
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                    Dosya Seçin veya Buraya Sürükleyin
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PDF, DOCX, PPTX, TXT (maks. 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Yükleme ilerleme çubuğu */}
            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    Yükleniyor...
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Yükleme butonu */}
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`w-full py-2 px-4 rounded-lg font-medium ${
                  !selectedFile || uploading
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {uploading ? "Yükleniyor..." : "Dosyayı Yükle"}
              </button>
            </div>

            {/* Bilgi notu */}
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="mb-2 font-medium">Desteklenen Dosya Formatları:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>PDF (.pdf) - Ders notları, makaleler</li>
                <li>Word (.docx) - Ders dokümanları, özetler</li>
                <li>PowerPoint (.pptx) - Sunumlar, slaytlar</li>
                <li>Metin (.txt) - Düz metin dokümanları</li>
              </ul>
              <p className="mt-3">
                Yüklediğiniz dosya, içeriğindeki konulara göre öğrenme hedefleri
                oluşturmak için analiz edilecektir.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
