import {
  ApiFailedQuestion,
  ApiQuiz,
} from "./adapter.service";
import apiService from './api.service';
import { ErrorService, ApiError } from "./error.service";
import adapterService from "./adapter.service";
import type {
  Quiz, 
  QuizType, 
  Question, 
  QuizGenerationOptions, 
  QuizSubmissionPayload, 
  QuizSubmissionResponse,
  QuizAnalysisResponse,
  DifficultyLevel, 
  QuestionType, 
  QuestionStatus,
  // SubTopic should be imported if it's a defined type used in QuizGenerationOptions
  // For example: SubTopic 
} from "../types/quiz";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory, FlowTrackerService } from "./flow-tracker.service";
import { LoggerService } from "./logger.service";
import axios, { AxiosResponse } from "axios";


const logger: LoggerService = getLogger();
const flowTracker: FlowTrackerService = getFlowTracker();

/**
 * API endpoint sabitleri
 */
const API_ENDPOINTS = {
  QUIZZES: "/quizzes",
  FAILED_QUESTIONS: "/failed-questions",
  GENERATE_QUICK_QUIZ: "/quizzes/quick",
  GENERATE_PERSONALIZED_QUIZ: "/quizzes/personalized",
  SAVE_QUICK_QUIZ: "/quizzes/save-quick-quiz",
};

interface BaseApiResponse {
  status: number;
  data: unknown;
}

// Quiz yanıt tipi tanımı
interface QuizResponseDto {
  id: string;
  title: string;
  description?: string;
  quizType: string;
  questions: Question[]; // Question tipini kullan
  courseId?: string;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
  // Diğer backend yanıt alanları
}

/**
 * Quiz API Servisi
 * Quiz ile ilgili endpoint'leri çağırmak için kullanılır
 */
@LogClass('QuizApiService')
class QuizApiService {
  private readonly basePath = API_ENDPOINTS.QUIZZES;
  private readonly failedQuestionsPath = API_ENDPOINTS.FAILED_QUESTIONS;
  private readonly apiService = apiService;
  
  private getResponseData(response: unknown): unknown {
    console.log("[QuizApiService.getResponseData] Yanıt yapısı inceleniyor:", response);
    console.log("[QuizApiService.getResponseData] Yanıt tipi:", typeof response);
    
    try {
      if (this.isApiResponse(response)) {
        console.log("[QuizApiService.getResponseData] API yanıt formatında, data alanı dönülüyor");
        console.log("[QuizApiService.getResponseData] Response.data içeriği:", response.data);
        return response.data;
      }
      
      // Yanıt yapısını detaylı inceleme
      if (typeof response === 'object' && response !== null) {
        const keys = Object.keys(response);
        console.log("[QuizApiService.getResponseData] Yanıt nesne anahtarları:", keys.join(', '));
        
        // Axios yanıtı mı (direk axios response nesnesi olabilir)
        if ('data' in response && 'status' in response && 'headers' in response) {
          console.log("[QuizApiService.getResponseData] Yanıt bir Axios response nesnesi. Data alanı dönülüyor");
          console.log("[QuizApiService.getResponseData] Response.data içeriği:", (response as AxiosResponse<unknown>).data);
          return (response as AxiosResponse<unknown>).data;
        }
      }
      
      console.log("[QuizApiService.getResponseData] Yanıt özel bir yapıda değil, olduğu gibi dönülüyor");
      return response;
    } catch (error) {
      console.error("[QuizApiService.getResponseData] Yanıt işlenirken hata:", error);
      return response; // Hata durumunda orijinal yanıtı döndür
    }
  }
  
  private isObject(value: unknown): value is Record<string, unknown> {
    const result = typeof value === 'object' && value !== null && !Array.isArray(value);
    console.log(`[QuizApiService.isObject] Değer tipi: ${typeof value}, null mu: ${value === null}, dizi mi: ${Array.isArray(value)}, sonuç: ${result}`);
    return result;
  }

  private isApiResponse(response: unknown): response is BaseApiResponse {
    try {
      const isObject = typeof response === 'object' && response !== null;
      const hasStatusAndData = isObject && 'status' in response && 'data' in response;
      
      console.log(`[QuizApiService.isApiResponse] isObject: ${isObject}, hasStatusAndData: ${hasStatusAndData}`);
      
      if (hasStatusAndData) {
        console.log(`[QuizApiService.isApiResponse] status tipi: ${typeof (response as Record<string, unknown>).status}, data tipi: ${typeof (response as Record<string, unknown>).data}`);
      }
      
      return hasStatusAndData && typeof (response as Record<string, unknown>).status === 'number';
    } catch (error) {
      console.error(`[QuizApiService.isApiResponse] Hata:`, error);
      return false;
    }
  }

