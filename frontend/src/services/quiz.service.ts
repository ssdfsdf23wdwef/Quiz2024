import {
  ApiAnalysisResult,
  ApiFailedQuestion,
  ApiQuiz
} from "./adapter.service";
import apiService from "./api.service";
import {  ErrorService } from "./error.service";
import adapterService from "./adapter.service";
import * as quiz from "../types/quiz";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory, FlowTrackerService } from "./flow-tracker.service";
import { LoggerService } from "./logger.service";

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

/**
 * Quiz API Servisi
 * Quiz ile ilgili endpoint'leri çağırmak için kullanılır
 */
@LogClass('QuizApiService')
class QuizApiService {
  private readonly basePath = API_ENDPOINTS.QUIZZES;
  private readonly failedQuestionsPath = API_ENDPOINTS.FAILED_QUESTIONS;
  
  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isApiResponse(response: unknown): response is BaseApiResponse {
    return this.isObject(response) && typeof (response as BaseApiResponse).status === 'number' && 'data' in response;
  }

  private getResponseData(response: unknown): unknown {
    if (this.isApiResponse(response)) {
      return response.data;
    }
    return response;
  }

  private isValidApiQuiz(data: unknown): data is ApiQuiz {
    if (!this.isObject(data)) return false;
    const q = data as ApiQuiz;
    return typeof q.id === 'string' && Array.isArray(q.questions);
  }

  private safeCastToQuestion(rawData: unknown, index: number): quiz.Question {
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
      difficulty: (typeof data.difficulty === 'string' ? data.difficulty : 'medium') as quiz.DifficultyLevel,
      questionType: (typeof data.questionType === 'string' ? data.questionType : 'multiple_choice') as quiz.QuestionType,
      status: (typeof data.status === 'string' ? data.status : 'active') as quiz.QuestionStatus,
      metadata: this.isObject(data.metadata) ? data.metadata : {},
    } as quiz.Question;
  }

  private createFallbackQuestion(index: number): quiz.Question {
    return {
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
    } as quiz.Question;
  }

  private createFallbackQuiz(idPrefix: string = 'fallback', options?: quiz.QuizGenerationOptions): quiz.Quiz {
    const fallbackId = `${idPrefix}_${Date.now()}`;
    const questionCount = options?.preferences?.questionCount || 5;
    return {
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
      metadata: { isFallback: true, reason: 'Error processing API response or missing data' },
    } as unknown as quiz.Quiz;
  }

  private parseQuizFromUnknown(responseData: unknown, options?: quiz.QuizGenerationOptions): quiz.Quiz {
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
      } catch (e) {
        logger.warn('API response string could not be parsed as JSON or valid Quiz structure.', 'QuizApiService.parseQuizFromUnknown', { responseData });
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

    logger.warn('Could not parse a valid ApiQuiz from response, creating fallback quiz.', 'QuizApiService.parseQuizFromUnknown', { responseData });
    return this.createFallbackQuiz('parsed_fallback', options);
  }

  /**
   * Tüm sınavları getirir
   * @param courseId İsteğe bağlı ders ID'si
   * @returns Quiz dizisi
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async getQuizzes(courseId?: string) {
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
      const apiError = ErrorService.createApiError("Sınav listesi yüklenirken bir hata oluştu.", err, { courseId, context: 'getQuizzes' });
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
  async getQuizById(id: string) {
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
      const apiError = ErrorService.createApiError("Sınav detayları yüklenirken bir hata oluştu.", err, { quizId: id, context: 'getQuizById' });
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
      const apiError = ErrorService.createApiError("Sınav analizi yüklenirken bir hata oluştu.", err, { quizId, context: 'getQuizAnalysis' });
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
      const apiError = ErrorService.createApiError("Yanlış cevaplanan sorular yüklenirken bir hata oluştu.", err, { courseId, context: 'getFailedQuestions' });
      ErrorService.handleError(apiError, "Yanlış Cevapları Alma");
      throw apiError;
    }
  }

  /**
   * Verilen seçeneklere göre yeni bir sınav oluşturur
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async generateQuiz(options: quiz.QuizGenerationOptions) {
    const flowStepId = 'generateQuiz';
    flowTracker.markStart(flowStepId);
    
    let endpoint = API_ENDPOINTS.GENERATE_QUICK_QUIZ; // Varsayılan
    if (options.quizType === 'personalized') {
      endpoint = API_ENDPOINTS.GENERATE_PERSONALIZED_QUIZ;
    }

    try {
      const apiOptionsPayload = adapterService.fromQuizGenerationOptions(options);
      logger.debug('Sınav oluşturma isteği gönderiliyor...', 'QuizApiService.generateQuiz', undefined, undefined, { endpoint, type: options.quizType, preferences: options.preferences });
      
      const response = await apiService.post<unknown>(endpoint, apiOptionsPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000, // 2 dakika timeout (Yapay zeka yanıtları uzun sürebilir)
      });

      if (!this.isApiResponse(response)) {
        logger.error('API yanıtı beklenen formatta değil (status/data eksik).', 'QuizApiService.generateQuiz', undefined, undefined, { response });
        throw new Error('Sınav oluşturma API yanıtı geçersiz formatta.');
      }

      if (response.status !== 200 && response.status !== 201) {
        logger.error(`Sınav oluşturma API isteği başarısız oldu. Status: ${response.status}`, 'QuizApiService.generateQuiz', undefined, undefined, { status: response.status, responseData: response.data });
        throw new Error(`Sınav oluşturma başarısız: ${response.status}`);
      }

      const quiz = this.parseQuizFromUnknown(response.data, options);
      
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', new Error('Success'));
      logger.info('Sınav başarıyla oluşturuldu/alındı', 'QuizApiService.generateQuiz', undefined, undefined, { quizId: quiz.id, questionCount: quiz.questions.length });
      return quiz;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService.generateQuiz', err);
      logger.error('Sınav oluşturulurken genel hata', 'QuizApiService.generateQuiz', err, undefined, { options });
      const apiError = ErrorService.createApiError("Sınav oluşturulurken bir hata oluştu.", err, { options, context: 'generateQuiz' });
      ErrorService.handleError(apiError, "Sınav Oluşturma");
      // Hata durumunda bile bir fallback quiz döndür, böylece UI tamamen kırılmaz.
      // Ancak, bu durumda bir hata mesajı da gösterilmeli.
      return this.createFallbackQuiz('error_fallback', options);
    }
  }

  /**
   * Sınav cevaplarını gönderir ve sonuçları alır
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async submitQuiz(payload: quiz.QuizSubmissionPayload) {
    const flowStepId = `submitQuiz_${payload.quizId}`;
    flowTracker.markStart(flowStepId);
    
    try {
      const apiPayload = adapterService.fromQuizSubmissionPayload(payload);
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
      const apiError = ErrorService.createApiError("Sınav yanıtları gönderilirken bir hata oluştu.", err, { payload, context: 'submitQuiz' });
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
      const apiError = ErrorService.createApiError("Sınav silinirken bir hata oluştu.", err, { quizId: id, context: 'deleteQuiz' });
      ErrorService.handleError(apiError, "Sınav Silme");
      throw apiError;
    }
  }
}

const quizService = new QuizApiService();
export default quizService;
