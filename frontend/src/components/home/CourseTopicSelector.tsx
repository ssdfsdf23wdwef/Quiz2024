import React from "react";
import type { Course } from "@/types/course.type";
import type { DetectedSubTopic } from "@/types/learningTarget.type";
import { FiTarget, FiCheck, FiLoader, FiAlertTriangle } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";

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
}) => {
  const { isDarkMode } = useTheme();
  
  return (
  <div className={`mb-8 rounded-2xl p-6 relative overflow-hidden backdrop-blur-lg border ${isDarkMode ? 'bg-gray-900/70 border-gray-700/40 shadow-2xl shadow-gray-950/30' : 'bg-white/80 border-gray-200/50 shadow-2xl shadow-gray-300/40'}`}>
    {/* Decorative gradient accent */}
    <div className={`absolute left-0 top-0 w-full h-1.5 bg-gradient-to-r ${isDarkMode ? 'from-blue-600 via-indigo-600 to-purple-600' : 'from-blue-500 via-indigo-500 to-purple-500'} opacity-90`}></div>
    
    <h3 className={`text-xl font-semibold mb-5 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 shadow-md ${isDarkMode ? 'bg-gradient-to-br from-blue-700/50 to-indigo-700/60' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
        <FiTarget className="text-blue-600 dark:text-blue-400" />
      </span>
      İçerik Seçimi
    </h3>
    
    <div className="mb-6">
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
        Ders Seçimi
      </label>
      <div className="relative">
        <select
          value={selectedCourseId}
          onChange={handleCourseChange}
          className={`w-full px-4 py-3 pr-10 border rounded-lg appearance-none transition-all duration-300 cursor-pointer shadow-sm backdrop-blur-md ${isDarkMode ? 
            'bg-gray-800/50 border-gray-700/60 text-gray-200 focus:border-blue-500/80 hover:border-blue-600/70 focus:ring-blue-500/30' : 
            'bg-white/60 border-gray-300/80 text-gray-800 focus:border-blue-500/70 hover:border-blue-400/90 focus:ring-blue-500/30'} focus:outline-none focus:ring-2`}
        >
          <option value="" className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>Ders seçin</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
              {course.name}
            </option>
          ))}
        </select>
        {/* Removed subtle gradient overlay as backdrop-blur is more prominent now */}
        <div className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-blue-400/80' : 'text-blue-500/90'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <p className="text-xs mt-2 italic text-gray-500 dark:text-gray-400">Sınavın ilgili olduğu dersi seçin</p>
    </div>

    {quizType === "personalized" && personalizedQuizType === "learningObjectiveFocused" && (
      <div className={`mb-6 p-4 rounded-xl relative overflow-hidden backdrop-blur-md border ${isDarkMode ? 'bg-blue-900/30 border-blue-700/40 shadow-lg shadow-blue-950/20' : 'bg-blue-50/70 border-blue-200/60 shadow-lg shadow-blue-200/30'}`}>
        {/* Gradient accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${isDarkMode ? 'from-blue-600 to-indigo-600' : 'from-blue-500 to-indigo-500'} opacity-90 rounded-l-xl`}></div>
        
        <div className="flex items-center gap-2.5 mb-2 pl-4">
          <div className={`p-2 rounded-lg shadow-sm ${isDarkMode ? 'bg-blue-800/50' : 'bg-blue-100/90'}`}>
            <FiTarget className="text-blue-600 dark:text-blue-400" size={16} />
          </div>
          <h4 className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Öğrenme Hedefi Odaklı Sınav</h4>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-11 pl-0.5`}>
          Yapay zeka, seçtiğiniz konuların öğrenme hedeflerine uygun sorular oluşturacak ve ilerlemenizi ölçecektir.
        </p>
      </div>
    )}

    <div className="mb-6">
      <label className={`block text-base font-semibold mb-3 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 shadow-md ${isDarkMode ? 'bg-gradient-to-br from-blue-700/40 to-indigo-700/50' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
        </span>
        Konu Seçimi
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {courseTopics.length === 0 ? (
          <div className={`w-full p-4 rounded-xl border text-sm flex items-center justify-center backdrop-blur-md ${isDarkMode ? 'bg-gray-800/50 border-gray-700/60 text-gray-400 shadow-md shadow-gray-950/10' : 'bg-gray-50/80 border-gray-200/70 text-gray-500 shadow-md shadow-gray-200/20'}`}>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/90'} mr-2.5 shadow-sm`}>
              <FiTarget className="text-gray-500 dark:text-gray-400" size={15} />
            </div>
            Henüz konu bulunmuyor veya ders seçilmedi
          </div>
        ) : (
          courseTopics.map((topic) => {
            // Konu durumuna göre simge ve renk belirle
            let StatusIcon = null;
            let statusColor = "";
            let bgGradient = "";
            let hoverEffect = "";
            
            if (topic.status === "failed") {
              StatusIcon = FiAlertTriangle;
              statusColor = isDarkMode ? "text-red-400" : "text-red-500";
              bgGradient = "from-red-500 to-orange-500";
              hoverEffect = isDarkMode ? "hover:bg-red-900/20" : "hover:bg-red-50/60";
            } else if (topic.status === "medium") {
              StatusIcon = FiLoader;
              statusColor = isDarkMode ? "text-yellow-300" : "text-yellow-600";
              bgGradient = "from-yellow-400 to-orange-400";
              hoverEffect = isDarkMode ? "hover:bg-yellow-900/20" : "hover:bg-yellow-50/60";
            } else if (topic.status === "mastered") {
              StatusIcon = FiCheck;
              statusColor = isDarkMode ? "text-green-400" : "text-green-600";
              bgGradient = "from-green-500 to-emerald-500";
              hoverEffect = isDarkMode ? "hover:bg-green-900/20" : "hover:bg-green-50/60";
            } else {
              hoverEffect = isDarkMode ? "hover:bg-blue-900/20" : "hover:bg-blue-50/60";
            }

            return (
              <motion.button
                key={topic.id}
                type="button"
                onClick={() => handleTopicToggle(topic.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative px-4 py-2 rounded-xl border text-sm transition-all duration-300 flex items-center gap-2 ${hoverEffect} ${isDarkMode ? 'border-gray-700/50 shadow-lg shadow-gray-950/20' : 'border-gray-300/70 shadow-lg shadow-gray-300/30'}`}
              >
                {/* Background and styling */}
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 group-hover:opacity-100 ${selectedTopicIds.includes(topic.id) 
                  ? `bg-gradient-to-r ${bgGradient || (isDarkMode ? 'from-blue-600 to-indigo-700' : 'from-blue-500 to-indigo-600')} ${isDarkMode ? 'opacity-85 shadow-md shadow-blue-950/20' : 'opacity-90 shadow-md shadow-blue-400/30'}` 
                  : `${isDarkMode ? 'bg-gray-800/40' : 'bg-white/60'} opacity-0`}`}></div>
                
                {/* Icon and text */}
                {StatusIcon && (
                  <div className={`relative z-10 p-1.5 rounded-lg transition-all duration-300 ${selectedTopicIds.includes(topic.id) ? (isDarkMode ? 'bg-white/25' : 'bg-white/30') : (isDarkMode ? 'bg-gray-700/70 group-hover:bg-gray-600/50' : 'bg-gray-100/90 group-hover:bg-gray-200/70')} shadow-sm`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${selectedTopicIds.includes(topic.id) ? 'text-white' : statusColor}`} />
                  </div>
                )}
                <span className={`relative z-10 font-medium transition-all duration-300 ${selectedTopicIds.includes(topic.id) 
                  ? 'text-white' 
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {topic.subTopicName}
                </span>
              </motion.button>
            );
          })
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">Sınavda yer almasını istediğiniz konuları seçin</p>
    </div>
    

    {topicSubTopics.length > 0 && (
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-3 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 mr-2 shadow-sm">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
          </span>
          Alt Konu Seçimi
        </label>
        <div className={`flex flex-wrap gap-1.5 p-3 rounded-2xl border backdrop-blur-lg ${isDarkMode ? 'bg-gray-800/50 border-gray-700/60 shadow-xl shadow-gray-950/20' : 'bg-white/70 border-gray-200/60 shadow-xl shadow-gray-300/30'}`}>
          {topicSubTopics.map((subTopic) => {
            // Alt konu durumuna göre simge ve renk belirle
            let StatusIcon = null;
            let statusColor = "";
            let bgGradient = "";
            let hoverEffect = "";
            
            if (subTopic.status === "failed") {
              StatusIcon = FiAlertTriangle;
              statusColor = isDarkMode ? "text-red-400" : "text-red-500";
              bgGradient = "from-red-500 to-orange-500";
              hoverEffect = isDarkMode ? "hover:bg-red-900/20" : "hover:bg-red-50/60";
            } else if (subTopic.status === "medium") {
              StatusIcon = FiLoader;
              statusColor = isDarkMode ? "text-yellow-300" : "text-yellow-600";
              bgGradient = "from-yellow-400 to-orange-400";
              hoverEffect = isDarkMode ? "hover:bg-yellow-900/20" : "hover:bg-yellow-50/60";
            } else if (subTopic.status === "mastered") {
              StatusIcon = FiCheck;
              statusColor = isDarkMode ? "text-green-400" : "text-green-600";
              bgGradient = "from-green-500 to-emerald-500";
              hoverEffect = isDarkMode ? "hover:bg-green-900/20" : "hover:bg-green-50/60";
            } else {
              hoverEffect = isDarkMode ? "hover:bg-blue-900/20" : "hover:bg-blue-50/60";
            }

            return (
              <motion.button
                key={subTopic.id}
                type="button"
                onClick={() => handleSubTopicToggle(subTopic.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSubTopicToggle(subTopic.id);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={selectedSubTopicIds.includes(subTopic.id)}
                aria-label={`${subTopic.subTopicName} ${selectedSubTopicIds.includes(subTopic.id) ? 'seçili' : 'seçili değil'}`}
                tabIndex={0}
                className={`group relative px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-300 flex items-center gap-1.5 ${hoverEffect} ${isDarkMode ? 'border-gray-700/50 shadow-md shadow-gray-950/20' : 'border-gray-300/70 shadow-md shadow-gray-300/30'} ${selectedSubTopicIds.includes(subTopic.id) ? 'ring-2 ring-offset-1 ring-blue-500/50 dark:ring-blue-400/50' : 'focus:ring-2 focus:ring-blue-400/30'}`}
              >
                {/* Background and styling */}
                <div className={`absolute inset-0 rounded-lg transition-all duration-300 group-hover:opacity-100 ${selectedSubTopicIds.includes(subTopic.id) 
                  ? `bg-gradient-to-r ${bgGradient || (isDarkMode ? 'from-blue-600 to-indigo-700' : 'from-blue-500 to-indigo-600')} ${isDarkMode ? 'opacity-85 shadow-md shadow-blue-950/20' : 'opacity-90 shadow-md shadow-blue-400/30'}` 
                  : `${isDarkMode ? 'bg-gray-800/40' : 'bg-white/60'} opacity-0`}`}></div>
                
                {/* Icon and text */}
                {StatusIcon && (
                  <div className={`relative z-10 p-1 rounded-md transition-all duration-300 ${selectedSubTopicIds.includes(subTopic.id) ? (isDarkMode ? 'bg-white/25' : 'bg-white/30') : (isDarkMode ? 'bg-gray-700/70 group-hover:bg-gray-600/50' : 'bg-gray-100/90 group-hover:bg-gray-200/70')} shadow-sm`}>
                    <StatusIcon className={`w-3 h-3 ${selectedSubTopicIds.includes(subTopic.id) ? 'text-white' : statusColor}`} />
                  </div>
                )}
                <span className={`relative z-10 font-medium transition-all duration-300 max-w-[120px] truncate ${selectedSubTopicIds.includes(subTopic.id) 
                  ? 'text-white' 
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {subTopic.subTopicName}
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">Daha spesifik alt konular seçerek sınavınızı özelleştirebilirsiniz</p>
      </div>
    )}
  </div>
  );
};

export default CourseTopicSelector;
