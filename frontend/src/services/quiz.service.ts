import {
  ApiAnalysisResult,
  ApiFailedQuestion,
  ApiQuiz,
  ApiQuizGenerationOptionsDto,
  ApiQuizSubmissionPayloadDto,
} from "./adapter.service";
import apiService from "./api.service";
import { ApiError, ErrorService } from "./error.service";
import adapterService from "./adapter.service";
import { QuizGenerationOptions, QuizSubmissionPayload } from "../types/quiz";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory } from "./flow-tracker.service";
import { AxiosError } from "axios";

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
      
      const apiError = new ApiError(
        "Sınav listesi yüklenirken bir hata oluştu.",
        { original: { error, context: "getQuizzes", courseId } }
      );
      
      ErrorService.handleError(apiError, "Sınav listesi");
      throw apiError;
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
      
      const apiError = new ApiError(
        "Sınav detayları yüklenirken bir hata oluştu.",
        { original: { error, context: "getQuizById", quizId: id } }
      );
      
      ErrorService.handleError(apiError, "Sınav detayları");
      throw apiError;
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
        191,
        { id, error }
      );
      
      const apiError = new ApiError(
        "Sınav analizi yüklenirken bir hata oluştu.",
        { original: { error, context: "getQuizAnalysis", quizId: id } }
      );
      
      ErrorService.handleError(apiError, "Sınav analizi");
      throw apiError;
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
        280,
        { courseId, error }
      );
      
      const apiError = new ApiError(
        "Yanlış cevaplanan sorular yüklenirken bir hata oluştu.",
        { original: { error, context: "getFailedQuestions", courseId } }
      );
      
      ErrorService.handleError(apiError, "Yanlış cevaplanan sorular");
      throw apiError;
    }
  }

  /**
   * Verilen seçeneklere göre yeni bir sınav oluşturur
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async generateQuiz(options: QuizGenerationOptions | ApiQuizGenerationOptionsDto) {
    flowTracker.markStart('generateQuiz');
    
    try {
      // Frontend tarafında belge metni uzunluğunu kontrol et
      if ('quizType' in options && options.quizType === 'quick') {
        // Belge metninin uzunluğunu kontrol et
        const quizGenOptions = options as unknown as Record<string, unknown>;
        
        // Belge metni kontrolü - minimum 100 karakter olmalı (eskisi 200 karakter)
        // Ayrıca belge içeriğinin boş olması durumunda ve konu seçilmeme durumunu da kontrol et
        if (!quizGenOptions.documentText && !quizGenOptions.documentId && (!quizGenOptions.selectedSubTopics || (Array.isArray(quizGenOptions.selectedSubTopics) && quizGenOptions.selectedSubTopics.length === 0))) {
          console.error('[QuizApiService] Belge metni ve belge ID yok ve konu seçilmemiş');
          throw new Error('Hızlı sınav için belge metni veya belge ID veya en az bir konu seçimi gereklidir');
        }
        
        if (quizGenOptions.documentText && typeof quizGenOptions.documentText === 'string') {
          const documentText = quizGenOptions.documentText as string;
          if (documentText.trim().length < 100) {
            console.error('[QuizApiService] Belge metni çok kısa:', documentText.trim().length);
            throw new Error(`Belge metni çok kısa (${documentText.trim().length} karakter). En az 100 karakter olmalıdır.`);
          }
        }
        
        // Belge ID varsa ama konu seçilmemişse ve metin de yoksa, log yapalım
        if (quizGenOptions.documentId && !quizGenOptions.documentText && 
            (!quizGenOptions.selectedSubTopics || (Array.isArray(quizGenOptions.selectedSubTopics) && quizGenOptions.selectedSubTopics.length === 0))) {
          console.warn('[QuizApiService] DocumentId var ama konu seçilmemiş ve metin yok');
        }
      }
      
      // Backend'e istek yapılmadan önce son kontroller:
      let requestLogger;
      
      // 'quizType' in options olup olmadığını kontrol et (tip koruma)
      if ('quizType' in options) {
        requestLogger = options.quizType === 'quick' ? 'generateQuickQuiz' : 'generatePersonalizedQuiz';
      } else {
        requestLogger = 'generateQuiz-unknown-type';
      }
      
      console.log(`[QuizApiService] Sınav oluşturma isteği gönderiliyor...`, {
        quizType: 'quizType' in options ? options.quizType : 'unknown',
        hasDocumentText: 'quizType' in options && 'documentText' in options && !!options.documentText,
        hasDocumentId: 'quizType' in options && 'documentId' in options && !!options.documentId,
        hasTopics: 'quizType' in options && 'selectedSubTopics' in options && Array.isArray(options.selectedSubTopics) && options.selectedSubTopics.length > 0,
        personalizedType: 'quizType' in options && 'personalizedQuizType' in options ? options.personalizedQuizType : undefined
      });
      
      const response = await apiService.post<ApiQuiz>(
        options.quizType === 'quick'
          ? `${this.basePath}/quick`
          : `${this.basePath}/personalized`,
        options,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Yanıtı işle
      console.log(`[QuizApiService] Sınav oluşturma yanıtı alındı:`, {
        status: response.status,
        hasQuizId: !!response.data?.id,
        questionCount: response.data?.questions?.length
      });
      
      if (!response.data) {
        console.error('[QuizApiService] Yanıtta quiz verisi bulunamadı');
        throw new Error('Sınav oluşturulamadı: Geçersiz yanıt');
      }

      if (!response.data.id) {
        console.error('[QuizApiService] Oluşturulan sınav ID değeri bulunamadı', response.data);
        throw new Error('Sınav oluşturuldu ancak ID değeri bulunamadı');
      }
      
      const quiz = response.data;
      flowTracker.markEnd('generateQuiz');
      
      return quiz;
    } catch (error) {
      flowTracker.markEnd('generateQuiz');
      console.error('Sınav oluşturma hatası:', error);
      
      if (error instanceof AxiosError && error.response?.data) {
        // API'den dönen hata mesajını ErrorService üzerinden işle
        const apiError = new ApiError(
          "Sınav oluşturulurken bir hata oluştu",
          { 
            original: { 
              error, 
              context: "generateQuiz" 
            } 
          }
        );
        
        ErrorService.handleError(apiError, "Sınav oluşturma");
        throw apiError;
      }
      
      // Diğer hata türleri
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      const genericError = new Error(`Sınav oluşturulurken bir hata oluştu: ${message}`);
      ErrorService.handleError(genericError, "Sınav oluşturma");
      throw genericError;
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
      
      const apiError = new ApiError(
        "Sınav yanıtları gönderilirken bir hata oluştu.",
        { original: { error, context: "submitQuiz", quizId: payload.quizId } }
      );
      
      ErrorService.handleError(apiError, "Sınav yanıtları");
      throw apiError;
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
      
      const apiError = new ApiError(
        "Sınav silinirken bir hata oluştu.",
        { original: { error, context: "deleteQuiz", quizId: id } }
      );
      
      ErrorService.handleError(apiError, "Sınav silme");
      throw apiError;
    }
  }
}

const quizService = new QuizApiService();
export default quizService;
