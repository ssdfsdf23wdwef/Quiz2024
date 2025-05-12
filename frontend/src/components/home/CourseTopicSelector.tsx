import React from "react";
import type { Course } from "@/types/course";
import type { DetectedSubTopic } from "@/types/learningTarget";

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
      {courses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.name}
        </option>
      ))}
    </select>

    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Konu Seçimi
    </label>
    <div className="flex flex-wrap gap-2 mb-4">
      {courseTopics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => handleTopicToggle(topic.id)}
          className={`px-3 py-1 rounded-full border text-sm transition-colors ${
            selectedTopicIds.includes(topic.id)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          }`}
        >
          {topic.subTopicName}
        </button>
      ))}
    </div>

    {topicSubTopics.length > 0 && (
      <>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alt Konu Seçimi
        </label>
        <div className="flex flex-wrap gap-2">
          {topicSubTopics.map((subTopic) => (
            <button
              key={subTopic.id}
              type="button"
              onClick={() => handleSubTopicToggle(subTopic.id)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                selectedSubTopicIds.includes(subTopic.id)
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              }`}
            >
              {subTopic.subTopicName}
            </button>
          ))}
        </div>
      </>
    )}
  </div>
);

export default CourseTopicSelector;
