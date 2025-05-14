import React from "react";
import type { Course } from "@/types/course";
import type { DetectedSubTopic } from "@/types/learningTarget";
import { FiTarget, FiCheck, FiLoader, FiAlertTriangle } from "react-icons/fi";

interface CourseTopicSelectorProps {
  courses: Course[];
  selectedCourseId: string;
  handleCourseChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  courseTopics: DetectedSubTopic[];
  selectedTopicIds: string[];
  handleTopicToggle: (topicId: string) => void;
  topicSubTopics: DetectedSubTopic[];
  selectedSubTopicIds: string[];
  handleSubTopicToggle: (subTopicId: string) => void;
  quizType?: "quick" | "personalized";
  personalizedQuizType?: 
    | "weakTopicFocused"
    | "learningObjectiveFocused"
    | "newTopicFocused" 
    | "comprehensive";
}

const CourseTopicSelector: React.FC<CourseTopicSelectorProps> = ({
  courses,
  selectedCourseId,
  handleCourseChange,
  courseTopics,
  selectedTopicIds,
  handleTopicToggle,
  topicSubTopics,
  selectedSubTopicIds,
  handleSubTopicToggle,
  quizType,
  personalizedQuizType,
}) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Ders Seçimi
    </label>
    <select
      value={selectedCourseId}
      onChange={handleCourseChange}
      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
    >
      <option value="">Ders seçin</option>
      {courses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.name}
        </option>
      ))}
    </select>

    {quizType === "personalized" && personalizedQuizType === "learningObjectiveFocused" && (
      <div className="mb-4 p-4 border border-indigo-200 dark:border-indigo-800 rounded-md bg-indigo-50 dark:bg-indigo-900/20">
        <div className="flex items-center gap-2 mb-2">
          <FiTarget className="text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-medium text-indigo-800 dark:text-indigo-200">Öğrenme Hedefi Odaklı Sınav</h4>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Yapay zeka, seçtiğiniz konuların öğrenme hedeflerine uygun sorular oluşturacak ve ilerlemenizi ölçecektir.
        </p>
      </div>
    )}

    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Konu Seçimi
    </label>
    <div className="flex flex-wrap gap-2 mb-4">
      {courseTopics.length === 0 ? (
        <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400 text-sm">
          Henüz konu bulunmuyor veya ders seçilmedi
        </div>
      ) : (
        courseTopics.map((topic) => {
          // Konu durumuna göre simge belirle
          let StatusIcon = null;
          if (topic.status === "failed") {
            StatusIcon = FiAlertTriangle;
          } else if (topic.status === "medium") {
            StatusIcon = FiLoader;
          } else if (topic.status === "mastered") {
            StatusIcon = FiCheck;
          }

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleTopicToggle(topic.id)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors flex items-center gap-1 ${
                selectedTopicIds.includes(topic.id)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              }`}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {topic.subTopicName}
            </button>
          );
        })
      )}
    </div>

    {topicSubTopics.length > 0 && (
      <>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alt Konu Seçimi
        </label>
        <div className="flex flex-wrap gap-2">
          {topicSubTopics.map((subTopic) => {
            // Alt konu durumuna göre simge belirle
            let StatusIcon = null;
            if (subTopic.status === "failed") {
              StatusIcon = FiAlertTriangle;
            } else if (subTopic.status === "medium") {
              StatusIcon = FiLoader;
            } else if (subTopic.status === "mastered") {
              StatusIcon = FiCheck;
            }

            return (
              <button
                key={subTopic.id}
                type="button"
                onClick={() => handleSubTopicToggle(subTopic.id)}
                className={`px-3 py-1 rounded-full border text-sm transition-colors flex items-center gap-1 ${
                  selectedSubTopicIds.includes(subTopic.id)
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}
              >
                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                {subTopic.subTopicName}
              </button>
            );
          })}
        </div>
      </>
    )}
  </div>
);

export default CourseTopicSelector;
