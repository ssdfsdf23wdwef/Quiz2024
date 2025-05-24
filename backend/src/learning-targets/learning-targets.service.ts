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
import { LearningTargetWithQuizzes, LearningTarget } from '../common/interfaces';
import * as admin from 'firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';
import { DocumentsService } from '../documents/documents.service';

type LearningTargetStatus = 'pending' | 'failed' | 'medium' | 'mastered';

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

      // Sıralama parametresini kaldırarak indeks gereksinimini ortadan kaldırıyoruz
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
          // Sıralama kaldırıldı - bileşik indeks gereksinimini ortadan kaldırmak için
          // { field: 'firstEncountered', direction: 'desc' },
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
          status: 'pending', // Öğrenme hedefi durumu: beklemede
          isNew: true, // Yeni oluşturulan hedef olduğu için true
          lastAttemptScorePercent: 0,
          attemptCount: 0,
          successCount: 0,
          failCount: 0,
          mediumCount: 0,
          quizzes: [], // İlişkili sınavlar başlangıçta boş
          createdAt: now,
          updatedAt: now,
          firstEncountered: now,
          lastAttempt: null,
        };
        
        // Batch'e ekle
        batch.set(newRef, newLearningTarget);
        
        // Oluşturulan hedefleri izle
        createdTargets.push(newLearningTarget as LearningTargetWithQuizzes);
        
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
        const newLearningTarget: Omit<LearningTarget, 'id'> & { id: string } = {
          id: newId,
          courseId,
          userId,
          subTopicName: topic.subTopicName,
          normalizedSubTopicName: topic.normalizedSubTopicName,
          status: 'pending', // Default status for new AI-suggested topics
          failCount: 0,
          mediumCount: 0,
          successCount: 0,
          lastAttemptScorePercent: null,
          lastAttempt: null,
          firstEncountered: now.toISOString(),
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
          topics: createdTargets.map(t => t.subTopicName),
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
