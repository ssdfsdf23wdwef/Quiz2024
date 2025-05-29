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
  SubTopic,
  QuizResponseDto, // Eklendi
} from "../types/quiz.type";
import type { BaseApiResponse } from "../types/api.type"; // Eklendi
import axios, { AxiosResponse } from "axios";
import API_ENDPOINTS from "@/constants/api.constants";




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


  
  /**
   * Tüm sınavları getirir
   * @param courseId İsteğe bağlı ders ID'si
   * @returns Quiz dizisi
   */
  async getQuizzes(courseId?: string): Promise<Quiz[]> {

    
    try {
      const params: Record<string, string> = {};
      if (courseId) params.courseId = courseId;
      
      const response = await apiService.get<ApiQuiz[]>(this.basePath, params);
      const apiQuizzes = this.getResponseData(response) as ApiQuiz[];
      
      const quizzes = apiQuizzes.map(q => adapterService.toQuiz(q));
      return quizzes;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
     
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
  async getQuizById(id: string): Promise<Quiz | null> {
      
    try {
      const response = await apiService.get<ApiQuiz>(`${this.basePath}/${id}`);
      const apiQuiz = this.getResponseData(response) as ApiQuiz;
      console.log("[DEBUG] quiz.service.ts - getQuizById - Ham apiQuiz:", JSON.stringify(apiQuiz, null, 2));

      if (!this.isValidApiQuiz(apiQuiz)) {
        return this.createFallbackQuiz(`invalid_api_quiz_${id}`);
      }
      const quiz = adapterService.toQuiz(apiQuiz);
      console.log("[DEBUG] quiz.service.ts - getQuizById - Adapter sonrası quiz:", JSON.stringify(quiz, null, 2));
      return quiz;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Hata durumunda fallback quiz oluştur
      const fallbackQuiz = this.createFallbackQuiz(`error_fallback_${id}`);
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
  async getQuizAnalysis(quizId: string): Promise<QuizAnalysisResponse> {
    try {
      return await this.apiService.safeRequest(
        // Ana API isteği
        async () => {
          try {
            // Corrected endpoint: remove leading slash as apiService prepends /api
            const result = await this.apiService.get<QuizAnalysisResponse>(`quizzes/analysis/${quizId}`);
            console.log('[QuizApiService.getQuizAnalysis] API yanıtı (quizzes/analysis):', result);
            return result as QuizAnalysisResponse;
          } catch (err) {
            // 404 hatasında alternatif endpoint'i dene
            if (axios.isAxiosError(err) && err.response?.status === 404) {
              console.log('[QuizApiService.getQuizAnalysis] Alternatif endpoint deneniyor (quiz-analysis)');
              // Corrected fallback endpoint: remove leading slash
              const result = await this.apiService.get<QuizAnalysisResponse>(`quiz-analysis/${quizId}`);
              console.log('[QuizApiService.getQuizAnalysis] API yanıtı (quiz-analysis):', result);
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
  async getFailedQuestions(courseId?: string) {
   
    
    try {
      const params: Record<string, string> = {};
      if (courseId) params.courseId = courseId;
      const response = await apiService.get<ApiFailedQuestion[]>(this.failedQuestionsPath, params);
      const failedQuestions = this.getResponseData(response) as ApiFailedQuestion[];
   
      return failedQuestions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
  async generateQuiz(options: QuizGenerationOptions): Promise<Quiz> {
 

    try {
      let endpoint: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any; 

      // Extract subTopicIds consistently
      let subTopicIds: string[] = [];
      if (options.selectedSubTopics && options.selectedSubTopics.length > 0) {
        const firstElement = options.selectedSubTopics[0];
        if (typeof firstElement === 'object' && firstElement !== null && 'id' in firstElement && typeof firstElement.id === 'string') {
          subTopicIds = (options.selectedSubTopics as SubTopic[])
            .map(st => st.id)
            .filter(id => typeof id === 'string') as string[];
        } else if (typeof firstElement === 'string') {
          subTopicIds = options.selectedSubTopics as string[];
        }
      }

      // Client-side validation for subTopics for relevant quiz types
      const relevantTypesForSubtopicValidation: QuizType[] = ['personalized', 'general', 'topic_specific'];
      if (relevantTypesForSubtopicValidation.includes(options.quizType) || (options.quizType as string) === 'quick') { // Type assertion added to allow 'quick' string comparison
        if (!subTopicIds || subTopicIds.length === 0) {
          const clientError = ErrorService.createApiError(
            'Sınav Oluşturma Hatası',
            'Sınav oluşturmak için en az bir alt konu seçilmelidir. Lütfen Konu Seçimi adımında alt konu seçtiğinizden emin olun.',
            { 
              original: { 
                error: new Error(`Client-side validation: subTopics array is empty for ${options.quizType} quiz type.`),
                context: 'generateQuiz', 
                options 
              },
              // isClientSide: true // Removed to avoid type error, ApiErrorOptions needs update if this is desired
            }
          );
          ErrorService.handleError(clientError, 'Sınav Oluşturma');
          throw clientError;
        }
      }

      if (options.quizType === 'personalized') {
        endpoint = API_ENDPOINTS.GENERATE_PERSONALIZED_QUIZ;
        
        // Backend zorunlu alanlar için kontrol
        const courseId = options.courseId || 'default-course-id';
        
        // subTopics dizisi boşsa, varsayılan bir alt konu ekle
        let finalSubTopics = [...subTopicIds];
        if (!finalSubTopics.length) {
          finalSubTopics = ['default-topic-1', 'default-topic-2'];
          console.warn('[QuizApiService.generateQuiz] subTopics dizisi boş, varsayılan konular ekleniyor');
        }
        
        payload = {
          title: options.title || 'Kişiselleştirilmiş Sınav',
          description: options.description || 'Otomatik oluşturulan kişiselleştirilmiş sınav',
          userId: options.userId || 'current-user',
          courseId: courseId, // Boş olmamasını sağlıyoruz
          documentId: options.documentId, // Belge ID'sini ekliyoruz
          documentText: options.documentText || '', // Belge metni boşsa boş string gönder
          personalizedQuizType: options.personalizedQuizType || 'comprehensive',
          subTopics: finalSubTopics, // Boş olmamasını sağlıyoruz
          questionCount: options.preferences.questionCount || 10,
          difficulty: options.preferences.difficulty || 'mixed',
          timeLimit: options.preferences.timeLimit,
          prioritizeWeakTopics: options.preferences.prioritizeWeakAndMediumTopics || false, 
        };
        
        // Hata ayıklama: Payload içeriğini detaylı logla
        console.log("[QuizApiService.generateQuiz] Kişiselleştirilmiş sınav isteği detayları:", {
          endpoint,
          documentId: options.documentId,
          courseId: courseId,
          subTopics: finalSubTopics,
          subTopicsCount: finalSubTopics.length,
          personalizedQuizType: options.personalizedQuizType
        });
        
        // Son kontrol - backend'in zorunlu tuttuğu alanlar mevcut mu?
        if (!courseId || !finalSubTopics.length) {
          console.error('[QuizApiService.generateQuiz] HATA: Zorunlu alanlar eksik', { courseId, subTopicsCount: finalSubTopics.length });
        } else {
          console.log('[QuizApiService.generateQuiz] İstek formatı doğrulandı, zorunlu alanlar mevcut');
        }
      } else { // Handles 'quick', 'general', 'topic_specific' 
        endpoint = API_ENDPOINTS.GENERATE_QUICK_QUIZ; // All non-personalized go to quick endpoint as per previous logic
        payload = {
          title: options.title,
          description: options.description,
          documentId: options.documentId,
          documentText: options.documentText, 
          courseId: options.courseId,
          subTopics: subTopicIds, 
          questionCount: options.preferences.questionCount,
          difficulty: options.preferences.difficulty,
          timeLimit: options.preferences.timeLimit,
          prioritizeWeakTopics: options.preferences.prioritizeWeakAndMediumTopics, 
        };
      }

      
      // API isteğini gönder
      const response = await apiService.post<QuizResponseDto>(endpoint, payload);
      
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
            return mappedQuiz;
          } catch (altMapError) {
            console.error("[QuizApiService.generateQuiz] Alternatif format dönüştürme hatası:", altMapError);
            // Fallback'e devam et
          }
        }
        
        // Eğer hiçbir şekilde uygun bir yapı bulunamazsa varsayılan oluştur
        console.warn("[QuizApiService.generateQuiz] Geçerli bir sınav formatı bulunamadı, varsayılan oluşturuldu");
        const fallbackQuiz = this.createFallbackQuiz("format_fallback", options);
        return fallbackQuiz;
      }
      
      try {
        // Normal işleme deneyin
        console.log("[QuizApiService.generateQuiz] Standart yanıt işleniyor. ID:", responseData.id);
        const mappedQuiz = this.mapResponseToQuiz(responseData as unknown as QuizResponseDto);
        console.log("[QuizApiService.generateQuiz] Quiz başarıyla oluşturuldu:", mappedQuiz.id);
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
        return fallbackQuiz;
      }
    } catch (error) {
      console.error(`[QuizApiService.generateQuiz] HATA OLUŞTU: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[QuizApiService.generateQuiz] Tam hata detayı:`, error);

      const errorMessageString = error instanceof Error ? error.message : String(error);
      // TODO: Confirm the exact error message from backend or use a more robust error identification (e.g., error code)
      const isInvalidJsonResponse = errorMessageString.includes("AI response is not valid JSON");

      if (isInvalidJsonResponse) {
        console.warn('[QuizApiService.generateQuiz] AI response is not valid JSON detected.');
        
        // Only retry for personalized quizzes with multiple subtopics that can be reduced
        if (options.quizType === 'personalized' && Array.isArray(options.selectedSubTopics) && options.selectedSubTopics.length > 1) {
          console.log(`[QuizApiService.generateQuiz] Attempting to regenerate quiz with ${options.selectedSubTopics.length - 1} subtopics.`);
          const newSelectedSubTopics = options.selectedSubTopics.slice(0, -1);
          const newOptions: QuizGenerationOptions = { 
            ...options, 
            selectedSubTopics: newSelectedSubTopics,
          }; 
          
          try {
            console.log('[QuizApiService.generateQuiz] Retrying quiz generation with new options:', newOptions);
            return await this.generateQuiz(newOptions); 
          } catch (retryError) {
            const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
            console.error(`[QuizApiService.generateQuiz] Retry with fewer subtopics failed: ${retryErrorMessage}`, retryError);
            const fallbackQuiz = this.createFallbackQuiz("retry_json_fallback", options);
            return fallbackQuiz;
          }
        } else {
          let reason = "Cannot reduce subtopics or not a personalized quiz with multiple subtopics.";
          if (options.quizType !== 'personalized') reason = "Not a personalized quiz, retry not applicable.";
          else if (!options.selectedSubTopics || !Array.isArray(options.selectedSubTopics) || options.selectedSubTopics.length <= 1) reason = "Not enough subtopics to reduce for retry.";
          
          console.warn(`[QuizApiService.generateQuiz] ${reason} Generating fallback quiz due to invalid JSON.`);
          const fallbackQuiz = this.createFallbackQuiz("invalid_json_fallback", options);
          return fallbackQuiz;
        }
      } else if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data as { message?: string; [key: string]: any } | undefined;
      
        console.error(`[QuizApiService.generateQuiz] Axios hatası: Status=${statusCode}, Data=`, responseData);
        
        let apiError;
        const backendMessage = responseData?.message;
        if (statusCode === 400 && backendMessage) {
          apiError = ErrorService.createApiError(backendMessage, statusCode, responseData);
        } else {
          const defaultMessage = `Sınav oluşturulurken bir sunucu hatası oluştu (Status: ${statusCode})`;
          apiError = ErrorService.createApiError(
            backendMessage || defaultMessage, 
            statusCode,
            responseData
          );
        }
        throw apiError;
        
      } else {
        console.error('[QuizApiService.generateQuiz] Genel veya bilinmeyen bir hata oluştu.', error);
        const genericError = ErrorService.createApiError(
          errorMessageString || 'Sınav oluşturulurken beklenmeyen bir hata oluştu.',
          undefined, 
          { originalError: error } 
        );
        throw genericError;
      }
    }
  }

  /**
   * Sınav cevaplarını gönderir ve sonuçları alır
   * Backend ile iletişimde yaşanabilecek sorunlara karşı güçlü hata yakalama ve geri dönüş mekanizmaları içerir
   */
  async submitQuiz(payload: QuizSubmissionPayload): Promise<QuizSubmissionResponse> {
    // Quiz ID kontrolü - geçersiz ID varsa yerel sonuca dön
    if (!payload.quizId || payload.quizId === 'undefined') {
      console.warn('[QuizApiService.submitQuiz] Geçersiz Quiz ID:', payload.quizId);
      ErrorService.showToast("Sınav ID'si bulunamadı, sonuçlar yerel olarak işlenecek", "warning", "Sınav Gönderimi");
      return this.createLocalQuizSubmission(payload);
    }

    // Kullanıcı cevapları kontrolü
    if (!payload.userAnswers || Object.keys(payload.userAnswers).length === 0) {
      console.warn('[QuizApiService.submitQuiz] Kullanıcı cevapları eksik veya boş:', payload.userAnswers);
      ErrorService.showToast("Sınav cevapları bulunamadı", "error", "Sınav Gönderimi");
      return this.createLocalQuizSubmission(payload); 
    }

    

    try {
      return await this.apiService.safeRequest(
        // Ana API isteği - formatı backend ile uyumlu hale getiriyoruz
        async () => {
          try {
            // Önce localStorage'dan quiz verilerini al
            const storedQuiz = this.getQuizFromLocalStorage(payload.quizId);
            
            if (!storedQuiz) {
              console.warn('[QuizApiService.submitQuiz] LocalStorage\'da quiz bulunamadı, minimum veri ile devam ediliyor');
              ErrorService.showToast("Sınav verileri eksik, basit analiz yapılacak", "warning", "Sınav Gönderimi");
              throw new Error('Quiz bulunamadı');
            }
            
            // Sorularda normalizedSubTopic ve subTopic kontrolü yap
            const preparedQuestions = this.prepareQuestionsForSubmission(
              storedQuiz.questions || [], 
              payload.userAnswers
            );

            // Hazırlanan soruları göster
            console.log('[QuizApiService.submitQuiz] Hazırlanan sorular:', preparedQuestions);
            
            // Güncellenen sorularla quiz nesnesini güncelle
            const updatedQuiz = {
              ...storedQuiz,
              questions: preparedQuestions
            };
            
            // Adapter service kullanarak backend formatına dönüştür
            const formattedPayload = adapterService.fromQuizSubmissionPayload(
              updatedQuiz,
              payload.userAnswers,
              payload.elapsedTime
            );
            
            // Backend validation hatasını önlemek için, DTO şemayla uyumsuz olan alanları temizle
            // SubmitQuizDto'ya uymayan alanların kaldırılması
            const payloadForSubmission = formattedPayload as unknown as Record<string, unknown>;
            delete payloadForSubmission.quizId;
            delete payloadForSubmission.title;
            delete payloadForSubmission.timestamp;
            delete payloadForSubmission.score;
            delete payloadForSubmission.status;
            
            // String olmayan değerleri düzelt
            if (Array.isArray(payloadForSubmission.questions)) {
              (payloadForSubmission.questions as Record<string, unknown>[]).forEach(q => {
                // Alanları temizle
                delete q.questionType;
                delete q.status;
                
                // Alt konu bilgilerini string olarak kontrol et
                if (q.subTopic === null || q.subTopic === undefined) {
                  q.subTopic = "Genel Konu";
                }
                
                if (q.normalizedSubTopic === null || q.normalizedSubTopic === undefined) {
                  q.normalizedSubTopic = "genel-konu";
                }
                
                // String olmayan değerleri düzelt
                if (typeof q.subTopic !== 'string') {
                  q.subTopic = String(q.subTopic);
                }
                
                if (typeof q.normalizedSubTopic !== 'string') {
                  q.normalizedSubTopic = String(q.normalizedSubTopic);
                }
                
                // Zorluk seviyesi kontrolü
                if (!q.difficulty || typeof q.difficulty !== 'string') {
                  q.difficulty = 'medium';
                }
              });
            } else {
              console.warn('[QuizApiService.submitQuiz] questions dizisi bulunamadı veya dizi değil');
              payloadForSubmission.questions = []; // Boş dizi ata
            }
            
            console.log('[QuizApiService.submitQuiz] Backend\'e gönderilecek formatlı veri (adapter ile):', payloadForSubmission);
            
            // Formatlı veriyi backend'e gönder
            try {
              // Doğru endpoint formatını kullan
              const endpoint = `/quizzes/${payload.quizId}/submit`;
              console.log(`[QuizApiService.submitQuiz] API isteği gönderiliyor: ${endpoint}`);
              
              const result = await this.apiService.post<QuizSubmissionResponse>(endpoint, payloadForSubmission);
              console.log('[QuizApiService.submitQuiz] API yanıtı başarılı:', result);
              return result as QuizSubmissionResponse;
            } catch (error) {
              console.error('[QuizApiService.submitQuiz] API hatası:', error);
              
              // Hata detaylarını logla
              if (axios.isAxiosError(error)) {
                console.error('[QuizApiService.submitQuiz] Status:', error.response?.status);
                console.error('[QuizApiService.submitQuiz] Response data:', error.response?.data);
                
                // Detaylı hata mesajı oluştur
                const errorMessage = error.response?.data?.message || error.message || 'API hatası';
                const statusCode = error.response?.status || 0;
                
                // Hata durumunda kullanıcıya bilgi ver
                ErrorService.showToast(
                  `Sınav sonuçları gönderilemedi: ${errorMessage}`, 
                  "error", 
                  "Sunucu Hatası"
                );
                
              
                
                // Backend hatası durumunda yerel sonuca geçiş yap
                console.warn(`[QuizApiService.submitQuiz] Backend hatası, lokalde sonuç oluşturuluyor`);
                return this.createLocalQuizSubmission(payload);
              }
              
              // Diğer hatalar için tekrar fırlat
              throw error;
            }
          } catch (error) {
            console.error('[QuizApiService.submitQuiz] İç blok hatası:', error);
            // Kullanıcıya genel hata mesajı göster
            ErrorService.showToast(
              "Sınav sonuçları işlenirken bir hata oluştu, yerel sonuçlar kullanılacak", 
              "warning", 
              "Sınav Gönderimi"
            );
            
            // İç hatalar için de yerel sonucu dön
            return this.createLocalQuizSubmission(payload);
          }
        },
        // Fallback - yerel depolama ile sonuç oluştur
        () => {
          console.log('[QuizApiService.submitQuiz] Fallback çözüm uygulanıyor');
          ErrorService.showToast("Bağlantı sorunu, yerel analiz kullanılıyor", "info", "Sınav Gönderimi");
          return this.createLocalQuizSubmission(payload);
        }
      );
    } catch (error) {
      // Herhangi bir hata durumunda, yerel bir sonuç oluştur
      console.error('[QuizApiService.submitQuiz] En dış blok hatası:', error);
      ErrorService.showToast("Beklenmeyen bir hata oluştu, yerel analiz kullanılıyor", "error", "Sınav Gönderimi");
      return this.createLocalQuizSubmission(payload);
    }
  }
  
  /**
   * Soruları backend'e gönderilecek formatta hazırlar
   * Backend'in validasyon hatalarını önlemek için tüm gerekli alan kontrolleri ve düzeltmeleri yapar
   * Özellikle subTopic ve normalizedSubTopic alanlarının string olduğundan emin olur (toLowerCase hatalarını önler)
   */
  private prepareQuestionsForSubmission(questions: Question[], userAnswers: Record<string, string>): Question[] {
    const startTime = Date.now();
 
    
    // Boş array kontrolü
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn('[QuizApiService.prepareQuestionsForSubmission] Sorular bulunamadı veya geçersiz format, varsayılan sorular oluşturuluyor');
      // Kullanıcı yanıtlarından soru ID'lerini al ve varsayılan sorular oluştur
      const fallbackQuestions = Object.keys(userAnswers || {}).map((qId, index) => ({
        id: qId,
        questionText: `Soru ${index + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: userAnswers[qId] || 'A', // Kullanıcı yanıtını doğru kabul et
        difficulty: 'medium' as DifficultyLevel,
        questionType: 'multiple_choice' as QuestionType,
        status: 'active' as QuestionStatus,
        subTopic: 'Genel Konu',
        normalizedSubTopic: 'genel-konu',
        explanation: '',
        metadata: { generatedForSubmission: true, timestamp: new Date().toISOString() }
      }));
      
 
      
      return fallbackQuestions;
    }
    
    // Soruları kopyala ve eksik alanları tamamla
    const preparedQuestions = questions.map((q, index) => {
      try {
        // Derin kopya oluştur (nesne referansını korumak için, null-safe)
        const question: Question = q ? JSON.parse(JSON.stringify(q)) : {} as Question;
        
        // ID kontrolü - her soru için unique ID olmalı
        if (!question.id) {
          question.id = `q_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}`;
          console.log(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} için ID oluşturuldu: ${question.id}`);
        }
        
        // Soru metni kontrolü
        if (!question.questionText || typeof question.questionText !== 'string') {
          question.questionText = `Soru ${index + 1}`;
          console.log(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} için metin oluşturuldu`);
        }
        
        // Alt konu bilgisi kontrolü - string olmasını garantile
        if (!question.subTopic || typeof question.subTopic !== 'string') {
          question.subTopic = 'Genel Konu';
          console.log(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} için subTopic oluşturuldu`);
        }
        
        // normalizedSubTopic kontrolü ve oluşturma
        if (!question.normalizedSubTopic || typeof question.normalizedSubTopic !== 'string') {
          try {
            // subTopic string olarak garanti edildiği için güvenle toLowerCase() kullanabiliriz
            question.normalizedSubTopic = question.subTopic
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9\-]/g, '');
            console.log(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} için normalizedSubTopic oluşturuldu: ${question.normalizedSubTopic}`);
          } catch (error) {
            // Herhangi bir hata durumunda varsayılan değer kullan
            console.error(`[QuizApiService.prepareQuestionsForSubmission] normalizedSubTopic oluştururken hata:`, error);
            question.normalizedSubTopic = 'genel-konu';
          }
        }
        
        // Alt konu değerlerinin string tipinde olduğundan emin ol
        if (typeof question.subTopic !== 'string') {
          question.subTopic = String(question.subTopic || 'Genel Konu');
        }
        
        if (typeof question.normalizedSubTopic !== 'string') {
          question.normalizedSubTopic = String(question.normalizedSubTopic || 'genel-konu');
        }
        
        // Zorluk seviyesi kontrolü
        if (!question.difficulty || typeof question.difficulty !== 'string' || 
            !['easy', 'medium', 'hard', 'mixed'].includes(question.difficulty)) {
          question.difficulty = 'medium' as DifficultyLevel;
        }
        
        // Soru tipi kontrolü
        if (!question.questionType || typeof question.questionType !== 'string') {
          question.questionType = 'multiple_choice' as QuestionType;
        }
        
        // Status kontrolü
        if (!question.status || typeof question.status !== 'string') {
          question.status = 'active' as QuestionStatus;
        }
        
        // Options kontrolü - dizi olduğundan ve en az 2 seçenek içerdiğinden emin ol
        if (!Array.isArray(question.options) || question.options.length < 2) {
          question.options = ['A) Seçenek A', 'B) Seçenek B', 'C) Seçenek C', 'D) Seçenek D'];
          console.log(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} için seçenekler oluşturuldu`);
        }
        
        // correctAnswer kontrolü
        if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
          question.correctAnswer = question.options[0];
          console.log(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} için doğru cevap ayarlandı: ${question.correctAnswer}`);
        }
        
        // Açıklama alanı kontrolü
        if (!question.explanation || typeof question.explanation !== 'string') {
          question.explanation = '';
        }
        
        return question;
      } catch (error) {
        console.error(`[QuizApiService.prepareQuestionsForSubmission] Soru #${index} işlenirken hata:`, error);
        
        // Hatada bile varsayılan bir soru döndür - sağlamlık için
        return {
          id: `error_q_${index}_${Date.now()}`,
          questionText: `Hata Oluşan Soru ${index + 1}`,
          options: ['A) Seçenek A', 'B) Seçenek B', 'C) Seçenek C', 'D) Seçenek D'],
          correctAnswer: 'A) Seçenek A',
          difficulty: 'medium' as DifficultyLevel,
          questionType: 'multiple_choice' as QuestionType,
          status: 'active' as QuestionStatus,
          subTopic: 'Genel Konu',
          normalizedSubTopic: 'genel-konu',
          explanation: '',
          metadata: { error: true, message: String(error) }
        };
      }
    });
    
    const elapsedTime = Date.now() - startTime;

    return preparedQuestions;
  }

  /**
   * Sınavı siler
   * @param id Quiz ID
   */
  async deleteQuiz(id: string) {

    
    try {
      await apiService.delete(`${this.basePath}/${id}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    
    
    return analysis;
  }
  
  private getQuizFromLocalStorage(quizId: string): Quiz | null {
    try {
      const storedQuizJson = localStorage.getItem(`quizResult_${quizId}`);
      if (!storedQuizJson) return null;
      return JSON.parse(storedQuizJson);
    } catch (error) {
      return null;
    }
  }
}

const quizService = new QuizApiService();
export default quizService;
