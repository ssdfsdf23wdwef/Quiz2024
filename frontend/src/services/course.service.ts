import apiService from "@/services/api.service";
import { Course, CourseStats, CourseDashboard } from "@/types/course";
import { Document } from "@/types/document";
import { LearningTarget } from "@/types/learningTarget";
import { Quiz } from "@/types/quiz";
import { getLogger, getFlowTracker } from "../lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory } from "@/constants/logging.constants";
import { trackFlow, startFlow as startAppFlow, mapToTrackerCategory } from "../lib/logger.utils";

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
  @LogMethod('CourseService', FlowCategory.API)
  async getCourses(): Promise<Course[]> {
    const flow = startAppFlow(FlowCategory.API, "CourseService.getAllCourses");
    
    try {
      trackFlow(
        `Fetching all courses`,
        "CourseService.getAllCourses",
        FlowCategory.API
      );
      
      const courses = await apiService.get<Course[]>("/courses");
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getCourses', mapToTrackerCategory(FlowCategory.API), 'CourseService');
      logger.debug(
        `${courses.length} kurs getirildi`,
        'CourseService.getCourses',
        __filename,
        30,
        { count: courses.length, duration }
      );
      
      flow.end("Successfully fetched all courses");
      return courses;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getCourses', mapToTrackerCategory(FlowCategory.API), 'CourseService');
      trackFlow(
        `Error fetching all courses: ${(error as Error).message}`,
        "CourseService.getAllCourses",
        FlowCategory.API,
        { error }
      );
      flow.end(`Error fetching all courses: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Belirli bir kursun detaylarını getirir
   * @param id Kurs ID
   * @returns Kurs detayları
   */
  @LogMethod('CourseService', FlowCategory.API)
  async getCourseById(id: string): Promise<Course> {
    const flow = startAppFlow(FlowCategory.API, "CourseService.getCourseById");
    
    try {
      trackFlow(
        `Fetching course by ID: ${id}`,
        "CourseService.getCourseById",
        FlowCategory.API
      );
      
      const course = await apiService.get<Course>(`/courses/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getCourse_${id}`, mapToTrackerCategory(FlowCategory.API), 'CourseService');
      logger.debug(
        `Kurs getirildi: ${id}`,
        'CourseService.getCourseById',
        __filename,
        67,
        { id, courseName: course.name, duration }
      );
      
      flow.end("Successfully fetched course by ID");
      return course;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getCourse_${id}`, mapToTrackerCategory(FlowCategory.API), 'CourseService');
      trackFlow(
        `Error fetching course by ID ${id}: ${(error as Error).message}`,
        "CourseService.getCourseById",
        FlowCategory.API,
        { error }
      );
      flow.end(`Error fetching course by ID: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Ders istatistiklerini getir
   * @param id Kurs ID
   * @returns Kurs istatistikleri
   */
  @LogMethod('CourseService', FlowCategory.API)
  async getCourseStats(id: string): Promise<CourseStats> {
    return apiService.get<CourseStats>(`/courses/${id}/stats`);
  }

  /**
   * Ders dashboard bilgilerini getir
   * @param id Kurs ID
   * @returns Kurs dashboard bilgisi
   */
  @LogMethod('CourseService', FlowCategory.API)
  async getCourseDashboard(id: string): Promise<CourseDashboard> {
    return apiService.get<CourseDashboard>(`/courses/${id}/dashboard`);
  }

  /**
   * Derse ait ilişkili öğelerin sayılarını getir (Backend'in döndürdüğü format)
   * @param id Kurs ID
   * @returns İlişkili öğe sayıları
   */
  @LogMethod('CourseService', FlowCategory.API)
  async getRelatedItemsCount(id: string): Promise<RelatedItemsCountResponse> {
    return apiService.get<RelatedItemsCountResponse>(`/courses/${id}/related-items`);
  }

  /**
   * Derse ait tüm ilişkili öğeleri (belgeler, hedefler, sınavlar) getir
   * Bu metot birden fazla API çağrısı yaparak ilişkili öğeleri toplar
   * @param id Kurs ID
   * @returns İlişkili öğeler
   */
  @LogMethod('CourseService', FlowCategory.API)
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
  @LogMethod('CourseService', FlowCategory.API)
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const flow = startAppFlow(FlowCategory.API, "CourseService.createCourse");
    
    try {
      trackFlow(
        `Creating new course: ${JSON.stringify(courseData)}`,
        "CourseService.createCourse",
        FlowCategory.API
      );
      
      logger.debug(
        'Kurs oluşturma isteği gönderiliyor',
        'CourseService.createCourse',
        __filename,
        97,
        { courseData }
      );
      
      const course = await apiService.post<Course>("/courses", courseData);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('createCourse', mapToTrackerCategory(FlowCategory.API), 'CourseService');
      logger.info(
        `Kurs başarıyla oluşturuldu: ${course.name}`,
        'CourseService.createCourse',
        __filename,
        108,
        { id: course.id, duration }
      );
      
      flow.end("Successfully created course");
      return course;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('createCourse', mapToTrackerCategory(FlowCategory.API), 'CourseService');
      trackFlow(
        `Error creating course: ${(error as Error).message}`,
        "CourseService.createCourse",
        FlowCategory.API,
        { error }
      );
      flow.end(`Error creating course: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Kurs günceller
   * @param id Kurs ID
   * @param courseData Güncellenecek veriler
   * @returns Güncellenmiş kurs
   */
  @LogMethod('CourseService', FlowCategory.API)
  async updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
    const flow = startAppFlow(FlowCategory.API, "CourseService.updateCourse");
    
    try {
      trackFlow(
        `Updating course ID ${id}: ${JSON.stringify(courseData)}`,
        "CourseService.updateCourse",
        FlowCategory.API
      );
      
      logger.debug(
        `Kurs güncelleme isteği gönderiliyor: ${id}`,
        'CourseService.updateCourse',
        __filename,
        140,
        { id, updatedFields: Object.keys(courseData) }
      );
      
      const course = await apiService.put<Course>(`/courses/${id}`, courseData);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`updateCourse_${id}`, mapToTrackerCategory(FlowCategory.API), 'CourseService');
      logger.info(
        `Kurs başarıyla güncellendi: ${id}`,
        'CourseService.updateCourse',
        __filename,
        151,
        { id, duration }
      );
      
      flow.end("Successfully updated course");
      return course;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`updateCourse_${id}`, mapToTrackerCategory(FlowCategory.API), 'CourseService');
      trackFlow(
        `Error updating course ID ${id}: ${(error as Error).message}`,
        "CourseService.updateCourse",
        FlowCategory.API,
        { error }
      );
      flow.end(`Error updating course: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Kurs siler
   * @param id Silinecek kurs ID
   * @returns İşlem sonucu
   */
  @LogMethod('CourseService', FlowCategory.API)
  async deleteCourse(id: string): Promise<void> {
    const flow = startAppFlow(FlowCategory.API, "CourseService.deleteCourse");
    
    try {
      trackFlow(
        `Deleting course ID ${id}`,
        "CourseService.deleteCourse",
        FlowCategory.API
      );
      
      logger.debug(
        `Kurs silme isteği gönderiliyor: ${id}`,
        'CourseService.deleteCourse',
        __filename,
        183,
        { id }
      );
      
      await apiService.delete(`/courses/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteCourse_${id}`, mapToTrackerCategory(FlowCategory.API), 'CourseService');
      logger.info(
        `Kurs başarıyla silindi: ${id}`,
        'CourseService.deleteCourse',
        __filename,
        194,
        { id, duration }
      );
      
      flow.end("Successfully deleted course");
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`deleteCourse_${id}`, mapToTrackerCategory(FlowCategory.API), 'CourseService');
      trackFlow(
        `Error deleting course ID ${id}: ${(error as Error).message}`,
        "CourseService.deleteCourse",
        FlowCategory.API,
        { error }
      );
      flow.end(`Error deleting course: ${(error as Error).message}`);
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
