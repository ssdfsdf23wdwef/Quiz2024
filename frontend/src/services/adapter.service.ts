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
  QuizGenerationOptions,
  QuizSubmissionPayload, 
  QuestionType,
  QuestionStatus,
  QuizType,
  PersonalizedQuizFocus, // AH: Added PersonalizedQuizFocus import
  SubTopic 
} from "../types/quiz.type";
import { LearningTarget } from "../types/learningTarget.type";

/**
 * DTO (Data Transfer Object) tipleri
 * Backend'den gelen ham verileri temsil eder
 */
export interface ApiQuiz {
  id: string;
  userId: string;
  title?: string;
  quizType: string; // Keep as string, will be cast to QuizType with validation if possible
  personalizedQuizType: string | null; // Keep as string, will be cast with validation
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
  // subTopic: string; // AH: Original field, backend sends subTopicName
  // normalizedSubTopic: string; // AH: Original field, backend sends normalizedSubTopicName
  subTopicName?: string; // AH: Corrected to match backend
  normalizedSubTopicName?: string; // AH: Corrected to match backend
  difficulty: string;
  questionType?: string;
  status?: string;
  topic?: string; // AH: Keep for fallback if subTopicName is missing
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
  selectedSubTopics?: SubTopic[] | null; // AH: Changed from SubTopicItem[] to SubTopic[]
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

// AH: Added helper DTOs for quiz submission payload, matching backend structure

interface SubmitQuestionDto {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SubmitDocumentSourceDto {
  fileName: string;
  storagePath: string;
  documentId?: string;
}

interface SubmitTopicDto {
  subTopic: string;
  normalizedSubTopic: string;
  count?: number;
}

// END AH: Added helper DTOs

export interface ApiQuizSubmissionPayloadDto {
  // quizId: string; // REMOVED - Not expected by backend at the root
  userAnswers: Record<string, string>;
  elapsedTime?: number | null;
  quizType: "quick" | "personalized" | "review"; // UPDATED - Added 'review'
  personalizedQuizType?: "weakTopicFocused" | "newTopicFocused" | "comprehensive" | null; // ADDED
  courseId?: string | null; // ADDED
  sourceDocument?: SubmitDocumentSourceDto | null; // ADDED
  selectedSubTopics?: SubmitTopicDto[] | null; // ADDED
  preferences: { // Structure matches backend's QuizPreferencesDto
    questionCount: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    timeLimit?: number | null;
    prioritizeWeakAndMediumTopics?: boolean | null;
  };
  questions: SubmitQuestionDto[]; // CHANGED from ApiQuestion[] to SubmitQuestionDto[]
}


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
    const quiz: Quiz = {
      id: apiQuiz.id,
      userId: apiQuiz.userId,
      title: apiQuiz.title || `Quiz ${apiQuiz.id}`,
      quizType: apiQuiz.quizType as QuizType, 
      personalizedQuizType: apiQuiz.personalizedQuizType as PersonalizedQuizFocus | null, // AH: Should now work
      courseId: apiQuiz.courseId,
      sourceDocument: apiQuiz.sourceDocument,
      selectedSubTopics: apiQuiz.selectedSubTopics 
        ? apiQuiz.selectedSubTopics.map(item => item.subTopic) // AH: Corrected to map to string[] as per Quiz type in quiz.ts
        : null,
      preferences: {
        questionCount: apiQuiz.preferences.questionCount,
        difficulty: apiQuiz.preferences.difficulty as DifficultyLevel,
        timeLimit: apiQuiz.preferences.timeLimit ?? undefined,
        prioritizeWeakAndMediumTopics: apiQuiz.preferences.prioritizeWeakAndMediumTopics ?? undefined,
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
    console.log('[DEBUG] adapter.service.ts - toQuestion - Received apiQuestion:', JSON.stringify(apiQuestion, null, 2)); // AH: Log added
    // let finalSubTopic = apiQuestion.subTopic; // AH: Old logic
    // let finalNormalizedSubTopic = apiQuestion.normalizedSubTopic; // AH: Old logic

    // AH: New logic: Prioritize subTopicName and normalizedSubTopicName
    let finalSubTopic = apiQuestion.subTopicName;
    let finalNormalizedSubTopic = apiQuestion.normalizedSubTopicName;

    // Helper to check if a string is null, undefined, or empty/whitespace
    const isEffectivelyEmpty = (str: string | null | undefined): boolean => {
      return str === null || str === undefined || str.trim() === '';
    };

    // 1. Fallback to apiQuestion.subTopic (original field name) if subTopicName is empty
    if (isEffectivelyEmpty(finalSubTopic) && !isEffectivelyEmpty(apiQuestion.subTopic as string | null | undefined)) { // AH: Cast to string
      finalSubTopic = apiQuestion.subTopic as string; // AH: Cast to string
    }
    // 2. Fallback to apiQuestion.normalizedSubTopic (original field name) if normalizedSubTopicName is empty
    if (isEffectivelyEmpty(finalNormalizedSubTopic) && !isEffectivelyEmpty(apiQuestion.normalizedSubTopic as string | null | undefined)) { // AH: Cast to string
      finalNormalizedSubTopic = apiQuestion.normalizedSubTopic as string; // AH: Cast to string
    }
    
    // 3. Further fallback to apiQuestion.topic if finalSubTopic is still empty.
    if (isEffectivelyEmpty(finalSubTopic)) {
      const topicFallback = apiQuestion.topic; // Direct access, assuming it might exist
      if (!isEffectivelyEmpty(topicFallback)) {
        finalSubTopic = topicFallback;
      }
    }

    // At this point, finalSubTopic is from apiQuestion.subTopicName, apiQuestion.subTopic, apiQuestion.topic, or still effectively empty.
    // finalNormalizedSubTopic is from apiQuestion.normalizedSubTopicName or apiQuestion.normalizedSubTopic.

    const subTopicIsEmpty = isEffectivelyEmpty(finalSubTopic);
    const normalizedSubTopicIsEmpty = isEffectivelyEmpty(finalNormalizedSubTopic);

    if (subTopicIsEmpty && normalizedSubTopicIsEmpty) {
      // Case A: Both are genuinely missing or empty. Default to "Genel".
      finalSubTopic = "Genel";
      finalNormalizedSubTopic = "genel";
    } else if (subTopicIsEmpty && !normalizedSubTopicIsEmpty) {
      // Case B: subTopic is missing/empty, but normalizedSubTopic is present. Derive subTopic.
      finalSubTopic = finalNormalizedSubTopic!
        .split(/[-_]/) // Split by hyphen or underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      // And standardize the existing normalizedSubTopic (e.g., to hyphens and lowercase)
      finalNormalizedSubTopic = finalNormalizedSubTopic!.toLowerCase().trim().replace(/_/g, '-').replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    } else if (!subTopicIsEmpty && normalizedSubTopicIsEmpty) {
      // Case C: subTopic is present, but normalizedSubTopic is missing/empty. Derive normalizedSubTopic.
      finalNormalizedSubTopic = finalSubTopic!
        .toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    } else if (!subTopicIsEmpty && !normalizedSubTopicIsEmpty) {
      // Case D: Both subTopic and normalizedSubTopic are present (and not empty).
      // Standardize normalizedSubTopic based on the (potentially more reliable) subTopic.
      const expectedNormalized = finalSubTopic!
        .toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Standardize the incoming finalNormalizedSubTopic before comparison/assignment
      const currentNormalizedStandardized = finalNormalizedSubTopic!.toLowerCase().trim().replace(/_/g, '-').replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      if (currentNormalizedStandardized !== expectedNormalized) {
        // console.warn(`[Adapter] Aligning normalizedSubTopic. From: "${finalNormalizedSubTopic}", To: "${expectedNormalized}" (derived from subTopic: "${finalSubTopic}")`);
        finalNormalizedSubTopic = expectedNormalized;
      } else {
        // If they are already aligned, ensure the final version is the standardized 'expectedNormalized' format.
        finalNormalizedSubTopic = expectedNormalized;
      }
    }
    
    const question: Question = {
      id: apiQuestion.id,
      questionText: apiQuestion.questionText,
      options: apiQuestion.options,
      correctAnswer: apiQuestion.correctAnswer,
      explanation: apiQuestion.explanation,
      subTopic: finalSubTopic!, 
      normalizedSubTopic: finalNormalizedSubTopic!,
      difficulty: apiQuestion.difficulty as DifficultyLevel,
      questionType: (apiQuestion.questionType || 'multiple_choice') as QuestionType,
      status: (apiQuestion.status || 'active') as QuestionStatus
    };
    
    return question;
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
      if (typeof item === 'string') { // This case should ideally not happen if selectedSubTopics is SubTopic[]
        return item; 
      } else if (typeof item === 'object' && item && 'name' in item) { // item is SubTopic
        return item.name;
      }
      return '';
    }).filter(Boolean) as string[] || [];

