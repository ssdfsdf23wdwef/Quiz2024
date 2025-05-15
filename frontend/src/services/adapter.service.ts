/**
 * Adapter Servis
 *
 * Bu servis, backend API'si ile frontend tipleri arasında dönüşüm sağlar.
 * Backend'den gelen yanıtları frontend tipine dönüştürür ve frontend'den
 * backend'e gönderilen verileri backend DTO formatına dönüştürür.
 *
 * Bu yaklaşım, frontend ve backend arasında gevşek bağlama (loose coupling) sağlar.
 * Böylece API sözleşmesi değiştiğinde, sadece bu adapter servisini güncellemek yeterli olur.
 */

import {
  Quiz,
  Question,
  AnalysisResult,
  FailedQuestion,
  DifficultyLevel,
  SubTopicItem,
  QuizGenerationOptions,
  QuizSubmissionPayload,
} from "../types/quiz";
import { LearningTarget } from "../types/learningTarget";

/**
 * DTO (Data Transfer Object) tipleri
 * Backend'den gelen ham verileri temsil eder
 */
export interface ApiQuiz {
  id: string;
  userId: string;
  quizType: string;
  personalizedQuizType: string | null;
  courseId: string | null;
  sourceDocument: {
    fileName: string;
    storagePath: string;
  } | null;
  selectedSubTopics: Array<{
    subTopic: string;
    normalizedSubTopic: string;
    count?: number;
  }> | null;
  preferences: {
    questionCount: number;
    difficulty: string;
    timeLimit: number | null;
    prioritizeWeakAndMediumTopics: boolean | null;
  };
  questions: ApiQuestion[];
  userAnswers: Record<string, string>;
  score: number;
  correctCount: number;
  totalQuestions: number;
  elapsedTime: number | null;
  analysisResult: ApiAnalysisResult | null;
  timestamp: string;
  // Backend'den gelen ek alanlar
  [key: string]: unknown;
}

interface ApiQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: string;
  // Backend'den gelen ek alanlar
  [key: string]: unknown;
}

export interface ApiAnalysisResult {
  overallScore: number;
  performanceBySubTopic: Record<
    string,
    {
      scorePercent: number;
      status: string;
      questionCount: number;
      correctCount: number;
    }
  >;
  performanceCategorization: {
    failed: string[];
    medium: string[];
    mastered: string[];
  };
  performanceByDifficulty: Record<
    string,
    {
      count: number;
      correct: number;
      score: number;
    }
  >;
  recommendations: string[] | null;
  // Backend'den gelen ek alanlar
  [key: string]: unknown;
}

interface ApiLearningTarget {
  id: string;
  courseId: string;
  userId: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  status: string;
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastAttemptScorePercent: number | null;
  lastAttempt: string | null;
  firstEncountered: string;
  lastPersonalizedQuizId: string | null;
  // Backend'den gelen ek alanlar
  [key: string]: unknown;
}

export interface ApiFailedQuestion {
  id: string;
  userId: string;
  quizId: string;
  questionId: string;
  courseId?: string | null;
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  subTopic?: string;
  subTopicName?: string;
  normalizedSubTopic?: string;
  normalizedSubTopicName?: string;
  difficulty: string;
  failedTimestamp: string;
  [key: string]: unknown;
}

// API Request DTO Interfaces
export interface ApiQuizGenerationOptionsDto {
  quizType: "quick" | "personalized";
  personalizedQuizType?:
    | "weakTopicFocused"
    | "learningObjectiveFocused" 
    | "newTopicFocused"
    | "comprehensive"
    | null;
  courseId?: string | null;
  sourceDocument?: {
    fileName: string;
    storagePath: string;
  } | null;
  selectedSubTopics?: SubTopicItem[] | null;
  documentText?: string | null;
  subTopics?: string[] | null;
  questionCount?: number;
  difficulty?: string;
  preferences: {
    questionCount: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    timeLimit?: number | null;
    prioritizeWeakAndMediumTopics?: boolean | null;
  };
}

