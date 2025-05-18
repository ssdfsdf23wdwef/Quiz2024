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
import { QuizGenerationOptions, QuizSubmissionPayload, Quiz, Question } from "../types/quiz";
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
        { courseId }
      );

      const quizzes = await apiService.get<ApiQuiz[]>(endpoint, params);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getQuizzes', FlowCategory.API, 'QuizApiService');
      logger.debug(
        `Sınav listesi alındı: ${quizzes.length} sınav`,
        'QuizApiService.getQuizzes',
        { 
          count: quizzes.length, 
          courseId,
          duration 
        }
      );
      
      return quizzes;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getQuizzes', FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      logger.error(
        "Sınav listesi alınamadı",
        'QuizApiService.getQuizzes',
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
    const flowStepId = `getQuiz_${id}`;
    flowTracker.markStart(flowStepId);
    
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
        { id }
      );
      
      const quiz = await apiService.get<ApiQuiz>(endpoint);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService');
      logger.debug(
        `Sınav detayı alındı: ID=${id}`,
        'QuizApiService.getQuizById',
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
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      logger.error(
        `Sınav alınamadı: ID=${id}`,
        'QuizApiService.getQuizById',
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
    const flowStepId = `getQuizAnalysis_${id}`;
    flowTracker.markStart(flowStepId);
    
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
        { id }
      );
      
      const analysis = await apiService.get<ApiAnalysisResult>(endpoint);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService');
      logger.info(
        `Sınav analizi alındı: ID=${id}`,
        'QuizApiService.getQuizAnalysis',
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
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      logger.error(
        `Sınav analizi alınamadı: ID=${id}`,
        'QuizApiService.getQuizAnalysis',
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
        { courseId }
      );

      const failedQuestions = await apiService.get<ApiFailedQuestion[]>(endpoint, params);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getFailedQuestions', FlowCategory.API, 'QuizApiService');
      logger.debug(
        `Yanlış cevaplanan sorular alındı: ${failedQuestions.length} soru`,
        'QuizApiService.getFailedQuestions',
        { 
          count: failedQuestions.length, 
          courseId,
          duration 
        }
      );
      
      return failedQuestions;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getFailedQuestions', FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      logger.error(
        "Yanlış cevaplanan sorular alınamadı",
        'QuizApiService.getFailedQuestions',
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
  async generateQuiz(options: QuizGenerationOptions | ApiQuizGenerationOptionsDto): Promise<Quiz> {
    const flowStepId = 'generateQuiz';
    flowTracker.markStart(flowStepId);
    
    try {
      // API isteği için hazırlık
      const payload = this.prepareQuizPayload(options);

      // Backend'e istek yapılmadan önce son kontroller
      let quizEndpoint = `${this.basePath}`;
      if ('quizType' in options) {
        quizEndpoint = options.quizType === 'quick' ? `${this.basePath}/quick` : `${this.basePath}/personalized`;
      }
      
      console.log(`[QuizApiService] Sınav oluşturma isteği gönderiliyor...`, {
        quizType: 'quizType' in options ? options.quizType : 'unknown',
        hasDocumentText: 'documentText' in payload && !!payload.documentText,
        hasDocumentId: 'documentId' in payload && !!payload.documentId,
        hasTopics: 'selectedSubTopics' in payload && Array.isArray(payload.selectedSubTopics) && (payload.selectedSubTopics as any[]).length > 0
      });
              
      // API isteği gönder
      const response = await apiService.post<ApiQuiz | Record<string, unknown> | string>(
        quizEndpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 saniye timeout - büyük dokümanlar için
        },
      );

      console.log(`[QuizApiService] Sınav oluşturma yanıtı alındı:`, {
        status: response.status,
        hasData: !!response.data,
        dataType: typeof response.data,
        hasId: typeof response.data === 'object' && response.data !== null && 'id' in response.data ? !!(response.data as any).id : false,
        hasQuestions: typeof response.data === 'object' && response.data !== null && 'questions' in response.data ? !!(response.data as any).questions : false
      });
        
      // Yanıt yapısını kontrol et
      if (!response || response.status !== 200) {
        console.error('[QuizApiService] API yanıtı başarısız:', response?.status);
        throw new Error(`API yanıtı başarısız: ${response?.status}`);
      }
      
      if (!response.data) {
        console.error('[QuizApiService] API yanıtında veri yok');
        throw new Error('API yanıtında veri yok');
      }
      
      // Veri dönüşümü ve hata işleme
      let quizData: Quiz | null = null;
      
      try {
        // Çeşitli veri yapılarını kontrol et ve Typescript'i memnun etmek için dönüşümler yap
        const rawData = response.data;
        
        // Önce string kontrolü yap - bazen OpenAI JSON döndürmek yerine metin döndürebilir
        if (typeof rawData === 'string') {
          try {
            // Metni JSON olarak parse etmeyi dene
            const parsedData = JSON.parse(rawData) as Record<string, any>;
            console.log('[QuizApiService] String yanıt JSON olarak parse edildi');
            
            // İşlemeye devam et
            if (this.isValidQuiz(parsedData)) {
              quizData = parsedData as Quiz;
            } else if (parsedData.quiz && this.isValidQuiz(parsedData.quiz)) {
              quizData = parsedData.quiz as Quiz;
            } else {
              // Fallback
              quizData = this.createFallbackQuiz(parsedData);
            }
          } catch (parseError) {
            console.error('[QuizApiService] String yanıt JSON olarak parse edilemedi:', parseError);
            
            // Metin yanıttan sorular çıkarmayı dene
            const extractedQuestions = this.extractQuestionsFromText(rawData);
            if (extractedQuestions.length > 0) {
              // Boş bir quiz oluştur ve soruları ekle
              quizData = {
                id: `extracted_${Date.now()}`,
                title: 'Metin Yanıttan Oluşturulan Sınav',
                description: 'Metin yanıttan çıkarılan sorularla oluşturulmuş sınav',
                questions: extractedQuestions,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                type: 'quick',
                userId: '',
                documentId: '',
                metadata: { source: 'text_response' }
              } as Quiz; // Cast to Quiz type
            } else {
              // Yine de başarısız olduysa hata fırlat
              throw new Error('API yanıtı metin formatında ama içinden sorular çıkarılamadı');
            }
          }
        } else if (typeof rawData === 'object' && rawData !== null) {
          // Normal nesne işleme akışına devam et
          // 1. Direkt Quiz formatında mı?
          if (this.isValidQuiz(rawData)) {
            console.log('[QuizApiService] Yanıt doğrudan Quiz formatında');
            quizData = rawData as Quiz;
          } 
          // 2. Data içinde quiz var mı?
          else if ('data' in rawData && rawData.data && this.isValidQuiz(rawData.data)) {
            console.log('[QuizApiService] Quiz verisi response.data içinde bulundu');
            quizData = rawData.data as Quiz;
          }
          // 3. Data.quiz içinde mi?
          else if ('data' in rawData && rawData.data && 'quiz' in rawData.data && rawData.data.quiz && this.isValidQuiz(rawData.data.quiz)) {
            console.log('[QuizApiService] Quiz verisi response.data.quiz içinde bulundu');
            quizData = rawData.data.quiz as Quiz;
          }
          // 4. Yanıt içinde quiz field'ı var mı?
          else if ('quiz' in rawData && rawData.quiz && this.isValidQuiz(rawData.quiz)) {
            console.log('[QuizApiService] Quiz verisi response.quiz içinde bulundu');
            quizData = rawData.quiz as Quiz;
          } 
          // 5. Result içinde mi?
          else if ('result' in rawData && rawData.result && this.isValidQuiz(rawData.result)) {
            console.log('[QuizApiService] Quiz verisi response.result içinde bulundu');
            quizData = rawData.result as Quiz;
          }
          // 6. En son yanıtın kendisini kontrol et - id ve questions içeriyorsa kullan
          else if ('id' in rawData && ('questions' in rawData || 'rawQuestions' in rawData)) {
            console.log('[QuizApiService] Yanıtın kendisi Quiz benzeri bir yapıda, dönüştürülüyor');
            
            // Temel quiz yapısı oluştur
            quizData = {
              id: rawData.id as string,
              title: (rawData.title as string) || 'Hızlı Sınav',
              description: (rawData.description as string) || 'AI tarafından oluşturulan sınav',
              questions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'active',
              type: 'quick',
              userId: (rawData.userId as string) || '',
              documentId: (rawData.documentId as string) || '',
              metadata: rawData.metadata || {}
            } as Quiz; // Cast to Quiz type
            
            // Sorular varsa, ekle
            if (Array.isArray(rawData.questions)) {
              quizData.questions = rawData.questions;
            } else if ('rawQuestions' in rawData && Array.isArray(rawData.rawQuestions)) {
              quizData.questions = rawData.rawQuestions;
            }
          }
          // 7. Hiçbir şekilde uygun veri bulunamadı
          else {
            console.error('[QuizApiService] Yanıtta quiz verisi bulunamadı', rawData);
             // Fallback: API yanıtından bir quiz yaratmayı dene
            quizData = this.createFallbackQuiz(rawData);
            
            if (!quizData) {
              throw new Error('Geçersiz API yanıtı');
            }
          }
        } else {
           console.error('[QuizApiService] Beklenmeyen API yanıt formatı:', rawData);
           throw new Error('Beklenmeyen API yanıt formatı');
        }
      } catch (parseError) {
        console.error('[QuizApiService] Yanıt işleme hatası:', parseError);
        throw new Error(`API yanıtı geçersiz: ${parseError instanceof Error ? parseError.message : 'Bilinmeyen hata'}`);
      }
      
      if (!quizData) {
        console.error('[QuizApiService] Quiz verisi oluşturulamadı.');
        throw new Error('Quiz verisi oluşturulamadı.');
      }
        
      // Aynı şekilde questions array kontrolü yapalım
      if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        console.warn('[QuizApiService] Sorular bulunamadı veya boş dizi, alternatif kaynaklara bakılıyor');
        
        // Olası soru konumlarını kontrol et
        if (typeof response.data === 'object' && response.data !== null) {
            const dataObj = response.data as Record<string, any>;
            if (dataObj.quiz && Array.isArray(dataObj.quiz.questions) && dataObj.quiz.questions.length > 0) {
                console.log('[QuizApiService] Sorular quiz.questions içinde bulundu');
                quizData.questions = dataObj.quiz.questions;
            } else if (dataObj.data && Array.isArray(dataObj.data.questions) && dataObj.data.questions.length > 0) {
                console.log('[QuizApiService] Sorular data.questions içinde bulundu');
                quizData.questions = dataObj.data.questions;
            } else if (Array.isArray(dataObj.questions) && dataObj.questions.length > 0) {
                console.log('[QuizApiService] Sorular response.data.questions içinde bulundu');
                quizData.questions = dataObj.questions;
            }
        }
        
        // Yine de soru bulamadıysak, ham response'tan çıkarmayı dene
        if ((!quizData.questions || quizData.questions.length === 0) && typeof response.data === 'object' && response.data !== null) {
          console.warn('[QuizApiService] Hiçbir yerde soru bulunamadı, ham response kontrol ediliyor');
          
          const potentialQuestions = this.extractPotentialQuestions(response.data);
          if (potentialQuestions.length > 0) {
            console.log(`[QuizApiService] Ham yanıttan ${potentialQuestions.length} potansiyel soru çıkarıldı`);
            quizData.questions = potentialQuestions;
          } else {
            console.error('[QuizApiService] Hiçbir soru bulunamadı, muhtemelen API yanıtı beklenmeyen formatta');
          }
        }
        
        // Yine bulunamadıysa, varsayılan bir soru dizisi oluştur
        if (!quizData.questions || quizData.questions.length === 0) {
          console.warn('[QuizApiService] Hiçbir soru bulunamadı, varsayılan sorular oluşturuluyor');
          quizData.questions = this.createFallbackQuestions(5); // 5 varsayılan soru oluştur
        }
      }
      
      // Soruların geçerli yapıda olduğunu kontrol et ve validasyondan geçir
      if (quizData && quizData.questions) {
        quizData.questions = (quizData.questions || [])
          .filter(q => q && typeof q === 'object')
          .map((question: any, index: number) => { // Added any type for question temporarily
            try {
              // Temel doğrulamaları yap
              const validatedQuestion: Question = {
                id: question.id || `q${index + 1}_${Date.now()}`,
                questionText: question.questionText || `Soru ${index + 1}`,
                options: Array.isArray(question.options) && question.options.length > 0 
                  ? question.options 
                  : ["A) Seçenek 1", "B) Seçenek 2", "C) Seçenek 3", "D) Seçenek 4"],
                correctAnswer: question.correctAnswer || (question.options?.[0] || "A) Seçenek 1"),
                explanation: question.explanation || "Açıklama mevcut değil",
                subTopic: question.subTopicName || question.subTopic || "Genel", // Added subTopic as fallback
                normalizedSubTopic: question.normalizedSubTopicName || question.normalizedSubTopic || "genel", // Added normalizedSubTopic
                difficulty: question.difficulty || "medium",
                cognitiveDomain: question.cognitiveDomain || "remembering",
                questionType: question.questionType || "multiple_choice",
                status: question.status || "active",
                metadata: question.metadata || {},
              };
              
              return validatedQuestion;
            } catch (validationError) {
              console.error(`[QuizApiService] Soru #${index + 1} validasyonu başarısız:`, validationError);
              // Hatalı sorular yerine basit fallback soru döndür
              return this.createFallbackQuestion(index);
            }
          });
      }
      
      // Son kontrol: Quiz ID yoksa uyarı log ekle ama devam et
      if (!quizData.id) {
        console.warn('[QuizApiService] Quiz ID bulunamadı, geçici ID oluşturuluyor');
        quizData.id = `temp_${Date.now()}`;
      }
      
      // Quiz nesnesini döndür
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService');
      return quizData;
    } catch (error) {
      console.error('[QuizApiService] Sınav oluşturma hatası:', error);
      const errorMessage = error instanceof Error 
        ? `Sınav oluşturulamadı: ${error.message}`
        : 'Sınav oluşturulamadı: Bilinmeyen hata';
        
      // Hata ile sonlanan flow
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Quiz oluşturma isteği için payload hazırla
   */
  private prepareQuizPayload(options: QuizGenerationOptions | ApiQuizGenerationOptionsDto): Record<string, unknown> {
    // const flowStepId = 'prepareQuizPayload'; // generateQuiz içinden çağrıldığı için aynı ID'yi kullanabiliriz veya farklılaştırabiliriz.
    try {
      console.log('[QuizApiService] Quiz payload hazırlanıyor:', options);
      let payload: Record<string, unknown> = {};

      if ('quizType' in options) {
        // Frontend tipi bir QuizGenerationOptions nesnesi
        payload = {
          type: options.quizType,
        };
        
        if (options.preferences) {
          payload.preferences = options.preferences;
        } else {
          payload.preferences = {
            questionCount: 10,
            difficulty: 'mixed'
          };
        }
        
        if (options.documentText && typeof options.documentText === 'string' && options.documentText.trim().length > 0) {
          payload.documentText = options.documentText.trim();
        }
        
        if (options.documentId && typeof options.documentId === 'string' && options.documentId.trim().length > 0) {
          payload.documentId = options.documentId.trim();
        }
        
        if (options.selectedSubTopics && Array.isArray(options.selectedSubTopics) && options.selectedSubTopics.length > 0) {
          const validSubTopics = options.selectedSubTopics.filter(st => 
            st && typeof st === 'object' && 
            (st.subTopic || st.normalizedSubTopic)
          );
          if (validSubTopics.length > 0) {
            payload.selectedSubTopics = validSubTopics;
          } else {
            // Eğer hiçbir geçerli alt konu yoksa ve belge metni/ID de yoksa hata ver
            if (!payload.documentText && !payload.documentId) {
                 console.warn("[QuizApiService] Geçerli alt konu bulunamadı ve belge bilgisi de yok.");
            }
          }
        }
        
        if (options.personalizedQuizType && typeof options.personalizedQuizType === 'string') {
          payload.personalizedQuizType = options.personalizedQuizType;
        }
      } else {
        // Zaten bir API nesnesi - JSON formatı olarak döndür
        try {
          payload = JSON.parse(JSON.stringify(options)) as Record<string, unknown>;
        } catch (parseError) {
          console.error('[QuizApiService] API nesnesi JSON formatına dönüştürülemedi:', parseError);
          throw new Error('API nesnesi geçersiz format');
        }
      }

      console.log('[QuizApiService] Hazırlanan payload:', payload);
      
      // En az bir içerik kaynağı (belge metni, belge ID veya geçerli alt konular) olmalı
      const hasDocumentText = !!payload.documentText;
      const hasDocumentId = !!payload.documentId;
      const hasSelectedSubTopics = Array.isArray(payload.selectedSubTopics) && (payload.selectedSubTopics as any[]).length > 0;

      if (!hasDocumentText && !hasDocumentId && !hasSelectedSubTopics) {
        // flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', new Error("İçerik kaynağı eksik"));
        throw new Error("Sınav oluşturmak için belge metni, belge ID veya geçerli alt konular gereklidir");
      }
      
      return payload;
    } catch (error) {
      console.error('[QuizApiService] Payload hazırlama hatası:', error);
      // flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`Quiz payload hazırlanamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
  
  // Quiz nesnesi geçerli mi kontrol et
  private isValidQuiz(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // En azından ID ve questions dizisi olmalı
    const hasId = !!data.id;
    const hasQuestions = Array.isArray(data.questions);
    
    return hasId && hasQuestions;
  }
  
  // Ham API yanıtından potansiyel soruları çıkar
  private extractPotentialQuestions(data: any): Question[] {
    const questions: Question[] = [];
    
    try {
      // Object yapısını düzleştir ve potansiyel soruları bul
      const flattenedData: any[] = [];
      
      const flatten = (obj: any, path: string = '') => {
        if (!obj || typeof obj !== 'object') return;
        
        // Dizi ise her bir öğeyi dolaş
        if (Array.isArray(obj)) {
          // Doğrudan bir soru dizisi olabilir mi?
          if (obj.length > 0 && obj.every(item => 
            typeof item === 'object' && (item.questionText || item.question || item.text)
          )) {
            console.log(`[QuizApiService] Olası soru dizisi bulundu. Boyut: ${obj.length}`);
            flattenedData.push(...obj);
          } else {
            // Her bir öğeyi tek tek kontrol et
            obj.forEach((item, index) => {
              flatten(item, `${path}[${index}]`);
            });
          }
          return;
        }
        
        // Basit bir nesneyi düzleştirme kontrolü
        flattenedData.push(obj);
        
        // Alt objeler için rekursif olarak devam et
        Object.keys(obj).forEach(key => {
          if (obj[key] && typeof obj[key] === 'object') {
            flatten(obj[key], `${path}.${key}`);
          }
        });
      };
      
      // Veriyi düzleştir
      flatten(data);
      
      // Düzleştirilmiş verilerden soru-benzeri nesneleri bul
      for (const item of flattenedData) {
        // Bu bir soru olabilir mi kontrol et?
        if (typeof item !== 'object' || item === null) continue;
        
        // Soru metni
        const questionText = item.questionText || item.question || item.text || item.content;
        if (!questionText || typeof questionText !== 'string') continue;
        
        // Seçenekler
        let options: any = item.options || item.answers || item.choices;
        if (!options) {
          // Bazı API'ler A, B, C, D gibi seçenekleri ayrı alanlar olarak döndürebilir
          const possibleOptions: string[] = [];
          ['A', 'B', 'C', 'D'].forEach(letter => {
            if (item[letter] || item[`option${letter}`]) {
              possibleOptions.push(String(item[letter] || item[`option${letter}`]));
            }
          });
          if (possibleOptions.length > 0) {
            options = possibleOptions;
          }
        }
        
        // Eğer hala seçenek bulamadıysak devam et
        if (!options) continue;
        
        // Seçenekleri standartlaştır
        let standardOptions: string[] = [];
        if (Array.isArray(options)) {
          standardOptions = options.map(opt => typeof opt === 'string' ? opt : JSON.stringify(opt));
        } else if (typeof options === 'object') {
          // Bazı API'ler {A: "...", B: "..."} formatında döndürebilir
          standardOptions = Object.values(options).map(v => typeof v === 'string' ? String(v) : JSON.stringify(v));
        }
        
        // Seçenek yoksa atla
        if (standardOptions.length === 0) continue;
        
        // Doğru cevap
        let correctAnswer = item.correctAnswer || item.answer || item.correct;
        if (!correctAnswer && standardOptions.length > 0) {
          correctAnswer = standardOptions[0]; // Fallback: İlk seçenek
        }
        
        console.log(`[QuizApiService] Potansiyel soru bulundu: "${questionText.substring(0, 30)}..."`);
        
        // Geçerli bir soru nesnesi oluştur
        questions.push({
          id: item.id || `extracted_${questions.length + 1}_${Date.now()}`,
          questionText,
          options: standardOptions,
          correctAnswer: String(correctAnswer || standardOptions[0]),
          explanation: item.explanation || item.feedback || "",
          subTopic: item.subTopicName || item.topic || item.subject || "Genel",
          normalizedSubTopic: item.normalizedSubTopicName || "genel",
          difficulty: item.difficulty || "medium",
          cognitiveDomain: item.cognitiveDomain || "remembering",
          questionType: item.questionType || "multiple_choice",
          status: 'active',
          metadata: {}
        } as Question); // Cast to Question type
      }
      
      console.log(`[QuizApiService] Toplam ${questions.length} potansiyel soru çıkarıldı`);
      
      // Eğer hiç soru bulunamazsa metinsel yanıttan soru oluşturmayı dene
      if (questions.length === 0 && typeof data === 'string') {
        console.log('[QuizApiService] String yanıttan soru çıkarma deneniyor');
        return this.extractQuestionsFromText(data);
      }
      
    } catch (error) {
      console.error('[QuizApiService] Potansiyel soruları çıkarma hatası:', error);
    }
    
    return questions;
  }
  
  // Metinsel içerikten soru çıkarma
  private extractQuestionsFromText(text: string): Question[] {
    try {
      const questions: Question[] = [];
      
      // JSON olabilir mi?
      if (text.includes('{') && text.includes('}')) {
        try {
          // Markdown kod blokları içindeki JSON'ı çıkarmayı dene
          const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                           text.match(/\{[\s\S]*?\}/);
                           
          if (jsonMatch && jsonMatch[1]) {
            const jsonText = jsonMatch[1];
            const parsedData = JSON.parse(jsonText);
            
            // Standart JSON yapıları
            if (parsedData.questions && Array.isArray(parsedData.questions)) {
              console.log(`[QuizApiService] Metin içindeki JSON'dan ${parsedData.questions.length} soru bulundu`);
              return this.extractPotentialQuestions(parsedData.questions);
            }
            
            // Başka yapılar
            return this.extractPotentialQuestions(parsedData);
          }
        } catch (jsonError) {
          console.warn('[QuizApiService] JSON parse edilemedi, metin tabanlı çıkarma deneniyor', jsonError);
        }
      }
      
      // Metin tabanlı çıkarma - basit bir soru yapısı algılama
      // Soru 1, Soru 2 gibi başlıklar veya A), B) gibi seçenek belirteçleri arar
      const questionBlocks = text.split(/Soru \d+:|SORU \d+:|#\s*Soru \d+/);
      
      if (questionBlocks.length > 1) {
        console.log(`[QuizApiService] Metin bölündü, ${questionBlocks.length-1} olası soru bloğu`);
        
        // İlk bölüm genelde başlık olduğu için atla
        questionBlocks.slice(1).forEach((block, index) => {
          if (block.trim().length < 10) return; // Çok kısa blokları atla
          
          // Seçenekleri bul
          const optionsMatch = block.match(/[A-D]\).*?(?=[A-D]\)|$)/g) || 
                              block.match(/[A-D]\..*?(?=[A-D]\.|$)/g);
          
          if (!optionsMatch || optionsMatch.length < 2) return; // En az 2 seçenek olmalı
          
          const options = optionsMatch.map(opt => opt.trim());
          const questionText = block.substring(0, block.indexOf(options[0])).trim();
          
          if (questionText.length < 5) return; // Çok kısa soru metnini atla
          
          questions.push({
            id: `text_q${index + 1}_${Date.now()}`,
            questionText,
            options,
            correctAnswer: options[0], // Varsayılan olarak ilk seçenek
            explanation: "",
            subTopic: "Metin Çıkarılmış",
            normalizedSubTopic: "metin-cikarilmis",
            difficulty: "medium",
            cognitiveDomain: "remembering",
            questionType: "multiple_choice",
            status: 'active',
            metadata: {}
          } as Question); // Cast to Question type
        });
      }
      
      console.log(`[QuizApiService] Metinden ${questions.length} soru çıkarıldı`);
      return questions;
      
    } catch (error) {
      console.error('[QuizApiService] Metinden soru çıkarma hatası:', error);
      return [];
    }
  }
  
  // API'den veri alınamazsa fallback quiz oluştur
  private createFallbackQuiz(rawData: any): Quiz | null {
    try {
      console.log('[QuizApiService] Fallback quiz oluşturuluyor');
      
      // ID belirleme önceliği
      const id = typeof rawData === 'string' ? rawData : 
                (rawData.id || rawData._id || rawData.quizId || 
                 rawData.quiz?.id || rawData.data?.id || `fallback_${Date.now()}`);
      
      // Sorular varsa çıkarmaya çalış
      let questions: Question[] = [];
      
      if (typeof rawData === 'object' && rawData !== null) {
        // Sorular için farklı olası konumları kontrol et
        const questionsData = rawData.questions || rawData.quiz?.questions || 
                            rawData.data?.questions || rawData.result?.questions;
        
        if (Array.isArray(questionsData) && questionsData.length > 0) {
          const extractedQuestions = this.extractPotentialQuestions({ questions: questionsData });
          if (extractedQuestions.length > 0) {
            questions = extractedQuestions;
            console.log(`[QuizApiService] Ham veriden ${questions.length} soru çıkarıldı`);
          }
        } else {
          // Ham veriden soru çıkarmayı dene
          const extractedQuestions = this.extractPotentialQuestions(rawData);
          if (extractedQuestions.length > 0) {
            questions = extractedQuestions;
            console.log(`[QuizApiService] Alternatif yöntem ile ${questions.length} soru çıkarıldı`);
          }
        }
      } else if (typeof rawData === 'string' && rawData.length > 100) {
        // Metin tabanlı içerikten soru çıkarma
        questions = this.extractQuestionsFromText(rawData);
        console.log(`[QuizApiService] Metin tabanlı içerikten ${questions.length} soru çıkarıldı`);
      }
      
      // Hiç soru çıkarılamazsa fallback sorular oluştur
      if (questions.length === 0) {
        questions = this.createFallbackQuestions(5);
        console.log('[QuizApiService] Fallback sorular kullanıldı');
      }
      
      // Quiz nesnesini oluştur
      const fallbackQuiz: Quiz = {
        id,
        title: rawData.title || rawData.quiz?.title || 'Oluşturulan Sınav',
        description: rawData.description || rawData.quiz?.description || 'AI tarafından oluşturulan sınav',
        questions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        type: 'quick',
        userId: rawData.userId || rawData.quiz?.userId || '',
        documentId: rawData.documentId || rawData.quiz?.documentId || '',
        courseId: rawData.courseId || rawData.quiz?.courseId || undefined,
        learningTargetIds: rawData.learningTargetIds || rawData.quiz?.learningTargetIds || [],
        isCompleted: rawData.isCompleted || rawData.quiz?.isCompleted || false,
        score: rawData.score || rawData.quiz?.score || 0,
        timeLimit: rawData.timeLimit || rawData.quiz?.timeLimit || undefined,
        metadata: {
          isFallback: true,
          originalType: typeof rawData,
          responsePreview: typeof rawData === 'object' ? 
            JSON.stringify(rawData).slice(0, 500) : 
            String(rawData).slice(0, 500)
        }
      } as Quiz; // Cast to Quiz type
      
      return fallbackQuiz;
    } catch (error) {
      console.error('[QuizApiService] Fallback quiz oluşturma hatası:', error);
      return null;
    }
  }
  
  // Varsayılan sorular oluştur
  private createFallbackQuestions(count: number = 5): Question[] {
    const questions: Question[] = [];
    
    for (let i = 0; i < count; i++) {
      questions.push(this.createFallbackQuestion(i));
    }
    
    return questions;
  }
  
  // Tek bir varsayılan soru oluştur
  private createFallbackQuestion(index: number): Question {
    return {
      id: `fallback_q${index + 1}_${Date.now()}`,
      questionText: `Sistem tarafından oluşturulan soru ${index + 1}`,
      options: [
        "A) Birinci seçenek",
        "B) İkinci seçenek",
        "C) Üçüncü seçenek",
        "D) Dördüncü seçenek"
      ],
      correctAnswer: "A) Birinci seçenek",
      explanation: "Bu soru yedek sistemle oluşturulmuştur.",
      subTopic: "Genel",
      normalizedSubTopic: "genel",
      difficulty: "medium",
      cognitiveDomain: "remembering",
      questionType: "multiple_choice",
      status: "active",
      metadata: {
        isFallback: true
      }
    } as Question; // Cast to Question type
  }

  /**
   * Sınav cevaplarını gönderir ve sonuçları alır
   */
  @LogMethod('QuizApiService', FlowCategory.API)
  async submitQuiz(payload: QuizSubmissionPayload | ApiQuizSubmissionPayloadDto) {
    const flowStepId = `submitQuiz_${payload.quizId}`;
    flowTracker.markStart(flowStepId);
    
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
      const duration = flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService');
      logger.info(
        `Sınav yanıtları gönderildi: ID=${apiPayload.quizId}`,
        'QuizApiService.submitQuiz',
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
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      logger.error(
        `Sınav yanıtları gönderilemedi: ID=${payload.quizId}`,
        'QuizApiService.submitQuiz',
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
    const flowStepId = `deleteQuiz_${id}`;
    flowTracker.markStart(flowStepId);
    
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
        { id }
      );
      
      const response = await apiService.delete(endpoint);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService');
      logger.info(
        `Sınav silindi: ID=${id}`,
        'QuizApiService.deleteQuiz',
        { id, duration }
      );
      
      return response;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(flowStepId, FlowCategory.API, 'QuizApiService', error instanceof Error ? error : new Error(String(error)));
      logger.error(
        `Sınav silinemedi: ID=${id}`,
        'QuizApiService.deleteQuiz',
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