    // Eğer sourceDocument varsa, documentText oluştur
    let documentText = "Örnek belge metni. Bu metin gerçek veri olmadığı için örnek olarak oluşturulmuştur.";
    if (options.sourceDocument?.fileName) {
      documentText = `Dosya: ${options.sourceDocument.fileName} içeriği örnek metin. Bu metin gerçek veri olmadığı için örnek olarak oluşturulmuştur.`;
    }

    // Backend API DTO formatına dönüştür ve undefined değerleri null'a dönüştür
    // Map frontend QuizType to backend ApiQuizGenerationOptionsDto quizType
    let backendQuizType: "quick" | "personalized";
    if (options.quizType === "personalized") {
      backendQuizType = "personalized";
    } else {
      // "general" and "topic_specific" map to "quick"
      backendQuizType = "quick"; 
    }

    if (backendQuizType === 'quick') {
      return {
        quizType: backendQuizType,
        documentText, 
        subTopics: subTopics.length > 0 ? subTopics : ['Genel Konu'], 
        questionCount: options.preferences.questionCount,
        difficulty: options.preferences.difficulty,
        preferences: {
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit ?? null, 
          prioritizeWeakAndMediumTopics: options.preferences.prioritizeWeakAndMediumTopics ?? true, 
        },
      };
    } else if (backendQuizType === 'personalized') {
      return {
        quizType: backendQuizType,
        personalizedQuizType: options.personalizedQuizType as "weakTopicFocused" | "learningObjectiveFocused" | "newTopicFocused" | "comprehensive" | null | undefined, // Cast from PersonalizedQuizFocus
        courseId: options.courseId, 
        documentText: documentText,
        subTopics: subTopics.length > 0 ? subTopics : ['Genel Konu'],
        questionCount: options.preferences.questionCount,
        difficulty: options.preferences.difficulty,
        preferences: {
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit ?? null, 
          prioritizeWeakAndMediumTopics: options.preferences.prioritizeWeakAndMediumTopics ?? true, 
        },
      };
    } else {
      // Fallback, though theoretically unreachable if logic is correct
      return {
        quizType: "quick",
        documentText,
        subTopics: subTopics.length > 0 ? subTopics : ['Genel Konu'],
        questionCount: options.preferences.questionCount,
        difficulty: options.preferences.difficulty,
        preferences: {
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit ?? null, 
          prioritizeWeakAndMediumTopics: options.preferences.prioritizeWeakAndMediumTopics ?? true, 
        },
      };
    }
  }

