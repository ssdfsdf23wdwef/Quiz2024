/**
 * Course Service
 *
 * Kurs ile ilgili işlemleri gerçekleştirir
 * @see PRD 4.2 & 7.2
 */

import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { Course } from '../common/types/course.type';
import { LearningTarget } from '../common/types/learning-target.type';
import { Document } from '../common/types/document.type';
import { Quiz } from '../common/types/quiz.type';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { cascadeDelete } from '../common/utils/firestore.utils';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

// Course ve LearningTarget tipleri artık types klasöründen import ediliyor

// CourseWithRelations tipi
type CourseWithRelations = Course & {
  learningTargets: LearningTarget[];
};

// Belge tipi artık types klasöründen import ediliyor

// Panel sınav tipi
interface DashboardQuiz {
  id: string;
  date: Date;
  score: number;
  quizType: string | null;
}

// Öğrenme hedefi analizi tipi
interface LearningTargetAnalysis {
  id: string;
  subTopicName: string;
  status: string;
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastAttempt: Date | null;
  lastAttemptScorePercent: number | null;
  firstEncountered: Date;
}

// Durum dağılımı tipi
export interface StatusDistribution {
  pending: number;
  failed: number;
  medium: number;
  mastered: number;
  total: number;
}

// Hedef ilerleme tipi
interface TargetProgress {
  targetId: string;
  subTopicName: string;
  currentStatus: string;
  progressData: Array<{
    date: Date;
    score: number;
    status: string;
  }>;
}

// Panel veri tipi
export interface DashboardData {
  courseId: string;
  overallProgress: StatusDistribution;
  recentQuizzes: Array<{
    id: string;
    timestamp: string;
    score: number;
    totalQuestions: number;
  }>;
  progressByTopic: Array<{
    subTopic: string;
    status: string;
    scorePercent: number;
  }>;
}

// İlişkili öğe sayıları tipi
export interface RelatedItemsCount {
  courseId: string;
  learningTargets: number;
  quizzes: number;
  failedQuestions: number;
  documents: number;
  total: number;
}

