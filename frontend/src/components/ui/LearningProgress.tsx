import React from "react";
import { FiTarget, FiCheckCircle, FiTrendingUp } from "react-icons/fi";
import type { WeakTopic } from "@/types/learningTarget.type";

interface LearningProgressProps {
  weakTopics: Record<string, WeakTopic>;
  strongTopics: string[];
}

const LearningProgress: React.FC<LearningProgressProps> = ({
  weakTopics,
  strongTopics,
}) => {
  // Toplam başarı oranı hesaplama
  const calculateMasteryPercentage = (): number => {
    if (!weakTopics || !strongTopics) return 0;

    const totalTopics = Object.keys(weakTopics).length + strongTopics.length;
    const masteredTopics =
      strongTopics.length +
      Object.values(weakTopics).filter((topic) => topic.status === "mastered")
        .length;

    return totalTopics > 0
      ? Math.round((masteredTopics / totalTopics) * 100)
      : 0;
  };

  const masteryPercentage = calculateMasteryPercentage();

  // Konu kartı
  const TopicCard = ({
    topic,
    status,
    data,
  }: {
    topic: string;
    status: "active" | "mastered";
    data?: WeakTopic;
  }) => {
    // Başarı oranı hesaplama
    const calculateSuccessRate = (data?: WeakTopic): number => {
      if (!data) return 100;

      const totalAttempts = data.failCount + (data.successCount || 0);
      return totalAttempts > 0
        ? Math.round(((data.successCount || 0) / totalAttempts) * 100)
        : 0;
    };

    const successRate = calculateSuccessRate(data);

    return (
      <div
        className={`p-4 border rounded-lg shadow-sm ${
          status === "mastered"
            ? "border-state-success-border bg-state-success-bg"
            : "border-state-warning-border bg-state-warning-bg"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{topic}</h3>
            <p className="text-sm text-secondary mt-1">
              {status === "mastered"
                ? "Uzmanlaşıldı"
                : `Gelişim aşamasında (${successRate}%)`}
            </p>
          </div>
          <div>
            {status === "mastered" ? (
              <FiCheckCircle className="text-state-success text-xl" />
            ) : (
              <FiTarget className="text-state-warning text-xl" />
            )}
          </div>
        </div>

        {data && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-secondary mb-1">
              <span>İlerleme</span>
              <span>{successRate}%</span>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  successRate >= 80
                    ? "bg-state-success"
                    : successRate >= 60
                      ? "bg-state-warning"
                      : "bg-state-error"
                }`}
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-secondary">
              <span>Başarılı: {data.successCount || 0}</span>
              <span>Başarısız: {data.failCount}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Genel İlerleme */}
      <div className="bg-elevated rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-primary">
          <FiTrendingUp className="mr-2" /> Genel İlerleme
        </h2>

        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgb(var(--color-border-primary))"
                strokeWidth="3"
                strokeDasharray="100, 100"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={
                  masteryPercentage >= 80
                    ? "rgb(var(--color-state-success))"
                    : masteryPercentage >= 60
                      ? "rgb(var(--color-state-warning))"
                      : "rgb(var(--color-state-error))"
                }
                strokeWidth="3"
                strokeDasharray={`${masteryPercentage}, 100`}
              />
              <text
                x="18"
                y="20.5"
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                className="text-primary"
                fontWeight="bold"
              >
                %{masteryPercentage}
              </text>
            </svg>
          </div>

          <p className="text-center text-gray-600">
            Toplam {Object.keys(weakTopics).length + strongTopics.length}{" "}
            konudan{" "}
            {strongTopics.length +
              Object.values(weakTopics).filter(
                (topic) => topic.status === "mastered",
              ).length}{" "}
            tanesinde uzmanlaştınız.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-500 mr-2" />
              <span className="font-medium">Uzmanlaşılan Konular</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {strongTopics.length +
                Object.values(weakTopics).filter(
                  (topic) => topic.status === "mastered",
                ).length}
            </p>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center">
              <FiTarget className="text-amber-500 mr-2" />
              <span className="font-medium">Gelişim Aşamasında</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {
                Object.values(weakTopics).filter(
                  (topic) => topic.status === "active",
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Uzmanlaşılan Konular */}
      {strongTopics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-green-600">
            <FiCheckCircle className="mr-2" /> Uzmanlaşılan Konular
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strongTopics.map((topic) => (
              <TopicCard key={topic} topic={topic} status="mastered" />
            ))}

            {/* Zayıf konulardan uzmanlaşılanları da ekle */}
            {Object.entries(weakTopics)
              .filter(([, data]) => data.status === "mastered")
              .map(([topic, data]) => (
                <TopicCard
                  key={topic}
                  topic={topic}
                  status="mastered"
                  data={data}
                />
              ))}
          </div>
        </div>
      )}

      {/* Gelişim Aşamasındaki Konular */}
      {Object.values(weakTopics).filter((topic) => topic.status === "active")
        .length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-amber-600">
            <FiTarget className="mr-2" /> Gelişim Aşamasındaki Konular
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(weakTopics)
              .filter(([, data]) => data.status === "active")
              .map(([topic, data]) => (
                <TopicCard
                  key={topic}
                  topic={topic}
                  status="active"
                  data={data}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningProgress;
