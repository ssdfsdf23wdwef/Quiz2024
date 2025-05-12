"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiCheck, FiX } from "react-icons/fi";
import { Course } from "@/types/course";
import TopicSelectionScreen from "../TopicSelectionScreen";
import CourseTopicSelector from "../CourseTopicSelector";
import { LearningTargetStatus } from "@/types/learningTarget";
import type { DetectedSubTopic } from "@/types/learningTarget";

interface TopicData {
  id: string;
  name: string;
  isSelected: boolean;
  isNew: boolean;
  status?: LearningTargetStatus;
}

interface CourseSelectionStepProps {
  courses: Course[];
  selectedCourseId: string;
  selectedTopicIds: string[];
  selectedSubTopicIds: string[];
  quizType: "quick" | "personalized";
  personalizedQuizType:
    | "weakTopicFocused"
    | "newTopicFocused"
    | "comprehensive";
  detectedTopics: TopicData[];
  isTopicDetectionLoading: boolean;
  topicDetectionError?: string;
  onCourseSelect: (courseId: string) => void;
  onTopicSelect: (topicId: string) => void;
  onSubTopicSelect: (subTopicId: string) => void;
  onCourseCreate: (newCourse: Partial<Course>) => void;
  onTopicsSelected: (topicIds: string[]) => void;
  onTopicDetectionCancel: () => void;
  courseTopics: DetectedSubTopic[];
  topicSubTopics: DetectedSubTopic[];
  mockTopics: DetectedSubTopic[];
}

export default function CourseSelectionStep({
  courses,
  selectedCourseId,
  selectedTopicIds,
  selectedSubTopicIds,
  quizType,
  personalizedQuizType,
  detectedTopics,
  isTopicDetectionLoading,
  topicDetectionError,
  onCourseSelect,
  onTopicSelect,
  onSubTopicSelect,
  onCourseCreate,
  onTopicsSelected,
  onTopicDetectionCancel,
  courseTopics,
  topicSubTopics,
}: CourseSelectionStepProps) {
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCourseSelect(e.target.value);
  };

  const handleCreateCourse = () => {
    if (!newCourseName.trim()) return;

    onCourseCreate({
      name: newCourseName.trim(),
      description: newCourseDescription.trim(),
    });

    // Formu sıfırla
    setNewCourseName("");
    setNewCourseDescription("");
    setIsCreatingCourse(false);
  };

  const detectedTopicsMapped: DetectedSubTopic[] = detectedTopics.map((t) => ({
    ...t,
    subTopicName: t.name,
    normalizedSubTopicName:
      t.name?.toLocaleLowerCase("tr-TR").replace(/\s+/g, "_") ?? "",
  }));

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        3. Konular
      </h3>

      {/* Kişiselleştirilmiş Sınav Özel İçeriği */}
      {quizType === "personalized" && (
        <>
          {personalizedQuizType === "weakTopicFocused" ? (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-200">
              <p className="text-sm font-medium">Bilgi:</p>
              <p className="text-sm">
                Zayıf/Orta Odaklı Sınav seçildiğinde, durumu
                &apos;başarısız&apos; veya &apos;orta&apos; olan mevcut öğrenme
                hedefleriniz otomatik olarak kullanılır. Bu adımda ek konu
                seçimi gerekmez.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Yüklediğiniz belgeden AI tarafından tespit edilen konular
                aşağıdadır. Sınava dahil etmek istediklerinizi seçin.
              </p>

              {/* AI Konu Tespiti ve Seçim Ekranı */}
              <TopicSelectionScreen
                detectedTopics={detectedTopicsMapped}
                onTopicsSelected={onTopicsSelected}
                onCancel={onTopicDetectionCancel}
                isLoading={isTopicDetectionLoading}
                error={topicDetectionError}
                quizType={quizType}
              />
            </>
          )}
        </>
      )}

      {/* Ders Seçimi - Kişiselleştirilmiş Sınav İçin */}
      {quizType === "personalized" && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
              Ders Seçimi
            </h4>

            {!isCreatingCourse ? (
              <button
                type="button"
                onClick={() => setIsCreatingCourse(true)}
                className="text-xs flex items-center px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
              >
                <FiPlus className="mr-1" size={14} />
                Yeni Ders Oluştur
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingCourse(false)}
                className="text-xs flex items-center px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <FiX className="mr-1" size={14} />
                İptal
              </button>
            )}
          </div>

          {isCreatingCourse ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20"
            >
              <h5 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-3">
                Yeni Ders Oluştur
              </h5>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="newCourseName"
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Ders Adı
                  </label>
                  <input
                    type="text"
                    id="newCourseName"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Ders adını girin"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newCourseDescription"
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    id="newCourseDescription"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                    placeholder="Ders açıklaması..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateCourse}
                    disabled={!newCourseName.trim()}
                    className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors"
                  >
                    <FiCheck className="mr-1.5" size={14} />
                    Oluştur
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mb-4">
              <select
                value={selectedCourseId}
                onChange={handleCourseChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="" disabled>
                  Ders seçin
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seçilen Ders İçin Konu ve Alt Konu Seçimi */}
          {selectedCourseId && (
            <CourseTopicSelector
              courses={courses}
              selectedCourseId={selectedCourseId}
              handleCourseChange={handleCourseChange}
              courseTopics={courseTopics}
              selectedTopicIds={selectedTopicIds}
              handleTopicToggle={onTopicSelect}
              topicSubTopics={topicSubTopics}
              selectedSubTopicIds={selectedSubTopicIds}
              handleSubTopicToggle={onSubTopicSelect}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