  private isValidApiQuiz(data: unknown): data is ApiQuiz {
    try {
      console.log(`[QuizApiService.isValidApiQuiz] Data inceleniyor:`, data);
      
      if (!this.isObject(data)) {
        console.log(`[QuizApiService.isValidApiQuiz] Object değil, false dönülüyor`);
        return false;
      }
      
    const q = data as ApiQuiz;
      const hasId = typeof q.id === 'string';
      const hasQuestions = Array.isArray(q.questions);
      
      console.log(`[QuizApiService.isValidApiQuiz] id var mı: ${hasId}, id: ${q.id}, questions dizisi mi: ${hasQuestions}, questions.length: ${hasQuestions ? q.questions.length : 'N/A'}`);
      
      return hasId && hasQuestions;
    } catch (error) {
      console.error(`[QuizApiService.isValidApiQuiz] Hata:`, error);
      return false;
    }
  }

  private safeCastToQuestion(rawData: unknown, index: number): Question {
    console.log(`[DEBUG] quiz.service.ts - safeCastToQuestion - Ham veri (index: ${index}):`, JSON.stringify(rawData, null, 2));
    
    if (!this.isObject(rawData)) {
      logger.warn(`Question data at index ${index} is not an object, creating fallback.`, 'QuizApiService.safeCastToQuestion');
      return this.createFallbackQuestion(index);
    }
    const data = rawData as Record<string, unknown>;
    
    // Alt konu bilgilerini kontrol et
    if (!data.subTopic && !data.normalizedSubTopic) {
      console.log(`[DEBUG] quiz.service.ts - safeCastToQuestion - Alt konu alanları eksik (index: ${index}).`);
    } else {
      console.log(`[DEBUG] quiz.service.ts - safeCastToQuestion - Alt konu bilgileri: subTopic='${data.subTopic}', normalizedSubTopic='${data.normalizedSubTopic}'`);
    }
    
    const question = {
      id: String(data.id || data._id || `fallback_q_${index}_${Date.now()}`),
      questionText: String(data.questionText || data.question || 'Boş Soru'),
      options: Array.isArray(data.options) && data.options.every(opt => typeof opt === 'string')
        ? data.options as string[]
        : ['A', 'B', 'C', 'D'].map(opt => String(data[opt] || `Seçenek ${opt}`)),
      correctAnswer: String(data.correctAnswer || data.answer || (Array.isArray(data.options) ? data.options[0] : 'A')),
      explanation: String(data.explanation || ''),
      subTopic: String(data.subTopic || data.topic || 'Genel'),
      normalizedSubTopic: String(data.normalizedSubTopic || 'genel'),
      difficulty: (typeof data.difficulty === 'string' ? data.difficulty : 'medium') as DifficultyLevel,
      questionType: (typeof data.questionType === 'string' ? data.questionType : 'multiple_choice') as QuestionType,
      status: (typeof data.status === 'string' ? data.status : 'active') as QuestionStatus,
      metadata: this.isObject(data.metadata) ? data.metadata : {},
    } as Question;

    console.log(`[DEBUG] quiz.service.ts - safeCastToQuestion - Dönüştürülen soru (ID: ${question.id}): subTopic='${question.subTopic}', normalizedSubTopic='${question.normalizedSubTopic}'`);
    return question;
  }

  private createFallbackQuestion(index: number): Question {
    console.log(`[QuizApiService.createFallbackQuestion] Varsayılan soru oluşturuluyor. Index: ${index}`);
    const question = {
      id: `fallback_q_${index}_${Date.now()}`,
      questionText: `Varsayılan Soru ${index + 1}`,
      options: ['Varsayılan Seçenek A', 'Varsayılan Seçenek B', 'Varsayılan Seçenek C', 'Varsayılan Seçenek D'],
      correctAnswer: 'Varsayılan Seçenek A',
      explanation: 'Bu bir varsayılan sorudur.',
      subTopic: 'Genel',
      normalizedSubTopic: 'genel',
      difficulty: 'medium',
      questionType: 'multiple_choice',
      status: 'active',
      metadata: { isFallback: true },
    } as Question;
    console.log(`[QuizApiService.createFallbackQuestion] Varsayılan soru oluşturuldu: ${question.id}`);
    return question;
  }

