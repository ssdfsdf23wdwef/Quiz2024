/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AiService } from '../ai/ai.service';
import { LearningTargetsService } from '../learning-targets/learning-targets.service';
import { QuizAnalysisService } from './quiz-analysis.service';
import { GenerateQuizDto, TopicDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { LearningTargetStatus } from '../learning-targets/interfaces/learning-target.interface';
import { Quiz, AnalysisResult } from '../common/interfaces';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@Injectable()
export class QuizzesService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
  findAll: any;

  constructor(
    private firebaseService: FirebaseService,
    private aiService: AiService,
    private learningTargetsService: LearningTargetsService,
    private quizAnalysisService: QuizAnalysisService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'QuizzesService başlatıldı',
      'QuizzesService.constructor',
      __filename,
      29,
    );
  }

  /**
   * Find all quizzes for a user
   */
  @LogMethod({ trackParams: true })
  async findAllForUser(userId: string): Promise<Quiz[]> {
    try {
      this.flowTracker.trackStep(
        `${userId} ID'li kullanıcının tüm sınavları getiriliyor`,
        'QuizzesService',
      );

      const snapshot = await this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.QUIZZES)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();

      // Firebase sonuçlarını Quiz tipine dönüştürüyoruz
      const quizzes = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as unknown as Quiz;
      });

      this.logger.info(
        `${quizzes.length} adet sınav getirildi`,
        'QuizzesService.findAllForUser',
        __filename,
        58,
        { userId, quizzesCount: quizzes.length },
      );

      return quizzes;
    } catch (error) {
      this.logger.logError(error, 'QuizzesService.findAllForUser', {
        userId,
        additionalInfo: 'Kullanıcının sınavları getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Find quiz by id
   */
  @LogMethod({ trackParams: true })
  async findOne(id: string, userId: string): Promise<Quiz> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li sınav getiriliyor`,
        'QuizzesService',
      );

      const doc = await this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.QUIZZES)
        .doc(id)
        .get();

      if (!doc.exists) {
        this.logger.warn(
          `${id} ID'li sınav bulunamadı`,
          'QuizzesService.findOne',
          __filename,
          86,
          { quizId: id, userId },
        );
        throw new NotFoundException('Sınav bulunamadı');
      }

      const quizData = doc.data();
      const quiz = { id: doc.id, ...quizData } as unknown as Quiz;

      if (quiz.userId !== userId) {
        this.logger.warn(
          `Yetkisiz erişim: ${userId} kullanıcısı ${id} ID'li sınava erişim yetkisine sahip değil`,
          'QuizzesService.findOne',
          __filename,
          98,
          { quizId: id, userId, ownerId: quiz.userId },
        );
        throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
      }

      this.logger.debug(
        `${id} ID'li sınav başarıyla getirildi`,
        'QuizzesService.findOne',
        __filename,
        107,
        { quizId: id, userId },
      );

      return quiz;
    } catch (error) {
      // Zaten loglanan hataları tekrar loglama
      if (
        !(
          error instanceof NotFoundException ||
          error instanceof ForbiddenException
        )
      ) {
        this.logger.logError(error, 'QuizzesService.findOne', {
          quizId: id,
          userId,
          additionalInfo: 'Sınav getirilirken hata oluştu',
        });
      }
      throw error;
    }
  }

  /**
   * Find quizzes for a specific course
   */
  @LogMethod({ trackParams: true })
  async findAllByCourse(courseId: string, userId: string) {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li derse ait sınavlar getiriliyor`,
        'QuizzesService',
      );

      // Check if course exists and belongs to user
      await this.validateCourseOwnership(courseId, userId);

      const snapshot = await this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.QUIZZES)
        .where('courseId', '==', courseId)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();

      const quizzes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.logger.info(
        `${courseId} ID'li derse ait ${quizzes.length} adet sınav getirildi`,
        'QuizzesService.findAllByCourse',
        __filename,
        148,
        { courseId, userId, quizzesCount: quizzes.length },
      );

      return quizzes;
    } catch (error) {
      this.logger.logError(error, 'QuizzesService.findAllByCourse', {
        courseId,
        userId,
        additionalInfo: 'Derse ait sınavlar getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Generate a new quiz using AI
   */
  async generateQuiz(dto: GenerateQuizDto, userId: string) {
    // Validate course ownership if a course ID is provided
    if (dto.courseId) {
      await this.validateCourseOwnership(dto.courseId, userId);
    }

    // Set up generation options
    const generationOptions = {
      quizType: dto.quizType,
      courseId: dto.courseId,
      personalizedQuizType: dto.personalizedQuizType,
      difficulty: dto.preferences.difficulty || 'medium',
      questionCount: dto.preferences.questionCount || 5,
      prioritizeWeakAndMediumTopics:
        dto.preferences.prioritizeWeakAndMediumTopics !== false,
    };

    // Get selected topics if not provided
    let selectedTopics = dto.selectedSubTopics || [];

    // For personalized quizzes, get topics based on the personalization type
    if (dto.quizType === 'personalized' && dto.courseId) {
      if (!dto.personalizedQuizType) {
        throw new BadRequestException(
          'Kişiselleştirilmiş sınav tipi belirtilmelidir',
        );
      }

      // Get appropriate topics based on the personalization type
      if (dto.personalizedQuizType === 'weakTopicFocused') {
        const weakTopics = await this.firebaseService.firestore
          .collection('learningTargets')
          .where('courseId', '==', dto.courseId)
          .where('userId', '==', userId)
          .where('status', 'array-contains', 'failed')
          .where('status', 'array-contains', 'medium')
          .select('subTopicName', 'normalizedSubTopicName', 'status')
          .get()
          .then((snapshot) =>
            snapshot.docs.map((doc) => ({
              subTopicName: doc.data().subTopicName,
              normalizedSubTopicName: doc.data().normalizedSubTopicName,
              status: doc.data().status,
            })),
          );

        if (weakTopics.length === 0) {
          throw new BadRequestException(
            'Zayıf konu bulunamadı. Lütfen başka bir sınav tipi seçin.',
          );
        }

        // PRD 4.6.1: Zayıf/Orta Odaklı sınav için, duruma göre sonuçları sırala
        // Önce 'failed', sonra 'medium' durumundaki konular
        selectedTopics = weakTopics
          .sort((a, b) => {
            // 'failed' durumunda olanları başa yerleştir
            if (a.status === 'failed' && b.status !== 'failed') return -1;
            if (a.status !== 'failed' && b.status === 'failed') return 1;
            return 0;
          })
          .map((t) => ({
            subTopic: t.subTopicName,
            normalizedSubTopic: t.normalizedSubTopicName,
            status: t.status,
          }));
      } else if (dto.personalizedQuizType === 'newTopicFocused') {
        const newTopics = await this.firebaseService.firestore
          .collection('learningTargets')
          .where('courseId', '==', dto.courseId)
          .where('userId', '==', userId)
          .where('status', '==', 'pending')
          .select('subTopicName', 'normalizedSubTopicName', 'status')
          .get()
          .then((snapshot) =>
            snapshot.docs.map((doc) => ({
              subTopicName: doc.data().subTopicName,
              normalizedSubTopicName: doc.data().normalizedSubTopicName,
              status: doc.data().status,
            })),
          );

        if (newTopics.length === 0) {
          throw new BadRequestException(
            'Yeni konu bulunamadı. Lütfen başka bir sınav tipi seçin.',
          );
        }

        selectedTopics = newTopics.map((t) => ({
          subTopic: t.subTopicName,
          normalizedSubTopic: t.normalizedSubTopicName,
          status: t.status,
        }));
      } else if (dto.personalizedQuizType === 'comprehensive') {
        // Get a mix of all topics in the course
        const allTopics = await this.firebaseService.firestore
          .collection('learningTargets')
          .where('courseId', '==', dto.courseId)
          .where('userId', '==', userId)
          .select('subTopicName', 'normalizedSubTopicName', 'status')
          .get()
          .then((snapshot) =>
            snapshot.docs.map((doc) => ({
              subTopicName: doc.data().subTopicName,
              normalizedSubTopicName: doc.data().normalizedSubTopicName,
              status: doc.data().status,
            })),
          );

        if (allTopics.length === 0) {
          throw new BadRequestException('Kurs için konu bulunamadı');
        }

        // PRD 4.6.1 & 4.6.2: Kapsamlı sınavda zayıf ve orta konulara öncelik verme
        if (dto.preferences.prioritizeWeakAndMediumTopics) {
          // Group topics by status
          const grouped = {
            failed: allTopics.filter((t) => t.status === 'failed'),
            medium: allTopics.filter((t) => t.status === 'medium'),
            pending: allTopics.filter((t) => t.status === 'pending'),
            mastered: allTopics.filter((t) => t.status === 'mastered'),
          };

          // Calculate proportional distribution (PRD 4.6.2: %60 ağırlık)
          // Zayıf ve orta konulara toplam %60 ağırlık verilir
          const totalQuestions = dto.preferences.questionCount || 10;

          // PRD ile uyumlu, zayıf/orta konular için toplam %60 ağırlık
          const weakMediumWeight = 0.6;
          const otherWeight = 0.4;

          // Proportional distribution with prioritization
          const distribution = {
            failed: Math.round(totalQuestions * (weakMediumWeight * 0.6)), // %60'ın %60'ı = %36
            medium: Math.round(totalQuestions * (weakMediumWeight * 0.4)), // %60'ın %40'ı = %24
            pending: Math.round(totalQuestions * (otherWeight * 0.6)), // %40'ın %60'ı = %24
            mastered: Math.round(totalQuestions * (otherWeight * 0.4)), // %40'ın %40'ı = %16
          };

          // Ensure total adds up to requested count
          let currentTotal = Object.values(distribution).reduce(
            (a, b) => a + b,
            0,
          );
          while (currentTotal < totalQuestions) {
            // Add remaining to strongest priority that has topics
            if (grouped.failed.length > 0) {
              distribution.failed += 1;
            } else if (grouped.medium.length > 0) {
              distribution.medium += 1;
            } else if (grouped.pending.length > 0) {
              distribution.pending += 1;
            } else if (grouped.mastered.length > 0) {
              distribution.mastered += 1;
            } else {
              break; // No topics at all (shouldn't happen due to earlier check)
            }
            currentTotal += 1;
          }

          // Adjust if we don't have enough topics in a category
          if (grouped.failed.length === 0) {
            distribution.medium += distribution.failed;
            distribution.failed = 0;
          } else if (grouped.failed.length < distribution.failed) {
            distribution.medium += distribution.failed - grouped.failed.length;
            distribution.failed = grouped.failed.length;
          }

          if (grouped.medium.length === 0) {
            distribution.pending += distribution.medium;
            distribution.medium = 0;
          } else if (grouped.medium.length < distribution.medium) {
            distribution.pending += distribution.medium - grouped.medium.length;
            distribution.medium = grouped.medium.length;
          }

          if (grouped.pending.length === 0) {
            distribution.mastered += distribution.pending;
            distribution.pending = 0;
          } else if (grouped.pending.length < distribution.pending) {
            distribution.mastered +=
              distribution.pending - grouped.pending.length;
            distribution.pending = grouped.pending.length;
          }

          if (grouped.mastered.length < distribution.mastered) {
            distribution.mastered = grouped.mastered.length;
          }

          // Helper function to select random topics up to the required count
          const selectRandomTopics = (topics, count) => {
            if (count <= 0) return [];
            const shuffled = [...topics].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, Math.min(topics.length, count));
          };

          // Build the selected topics list with counts for AI
          const topicsWithCounts: TopicDto[] = [];

          // Add topics from each category with explicit count and status
          Object.entries(grouped).forEach(([status, topics]) => {
            if (topics.length > 0 && distribution[status] > 0) {
              const selectedForCategory = selectRandomTopics(
                topics,
                distribution[status],
              );

              // Her konu için tam olarak kaç soru üretileceğini belirt
              topicsWithCounts.push(
                ...selectedForCategory.map((t) => ({
                  subTopic: t.subTopicName,
                  normalizedSubTopic: t.normalizedSubTopicName,
                  count: 1, // Default 1 soru
                  status,
                })),
              );
            }
          });

          // Ensure distribution matches exactly the required count
          let assignedQuestions = topicsWithCounts.reduce(
            (sum, topic) => sum + (topic.count ?? 0),
            0,
          );

          // Eksik sorular varsa, zayıf konulara ekleme yap
          let index = 0;
          while (
            assignedQuestions < totalQuestions &&
            topicsWithCounts.length > 0
          ) {
            const statusPriority = ['failed', 'medium', 'pending', 'mastered'];
            for (const priorityStatus of statusPriority) {
              const eligibleTopics = topicsWithCounts.filter(
                (t) => t.status === priorityStatus,
              );
              if (eligibleTopics.length > 0) {
                const targetIndex = index % eligibleTopics.length;
                const targetTopic = eligibleTopics[targetIndex];
                const topicIndex = topicsWithCounts.findIndex(
                  (t) =>
                    t.normalizedSubTopic === targetTopic.normalizedSubTopic,
                );

                if (topicIndex !== -1) {
                  topicsWithCounts[topicIndex].count =
                    (topicsWithCounts[topicIndex].count ?? 0) + 1;
                  assignedQuestions += 1;
                  index += 1;
                  break;
                }
              }
            }
            if (assignedQuestions === totalQuestions) break;
          }

          // Pass this enhanced array to AI service
          selectedTopics = topicsWithCounts;

          this.logger.info(
            `Topic distribution for comprehensive quiz: ${JSON.stringify(distribution)}`,
            'QuizzesService.generateQuiz',
            __filename,
            461,
            { distribution },
          );
          this.logger.info(
            `Selected topics with counts: ${JSON.stringify(
              selectedTopics.map((t) => ({
                subTopic: t.subTopic,
                count: t.count,
                status: t.status,
              })),
            )}`,
            'QuizzesService.generateQuiz',
            __filename,
            473,
            {
              selectedTopics: JSON.stringify(
                selectedTopics.map((t) => ({
                  subTopic: t.subTopic,
                  count: t.count,
                  status: t.status,
                })),
              ),
            },
          );
        } else {
          // Without prioritization, just select random topics
          const shuffled = [...allTopics].sort(() => 0.5 - Math.random());
          const maxTopics = Math.min(
            allTopics.length,
            Math.min(10, dto.preferences.questionCount || 10),
          );

          selectedTopics = shuffled.slice(0, maxTopics).map((t) => ({
            subTopic: t.subTopicName,
            normalizedSubTopic: t.normalizedSubTopicName,
            status: t.status,
            // Her konu için yaklaşık eşit soru sayısı belirle
            count: Math.max(
              1,
              Math.floor((dto.preferences.questionCount || 10) / maxTopics),
            ),
          }));

          // Kalan soruları dağıt
          let assignedQuestions = selectedTopics.reduce(
            (sum, topic) => sum + (topic.count ?? 0),
            0,
          );
          let index = 0;
          while (
            assignedQuestions < (dto.preferences.questionCount || 10) &&
            selectedTopics.length > 0
          ) {
            if (selectedTopics.length > 0) {
              selectedTopics[index % selectedTopics.length].count =
                (selectedTopics[index % selectedTopics.length].count ?? 0) + 1;
              assignedQuestions += 1;
              index += 1;
            }
          }
        }
      }
    }

    // Call AI service to generate questions
    const questions = await this.aiService.generateQuizQuestions({
      ...generationOptions,
      subTopics: (selectedTopics as TopicDto[])
        .map((t) => (typeof t === 'string' ? t : t.normalizedSubTopic))
        .filter((t): t is string => typeof t === 'string' && !!t),
    });

    // Create a new quiz object (not saved to DB yet)
    const newQuiz = {
      userId,
      quizType: dto.quizType,
      personalizedQuizType: dto.personalizedQuizType,
      courseId: dto.courseId ?? '',
      sourceDocument: dto.sourceDocument,
      selectedSubTopics: selectedTopics.map((t) =>
        typeof t === 'string'
          ? t
          : {
              subTopic: t.subTopic,
              normalizedSubTopic: t.normalizedSubTopic,
            },
      ),
      preferences: dto.preferences,
      questions,
    };

    return newQuiz;
  }

  /**
   * Submit answers for a quiz, save to Firestore, and return results.
   */
  async submitQuiz(
    dto: SubmitQuizDto,
    userId: string,
  ): Promise<{ quiz: Quiz; analysis: AnalysisResult }> {
    // Analyze quiz results first
    const analysisResult = this.quizAnalysisService.analyzeQuizResults(
      dto.questions,
      dto.userAnswers,
    );

    // Access the analysis properties correctly from the result's analysisResult property
    const analysis: AnalysisResult = {
      overallScore: analysisResult.analysisResult.overallScore,
      performanceBySubTopic:
        analysisResult.analysisResult.performanceBySubTopic,
      performanceCategorization:
        analysisResult.analysisResult.performanceCategorization,
      performanceByDifficulty:
        analysisResult.analysisResult.performanceByDifficulty,
      recommendations: analysisResult.analysisResult.recommendations || null,
    };

    // Prepare data to save in Firestore
    const quizDataToSave = {
      userId,
      quizType: dto.quizType,
      personalizedQuizType: dto.personalizedQuizType || null,
      courseId: dto.courseId || undefined, // Ensure not null for Quiz interface compatibility
      sourceDocument: dto.sourceDocument,
      selectedSubTopics: dto.selectedSubTopics,
      preferences: dto.preferences,
      questions: dto.questions, // Store questions with the quiz
      userAnswers: dto.userAnswers,
      score: analysis.overallScore,
      correctCount:
        (analysisResult as any).correctCount ||
        (analysisResult as any).totalCorrect ||
        0,
      totalQuestions:
        (analysisResult as any).totalQuestions || dto.questions.length,
      elapsedTime: dto.elapsedTime,
      analysisResult: analysis, // Store the properly typed analysis
      timestamp: new Date(),
    };

    // Save the quiz to Firestore
    const savedQuizRef = await this.firebaseService.firestore
      .collection(FIRESTORE_COLLECTIONS.QUIZZES)
      .add(quizDataToSave);

    const savedQuizId = savedQuizRef.id;

    // TODO: Save failed questions (implementation needed)
    // if (analysis.failedQuestions.length > 0) { ... }

    // Update learning targets status if this was a personalized quiz
    if (dto.quizType === 'personalized' && dto.courseId) {
      await this.updateLearningTargetsFromAnalysis(
        analysis,
        dto.courseId,
        userId,
      );
    }

    // Construct the Quiz object to return (matching the interface)
    const savedTimestamp = quizDataToSave.timestamp as Date;
    const returnedQuiz: Quiz = {
      id: savedQuizId,
      userId: quizDataToSave.userId,
      quizType: quizDataToSave.quizType,
      personalizedQuizType: quizDataToSave.personalizedQuizType || null,
      courseId: quizDataToSave.courseId,
      score: quizDataToSave.score,
      correctCount: quizDataToSave.correctCount,
      totalQuestions: quizDataToSave.totalQuestions,
      elapsedTime: quizDataToSave.elapsedTime || 0, // Varsayılan değer ekle
      userAnswers: quizDataToSave.userAnswers,
      timestamp: savedTimestamp,
      preferences: quizDataToSave.preferences,
      questions: quizDataToSave.questions,
      analysisResult: quizDataToSave.analysisResult,
      sourceDocument: quizDataToSave.sourceDocument,
      selectedSubTopics: quizDataToSave.selectedSubTopics as any, // TODO: Define string[] or similar
    };

    return { quiz: returnedQuiz, analysis };
  }

  // Helper function to update learning targets (implementation needed based on PRD 4.5.x)
  private async updateLearningTargetsFromAnalysis(
    analysis: AnalysisResult,
    courseId: string,
    userId: string, // userId might be needed for the service call
  ): Promise<void> {
    this.logger.info(
      `Updating learning targets for course ${courseId} based on quiz analysis... User: ${userId}`,
      'QuizzesService.updateLearningTargetsFromAnalysis',
      __filename,
      532,
      { courseId, userId },
    );
    // ... implementation ...
    // Placeholder - Implement actual logic
    return Promise.resolve();
  }

  // Helper to calculate status based on score (PRD 4.5.2)
  private calculateStatus(scorePercent: number): LearningTargetStatus {
    if (scorePercent >= 70) return 'mastered';
    if (scorePercent >= 50) return 'medium';
    return 'failed';
  }

  /**
   * Save failed questions for review
   */
  private async saveFailedQuestions(
    quizId: string,
    userId: string,
    courseId: string | null,
    failedQuestions: any[],
  ) {
    const failedQuestionRecords = failedQuestions.map((q) => ({
      userId,
      quizId,
      courseId,
      questionId: q.questionId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      subTopic: q.subTopicName,
      normalizedSubTopic: q.normalizedSubTopicName,
      difficulty: q.difficulty,
    }));

    // Save them in batch
    await this.firebaseService.firestore
      .collection(FIRESTORE_COLLECTIONS.FAILED_QUESTIONS)
      .add(failedQuestionRecords);
  }

  /**
   * Helper method to validate that a course exists and belongs to the user
   */
  @LogMethod({ trackParams: true })
  private async validateCourseOwnership(courseId: string, userId: string) {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li ders sahipliği doğrulanıyor`,
        'QuizzesService',
      );

      const course = await this.firebaseService.findById<{ userId: string }>(
        FIRESTORE_COLLECTIONS.COURSES,
        courseId,
      );

      if (!course) {
        this.logger.warn(
          `${courseId} ID'li ders bulunamadı`,
          'QuizzesService.validateCourseOwnership',
          __filename,
          582,
          { courseId, userId },
        );
        throw new NotFoundException(`Kurs bulunamadı: ${courseId}`);
      }

      if (course.userId !== userId) {
        this.logger.warn(
          `Yetkisiz erişim: ${userId} kullanıcısı ${courseId} ID'li derse erişim yetkisine sahip değil`,
          'QuizzesService.validateCourseOwnership',
          __filename,
          593,
          { courseId, userId, ownerId: course.userId },
        );
        throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır');
      }

      this.logger.debug(
        `${courseId} ID'li ders sahipliği doğrulandı`,
        'QuizzesService.validateCourseOwnership',
        __filename,
        602,
        { courseId, userId },
      );
    } catch (error) {
      // Zaten loglanan hataları tekrar loglama
      if (
        !(
          error instanceof NotFoundException ||
          error instanceof ForbiddenException
        )
      ) {
        this.logger.logError(error, 'QuizzesService.validateCourseOwnership', {
          courseId,
          userId,
          additionalInfo: 'Ders sahipliği doğrulanırken hata oluştu',
        });
      }
      throw error;
    }
  }

  /**
   * Get failed questions for a user, optionally filtered by course
   */
  @LogMethod({ trackParams: true })
  async getFailedQuestions(userId: string, courseId?: string) {
    try {
      this.flowTracker.trackStep(
        courseId
          ? `${courseId} ID'li derse ait başarısız sorular getiriliyor`
          : `${userId} ID'li kullanıcının tüm başarısız soruları getiriliyor`,
        'QuizzesService',
      );

      if (courseId) {
        await this.validateCourseOwnership(courseId, userId);
      }

      const query = this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.FAILED_QUESTIONS)
        .where('userId', '==', userId);

      if (courseId) {
        query.where('courseId', '==', courseId);
      }

      const snapshot = await query.get();
      const failedQuestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.logger.info(
        `${failedQuestions.length} adet başarısız soru getirildi`,
        'QuizzesService.getFailedQuestions',
        __filename,
        644,
        { userId, courseId, questionsCount: failedQuestions.length },
      );

      return failedQuestions;
    } catch (error) {
      this.logger.logError(error, 'QuizzesService.getFailedQuestions', {
        userId,
        courseId,
        additionalInfo: 'Başarısız sorular getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Delete a quiz
   */
  @LogMethod({ trackParams: true })
  async remove(id: string, userId: string) {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li sınav siliniyor`,
        'QuizzesService',
      );

      const quiz = await this.findOne(id, userId);

      // No need to check ownership again since findOne already does that

      // Delete the quiz
      await this.firebaseService.delete(FIRESTORE_COLLECTIONS.QUIZZES, id);

      // Delete any analysis if exists
      const analysisQuery = this.firebaseService.firestore
        .collection('quizAnalysis')
        .where('quizId', '==', id);

      const analysisSnapshot = await analysisQuery.get();
      if (!analysisSnapshot.empty) {
        const batch = this.firebaseService.firestore.batch();
        analysisSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      this.logger.info(
        `${id} ID'li sınav başarıyla silindi`,
        'QuizzesService.remove',
        __filename,
        686,
        { quizId: id, userId },
      );

      return { success: true, message: 'Sınav başarıyla silindi' };
    } catch (error) {
      this.logger.logError(error, 'QuizzesService.remove', {
        quizId: id,
        userId,
        additionalInfo: 'Sınav silinirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Get analysis for a specific quiz (using Prisma)
   */
  async getQuizAnalysis(
    id: string,
    userId: string,
  ): Promise<AnalysisResult | null> {
    const quiz = await this.findOne(id, userId);

    if (!quiz) {
      throw new NotFoundException('Quiz bulunamadı');
    }

    // Since findOne already checks ownership, this check might be redundant
    // but let's keep it as an extra security measure
    if (quiz.userId !== userId) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    if (!quiz.analysisResult) {
      this.logger.warn(
        `Quiz ${id} için analiz sonucu bulunamadı.`,
        'QuizzesService.getQuizAnalysis',
        __filename,
        720,
        { quizId: id, userId },
      );
      return null;
    }
    return quiz.analysisResult as AnalysisResult;
  }

  /**
   * Sınav sorularının karmaşıklığını hesaplar
   * Yardımcı metot
   */
  private calculateQuizComplexity(questions) {
    if (!questions || !questions.length) return null;

    // Zorluk seviyesine göre dağılım
    const difficultyCount = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    questions.forEach((q) => {
      const difficulty = q.difficulty || 'medium';
      if (difficultyCount[difficulty] !== undefined) {
        difficultyCount[difficulty]++;
      }
    });

    // Ortalama zorluk (1:kolay, 2:orta, 3:zor)
    const difficultyValues = { easy: 1, medium: 2, hard: 3 };
    let complexityScore = 0;
    let totalWeight = 0;

    Object.entries(difficultyCount).forEach(([difficulty, count]) => {
      complexityScore += difficultyValues[difficulty] * count;
      totalWeight += count;
    });

    const averageComplexity =
      totalWeight > 0 ? complexityScore / totalWeight : 0;

    return {
      difficultyDistribution: difficultyCount,
      averageComplexity: averageComplexity,
      complexityLevel:
        averageComplexity < 1.5
          ? 'Kolay'
          : averageComplexity < 2.5
            ? 'Orta'
            : 'Zor',
    };
  }

  /**
   * Analiz sonuçlarına göre gelişim önerileri üretir
   * Yardımcı metot
   */
  private generateImprovementSuggestions(analysisResult) {
    if (!analysisResult) return [];

    const suggestions: any[] = [];

    // Başarısız olunan konular için öneriler ekle
    if (analysisResult.performanceCategorization?.failed?.length > 0) {
      suggestions.push({
        priority: 'high',
        type: 'focusAreas',
        message: 'Başarısız olduğunuz konulara yoğunlaşın',
        areas: analysisResult.performanceCategorization.failed,
        action: 'weakTopicReview',
      });
    }

    // Orta seviyede olunan konular için öneriler
    if (analysisResult.performanceCategorization?.medium?.length > 0) {
      suggestions.push({
        priority: 'medium',
        type: 'improveAreas',
        message: 'Geliştirmeniz gereken konular',
        areas: analysisResult.performanceCategorization.medium,
        action: 'practiceMore',
      });
    }

    // Genel puana göre öneriler
    const overallScore = analysisResult.overallScore || 0;
    if (overallScore < 50) {
      suggestions.push({
        priority: 'high',
        type: 'generalStudy',
        message: 'Temel kavramları gözden geçirmeniz önerilir',
        action: 'basicReview',
      });
    } else if (overallScore < 70) {
      suggestions.push({
        priority: 'medium',
        type: 'targetedStudy',
        message: 'Eksik konularınızı tamamlamanız önerilir',
        action: 'targetedReview',
      });
    } else {
      suggestions.push({
        priority: 'low',
        type: 'advancedStudy',
        message: 'Konuları iyi anlamışsınız, yeni konulara geçebilirsiniz',
        action: 'moveToNext',
      });
    }

    return suggestions;
  }

  /**
   * Alt konu adını normalize eder (normalize edilmiş ad yoksa)
   * Yardımcı metot
   */
  private normalizeName(name: string): string {
    this.logger.info(
      `Normalizing name: ${name}`,
      'QuizzesService.normalizeName',
      __filename,
      785,
      { name },
    );

    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Başarısız sorulardan tekrar sınavı oluşturur
   * PRD 4.7.4 - Kullanıcının geçmişte yanlış cevapladığı soruları temel alarak sınav oluşturma
   */
  async generateReviewQuiz(
    courseId: string | null,
    userId: string,
    questionCount: number = 10,
  ): Promise<Record<string, any>> {
    this.logger.info(
      `Generating review quiz for user ${userId} with course ${courseId || 'all'}`,
      'QuizzesService.generateReviewQuiz',
      __filename,
      807,
      { courseId, userId, questionCount },
    );

    // Course ID varsa, dersin kullanıcıya ait olduğunu kontrol et
    if (courseId) {
      await this.validateCourseOwnership(courseId, userId);
    }

    // Kullanıcının yanlış cevapladığı soruları getir
    const failedQuestions = (await this.getFailedQuestions(
      userId,
      courseId ?? undefined,
    )) as any[];

    if (failedQuestions.length === 0) {
      throw new BadRequestException(
        'Tekrar sınavı için yeterli başarısız soru bulunamadı',
      );
    }

    // Soruları tarihe göre sırala (en yeniden en eskiye)
    const sortedQuestions = [...failedQuestions].sort(
      (a, b) =>
        new Date((a as any).failedTimestamp).getTime() -
        new Date((b as any).failedTimestamp).getTime(),
    );

    // Soru sayısını kontrol et (istenen soru sayısı kadar veya mevcut tüm sorular)
    const selectedCount = Math.min(questionCount, sortedQuestions.length);

    // En son yanlış cevaplanan sorular kullanılır
    // (Yeni versiyon ayrıca benzersiz soruları almaya dikkat eder)
    const uniqueQuestionIds = new Set();
    const selectedQuestions: any[] = [];

    for (const question of sortedQuestions as any[]) {
      if (!uniqueQuestionIds.has((question as any).questionId)) {
        uniqueQuestionIds.add((question as any).questionId);
        selectedQuestions.push(question as any);
      }
      if (selectedQuestions.length >= selectedCount) break;
    }

    // FailedQuestion modeli -> QuizQuestion formatına dönüştür
    const quizQuestions = selectedQuestions.map((q, index) => ({
      id: `review_${Date.now()}_${index}`,
      questionText: (q as any).questionText,
      options: (q as any).options,
      correctAnswer: (q as any).correctAnswer,
      explanation: (q as any).explanation || 'Açıklama bulunmuyor',
      subTopic: (q as any).subTopicName,
      normalizedSubTopic: (q as any).normalizedSubTopicName,
      difficulty: (q as any).difficulty,
      originalQuestionId: (q as any).questionId, // Orijinal soru ID'sini referans olarak tut
      failedTimestamp: (q as any).failedTimestamp, // Son başarısız yanıtlama zamanı
    }));

    // Yeni sınav nesnesi oluştur (henüz veritabanına kaydedilmemiş)
    const newQuiz = {
      userId,
      quizType: 'review', // Yeni bir sınav tipi: review
      personalizedQuizType: null,
      courseId,
      sourceDocument: null,
      selectedSubTopics: selectedQuestions.map((q: any) => ({
        subTopic: q.subTopicName,
        normalizedSubTopic: q.normalizedSubTopicName,
      })),
      preferences: {
        difficulty: 'mixed', // Karışık zorluk seviyesi
        questionCount: selectedCount,
      },
      questions: quizQuestions,
    };

    return newQuiz;
  }

  private async findLearningTargetId(subTopicName: string): Promise<string> {
    this.logger.debug(
      `Öğrenme hedefi ID'si aranıyor: ${subTopicName}`,
      'QuizzesService.findLearningTargetId',
      __filename,
      883,
      { subTopicName },
    );

    const target = await this.firebaseService.firestore
      .collection('learningTargets')
      .where('subTopicName', '==', subTopicName)
      .select('id')
      .get();

    if (target.empty) {
      throw new NotFoundException(`Öğrenme hedefi bulunamadı: ${subTopicName}`);
    }

    const doc = target.docs[0];
    return doc.data().id;
  }

  private generateHintForFailedQuestion(question: any, userAnswer: any) {
    this.logger.info(
      `${question.text} sorusu için ipucu oluşturuluyor`,
      'QuizzesService.generateHintForFailedQuestion',
      __filename,
      1023,
      { questionText: question.text, userAnswer },
    );

    // ... existing code ...
  }
}