export interface ApiQuizSubmissionPayloadDto {
  quizId: string;
  userAnswers: Record<string, string>;
  elapsedTime?: number | null;
}

/**
 * AdapterService sınıfı
 * Backend API'si ile frontend arasındaki veri dönüşümlerini yönetir
 */
class AdapterService {
  private static instance: AdapterService;

  /**
   * Singleton pattern
   */
  public static getInstance(): AdapterService {
    if (!AdapterService.instance) {
      AdapterService.instance = new AdapterService();
    }
    return AdapterService.instance;
  }

  /**
   * Her dönüşüm için özel kuralları belirtebilmek adına constructor private
   */
  private constructor() {}

  /**
   * API'den gelen Quiz'i frontend Quiz tipine dönüştürür
   */
  public toQuiz(apiQuiz: ApiQuiz): Quiz {
    // Tip güvenliği için eksik değerleri varsayılan değerlerle doldur
    const quiz: Quiz = {
      id: apiQuiz.id,
      userId: apiQuiz.userId,
      quizType: apiQuiz.quizType as "quick" | "personalized",
      personalizedQuizType:
        apiQuiz.personalizedQuizType as "weakTopicFocused" | "newTopicFocused" | "comprehensive" | null,
      courseId: apiQuiz.courseId,
      sourceDocument: apiQuiz.sourceDocument,
      // API'den gelen kompleks yapıyı string dizisine dönüştür
      selectedSubTopics: apiQuiz.selectedSubTopics 
        ? apiQuiz.selectedSubTopics.map(item => item.subTopic)
        : null,
      preferences: {
        questionCount: apiQuiz.preferences.questionCount,
        difficulty: apiQuiz.preferences.difficulty as DifficultyLevel,
        timeLimit: apiQuiz.preferences.timeLimit ?? undefined,
        prioritizeWeakAndMediumTopics:
          apiQuiz.preferences.prioritizeWeakAndMediumTopics ?? undefined,
      },
      questions: apiQuiz.questions.map((q) => this.toQuestion(q)),
      userAnswers: apiQuiz.userAnswers,
      score: apiQuiz.score,
      correctCount: apiQuiz.correctCount,
      totalQuestions: apiQuiz.totalQuestions,
      elapsedTime: apiQuiz.elapsedTime ?? undefined,
      analysisResult: apiQuiz.analysisResult
        ? this.toAnalysisResult(apiQuiz.analysisResult)
        : null,
      timestamp: apiQuiz.timestamp,
    };

    return quiz;
  }

  /**
   * API'den gelen Question'ı frontend Question tipine dönüştürür
   */
  public toQuestion(apiQuestion: ApiQuestion): Question {
    return {
      id: apiQuestion.id,
      questionText: apiQuestion.questionText,
      options: apiQuestion.options,
      correctAnswer: apiQuestion.correctAnswer,
      explanation: apiQuestion.explanation,
      subTopic: apiQuestion.subTopic,
      normalizedSubTopic: apiQuestion.normalizedSubTopic,
      difficulty: apiQuestion.difficulty as DifficultyLevel,
    };
  }