  private createFallbackQuiz(idPrefix: string = 'fallback', options?: QuizGenerationOptions): Quiz {
    console.log(`[QuizApiService.createFallbackQuiz] Varsayılan sınav oluşturuluyor. Prefix: ${idPrefix}, options:`, options);
    
    const fallbackId = `${idPrefix}_${Date.now()}`;
    const questionCount = options?.preferences?.questionCount || 5;
    console.log(`[QuizApiService.createFallbackQuiz] ID: ${fallbackId}, soru sayısı: ${questionCount}`);
    
    const quiz = {
      id: fallbackId,
      title: options?.title || 'Varsayılan Sınav',
      description: options?.description || 'Bu sınav, API yanıtı işlenirken bir sorun oluştuğu için varsayılan olarak oluşturulmuştur.',
      questions: Array.from({ length: questionCount }, (_, i) => this.createFallbackQuestion(i)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      type: options?.quizType || 'quick',
      quizType: options?.quizType || 'quick',
      userId: options?.userId || '',
      courseId: options?.courseId,
      documentId: options?.documentId,
      preferences: options?.preferences || { questionCount: 5, difficulty: 'medium' },
      learningTargetIds: [],
      isCompleted: false,
      score: 0,
      timeLimit: undefined,
      userAnswers: [],
      category: undefined,
      tags: [],
      version: 1,
      metadata: { 
        isFallback: true, 
        reason: 'Error processing API response or missing data',
        timestamp: new Date().toISOString(),
        idPrefix
      },
    } as unknown as Quiz;
    
    console.log(`[QuizApiService.createFallbackQuiz] Varsayılan sınav oluşturuldu: ${quiz.id}, sorular:`, quiz.questions?.length || 0);
    return quiz;
  }

  private parseQuizFromUnknown(responseData: unknown, options?: QuizGenerationOptions): Quiz {
    let apiQuiz: ApiQuiz | null = null;

    if (typeof responseData === 'string') {
      try {
        const parsedJson = JSON.parse(responseData);
        if (this.isValidApiQuiz(parsedJson)) {
          apiQuiz = parsedJson as ApiQuiz;
        } else if (this.isObject(parsedJson) && this.isValidApiQuiz(parsedJson.quiz)) {
          apiQuiz = parsedJson.quiz as ApiQuiz;
        } else if (this.isObject(parsedJson) && this.isValidApiQuiz(parsedJson.data)) {
          apiQuiz = parsedJson.data as ApiQuiz;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn('API response string could not be parsed as JSON or valid Quiz structure.', 
          'QuizApiService.parseQuizFromUnknown', undefined, undefined, { responseData, error: errorMessage });
        // TODO: Add text-based question extraction if necessary
      }
    } else if (this.isValidApiQuiz(responseData)) {
      apiQuiz = responseData as ApiQuiz;
    } else if (this.isObject(responseData)) {
      if (this.isValidApiQuiz(responseData.quiz)) {
        apiQuiz = responseData.quiz as ApiQuiz;
      } else if (this.isValidApiQuiz(responseData.data)) {
        apiQuiz = responseData.data as ApiQuiz;
      } else if (this.isValidApiQuiz(responseData.result)) {
        apiQuiz = responseData.result as ApiQuiz;
      }
    }

    if (apiQuiz) {
      return adapterService.toQuiz(apiQuiz); // Adapter'ı kullan
    }

    logger.warn('Could not parse a valid ApiQuiz from response, creating fallback quiz.', 
      'QuizApiService.parseQuizFromUnknown', undefined, undefined, { responseData });
    return this.createFallbackQuiz('parsed_fallback', options);
  }
  
  /**
   * Tüm sınavları getirir
   * @param courseId İsteğe bağlı ders ID'si
   * @returns Quiz dizisi
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizzes(courseId?: string): Promise<Quiz[]> {
    const flowStepId = 'getQuizzes';
    flowTracker.markStart(flowStepId);
    
    try {
      const params: Record<string, string> = {};
      if (courseId) params.courseId = courseId;
      
      logger.debug(`Sınav listesi alınıyor`, 'QuizApiService.getQuizzes', undefined, undefined, { courseId });
      const response = await apiService.get<ApiQuiz[]>(this.basePath, params);
      const apiQuizzes = this.getResponseData(response) as ApiQuiz[];
      
      const quizzes = apiQuizzes.map(q => adapterService.toQuiz(q));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizzes', new Error('Success'));
      logger.debug(`${quizzes.length} sınav alındı`, 'QuizApiService.getQuizzes', undefined, undefined, { count: quizzes.length, courseId });
      return quizzes;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizzes', err);
      logger.error("Sınav listesi alınamadı", 'QuizApiService.getQuizzes', err, undefined, { courseId });
      const apiError = ErrorService.createApiError("Sınav listesi yüklenirken bir hata oluştu.", 
        err.message || String(err), { 
          original: { 
            error: err,
            context: 'getQuizzes',
            courseId // Özel alanları original içine taşı
          } 
        });
      ErrorService.handleError(apiError, "Sınav Listesi Alma");
      throw apiError;
    }
  }

  /**
   * ID'ye göre sınav detaylarını getirir
   * @param id Quiz ID
   * @returns Quiz detayları
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizById(id: string): Promise<Quiz | null> {
    const flowStepId = `getQuizById_${id}`;
    flowTracker.markStart(flowStepId);
      
    try {
      logger.debug(`Sınav detayı alınıyor: ID=${id}`, 'QuizApiService.getQuizById', undefined, undefined, { id });
      const response = await apiService.get<ApiQuiz>(`${this.basePath}/${id}`);
      const apiQuiz = this.getResponseData(response) as ApiQuiz;
      console.log("[DEBUG] quiz.service.ts - getQuizById - Ham apiQuiz:", JSON.stringify(apiQuiz, null, 2));

      if (!this.isValidApiQuiz(apiQuiz)) {
        logger.warn('API yanıtı geçerli bir sınav formatında değil, fallback oluşturuluyor.', 'QuizApiService.getQuizById', undefined, undefined, { id, apiQuiz });
        return this.createFallbackQuiz(`invalid_api_quiz_${id}`);
      }
      const quiz = adapterService.toQuiz(apiQuiz);
      console.log("[DEBUG] quiz.service.ts - getQuizById - Adapter sonrası quiz:", JSON.stringify(quiz, null, 2));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizById', new Error('Success'));
      logger.debug(`Sınav detayı alındı: ID=${id}`, 'QuizApiService.getQuizById', undefined, undefined, { id, title: quiz.title });
      return quiz;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizById', err);
      logger.error(`Sınav detayı alınamadı: ID=${id}`, 'QuizApiService.getQuizById', err, undefined, { id });
      
      // Hata durumunda fallback quiz oluştur
      const fallbackQuiz = this.createFallbackQuiz(`error_fallback_${id}`);
      logger.warn(`Hata nedeniyle fallback quiz oluşturuldu: ${fallbackQuiz.id}`, 'QuizApiService.getQuizById', err, undefined, { id });
      ErrorService.showToast(
        `Sınav (ID: ${id}) yüklenemedi. Geçici bir sınav görüntülüyorsunuz.`, 
        "warning", 
        "Sınav Yükleme Hatası"
      );
      return fallbackQuiz; // Hata durumunda null yerine fallback quiz döndür
    }
  }

  /**
   * ID'ye göre sınav analiz sonuçlarını getirir
   * @param id Quiz ID
   * @returns Quiz analiz sonuçları
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizAnalysis(quizId: string): Promise<QuizAnalysisResponse> {
    try {
      return await this.apiService.safeRequest(
        // Ana API isteği
        async () => {
          const endpoint = `/quizzes/${quizId}/analysis`; // Corrected endpoint
          console.log(`[QuizApiService.getQuizAnalysis] API isteği gönderiliyor: ${endpoint}`);
          const result = await this.apiService.get<QuizAnalysisResponse>(endpoint);
          console.log('[QuizApiService.getQuizAnalysis] API yanıtı:', result);
          return result as QuizAnalysisResponse;
          // If this primary request fails (e.g. 404), safeRequest will execute the fallback.
        },
        // Fallback - yerel analiz
        () => {
          console.warn(`[QuizApiService.getQuizAnalysis] API isteği /quizzes/${quizId}/analysis başarısız. Yerel analiz oluşturuluyor.`);
          return this.generateLocalAnalysis(quizId);
        }
      );
    } catch (error) {
      // This outer catch handles errors if safeRequest itself fails or if the fallback fails.
      console.error('[QuizApiService.getQuizAnalysis] Beklenmeyen hata (safeRequest/fallback), yerel analiz oluşturuluyor:', error);
      return this.generateLocalAnalysis(quizId);
    }
  }

  /**
   * Hata ile sonuçlanan sınavları getirir
   * @param courseId İsteğe bağlı ders ID'si
   * @returns Quiz dizisi
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getFailedQuizzes(courseId?: string): Promise<Quiz[]> {
    const flowStepId = 'getFailedQuizzes';
    flowTracker.markStart(flowStepId);
    
    try {
      const params: Record<string, string> = {};
      if (courseId) params.courseId = courseId;
      
      logger.debug(`Başarısız sınavlar listesi alınıyor`, 'QuizApiService.getFailedQuizzes', undefined, undefined, { courseId });
      const response = await apiService.get<ApiFailedQuestion[]>(this.failedQuestionsPath, params);
      const apiFailedQuestions = this.getResponseData(response) as ApiFailedQuestion[];
      
      const quizzes = apiFailedQuestions.map(q => adapterService.toFailedQuestion(q));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getFailedQuizzes', new Error('Success'));
      logger.debug(`${quizzes.length} başarısız sınav kaydı alındı`, 'QuizApiService.getFailedQuizzes', undefined, undefined, { count: quizzes.length, courseId });
      return quizzes;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getFailedQuizzes', err);
      logger.error("Başarısız sınavlar listesi alınamadı", 'QuizApiService.getFailedQuizzes', err, undefined, { courseId });
      const apiError = ErrorService.createApiError("Başarısız sınavlar listesi yüklenirken bir hata oluştu.", 
        err.message || String(err), { 
          original: { 
            error: err,
            context: 'getFailedQuizzes',
            courseId // Özel alanları original içine taşı
          } 
        });
      ErrorService.handleError(apiError, "Başarısız Sınavlar Listesi Alma");
      throw apiError;
    }
  }

  /**
   * Hata ile sonuçlanan sınav detaylarını getirir
   * @param id Quiz ID
   * @returns Quiz detayları
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getFailedQuizById(id: string): Promise<Quiz | null> {
    const flowStepId = `getFailedQuizById_${id}`;
    flowTracker.markStart(flowStepId);
      
    try {
      logger.debug(`Başarısız sınav detayı alınıyor: ID=${id}`, 'QuizApiService.getFailedQuizById', undefined, undefined, { id });
      const response = await apiService.get<ApiFailedQuestion>(`${this.failedQuestionsPath}/${id}`);
      const apiFailedQuestion = this.getResponseData(response) as ApiFailedQuestion;
      console.log("[DEBUG] quiz.service.ts - getFailedQuizById - Ham apiFailedQuestion:", JSON.stringify(apiFailedQuestion, null, 2));

      if (!this.isObject(apiFailedQuestion)) {
        logger.warn('API yanıtı geçerli bir başarısız sınav formatında değil, fallback oluşturuluyor.', 'QuizApiService.getFailedQuizById', undefined, undefined, { id, apiFailedQuestion });
        return this.createFallbackQuiz(`invalid_api_failed_quiz_${id}`);
      }
      const quiz = adapterService.toFailedQuestion(apiFailedQuestion);
      console.log("[DEBUG] quiz.service.ts - getFailedQuizById - Adapter sonrası quiz:", JSON.stringify(quiz, null, 2));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getFailedQuizById', new Error('Success'));
      logger.debug(`Başarısız sınav detayı alındı: ID=${id}`, 'QuizApiService.getFailedQuizById', undefined, undefined, { id, title: quiz.title });
      return quiz;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getFailedQuizById', err);
      logger.error(`Başarısız sınav detayı alınamadı: ID=${id}`, 'QuizApiService.getFailedQuizById', err, undefined, { id });
      
      // Hata durumunda fallback quiz oluştur
      const fallbackQuiz = this.createFallbackQuiz(`error_fallback_failed_${id}`);
      logger.warn(`Hata nedeniyle fallback quiz oluşturuldu: ${fallbackQuiz.id}`, 'QuizApiService.getFailedQuizById', err, undefined, { id });
      ErrorService.showToast(
        `Başarısız sınav (ID: ${id}) yüklenemedi. Geçici bir sınav görüntülüyorsunuz.`, 
        "warning", 
        "Sınav Yükleme Hatası"
      );
      return fallbackQuiz; // Hata durumunda null yerine fallback quiz döndür
    }
  }

  /**
   * Yerel analiz oluşturur
   * @param quizId Quiz ID'si
   * @returns Yerel analiz sonuçları
   */
  private generateLocalAnalysis(quizId: string): QuizAnalysisResponse {
    console.warn(`[QuizApiService.generateLocalAnalysis] Yerel analiz oluşturuluyor. Quiz ID: ${quizId}`);
    
    // TODO: Gerçek yerel analiz mantığını buraya ekleyin
    // Şimdilik varsayılan bir yanıt döndürüyoruz
    return {
      quizId,
      success: false,
      message: 'Yerel analiz oluşturuldu. (Bu bir varsayılan yanıttır.)',
      data: null,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new QuizApiService();