  /**
   * Frontend QuizSubmissionPayload'ı API DTO formatına dönüştürür
   * AH: Modified to accept the full Quiz object along with answers and time.
   */
  public fromQuizSubmissionPayload(
    quiz: Quiz,
    userAnswers: Record<string, string>,
    elapsedTime?: number | null
  ): ApiQuizSubmissionPayloadDto {
    let backendQuizType: "quick" | "personalized" | "review";
    switch (quiz.quizType) {
      case "personalized":
        backendQuizType = "personalized";
        break;
      case "review":
      case "failed_questions" as QuizType: // Cast to QuizType to resolve comparison error
        backendQuizType = "review";
        break;
      case "general":
      case "topic_specific":
      default:
        backendQuizType = "quick";
        break;
    }

    let backendPersonalizedQuizType: "weakTopicFocused" | "newTopicFocused" | "comprehensive" | null | undefined = null;
    if (quiz.quizType === "personalized" && quiz.personalizedQuizType) {
      if (["weakTopicFocused", "newTopicFocused", "comprehensive"].includes(quiz.personalizedQuizType)) {
        backendPersonalizedQuizType = quiz.personalizedQuizType as "weakTopicFocused" | "newTopicFocused" | "comprehensive";
      }
    }

    const sourceDoc = quiz.sourceDocument;
    const backendSourceDocument = 
      (sourceDoc && sourceDoc.storagePath && sourceDoc.storagePath.trim() !== "")
      ? {
          fileName: sourceDoc.fileName,
          storagePath: sourceDoc.storagePath,
          // documentId remains undefined as it's not in frontend Quiz.sourceDocument
        }
      : null;

    return {
      userAnswers: userAnswers,
      elapsedTime: elapsedTime ?? null,
      quizType: backendQuizType,
      personalizedQuizType: backendPersonalizedQuizType,
      courseId: quiz.courseId ?? null,
      sourceDocument: backendSourceDocument,
      selectedSubTopics: quiz.selectedSubTopics
        ? quiz.selectedSubTopics.map((stName) => ({
            subTopic: stName,
            normalizedSubTopic: stName.toLowerCase().trim().replace(/[^a-z0-9-\\s_]/g, '').replace(/\\s+/g, '_'), // Basic normalization
            // count is optional and not available directly from Quiz.selectedSubTopics (string[])
          }))
        : null,
      preferences: {
        questionCount: quiz.preferences.questionCount,
        difficulty: quiz.preferences.difficulty,
        timeLimit: quiz.preferences.timeLimit ?? null,
        prioritizeWeakAndMediumTopics: quiz.preferences.prioritizeWeakAndMediumTopics ?? null,
      },
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        subTopic: q.subTopicName || q.subTopic, // Ensure these are populated in the Question object
        normalizedSubTopic: q.normalizedSubTopicName || q.normalizedSubTopic, // Ensure these are populated
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard', // Assuming q.difficulty is not 'mixed' for individual questions
      })),
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