  /**
   * API'den gelen AnalysisResult'ı frontend AnalysisResult tipine dönüştürür
   */
  public toAnalysisResult(
    apiAnalysisResult: ApiAnalysisResult,
  ): AnalysisResult {
    const performanceBySubTopic: AnalysisResult["performanceBySubTopic"] = {};

    // Tüm alt konu performanslarını dönüştür
    Object.entries(apiAnalysisResult.performanceBySubTopic).forEach(
      ([key, value]) => {
        performanceBySubTopic[key] = {
          scorePercent: value.scorePercent,
          status: value.status as "pending" | "failed" | "medium" | "mastered",
          questionCount: value.questionCount,
          correctCount: value.correctCount,
        };
      },
    );

    // Varsayılan zorluk seviyesi performansları
    const performanceByDifficulty: AnalysisResult["performanceByDifficulty"] = {
      easy: { count: 0, correct: 0, score: 0 },
      medium: { count: 0, correct: 0, score: 0 },
      hard: { count: 0, correct: 0, score: 0 },
      mixed: { count: 0, correct: 0, score: 0 }
    };

    // API'den gelen zorluk seviyesi performanslarını ekle
    Object.entries(apiAnalysisResult.performanceByDifficulty).forEach(
      ([key, value]) => {
        const difficulty = key as DifficultyLevel;
        if (performanceByDifficulty[difficulty]) {
          performanceByDifficulty[difficulty] = {
            count: value.count,
            correct: value.correct,
            score: value.score,
          };
        }
      },
    );

    return {
      overallScore: apiAnalysisResult.overallScore,
      performanceBySubTopic,
      performanceCategorization: {
        failed: apiAnalysisResult.performanceCategorization.failed,
        medium: apiAnalysisResult.performanceCategorization.medium,
        mastered: apiAnalysisResult.performanceCategorization.mastered,
      },
      performanceByDifficulty,
      recommendations: apiAnalysisResult.recommendations,
    };
  }

  /**
   * API'den gelen LearningTarget'ı frontend LearningTarget tipine dönüştürür
   */
  public toLearningTarget(
    apiLearningTarget: ApiLearningTarget,
  ): LearningTarget {
    return {
      id: apiLearningTarget.id,
      courseId: apiLearningTarget.courseId,
      userId: apiLearningTarget.userId,
      subTopicName: apiLearningTarget.subTopicName,
      normalizedSubTopicName: apiLearningTarget.normalizedSubTopicName,
      status: apiLearningTarget.status as
        | "pending"
        | "failed"
        | "medium"
        | "mastered",
      failCount: apiLearningTarget.failCount,
      mediumCount: apiLearningTarget.mediumCount,
      successCount: apiLearningTarget.successCount,
      lastAttemptScorePercent:
        apiLearningTarget.lastAttemptScorePercent ?? undefined,
      lastAttempt: apiLearningTarget.lastAttempt ?? undefined,
      firstEncountered: apiLearningTarget.firstEncountered,
      lastPersonalizedQuizId:
        apiLearningTarget.lastPersonalizedQuizId ?? undefined,
    };
  }

  /**
   * API'den gelen FailedQuestion'ı frontend FailedQuestion tipine dönüştürür
   */
  public toFailedQuestion(
    apiFailedQuestion: ApiFailedQuestion,
  ): FailedQuestion {
    return {
      id: apiFailedQuestion.id,
      userId: apiFailedQuestion.userId,
      quizId: apiFailedQuestion.quizId,
      questionId: apiFailedQuestion.questionId,
      courseId: apiFailedQuestion.courseId ?? undefined,
      questionText: apiFailedQuestion.questionText ?? "",
      options: apiFailedQuestion.options ?? [],
      correctAnswer: apiFailedQuestion.correctAnswer ?? "",
      userAnswer: apiFailedQuestion.userAnswer ?? "",
      subTopic:
        apiFailedQuestion.subTopic || apiFailedQuestion.subTopicName || "",
      normalizedSubTopic:
        apiFailedQuestion.normalizedSubTopic ||
        apiFailedQuestion.normalizedSubTopicName ||
        "",
      difficulty:
        (apiFailedQuestion.difficulty as "easy" | "medium" | "hard") ?? "easy",
      failedTimestamp: apiFailedQuestion.failedTimestamp ?? "",
    };
  }

