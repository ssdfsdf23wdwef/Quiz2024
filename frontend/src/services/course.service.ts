import apiService from "@/services/api.service";
import { Course, CourseStats, CourseDashboard } from "@/types/course";
import { Document } from "@/types/document";
import { LearningTarget } from "@/types/learningTarget";
import { Quiz } from "@/types/quiz";
import { getLogger, getFlowTracker } from "../lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

/**
 * Kurs servisi
 * Kurslarla ilgili API isteklerini yönetir
 */
@LogClass('CourseService')
class CourseService {
  /**
   * Tüm kursları getirir
   * @returns Kurs listesi
   */
  @LogMethod('CourseService', 'API')
  async getCourses(): Promise<Course[]> {
    flowTracker.markStart('getCourses');
    
    try {
      flowTracker.trackApiCall("/courses", 'GET', 'CourseService.getCourses');
      
      const courses = await apiService.get<Course[]>("/courses");
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getCourses', 'API', 'CourseService');
      logger.debug(
        `${courses.length} kurs getirildi`,
        'CourseService.getCourses',
        __filename,
        30,
        { count: courses.length, duration }
      );
      
      return courses;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getCourses', 'API', 'CourseService');
      logger.error(
        'Kurslar getirilirken hata oluştu',
        'CourseService.getCourses',
        __filename,
        41,
        { error }
      );
      throw error;
    }
  }

