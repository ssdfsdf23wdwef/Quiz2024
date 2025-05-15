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
    // Unique trace ID oluştur
    const traceId = this.generateTraceId('quiz');
    const metadata: QuizMetadata = {
      traceId,
      subTopicsCount: Array.isArray(options.subTopics)
        ? options.subTopics.length
        : 0,
      difficulty: options.difficulty,
      questionCount: options.questionCount,
    };

    this.flowTracker.trackStep(
      `Quiz soruları oluşturma süreci başladı (${options.questionCount} soru)`,
      'QuizGenerationService',
    );

    try {
      // 1. Quiz prompt'unu yükle
      const promptText = await this.prepareQuizPrompt(options, metadata);

      // 2. AI servisi ile içerik oluştur
      const aiResponseText = await this.generateAIContent(promptText, metadata);

      // 3. Yanıtı işle ve doğrula
      return this.processAIResponse(aiResponseText, metadata);
    } catch (error) {
      // Hata durumunu logla
      this.logger.error(
        `[${traceId}] Quiz soruları oluşturulurken hata: ${error.message}`,
        'QuizGenerationService.generateQuizQuestions',
        undefined,
        error,
      );

      // Hatayı yukarı fırlat
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

    // 4. Prompt'u derle
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

      const result = await this.aiProviderService.generateContent(promptText);
      if (!result || !result.text) {
        this.logger.warn(
          `[${traceId}] AI Provider'dan boş yanıt alındı. Yeniden denenecek.`,
          'QuizGenerationService.generateAIContent',
        );
        throw new Error("AI Provider'dan boş yanıt alındı.");
      }

      this.logger.debug(
        `[${traceId}] AI yanıtı alındı. Yanıt uzunluğu: ${result.text.length} karakter`,
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

      return questions;
    } catch (error) {
      this.logger.error(
        `[${traceId}] Quiz yanıtı işlenemedi: ${error.message}`,
        'QuizGenerationService.processAIResponse',
        undefined,
        error,
      );
      throw new BadRequestException(`Quiz yanıtı işlenemedi: ${error.message}`);
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
   * @returns Quiz soruları
   */
  async generateQuickQuizQuestions(
    documentText: string,
    subTopics: string[],
    questionCount: number = 10,
    difficulty: string = 'medium',
  ): Promise<QuizQuestion[]> {
    const traceId = this.generateTraceId('quick-quiz');

    this.logger.info(
      `[${traceId}] Hızlı sınav soruları oluşturuluyor: ${questionCount} soru, ${difficulty} zorluk, ${subTopics.length} alt konu`,
      'QuizGenerationService.generateQuickQuizQuestions',
    );

    // Belge metnini kısalt
    const maxTextLength = 12000;
    let truncatedText = documentText;

    if (documentText.length > maxTextLength) {
      truncatedText = documentText.substring(0, maxTextLength) + '...';
      this.logger.warn(
        `[${traceId}] Belge metni çok uzun, ${maxTextLength} karaktere kısaltıldı (orijinal: ${documentText.length} karakter)`,
        'QuizGenerationService.generateQuickQuizQuestions',
      );
    }

    // QuizGenerationOptions nesnesini oluştur
    const options: QuizGenerationOptions = {
      documentText: truncatedText,
      subTopics,
      questionCount,
      difficulty,
    };

    // Standart generateQuizQuestions metodunu çağır
    return this.generateQuizQuestions(options);
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