@Injectable()
export class CoursesService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private firebaseService: FirebaseService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  /**
   * Tüm kursları getirir
   * @param userId Kullanıcı ID'si
   * @returns Kullanıcıya ait kursların listesi
   */
  @LogMethod({ trackParams: true })
  async findAll(userId: string): Promise<Course[]> {
    try {
      this.flowTracker.trackStep('Tüm kurslar getiriliyor', 'CoursesService');

      this.logger.info(
        `${userId} ID'li kullanıcının tüm kursları getiriliyor`,
        'CoursesService.findAll',
        __filename,
        128,
        { userId },
      );

      const courses = await this.firebaseService.findMany<Course>(
        FIRESTORE_COLLECTIONS.COURSES,
        [
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
        { field: 'createdAt', direction: 'desc' },
      );

      this.logger.info(
        `${courses.length} adet kurs başarıyla getirildi`,
        'CoursesService.findAll',
        __filename,
        146,
        { userId, courseCount: courses.length },
      );

      return courses;
    } catch (error) {
      this.logger.logError(error, 'CoursesService.findAll', {
        userId,
        additionalInfo: 'Kurslar getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Belirli bir kursu getirir
   * @param id Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @returns Kurs ve ilişkili öğrenme hedefleri
   * @throws NotFoundException Kurs bulunamazsa
   * @throws ForbiddenException Kullanıcı kursa erişim yetkisine sahip değilse
   */
  @LogMethod({ trackParams: true })
  async findOne(id: string, userId: string): Promise<CourseWithRelations> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kurs getiriliyor`,
        'CoursesService',
      );

      this.logger.info(
        `${id} ID'li kurs getiriliyor`,
        'CoursesService.findOne',
        __filename,
        171,
        { courseId: id, userId },
      );

      const course = await this.firebaseService.findById<Course>(
        FIRESTORE_COLLECTIONS.COURSES,
        id,
      );

      if (!course) {
        throw new NotFoundException(`Kurs bulunamadı: ${id}`);
      }

      // Kullanıcı yetkisi kontrol et
      this.validateCourseOwnership(course, userId);

      // Kursla ilişkili öğrenme hedeflerini al
      const learningTargets =
        await this.firebaseService.findMany<LearningTarget>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          [
            {
              field: 'courseId',
              operator: '==',
              value: id,
            },
          ],
        );

      this.logger.info(
        `${id} ID'li kurs ve ${learningTargets.length} adet öğrenme hedefi başarıyla getirildi`,
        'CoursesService.findOne',
        __filename,
        200,
        { courseId: id, userId, learningTargetsCount: learningTargets.length },
      );

      return {
        ...course,
        learningTargets,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.logError(error, 'CoursesService.findOne', {
        courseId: id,
        userId,
        additionalInfo: 'Kurs getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Yeni kurs oluşturur
   * @param userId Kullanıcı ID'si
   * @param createCourseDto Oluşturulacak kurs bilgileri
   * @returns Oluşturulan kurs
   */
  @LogMethod({ trackParams: true })
  async create(
    userId: string,
    createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    try {
      this.flowTracker.trackStep('Yeni kurs oluşturuluyor', 'CoursesService');

      this.logger.info(
        `${userId} ID'li kullanıcı için yeni kurs oluşturuluyor: ${createCourseDto.name}`,
        'CoursesService.create',
        __filename,
        237,
        { userId, courseName: createCourseDto.name },
      );

      const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name: createCourseDto.name,
      };

      const course = (await this.firebaseService.create<
        Omit<Course, 'id' | 'createdAt' | 'updatedAt'>
      >(FIRESTORE_COLLECTIONS.COURSES, courseData)) as Course;

      this.logger.info(
        `Yeni kurs başarıyla oluşturuldu: ${course.id}`,
        'CoursesService.create',
        __filename,
        254,
        { userId, courseId: course.id, courseName: course.name },
      );

      return course;
    } catch (error) {
      this.logger.logError(error, 'CoursesService.create', {
        userId,
        courseName: createCourseDto.name,
      });
      throw error;
    }
  }

  /**
   * Kurs bilgilerini günceller
   * @param id Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @param updateCourseDto Güncellenecek kurs bilgileri
   * @returns Güncellenen kurs
   * @throws NotFoundException Kurs bulunamazsa
   * @throws ForbiddenException Kullanıcı kursa erişim yetkisine sahip değilse
   */
  @LogMethod({ trackParams: true })
  async update(
    id: string,
    userId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kurs güncelleniyor`,
        'CoursesService',
      );

      this.logger.info(
        `${id} ID'li kurs güncelleniyor`,
        'CoursesService.update',
        __filename,
        285,
        { courseId: id, userId },
      );

      // Önce kursu bul
      const course = await this.findById(id, userId);

      // Kullanıcı yetkisi kontrol et
      this.validateCourseOwnership(course, userId);

      // Kurs verilerini güncelle
      const updatedCourse = await this.firebaseService.update<Course>(
        FIRESTORE_COLLECTIONS.COURSES,
        id,
        updateCourseDto,
      );

      this.logger.info(
        `${id} ID'li kurs başarıyla güncellendi`,
        'CoursesService.update',
        __filename,
        304,
        { courseId: id, userId },
      );

      return updatedCourse;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.logError(error, 'CoursesService.update', {
        courseId: id,
        userId,
        additionalInfo: 'Kurs güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kursu ve ilişkili verileri siler
   * @param id Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @returns Silme işlemi sonucu
   * @throws NotFoundException Kurs bulunamazsa
   * @throws ForbiddenException Kullanıcı kursa erişim yetkisine sahip değilse
   */
  @LogMethod({ trackParams: true })
  async remove(
    id: string,
    userId: string,
  ): Promise<{ message: string; courseId: string }> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kurs siliniyor`,
        'CoursesService',
      );

      this.logger.info(
        `${id} ID'li kurs siliniyor`,
        'CoursesService.remove',
        __filename,
        337,
        { courseId: id, userId },
      );

      // Önce kursu bul
      const course = await this.findById(id, userId);

      // Kullanıcı yetkisi kontrol et
      this.validateCourseOwnership(course, userId);

      try {
        // Cascade silme işlemi - kurs ve tüm ilişkili öğeleri sil
        await cascadeDelete(
          FIRESTORE_COLLECTIONS.COURSES,
          id,
          this.firebaseService.firestore,
          [
            {
              collection: FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
              field: 'courseId',
            },
            {
              collection: FIRESTORE_COLLECTIONS.DOCUMENTS,
              field: 'courseId',
            },
            {
              collection: FIRESTORE_COLLECTIONS.QUIZZES,
              field: 'courseId',
            },
          ],
        );

        this.logger.info(
          `${id} ID'li kurs ve ilişkili öğeler başarıyla silindi`,
          'CoursesService.remove',
          __filename,
          372,
          { courseId: id, userId },
        );

        return {
          message: 'Kurs ve ilişkili tüm veriler başarıyla silindi',
          courseId: id,
        };
      } catch (batchError) {
        this.logger.logError(batchError, 'CoursesService.remove', {
          courseId: id,
          userId,
          additionalInfo: 'Kurs silinirken hata oluştu (batch işlem hatası)',
        });
        throw batchError;
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.logError(error, 'CoursesService.remove', {
        courseId: id,
        userId,
        additionalInfo: 'Kurs silinirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kursa ait öğrenme hedefi istatistiklerini getirir
   * @param id Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @returns Durum dağılımı istatistikleri
   */
  @LogMethod({ trackParams: true })
  async getStats(id: string, userId: string): Promise<StatusDistribution> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kursun istatistikleri getiriliyor`,
        'CoursesService',
      );

      this.logger.info(
        `${id} ID'li kursun istatistikleri getiriliyor`,
        'CoursesService.getStats',
        __filename,
        406,
        { courseId: id, userId },
      );

      // Kursa erişim yetkisini kontrol et
      await this.findById(id, userId);

      // Kursun tüm öğrenme hedeflerini getir
      const learningTargets =
        await this.firebaseService.findMany<LearningTarget>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          [
            {
              field: 'courseId',
              operator: '==',
              value: id,
            },
          ],
        );

      // Durum dağılımını hesapla
      const distribution: StatusDistribution = {
        pending: 0,
        failed: 0,
        medium: 0,
        mastered: 0,
        total: learningTargets.length,
      };

      // LearningTarget statülerini dolaş ve sayıları artır
      learningTargets.forEach((target) => {
        const status = target.status || 'pending';
        if (status in distribution) {
          distribution[status]++;
        }
      });

      this.logger.info(
        `${id} ID'li kursun istatistikleri başarıyla getirildi`,
        'CoursesService.getStats',
        __filename,
        442,
        { courseId: id, userId, distribution },
      );

      return distribution;
    } catch (error) {
      this.logger.logError(error, 'CoursesService.getStats', {
        courseId: id,
        userId,
        additionalInfo: 'Kurs istatistikleri getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kursa ait ilişkili öğelerin sayılarını getirir
   * @param id Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @returns İlişkili öğe sayıları
   */
  @LogMethod({ trackParams: true })
  async getRelatedItemsCount(
    id: string,
    userId: string,
  ): Promise<RelatedItemsCount> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kursun ilişkili öğe sayıları getiriliyor`,
        'CoursesService',
      );

      this.logger.info(
        `${id} ID'li kursun ilişkili öğe sayıları getiriliyor`,
        'CoursesService.getRelatedItemsCount',
        __filename,
        464,
        { courseId: id, userId },
      );

      // Kursun varlığını ve erişim yetkisini kontrol et
      await this.findById(id, userId);

      // İlişkili öğelerin sayısını getir
      const learningTargetsCount = await this.firebaseService.count(
        FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
        [
          {
            field: 'courseId',
            operator: '==',
            value: id,
          },
        ],
      );

      const quizzesCount = await this.firebaseService.count(
        FIRESTORE_COLLECTIONS.QUIZZES,
        [
          {
            field: 'courseId',
            operator: '==',
            value: id,
          },
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
      );

      const failedQuestionsCount = await this.firebaseService.count(
        FIRESTORE_COLLECTIONS.FAILED_QUESTIONS,
        [
          {
            field: 'courseId',
            operator: '==',
            value: id,
          },
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
      );

      const documentsCount = await this.firebaseService.count(
        FIRESTORE_COLLECTIONS.DOCUMENTS,
        [
          {
            field: 'courseId',
            operator: '==',
            value: id,
          },
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
      );

      const total =
        learningTargetsCount +
        quizzesCount +
        failedQuestionsCount +
        documentsCount;

      const result: RelatedItemsCount = {
        courseId: id,
        learningTargets: learningTargetsCount,
        quizzes: quizzesCount,
        failedQuestions: failedQuestionsCount,
        documents: documentsCount,
        total,
      };

      this.logger.info(
        `${id} ID'li kursun ilişkili öğe sayıları başarıyla getirildi`,
        'CoursesService.getRelatedItemsCount',
        __filename,
        514,
        { courseId: id, userId, result },
      );

      return result;
    } catch (error) {
      this.logger.logError(error, 'CoursesService.getRelatedItemsCount', {
        courseId: id,
        userId,
        additionalInfo: 'İlişkili öğe sayıları getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kurs dashboard bilgilerini getirir
   * @param courseId Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @returns Dashboard verisi
   * @throws NotFoundException Kurs bulunamazsa
   * @throws ForbiddenException Kullanıcı kursa erişim yetkisine sahip değilse
   */
  @LogMethod({ trackParams: true })
  async getDashboardData(
    courseId: string,
    userId: string,
  ): Promise<DashboardData> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li kursun panel verileri getiriliyor`,
        'CoursesService',
      );

      this.logger.info(
        `${courseId} ID'li kursun panel verileri getiriliyor`,
        'CoursesService.getDashboardData',
        __filename,
        573,
        { courseId, userId },
      );

      // Kursun varlığını ve erişim yetkisini kontrol et
      await this.findById(courseId, userId);

      // Durum dağılımını al
      const statusDistribution = await this.getStats(courseId, userId);

      // 1. Öğrenme hedeflerini getir
      const learningTargets =
        await this.firebaseService.findMany<LearningTarget>(
          FIRESTORE_COLLECTIONS.LEARNING_TARGETS,
          [
            {
              field: 'courseId',
              operator: '==',
              value: courseId,
            },
          ],
        );

      // 2. Son 10 sınavı getir
      const recentQuizzes = await this.firebaseService.findMany<Quiz>(
        FIRESTORE_COLLECTIONS.QUIZZES,
        [
          {
            field: 'courseId',
            operator: '==',
            value: courseId,
          },
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
        { field: 'timestamp', direction: 'desc' },
        10,
      );

      // 3. Alt konu bazlı ilerleme durumunu hesapla
      const progressByTopic = learningTargets.map((target) => ({
        subTopic: target.subTopicName,
        status: target.status,
        scorePercent: target.lastAttemptScorePercent || 0,
      }));

      // 4. Son sınav sonuçlarını formatla
      const formattedRecentQuizzes = recentQuizzes.map((quiz) => ({
        id: quiz.id,
        timestamp:
          typeof quiz.timestamp === 'string'
            ? quiz.timestamp
            : quiz.timestamp.toISOString(),
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
      }));

      return {
        courseId,
        overallProgress: statusDistribution,
        recentQuizzes: formattedRecentQuizzes,
        progressByTopic,
      };
    } catch (error) {
      this.logger.logError(error, 'CoursesService.getDashboardData', {
        courseId,
        userId,
        additionalInfo: 'Kurs panel verileri getirilirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Belirli bir kursu ID'sine göre getirir
   * @private
   * @param id Kurs ID'si
   * @param userId Kullanıcı ID'si
   * @returns Kurs
   * @throws NotFoundException Kurs bulunamazsa
   * @throws ForbiddenException Kullanıcı kursa erişim yetkisine sahip değilse
   */
  @LogMethod({ trackParams: true })
  private async findById(id: string, userId: string): Promise<Course> {
    try {
      this.logger.info(
        `${id} ID'li kurs bulunuyor`,
        'CoursesService.findById',
        __filename,
        657,
        { courseId: id, userId },
      );

      const course = await this.firebaseService.findById<Course>(
        FIRESTORE_COLLECTIONS.COURSES,
        id,
      );

      if (!course) {
        throw new NotFoundException(`Kurs bulunamadı: ${id}`);
      }

      // Kullanıcı erişimini kontrol et
      this.validateCourseOwnership(course, userId);

      return course;
    } catch (error) {
      // NotFoundException ve ForbiddenException hatalarını yeniden fırlat
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.logError(error, 'CoursesService.findById', {
        courseId: id,
        userId,
        additionalInfo: 'Kurs bulunurken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcının kurs üzerinde yetki sahibi olup olmadığını kontrol eder
   * @param course Kurs nesnesi
   * @param userId Kullanıcı ID'si
   * @throws ForbiddenException Kullanıcı kursa erişim yetkisine sahip değilse
   */
  private validateCourseOwnership(course: Course, userId: string): void {
    if (course.userId !== userId) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }
  }
}
