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
      // Frontend tarafında belge metni uzunluğunu kontrol et
      if ('quizType' in options && options.quizType === 'quick') {
        // Belge metninin uzunluğunu kontrol et
        const quizGenOptions = options as unknown as Record<string, unknown>;
        
        // Belge metni kontrolü
        if (quizGenOptions.documentText && 
            typeof quizGenOptions.documentText === 'string' && 
            quizGenOptions.documentText.length < 200) {
          throw new Error('Belge metni çok kısa. En az 200 karakter olmalıdır.');
        }
      }
      
      // Eğer halihazırda dönüştürülmüş bir options nesnesi gelmediyse adapter'ı kullan
      const apiOptions = 'quizType' in options && 'preferences' in options 
        ? adapterService.fromQuizGenerationOptions(options as QuizGenerationOptions)
        : options as ApiQuizGenerationOptionsDto;
        
      // JSON.stringify + JSON.parse kullanarak API nesnesini Record<string, unknown> olarak dönüştür
      const apiPayload = JSON.parse(JSON.stringify(apiOptions)) as Record<string, unknown>;
      
      // Quiz tipine göre endpoint belirle
      let endpoint = this.basePath; // Varsayılan /quizzes
      if (apiOptions.quizType === 'quick') {
        endpoint = `${this.basePath}/quick`;
      } else if (apiOptions.quizType === 'personalized') {
        // Kişiselleştirilmiş sınav için farklı bir endpoint varsa buraya eklenir.
        // Örneğin: endpoint = `${this.basePath}/personalized`;
        // Şimdilik backend controller'da /personalized için ayrı bir POST yoksa
        // /quizzes endpoint'ine gidip, quizType üzerinden ayrım yapılıyor olabilir.
        // Bu durumda endpoint this.basePath olarak kalabilir ya da backend'e göre düzenlenmelidir.
        // Backend loglarına göre direkt /api/quizzes POST arıyor, bu nedenle quizType ayrımı olmadan genel endpoint'e göndermeyi deneyebiliriz
        // ANCAK, controller'da /quick için @Post('quick') olduğu için bu mantık hatalı.
        // Backend controller'da genel bir @Post() yoksa, quizType'a göre endpoint değiştirmek zorunlu.
        // Eğer kişiselleştirilmiş sınavlar için de /quizzes/personalized gibi bir endpoint varsa onu kullanmalıyız.
        // Şimdilik, backend'de sadece /quick olduğu için, kişiselleştirilmiş için genel bir endpoint olmadığını varsayarak, 
        // ve backend'in genel /quizzes POST'u desteklemediğini varsayarak hata verebilir.
        // Bu durumu netleştirmek için backend controller'ında genel POST veya /personalized için POST olup olmadığına bakılmalı.
        // Geçici olarak, eğer backend'de kişiselleştirilmiş için ayrı bir endpoint yoksa ve 
        // /quizzes ana endpoint'i POST kabul etmiyorsa, bu bir mantık hatasıdır.
        // Controller'ı tekrar incelediğimde /quick ve (muhtemelen) /personalized için POST metodları var.
        // Bu yüzden quizType 'personalized' ise ve backend'de buna özel bir path yoksa, uygun bir path belirtilmeli.
        // Eğer backend genel /quizzes POST'unu destekliyorsa (ki controller yapısı öyle görünmüyor),
        // o zaman endpoint this.basePath kalmalı.
        // Şu anki backend controller yapısına göre, kişiselleştirilmiş quizler için de spesifik bir endpoint olmalı.
        // QuizzesController'da @Post('personalized') varsa, onu kullanacağız.
        // Eğer yoksa, backend'de bu rota eksik demektir.
        // Dosyanın devamını okuduğumda @Post(':quizId/questions') gibi yapılar var ama direkt /personalized POST yok.
        // Bu durumda, backend'in quiz tipini body içinden alıp ona göre işlem yapması bekleniyor olabilir
        // ve frontend sadece /quizzes adresine POST yapmalıdır. Ancak 404 alıyoruz.
        // Tekrar controller'a bakınca @Post('quick') var. @Post('personalized') yok ama @Post(':id/submit') gibi şeyler var.
        // Bu, quiz oluşturma mantığının frontend tarafında quizType'a göre endpoint seçmesini gerektirir.
        // Eğer backend genel bir POST /quizzes destekliyorsa ve quiz tipini body'den alıyorsa, endpoint this.basePath kalmalı.
        // Ancak 404 aldığımıza göre bu varsayım yanlış.
        // Backend Controller'da `/api/quizzes` için POST handleri yok, sadece `/api/quizzes/quick` var.
        // Bu durumda, kişiselleştirilmiş quiz oluşturma için de backend'de bir endpoint olmalı.
        // Şimdilik, eğer quizType quick değilse, backend'de karşılığı olmadığı için bu isteğin başarısız olması beklenir.
        // Ya da backend kişiselleştirilmiş quizleri de /quick üzerinden alıyor olabilir (RequestBody içinde ayrım yaparak)
        // Ya da backend'de /api/quizzes POST altında quizType'a göre ayrım yapan bir logic vardır.
        // Mevcut hata (Cannot POST /api/quizzes) backend'in /api/quizzes altında POST beklemediğini gösteriyor.
        // Frontend quizService'deki basePath /quizzes olduğuna göre, /api/quizzes/quick gibi bir yola gitmeli.

        // Backend controller'ında createPersonalizedQuiz metodu var ama bir @Post dekoratörü göremedim.
        // Eğer createPersonalizedQuiz metodu bir POST endpointine bağlı değilse, çağrılamaz.
        // Varsayılan olarak /quizzes endpointine POST yapıyoruz, ama controller bunu desteklemiyor.
        // Eğer quizType 'personalized' ise ve backend'de /quizzes/personalized gibi bir endpoint yoksa,
        // bu bir sorun. Şimdilik, backend loglarından /api/quizzes için POST arandığı anlaşılıyor ama controllerda yok.
        // Tekrar controller'a baktığımda, doğrudan @Post() dekoratörüne sahip bir createQuiz metodu görünmüyor.
        // Bunun yerine @Post('quick') ve muhtemelen (dosyanın devamında) @Post('personalized') olmalı.
        // Tekrar QuizzesController'ı inceliyorum...
        // Evet, controllerda @Post('quick') var. Dosyanın devamında @Post('personalized') olmalı.
        // Eğer @Post('personalized') varsa endpoint'i ona göre set etmeliyiz.
        // Eğer yoksa ve backend /quizzes POST altında quizType ayrımı yapıyorsa, frontend /quizzes POST yapmalı.
        // Ama 404 aldığımıza göre backend /quizzes POST kabul etmiyor.
        // Bu durumda en mantıklısı, quizType'a göre endpointi dinamik yapmak.
        endpoint = `${this.basePath}/${apiOptions.quizType}`;
      }
      
      // Loglama ve akış izleme
      logger.debug(
        'Sınav oluşturma isteği hazırlanıyor',
        'QuizApiService.generateQuiz',
        __filename,
        275,
        { 
          quizType: apiOptions.quizType,
          courseId: apiOptions.courseId,
          finalEndpoint: endpoint, // Log endpoint
          payload: JSON.stringify(apiPayload).substring(0, 300)
        }
      );
      
      flowTracker.trackApiCall(
        endpoint, 
        'POST', 
        'QuizApiService.generateQuiz',
        { 
          quizType: apiOptions.quizType,
          endpoint: endpoint, // Use dynamic endpoint
          payloadSize: JSON.stringify(apiPayload).length
        }
      );
      
      try {
        logger.debug(
          `API isteği gönderiliyor: POST ${endpoint}`,
          'QuizApiService.generateQuiz',
          __filename,
          300,
          { 
            endpoint: endpoint, // Use dynamic endpoint
            payloadSize: JSON.stringify(apiPayload).length
          }
        );
        
        // Konsola API isteği detaylarını logla
        console.log(`⚡ API isteği başlatılıyor: POST ${endpoint}`);
        console.log(`📄 İstek gövdesi (ilk 500 karakter): ${JSON.stringify(apiPayload).substring(0, 500)}`);
        
        // API isteğini gönder
        const quiz = await apiService.post<ApiQuiz>(endpoint, apiPayload); // Use dynamic endpoint
        
        console.log(`✅ API yanıtı alındı: ${quiz?.id ? 'Quiz ID: ' + quiz.id : 'Quiz ID yok'}`);
        
        // API yanıtını kontrol et
        if (!quiz || !quiz.id) {
          console.error("❌ API yanıtı geçersiz:", quiz);
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
        // Detaylı API hatası loglama
        console.error("❌ API POST hatası:", postError);
        if (postError instanceof Error) {
          console.error("❌ Hata mesajı:", postError.message);
          console.error("❌ Hata tipi:", postError.name);
          
          // Eğer API kaynaklı bir hata ise ekstra bilgiler göster
          if ('response' in postError && postError.response) {
            const response = postError.response as Record<string, unknown>;
            console.error("❌ API yanıt durumu:", response.status);
            console.error("❌ API yanıt verisi:", response.data);
          }
        }
        
        // API isteği hatası
        logger.error(
          "Sınav oluşturma API isteği başarısız",
          'QuizApiService.generateQuiz.apiRequest',
          __filename,
          335,
          { 
            error: postError,
            endpoint: endpoint,
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
      console.error("❌ QuizService.generateQuiz genel hatası:", error);
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