  /**
   * Frontend QuizGenerationOptions'ı API DTO formatına dönüştürür
   */
  public fromQuizGenerationOptions(
    options: QuizGenerationOptions,
  ): ApiQuizGenerationOptionsDto {
    // Eğer subTopics seçilmişse dönüştür
    const subTopics: string[] = options.selectedSubTopics?.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item && 'subTopicName' in item) {
        return item.subTopicName;
      }
      return '';
    }).filter(Boolean) as string[] || [];

    // Eğer sourceDocument varsa, documentText oluştur
    let documentText = "Örnek belge metni. Bu metin gerçek veri olmadığı için örnek olarak oluşturulmuştur.";
    if (options.sourceDocument?.fileName) {
      documentText = `Dosya: ${options.sourceDocument.fileName} içeriği örnek metin. Bu metin gerçek veri olmadığı için örnek olarak oluşturulmuştur.`;
    }

    // Backend API DTO formatına dönüştür ve undefined değerleri null'a dönüştür
    if (options.quizType === 'quick') {
      return {
        quizType: options.quizType,
        documentText,  // Backend tarafında zorunlu
        subTopics: subTopics.length > 0 ? subTopics : ['Genel Konu'],  // Backend tarafında zorunlu 
        questionCount: options.preferences.questionCount,
        difficulty: options.preferences.difficulty,
        preferences: {
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit ?? null, // undefined ise null kullan
          prioritizeWeakAndMediumTopics: options.preferences.prioritizeWeakAndMediumTopics ?? true, // undefined ise true kullan
        },
      };
    } else if (options.quizType === 'personalized') {
      return {
        quizType: options.quizType,
        personalizedQuizType: options.personalizedQuizType as "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null | undefined,
        courseId: options.courseId,  // Backend tarafında zorunlu 
        documentText: documentText,
        subTopics: subTopics.length > 0 ? subTopics : ['Genel Konu'],
        questionCount: options.preferences.questionCount,
        difficulty: options.preferences.difficulty,
        preferences: {
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit ?? null, // undefined ise null kullan
          prioritizeWeakAndMediumTopics: options.preferences.prioritizeWeakAndMediumTopics ?? true, // undefined ise true kullan
        },
      };
    } else {
      // Varsayılan durumda kişiselleştirilmiş olmayan duruma düş
      return {
        quizType: "quick",
        documentText,
        subTopics: subTopics.length > 0 ? subTopics : ['Genel Konu'],
        questionCount: options.preferences.questionCount,
        difficulty: options.preferences.difficulty,
        preferences: {
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit ?? null, // undefined ise null kullan
          prioritizeWeakAndMediumTopics: options.preferences.prioritizeWeakAndMediumTopics ?? true, // undefined ise true kullan
        },
      };
    }
  }

  /**
   * Frontend QuizSubmissionPayload'ı API DTO formatına dönüştürür
   */
  public fromQuizSubmissionPayload(
    payload: QuizSubmissionPayload,
  ): ApiQuizSubmissionPayloadDto {
    return {
      quizId: payload.quizId,
      userAnswers: payload.userAnswers,
      elapsedTime: payload.elapsedTime ?? null,
    };
  }

  /**
   * Birden fazla Quiz'i dönüştürür
   */
  public toQuizzes(apiQuizzes: ApiQuiz[]): Quiz[] {
    return apiQuizzes.map((quiz) => this.toQuiz(quiz));
  }

  /**
   * Birden fazla LearningTarget'ı dönüştürür
   */
  public toLearningTargets(
    apiLearningTargets: ApiLearningTarget[],
  ): LearningTarget[] {
    return apiLearningTargets.map((target) => this.toLearningTarget(target));
  }

  /**
   * Birden fazla FailedQuestion'ı dönüştürür
   */
  public toFailedQuestions(
    apiFailedQuestions: ApiFailedQuestion[],
  ): FailedQuestion[] {
    return apiFailedQuestions.map((question) =>
      this.toFailedQuestion(question),
    );
  }
}

// Singleton export
const adapterService = AdapterService.getInstance();
export default adapterService;
