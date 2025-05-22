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
  QuestionStatus 
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
          try {
            // Doğru endpoint URL formatını kullan
            const result = await this.apiService.get<QuizAnalysisResponse>(`/quizzes/${quizId}/analysis`);
            console.log('[QuizApiService.getQuizAnalysis] API yanıtı:', result);
            return result as QuizAnalysisResponse;
          } catch (err) {
            // 404 hatasında alternatif endpoint'i dene
            if (axios.isAxiosError(err) && err.response?.status === 404) {
              console.log('[QuizApiService.getQuizAnalysis] Alternatif endpoint deneniyor');
              const result = await this.apiService.get<QuizAnalysisResponse>(`/quiz-analysis/${quizId}`);
              return result as QuizAnalysisResponse;
            }
            throw err;
          }
        },
        // Fallback - yerel analiz
        () => this.generateLocalAnalysis(quizId)
      );
    } catch (error) {
      console.error('[QuizApiService.getQuizAnalysis] Beklenmeyen hata:', error);
      return this.generateLocalAnalysis(quizId);
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
      
      const result: Quiz = {
        id: response.id,
        title: response.title,
        quizType: response.quizType as QuizType, 
        questions: response.questions || [],
        courseId: response.courseId || null,
        // DocumentID yerine sourceDocument nesnesi kullan
        sourceDocument: response.documentId ? {
          fileName: `Belge-${response.documentId.substring(0,8)}`,
          storagePath: response.documentId
        } : null,
        userId: '', // Varsayılan değer ataması
        preferences: { questionCount: response.questions?.length || 10, difficulty: 'medium' }, // Varsayılan değer ataması
        userAnswers: {}, // Boş başlangıç
        score: 0, // Henüz skorlama yapılmadı
        correctCount: 0, // Henüz doğru sayılmadı
        totalQuestions: response.questions?.length || 0,
        timestamp: response.createdAt || new Date().toISOString()
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
          const defaultTopic = {
            subTopic: 'Belge İçeriği',
            normalizedSubTopic: `belge-${options.documentId.substring(0, 8)}`
          };
          options.selectedSubTopics = [defaultTopic];
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
      
      // Her alt konunun doğru formatta olduğunu kontrol et ve düzelt
      if (Array.isArray(options.selectedSubTopics)) {
        options.selectedSubTopics = options.selectedSubTopics.map(topic => {
          // Eğer topic bir string ise veya gerekli property'leri eksikse düzelt
          if (typeof topic === 'string') {
            return {
              subTopic: topic,
              normalizedSubTopic: topic
            };
          } else if (!topic.normalizedSubTopic && topic.subTopic) {
            return {
              ...topic,
              normalizedSubTopic: topic.subTopic.toLowerCase().replace(/\s+/g, '-')
            };
          } else if (!topic.subTopic && topic.normalizedSubTopic) {
            return {
              ...topic,
              subTopic: topic.normalizedSubTopic
            };
          }
          return topic;
        });
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
      
      // Son kontrol: subTopics dizisi boş mu?
      if (!requestData.subTopics || (Array.isArray(requestData.subTopics) && (requestData.subTopics as string[]).length === 0)) {
        console.error('[QuizApiService.generateQuiz] HATA: API isteği için subTopics dizisi hâlâ boş!');
        
        if (requestData.documentId) {
          console.log('[QuizApiService.generateQuiz] Son çare: Belge ID kullanarak varsayılan alt konu ekleniyor');
          requestData.subTopics = [`belge-${String(requestData.documentId).substring(0, 8)}`];
          console.log(`[QuizApiService.generateQuiz] Eklenen varsayılan alt konu: ${(requestData.subTopics as string[])[0]}`);
        } else {
          throw new ApiError('En az bir alt konu seçilmelidir. Lütfen tekrar deneyin.', {
            code: 'EMPTY_SUBTOPICS_IN_REQUEST',
            original: { 
              error: new Error('Son API isteği için subTopics dizisi boş kaldı.'),
              context: 'generateQuiz'
            }
          });
        }
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
  async submitQuiz(payload: QuizSubmissionPayload): Promise<QuizSubmissionResponse> {
    // Quiz ID kontrolü - geçersiz ID varsa yerel sonuca dön
    if (!payload.quizId || payload.quizId === 'undefined') {
      console.warn('[QuizApiService.submitQuiz] Geçersiz Quiz ID:', payload.quizId);
      return this.createLocalQuizSubmission(payload);
    }

    const flowStepId = `submitQuiz_${payload.quizId}`;
    flowTracker.markStart(flowStepId);
    
    try {
      return await this.apiService.safeRequest(
        // Ana API isteği - formatı backend ile uyumlu hale getiriyoruz
        async () => {
          try {
            // Önce localStorage'dan quiz verilerini al (backend'in beklediği ek alanlar için)
            const storedQuiz = this.getQuizFromLocalStorage(payload.quizId);
            
            if (!storedQuiz) {
              console.warn('[QuizApiService.submitQuiz] LocalStorage\'da quiz bulunamadı, minimum veri ile devam ediliyor');
            }
            
            // Backend API'nin beklediği formata uygun veri oluşturma
            const formattedPayload: Record<string, unknown> = {
              // Temel bilgiler
              quizId: payload.quizId, // API endpoint içerisinde olsa da, bazen request body içinde de bekleniyor
              userAnswers: payload.userAnswers, 
              elapsedTime: payload.elapsedTime || 0,
              
              // Backend validasyonu için gereken alanlar
              quizType: storedQuiz?.quizType || 'quick',
              
              // Tercihler - backend validasyonu için
              preferences: storedQuiz?.preferences || { 
                questionCount: Object.keys(payload.userAnswers).length || 10, 
                difficulty: 'medium',
                timeLimit: Math.ceil((payload.elapsedTime || 0) / 60) || 10
              },
              
              // Quiz meta verileri - backend validasyonu için
              title: storedQuiz?.title || 'Quiz',
              timestamp: new Date().toISOString(),
              score: storedQuiz?.score || 0,
              
              // Sorular - backend soruları doğrulamak için kullanıyor
              questions: this.prepareQuestionsForSubmission(storedQuiz?.questions || [], payload.userAnswers)
            };
            
            console.log('[QuizApiService.submitQuiz] Backend\'e gönderilecek formatlı veri:', formattedPayload);
            
            // Formatlı veriyi backend'e gönder
            try {
              // Doğru endpoint formatını kullan
              const endpoint = `/quizzes/${payload.quizId}/submit`;
              console.log(`[QuizApiService.submitQuiz] API isteği gönderiliyor: ${endpoint}`);
              
              const result = await this.apiService.post<QuizSubmissionResponse>(endpoint, formattedPayload);
              console.log('[QuizApiService.submitQuiz] API yanıtı başarılı:', result);
              return result as QuizSubmissionResponse;
            } catch (error) {
              console.error('[QuizApiService.submitQuiz] API hatası:', error);
              
              // Hata detaylarını logla
              if (axios.isAxiosError(error)) {
                console.error('[QuizApiService.submitQuiz] Status:', error.response?.status);
                console.error('[QuizApiService.submitQuiz] Response data:', error.response?.data);
                
                // Backend hatası durumunda yerel sonuca geçiş yap
                if (error.response?.status === 500 || error.response?.status === 400) {
                  console.warn(`[QuizApiService.submitQuiz] Backend ${error.response.status} hatası, lokalde sonuç oluşturuluyor`);
                  return this.createLocalQuizSubmission(payload);
                }
              }
              
              // Diğer hatalar için tekrar fırlat
              throw error;
            }
          } catch (error) {
            console.error('[QuizApiService.submitQuiz] İç blok hatası:', error);
            // İç hatalar için de yerel sonucu dön
            return this.createLocalQuizSubmission(payload);
          }
        },
        // Fallback - yerel depolama ile sonuç oluştur
        () => {
          console.log('[QuizApiService.submitQuiz] Fallback çözüm uygulanıyor');
          return this.createLocalQuizSubmission(payload);
        }
      );
    } catch (error) {
      // Herhangi bir hata durumunda, yerel bir sonuç oluştur
      console.error('[QuizApiService.submitQuiz] En dış blok hatası:', error);
      return this.createLocalQuizSubmission(payload);
    } finally {
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.submitQuiz');
    }
  }
  
  /**
   * Soruları backend'e gönderilecek formatta hazırlar
   * Backend'in validasyon hatalarını önler
   */
  private prepareQuestionsForSubmission(questions: Question[], userAnswers: Record<string, string>): Question[] {
    // Boş array kontrolü
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn('[QuizApiService.prepareQuestionsForSubmission] Sorular bulunamadı, varsayılan sorular oluşturuluyor');
      // Kullanıcı yanıtlarından soru ID'lerini al ve varsayılan sorular oluştur
      return Object.keys(userAnswers).map((qId, index) => ({
        id: qId,
        questionText: `Soru ${index + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: userAnswers[qId] || 'A', // Kullanıcı yanıtını doğru kabul et
        difficulty: 'medium' as DifficultyLevel,
        questionType: 'multiple_choice' as QuestionType,
        status: 'active' as QuestionStatus,
        subTopic: 'Varsayılan Konu',
        normalizedSubTopic: 'varsayilan-konu',
        metadata: { generatedForSubmission: true }
      }));
    }
    
    // Soruları kopyala ve eksik alanları tamamla
    return questions.map(q => {
      // Derin kopya oluştur
      const question = { ...q };
      
      // ID kontrolü 
      if (!question.id) {
        question.id = `q_${Math.random().toString(36).substring(2, 15)}`;
      }
      
      // Alt konu bilgisi kontrolü
      if (!question.subTopic) {
        question.subTopic = 'Genel';
      }
      
      if (!question.normalizedSubTopic) {
        question.normalizedSubTopic = question.subTopic
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '');
      }
      
      // Zorluk seviyesi kontrolü
      if (!question.difficulty) {
        question.difficulty = 'medium';
      }
      
      // Soru tipi kontrolü
      if (!question.questionType) {
        question.questionType = 'multiple_choice';
      }
      
      // Diğer zorunlu alanlar
      if (!question.status) {
        question.status = 'active';
      }
      
      // Options kontrolü
      if (!Array.isArray(question.options) || question.options.length < 2) {
        question.options = ['A', 'B', 'C', 'D'];
      }
      
      return question;
    });
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

  /**
   * Hızlı sınavı veritabanına kaydeder
   */
  async saveQuickQuiz(quiz: Quiz): Promise<Quiz> {
    try {
      // Quiz nesnesini Record<string, unknown> tipine dönüştürme
      const quizAsRecord: Record<string, unknown> = {
        id: quiz.id,
        title: quiz.title,
        userId: quiz.userId,
        quizType: quiz.quizType,
        courseId: quiz.courseId,
        preferences: quiz.preferences,
        questions: quiz.questions,
        userAnswers: quiz.userAnswers,
        score: quiz.score,
        timestamp: quiz.timestamp
      };
      
      const response = await apiService.post<ApiQuiz>(API_ENDPOINTS.SAVE_QUICK_QUIZ, quizAsRecord);
      return adapterService.toQuiz(response);
    } catch (error) {
      console.error("[QuizApiService.saveQuickQuiz] Sınav kaydedilirken hata:", error);
      throw new ApiError("Sınav kaydetme işlemi sırasında bir hata oluştu", { 
        status: 500, 
        original: { error, context: "saveQuickQuiz" }
      });
    }
  }

  // LOCAL FALLBACKS
  
  private createLocalQuizSubmission(payload: QuizSubmissionPayload): QuizSubmissionResponse {
    console.info('[QuizApiService] Backend bağlantısı kurulamadı, yerel sınav sonuçları oluşturuluyor', payload);
    
    // localStorage'dan veriyi al
    const storedQuiz = this.getQuizFromLocalStorage(payload.quizId);
    if (!storedQuiz) {
      console.warn('[QuizApiService] Yerel depolama verisi bulunamadı:', payload.quizId);
      // Minimum gerekli veriyle bir sonuç oluştur
      return {
        id: payload.quizId,
        score: 0,
        submittedAt: new Date().toISOString(),
        correctCount: 0,
        totalQuestions: Object.keys(payload.userAnswers).length,
        elapsedTime: payload.elapsedTime
      };
    }
    
    // Kullanıcı yanıtlarını localStorage'a kaydet (analiz için kullanılacak)
    try {
      storedQuiz.userAnswers = payload.userAnswers;
      localStorage.setItem(`quizResult_${payload.quizId}`, JSON.stringify(storedQuiz));
    } catch (e) {
      console.error('[QuizApiService] LocalStorage kayıt hatası:', e);
    }
    
    // Sınav sonucunu oluştur (frontend'de)
    const correctCount = Object.entries(payload.userAnswers).filter(([qId, ans]) => {
      const question = storedQuiz.questions.find(q => q.id === qId);
      return question && question.correctAnswer === ans;
    }).length;
    
    const result: QuizSubmissionResponse = {
      id: payload.quizId,
      score: Math.round((correctCount / storedQuiz.questions.length) * 100),
      submittedAt: new Date().toISOString(),
      correctCount,
      totalQuestions: storedQuiz.questions.length,
      elapsedTime: payload.elapsedTime
    };
    
    console.log('[QuizApiService] Yerel sınav sonuçları oluşturuldu:', result);
    
    return result;
  }
  
  private generateLocalAnalysis(quizId: string): QuizAnalysisResponse {
    console.info('[QuizApiService] Backend bağlantısı kurulamadı, yerel analiz oluşturuluyor', quizId);
    
    // localStorage'dan veriyi al
    const storedQuiz = this.getQuizFromLocalStorage(quizId);
    if (!storedQuiz) {
      console.warn('[QuizApiService] Yerel depolama verisi bulunamadı:', quizId);
      // Minimum gerekli veriyle bir sonuç oluştur
      return {
        quizId,
        recommendedTopics: [],
        overallScore: 0,
        performanceBySubTopic: {},
        performanceByDifficulty: {},
        uniqueSubTopics: []
      };
    }
    
    // localStorage'dan saklanan kullanıcı yanıtlarını al
    const userAnswers = storedQuiz.userAnswers || {};
    
    // Alt konu bazında performans hesapla
    const performanceBySubTopic: Record<string, {
      scorePercent: number;
      status: "pending" | "failed" | "medium" | "mastered";
      questionCount: number;
      correctCount: number;
    }> = {};
    
    const subTopics = new Set<string>();
    
    storedQuiz.questions.forEach(q => {
      // Alt konu alanı düzeltme - subTopic veya normalizedSubTopic alanı kullan
      const subTopic = q.subTopic || q.normalizedSubTopic || 'Alt Konu Belirtilmemiş';
      subTopics.add(subTopic);
      
      // Alt konu performansını hesapla
      if (!performanceBySubTopic[subTopic]) {
        performanceBySubTopic[subTopic] = {
          questionCount: 0,
          correctCount: 0,
          scorePercent: 0,
          status: "pending"
        };
      }
      
      performanceBySubTopic[subTopic].questionCount++;
      
      // Doğru cevap kontrolü
      if (userAnswers[q.id] === q.correctAnswer) {
        performanceBySubTopic[subTopic].correctCount++;
      }
    });
    
    // Zorluk seviyesine göre performans hesapla
    const performanceByDifficulty: Record<string, {
      count: number;
      correct: number;
      score: number;
    }> = {};
    
    const difficulties = new Set<string>();
    
    storedQuiz.questions.forEach(q => {
      const difficulty = q.difficulty || 'medium';
      difficulties.add(difficulty);
      
      if (!performanceByDifficulty[difficulty]) {
        performanceByDifficulty[difficulty] = {
          count: 0,
          correct: 0,
          score: 0
        };
      }
      
      performanceByDifficulty[difficulty].count++;
      
      // Doğru cevap kontrolü
      if (userAnswers[q.id] === q.correctAnswer) {
        performanceByDifficulty[difficulty].correct++;
      }
    });
    
    // Skor ve durumları hesapla
    Object.keys(performanceBySubTopic).forEach(topic => {
      const perf = performanceBySubTopic[topic];
      perf.scorePercent = Math.round((perf.correctCount / perf.questionCount) * 100);
      
      // Durum belirle
      if (perf.scorePercent >= 75) perf.status = "mastered";
      else if (perf.scorePercent >= 50) perf.status = "medium";
      else perf.status = "failed";
    });
    
    Object.keys(performanceByDifficulty).forEach(diff => {
      const perf = performanceByDifficulty[diff];
      perf.score = Math.round((perf.correct / perf.count) * 100);
    });
    
    // Toplam skoru hesapla
    const totalCorrect = Object.values(userAnswers).filter((ans, i) => {
      const question = storedQuiz.questions[i];
      return question && ans === question.correctAnswer;
    }).length;
    
    const overallScore = Math.round((totalCorrect / storedQuiz.questions.length) * 100);
    
    // Temel analiz oluştur
    const analysis: QuizAnalysisResponse = {
      quizId,
      recommendedTopics: [],
      overallScore,
      performanceBySubTopic,
      performanceByDifficulty,
      uniqueSubTopics: Array.from(subTopics)
    };
    
    console.log('[QuizApiService] Yerel analiz oluşturuldu:', analysis);
    
    return analysis;
  }
  
  private getQuizFromLocalStorage(quizId: string): Quiz | null {
    try {
      const storedQuizJson = localStorage.getItem(`quizResult_${quizId}`);
      if (!storedQuizJson) return null;
      return JSON.parse(storedQuizJson);
    } catch (error) {
      console.error('LocalStorage okuma hatası:', error);
      return null;
    }
  }
}

const quizService = new QuizApiService();
export default quizService;
