import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AiService } from '../ai/ai.service';
import { UpdateLearningTargetDto } from './dto/update-learning-target.dto';
import { NormalizationService } from '../shared/normalization/normalization.service';
import { CreateLearningTargetDto } from './dto/create-learning-target.dto';
import { LearningTargetWithQuizzes } from '../common/interfaces';
import * as admin from 'firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

type LearningTargetStatus = 'pending' | 'failed' | 'medium' | 'mastered';

@Injectable()
export class LearningTargetsService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private firebaseService: FirebaseService,
    private aiService: AiService,
    private normalizationService: NormalizationService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'LearningTargetsService başlatıldı',
      'LearningTargetsService.constructor',
      __filename,
      23,
    );
  }

  /**
   * Get all learning targets for a course
   */
  @LogMethod({ trackParams: true })
  async findByCourse(
    courseId: string,
    userId: string,
  ): Promise<LearningTargetWithQuizzes[]> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li derse ait öğrenme hedefleri getiriliyor`,
        'LearningTargetsService',
      );

      await this.validateCourseOwnership(courseId, userId);

      const targets =
        await this.firebaseService.findMany<LearningTargetWithQuizzes>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          [
            {
              field: 'courseId',
              operator: '==' as admin.firestore.WhereFilterOp,
              value: courseId,
            },
          ],
          { field: 'firstEncountered', direction: 'desc' },
        );

      this.logger.info(
        `${targets.length} adet öğrenme hedefi getirildi`,
        'LearningTargetsService.findByCourse',
        __filename,
        53,
        { courseId, userId, targetCount: targets.length },
      );

      return targets;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.findByCourse', {
        courseId,
        userId,
        additionalInfo: 'Derse ait öğrenme hedefleri getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Get existing topics for a course
   */
  @LogMethod({ trackParams: true })
  private async getExistingTopics(courseId: string): Promise<string[]> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li derse ait mevcut konular getiriliyor`,
        'LearningTargetsService',
      );

      const existingTopics = await this.firebaseService.findMany<{
        subTopicName: string;
      }>(FIRESTORE_COLLECTIONS.LEARNING_TARGETS, [
        {
          field: 'courseId',
          operator: '==' as admin.firestore.WhereFilterOp,
          value: courseId,
        },
      ]);

      this.logger.debug(
        `${existingTopics.length} adet mevcut konu bulundu`,
        'LearningTargetsService.getExistingTopics',
        __filename,
        82,
        { courseId, topicCount: existingTopics.length },
      );

      return existingTopics.map((t) => t.subTopicName);
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.getExistingTopics', {
        courseId,
        additionalInfo: 'Mevcut konular getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Get learning targets by status
   */
  @LogMethod({ trackParams: true })
  async findByStatus(
    courseId: string,
    userId: string,
    status: LearningTargetStatus,
  ): Promise<LearningTargetWithQuizzes[]> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li dersin '${status}' durumundaki öğrenme hedefleri getiriliyor`,
        'LearningTargetsService',
      );

      await this.validateCourseOwnership(courseId, userId);

      const targets =
        await this.firebaseService.findMany<LearningTargetWithQuizzes>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          [
            {
              field: 'courseId',
              operator: '==' as admin.firestore.WhereFilterOp,
              value: courseId,
            },
            {
              field: 'status',
              operator: '==' as admin.firestore.WhereFilterOp,
              value: status,
            },
          ],
          { field: 'firstEncountered', direction: 'desc' },
        );

      this.logger.info(
        `${targets.length} adet '${status}' durumundaki öğrenme hedefi getirildi`,
        'LearningTargetsService.findByStatus',
        __filename,
        120,
        { courseId, userId, status, targetCount: targets.length },
      );

      return targets;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.findByStatus', {
        courseId,
        userId,
        status,
        additionalInfo:
          'Durum bazlı öğrenme hedefleri getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Update a learning target
   */
  @LogMethod({ trackParams: true })
  async update(
    id: string,
    userId: string,
    updateLearningTargetDto: UpdateLearningTargetDto,
  ): Promise<LearningTargetWithQuizzes> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li öğrenme hedefi güncelleniyor`,
        'LearningTargetsService',
      );

      // Verify ownership
      await this.findOne(id, userId);

      const normalizedName = updateLearningTargetDto.subTopicName
        ? this.normalizationService.normalizeSubTopicName(
            updateLearningTargetDto.subTopicName,
          )
        : undefined;

      const now = new Date();

      const updateData = {
        ...updateLearningTargetDto,
        normalizedSubTopicName: normalizedName,
        updatedAt: now,
      };

      this.logger.debug(
        `Öğrenme hedefi güncelleniyor: ${id}`,
        'LearningTargetsService.update',
        __filename,
        159,
        {
          targetId: id,
          userId,
          updateData: JSON.stringify(updateData),
        },
      );

      const updatedTarget =
        await this.firebaseService.update<LearningTargetWithQuizzes>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          id,
          updateData,
        );

      this.logger.info(
        `Öğrenme hedefi güncellendi: ${id}`,
        'LearningTargetsService.update',
        __filename,
        174,
        { targetId: id, userId },
      );

      return updatedTarget;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.update', {
        targetId: id,
        userId,
        updateData: updateLearningTargetDto,
        additionalInfo: 'Öğrenme hedefi güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Delete a learning target
   */
  @LogMethod({ trackParams: true })
  async remove(id: string, userId: string): Promise<void> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li öğrenme hedefi siliniyor`,
        'LearningTargetsService',
      );

      // Verify ownership
      await this.findOne(id, userId);

      await this.firebaseService.delete(
        FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
        id,
      );

      this.logger.info(
        `Öğrenme hedefi silindi: ${id}`,
        'LearningTargetsService.remove',
        __filename,
        204,
        { targetId: id, userId },
      );
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.remove', {
        targetId: id,
        userId,
        additionalInfo: 'Öğrenme hedefi silinirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Create a new learning target
   */
  @LogMethod({ trackParams: true })
  async create(
    userId: string,
    createLearningTargetDto: CreateLearningTargetDto,
  ): Promise<LearningTargetWithQuizzes> {
    try {
      this.flowTracker.trackStep(
        `Yeni öğrenme hedefi oluşturuluyor`,
        'LearningTargetsService',
      );

      // Validate course ownership
      await this.validateCourseOwnership(
        createLearningTargetDto.courseId,
        userId,
      );

      const normalizedName = this.normalizationService.normalizeSubTopicName(
        createLearningTargetDto.subTopicName,
      );

      this.logger.debug(
        `Öğrenme hedefi normalizasyonu: "${createLearningTargetDto.subTopicName}" -> "${normalizedName}"`,
        'LearningTargetsService.create',
        __filename,
        235,
        {
          userId,
          courseId: createLearningTargetDto.courseId,
          subTopicName: createLearningTargetDto.subTopicName,
          normalizedName,
        },
      );

      const now = new Date();

      const newTarget = {
        ...createLearningTargetDto,
        userId,
        normalizedSubTopicName: normalizedName,
        status: 'pending' as LearningTargetStatus,
        failCount: 0,
        mediumCount: 0,
        successCount: 0,
        lastAttempt: null,
        lastAttemptScorePercent: null,
        lastPersonalizedQuizId: null,
        firstEncountered: now,
        quizzes: [],
      };

      const createdDoc = await this.firebaseService.create<
        Omit<LearningTargetWithQuizzes, 'id'>
      >(FIRESTORE_COLLECTIONS.LEARNING_TARGETS, newTarget);

      this.logger.info(
        `Yeni öğrenme hedefi oluşturuldu: ${createdDoc.id}`,
        'LearningTargetsService.create',
        __filename,
        263,
        {
          targetId: createdDoc.id,
          userId,
          subTopicName: createLearningTargetDto.subTopicName,
          courseId: createLearningTargetDto.courseId,
        },
      );

      return {
        ...createdDoc,
        quizzes: [],
        firstEncountered: now,
      } as LearningTargetWithQuizzes;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.create', {
        userId,
        createData: createLearningTargetDto,
        additionalInfo: 'Öğrenme hedefi oluşturulurken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Get all learning targets for a user
   * Alias: findAll - Bu metot kullanıcıya ait tüm öğrenme hedeflerini döndürür
   */
  @LogMethod({ trackParams: true })
  async findMany(userId: string): Promise<LearningTargetWithQuizzes[]> {
    try {
      this.flowTracker.trackStep(
        `Kullanıcıya ait tüm öğrenme hedefleri getiriliyor`,
        'LearningTargetsService',
      );

      const targets =
        await this.firebaseService.findMany<LearningTargetWithQuizzes>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          [
            {
              field: 'userId',
              operator: '==' as admin.firestore.WhereFilterOp,
              value: userId,
            },
          ],
          { field: 'firstEncountered', direction: 'desc' },
        );

      this.logger.info(
        `${targets.length} adet öğrenme hedefi getirildi`,
        'LearningTargetsService.findMany',
        __filename,
        303,
        { userId, targetCount: targets.length },
      );

      return targets;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.findMany', {
        userId,
        additionalInfo:
          'Kullanıcıya ait öğrenme hedefleri getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Get all learning targets for a user
   * @param userId User ID
   */
  @LogMethod({ trackParams: true })
  async findAll(userId: string): Promise<LearningTargetWithQuizzes[]> {
    try {
      this.flowTracker.trackStep(
        `Kullanıcıya ait tüm öğrenme hedefleri getiriliyor`,
        'LearningTargetsService',
      );

      return await this.findMany(userId);
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.findAll', {
        userId,
        additionalInfo:
          'Kullanıcıya ait öğrenme hedefleri getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Get a single learning target by ID
   */
  @LogMethod({ trackParams: true })
  async findOne(
    id: string,
    userId: string,
  ): Promise<LearningTargetWithQuizzes> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li öğrenme hedefi getiriliyor`,
        'LearningTargetsService',
      );

      const target =
        await this.firebaseService.findById<LearningTargetWithQuizzes>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          id,
        );

      if (!target) {
        this.logger.warn(
          `Öğrenme hedefi bulunamadı: ${id}`,
          'LearningTargetsService.findOne',
          __filename,
          350,
          { targetId: id, userId },
        );
        throw new NotFoundException(`Öğrenme hedefi bulunamadı: ${id}`);
      }

      if (target.userId !== userId) {
        this.logger.warn(
          `Yetkisiz erişim: ${userId} kullanıcısı ${id} ID'li öğrenme hedefine erişim yetkisine sahip değil`,
          'LearningTargetsService.findOne',
          __filename,
          360,
          { targetId: id, userId, ownerId: target.userId },
        );
        throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
      }

      this.logger.debug(
        `Öğrenme hedefi getirildi: ${id}`,
        'LearningTargetsService.findOne',
        __filename,
        369,
        { targetId: id, userId },
      );

      return target;
    } catch (error) {
      // Zaten loglanan hataları tekrar loglama
      if (
        !(
          error instanceof NotFoundException ||
          error instanceof ForbiddenException
        )
      ) {
        this.logger.logError(error, 'LearningTargetsService.findOne', {
          targetId: id,
          userId,
          additionalInfo: 'Öğrenme hedefi getirilirken hata oluştu',
        });
      }
      throw error;
    }
  }

  /**
   * Use AI to detect topics in document text
   */
  @LogMethod({ trackParams: true })
  async detectTopics(
    documentText: string,
    courseId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      this.flowTracker.trackStep(
        `Metin içerisinden konular tespit ediliyor`,
        'LearningTargetsService',
      );

      // Verify course ownership
      await this.validateCourseOwnership(courseId, userId);

      this.logger.debug(
        `AI servisi ile konu tespiti yapılıyor`,
        'LearningTargetsService.detectTopics',
        __filename,
        400,
        {
          userId,
          courseId,
          textLength: documentText.length,
        },
      );

      // Call AI service to detect topics
      const topics = await this.aiService.detectTopics(documentText);

      this.logger.info(
        `${topics.length} adet konu tespit edildi`,
        'LearningTargetsService.detectTopics',
        __filename,
        412,
        {
          userId,
          courseId,
          topicCount: topics.length,
          topics: topics.join(', '),
        },
      );

      return topics;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.detectTopics', {
        userId,
        courseId,
        textLength: documentText.length,
        additionalInfo: 'Konular tespit edilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Create multiple learning targets at once
   */
  @LogMethod({ trackParams: true })
  async createBatch(
    courseId: string,
    userId: string,
    topics: Array<{ subTopicName: string; normalizedSubTopicName?: string }>,
  ): Promise<LearningTargetWithQuizzes[]> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li ders için ${topics.length} adet öğrenme hedefi toplu oluşturuluyor`,
        'LearningTargetsService',
      );

      // Verify course ownership
      await this.validateCourseOwnership(courseId, userId);

      // Get existing topics to avoid duplicates
      const existingTopics = await this.getExistingTopics(courseId);
      const existingNormalizedTopics = existingTopics.map((topic) =>
        this.normalizationService.normalizeSubTopicName(topic),
      );

      this.logger.debug(
        `${existingTopics.length} adet mevcut konu bulundu`,
        'LearningTargetsService.createBatch',
        __filename,
        450,
        {
          courseId,
          userId,
          topicCount: topics.length,
          existingTopicCount: existingTopics.length,
        },
      );

      // Filter out duplicates based on normalized names
      const uniqueTopics = topics.filter((topic) => {
        // Normalize if not already normalized
        const normalizedName =
          topic.normalizedSubTopicName ||
          this.normalizationService.normalizeSubTopicName(topic.subTopicName);
        return !existingNormalizedTopics.includes(normalizedName);
      });

      this.logger.debug(
        `${uniqueTopics.length} adet benzersiz yeni konu bulundu`,
        'LearningTargetsService.createBatch',
        __filename,
        466,
        {
          courseId,
          userId,
          uniqueTopicCount: uniqueTopics.length,
        },
      );

      if (uniqueTopics.length === 0) {
        this.logger.info(
          'Eklenecek yeni konu bulunamadı',
          'LearningTargetsService.createBatch',
          __filename,
          477,
          { courseId, userId },
        );
        return []; // No new topics to add
      }

      const now = new Date();
      const batch = this.firebaseService.firestore.batch();
      const createdTargets: LearningTargetWithQuizzes[] = [];

      // Kalan kodu devam ettir...

      try {
        await batch.commit();
        return createdTargets;
      } catch (error) {
        this.logger.logError(error, 'LearningTargetsService.createBatch', {
          courseId,
          userId,
          topicCount: topics.length,
          additionalInfo: 'Öğrenme hedefleri oluşturulurken hata oluştu',
        });
        throw error;
      }
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.createBatch', {
        courseId,
        userId,
        topicCount: topics.length,
        additionalInfo: 'Öğrenme hedefleri oluşturulurken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Update status of multiple learning targets
   */
  async updateMultipleStatuses(
    targetUpdates: Array<{
      id: string;
      status: LearningTargetStatus;
      lastAttemptScorePercent: number;
    }>,
    userId: string,
  ): Promise<LearningTargetWithQuizzes[]> {
    if (targetUpdates.length === 0) {
      return [];
    }

    // Verify ownership of all targets first
    const targetIds = targetUpdates.map((update) => update.id);
    const existingTargets =
      await this.firebaseService.findMany<LearningTargetWithQuizzes>(
        FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
        [
          {
            field: 'id',
            operator: 'in' as admin.firestore.WhereFilterOp,
            value: targetIds,
          },
        ],
      );

    // Check if all targets were found
    if (existingTargets.length !== targetIds.length) {
      const foundIds = new Set(existingTargets.map((t) => t.id));
      const missingIds = targetIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Bazı öğrenme hedefleri bulunamadı: ${missingIds.join(', ')}`,
      );
    }

    // Check if user owns all targets
    const unauthorizedTargets = existingTargets.filter(
      (t) => t.userId !== userId,
    );
    if (unauthorizedTargets.length > 0) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    // Prepare batch update
    const batch = this.firebaseService.firestore.batch();
    const now = new Date();
    const updatedTargets: LearningTargetWithQuizzes[] = [];

    // Update each target
    for (const update of targetUpdates) {
      const target = existingTargets.find((t) => t.id === update.id);
      if (!target) continue; // Should never happen due to checks above

      const targetRef = this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .doc(update.id);

      // Update status counters
      let failCount = target.failCount || 0;
      let mediumCount = target.mediumCount || 0;
      let successCount = target.successCount || 0;

      if (update.status === 'failed') failCount++;
      else if (update.status === 'medium') mediumCount++;
      else if (update.status === 'mastered') successCount++;

      const updateData = {
        status: update.status,
        lastAttempt: now,
        lastAttemptScorePercent: update.lastAttemptScorePercent,
        failCount,
        mediumCount,
        successCount,
        updatedAt: now,
      };

      batch.update(targetRef, updateData);

      // Add to updated targets list
      updatedTargets.push({
        ...target,
        ...updateData,
      });
    }

    try {
      await batch.commit();
      return updatedTargets;
    } catch (error) {
      this.logger.logError(
        error,
        'LearningTargetsService.updateMultipleStatuses',
        {
          targetUpdates: targetUpdates,
          userId,
          additionalInfo: 'Öğrenme hedefleri güncellenirken hata oluştu',
        },
      );
      throw error;
    }
  }

  /**
   * Verify course ownership
   */
  private async validateCourseOwnership(
    courseId: string,
    userId: string,
  ): Promise<void> {
    const course = await this.firebaseService.findById<{ userId: string }>(
      FIRESTORE_COLLECTIONS.COURSES,
      courseId,
    );

    if (!course) {
      throw new NotFoundException(`Kurs bulunamadı: ${courseId}`);
    }

    if (course.userId !== userId) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }
  }
}
