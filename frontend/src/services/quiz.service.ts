import {
  ApiAnalysisResult,
  ApiFailedQuestion,
  ApiQuiz,
} from "./adapter.service";
import apiService from "./api.service";
import { ErrorService, ApiError } from "./error.service";
import adapterService from "./adapter.service";
import type {
  Quiz, 
  Question, 
  QuizGenerationOptions, 
  QuizSubmissionPayload, 
  DifficultyLevel, 
  QuestionType, 
  QuestionStatus 
} from "../types/quiz";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory, FlowTrackerService } from "./flow-tracker.service";
import { LoggerService } from "./logger.service";
import axios from "axios";

// Quiz tipine metadata ekleyelim (opsiyonel)
interface QuizWithMetadata extends Quiz {
  metadata?: Record<string, any>;
}

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
  questions: any[]; // Gerekirse daha spesifik bir tip tanımlanabilir
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
          console.log("[QuizApiService.getResponseData] Response.data içeriği:", (response as any).data);
          return (response as any).data;
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
        console.log(`[QuizApiService.isApiResponse] status tipi: ${typeof (response as any).status}, data tipi: ${typeof (response as any).data}`);
      }
      
      return hasStatusAndData && typeof (response as any).status === 'number';
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
    if (!this.isObject(rawData)) {
      logger.warn(`Question data at index ${index} is not an object, creating fallback.`, 'QuizApiService.safeCastToQuestion');
      return this.createFallbackQuestion(index);
    }
    const data = rawData as Record<string, unknown>;
    return {
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
      if (!this.isValidApiQuiz(apiQuiz)) {
        throw new Error('API yanıtı geçerli bir sınav formatında değil.');
      }
      const quiz = adapterService.toQuiz(apiQuiz);
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizById', new Error('Success'));
      logger.debug(`Sınav detayı alındı: ID=${id}`, 'QuizApiService.getQuizById', undefined, undefined, { id, title: quiz.title });
      return quiz;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizById', err);
      logger.error(`Sınav detayı alınamadı: ID=${id}`, 'QuizApiService.getQuizById', err, undefined, { id });
      const apiError = ErrorService.createApiError("Sınav detayları yüklenirken bir hata oluştu.", 
        err.message || String(err), {
          original: {
            error: err,
            context: 'getQuizById',
            quizId: id
          }
        });
      ErrorService.handleError(apiError, "Sınav Detayı Alma");
      throw apiError;
    }
  }

  /**
   * ID'ye göre sınav analiz sonuçlarını getirir
   * @param id Quiz ID
   * @returns Quiz analiz sonuçları
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizAnalysis(quizId: string) {
    const flowStepId = `getQuizAnalysis_${quizId}`;
    flowTracker.markStart(flowStepId);
    
    try {
      logger.debug(`Sınav analizi alınıyor: ID=${quizId}`, 'QuizApiService.getQuizAnalysis', undefined, undefined, { quizId });
      const response = await apiService.get<ApiAnalysisResult>(`${this.basePath}/${quizId}/analysis`);
      const analysisResult = this.getResponseData(response) as ApiAnalysisResult;

      if (!this.isObject(analysisResult) || typeof (analysisResult as ApiAnalysisResult).scorePercent !== 'number') {
        logger.warn('Alınan sınav analiz sonucu beklenen formatta değil, null döndürülüyor.', 'QuizApiService.getQuizAnalysis', undefined, undefined, { analysisResult });
        flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizAnalysis', new Error('Invalid analysis format'));
        return null; // Ya da hata fırlatılabilir, kullanım senaryosuna bağlı.
      }

      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizAnalysis', new Error('Success'));
      logger.info(`Sınav analizi alındı: ID=${quizId}`, 'QuizApiService.getQuizAnalysis', undefined, undefined, { quizId, score: analysisResult.scorePercent });
      return analysisResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getQuizAnalysis', err);
      logger.error(`Sınav analizi alınamadı: ID=${quizId}`, 'QuizApiService.getQuizAnalysis', err, undefined, { quizId });
      const apiError = ErrorService.createApiError("Sınav analizi yüklenirken bir hata oluştu.", 
        err.message || String(err), {
          original: {
            error: err,
            context: 'getQuizAnalysis',
            quizId
          }
        });
      ErrorService.handleError(apiError, "Sınav Analizi Alma");
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
    const flowStepId = 'getFailedQuestions';
    flowTracker.markStart(flowStepId);
    
    try {
      const params: Record<string, string> = {};
      if (courseId) params.courseId = courseId;
      logger.debug(`Yanlış cevaplanan sorular alınıyor`, 'QuizApiService.getFailedQuestions', undefined, undefined, { courseId });
      const response = await apiService.get<ApiFailedQuestion[]>(this.failedQuestionsPath, params);
      const failedQuestions = this.getResponseData(response) as ApiFailedQuestion[];
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getFailedQuestions', new Error('Success'));
      logger.debug(`${failedQuestions.length} yanlış cevaplanan soru alındı`, 'QuizApiService.getFailedQuestions', undefined, undefined, { count: failedQuestions.length, courseId });
      return failedQuestions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.getFailedQuestions', err);
      logger.error('Yanlış cevaplanan sorular alınamadı', 'QuizApiService.getFailedQuestions', err, undefined, { courseId });
      const apiError = ErrorService.createApiError("Yanlış cevaplanan sorular yüklenirken bir hata oluştu.", 
        err.message || String(err), {
          original: {
            error: err,
            context: 'getFailedQuestions',
            courseId
          }
        });
      ErrorService.handleError(apiError, "Yanlış Cevapları Alma");
      throw apiError;
    }
  }

  /**
   * QuizResponseDto'yu Quiz tipine dönüştürür
   */
  private mapResponseToQuiz(response: QuizResponseDto): Quiz {
    try {
      console.log('[QuizApiService.mapResponseToQuiz] Dönüştürülecek yanıt:', response);
      
      // Input detaylarını kontrol et
      console.log(`[QuizApiService.mapResponseToQuiz] id varlığı: ${!!response.id}, tipi: ${typeof response.id}`);
      console.log(`[QuizApiService.mapResponseToQuiz] title varlığı: ${!!response.title}, tipi: ${typeof response.title}`);
      console.log(`[QuizApiService.mapResponseToQuiz] quizType varlığı: ${!!response.quizType}, tipi: ${typeof response.quizType}`);
      console.log(`[QuizApiService.mapResponseToQuiz] questions varlığı: ${!!response.questions}, dizi mi: ${Array.isArray(response.questions)}, uzunluk: ${Array.isArray(response.questions) ? response.questions.length : 'N/A'}`);
      console.log(`[QuizApiService.mapResponseToQuiz] dates: createdAt=${response.createdAt}, updatedAt=${response.updatedAt}`);
      
      const result = {
        id: response.id,
        title: response.title,
        description: response.description || '',
        quizType: response.quizType as any, // Tip dönüşümü gerekebilir
        questions: response.questions || [],
        courseId: response.courseId,
        documentId: response.documentId,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
      
      console.log('[QuizApiService.mapResponseToQuiz] Dönüştürülen quiz nesnesi:', result);
      console.log(`[QuizApiService.mapResponseToQuiz] Quiz oluşturma başarılı. ID: ${result.id}, soru sayısı: ${result.questions?.length || 0}`);
      
      return result;
    } catch (error) {
      console.error('[QuizApiService.mapResponseToQuiz] HATA: Quiz dönüştürme işlemi başarısız!', error);
      throw new Error(`Quiz dönüştürme hatası: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verilen seçeneklere göre yeni bir sınav oluşturur
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async generateQuiz(options: QuizGenerationOptions): Promise<Quiz> {
    const flowStepId = `generateQuiz_${options.quizType}_${options.documentId || options.courseId || 'new'}`;
    flowTracker.markStart(flowStepId);

    try {
      const endpoint = options.quizType === 'quick' ? API_ENDPOINTS.GENERATE_QUICK_QUIZ : API_ENDPOINTS.GENERATE_PERSONALIZED_QUIZ;
      
      // HATA AYIKLAMA: Gönderilecek veriyi detaylı logla
      console.log(`[QuizApiService.generateQuiz] API isteği hazırlanıyor: ${endpoint}`);
      console.log(`[QuizApiService.generateQuiz] OPTIONS: ${JSON.stringify(options, null, 2)}`);
      console.log(`[QuizApiService.generateQuiz] selectedSubTopics tipi: ${typeof options.selectedSubTopics}`);
      console.log(`[QuizApiService.generateQuiz] selectedSubTopics dizisi mi?: ${Array.isArray(options.selectedSubTopics)}`);
      console.log(`[QuizApiService.generateQuiz] selectedSubTopics uzunluğu: ${options.selectedSubTopics?.length}`);
      console.log(`[QuizApiService.generateQuiz] selectedSubTopics içeriği: ${JSON.stringify(options.selectedSubTopics)}`);
      
      // Veri doğrulama ve düzeltme
      if (!options.selectedSubTopics || !Array.isArray(options.selectedSubTopics) || options.selectedSubTopics.length === 0) {
        console.error('[QuizApiService.generateQuiz] HATA: selectedSubTopics dizisi boş veya geçersiz!');
        
        // Eğer belge ID varsa, varsayılan bir alt konu oluştur
        if (options.documentId) {
          console.log('[QuizApiService.generateQuiz] Belge ID mevcut, varsayılan alt konu oluşturuluyor');
          options.selectedSubTopics = [
            {
              subTopic: 'Otomatik Oluşturulan Konu',
              normalizedSubTopic: `belge-${options.documentId.substring(0, 8)}`
            }
          ];
          console.log(`[QuizApiService.generateQuiz] Varsayılan alt konu oluşturuldu: ${JSON.stringify(options.selectedSubTopics)}`);
        } else {
          throw new ApiError('En az bir alt konu seçilmelidir', { 
            code: 'MISSING_SUBTOPICS',
            original: { 
              error: new Error('selectedSubTopics dizisi boş'),
              context: 'generateQuiz'
            }
          });
        }
      }
      
      // Endpoint'e göre doğru veri formatını hazırla
      const requestData: Record<string, unknown> = {};
      
      // Endpointe göre doğru isimle gönder
      if (endpoint === API_ENDPOINTS.GENERATE_QUICK_QUIZ) {
        // Quick quiz için subTopics array formatında gönder
        requestData.documentText = options.documentText || '';
        requestData.documentId = options.documentId || null;
        requestData.questionCount = options.preferences?.questionCount || 10;
        requestData.difficulty = options.preferences?.difficulty || 'medium';
        
        // SubTopics'i string[] formatına dönüştür (backend bunu bekliyor)
        requestData.subTopics = options.selectedSubTopics.map(topic => {
          if (typeof topic === 'string') return topic;
          return topic.normalizedSubTopic || topic.subTopic;
        });
      } else {
        // Personalized quiz için daha kompleks yapı
        requestData.courseId = options.courseId;
        requestData.documentId = options.documentId || null;
        requestData.documentText = options.documentText || '';
        requestData.questionCount = options.preferences?.questionCount || 10;
        requestData.difficulty = options.preferences?.difficulty || 'medium';
        
        // SubTopics'i string[] formatına dönüştür
        requestData.subTopics = options.selectedSubTopics.map(topic => {
          if (typeof topic === 'string') return topic;
          return topic.normalizedSubTopic || topic.subTopic;
        });
      }
      
      console.log(`[QuizApiService.generateQuiz] Son istek verisi: ${JSON.stringify(requestData, null, 2)}`);
      
      // API isteğini gönder
      const response = await apiService.post<QuizResponseDto>(endpoint, requestData);
      
      // HATA AYIKLAMA: Ham API yanıtını logla
      console.log(`[QuizApiService.generateQuiz] Ham API yanıtı:`, response);
      
      // Yanıt verisi güvenli bir şekilde çıkarılıyor
      let responseData;
      try {
      responseData = this.getResponseData(response); 
        console.log(`[QuizApiService.generateQuiz] İşlenen API yanıtı:`, responseData);
      } catch (error) {
        console.error(`[QuizApiService.generateQuiz] API yanıtı işlenirken hata:`, error);
        responseData = response; // Hata durumunda ham yanıtı kullan
      }
      
      console.log(`[QuizApiService.generateQuiz] API yanıtı başarılı:`, responseData);
      
      // DÜZELTME: Yanıt kontrolü ve fallback
      if (!responseData || !this.isObject(responseData)) {
        console.warn("[QuizApiService.generateQuiz] API yanıtı beklenen formatta değil, varsayılan sınav oluşturuluyor");
        console.warn("[QuizApiService.generateQuiz] Problem olan yanıt:", responseData);
        const fallbackQuiz = this.createFallbackQuiz("api_fallback", options);
        flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error('Invalid API response'));
        return fallbackQuiz;
      }

      // DÜZELTME: responseData içinde id kontrolü
      if (!responseData.id) {
        console.warn("[QuizApiService.generateQuiz] API yanıtı id içermiyor, muhtemelen farklı bir formatta. Yanıt:", responseData);
        console.log("[QuizApiService.generateQuiz] Yanıt anahtarları:", Object.keys(responseData).join(', '));
        
        // Eğer responseData.data yapısı varsa ondan al
        if (responseData.data && this.isObject(responseData.data) && responseData.data.id) {
          console.log("[QuizApiService.generateQuiz] API yanıtı içinde data nesnesi bulundu:", responseData.data);
          try {
            const mappedQuiz = this.mapResponseToQuiz(responseData.data as unknown as QuizResponseDto);
            flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error('Success with nested data'));
            return mappedQuiz;
          } catch (dataMapError) {
            console.error("[QuizApiService.generateQuiz] Data nesnesi dönüştürme hatası:", dataMapError);
            // Alt kısımdaki diğer çözümleri dene
          }
        }
        
        // Farklı bir yapıda olup olmadığını kontrol et
        let possibleQuiz = null;
        console.log("[QuizApiService.generateQuiz] Alternatif yapılar aranıyor...");
      
        if (this.isObject(responseData.quiz)) {
          console.log("[QuizApiService.generateQuiz] 'quiz' anahtarı bulundu:", responseData.quiz);
          possibleQuiz = responseData.quiz;
        } else if (this.isObject(responseData.result)) {
          console.log("[QuizApiService.generateQuiz] 'result' anahtarı bulundu:", responseData.result);
          possibleQuiz = responseData.result;
        } else if (Array.isArray(responseData.questions)) {
          console.log("[QuizApiService.generateQuiz] 'questions' dizisi bulundu, manuel sınav oluşturuluyor");
          // Eğer doğrudan quiz değil ama içerisinde sorular varsa manuel oluştur
          possibleQuiz = {
            id: `generated_${Date.now()}`,
            title: options.title || 'Yeni Sınav',
            questions: responseData.questions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            quizType: options.quizType || 'quick'
          };
          console.log("[QuizApiService.generateQuiz] Manuel oluşturulan quiz:", possibleQuiz);
        }
        
        if (possibleQuiz && possibleQuiz.id) {
          console.log("[QuizApiService.generateQuiz] Alternatif formatta quiz bulundu:", possibleQuiz);
          try {
            const mappedQuiz = this.mapResponseToQuiz(possibleQuiz as unknown as QuizResponseDto);
            flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error('Success with alternative format'));
            return mappedQuiz;
          } catch (altMapError) {
            console.error("[QuizApiService.generateQuiz] Alternatif format dönüştürme hatası:", altMapError);
            // Fallback'e devam et
          }
        }
        
        // Eğer hiçbir şekilde uygun bir yapı bulunamazsa varsayılan oluştur
        console.warn("[QuizApiService.generateQuiz] Geçerli bir sınav formatı bulunamadı, varsayılan oluşturuldu");
        const fallbackQuiz = this.createFallbackQuiz("format_fallback", options);
        flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error('Missing ID in API response'));
        return fallbackQuiz;
      }
      
      try {
        // Normal işleme deneyin
        console.log("[QuizApiService.generateQuiz] Standart yanıt işleniyor. ID:", responseData.id);
        const mappedQuiz = this.mapResponseToQuiz(responseData as unknown as QuizResponseDto);
        console.log("[QuizApiService.generateQuiz] Quiz başarıyla oluşturuldu:", mappedQuiz.id);
        flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error('Success'));
        return mappedQuiz;
      } catch (mapError) {
        // Eşleme hatası oluşursa loglayıp fallback dönün
        console.error("[QuizApiService.generateQuiz] Quiz dönüşümü sırasında hata:", mapError);
        console.error("[QuizApiService.generateQuiz] Dönüşüm hatası detayları:", { 
          errorType: mapError instanceof Error ? mapError.constructor.name : typeof mapError,
          message: mapError instanceof Error ? mapError.message : String(mapError),
          stack: mapError instanceof Error ? mapError.stack : undefined,
          responseData
        });
        const fallbackQuiz = this.createFallbackQuiz("mapping_fallback", options);
        flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error(`Mapping error: ${String(mapError)}`));
        return fallbackQuiz;
      }
    } catch (error) {
      console.error(`[QuizApiService.generateQuiz] HATA OLUŞTU: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[QuizApiService.generateQuiz] Tam hata detayı:`, error);
      
      // Detaylı hata bilgisiyle ApiError oluştur
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
      
        console.error(`[QuizApiService.generateQuiz] Axios hatası: Status=${statusCode}, Data=`, responseData);
        
        if (statusCode === 400 && responseData?.message) {
          throw ErrorService.createApiError(responseData.message);
        }
      }
      
      // Genel hata
      throw ErrorService.createApiError(
        error instanceof Error ? error.message : 'Sınav oluşturulurken beklenmeyen bir hata oluştu'
      );
    }
  }

  /**
   * Sınav cevaplarını gönderir ve sonuçları alır
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async submitQuiz(payload: QuizSubmissionPayload): Promise<ApiAnalysisResult> {
    const flowStepId = `submitQuiz_${payload.quizId}`;
    flowTracker.markStart(flowStepId);
    
    try {
      const apiPayload = adapterService.fromQuizSubmissionPayload(payload) as unknown as Record<string, unknown>;
      const endpoint = `${this.basePath}/${payload.quizId}/submit`;
      logger.debug(`Sınav yanıtları gönderiliyor: ID=${payload.quizId}`, 'QuizApiService.submitQuiz', undefined, undefined, { quizId: payload.quizId, answerCount: payload.userAnswers.length });
      
      const response = await apiService.post<ApiAnalysisResult>(endpoint, apiPayload);
      
      const analysisResult = this.getResponseData(response) as ApiAnalysisResult;
      
      // Analiz sonucunun temel alanlarını kontrol et
      if (!this.isObject(analysisResult) || typeof (analysisResult as ApiAnalysisResult).scorePercent !== 'number') {
        logger.error('Alınan sınav analiz sonucu beklenen formatta değil.', 'QuizApiService.submitQuiz', undefined, undefined, { analysisResult });
        throw new Error('Geçersiz sınav analiz sonucu formatı.');
      }
      
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.submitQuiz', new Error('Success'));
      logger.info(`Sınav yanıtları gönderildi ve analiz alındı: ID=${payload.quizId}`, 'QuizApiService.submitQuiz', undefined, undefined, { quizId: payload.quizId, score: analysisResult.scorePercent });
      return analysisResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.submitQuiz', err);
      logger.error(`Sınav yanıtları gönderilemedi: ID=${payload.quizId}`, 'QuizApiService.submitQuiz', err, undefined, { quizId: payload.quizId });
      const apiError = ErrorService.createApiError("Sınav yanıtları gönderilirken bir hata oluştu.", 
        err.message || String(err), {
          original: {
            error: err,
            context: 'submitQuiz',
            payload
          }
        });
      ErrorService.handleError(apiError, "Sınav Yanıtı Gönderme");
      throw apiError;
    }
  }

  /**
   * Sınavı siler
   * @param id Quiz ID
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async deleteQuiz(id: string) {
    const flowStepId = `deleteQuiz_${id}`;
    flowTracker.markStart(flowStepId);
    
    try {
      logger.debug(`Sınav siliniyor: ID=${id}`, 'QuizApiService.deleteQuiz', undefined, undefined, { id });
      await apiService.delete(`${this.basePath}/${id}`);
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.deleteQuiz', new Error('Success'));
      logger.info(`Sınav silindi: ID=${id}`, 'QuizApiService.deleteQuiz', undefined, undefined, { id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.deleteQuiz', err);
      logger.error(`Sınav silinemedi: ID=${id}`, 'QuizApiService.deleteQuiz', err, undefined, { id });
      const apiError = ErrorService.createApiError("Sınav silinirken bir hata oluştu.", 
        err.message || String(err), {
          original: {
            error: err,
            context: 'deleteQuiz',
            quizId: id
          }
        });
      ErrorService.handleError(apiError, "Sınav Silme");
      throw apiError;
    }
  }
}

const quizService = new QuizApiService();
export default quizService;
