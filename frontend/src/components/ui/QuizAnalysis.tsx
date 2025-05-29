import React from "react";
import {
  FiBarChart2,
  FiTrendingUp,
  FiTarget,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { Quiz } from "../../types";

interface QuizAnalysisProps {
  quiz: Quiz;
  showDetailedAnalysis?: boolean;
}

const QuizAnalysis: React.FC<QuizAnalysisProps> = ({
  quiz,
  showDetailedAnalysis = true,
}) => {
  const { analysisResult, quizType } = quiz;

  if (!analysisResult) {
    return (
      <div className="p-4 bg-secondary rounded-lg border border-primary">
        <p className="text-tertiary text-center">
          Bu sınav için analiz sonucu bulunmamaktadır.
        </p>
      </div>
    );
  }

  const {
    overallScore,
    topicPerformance,
    performanceByDifficulty,
    weakTopics,
    strongTopics,
    recommendedFocus,
  } = analysisResult;

  // Skor rengi belirleme
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-state-success";
    if (score >= 60) return "text-state-warning";
    return "text-state-error";
  };

  // Zorluk seviyesi çevirisi
  const difficultyTranslation: Record<string, string> = {
    easy: "Kolay",
    medium: "Orta",
    hard: "Zor",
  };

  return (
    <div className="space-y-6">
      {/* Genel Skor */}
      <div className="bg-primary rounded-lg shadow-md border border-primary p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
          <FiBarChart2 className="mr-2" /> Genel Performans
        </h3>

        <div className="flex items-center justify-center mb-4">
          <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
            %{overallScore}
          </div>
        </div>

        <p className="text-secondary text-center text-sm">
          {quizType === "quick"
            ? "Bu hızlı sınav sonucu öğrenme hedeflerinizi etkilemez."
            : "Bu kişiselleştirilmiş sınav sonucu öğrenme hedeflerinizi günceller."}
        </p>
      </div>

      {showDetailedAnalysis && (
        <>
          {/* Konu Bazlı Performans */}
          <div className="bg-primary rounded-lg shadow-md border border-primary p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
              <FiTarget className="mr-2" /> Konu Bazlı Performans
            </h3>

            <div className="space-y-4">
              {Object.entries(topicPerformance).map(([topic, data]) => (
                <div key={topic}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-primary">{topic}</span>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(data.percentage)}`}
                    >
                      %{data.percentage} ({data.correct}/{data.total})
                    </span>
                  </div>
                  <div className="w-full bg-tertiary rounded-full h-2">                        <div
                      className={`h-2 rounded-full ${
                        data.percentage >= 80
                          ? "bg-state-success"
                          : data.percentage >= 60
                            ? "bg-state-warning"
                            : "bg-state-error"
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-secondary">
              <p className="mb-2">
                <strong>Hesaplama Formülü:</strong> Toplam başarı oranı, her alt
                konunun soru sayısına ve başarı oranına göre ağırlıklandırılmış
                olarak hesaplanır.
              </p>
              <p className="mb-1">
                <strong>Formül:</strong> (Σ (soru sayısı * alt konu başarı
                oranı)) / toplam soru sayısı
              </p>
              <div className="pl-4 border-l-2 border-secondary mt-2">
                {Object.entries(topicPerformance).map(([topic, data]) => (
                  <p key={topic} className="text-xs">
                    {topic}: {data.total} soru, %{data.percentage} başarı (
                    {data.total} * {data.percentage / 100} ={" "}
                    {((data.total * data.percentage) / 100).toFixed(2)})
                  </p>
                ))}
                <p className="text-xs font-semibold mt-1">
                  Toplam: {overallScore}% (
                  {Object.values(topicPerformance)
                    .reduce(
                      (acc, data) => acc + (data.total * data.percentage) / 100,
                      0,
                    )
                    .toFixed(2)}{" "}
                  /{" "}
                  {Object.values(topicPerformance).reduce(
                    (acc, data) => acc + data.total,
                    0,
                  )}
                  )
                </p>
              </div>
            </div>
          </div>

          {/* Zorluk Seviyesine Göre Performans */}
          {performanceByDifficulty && (
            <div className="bg-primary rounded-lg shadow-md border border-primary p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                <FiTrendingUp className="mr-2" /> Zorluk Seviyesine Göre
                Performans
              </h3>

              <div className="space-y-4">
                {Object.entries(performanceByDifficulty).map(
                  ([difficulty, percentage]) => (
                    <div key={difficulty}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-primary">
                          {difficultyTranslation[difficulty]}
                        </span>
                        <span
                          className={`text-sm font-semibold ${getScoreColor(percentage)}`}
                        >
                          %{percentage}
                        </span>
                      </div>
                      <div className="w-full bg-tertiary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 80
                              ? "bg-state-success"
                              : percentage >= 60
                                ? "bg-state-warning"
                                : "bg-state-error"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Güçlü ve Zayıf Konular */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Güçlü Konular */}
            <div className="bg-primary rounded-lg shadow-md border border-primary p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-state-success">
                <FiCheckCircle className="mr-2" /> Güçlü Konular
              </h3>

              {strongTopics.length > 0 ? (
                <ul className="space-y-2">
                  {strongTopics.map((topic) => (
                    <li
                      key={topic}
                      className="flex items-center text-state-success"
                    >
                      <FiCheckCircle className="mr-2" /> {topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-tertiary text-center">
                  Henüz güçlü konu belirlenmedi.
                </p>
              )}
            </div>

            {/* Zayıf Konular */}
            <div className="bg-primary rounded-lg shadow-md border border-primary p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-state-error">
                <FiAlertCircle className="mr-2" /> Geliştirilmesi Gereken
                Konular
              </h3>

              {weakTopics.length > 0 ? (
                <ul className="space-y-2">
                  {weakTopics.map((topic) => (
                    <li key={topic} className="flex items-center text-state-error">
                      <FiAlertCircle className="mr-2" /> {topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-tertiary text-center">
                  Tebrikler! Zayıf konunuz bulunmamaktadır.
                </p>
              )}
            </div>
          </div>

          {/* Öneriler */}
          {recommendedFocus && recommendedFocus.length > 0 && (
            <div className="bg-primary rounded-lg shadow-md border border-primary p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                <FiTarget className="mr-2" /> Çalışma Önerileri
              </h3>

              <p className="text-secondary mb-4">
                Aşağıdaki konulara odaklanmanız, genel performansınızı
                artırmanıza yardımcı olacaktır:
              </p>

              <ul className="space-y-2">
                {recommendedFocus.map((topic) => (
                  <li key={topic} className="flex items-center text-primary">
                    <span className="w-2 h-2 bg-brand-primary rounded-full mr-2"></span>{" "}
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizAnalysis;
