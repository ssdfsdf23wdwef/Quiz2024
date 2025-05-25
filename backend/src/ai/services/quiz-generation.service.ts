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
   * Alt konulara göre soru dağılımını hesaplar.
   * Her alt konuya en az 2 soru atanır ve kalan sorular alt konulara dengeli şekilde dağıtılır.
   * Eğer istenen soru sayısı, desteklenebilecek alt konu sayısından azsa,
   * sadece soru sayısı / 2 kadar alt konu kullanılır.
   *
   * @param subTopics Alt konular dizisi
   * @param questionCount İstenen toplam soru sayısı
   * @returns Her alt konuya düşen soru sayısını içeren bir nesneler dizisi
   */
  distributeQuestionsAmongSubtopics(
    subTopics: string[],
    questionCount: number,
  ): { subTopicName: string; count: number; status: string }[] {
    // Geçersiz giriş kontrolü
    if (!Array.isArray(subTopics) || subTopics.length === 0) {
      throw new BadRequestException('Alt konu listesi boş olamaz');
    }

    if (questionCount < 2) {
      throw new BadRequestException('Soru sayısı en az 2 olmalıdır');
    }

    // Alt konu sayısını en fazla 10 ile sınırla
    let processedSubTopics = [...subTopics];
    if (processedSubTopics.length > 10) {
      this.logger.warn(
        `Alt konu sayısı (${processedSubTopics.length}) 10'dan fazla. İlk 10 alt konu kullanılacak.`,
        'distributeQuestionsAmongSubtopics',
      );
      processedSubTopics = processedSubTopics.slice(0, 10);
    }

    // Alt konu isimlerini güzelleştir
    const beautifySubTopicName = (name: string): string => {
      if (!name || typeof name !== 'string') return 'Geçersiz Alt Konu Adı';

      // Özel Türkçe karakter dönüşümleri - spesifik kalıplar önce
      const turkishReplacements = {
        // Spesifik kelime kalıpları
        'l-k': 'lık',
        'l-l-k': 'lülük', 
        'sa-l-k': 'sağlık',
        'g-venlik': 'güvenlik',
        'y-k-ml-l': 'yükümlülük',
        'de-erlendirilmesi': 'değerlendirilmesi',
        'nlemler': 'önlemler',
        // Yaygın karakter kalıpları
        'tasar-m-': 'tasarım',
        'a-amalar': 'aşamaları',
        // Tekil karakter dönüşümleri - sadece kelime sonu
        'g-\\b': 'ği',
        // Genel tire-boşluk dönüşümü en son
        '-+': ' ',
      };

      // Tireli ifadeleri düzelt - sıralı şekilde
      let processedName = name.toLowerCase();
      Object.entries(turkishReplacements).forEach(([key, value]) => {
        processedName = processedName.replace(new RegExp(key, 'g'), value);
      });

      // Kelimeleri büyük harfle başlat
      return processedName
        .split(' ')
        .map((word) => {
          if (!word) return '';
          return (
            word.charAt(0).toLocaleUpperCase('tr-TR') +
            word.slice(1).toLocaleLowerCase('tr-TR')
          );
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const beautifiedSubTopics = processedSubTopics.map(beautifySubTopicName);

    // Kullanılabilecek maksimum alt konu sayısını hesapla
    // (Her alt konu en az 2 soru almalı)
    const maxSubTopics = Math.floor(questionCount / 2);

    // Eğer istenen soru sayısı, tüm alt konulara en az 2 soru vermeye yetmiyorsa,
    // sadece desteklenebilecek kadar alt konu kullanılır
    const activeSubTopicCount = Math.min(
      beautifiedSubTopics.length,
      maxSubTopics,
    );

    // İlk olarak, kullanılacak alt konuları seç (dizinin başından)
    const activeTopicsForDistribution = beautifiedSubTopics.slice(
      0,
      activeSubTopicCount,
    );
    const pendingTopicsForDistribution =
      beautifiedSubTopics.slice(activeSubTopicCount);

    // Her aktif alt konuya minimum 2 soru atama
    let remainingQuestions = questionCount - activeSubTopicCount * 2;
    if (remainingQuestions < 0) remainingQuestions = 0; // Negatif olmasını engelle

    // Kalan soruları dengeli dağıt
    let result = activeTopicsForDistribution.map((topic) => ({
      subTopicName: topic,
      count: activeSubTopicCount > 0 ? 2 : 0, // Eğer hiç aktif konu yoksa 0 ata
      status: 'active',
    }));

    // Eğer hiç aktif alt konu yoksa (örn. questionCount = 1 ise, activeSubTopicCount = 0 olabilir)
    // ve result boşsa, bu durumda tüm konuları pending yap ve soru sayısını 0 yap.
    if (activeSubTopicCount === 0 && questionCount > 0) {
      return beautifiedSubTopics.map((topic) => ({
        subTopicName: topic,
        count: 0,
        status: 'pending',
      }));
    }

    // Kalan soruları dağıt (önce ilk alt konulara ekstra sorular gelecek şekilde)
    let index = 0;
    while (remainingQuestions > 0 && activeSubTopicCount > 0) {
      result[index % activeSubTopicCount].count++;
      remainingQuestions--;
      index++;
    }

    // Beklemede kalan alt konuları ekle
    const pendingResult = pendingTopicsForDistribution.map((topic) => ({
      subTopicName: topic,
      count: 0,
      status: 'pending',
    }));

    // Hem aktif hem beklemede olan alt konuları birleştir
    // Aktif ama soru sayısı 0 olanları pending olarak güncelle
    result = result.map((topic) => {
      if (topic.count === 0) {
        return { ...topic, status: 'pending' };
      }
      return topic;
    });

    return [...result, ...pendingResult].filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.subTopicName === value.subTopicName),
    ); // Benzersizliği sağla
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

    // Alt konuların dağıtımını yap
    let formattedSubTopics = options.subTopics;
    if (
      Array.isArray(options.subTopics) &&
      typeof options.subTopics[0] === 'string' &&
      options.subTopics.length > 0
    ) {
      // Alt konular basit bir string dizisi ise, dağıtımı yap
      formattedSubTopics = this.distributeQuestionsAmongSubtopics(
        options.subTopics as string[],
        options.questionCount,
      );

      this.logger.debug(
        `[${traceId}] Alt konuların soru dağılımı yapıldı: ${JSON.stringify(formattedSubTopics)}`,
        'QuizGenerationService.generateQuizQuestions',
      );

      // Sadece aktif durumda olan alt konuları kullan
      const activeSubTopics = (
        formattedSubTopics as {
          subTopicName: string;
          count: number;
          status: string;
        }[]
      ).filter((topic) => topic.status === 'active');

      // Konsola detaylı bilgi ver
      console.log(
        `[QUIZ_DEBUG] Alt konuların dağılımı: Toplam=${options.subTopics.length}, Aktif=${activeSubTopics.length}, Soru Sayısı=${options.questionCount}`,
        activeSubTopics.map((t) => `${t.subTopicName}: ${t.count} soru`),
      );

      // Yeni options objesini güncelle
      options = {
        ...options,
        subTopics: formattedSubTopics,
      };
    }

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

    // DETAYLI LOGLAMA EKLE: Soru oluşturma işlemi başlatılırken tüm parametreleri logla
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Quiz oluşturma işlemi başlatılıyor. İstek parametreleri:`,
      {
        difficulty: options.difficulty,
        questionCount: options.questionCount,
        subTopics: Array.isArray(options.subTopics)
          ? typeof options.subTopics[0] === 'string'
            ? options.subTopics
            : options.subTopics.map((t) =>
                typeof t === 'object' ? JSON.stringify(t) : t,
              )
          : options.subTopics,
        documentId: options.documentId,
        courseId: options.courseId,
        quizType: options.quizType,
        personalizedQuizType: options.personalizedQuizType,
      },
    );

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

      // DETAYLI LOGLAMA EKLE: Hazırlanan promptu logla
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Hazırlanan prompt (ilk 500 karakter):\n${promptText.substring(0, 500)}...`,
      );
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Prompt toplam uzunluğu: ${promptText.length} karakter`,
      );

      this.logger.logExamStage(options.userId || 'anon', 'Prompt hazırlandı', {
        traceId,
        promptLength: promptText.length,
      });

      // AI yanıtı oluştur
      console.log(
        `[QUIZ_DEBUG] [${traceId}] AI modeline istek gönderiliyor...`,
      );
      const rawJsonResponse = await this.generateAIContent(promptText, metadata);

      // DETAYLI LOGLAMA EKLE: AI yanıtını logla
      console.log(
        `[QUIZ_DEBUG] [${traceId}] AI yanıtı alındı (ilk 500 karakter):\n${rawJsonResponse.substring(0, 500)}...`,
      );
      console.log(
        `[QUIZ_DEBUG] [${traceId}] AI yanıtı toplam uzunluğu: ${rawJsonResponse.length} karakter`,
      );
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Yanıt JSON içeriyor mu: ${rawJsonResponse.includes('{') && rawJsonResponse.includes('}') ? 'EVET' : 'HAYIR'}`,
      );

      this.logger.logExamStage(options.userId || 'anon', 'AI yanıtı alındı', {
        traceId,
        responseLength: rawJsonResponse.length,
      });

      // JSON parse işlemi
      console.log(`[QUIZ_DEBUG] [${traceId}] AI yanıtı JSON olarak parse ediliyor...`);
      let parsedResponse;
      try {
        // String kontrolü
        if (typeof rawJsonResponse !== 'string') {
          this.logger.error(
            `[${traceId}] AI yanıtı string değil: ${typeof rawJsonResponse}`,
            'QuizGenerationService.generateQuizQuestions',
          );
          throw new BadRequestException('AI response is not a valid string.');
        }

        // Ham yanıtı temizle ve JSON çıkar
        let cleanedResponse = rawJsonResponse;
        
        // Ham yanıtın ilk 100 karakterini logla
        console.log(`[QUIZ_DEBUG] [${traceId}] Ham yanıt (ilk 100 karakter): ${rawJsonResponse.substring(0, 100)}...`);
        
        // 1. Başlık satırlarını kaldır (## Ham Çıktı: gibi)
        cleanedResponse = cleanedResponse.replace(/^.*?Ham Çıktı:.*?$/m, '');
        
        // 2. Markdown kod bloklarını temizle
        // 2.1 Duplicate ```json etiketlerini düzelt
        cleanedResponse = cleanedResponse.replace(/```json\s*```json/g, '```json');
        
        // 2.2 Kod blok etiketlerini kaldır
        cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
        
        // 3. JSON başlangıcını bul
        const jsonStartIndex = cleanedResponse.indexOf('{');
        if (jsonStartIndex !== -1) {
          cleanedResponse = cleanedResponse.substring(jsonStartIndex);
        }
        
        console.log(`[QUIZ_DEBUG] [${traceId}] Temizlenmiş yanıt (ilk 100 karakter): ${cleanedResponse.substring(0, 100)}...`);

        // JSON parse işlemi
        parsedResponse = JSON.parse(cleanedResponse);
        console.log(
          `[QUIZ_DEBUG] [${traceId}] JSON parse başarılı. Anahtarlar:`,
          Object.keys(parsedResponse),
        );
      } catch (error) {
        // JSON parse hatası
        this.logger.error(
          `[${traceId}] AI yanıtı geçerli JSON değil: ${error.message}`,
          'QuizGenerationService.generateQuizQuestions',
          undefined,
          error,
        );
        
        // Validation service'i kullanmaya çalış (son çare)
        try {
          console.log(`[QUIZ_DEBUG] [${traceId}] QuizValidation servisi ile parse etmeye çalışılıyor...`);
          parsedResponse = this.quizValidation.parseAIResponseToJSON(rawJsonResponse, metadata);
          console.log(`[QUIZ_DEBUG] [${traceId}] QuizValidation servisi ile parse başarılı`);
        } catch (validationError) {
          this.logger.error(
            `[${traceId}] QuizValidation servisi ile parse başarısız: ${validationError.message}`,
            'QuizGenerationService.generateQuizQuestions',
            undefined,
            validationError,
          );
          throw new BadRequestException('AI response is not valid JSON.');
        }
      }

      // Zod validasyonu
      console.log(`[QUIZ_DEBUG] [${traceId}] AI yanıtı Zod ile doğrulanıyor...`);
      try {
        // QuizResponseSchema veya QuizGenerationResponseSchema ile doğrulama
        const validatedData = this.quizValidation.validateQuizResponseSchema(
          parsedResponse,
          metadata,
          rawJsonResponse,
        );

        if (!validatedData) {
          throw new Error('Validation returned null or undefined result');
        }

        console.log(
          `[QUIZ_DEBUG] [${traceId}] Zod doğrulaması başarılı. Sorular işleniyor...`,
        );

        // Doğrulanmış sorular için detaylı işleme
        const questions = this.processAIResponse(rawJsonResponse, metadata, validatedData);

        // DETAYLI LOGLAMA EKLE: İşlenen soruları logla
        console.log(
          `[QUIZ_DEBUG] [${traceId}] İşlem sonrası soru sayısı: ${questions.length}`,
        );
        console.log(
          `[QUIZ_DEBUG] [${traceId}] İlk soru örneği:`,
          questions.length > 0
            ? JSON.stringify(questions[0], null, 2)
            : 'Soru yok',
        );
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Tüm sorular:`,
          JSON.stringify(
            questions.map((q) => ({
              id: q.id,
              text: q.questionText.substring(0, 50) + '...',
              subTopic: q.subTopicName,
              normalized: q.normalizedSubTopicName,
              difficulty: q.difficulty,
            })),
            null,
            2,
          ),
        );

        // KONTROL EKLE: İstenen soru sayısı ve dönen soru sayısı karşılaştırması
        if (questions.length < options.questionCount) {
          console.warn(
            `[QUIZ_DEBUG] [${traceId}] UYARI: Üretilen soru sayısı (${questions.length}) istenen soru sayısından (${options.questionCount}) az! AI yanıtı eksik olabilir.`,
          );
        }

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
        // Zod validasyonu sırasında hata oluştu
        this.logger.error(
          `[${traceId}] Zod validasyonu sırasında hata: ${error.message}`,
          'QuizGenerationService.generateQuizQuestions',
          undefined,
          error
        );
        throw new BadRequestException(`Validation error: ${error.message}`);
      }
    } catch (error) {
      // DETAYLI LOGLAMA EKLE: Hata detaylarını artır
      console.error(
        `[QUIZ_DEBUG] [${traceId}] HATA: Quiz oluşturma başarısız. Hata mesajı: ${error.message}`,
      );
      console.error(`[QUIZ_DEBUG] [${traceId}] Hata detayları:`, {
        errorName: error.name,
        stack: error.stack,
        code: error.code,
        params: {
          difficulty: options.difficulty,
          questionCount: options.questionCount,
          subTopicsLength: Array.isArray(options.subTopics)
            ? options.subTopics.length
            : 'N/A',
        },
      });

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

    // 1. Kişiselleştirilmiş quiz türüne göre uygun prompt'u seç
    let promptFileName = 'generate-quiz-tr.txt'; // Varsayılan prompt
    const isNewTopicFocused = metadata.personalizedQuizType === 'newTopicFocused';

    if (isNewTopicFocused) {
      if (options.subTopics && options.subTopics.length > 0) {
        promptFileName = 'generate-quiz-new-topics-tr.txt';
        this.logger.info(
          `[${traceId}] newTopicFocused türü için özel prompt kullanılıyor: ${promptFileName}. Konular: ${options.subTopics.join(', ')}`,
          'QuizGenerationService.prepareQuizPrompt',
        );
      } else {
        this.logger.warn(
          `[${traceId}] newTopicFocused türü istendi ancak hiç konu sağlanmadı. Standart prompt ('${promptFileName}') kullanılacak.`,
          'QuizGenerationService.prepareQuizPrompt',
        );
        // promptFileName değişmeden kalır, yani 'generate-quiz-tr.txt'
      }
    }

    // 2. Seçilen prompt'u yükle
    const basePrompt = await this.promptManager.loadPrompt(promptFileName);
    if (!basePrompt) {
      this.logger.error(
        `[${traceId}] Prompt dosyası yüklenemedi: ${promptFileName}. Fallback kullanılacak.`,
        'QuizGenerationService.prepareQuizPrompt',
      );
      return this.promptManager.getFallbackQuizPrompt();
    }

    // 3. Konuları formatla
    const topicsText = this.formatTopics(options.subTopics);

    // 4. Değişkenleri doldur
    const variables: Record<string, string> = {
      TOPICS: topicsText,
      COUNT: options.questionCount.toString(),
      DIFFICULTY: options.difficulty || 'medium',
    };

    // 5. Belge metni varsa prompt'a ekle
    if (options.documentText) {
      variables['DOCUMENT_TEXT'] = options.documentText;
      this.logger.debug(
        `[${traceId}] Quiz promptuna belge metni ekleniyor (${options.documentText.length} karakter)`,
        'QuizGenerationService.prepareQuizPrompt',
      );
    }

    // 6. Kişiselleştirme bağlamı varsa prompt'a ekle
    if (options.personalizationContext) {
      variables['PERSONALIZATION_CONTEXT'] = options.personalizationContext;
      this.logger.debug(
        `[${traceId}] Quiz promptuna kişiselleştirme bağlamı ekleniyor (${options.personalizationContext.length} karakter)`,
        'QuizGenerationService.prepareQuizPrompt',
      );
    }

    // 7. Prompt'u derle
    const compiledPrompt = this.promptManager.compilePrompt(
      basePrompt,
      variables,
    );

    // 8. Debug amacıyla prompt'u dosyaya kaydet
    try {
      const fs = require('fs');
      const path = require('path');
      const debugFilePath = path.join(process.cwd(), 'sınav.md');

      let debugContent = `# Sınav Oluşturma Promptu\n\n`;
      debugContent += `## Tarih: ${new Date().toISOString()}\n\n`;
      debugContent += `## Trace ID: ${traceId}\n\n`;
      debugContent += `## Alt Konular (${Array.isArray(options.subTopics) ? options.subTopics.length : 0} adet):\n`;
      debugContent += `\`\`\`\n${topicsText}\n\`\`\`\n\n`;
      debugContent += `## Soru Sayısı: ${options.questionCount}\n\n`;
      debugContent += `## Zorluk: ${options.difficulty || 'medium'}\n\n`;
      debugContent += `## Tam Prompt:\n\`\`\`\n${compiledPrompt}\n\`\`\`\n\n`;

      fs.writeFileSync(debugFilePath, debugContent, 'utf8');
      this.logger.info(
        `[${traceId}] Sınav promptu dosyaya kaydedildi: ${debugFilePath}`,
        'QuizGenerationService.prepareQuizPrompt',
      );
    } catch (error) {
      this.logger.error(
        `[${traceId}] Debug dosyası oluşturulurken hata: ${error.message}`,
        'QuizGenerationService.prepareQuizPrompt',
      );
    }

    return compiledPrompt;
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
      
      // Boş soru dizisi kontrolü ekleyelim
      if (result.text.includes('"questions": []') || result.text.includes('"questions":[]')) {
        this.logger.warn(
          `[${traceId}] AI boş soru dizisi döndürdü. Yeniden denenecek.`,
          'QuizGenerationService.generateAIContent',
        );
        throw new Error('AI boş soru dizisi döndürdü.');
      }

      this.logger.debug(
        `[${traceId}] AI yanıtı alındı. Yanıt uzunluğu: ${result.text.length} karakter, token kullanımı: ${result.usage?.totalTokens || 'bilinmiyor'}`,
        'QuizGenerationService.generateAIContent',
      );

      // AI yanıtını debug dosyasına ekle
      try {
        const fs = require('fs');
        const path = require('path');

        // AI yanıtını cikti.md dosyasına kaydet (her seferinde dosyayı yenile)
        const outputFilePath = path.join(process.cwd(), 'modelden_cikti.md');
        let responseText = result.text;

        // Yanıtın uzunluğunu kontrol et
        console.log(
          `[CIKTI_DEBUG] AI yanıtı uzunluğu: ${responseText.length} karakter`,
        );

        // Yanıt için maksimum izin verilen boyut (50MB, oldukça büyük bir değer)
        const maxOutputSize = 50 * 1024 * 1024;

        // Eğer yanıt çok büyükse, kes ve not ekle
        if (responseText.length > maxOutputSize) {
          responseText = responseText.substring(0, maxOutputSize);
          responseText += '\n\n... [Yanıt çok büyük olduğu için kesildi] ...';
          console.warn(
            `[CIKTI_DEBUG] AI yanıtı çok büyük, ${maxOutputSize} karaktere kısaltıldı.`,
          );
        }

        const outputContent = `# AI Model Yanıtı\n\nTarih: ${new Date().toISOString()}\nTrace ID: ${traceId}\nYanıt Uzunluğu: ${result.text.length} karakter\n\n## Ham Çıktı:\n\`\`\`json\n${responseText}\n\`\`\`\n`;

        // Büyük boyuttaki dosyalar için buffer ayarı kullanarak kaydet
        fs.writeFileSync(outputFilePath, outputContent, {
          encoding: 'utf8',
          flag: 'w', // Dosyayı yoksa oluştur, varsa üzerine yaz
        });

        this.logger.info(
          `[${traceId}] AI yanıtı cikti.md dosyasına kaydedildi (${responseText.length} karakter)`,
          'QuizGenerationService.generateAIContent',
        );

        const debugFilePath = path.join(process.cwd(), 'modelle_giris.md');
        if (fs.existsSync(debugFilePath)) {
          let appendContent = `\n\n## AI Yanıtı:\n\`\`\`json\n${result.text}\n\`\`\`\n\n`;

          fs.appendFileSync(debugFilePath, appendContent, 'utf8');
          this.logger.info(
            `[${traceId}] AI yanıtı debug dosyasına eklendi`,
            'QuizGenerationService.generateAIContent',
          );
        }
      } catch (error) {
        this.logger.error(
          `[${traceId}] Debug dosyasına AI yanıtı eklenirken hata: ${error.message}`,
          'QuizGenerationService.generateAIContent',
        );
      }

      return result.text;
    }, this.RETRY_OPTIONS);
  }

  /**
   * AI yanıtını işler ve doğrular
   * @param aiResponseText AI yanıt metni
   * @param metadata Metadata bilgileri
   * @param validatedData Zod tarafından doğrulanmış veri (opsiyonel)
   * @returns Quiz soruları
   */
  private processAIResponse(
    aiResponseText: string,
    metadata: QuizMetadata,
    validatedData?: any,
  ): QuizQuestion[] {
    const { traceId } = metadata;

    // DETAYLI LOGLAMA: İşleme başlangıcı
    console.log(
      `[QUIZ_DEBUG] [${traceId}] AI yanıtının işlenmesi başlatılıyor`,
    );
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Yanıt uzunluğu: ${aiResponseText?.length || 0} karakter`,
    );
    console.log(
      `[QUIZ_DEBUG] [${traceId}] İşlem başlangıcında meta bilgiler:`,
      {
        userId: metadata.userId || 'anon',
        questionCount: metadata.questionCount,
        difficulty: metadata.difficulty,
        subTopics: Array.isArray(metadata.subTopics)
          ? metadata.subTopics.length + ' adet'
          : 'yok',
        documentId: metadata.documentId || 'yok',
      },
    );

    this.flowTracker.trackStep('AI yanıtı işleniyor', 'QuizGenerationService');
    this.logger.logExamStage(metadata.userId || 'anon', 'AI yanıtı işleniyor', {
      traceId,
      responseLength: aiResponseText?.length || 0,
    });

    try {
      // 1. Eğer validatedData yoksa, JSON'a dönüştür
      let parsedJson = validatedData;
      if (!parsedJson) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 1: AI yanıtı JSON'a dönüştürülüyor...`,
        );
        console.time(`[QUIZ_DEBUG] [${traceId}] JSON'a dönüştürme süresi`);
        parsedJson = this.quizValidation.parseAIResponseToJSON(
          aiResponseText,
          metadata,
        ) as any;
        console.timeEnd(`[QUIZ_DEBUG] [${traceId}] JSON'a dönüştürme süresi`);
      } else {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 1: Önceden doğrulanmış veri kullanılıyor`,
        );
      }

      // JSON çıktısının özeti
      if (parsedJson) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 1 SONUÇ: JSON işleme başarılı`,
        );
        if (typeof parsedJson === 'object' && parsedJson !== null) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] JSON içeriği anahtarlar:`,
            Object.keys(parsedJson),
          );

          // Questions varsa içindeki soru sayısı
          if (
            parsedJson &&
            parsedJson['questions'] &&
            Array.isArray(parsedJson['questions'])
          ) {
            console.log(
              `[QUIZ_DEBUG] [${traceId}] Soru sayısı: ${parsedJson['questions'].length}`,
            );

            // Alt konuların dağılımını ve sayısını debug dosyasına ekleyelim
            try {
              const fs = require('fs');
              const path = require('path');
              const debugFilePath = path.join(process.cwd(), 'sınav.md');

              if (fs.existsSync(debugFilePath)) {
                // Alt konu bazlı sorular
                const subTopicDistribution: Record<string, number> = {};

                (parsedJson['questions'] as any[]).forEach((q: any) => {
                  const subTopic = q.subTopicName || 'Belirtilmemiş';
                  if (!subTopicDistribution[subTopic]) {
                    subTopicDistribution[subTopic] = 0;
                  }
                  subTopicDistribution[subTopic]++;
                });

                let appendContent = `\n\n## İşlenen Sorular Analizi:\n\n`;
                appendContent += `- Toplam Soru Sayısı: ${parsedJson['questions'].length}\n`;
                appendContent += `- Alt Konu Dağılımı:\n\n`;

                Object.entries(subTopicDistribution)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .forEach(([subTopic, count]) => {
                    appendContent += `  - ${subTopic}: ${count} soru\n`;
                  });

                appendContent += `\n\n### Soru Örnekleri (Her Alt Konudan 1 Adet):\n\n`;

                // Her alt konudan 1 örnek soru ekle
                const seenSubTopics = new Set<string>();
                (parsedJson['questions'] as any[]).forEach((q: any) => {
                  const subTopic = q.subTopicName || 'Belirtilmemiş';
                  if (!seenSubTopics.has(subTopic)) {
                    seenSubTopics.add(subTopic);

                    appendContent += `#### ${subTopic}:\n`;
                    appendContent += `- Soru: ${q.questionText}\n`;
                    appendContent += `- Seçenekler: ${q.options.join(' | ')}\n`;
                    appendContent += `- Doğru Cevap: ${q.correctAnswer}\n`;
                    appendContent += `- Zorluk: ${q.difficulty}\n\n`;
                  }
                });

                fs.appendFileSync(debugFilePath, appendContent, 'utf8');
                this.logger.info(
                  `[${traceId}] İşlenen sorular analizi debug dosyasına eklendi`,
                  'QuizGenerationService.processAIResponse',
                );
              }
            } catch (error) {
              this.logger.error(
                `[${traceId}] Debug dosyasına soru analizi eklenirken hata: ${error.message}`,
                'QuizGenerationService.processAIResponse',
              );
            }
          }
        }
      } else {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 1 SONUÇ: JSON'a dönüştürme başarısız, parsedJson null veya undefined`,
        );
        // Geçerli JSON yanıtı yoksa, boş bir dizi döndür
        return [];
      }

      // 2. Şema doğrulaması (eğer önceden doğrulanmamışsa)
      let validatedResult = parsedJson;
      if (!validatedData) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 2: Şema doğrulaması yapılıyor...`,
        );
        console.time(`[QUIZ_DEBUG] [${traceId}] Şema doğrulama süresi`);
        validatedResult = this.quizValidation.validateQuizResponseSchema(
          parsedJson,
          metadata,
          aiResponseText,
        );
        console.timeEnd(`[QUIZ_DEBUG] [${traceId}] Şema doğrulama süresi`);
      } else {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 2: Önceden doğrulanmış veri kullanılıyor`,
        );
      }

      // Doğrulama sonucu
      if (validatedData) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] ADIM 2 SONUÇ: Şema doğrulaması başarılı`,
        );
        if (
          validatedData &&
          typeof validatedData === 'object' &&
          'questions' in validatedData &&
          Array.isArray((validatedData as any).questions)
        ) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Doğrulanan veri ${(validatedData as any).questions.length} adet soru içeriyor`,
          );
        }
      } else {
        console.error(
          `[QUIZ_DEBUG] [${traceId}] ADIM 2 SONUÇ: Şema doğrulaması başarısız, sonuç null veya undefined`,
        );
        // Şema doğrulaması başarısız olursa boş dizi döndür
        return [];
      }

      // 3. Soruları dönüştür ve valide et
      console.log(
        `[QUIZ_DEBUG] [${traceId}] ADIM 3: Soru dönüştürme ve detaylı validasyon yapılıyor...`,
      );
      console.time(`[QUIZ_DEBUG] [${traceId}] Soru dönüştürme süresi`);
      
      let questions;
      try {
        questions = this.quizValidation.transformAndValidateQuestions(
          validatedData,
          metadata,
        );
      } catch (error) {
        // Eğer transformAndValidateQuestions başarısız olursa (geçersiz sorular nedeniyle),
        // fallback mekanizmasını devreye sokuyoruz
        console.error(
          `[QUIZ_DEBUG] [${traceId}] Soru validasyonu başarısız: ${error.message}`,
        );
        this.logger.warn(
          `[${traceId}] AI geçersiz sorular üretti, fallback soruları kullanılacak: ${error.message}`,
          'QuizGenerationService.processAIResponse',
        );
        
        // AI'ın geçersiz içerik ürettiği durumda fallback sorularını döndür
        return this.quizValidation.createFallbackQuestions(metadata);
      }
      
      console.timeEnd(`[QUIZ_DEBUG] [${traceId}] Soru dönüştürme süresi`);

      // Dönüştürme sonucu
      console.log(
        `[QUIZ_DEBUG] [${traceId}] ADIM 3 SONUÇ: Soru dönüştürme tamamlandı, ${questions.length} adet geçerli soru`,
      );

      // EKLENEN KONTROL: AI'ın anlamsız/geçersiz sorular üretip üretmediğini kontrol et
      if (questions && questions.length > 0) {
        const invalidQuestionPattern = /verilen metinde.*aktif konu.*bulunmadığı.*için.*soru.*oluşturulamamıştır/i;
        const genericFailurePattern = /aktif konu yok|bekleyen konu yok|soru oluşturulamaz|konu belirtilmemiş/i;
        
        // İlk sorunun içeriğini kontrol et
        const firstQuestion = questions[0];
        if (firstQuestion && firstQuestion.questionText) {
          const questionText = firstQuestion.questionText.toLowerCase();
          
          if (invalidQuestionPattern.test(questionText) || genericFailurePattern.test(questionText)) {
            console.error(
              `[QUIZ_DEBUG] [${traceId}] AI geçersiz/örnek sorular üretti, fallback kullanılacak`,
            );
            this.logger.warn(
              `[${traceId}] AI geçersiz içerik üretti (örnek: "${firstQuestion.questionText.substring(0, 100)}..."), fallback soruları kullanılacak`,
              'QuizGenerationService.processAIResponse',
            );
            
            // AI'ın geçersiz içerik ürettiği durumda fallback sorularını döndür
            return this.quizValidation.createFallbackQuestions(metadata);
          }
        }
      }

      // İstenen soru sayısıyla karşılaştırma
      if (
        metadata.questionCount &&
        questions.length !== metadata.questionCount
      ) {
        console.warn(
          `[QUIZ_DEBUG] [${traceId}] UYARI: İstenen soru sayısı (${metadata.questionCount}) ile üretilen soru sayısı (${questions.length}) eşleşmiyor!`,
        );

        if (questions.length === 0) {
          console.error(
            `[QUIZ_DEBUG] [${traceId}] KRİTİK HATA: Hiç geçerli soru üretilemedi!`,
          );
        } else if (questions.length < metadata.questionCount) {
          console.warn(
            `[QUIZ_DEBUG] [${traceId}] UYARI: Üretilen soru sayısı (${questions.length}) istenen sayıdan (${metadata.questionCount}) az`,
          );
        } else {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] BİLGİ: Üretilen soru sayısı (${questions.length}) istenen sayıdan (${metadata.questionCount}) fazla`,
          );
        }
      }

      // 4. Sonuçları logla
      console.log(
        `[QUIZ_DEBUG] [${traceId}] AI yanıtı işleme tamamlandı. Toplam: ${questions.length} geçerli soru`,
      );
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Üretilen sorular:`,
        questions.map((q) => ({
          id: q.id,
          question: q.questionText.substring(0, 30) + '...',
          difficulty: q.difficulty,
          subTopic: q.subTopicName,
        })),
      );

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
      console.error(
        `[QUIZ_DEBUG] [${traceId}] HATA: AI yanıtı işlenirken bir hata oluştu:`,
        error.message,
      );
      console.error(`[QUIZ_DEBUG] [${traceId}] Hata detayları:`, {
        errorName: error.name,
        stack: error.stack,
        code: error.code || 'bilinmiyor',
      });
      console.error(
        `[QUIZ_DEBUG] [${traceId}] Yanıt içeriği (ilk 500 karakter):`,
        aiResponseText?.substring(0, 500) + '...',
      );

      // Hatayı logla ve yeniden fırlat
      this.logger.error(
        `[${traceId}] AI yanıtı işlerken hata: ${error.message}`,
        'QuizGenerationService.processAIResponse',
        __filename,
        error,
      );

      throw error;
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
      const typedSubTopics = subTopics as {
        subTopicName: string;
        count: number;
        status?: string;
      }[];

      // Aktif olanları (soru sayısı > 0) ve beklemede olanları (soru sayısı = 0 veya status = 'pending') ayır
      const activeTopics = typedSubTopics.filter(
        (t) => t.status === 'active' && t.count > 0,
      );
      const pendingTopics = typedSubTopics.filter(
        (t) => t.status === 'pending' || t.count === 0,
      );

      let result = '';

      if (activeTopics.length > 0) {
        const totalActiveQuestions = activeTopics.reduce(
          (sum, topic) => sum + topic.count,
          0,
        );
        result += '## AKTİF KONULAR (SORU ÜRETİLECEK)\n\n';
        result +=
          '**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**\n\n';
        activeTopics.forEach((t, index) => {
          result += `${index + 1}. **${t.subTopicName}** (${t.count} soru)\n`;
        });
        result += `\n**Toplam Aktif: ${activeTopics.length} alt konu, ${totalActiveQuestions} soru**\n`;
      } else {
        result +=
          '## AKTİF KONULAR (SORU ÜRETİLECEK)\n\nSoru üretilecek aktif konu bulunamadı.\n';
      }

      if (pendingTopics.length > 0) {
        result += '\n## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)\n\n';
        result += '**Aşağıdaki konulardan soru üretilmeyecektir:**\n\n';
        pendingTopics.forEach((t, index) => {
          result += `${index + 1}. ${t.subTopicName}\n`;
        });
      } else {
        result +=
          '\n## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)\n\nBekleyen konu yok.\n';
      }

      return result;
    }

    // String dizisi ise (Bu durum artık distributeQuestionsAmongSubtopics tarafından ele alındığı için nadir olmalı)
    this.logger.warn(
      'formatTopics: Alt konular string dizisi olarak geldi, bu beklenen bir durum değil. Basit formatlama yapılacak.',
      'QuizGenerationService.formatTopics',
    );
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