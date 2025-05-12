"use client";

import Link from "next/link";
import { FiFileText, FiUpload, FiList } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import courseService from "@/services/course.service";
import type { Course } from "@/types/course";
import { LearningTarget } from "@/types/learningTarget";
import Spinner from "@/components/ui/Spinner";

interface CourseDetailProps {
  params: { courseId: string };
}

export default function CourseDetailPage({
  params: { courseId },
}: CourseDetailProps) {
  // Kurs bilgilerini çek
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  });

  // Kursun alt konularını (learning targets) çek
  const {
    data: relatedData,
    isLoading: relatedLoading,
    error: relatedError,
  } = useQuery({
    queryKey: ["courseRelated", courseId],
    queryFn: () => courseService.getCourseRelatedItems(courseId),
    enabled: !!courseId,
  });

  const isLoading = courseLoading || relatedLoading;
  const error = courseError || relatedError;
  const learningTargets = relatedData?.learningTargets || [];

  // Durum sayılarını hesapla
  const statusCounts = learningTargets.reduce(
    (acc, target) => {
      acc[target.status] = (acc[target.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Ders yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-10">Ders bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
          {course.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {course.description || "Bu ders için açıklama bulunmuyor."}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Oluşturulma tarihi:{" "}
          {new Date(course.createdAt).toLocaleDateString("tr-TR")}
        </p>
      </div>

      {/* Durum özeti kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
              <FiList className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toplam Konu
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                {learningTargets.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <FiList className="text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Başarılı Konular
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                {statusCounts.mastered || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <FiList className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Orta Seviye
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                {statusCounts.medium || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
              <FiList className="text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Başarısız
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                {statusCounts.failed || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Konular Bölümü */}
      <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Alt Konular
        </h2>
        {learningTargets.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            Henüz alt konu yok. İçerik yükleyerek başlayın.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3">Konu Adı</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Son Puan</th>
                </tr>
              </thead>
              <tbody>
                {learningTargets.map((target: LearningTarget) => (
                  <tr
                    key={target.id}
                    className="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
                  >
                    <td className="px-4 py-3">{target.subTopicName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
                        ${target.status === "pending" ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300" : ""}
                        ${target.status === "failed" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300" : ""}
                        ${target.status === "medium" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300" : ""}
                        ${target.status === "mastered" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300" : ""}
                      `}
                      >
                        {target.status === "pending" && "Beklemede"}
                        {target.status === "failed" && "Başarısız"}
                        {target.status === "medium" && "Orta"}
                        {target.status === "mastered" && "Başarılı"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {target.lastAttemptScorePercent !== null
                        ? `%${target.lastAttemptScorePercent}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/exams/create?courseId=${courseId}`}
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          <FiFileText className="mr-2" />
          Sınav Oluştur
        </Link>

        <Link
          href={`/upload?courseId=${courseId}`}
          className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <FiUpload className="mr-2" />
          İçerik Yükle
        </Link>
      </div>
    </div>
  );
}
