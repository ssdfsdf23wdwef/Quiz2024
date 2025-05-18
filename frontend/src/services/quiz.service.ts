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
      // 'quizType' in options olup olmadığını kontrol et (tip koruma)
      let quizEndpoint = `${this.basePath}`;
      if ('quizType' in options) {
        quizEndpoint = options.quizType === 'quick' ? `${this.basePath}/quick` : `${this.basePath}/personalized`;
      }
      
      console.log(`[QuizApiService] Sınav oluşturma isteği gönderiliyor...`, {
        quizType: 'quizType' in options ? options.quizType : 'unknown',
        hasDocumentText: 'quizType' in options && 'documentText' in options && !!options.documentText,
        hasDocumentId: 'quizType' in options && 'documentId' in options && !!options.documentId,
        hasTopics: 'quizType' in options && 'selectedSubTopics' in options && Array.isArray(options.selectedSubTopics) && options.selectedSubTopics.length > 0,
        personalizedType: 'quizType' in options && 'personalizedQuizType' in options ? options.personalizedQuizType : undefined
      });
      
      // Backend'in beklediği formata dönüştür
      let payload: Record<string, unknown> = {};
      if ('quizType' in options) {
        // Frontend'den gelen QuizGenerationOptions formatını backend'in beklediği formata dönüştür
        const quizOptions = options as QuizGenerationOptions;
        
        // selectedSubTopics SubTopicItem[] dizisini string[] dizisine dönüştür
        const subTopics: string[] = quizOptions.selectedSubTopics?.map(topic => topic.normalizedSubTopic) || [];
        
        payload = {
          documentText: quizOptions.documentText || '',
          subTopics: subTopics, // string[] olarak dönüştürülmüş
          questionCount: quizOptions.preferences?.questionCount || 10,
          difficulty: quizOptions.preferences?.difficulty || 'mixed',
        };
        
        // DocumentId varsa ekle
        if (quizOptions.documentId) {
          payload.documentId = quizOptions.documentId;
        }
        
        // TimeLimit varsa ekle
        if (quizOptions.preferences?.timeLimit !== undefined) {
          payload.timeLimit = quizOptions.preferences.timeLimit;
        }
      } else {
        // ApiQuizGenerationOptionsDto zaten doğru formatta, doğrudan kullan
        payload = options as unknown as Record<string, unknown>;
      }
      
      const response = await apiService.post<ApiQuiz>(
        quizEndpoint,
        payload, // Dönüştürülmüş payload'ı gönder
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Yanıtı işle
      console.log(`[QuizApiService] Sınav oluşturma yanıtı alındı:`, {
        status: response.status,
        hasQuizId: !!(response.data as ApiQuiz)?.id,
        questionCount: (response.data as ApiQuiz)?.questions?.length
      });
      
      // Yanıt yapısını daha ayrıntılı kontrol edelim
      if (!response.data) {
        console.error('[QuizApiService] Yanıtta quiz verisi bulunamadı');
        throw new Error('Sınav oluşturulamadı: Geçersiz yanıt');
      }

      // Data içeriğini detaylı olarak kontrol et
      const quizData = response.data as any;
      
      // Tüm yanıt yapısını konsola yazdır (hata ayıklama)
      console.log('[QuizApiService] Yanıt yapısı:', {
        keys: Object.keys(quizData),
        dataType: typeof quizData,
        hasNestedData: !!quizData.data,
        hasNestedQuiz: !!quizData.quiz,
        responseStatus: response.status
      });
      
      // ID kontrolü - fallback olarak data response içinde id araması yap
      if (!quizData.id && typeof quizData === 'object') {
        // Eğer id doğrudan kullanılabilir değilse, daha derin aramalar yapalım
        if (quizData.quiz && quizData.quiz.id) {
          console.log('[QuizApiService] ID quiz.id içinde bulundu');
          quizData.id = quizData.quiz.id;
        } else if (quizData.data && quizData.data.id) {
          console.log('[QuizApiService] ID data.id içinde bulundu');
          quizData.id = quizData.data.id;
        } else if (quizData.data && quizData.data.quiz && quizData.data.quiz.id) {
          console.log('[QuizApiService] ID data.quiz.id içinde bulundu');
          quizData.id = quizData.data.quiz.id;
        } else {
          // ID oluşturmayı dene
          console.warn('[QuizApiService] ID bulunamadı, yeni bir ID oluşturuluyor');
          quizData.id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
      }
      
      // Aynı şekilde questions array kontrolü yapalım
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        // questions yoksa veya array değilse, diğer muhtemel yapıları kontrol et
        if (quizData.quiz && Array.isArray(quizData.quiz.questions)) {
          console.log('[QuizApiService] Sorular quiz.questions içinde bulundu');
          quizData.questions = quizData.quiz.questions;
        } else if (quizData.data && Array.isArray(quizData.data.questions)) {
          console.log('[QuizApiService] Sorular data.questions içinde bulundu');
          quizData.questions = quizData.data.questions;
        } else if (quizData.data && quizData.data.quiz && Array.isArray(quizData.data.quiz.questions)) {
          console.log('[QuizApiService] Sorular data.quiz.questions içinde bulundu');
          quizData.questions = quizData.data.quiz.questions;
        } else if (Array.isArray(quizData)) {
          // Belki yanıt doğrudan soru dizisidir
          console.log('[QuizApiService] Yanıt doğrudan soru dizisi olarak alındı');
          quizData.questions = quizData;
          // ID oluştur
          quizData.id = quizData.id || `quiz_${Date.now()}`;
        }
      }
      
      // Sorular hala bulunamadıysa boş array başlat
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        console.warn('[QuizApiService] Sorular bulunamadı, boş dizi oluşturuluyor');
        quizData.questions = [];
        quizData.totalQuestions = 0;
      } else {
        // totalQuestions değerini soruların sayısına göre ayarla
        quizData.totalQuestions = quizData.questions.length;
        console.log(`[QuizApiService] ${quizData.questions.length} soru bulundu`);
      }
      
      // timestamp kontrolü (opsiyonel)
      if (!quizData.timestamp) {
        quizData.timestamp = new Date().toISOString();
      }
      
      // Quiz nesnesi tamamlandı
      const quiz = quizData as ApiQuiz;
      flowTracker.markEnd('generateQuiz', FlowCategory.API, 'QuizApiService');
      
      return quiz;
    } catch (error) {
      flowTracker.markEnd('generateQuiz', FlowCategory.API, 'QuizApiService');
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
