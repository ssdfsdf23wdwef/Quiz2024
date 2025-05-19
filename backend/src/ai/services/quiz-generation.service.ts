import { Injectable, BadRequestException } from '@nestjs/common';
import { AIProviderService } from '../providers/ai-provider.service';
import {
  QuizQuestion,
  QuizGenerationOptions,
  QuizMetadata,
} from '../interfaces';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { PromptManagerService } from './prompt-manager.service';
import { QuizValidationService } from './quiz-validation.service';
import pRetry from 'p-retry';

/**
 * Quiz soruları oluşturan servis
 */
@Injectable()
export class QuizGenerationService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  private readonly RETRY_OPTIONS = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 15000,
    onFailedAttempt: (error: any) => {
      const attemptNumber = error.attemptNumber || 1;
      const retriesLeft = error.retriesLeft || 0;
      const errorTraceId = `retry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      this.logger.warn(
        `[${errorTraceId}] AI çağrısı ${attemptNumber}. denemede başarısız oldu. ${retriesLeft} deneme kaldı. Hata: ${error.message}`,
        'QuizGenerationService.retry',
      );
    },
  };

  constructor(
    private readonly aiProviderService: AIProviderService,
    private readonly promptManager: PromptManagerService,
    private readonly quizValidation: QuizValidationService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  /**
   * Quiz soruları oluşturur
   * @param options Quiz oluşturma seçenekleri
   * @returns Quiz soruları dizisi
   */
  async generateQuizQuestions(
    options: QuizGenerationOptions,
  ): Promise<QuizQuestion[]> {
    const traceId =
      options.traceId ||
      `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Metadata oluştur - aynı tipte alanları direkt aktarıp diğerlerini ayrıca ekle
    const metadata: QuizMetadata = {
      traceId,
      difficulty: options.difficulty,
      documentText: options.documentText,
      subTopics: options.subTopics,
      questionCount: options.questionCount,
      userId: options.userId,
      documentId: options.documentId,
      courseId: options.courseId,
      personalizedQuizType: options.personalizedQuizType,
      personalizationContext: options.personalizationContext,
    };

    // Sınav başlangıcını logla
    this.logger.logExamStart(options.userId || 'anon', 'standart', {
      traceId,
      subTopics: options.subTopics || [],
      questionCount: options.questionCount || 5,
      difficulty: options.difficulty || 'medium',
      documentId: options.documentId || null,
    });

    try {
      // Prompu hazırla
      const promptText = await this.prepareQuizPrompt(options, metadata);
      this.logger.logExamStage(options.userId || 'anon', 'Prompt hazırlandı', {
        traceId,
        promptLength: promptText.length,
      });

      // AI yanıtı oluştur
      const aiResponseText = await this.generateAIContent(promptText, metadata);
      this.logger.logExamStage(options.userId || 'anon', 'AI yanıtı alındı', {
        traceId,
        responseLength: aiResponseText.length,
      });

      // AI yanıtını işle
      const questions = this.processAIResponse(aiResponseText, metadata);

      // Sınav oluşturmayı tamamladığını logla
      this.logger.logExamCompletion(
        options.userId || 'anon',
        'quiz_' + traceId,
        {
          traceId,
          questionsCount: questions.length,
          startTime: Date.now() - 60000, // Yaklaşık bir başlangıç zamanı
        },
      );

      return questions;
    } catch (error) {
      // Hata durumunu logla
      this.logger.error(
        `[${traceId}] Quiz oluşturma hatası: ${error.message}`,
        'QuizGenerationService.generateQuizQuestions',
        undefined,
        error,
      );

      this.logger.logExamError(options.userId || 'anon', error, {
        traceId,
        options,
      });

      // Hatayı yeniden fırlat, önceki fallback mantığını kaldırdık
      throw error;
    }
  }

  /**
   * Quiz prompt'unu hazırlar
   * @param options Quiz oluşturma seçenekleri
   * @param metadata Metadata bilgileri
   * @returns Hazırlanmış prompt
   */
  private async prepareQuizPrompt(
    options: QuizGenerationOptions,
    metadata: QuizMetadata,
  ): Promise<string> {
    const { traceId } = metadata;

    this.flowTracker.trackStep(
      'Quiz promptu hazırlanıyor',
      'QuizGenerationService',
    );

    // 1. Base prompt'u yükle
    const basePrompt = await this.promptManager.loadPrompt(
      'generate-quiz-tr.txt',
    );
    if (!basePrompt) {
      this.logger.error(
        `[${traceId}] Temel quiz prompt'u yüklenemedi. Fallback kullanılacak.`,
        'QuizGenerationService.prepareQuizPrompt',
      );
      return this.promptManager.getFallbackQuizPrompt();
    }

    // 2. Konuları formatla
    const topicsText = this.formatTopics(options.subTopics);

    // 3. Değişkenleri doldur
    const variables: Record<string, string> = {
      TOPICS: topicsText,
      COUNT: options.questionCount.toString(),
      DIFFICULTY: options.difficulty || 'medium',
    };

    // 4. Belge metni varsa prompt'a ekle
    if (options.documentText) {
      variables['DOCUMENT_TEXT'] = options.documentText;
      this.logger.debug(
        `[${traceId}] Quiz promptuna belge metni ekleniyor (${options.documentText.length} karakter)`,
        'QuizGenerationService.prepareQuizPrompt',
      );
    }

    // 5. Kişiselleştirme bağlamı varsa prompt'a ekle
    if (options.personalizationContext) {
      variables['PERSONALIZATION_CONTEXT'] = options.personalizationContext;
      this.logger.debug(
        `[${traceId}] Quiz promptuna kişiselleştirme bağlamı ekleniyor (${options.personalizationContext.length} karakter)`,
        'QuizGenerationService.prepareQuizPrompt',
      );
    }

    // 6. Prompt'u derle
    return this.promptManager.compilePrompt(basePrompt, variables);
  }

  /**
   * AI içerik oluşturma
   * @param promptText Prompt metni
   * @param metadata Metadata bilgileri
   * @returns AI yanıtı
   */
  private async generateAIContent(
    promptText: string,
    metadata: QuizMetadata,
  ): Promise<string> {
    const { traceId } = metadata;

    this.flowTracker.trackStep(
      'AI içerik oluşturuluyor',
      'QuizGenerationService',
    );

    // pRetry ile retry mekanizması
    return pRetry(async () => {
      this.logger.debug(
        `[${traceId}] AI isteği gönderiliyor. Prompt uzunluğu: ${promptText.length} karakter`,
        'QuizGenerationService.generateAIContent',
      );

      // Metadata'yı AI provider'a ilet
      const result = await this.aiProviderService.generateContent(promptText, {
        metadata: {
          ...metadata,
          traceId,
        },
      });

      if (!result || !result.text) {
        this.logger.warn(
          `[${traceId}] AI Provider'dan boş yanıt alındı. Yeniden denenecek.`,
          'QuizGenerationService.generateAIContent',
        );
        throw new Error("AI Provider'dan boş yanıt alındı.");
      }

      this.logger.debug(
        `[${traceId}] AI yanıtı alındı. Yanıt uzunluğu: ${result.text.length} karakter, token kullanımı: ${result.usage?.totalTokens || 'bilinmiyor'}`,
        'QuizGenerationService.generateAIContent',
      );

      return result.text;
    }, this.RETRY_OPTIONS);
  }

  /**
   * AI yanıtını işler ve doğrular
   * @param aiResponseText AI yanıt metni
   * @param metadata Metadata bilgileri
   * @returns Quiz soruları
   */
  private processAIResponse(
    aiResponseText: string,
    metadata: QuizMetadata,
  ): QuizQuestion[] {
    const { traceId } = metadata;

    this.flowTracker.trackStep('AI yanıtı işleniyor', 'QuizGenerationService');
    this.logger.logExamStage(metadata.userId || 'anon', 'AI yanıtı işleniyor', {
      traceId,
      responseLength: aiResponseText?.length || 0,
    });

    try {
      // 1. JSON'a dönüştür
      const parsedJson = this.quizValidation.parseAIResponseToJSON(
        aiResponseText,
        metadata,
      );

      // 2. Şema doğrulaması
      const validatedData = this.quizValidation.validateQuizResponseSchema(
        parsedJson,
        metadata,
        aiResponseText,
      );

      // 3. Soruları dönüştür ve valide et
      const questions = this.quizValidation.transformAndValidateQuestions(
        validatedData,
        metadata,
      );

      // 4. Sonuçları logla
      this.logger.info(
        `[${traceId}] Quiz soruları başarıyla oluşturuldu. Toplam: ${questions.length} soru`,
        'QuizGenerationService.processAIResponse',
      );

      this.logger.logExamStage(
        metadata.userId || 'anon',
        'Sorular başarıyla işlendi',
        {
          traceId,
          questionsCount: questions.length,
          subTopics: metadata.subTopics || [],
        },
      );

      return questions;
    } catch (error) {
      this.logger.error(
        `[${traceId}] Quiz yanıtı işlenemedi: ${error.message}`,
        'QuizGenerationService.processAIResponse',
        undefined,
        error,
      );

      // Sınav işlemindeki hatayı logla
      this.logger.logExamError(metadata.userId || 'anon', error, {
        traceId,
        step: 'AI yanıtı işleme',
        rawResponse: aiResponseText?.substring(0, 500) + '...',
        metadata,
      });

      // Hatayı UI'da göstermek için ayrıntılı hata mesajı içeren bir hata fırlat
      throw new BadRequestException({
        code: 'QUIZ_PROCESSING_ERROR',
        message: `Sınav soruları oluşturulamadı: ${error.message}`,
        details: {
          rawError: error.message,
          trace: traceId,
          aiResponsePreview: aiResponseText?.substring(0, 300) + '...',
        },
      });
    }
  }

  /**
   * Konuları formatlayan yardımcı metot
   * @param subTopics Alt konular
   * @returns Formatlanmış konular metni
   */
  private formatTopics(subTopics: QuizGenerationOptions['subTopics']): string {
    if (!Array.isArray(subTopics) || subTopics.length === 0) {
      return 'Belirtilen konu yok';
    }

    // Eğer karmaşık obje dizisi ise (count ve status bilgisi içeren)
    if (
      typeof subTopics[0] !== 'string' &&
      subTopics[0] &&
      'subTopicName' in subTopics[0]
    ) {
      return (
        subTopics as { subTopicName: string; count: number; status?: string }[]
      )
        .map(
          (t) =>
            `${t.subTopicName} (${t.count} soru, durum: ${t.status || 'pending'})`,
        )
        .join('\n');
    }

    // String dizisi ise
    return (subTopics as string[]).join(', ');
  }

  /**
   * Unique trace ID oluşturur
   * @param prefix Trace ID ön eki
   * @returns Unique trace ID
   */
  private generateTraceId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Alt konulara dayalı hızlı sınav soruları oluşturur
   * @param documentText Kaynak belge metni
   * @param subTopics Seçilen alt konular
   * @param questionCount Soru sayısı
   * @param difficulty Zorluk seviyesi
   * @param documentId Belge ID (opsiyonel)
   * @returns Quiz soruları
   */
  async generateQuickQuizQuestions(
    documentText: string,
    subTopics: string[],
    questionCount: number = 10,
    difficulty: string = 'medium',
    documentId?: string,
  ): Promise<QuizQuestion[]> {
    const traceId = this.generateTraceId(
      `quick_quiz_${documentId || 'no-doc'}_${subTopics.join('_').substring(0, 30)}`,
    );

    // Belgeden ve alt konulardan anahtar kelimeleri çıkar
    let keywordsFromContent = '';
    if (documentText && documentText.length > 0) {
      // Basit kelime frekansı analizi
      const words = documentText
        .toLowerCase()
        .replace(/[^\wçğıöşüâîû]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      // En sık geçen 20 kelimeyi al
      const wordFreq: Record<string, number> = {};
      words.forEach((word) => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      keywordsFromContent = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word)
        .join(', ');
    }

    const metadata: QuizMetadata = {
      traceId,
      subTopicsCount: subTopics.length,
      questionCount,
      difficulty,
      userId: 'anonymous', // Anonim kullanıcı
      subTopics, // Alt konuları metadata'ya ekle
      documentId, // Belge ID'yi metadata'ya ekle
      keywords: keywordsFromContent, // Anahtar kelimeleri ekle
    };

    this.logger.debug(
      `[${traceId}] Hızlı quiz soruları oluşturuluyor: ${questionCount} soru, ${subTopics.length} alt konu, ${difficulty} zorluk`,
      'QuizGenerationService.generateQuickQuizQuestions',
      __filename,
      undefined,
      {
        subTopics,
        documentTextLength: documentText?.length || 0,
        documentId: documentId || 'yok',
        keywordsCount: keywordsFromContent.split(',').length,
      },
    );

    this.flowTracker.trackStep(
      `Hızlı quiz oluşturma - ${subTopics.length} konu ile başlatılıyor`,
      'QuizGenerationService.generateQuickQuizQuestions',
    );

    // Eğer "Eksaskala" kelimesi alt konularda geçiyorsa, özel metadata ekle
    if (subTopics.some((topic) => topic.toLowerCase().includes('eksaskala'))) {
      metadata.specialTopic = 'eksaskala';
      this.logger.info(
        `[${traceId}] Eksaskala konulu özel içerik oluşturulacak`,
        'QuizGenerationService.generateQuickQuizQuestions',
      );
    }

    // Standart quiz oluşturma sürecini çağır
    const options: QuizGenerationOptions = {
      documentText,
      subTopics,
      questionCount,
      difficulty,
      documentId,
    };

    try {
      // Maksimum deneme sayısı
      const maxRetries = 3;
      let currentTry = 0;
      let lastError = null;

      while (currentTry < maxRetries) {
        try {
          currentTry++;
          this.logger.info(
            `[${traceId}] Quiz oluşturma denemesi: ${currentTry}/${maxRetries}`,
            'QuizGenerationService.generateQuickQuizQuestions',
          );

          const questions = await this.generateQuizQuestions(options);

          if (
            !questions ||
            !Array.isArray(questions) ||
            questions.length === 0
          ) {
            throw new Error('AI soruları oluşturamadı: Boş soru listesi döndü');
          }

          if (questions.length < Math.max(1, questionCount * 0.5)) {
            this.logger.warn(
              `[${traceId}] Yeterli sayıda soru üretilmedi. Beklenen: ${questionCount}, Üretilen: ${questions.length}`,
              'QuizGenerationService.generateQuickQuizQuestions',
            );
            if (currentTry < maxRetries) {
              continue; // Tekrar dene
            }
          }

          this.logger.info(
            `[${traceId}] Quiz soruları başarıyla oluşturuldu: ${questions.length} soru`,
            'QuizGenerationService.generateQuickQuizQuestions',
          );

          this.flowTracker.trackStep(
            `Hızlı quiz oluşturma başarılı - ${questions.length} soru üretildi`,
            'QuizGenerationService.generateQuickQuizQuestions',
          );

          return questions;
        } catch (error) {
          lastError = error;
          const waitTime = Math.min(1000 * currentTry, 5000); // Artan bekleme süresi, en fazla 5 saniye

          this.logger.error(
            `[${traceId}] Quiz oluşturma hatası (deneme ${currentTry}/${maxRetries}): ${error.message}`,
            'QuizGenerationService.generateQuickQuizQuestions',
            __filename,
            undefined,
            error,
          );

          if (currentTry < maxRetries) {
            this.logger.info(
              `[${traceId}] ${waitTime}ms sonra yeniden deneniyor...`,
              'QuizGenerationService.generateQuickQuizQuestions',
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      // Tüm denemeler başarısız olursa ve fallback kullanılabilirse
      this.logger.error(
        `[${traceId}] Quiz oluşturma tüm denemeler sonrası başarısız oldu. Fallback mekanizması kullanılacak.`,
        'QuizGenerationService.generateQuickQuizQuestions',
      );

      this.flowTracker.trackStep(
        `Fallback quiz oluşturma - Quiz validasyon servisine yönlendiriliyor`,
        'QuizGenerationService.generateQuickQuizQuestions',
      );

      // QuizValidationService'teki fallback sorularını kullan
      return this.quizValidation.createFallbackQuestions(metadata);
    } catch (finalError) {
      this.logger.error(
        `[${traceId}] Kritik quiz oluşturma hatası: ${finalError.message}`,
        'QuizGenerationService.generateQuickQuizQuestions',
        __filename,
        undefined,
        finalError,
      );

      // Herhangi bir sorun olursa BadRequestException fırlat
      throw new BadRequestException(
        'Sınav soruları oluşturulurken hata oluştu. Lütfen daha sonra tekrar deneyin.',
      );
    }
  }

  /**
   * Kişiselleştirilmiş sınav soruları oluşturur
   * @param documentText Kaynak belge metni (opsiyonel)
   * @param subTopics Seçilen alt konular
   * @param userPerformance Kullanıcının performans verileri
   * @param questionCount Soru sayısı
   * @param difficulty Zorluk seviyesi
   * @param learningTargets Öğrenme hedefleri (opsiyonel)
   * @returns Quiz soruları
   */
  async generatePersonalizedQuizQuestions(
    subTopics: string[],
    userPerformance: {
      weakTopics: string[];
      mediumTopics: string[];
      failedQuestions?: { question: string; correctAnswer: string }[];
    },
    questionCount: number = 10,
    difficulty: string = 'medium',
    documentText?: string,
    learningTargets?: {
      targetId: string;
      description: string;
      status: string;
    }[],
  ): Promise<QuizQuestion[]> {
    const traceId = this.generateTraceId('personalized-quiz');

    this.logger.info(
      `[${traceId}] Kişiselleştirilmiş sınav soruları oluşturuluyor: ${questionCount} soru, ${difficulty} zorluk, ${subTopics.length} alt konu`,
      'QuizGenerationService.generatePersonalizedQuizQuestions',
    );

    // Belge metnini kısalt (eğer sağlandıysa)
    let truncatedText = documentText;

    if (documentText && documentText.length > 10000) {
      truncatedText = documentText.substring(0, 10000) + '...';
      this.logger.warn(
        `[${traceId}] Belge metni çok uzun, 10000 karaktere kısaltıldı (orijinal: ${documentText.length} karakter)`,
        'QuizGenerationService.generatePersonalizedQuizQuestions',
      );
    }

    // Yapay zekaya gönderilecek kullanıcı performans bilgilerini hazırla
    const performanceContext = this.preparePerformanceContext(
      userPerformance,
      learningTargets,
    );

    // QuizGenerationOptions nesnesini oluştur
    const options: QuizGenerationOptions = {
      documentText: truncatedText,
      subTopics,
      questionCount,
      difficulty,
      personalizationContext: performanceContext,
    };

    // Standart generateQuizQuestions metodunu çağır, ancak kişiselleştirme bağlamıyla
    return this.generateQuizQuestions(options);
  }

  /**
   * Kullanıcı performans verilerini yapay zekaya uygun formata dönüştürür
   */
  private preparePerformanceContext(
    userPerformance: {
      weakTopics: string[];
      mediumTopics: string[];
      failedQuestions?: { question: string; correctAnswer: string }[];
    },
    learningTargets?: {
      targetId: string;
      description: string;
      status: string;
    }[],
  ): string {
    let context = 'Kullanıcı Performans Bilgileri:\n';

    // Zayıf konular
    if (userPerformance.weakTopics.length > 0) {
      context +=
        '\nZayıf Konular:\n- ' + userPerformance.weakTopics.join('\n- ');
    }

    // Orta seviye konular
    if (userPerformance.mediumTopics.length > 0) {
      context +=
        '\nOrta Seviye Konular:\n- ' +
        userPerformance.mediumTopics.join('\n- ');
    }

    // Geçmiş hatalı sorular (en fazla 5 tane)
    if (
      userPerformance.failedQuestions &&
      userPerformance.failedQuestions.length > 0
    ) {
      const limitedFailedQuestions = userPerformance.failedQuestions.slice(
        0,
        5,
      );
      context += '\n\nDaha Önce Yanlış Cevaplanan Sorular:\n';
      limitedFailedQuestions.forEach((q, index) => {
        context += `${index + 1}. ${q.question}\nDoğru Cevap: ${q.correctAnswer}\n\n`;
      });
    }

    // Öğrenme hedefleri
    if (learningTargets && learningTargets.length > 0) {
      context += '\nÖğrenme Hedefleri:\n';
      learningTargets.forEach((target) => {
        context += `- ${target.description} (Durum: ${target.status})\n`;
      });
    }

    return context;
  }
}
