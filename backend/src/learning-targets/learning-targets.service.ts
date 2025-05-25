import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AiService } from '../ai/ai.service';
import { UpdateLearningTargetDto } from './dto/update-learning-target.dto';
import { NormalizationService } from '../shared/normalization/normalization.service';
import { CreateLearningTargetDto } from './dto/create-learning-target.dto';
import { LearningTargetWithQuizzes } from '../common/interfaces';
import { LearningTarget, LearningTargetStatus, LearningTargetSource } from '../common/types/learning-target.type';
import { DetectNewTopicsDto } from './dto/detect-new-topics.dto';
import { ConfirmNewTopicsDto } from './dto/confirm-new-topics.dto';
import { v4 as uuidv4 } from 'uuid';
import { TopicDetectionService } from '../ai/services/topic-detection.service';
import * as admin from 'firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';
import { DocumentsService } from '../documents/documents.service';

// Legacy type - will be gradually replaced with the LearningTargetStatus enum
type LegacyLearningTargetStatus = 'pending' | 'failed' | 'medium' | 'mastered';

@Injectable()
export class LearningTargetsService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private firebaseService: FirebaseService,
    private aiService: AiService,
    private normalizationService: NormalizationService,
    @Inject(forwardRef(() => DocumentsService))
    private documentsService: DocumentsService,
    @Inject(forwardRef(() => TopicDetectionService))
    private topicDetectionService: TopicDetectionService,
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
   * Create a learning target manually
   * @param dto The create learning target DTO
   * @param userId The user ID
   * @returns The created learning target
   */
  @LogMethod({ trackParams: true })
  async createManualLearningTarget(
    dto: CreateLearningTargetDto,
    userId: string,
  ): Promise<LearningTarget> {
    try {
      this.flowTracker.trackStep(
        'Manuel öğrenme hedefi oluşturuluyor',
        'LearningTargetsService',
      );

      this.logger.info(
        'Manuel öğrenme hedefi oluşturma işlemi başlatılıyor',
        'LearningTargetsService.createManualLearningTarget',
        __filename,
        undefined,
        { userId }
      );

      // Create a new document reference
      const db = this.firebaseService.firestore;
      const targetRef = db.collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS).doc();
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      // Create the learning target object
      const newTarget: Omit<LearningTarget, 'id'> = {
        userId,
        courseId: dto.courseId,
        topicName: dto.topicName,
        status: dto.status || LearningTargetStatus.NOT_STARTED,
        isNewTopic: true,
        source: LearningTargetSource.MANUAL,
        notes: dto.notes,
        createdAt: now as any, // Type assertion to resolve Firestore Timestamp/FieldValue issue
        updatedAt: now as any, // Type assertion to resolve Firestore Timestamp/FieldValue issue
      };

      // Save to Firestore
      await targetRef.set(newTarget);

      this.logger.info(
        'Manuel öğrenme hedefi başarıyla oluşturuldu',
        'LearningTargetsService.createManualLearningTarget',
        __filename,
        undefined,
        { targetId: targetRef.id, userId }
      );

      // Return the created target
      return {
        ...newTarget,
        id: targetRef.id,
        createdAt: null as any, // Will be set by Firestore
        updatedAt: null as any, // Will be set by Firestore
      } as LearningTarget;
    } catch (error) {
      this.logger.error(
        `Manuel öğrenme hedefi oluşturulurken hata: ${error.message}`,
        'LearningTargetsService.createManualLearningTarget',
        __filename,
        undefined,
        error
      );
      throw error;
    }
  }

  /**
   * Find all learning targets for a user, optionally filtered by course ID
   * @param userId The user ID
   * @param courseId Optional course ID filter
   * @returns List of learning targets for the user
   */
  @LogMethod({ trackParams: true })
  async findAllLearningTargetsByUserId(
    userId: string,
    courseId?: string,
  ): Promise<LearningTarget[]> {
    try {
      this.flowTracker.trackStep(
        courseId
          ? `${courseId} ID'li derse ait öğrenme hedefleri listeleniyor`
          : 'Tüm öğrenme hedefleri listeleniyor',
        'LearningTargetsService',
      );
      
      this.logger.info(
        'Kullanıcıya ait öğrenme hedefleri getiriliyor',
        'LearningTargetsService.findAllLearningTargetsByUserId',
        __filename,
        undefined,
        { userId, courseId }
      );

      // Build query based on whether courseId is provided
      let query = this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .where('userId', '==', userId);
        
      if (courseId) {
        query = query.where('courseId', '==', courseId);
      }

      const targetsSnapshot = await query.get();

      // Convert to LearningTarget objects
      const targets: LearningTarget[] = [];
      targetsSnapshot.forEach((doc) => {
        targets.push({
          ...doc.data() as Omit<LearningTarget, 'id'>,
          id: doc.id,
        });
      });

      this.logger.info(
        `${targets.length} adet öğrenme hedefi getirildi`,
        'LearningTargetsService.findAllLearningTargetsByUserId',
        __filename,
        undefined,
        { userId, courseId, targetCount: targets.length }
      );

      return targets;
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefleri getirilirken hata: ${error.message}`,
        'LearningTargetsService.findAllLearningTargetsByUserId',
        __filename,
        undefined,
        error
      );
      throw error;
    }
  }
  
  /**
   * Find learning targets by course ID
   * @param courseId The course ID
   * @param userId The user ID
   * @returns List of learning targets for the specified course
   */
  @LogMethod({ trackParams: true })
  async findByCourse(courseId: string, userId: string): Promise<LearningTarget[]> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li derse ait öğrenme hedefleri listeleniyor`,
        'LearningTargetsService',
      );
      
      this.logger.info(
        `${courseId} ID'li derse ait öğrenme hedefleri getiriliyor`,
        'LearningTargetsService.findByCourse',
        __filename,
        undefined,
        { userId, courseId }
      );

      // Get targets from Firestore
      const targetsSnapshot = await this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .get();

      // Convert to LearningTarget objects
      const targets: LearningTarget[] = [];
      targetsSnapshot.forEach((doc) => {
        targets.push({
          ...doc.data() as Omit<LearningTarget, 'id'>,
          id: doc.id,
        });
      });

      this.logger.info(
        `${targets.length} adet öğrenme hedefi getirildi (course: ${courseId})`,
        'LearningTargetsService.findByCourse',
        __filename,
        undefined,
        { courseId, userId, targetCount: targets.length }
      );

      return targets;
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefleri getirilirken hata: ${error.message}`,
        'LearningTargetsService.findByCourse',
        __filename,
        undefined,
        error
      );
      throw error;
    }
  }
  
  /**
   * Delete a learning target
   * @param targetId ID of the learning target to delete
   * @param userId User ID for verification
   */
  @LogMethod({ trackParams: true })
  async deleteLearningTarget(
    targetId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.flowTracker.trackStep(
        `${targetId} ID'li öğrenme hedefi siliniyor`,
        'LearningTargetsService',
      );
      
      this.logger.info(
        `${targetId} ID'li öğrenme hedefi silme işlemi başlatılıyor`,
        'LearningTargetsService.deleteLearningTarget',
        __filename,
        undefined,
        { targetId, userId }
      );

      // Get target to verify ownership
      const targetRef = this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .doc(targetId);
      
      const targetSnapshot = await targetRef.get();
      
      if (!targetSnapshot.exists) {
        throw new NotFoundException(`${targetId} ID'li öğrenme hedefi bulunamadı`);
      }

      const targetData = targetSnapshot.data() as LearningTarget;
      
      // Verify ownership
      if (targetData.userId !== userId) {
        throw new ForbiddenException('Bu öğrenme hedefini silme yetkiniz yok');
      }

      // Delete the document
      await targetRef.delete();

      this.logger.info(
        `${targetId} ID'li öğrenme hedefi başarıyla silindi`,
        'LearningTargetsService.deleteLearningTarget',
        __filename,
        undefined,
        { targetId, userId }
      );
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefi silinirken hata: ${error.message}`,
        'LearningTargetsService.deleteLearningTarget',
        __filename,
        undefined,
        error
      );
      throw error;
    }
  }

  /**
   * Propose new topics using AI based on existing topics and context
   * @param dto Detection parameters
   * @param userId User ID for logging and flow tracking
   * @returns List of proposed topics with temporary IDs
   */
  @LogMethod({ trackParams: true })
  async proposeNewTopics(
    dto: DetectNewTopicsDto,
    userId: string,
  ): Promise<{ proposedTopics: { tempId: string; name: string; relevance?: string; details?: string }[] }> {
    try {
      this.flowTracker.trackStep(
        `Yeni konu önerileri tespit ediliyor`,
        'LearningTargetsService',
      );

      this.logger.info(
        `${userId} kullanıcısı için yeni konu önerileri tespiti başlatılıyor`,
        'LearningTargetsService.proposeNewTopics',
        __filename,
        undefined,
        { userId, existingTopicCount: dto.existingTopicTexts.length }
      );

      // Get course content if courseId is provided
      let contextText = dto.contextText || '';
      if (dto.courseId && !dto.contextText) {
        // TODO: If needed, get course content from course service
        // For now, just use the existing topics as context if no explicit context is provided
        contextText = dto.existingTopicTexts.join('. ');
      }

      // Call the topic detection service to detect new topics
      const result = await this.topicDetectionService.detectNewTopicsExclusive(
        contextText,
        dto.existingTopicTexts,
      );

      // Assign temporary IDs to the proposed topics
      const proposedTopics = result.proposedTopics.map(topic => ({
        ...topic,
        tempId: uuidv4(), // Generate a unique ID for each proposed topic
      }));

      this.logger.info(
        `${proposedTopics.length} adet yeni konu önerisi tespit edildi`,
        'LearningTargetsService.proposeNewTopics',
        __filename,
        undefined,
        { userId, proposedTopicCount: proposedTopics.length }
      );

      return { proposedTopics };
    } catch (error) {
      this.logger.error(
        `Yeni konu önerileri tespiti sırasında hata: ${error.message}`,
        'LearningTargetsService.proposeNewTopics',
        __filename,
        undefined,
        error,
      );
      throw error;
    }
  }

  /**
   * Confirm and save selected topics as learning targets
   * @param dto The selected topics with temporary IDs
   * @param userId The user ID
   * @returns List of created learning targets
   */
  @LogMethod({ trackParams: true })
  async confirmAndSaveNewTopicsAsLearningTargets(
    dto: ConfirmNewTopicsDto,
    userId: string,
  ): Promise<LearningTarget[]> {
    try {
      this.flowTracker.trackStep(
        `Seçilen konular öğrenme hedefi olarak kaydediliyor`,
        'LearningTargetsService',
      );

      this.logger.info(
        `${userId} kullanıcısı için ${dto.selectedTopics.length} adet öğrenme hedefi oluşturuluyor`,
        'LearningTargetsService.confirmAndSaveNewTopicsAsLearningTargets',
        __filename,
        undefined,
        { userId, selectedTopicCount: dto.selectedTopics.length }
      );

      if (dto.selectedTopics.length === 0) {
        return [];
      }

      // Get Firestore batch for bulk write
      const db = this.firebaseService.firestore;
      const batch = db.batch();
      const now = admin.firestore.FieldValue.serverTimestamp();
      const createdTargets: LearningTarget[] = [];

      // Create a learning target for each selected topic
      for (const topic of dto.selectedTopics) {
        const newTarget: Omit<LearningTarget, 'id'> = {
          userId,
          courseId: dto.courseId,
          topicName: topic.name,
          status: LearningTargetStatus.NOT_STARTED,
          isNewTopic: true,
          source: LearningTargetSource.AI_PROPOSAL,
          originalProposedId: topic.tempId,
          createdAt: now as any, // Type assertion for Firestore Timestamp
          updatedAt: now as any, // Type assertion for Firestore Timestamp
        };

        // Create a new document reference
        const targetRef = db.collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS).doc();
        batch.set(targetRef, newTarget);
        
        // Add to created targets list with temporary ID for return
        // Add to created targets with a placeholder for timestamps
        // This is a workaround for the Timestamp/FieldValue type issue
        createdTargets.push({
          ...newTarget,
          id: targetRef.id,
          createdAt: null as any, // Will be set by Firestore
          updatedAt: null as any, // Will be set by Firestore
        } as LearningTarget);
      }

      // Commit the batch
      await batch.commit();

      this.logger.info(
        `${createdTargets.length} adet öğrenme hedefi başarıyla oluşturuldu`,
        'LearningTargetsService.confirmAndSaveNewTopicsAsLearningTargets',
        __filename,
        undefined,
        { userId, createdCount: createdTargets.length }
      );

      return createdTargets;
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefleri oluşturulurken hata: ${error.message}`,
        'LearningTargetsService.confirmAndSaveNewTopicsAsLearningTargets',
        __filename,
        undefined,
        error,
      );
      throw error;
    }
  }

  /**
        `Kullanıcıya ait öğrenme hedefleri getiriliyor`,
        'LearningTargetsService',
      );
      
      this.logger.info(
        `${userId} kullanıcısına ait öğrenme hedefleri getiriliyor`,
        'LearningTargetsService.findAllLearningTargetsByUserId',
        __filename,
        undefined,
        { userId, courseId }
      );

      // Create query conditions
      const conditions: any[] = [
        {
          field: 'userId',
          operator: '==' as admin.firestore.WhereFilterOp,
          value: userId,
        },
      ];
      
      // Add courseId filter if provided
      if (courseId) {
        conditions.push({
          field: 'courseId',
          operator: '==' as admin.firestore.WhereFilterOp,
          value: courseId,
        });
      }

      // Query Firestore
      const targetsSnapshot = await this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get();
      
      // Convert snapshots to objects
      const targets: LearningTarget[] = [];
      targetsSnapshot.forEach(doc => {
        targets.push({
          id: doc.id,
          ...doc.data(),
        } as LearningTarget);
      });

      this.logger.info(
        `${targets.length} adet öğrenme hedefi getirildi`,
        'LearningTargetsService.findAllLearningTargetsByUserId',
        __filename,
        undefined,
        { userId, courseId, targetCount: targets.length },
      );

      return targets;
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefleri getirilirken hata: ${error.message}`,
        'LearningTargetsService.findAllLearningTargetsByUserId',
        __filename,
        undefined,
        error,
      );
      throw error;
    }
  }
  // This was a duplicate method that has been removed

  /**
   * Update a learning target
   * @param targetId ID of the learning target to update
   * @param userId User ID for verification
   * @param dto Update data
   * @returns Updated learning target
   */
  @LogMethod({ trackParams: true })
  async update(
    targetId: string,
    userId: string,
    dto: UpdateLearningTargetDto,
  ): Promise<LearningTarget> {
    try {
      this.flowTracker.trackStep(
        `${targetId} ID'li öğrenme hedefi güncelleniyor`,
        'LearningTargetsService',
      );

      this.logger.info(
        `${targetId} ID'li öğrenme hedefinin güncellenmesi istendi`,
        'LearningTargetsService.update',
        __filename,
        undefined,
        { targetId, userId, updateData: dto }
      );

      // Get the target to verify ownership
      const targetRef = this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .doc(targetId);

      const targetSnapshot = await targetRef.get();
      
      if (!targetSnapshot.exists) {
        throw new NotFoundException(`${targetId} ID'li öğrenme hedefi bulunamadı`);
      }

      const targetData = targetSnapshot.data() as LearningTarget;
      
      // Verify ownership
      if (targetData.userId !== userId) {
        throw new ForbiddenException('Bu öğrenme hedefini güncelleme yetkiniz yok');
      }

      // Prepare update data
      const updateData: Partial<LearningTarget> = {};
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      // Only update fields that are provided
      if (dto.status !== undefined) {
        updateData.status = dto.status;
      }
      
      if (dto.notes !== undefined) {
        updateData.notes = dto.notes;
      }
      
      // Always update the updatedAt timestamp
      updateData.updatedAt = now as any;

      // Update the document
      await targetRef.update(updateData);

      this.logger.info(
        `${targetId} ID'li öğrenme hedefi başarıyla güncellendi`,
        'LearningTargetsService.update',
        __filename,
        undefined,
        { targetId, userId }
      );

      // Return the updated target
      return {
        ...targetData,
        ...updateData,
        id: targetId,
        updatedAt: null as any, // Will be set by Firestore
      } as LearningTarget;
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefi güncellenirken hata: ${error.message}`,
        'LearningTargetsService.update',
        __filename,
        undefined,
        error,
      );
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

      return existingTopics.map((t) => t.subTopicName); // Using subTopicName from the database
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
          // Sıralama kaldırıldı - bileşik indeks gereksinimini ortadan kaldırmak için
          // { field: 'firstEncountered', direction: 'desc' },
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
   * @param targetId The ID of the learning target to update
   * @param dto The update data
   * @param userId The user ID
   * @returns The updated learning target
   */
  @LogMethod({ trackParams: true })
  async updateLearningTarget(
    targetId: string,
    dto: UpdateLearningTargetDto,
    userId: string,
  ): Promise<LearningTarget> {
    try {
      this.flowTracker.trackStep(
        `${targetId} ID'li öğrenme hedefi güncelleniyor`,
        'LearningTargetsService',
      );

      this.logger.info(
        `${targetId} ID'li öğrenme hedefi güncelleniyor`,
        'LearningTargetsService.updateLearningTarget',
        __filename,
        undefined,
        { targetId, userId }
      );

      // Get the existing target to verify ownership
      const targetRef = this.firebaseService.firestore
        .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
        .doc(targetId);

      const targetSnapshot = await targetRef.get();
      
      if (!targetSnapshot.exists) {
        throw new NotFoundException(`${targetId} ID'li öğrenme hedefi bulunamadı`);
      }

      const targetData = targetSnapshot.data() as LearningTarget;
      
      // Verify ownership
      if (targetData.userId !== userId) {
        throw new ForbiddenException('Bu öğrenme hedefini güncelleme yetkiniz yok');
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add fields to update if they exist in DTO
      if (dto.status !== undefined) {
        updateData.status = dto.status;
      }

      if (dto.notes !== undefined) {
        updateData.notes = dto.notes;
      }

      // Update the document
      await targetRef.update(updateData);

      this.logger.info(
        `${targetId} ID'li öğrenme hedefi başarıyla güncellendi`,
        'LearningTargetsService.updateLearningTarget',
        __filename,
        undefined,
        { targetId, userId, updateFields: Object.keys(updateData).filter(k => k !== 'updatedAt') }
      );

      // Return the updated target
      // We're using the existing data + updates for return value since we don't have a direct method to get fresh data with Timestamp handling
      return {
        ...targetData,
        ...updateData,
        id: targetId,
        updatedAt: null as any, // Will be set by Firestore
      } as LearningTarget;
    } catch (error) {
      this.logger.error(
        `Öğrenme hedefi güncellenirken hata: ${error.message}`,
        'LearningTargetsService.updateLearningTarget',
        __filename,
        undefined,
        error,
      );
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
        createLearningTargetDto.courseId || '',
        userId,
      );

      const normalizedName = this.normalizationService.normalizeSubTopicName(
        createLearningTargetDto.topicName,
      );

      this.logger.debug(
        `Öğrenme hedefi normalizasyonu: "${createLearningTargetDto.topicName}" -> "${normalizedName}"`,
        'LearningTargetsService.create',
        __filename,
        235,
        {
          userId,
          courseId: createLearningTargetDto.courseId || '',
          subTopicName: createLearningTargetDto.topicName,
          normalizedName,
        },
      );

      const now = new Date();

      // Create target with required properties, using type assertion to handle model differences
      const newTarget = {
        userId,
        normalizedSubTopicName: normalizedName,
        subTopicName: createLearningTargetDto.topicName, // Using topicName from DTO but mapping to subTopicName for compatibility
        status: LearningTargetStatus.NOT_STARTED as any, // Type assertion to handle legacy status mapping
        failCount: 0,
        mediumCount: 0,
        successCount: 0,
        lastAttempt: null,
        lastAttemptScorePercent: null,
        quizzes: [],
        attemptCount: 0,
        notes: createLearningTargetDto.notes,
        courseId: createLearningTargetDto.courseId || '',
        createdAt: now as any,
        updatedAt: now as any,
        source: LearningTargetSource.MANUAL,
        firstEncountered: now, // Adding required property
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
          topicName: createLearningTargetDto.topicName, // Using topicName to match the new model structure
          courseId: createLearningTargetDto.courseId || '',
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
  async analyzeDocumentForTopics(
    documentId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      this.logger.debug(
        `Belge ID ${documentId} için belge metnini getiriliyor...`,
        'LearningTargetsService.analyzeDocumentForTopics',
        __filename,
        undefined,
        { documentId, userId },
      );

      // Belge ID kullanarak belge metnini al
      const documentTextResponse = await this.documentsService.getDocumentText(
        documentId,
        userId,
      );

      // Belge metni dönüş tipini kontrol et
      if (!documentTextResponse || !documentTextResponse.text) {
        this.logger.warn(
          `Belge metni alınamadı veya boş (ID: ${documentId})`,
          'LearningTargetsService.analyzeDocumentForTopics',
          __filename,
          undefined,
          { documentId, userId },
        );
        throw new BadRequestException('Geçerli bir belge metni bulunamadı.');
      }

      // Belge metni aldığımızı logla
      this.logger.debug(
        `Belge metni alındı (${documentTextResponse.text.length} karakter)`,
        'LearningTargetsService.analyzeDocumentForTopics',
        __filename,
        undefined,
        {
          documentId,
          userId,
          textLength: documentTextResponse.text.length,
        },
      );

      // Belge metninden konuları tespit et
      this.logger.debug(
        'AI servisi kullanılarak konular tespit ediliyor...',
        'LearningTargetsService.analyzeDocumentForTopics',
        __filename,
        undefined,
        { documentId, userId },
      );

      // AI servisini kullanarak metinden konuları tespit et
      const topicResult = await this.aiService.detectTopics(
        documentTextResponse.text,
      );

      // topicResult.topics dizisindeki her bir topic nesnesinden (SubTopic bekliyoruz)
      // subTopicName veya alternatiflerini alarak string dizisi oluştur
      if (topicResult && Array.isArray(topicResult.topics)) {
        return topicResult.topics.map(
          (
            topic: any, // topic'in SubTopic veya benzeri bir yapıda olması beklenir
          ) =>
            topic.subTopicName ||
            topic.normalizedSubTopicName ||
            topic.mainTopic || // Eğer mainTopic de bir olasılıksa
            'Bilinmeyen konu',
        );
      }

      // Eğer topics dizisi yoksa boş dizi dön
      return [];
    } catch (error) {
      this.logger.logError(
        error,
        'LearningTargetsService.analyzeDocumentForTopics',
        {
          userId,
          documentId,
          additionalInfo: 'Belge analizinde hata oluştu',
        },
      );
      throw error;
    }
  }

  /**
   * Doğrudan metin içeriğinden konuları tespit eder
   */
  @LogMethod({ trackParams: true })
  async analyzeDocumentText(
    documentText: string,
    userId: string,
  ): Promise<string[]> {
    try {
      this.logger.debug(
        `Doğrudan metin analizi başlatılıyor (${documentText.length} karakter)`,
        'LearningTargetsService',
        __filename,
      );

      // AI servisi ile konuları tespit et
      const topicResult = await this.aiService.detectTopics(documentText);

      // TopicDetectionResult nesnesini string dizisine dönüştür
      const topics = topicResult.topics.map(
        (topic) =>
          topic.subTopicName ||
          topic.normalizedSubTopicName ||
          'Bilinmeyen konu',
      );

      this.logger.info(
        `${topics.length} adet konu tespit edildi`,
        'LearningTargetsService',
        __filename,
      );

      this.logger.debug(
        'Metinden çıkarılan konular',
        'LearningTargetsService',
        __filename,
        undefined,
        {
          userId,
          topicCount: topics.length,
          topics: topics.join(', '),
        },
      );

      return topics;
    } catch (error) {
      this.logger.logError(
        error,
        'LearningTargetsService.analyzeDocumentText',
        {
          userId,
          textLength: documentText?.length || 0,
          additionalInfo: 'Metin içinden konular tespit edilirken hata oluştu',
        },
      );
      return [];
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

      // Her bir konu için öğrenme hedefi oluştur
      for (const topic of uniqueTopics) {
        // Eğer normalizedSubTopicName zaten tanımlı değilse, oluştur
        const normalizedName = topic.normalizedSubTopicName || 
          this.normalizationService.normalizeSubTopicName(topic.subTopicName);
        
        // Yeni öğrenme hedefi ID'si (Firestore'un benzersiz ID oluşturma metodunu kullanıyoruz)
        const newId = this.firebaseService.generateId();
        
        // Yeni belge referansı
        const newRef = this.firebaseService.firestore
          .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
          .doc(newId);
        
        // Öğrenme hedefi verisi - tüm hedefler "pending" (beklemede) olarak kaydediliyor
        const newLearningTarget = {
          id: newId,
          courseId,
          userId,
          subTopicName: topic.subTopicName,
          normalizedSubTopicName: normalizedName,
          status: LearningTargetStatus.NOT_STARTED, // Öğrenme hedefi durumu: beklemede
          isNew: true, // Yeni oluşturulan hedef olduğu için true
          lastAttemptScorePercent: 0,
          attemptCount: 0,
          successCount: 0,
          failCount: 0,
          mediumCount: 0,
          quizzes: [], // İlişkili sınavlar başlangıçta boş
          createdAt: now as any, // Type assertion for Firestore Timestamp
          updatedAt: now as any, // Type assertion for Firestore Timestamp
          firstEncountered: now,
          lastAttempt: null,
        };
        
        // Batch'e ekle
        batch.set(newRef, newLearningTarget);
        
        // Oluşturulan hedefleri izle
        // Use double type assertion to safely convert between incompatible types
        createdTargets.push(newLearningTarget as unknown as LearningTargetWithQuizzes);
        
        this.logger.debug(
          `Yeni öğrenme hedefi oluşturuldu: ${newId} (${topic.subTopicName})`,
          'LearningTargetsService.createBatch',
          __filename,
          500,
          { targetId: newId, topicName: topic.subTopicName }
        );
      }

      // Kayıt yapılacak öğrenme hedefi sayısını logla
      this.logger.info(
        `${createdTargets.length} adet yeni öğrenme hedefi oluşturulacak`,
        'LearningTargetsService.createBatch',
        __filename,
        510,
        { courseId, userId, count: createdTargets.length }
      );

      try {
        // Batch işlemini commit et
        await batch.commit();
        
        this.logger.info(
          `${createdTargets.length} adet yeni öğrenme hedefi başarıyla oluşturuldu`,
          'LearningTargetsService.createBatch',
          __filename,
          520,
          { courseId, userId, count: createdTargets.length }
        );
        
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
   * Confirm and save new AI-suggested topics
   * This method processes AI-suggested topics that have been confirmed by the user
   */
  @LogMethod({ trackParams: true })
  async confirmAndSaveNewTopics(
    courseId: string,
    newTopicNames: string[],
    userId: string,
  ): Promise<LearningTarget[]> {
    try {
      this.flowTracker.trackStep(
        `${newTopicNames.length} adet AI önerisi konuları onaylanarak kaydediliyor`,
        'LearningTargetsService',
      );

      // Validate inputs
      if (!courseId || !Array.isArray(newTopicNames) || !userId) {
        throw new BadRequestException(
          'Geçersiz parametreler: courseId, newTopicNames ve userId gereklidir',
        );
      }

      if (newTopicNames.length === 0) {
        this.logger.info(
          'Onaylanacak konu bulunamadı',
          'LearningTargetsService.confirmAndSaveNewTopics',
          __filename,
          undefined,
          { courseId, userId },
        );
        return [];
      }

      // Verify course ownership
      await this.validateCourseOwnership(courseId, userId);

      this.logger.debug(
        `AI önerisi konular onaylanarak kaydediliyor: ${newTopicNames.join(', ')}`,
        'LearningTargetsService.confirmAndSaveNewTopics',
        __filename,
        undefined,
        {
          courseId,
          userId,
          topicCount: newTopicNames.length,
          topics: newTopicNames,
        },
      );

      // Get existing topics to check for duplicates
      const existingTopics = await this.getExistingTopics(courseId);
      const existingNormalizedTopics = existingTopics.map((topic) =>
        this.normalizationService.normalizeSubTopicName(topic),
      );

      this.logger.debug(
        `${existingTopics.length} adet mevcut konu kontrol ediliyor`,
        'LearningTargetsService.confirmAndSaveNewTopics',
        __filename,
        undefined,
        {
          courseId,
          userId,
          existingTopicCount: existingTopics.length,
        },
      );

      // Filter out duplicates and prepare topics for creation
      const uniqueTopics: Array<{ subTopicName: string; normalizedSubTopicName: string }> = [];
      const duplicateTopics: string[] = [];

      for (const topicName of newTopicNames) {
        const normalizedName = this.normalizationService.normalizeSubTopicName(topicName);
        
        if (existingNormalizedTopics.includes(normalizedName)) {
          duplicateTopics.push(topicName);
        } else {
          uniqueTopics.push({
            subTopicName: topicName,
            normalizedSubTopicName: normalizedName,
          });
        }
      }

      if (duplicateTopics.length > 0) {
        this.logger.warn(
          `Duplicate topics filtered out: ${duplicateTopics.join(', ')}`,
          'LearningTargetsService.confirmAndSaveNewTopics',
          __filename,
          undefined,
          {
            courseId,
            userId,
            duplicateCount: duplicateTopics.length,
            duplicates: duplicateTopics,
          },
        );
      }

      if (uniqueTopics.length === 0) {
        this.logger.info(
          'Tüm konular zaten mevcut, yeni konu eklenmedi',
          'LearningTargetsService.confirmAndSaveNewTopics',
          __filename,
          undefined,
          { courseId, userId, duplicateCount: duplicateTopics.length },
        );
        return [];
      }

      // Create learning targets with batch operation
      const now = new Date();
      const batch = this.firebaseService.firestore.batch();
      const createdTargets: LearningTarget[] = [];

      for (const topic of uniqueTopics) {
        // Generate unique ID for the new learning target
        const newId = this.firebaseService.generateId();
        
        // Create document reference
        const newRef = this.firebaseService.firestore
          .collection(FIRESTORE_COLLECTIONS.LEARNING_TARGETS)
          .doc(newId);
        
        // Create learning target data with AI-generated source
        const newLearningTarget = {
          id: newId,
          courseId,
          userId,
          topicName: topic.subTopicName, // Using topicName for new model compatibility
          status: LearningTargetStatus.NOT_STARTED, // Default status for new AI-suggested topics
          failCount: 0,
          mediumCount: 0,
          successCount: 0,
          lastAttemptScorePercent: null,
          lastAttempt: null,
          firstEncountered: now.toISOString(),
          // Adding missing required properties
          isNewTopic: true,
          source: 'ai_proposal' as LearningTargetSource, // Using string literal value since it's not an enum
          createdAt: now as any, // Type assertion for Timestamp compatibility
          updatedAt: now as any, // Type assertion for Timestamp compatibility
          attemptCount: 0,
          quizzes: [],
          notes: '',
        };
        
        // Add to batch
        batch.set(newRef, newLearningTarget);
        
        // Track created targets
        createdTargets.push(newLearningTarget);
        
        this.logger.debug(
          `AI önerisi konu öğrenme hedefi olarak hazırlandı: ${newId} (${topic.subTopicName})`,
          'LearningTargetsService.confirmAndSaveNewTopics',
          __filename,
          undefined,
          { 
            targetId: newId, 
            topicName: topic.subTopicName,
          },
        );
      }

      this.logger.info(
        `${createdTargets.length} adet AI önerisi konu öğrenme hedefi olarak kaydedilecek`,
        'LearningTargetsService.confirmAndSaveNewTopics',
        __filename,
        undefined,
        { 
          courseId, 
          userId, 
          count: createdTargets.length,
        },
      );

      // Execute batch operation
      await batch.commit();
      
      this.logger.info(
        `${createdTargets.length} adet AI önerisi konu başarıyla öğrenme hedefi olarak kaydedildi`,
        'LearningTargetsService.confirmAndSaveNewTopics',
        __filename,
        undefined,
        { 
          courseId, 
          userId, 
          count: createdTargets.length,
          topics: createdTargets.map(t => t.topicName),
        },
      );

      return createdTargets;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsService.confirmAndSaveNewTopics', {
        courseId,
        userId,
        topicCount: newTopicNames?.length || 0,
        topics: newTopicNames,
        additionalInfo: 'AI önerisi konular kaydedilirken hata oluştu',
      });
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