  /**
   * Belirli bir kursun detaylarını getirir
   * @param id Kurs ID
   * @returns Kurs detayları
   */
  @LogMethod('CourseService', 'API')
  async getCourseById(id: string): Promise<Course> {
    flowTracker.markStart(`getCourse_${id}`);
    
    try {
      flowTracker.trackApiCall(`/courses/${id}`, 'GET', 'CourseService.getCourseById', { id });
      
      const course = await apiService.get<Course>(`/courses/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getCourse_${id}`, 'API', 'CourseService');
      logger.debug(
        `Kurs getirildi: ${id}`,
        'CourseService.getCourseById',
        __filename,
        67,
        { id, courseName: course.name, duration }
      );
      
      return course;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getCourse_${id}`, 'API', 'CourseService');
      logger.error(
        `Kurs getirilirken hata oluştu: ${id}`,
        'CourseService.getCourseById',
        __filename,
        78,
        { id, error }
      );
      throw error;
    }
  }

  /**
   * Ders istatistiklerini getir
   * @param id Kurs ID
   * @returns Kurs istatistikleri
   */
  @LogMethod('CourseService', 'API')
  async getCourseStats(id: string): Promise<CourseStats> {
    return apiService.get<CourseStats>(`/courses/${id}/stats`);
  }

  /**
   * Ders dashboard bilgilerini getir
   * @param id Kurs ID
   * @returns Kurs dashboard bilgisi
   */
  @LogMethod('CourseService', 'API')
  async getCourseDashboard(id: string): Promise<CourseDashboard> {
    return apiService.get<CourseDashboard>(`/courses/${id}/dashboard`);
  }

  /**
   * Derse ait ilişkili öğelerin sayılarını getir (Backend'in döndürdüğü format)
   * @param id Kurs ID
   * @returns İlişkili öğe sayıları
   */
  @LogMethod('CourseService', 'API')
  async getRelatedItemsCount(id: string): Promise<RelatedItemsCountResponse> {
    return apiService.get<RelatedItemsCountResponse>(`/courses/${id}/related-items`);
  }

  /**
   * Derse ait tüm ilişkili öğeleri (belgeler, hedefler, sınavlar) getir
   * Bu metot birden fazla API çağrısı yaparak ilişkili öğeleri toplar
   * @param id Kurs ID
   * @returns İlişkili öğeler
   */
  @LogMethod('CourseService', 'API')
  async getCourseRelatedItems(id: string): Promise<CourseRelatedItems> {
    const [documents, learningTargets, quizzes] = await Promise.all([
      apiService.get<Document[]>(`/documents?courseId=${id}`),
      apiService.get<LearningTarget[]>(`/learning-targets?courseId=${id}`),
      apiService.get<Quiz[]>(`/quizzes?courseId=${id}`),
    ]);

    return {
      documents,
      learningTargets,
      quizzes,
    };
  }

  /**
   * Yeni kurs oluşturur
   * @param courseData Kurs verileri
   * @returns Oluşturulan kurs
   */
  @LogMethod('CourseService', 'API')
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    flowTracker.markStart('createCourse');
    
    try {
      flowTracker.trackApiCall("/courses", 'POST', 'CourseService.createCourse');
      
      logger.debug(
        'Kurs oluşturma isteği gönderiliyor',
        'CourseService.createCourse',
        __filename,
        97,
        { courseData }
      );
      
      const course = await apiService.post<Course>("/courses", courseData);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('createCourse', 'API', 'CourseService');
      logger.info(
        `Kurs başarıyla oluşturuldu: ${course.name}`,
        'CourseService.createCourse',
        __filename,
        108,
        { id: course.id, duration }
      );
      
      return course;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('createCourse', 'API', 'CourseService');
      logger.error(
        'Kurs oluşturulurken hata oluştu',
        'CourseService.createCourse',
        __filename,
        119,
        { courseData, error }
      );
      throw error;
    }
  }

  /**
   * Kurs günceller
   * @param id Kurs ID
   * @param courseData Güncellenecek veriler
   * @returns Güncellenmiş kurs
   */
  @LogMethod('CourseService', 'API')
  async updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
    flowTracker.markStart(`updateCourse_${id}`);
    
    try {
      flowTracker.trackApiCall(`/courses/${id}`, 'PUT', 'CourseService.updateCourse', { id });
      
      logger.debug(
        `Kurs güncelleme isteği gönderiliyor: ${id}`,
        'CourseService.updateCourse',
        __filename,
        140,
        { id, updatedFields: Object.keys(courseData) }
      );
      
      const course = await apiService.put<Course>(`/courses/${id}`, courseData);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`updateCourse_${id}`, 'API', 'CourseService');
      logger.info(
        `Kurs başarıyla güncellendi: ${id}`,
        'CourseService.updateCourse',
        __filename,
        151,
        { id, duration }
      );
      
      return course;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`updateCourse_${id}`, 'API', 'CourseService');
      logger.error(
        `Kurs güncellenirken hata oluştu: ${id}`,
        'CourseService.updateCourse',
        __filename,
        162,
        { id, courseData, error }
      );
      throw error;
    }
  }

  /**
   * Kurs siler
   * @param id Silinecek kurs ID
   * @returns İşlem sonucu
   */
  @LogMethod('CourseService', 'API')
  async deleteCourse(id: string): Promise<void> {
    flowTracker.markStart(`deleteCourse_${id}`);
    
    try {
      flowTracker.trackApiCall(`/courses/${id}`, 'DELETE', 'CourseService.deleteCourse', { id });
      
      logger.debug(
        `Kurs silme isteği gönderiliyor: ${id}`,
        'CourseService.deleteCourse',
        __filename,
        183,
        { id }
      );
      
      await apiService.delete(`/courses/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteCourse_${id}`, 'API', 'CourseService');
      logger.info(
        `Kurs başarıyla silindi: ${id}`,
        'CourseService.deleteCourse',
        __filename,
        194,
        { id, duration }
      );
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`deleteCourse_${id}`, 'API', 'CourseService');
      logger.error(
        `Kurs silinirken hata oluştu: ${id}`,
        'CourseService.deleteCourse',
        __filename,
        203,
        { id, error }
      );
      throw error;
    }
  }
}

/**
 * Backend'in döndürdüğü ilişkili öğe sayısı yanıtı
 */
interface RelatedItemsCountResponse {
  courseId: string;
  learningTargets: number;
  quizzes: number;
  failedQuestions: number;
  documents: number;
  total: number;
}

/**
 * Frontend'in kendi içinde oluşturduğu ilişkili öğeler interfacei
 */
interface CourseRelatedItems {
  documents: Document[];
  learningTargets: LearningTarget[];
  quizzes: Quiz[];
}

// Singleton instance oluştur
const courseService = new CourseService();

export default courseService;
