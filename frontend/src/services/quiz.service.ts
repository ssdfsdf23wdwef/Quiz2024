import {
  ApiAnalysisResult,
  ApiFailedQuestion,
  ApiQuiz,
  ApiQuizGenerationOptionsDto,
  ApiQuizSubmissionPayloadDto,
} from "./adapter.service";
import apiService from "./api.service";
import { ErrorService } from "./error.service";
import adapterService from "./adapter.service";
import { QuizGenerationOptions, QuizSubmissionPayload } from "../types/quiz";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory } from "./flow-tracker.service";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

/**
 * API endpoint sabitleri
 */
const API_ENDPOINTS = {
  QUIZZES: "/quizzes",
  FAILED_QUESTIONS: "/failed-questions"
};

/**
 * Quiz API Servisi
 * Quiz ile ilgili endpoint'leri çağırmak için kullanılır
 */
@LogClass('QuizApiService')
class QuizApiService {
  private readonly basePath = API_ENDPOINTS.QUIZZES;
  private readonly failedQuestionsPath = API_ENDPOINTS.FAILED_QUESTIONS;
  
  /**
   * Tüm sınavları getirir
   * @param courseId İsteğe bağlı ders ID'si
   * @returns Quiz dizisi
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizzes(courseId?: string) {
    flowTracker.markStart('getQuizzes');
    
    try {
      const endpoint = this.basePath;
      const params: Record<string, unknown> = {};

      if (courseId) {
        params.courseId = courseId;
      }
      
      flowTracker.trackApiCall(
        endpoint, 
        'GET', 
        'QuizApiService.getQuizzes',
        { courseId, params }
      );
      
      logger.debug(
        `Sınav listesi alınıyor${courseId ? ': Kurs=' + courseId : ''}`,
        'QuizApiService.getQuizzes',
        __filename,
        46,
        { courseId }
      );

      const quizzes = await apiService.get<ApiQuiz[]>(endpoint, params);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getQuizzes', FlowCategory.API, 'QuizApiService');
      logger.debug(
        `Sınav listesi alındı: ${quizzes.length} sınav`,
        'QuizApiService.getQuizzes',
        __filename,
        57,
        { 
          count: quizzes.length, 
          courseId,
          duration 
        }
      );
      
      return quizzes;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getQuizzes', FlowCategory.API, 'QuizApiService');
      logger.error(
        "Sınav listesi alınamadı",
        'QuizApiService.getQuizzes',
        __filename,
        71,
        { courseId, error }
      );
      
      throw ErrorService.createApiError(
        "Sınav listesi yüklenirken bir hata oluştu.",
        undefined,
        { original: { error, context: "getQuizzes", courseId } },
      );
    }
  }

  /**
   * ID'ye göre sınav detaylarını getirir
   * @param id Quiz ID
   * @returns Quiz detayları
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizById(id: string) {
    flowTracker.markStart(`getQuiz_${id}`);
    
    try {
      const endpoint = `${this.basePath}/${id}`;
      
      flowTracker.trackApiCall(
        endpoint, 
        'GET', 
        'QuizApiService.getQuizById',
        { id }
      );
      
      logger.debug(
        `Sınav detayı alınıyor: ID=${id}`,
        'QuizApiService.getQuizById',
        __filename,
        99,
        { id }
      );
      
      const quiz = await apiService.get<ApiQuiz>(endpoint);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getQuiz_${id}`, FlowCategory.API, 'QuizApiService');
      logger.debug(
        `Sınav detayı alındı: ID=${id}`,
        'QuizApiService.getQuizById',
        __filename,
        110,
        { 
          id,
          title: quiz.title,
          questionCount: quiz.questions?.length,
          duration 
        }
      );
      
      return quiz;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getQuiz_${id}`, FlowCategory.API, 'QuizApiService');
      logger.error(
        `Sınav alınamadı: ID=${id}`,
        'QuizApiService.getQuizById',
        __filename,
        126,
        { id, error }
      );
      
      throw ErrorService.createApiError(
        "Sınav detayları yüklenirken bir hata oluştu.",
        undefined,
        { original: { error, context: "getQuizById", quizId: id } },
      );
    }
  }

  /**
   * ID'ye göre sınav analiz sonuçlarını getirir
   * @param id Quiz ID
   * @returns Quiz analiz sonuçları
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizAnalysis(id: string) {
    flowTracker.markStart(`getQuizAnalysis_${id}`);
    
    try {
      const endpoint = `${this.basePath}/${id}/analysis`;
      
      flowTracker.trackApiCall(
        endpoint, 
        'GET', 
        'QuizApiService.getQuizAnalysis',
        { id }
      );
      
      logger.debug(
        `Sınav analizi alınıyor: ID=${id}`,
        'QuizApiService.getQuizAnalysis',
        __filename,
        157,
        { id }
      );
      
      const analysis = await apiService.get<ApiAnalysisResult>(endpoint);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getQuizAnalysis_${id}`, FlowCategory.API, 'QuizApiService');
      logger.info(
        `Sınav analizi alındı: ID=${id}`,
        'QuizApiService.getQuizAnalysis',
        __filename,
        168,
        { 
          id,
          scorePercent: analysis.scorePercent,
          correctAnswers: analysis.correctAnswers,
          wrongAnswers: analysis.wrongAnswers,
          duration 
        }
      );
      
      return analysis;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getQuizAnalysis_${id}`, FlowCategory.API, 'QuizApiService');
      logger.error(
        `Sınav analizi alınamadı: ID=${id}`,
        'QuizApiService.getQuizAnalysis',
        __filename,
        185,
        { id, error }
      );
      
      throw ErrorService.createApiError(
        "Sınav analizi yüklenirken bir hata oluştu.",
        undefined,
        { original: { error, context: "getQuizAnalysis", quizId: id } },
      );
    }
  }

  /**
   * Başarısız soruları getirir
   * @param courseId İsteğe bağlı ders ID'si
   * @returns Başarısız sorular dizisi
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getFailedQuestions(courseId?: string) {
    flowTracker.markStart('getFailedQuestions');
    
    try {
      const endpoint = this.failedQuestionsPath;
      const params: Record<string, unknown> = {};

      if (courseId) {
        params.courseId = courseId;
      }
      
      flowTracker.trackApiCall(
        endpoint, 
        'GET', 
        'QuizApiService.getFailedQuestions',
        { courseId, params }
      );
      
      logger.debug(
        `Yanlış cevaplanan sorular alınıyor${courseId ? ': Kurs=' + courseId : ''}`,
        'QuizApiService.getFailedQuestions',
        __filename,
        219,
        { courseId }
      );

      const failedQuestions = await apiService.get<ApiFailedQuestion[]>(endpoint, params);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getFailedQuestions', FlowCategory.API, 'QuizApiService');
      logger.debug(
        `Yanlış cevaplanan sorular alındı: ${failedQuestions.length} soru`,
        'QuizApiService.getFailedQuestions',
        __filename,
        230,
        { 
          count: failedQuestions.length, 
          courseId,
          duration 
        }
      );
      
      return failedQuestions;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getFailedQuestions', FlowCategory.API, 'QuizApiService');
      logger.error(
        "Yanlış cevaplanan sorular alınamadı",
        'QuizApiService.getFailedQuestions',
        __filename,
        244,
        { courseId, error }
      );
      
      throw ErrorService.createApiError(
        "Yanlış cevaplanan sorular yüklenirken bir hata oluştu.",
        undefined,
        { original: { error, context: "getFailedQuestions", courseId } },
      );
    }
  }

  /**
   * Verilen seçeneklere göre yeni bir sınav oluşturur
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async generateQuiz(options: QuizGenerationOptions | ApiQuizGenerationOptionsDto) {
    flowTracker.markStart('generateQuiz');
    
    try {
      // Eğer halihazırda dönüştürülmüş bir options nesnesi gelmediyse adapter'ı kullan
      const apiOptions = 'quizType' in options && 'preferences' in options 
        ? adapterService.fromQuizGenerationOptions(options as QuizGenerationOptions)
        : options as ApiQuizGenerationOptionsDto;
        
      // JSON.stringify + JSON.parse kullanarak API nesnesini Record<string, unknown> olarak dönüştür
      const apiPayload = JSON.parse(JSON.stringify(apiOptions)) as Record<string, unknown>;
      
      // Loglama ve akış izleme
      logger.debug(
        'Sınav oluşturma isteği hazırlanıyor',
        'QuizApiService.generateQuiz',
        __filename,
        275,
        { 
          quizType: apiOptions.quizType,
          courseId: apiOptions.courseId,
          payload: JSON.stringify(apiPayload).substring(0, 300)
        }
      );
      
      flowTracker.trackApiCall(
        this.basePath, 
        'POST', 
        'QuizApiService.generateQuiz',
        { 
          quizType: apiOptions.quizType,
          endpoint: this.basePath,
          payloadSize: JSON.stringify(apiPayload).length
        }
      );
      
      try {
        logger.debug(
          `API isteği gönderiliyor: POST ${this.basePath}`,
          'QuizApiService.generateQuiz',
          __filename,
          300,
          { 
            endpoint: this.basePath,
            payloadSize: JSON.stringify(apiPayload).length
          }
        );
        
        // API isteğini gönder
        const quiz = await apiService.post<ApiQuiz>(this.basePath, apiPayload);
        
        // API yanıtını kontrol et
        if (!quiz || !quiz.id) {
          throw new Error('API geçerli bir yanıt döndürmedi: Quiz ID bulunamadı');
        }
        
        // Başarılı sonuç
        const duration = flowTracker.markEnd('generateQuiz', FlowCategory.API, 'QuizApiService');
        logger.info(
          `Sınav oluşturuldu: ${quiz.title || 'Başlıksız'}, ${quiz.questions?.length || 0} soru`,
          'QuizApiService.generateQuiz',
          __filename,
          320,
          { 
            id: quiz.id,
            title: quiz.title || 'Başlıksız',
            questionCount: quiz.questions?.length || 0,
            duration 
          }
        );
        
        return quiz;
      } catch (postError) {
        // API isteği hatası
        logger.error(
          "Sınav oluşturma API isteği başarısız",
          'QuizApiService.generateQuiz.apiRequest',
          __filename,
          335,
          { 
            error: postError,
            endpoint: this.basePath,
            errorMessage: postError instanceof Error ? postError.message : 'Bilinmeyen hata',
            errorStack: postError instanceof Error ? postError.stack : undefined
          }
        );
        
        // API hatası olduğunda daha detaylı bir hata fırlat
        if (postError instanceof Error) {
          throw ErrorService.createApiError(
            `Sınav oluşturma API isteği başarısız: ${postError.message}`,
            undefined,
            { original: { error: postError, context: "generateQuiz.apiRequest" } }
          );
        }
        
        throw postError;
      }
    } catch (error) {
      // Genel hata durumu
      flowTracker.markEnd('generateQuiz', FlowCategory.API, 'QuizApiService');
      logger.error(
        "Sınav oluşturma başarısız",
        'QuizApiService.generateQuiz',
        __filename,
        360,
        { 
          options: JSON.stringify(options).substring(0, 200) + '...',
          error,
          errorMessage: error instanceof Error ? error.message : 'Bilinmeyen hata',
          errorStack: error instanceof Error ? error.stack : undefined
        }
      );
      
      throw ErrorService.createApiError(
        "Sınav oluşturulurken bir hata oluştu: " + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
        undefined,
        { original: { error, context: "generateQuiz", options } },
      );
    }
  }

  /**
   * Sınav cevaplarını gönderir ve sonuçları alır
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async submitQuiz(payload: QuizSubmissionPayload | ApiQuizSubmissionPayloadDto) {
    flowTracker.markStart(`submitQuiz_${payload.quizId}`);
    
    try {
      // Eğer halihazırda dönüştürülmüş bir payload nesnesi gelmediyse adapter'ı kullan
      const apiPayload = 'quizId' in payload && 'userAnswers' in payload 
        ? adapterService.fromQuizSubmissionPayload(payload as QuizSubmissionPayload)
        : payload as ApiQuizSubmissionPayloadDto;
      
      // JSON.stringify + JSON.parse kullanarak API nesnesini Record<string, unknown> olarak dönüştür
      const requestPayload = JSON.parse(JSON.stringify(apiPayload)) as Record<string, unknown>;
      
      // API endpoint
      const endpoint = `${this.basePath}/${apiPayload.quizId}/submit`;
      
      // Loglama ve akış izleme
      logger.debug(
        `Sınav yanıtları gönderiliyor: ID=${apiPayload.quizId}`,
        'QuizApiService.submitQuiz',
        __filename,
        361,
        { 
          quizId: apiPayload.quizId,
          answerCount: apiPayload.userAnswers.length
        }
      );
      
      flowTracker.trackApiCall(
        endpoint, 
        'POST', 
        'QuizApiService.submitQuiz',
        { 
          quizId: apiPayload.quizId,
          answerCount: apiPayload.userAnswers.length
        }
      );
      
      // API isteğini gönder
      const result = await apiService.post<ApiQuiz>(endpoint, requestPayload);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`submitQuiz_${payload.quizId}`, FlowCategory.API, 'QuizApiService');
      logger.info(
        `Sınav yanıtları gönderildi: ID=${apiPayload.quizId}`,
        'QuizApiService.submitQuiz',
        __filename,
        384,
        { 
          quizId: apiPayload.quizId,
          isCompleted: result.isCompleted,
          score: result.score,
          duration 
        }
      );
      
      return result;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`submitQuiz_${payload.quizId}`, FlowCategory.API, 'QuizApiService');
      logger.error(
        `Sınav yanıtları gönderilemedi: ID=${payload.quizId}`,
        'QuizApiService.submitQuiz',
        __filename,
        400,
        { 
          quizId: payload.quizId,
          error 
        }
      );
      
      throw ErrorService.createApiError(
        "Sınav yanıtları gönderilirken bir hata oluştu.",
        undefined,
        { original: { error, context: "submitQuiz", quizId: payload.quizId } },
      );
    }
  }

  /**
   * Sınavı siler
   * @param id Quiz ID
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async deleteQuiz(id: string) {
    flowTracker.markStart(`deleteQuiz_${id}`);
    
    try {
      const endpoint = `${this.basePath}/${id}`;
      
      flowTracker.trackApiCall(
        endpoint, 
        'DELETE', 
        'QuizApiService.deleteQuiz',
        { id }
      );
      
      logger.debug(
        `Sınav siliniyor: ID=${id}`,
        'QuizApiService.deleteQuiz',
        __filename,
        430,
        { id }
      );
      
      const response = await apiService.delete(endpoint);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteQuiz_${id}`, FlowCategory.API, 'QuizApiService');
      logger.info(
        `Sınav silindi: ID=${id}`,
        'QuizApiService.deleteQuiz',
        __filename,
        441,
        { id, duration }
      );
      
      return response;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`deleteQuiz_${id}`, FlowCategory.API, 'QuizApiService');
      logger.error(
        `Sınav silinemedi: ID=${id}`,
        'QuizApiService.deleteQuiz',
        __filename,
        452,
        { id, error }
      );
      
      throw ErrorService.createApiError(
        "Sınav silinirken bir hata oluştu.",
        undefined,
        { original: { error, context: "deleteQuiz", quizId: id } },
      );
    }
  }
}

const quizService = new QuizApiService();
export default quizService;
