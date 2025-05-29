import React from "react";
import type { Course } from "@/types/course.type";
import type { DetectedSubTopic } from "@/types/learningTarget.type";
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
  <div className="mb-8 bg-elevated rounded-lg p-5 shadow-sm border border-border-secondary">
    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
      <span className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2">
        <FiTarget className="text-brand-primary" />
      </span>
      İçerik Seçimi
    </h3>
    
    <div className="mb-5">
      <label className="block text-sm font-medium text-primary mb-2">
        Ders Seçimi
      </label>
      <select
        value={selectedCourseId}
        onChange={handleCourseChange}
        className="w-full px-4 py-3 border border-border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200 mb-4 cursor-pointer hover:border-brand-primary"
      >
        <option value="">Ders seçin</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>
    </div>

    {quizType === "personalized" && personalizedQuizType === "learningObjectiveFocused" && (
      <div className="mb-5 p-4 border-l-4 border-l-state-info rounded-r-lg bg-state-infoBg">
        <div className="flex items-center gap-2 mb-2">
          <FiTarget className="text-state-info" size={18} />
          <h4 className="font-medium text-primary">Öğrenme Hedefi Odaklı Sınav</h4>
        </div>
        <p className="text-sm text-secondary ml-6">
          Yapay zeka, seçtiğiniz konuların öğrenme hedeflerine uygun sorular oluşturacak ve ilerlemenizi ölçecektir.
        </p>
      </div>
    )}

    <div className="mb-5">
      <label className="block text-sm font-medium text-primary mb-3 flex items-center">
        <span className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2">
          <span className="text-xs font-bold text-brand-primary">1</span>
        </span>
        Konu Seçimi
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {courseTopics.length === 0 ? (
          <div className="w-full p-4 bg-surface border border-border-secondary rounded-lg text-tertiary text-sm flex items-center justify-center">
            <FiTarget className="mr-2 text-tertiary" size={16} />
            Henüz konu bulunmuyor veya ders seçilmedi
          </div>
        ) : (
          courseTopics.map((topic) => {
            // Konu durumuna göre simge ve renk belirle
            let StatusIcon = null;
            let statusColor = "";
            
            if (topic.status === "failed") {
              StatusIcon = FiAlertTriangle;
              statusColor = "text-state-error";
            } else if (topic.status === "medium") {
              StatusIcon = FiLoader;
              statusColor = "text-state-warning";
            } else if (topic.status === "mastered") {
              StatusIcon = FiCheck;
              statusColor = "text-state-success";
            }

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleTopicToggle(topic.id)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all duration-200 flex items-center gap-2 hover:shadow-sm ${
                  selectedTopicIds.includes(topic.id)
                    ? "bg-brand-primary text-inverse border-brand-primary font-medium"
                    : "bg-surface text-primary border-border-secondary hover:border-brand-primary hover:bg-surface-hover"
                }`}
              >
                {StatusIcon && <StatusIcon className={`w-4 h-4 ${statusColor}`} />}
                {topic.subTopicName}
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-tertiary italic mt-1">Sınavda yer almasını istediğiniz konuları seçin</p>
    </div>
    

    {topicSubTopics.length > 0 && (
      <div className="mb-2">
        <label className="block text-sm font-medium text-primary mb-3 flex items-center">
          <span className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2">
            <span className="text-xs font-bold text-brand-primary">2</span>
          </span>
          Alt Konu Seçimi
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-surface/50 rounded-lg border border-border-secondary">
          {topicSubTopics.map((subTopic) => {
            // Alt konu durumuna göre simge ve renk belirle
            let StatusIcon = null;
            let statusColor = "";
            
            if (subTopic.status === "failed") {
              StatusIcon = FiAlertTriangle;
              statusColor = "text-state-error";
            } else if (subTopic.status === "medium") {
              StatusIcon = FiLoader;
              statusColor = "text-state-warning";
            } else if (subTopic.status === "mastered") {
              StatusIcon = FiCheck;
              statusColor = "text-state-success";
            }

            return (
              <button
                key={subTopic.id}
                type="button"
                onClick={() => handleSubTopicToggle(subTopic.id)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all duration-200 flex items-center gap-1.5 ${
                  selectedSubTopicIds.includes(subTopic.id)
                    ? "bg-brand-primary/90 text-inverse border-brand-primary font-medium"
                    : "bg-surface text-primary border-border-secondary hover:border-brand-primary hover:bg-surface-hover"
                }`}
              >
                {StatusIcon && <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />}
                {subTopic.subTopicName}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-tertiary italic mt-1">Daha spesifik alt konular seçerek sınavınızı özelleştirebilirsiniz</p>
      </div>
    )}
  </div>
);

export default CourseTopicSelector;
