import { Injectable, BadRequestException } from '@nestjs/common';
import {
  QuizQuestion,
  QuizMetadata,
  SubTopicType,
} from '../interfaces/quiz-question.interface';
import { LoggerService } from '../../common/services/logger.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import {
  QuizGenerationResponseSchema,
  QuizQuestionSchema,
} from '../schemas/quiz-question.schema';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { ConfigService } from '@nestjs/config';

// QuizMetadata tipinin güncellenmesi
// Bu satırı ekleyelim, eğer dosyanın başka bir yerinde tanımlanmışsa burayı silin
// QuizMetadata arayüzünü genişletelim
declare module '../interfaces' {
  interface QuizMetadata {
    courseName?: string;
    userId?: string;
    subTopicsCount?: number;
    // Diğer mevcut alanlar
    traceId: string;
  }
}

/**
 * Quiz yanıtlarını doğrulama servisi
 */
@Injectable()
export class QuizValidationService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private readonly normalizationService: NormalizationService,
    private readonly configService: ConfigService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  /**
   * AI yanıtını JSON'a dönüştürür
   * @param text AI yanıt metni
   * @param metadata Loglama için metadata
   */
  parseAIResponseToJSON<T>(
    text: string | undefined | null,
    metadata: QuizMetadata,
  ): T {
    const { traceId } = metadata;

    // Null veya undefined kontrolü
    if (!text) {
      this.logger.warn(
        `[${traceId}] Boş AI yanıtı. Fallback veri kullanılacak.`,
        'QuizValidationService.parseAIResponseToJSON',
      );
      return this.createFallbackData<T>('', metadata);
    }

    this.logger.debug(
      `[${traceId}] AI yanıtı parse ediliyor (${text.length} karakter)`,
      'QuizValidationService.parseAIResponseToJSON',
      __filename,
      undefined,
      { responseLength: text.length },
    );

    // Metin içinden JSON bölümünü çıkar
    const jsonContent = this.extractJsonFromAIResponse(text);

    if (!jsonContent) {
      this.logger.warn(
        `[${traceId}] AI yanıtından JSON içeriği çıkarılamadı. Ham yanıtın ilk 100 karakteri: "${text.substring(0, 100)}..."`,
        'QuizValidationService.parseAIResponseToJSON',
      );
      return this.createFallbackData<T>(text, metadata);
    }

    // JSON içeriğini temizle
    const cleanedJson = this.cleanJsonContent(jsonContent);

    try {
      // İlk olarak düzgün bir JSON parse etmeyi dene
      const parsedJson = JSON.parse(cleanedJson);

      // Başarılı parse durumunu logla
      this.logger.info(
        `[${traceId}] JSON başarıyla parse edildi.`,
        'QuizValidationService.parseAIResponseToJSON',
      );

      // Temel geçerlilik kontrolü
      if (
        !parsedJson ||
        (typeof parsedJson === 'object' && Object.keys(parsedJson).length === 0)
      ) {
        this.logger.warn(
          `[${traceId}] JSON parse edildi ancak boş nesne!`,
          'QuizValidationService.parseAIResponseToJSON',
        );
        return this.createFallbackData<T>(text, metadata);
      }

      // Ana veri yapısı kontrolü - eğer bir sorular dizisi yerine tek bir soru objesi geldiyse
      if (
        parsedJson.questionText &&
        parsedJson.options &&
        !parsedJson.questions
      ) {
        this.logger.info(
          `[${traceId}] Tek soru objesi tespit edildi, questions dizisine dönüştürülüyor.`,
          'QuizValidationService.parseAIResponseToJSON',
        );
        // Tek soruyu questions dizisine çevir
        return { questions: [parsedJson] } as unknown as T;
      }

      // Örnek soruları tespit et ve filtreleme
      if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
        // Örnek soruları tespit et (q1, q2 gibi id'lere sahip ya da Newton, Kapsülleme gibi örnek içerikli sorular)
        const filteredQuestions = parsedJson.questions.filter((q) => {
          // Örnek id'leri içeren soruları filtrele
          if (
            q.id &&
            (q.id === 'q1' ||
              q.id === 'q2' ||
              q.id === 'soru-id-auto-generated')
          ) {
            this.logger.warn(
              `[${traceId}] Örnek soru tespit edildi ve filtrelendi: ${q.id}`,
              'QuizValidationService.parseAIResponseToJSON',
            );
            return false;
          }

          // Örnek açıklamaları içeren soruları filtrele
          if (
            q.explanation &&
            (q.explanation.includes("Newton'un İkinci Hareket Kanunu") ||
              q.explanation.includes('Kapsülleme') ||
              q.explanation.includes(
                'verilerin ve davranışların tek bir birim içinde saklanması',
              ))
          ) {
            this.logger.warn(
              `[${traceId}] Örnek açıklaması içeren soru filtrelendi`,
              'QuizValidationService.parseAIResponseToJSON',
            );
            return false;
          }

          return true;
        });

        // Eğer tüm sorular filtrelendiyse
        if (filteredQuestions.length === 0 && parsedJson.questions.length > 0) {
          this.logger.warn(
            `[${traceId}] Tüm sorular örnek içerik olarak tespit edildi ve filtrelendi. Fallback kullanılacak.`,
            'QuizValidationService.parseAIResponseToJSON',
          );
          return this.createFallbackData<T>(text, metadata);
        }

        // Filtrelenmiş soruları güncelle
        parsedJson.questions = filteredQuestions;
      }

      return parsedJson as T;
    } catch (e) {
      // İlk deneme başarısız oldu, onarma denemeleri yap
      this.logger.warn(
        `[${traceId}] İlk JSON parse denemesi başarısız: ${e.message}. Alternatif parsing denenecek.`,
        'QuizValidationService.parseAIResponseToJSON',
      );

      try {
        // JSON içeriğini düzeltmeye çalış
        const fixedJson = this.attemptToFixJsonContent(cleanedJson);
        const parsedJson = JSON.parse(fixedJson);

        this.logger.info(
          `[${traceId}] Düzeltilmiş JSON başarıyla parse edildi.`,
          'QuizValidationService.parseAIResponseToJSON',
        );

        return parsedJson as T;
      } catch (fixError) {
        this.logger.warn(
          `[${traceId}] Düzeltilmiş JSON yine de parse edilemedi: ${fixError.message}`,
          'QuizValidationService.parseAIResponseToJSON',
        );

        // Son çare: İçindeki tüm "example" vb. alanları kaldır
        try {
          // JSON içindeki örnek şablonları ve açıklamaları kaldır
          const cleanedText = text
            .replace(/\/\*[\s\S]*?\*\//g, '') // C tarzı yorumları kaldır
            .replace(/\/\/.*$/gm, '') // Tek satırlık yorumları kaldır
            .replace(/```[^`]*```/g, '') // Markdown kod bloklarını kaldır
            .replace(/```json[^`]*```/g, '') // JSON kod bloklarını kaldır
            .replace(/exemple:|example:|örnek:/gi, '') // Örnek etiketlerini kaldır
            .replace(/-- ÖRNEK BAŞLANGIÇ[\s\S]*?-- ÖRNEK BİTİŞ --/g, '') // ÖRNEK BAŞLANGIÇ-BİTİŞ etiketleri arasını kaldır
            .replace(/\{[\s\S]*?"id":\s*"q\d+"[\s\S]*?\}/g, '') // q1, q2 gibi örnek ID'li objeleri kaldır
            .replace(
              /\{[\s\S]*?"id":\s*"soru-id-auto-generated"[\s\S]*?\}/g,
              '',
            ) // Otomatik oluşturulan örnek ID'leri kaldır
            .replace(/\n\s*\n/g, '\n'); // Fazla boş satırları kaldır

          // En dıştaki { } karakterlerini bul
          const firstBrace = cleanedText.indexOf('{');
          const lastBrace = cleanedText.lastIndexOf('}');

          if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            const jsonCandidate = cleanedText.substring(
              firstBrace,
              lastBrace + 1,
            );
            const parsedJson = JSON.parse(jsonCandidate);

            this.logger.info(
              `[${traceId}] Son çare temizleme ile JSON parse edildi.`,
              'QuizValidationService.parseAIResponseToJSON',
            );

            return parsedJson as T;
          }
        } catch (lastAttemptError) {
          this.logger.error(
            `[${traceId}] Tüm JSON parse denemeleri başarısız: ${lastAttemptError.message}`,
            'QuizValidationService.parseAIResponseToJSON',
          );
        }

        // Tüm denemeler başarısız, fallback veri döndür
        return this.createFallbackData<T>(text, metadata);
      }
    }
  }

  /**
   * JSON içeriğini temizler
   * @param content JSON içeren metin
   * @returns Temizlenmiş JSON içeriği
   */
  private cleanJsonContent(content: string): string {
    // Markdown kod bloklarını temizle
    let cleanedContent = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Başında ve sonunda JSON olmayan içeriği tespit et ve temizle
    const jsonStartIndex = cleanedContent.indexOf('{');
    const jsonEndIndex = cleanedContent.lastIndexOf('}');

    // Eğer geçerli bir JSON başlangıç ve bitiş işareti varsa
    if (
      jsonStartIndex !== -1 &&
      jsonEndIndex !== -1 &&
      jsonEndIndex > jsonStartIndex
    ) {
      cleanedContent = cleanedContent.substring(
        jsonStartIndex,
        jsonEndIndex + 1,
      );
    }

    // Alternatif olarak, array şeklindeki JSON için
    const arrayStartIndex = cleanedContent.indexOf('[');
    const arrayEndIndex = cleanedContent.lastIndexOf(']');

    // Eğer geçerli bir array başlangıç ve bitiş işareti varsa ve nesne bulunmadıysa
    if (
      arrayStartIndex !== -1 &&
      arrayEndIndex !== -1 &&
      arrayEndIndex > arrayStartIndex &&
      (jsonStartIndex === -1 || arrayStartIndex < jsonStartIndex)
    ) {
      cleanedContent = cleanedContent.substring(
        arrayStartIndex,
        arrayEndIndex + 1,
      );
    }

    return cleanedContent;
  }

  /**
   * JSON içeriğini düzeltmeye çalışır
   * @param content Düzeltilecek JSON içeriği
   * @returns Düzeltilmiş JSON içeriği
   */
  private attemptToFixJsonContent(content: string): string {
    let fixedContent = content;

    // Tırnak işaretlerini düzelt (eğik tırnak yerine düz tırnak)
    fixedContent = fixedContent.replace(/[""]/g, '"').replace(/['']/g, "'");

    // Çift virgülleri düzelt
    fixedContent = fixedContent.replace(/,,/g, ',');

    // Son virgülü düzelt (geçersiz JSON'a neden olabilir)
    fixedContent = fixedContent.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

    // Gövdede tırnak unutulmuş property'leri düzelt
    fixedContent = fixedContent.replace(
      /(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g,
      '$1"$2":',
    );

    return fixedContent;
  }

  /**
   * AI yanıtından JSON benzeri metni çıkarır
   * @param text AI yanıt metni
   * @returns JSON benzeri metin veya null
   */
  private extractJsonFromAIResponse(text: string): string | null {
    // JSON nesne veya dizi arama regex'leri
    const objectRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
    const arrayRegex =
      /\[(?:[^\[\]]|(?:\[(?:[^\[\]]|(?:\[[^\[\]]*\]))*\]))*\]/g;

    // Önce nesne ara
    const objectMatches = text.match(objectRegex);
    if (objectMatches && objectMatches.length > 0) {
      // En uzun nesne eşleşmesini al (muhtemelen ana JSON nesnesi)
      const mainObject = objectMatches.reduce(
        (prev, current) => (current.length > prev.length ? current : prev),
        '',
      );

      if (mainObject) {
        return mainObject;
      }
    }

    // Nesne bulunamazsa dizi ara
    const arrayMatches = text.match(arrayRegex);
    if (arrayMatches && arrayMatches.length > 0) {
      // En uzun dizi eşleşmesini al
      const mainArray = arrayMatches.reduce(
        (prev, current) => (current.length > prev.length ? current : prev),
        '',
      );

      if (mainArray) {
        return mainArray;
      }
    }

    return null;
  }

  /**
   * Parse işlemi başarısız olduğunda fallback veri oluşturur yerine hata fırlatır
   * @param text AI yanıt metni
   * @param metadata Metadata
   * @returns Fallback veri yerine hata fırlatır
   */
  private createFallbackData<T>(text: string, metadata: QuizMetadata): T {
    const { traceId, questionCount = 5, difficulty = 'mixed' } = metadata;

    // AI yanıtı işlemede hata oluştu, bunu logla
    this.logger.warn(
      `[${traceId}] AI yanıtı düzgün işlenemedi. Hata fırlatılacak.`,
      'QuizValidationService.createFallbackData',
    );

    // Sınav oluşturma hatasını detaylı loglama
    this.logger.logExamError(
      metadata.userId || 'anonymous',
      new Error('AI yanıtı işlenirken hata oluştu'),
      {
        traceId,
        rawResponseLength: text?.length || 0,
        documentId: metadata.documentId,
        subTopics: Array.isArray(metadata.subTopics)
          ? metadata.subTopics.slice(0, 3)
          : metadata.subTopics
            ? Object.keys(metadata.subTopics).slice(0, 3)
            : [],
        timestamp: new Date().toISOString(),
      },
    );

    // Örnek içeriklerin tespit edilip edilmediğini kontrol et
    const containsExamples = this.detectExampleContent(text);
    let errorDetails = {
      code: 'AI_RESPONSE_PARSING_ERROR',
      message:
        'AI yanıtı işlenirken bir hata oluştu. Sınav soruları oluşturulamadı.',
      details: {
        traceId,
        reason: 'Yanıt formatı geçersiz veya beklenen JSON şemasına uymuyor',
        responsePreview: text ? text.substring(0, 200) + '...' : 'Boş yanıt',
        errorType: 'PARSING_ERROR',
        containsExamples: false, // Varsayılan olarak ekle
      },
    };

    // Örnek içerik tespiti varsa, bu bilgiyi hata mesajına ekle
    if (containsExamples) {
      errorDetails.message =
        'AI yanıtında örnek içerik tespit edildi. Gerçek sorular yerine şablonda bulunan örnek sorular döndürüldü.';
      errorDetails.details.errorType = 'EXAMPLE_CONTENT_DETECTED';
      errorDetails.details.containsExamples = true;

      // Örnek içerik tespitini loglama
      this.logger.logExamProcess(
        `[HATA] ${metadata.userId || 'anonymous'} kullanıcısı için sınav oluşturulurken AI yanıtında örnek içerik tespit edildi.`,
        {
          traceId,
          userId: metadata.userId,
          timestamp: new Date().toISOString(),
          containsExamples: true,
        },
        'error',
      );
    }

    // AI yanıtının ilk 500 karakterini loglayalım (debugging amaçlı)
    if (text) {
      this.logger.debug(
        `[${traceId}] İşlenemeyen AI yanıtının başlangıcı: ${text.substring(0, 500)}...`,
        'QuizValidationService.createFallbackData',
      );

      // sinav-olusturma.log'a da kaydedelim
      this.logger.logExamProcess(
        `AI yanıtı işlenemedi - Trace ID: ${traceId}`,
        {
          responsePreview: text.substring(0, 300) + '...',
          metadata: JSON.stringify(metadata),
        },
        'error',
      );
    }

    // Ayrıntılı hata bilgisiyle BadRequestException fırlat
    throw new BadRequestException(errorDetails);
  }

  /**
   * Metinden örnek içerik olup olmadığını tespit eder
   * @param text AI yanıt metni
   * @returns Örnek içerik varsa true, yoksa false
   */
  private detectExampleContent(text: string): boolean {
    if (!text) return false;

    // Örnek içerikleri gösterdiğine dair işaretler
    const examplePatterns = [
      /örnek\s*\d+/i,
      /example\s*\d+/i,
      /-- ÖRNEK BAŞLAN[GI]*/i,
      /ÖRNEK BİTİŞ/i,
      /\*\*Örnek \d+/i,
      /id:\s*["']q\d+["']/i,
      /id:\s*["']soru-id/i,
      /newton.*ikinci hareket/i,
      /kapsülleme.*encapsulation/i,
    ];

    return examplePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Ham metinden soru nesneleri çıkarır
   * @param text Ham AI yanıt metni
   * @returns Çıkarılan soru nesneleri dizisi
   */
  private extractQuestionsFromText(text: string): QuizQuestion[] {
    if (!text) return [];

    const questions: QuizQuestion[] = [];

    try {
      // Metinde JSON bloklarını bul
      const jsonRegex = /\{[\s\S]*?\}/g;
      const matches = text.match(jsonRegex);

      if (!matches) return [];

      // Her bir JSON bloğunu parse etmeyi dene
      for (const match of matches) {
        try {
          const obj = JSON.parse(match);

          // Bir soru nesnesi olup olmadığını kontrol et
          if (
            obj &&
            typeof obj === 'object' &&
            (obj.questionText || obj.question) &&
            Array.isArray(obj.options)
          ) {
            // Eksik alanları varsayılan değerlerle tamamla
            const question: QuizQuestion = {
              id:
                obj.id || `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              questionText:
                obj.questionText || obj.question || 'Soru metni eksik',
              options: obj.options || [
                'A) Seçenek eksik',
                'B) Seçenek eksik',
                'C) Seçenek eksik',
                'D) Seçenek eksik',
              ],
              correctAnswer:
                obj.correctAnswer || obj.correct || obj.answer || 'Cevap eksik',
              explanation: obj.explanation || obj.reason || 'Açıklama eksik',
              subTopicName:
                obj.subTopicName || obj.subTopic || obj.topic || 'Genel Konu',
              normalizedSubTopicName:
                this.normalizationService.normalizeSubTopicName(
                  obj.subTopicName || obj.subTopic || obj.topic || 'Genel Konu',
                ),
              difficulty: obj.difficulty || 'medium',
              questionType: obj.questionType || 'multiple_choice',
              cognitiveDomain: obj.cognitiveDomain || 'understanding',
            };

            questions.push(question);
          }
        } catch (e) {
          // Bu JSON bloğu parse edilemiyor, atla
          continue;
        }
      }

      // Tüm metin içinde bir JSON nesnesi var mı kontrol et
      if (questions.length === 0) {
        try {
          // Tüm metni JSON olarak parse et
          const json = JSON.parse(text);

          // JSON bir dizi mi kontrol et
          if (Array.isArray(json)) {
            // Her bir öğenin soru olup olmadığını kontrol et
            const validQuestions = json
              .filter(
                (item) =>
                  item &&
                  typeof item === 'object' &&
                  (item.questionText || item.question) &&
                  Array.isArray(item.options),
              )
              .map((item) => ({
                id:
                  item.id ||
                  `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                questionText:
                  item.questionText || item.question || 'Soru metni eksik',
                options: item.options || [
                  'A) Seçenek eksik',
                  'B) Seçenek eksik',
                  'C) Seçenek eksik',
                  'D) Seçenek eksik',
                ],
                correctAnswer:
                  item.correctAnswer ||
                  item.correct ||
                  item.answer ||
                  'Cevap eksik',
                explanation:
                  item.explanation || item.reason || 'Açıklama eksik',
                subTopicName:
                  item.subTopicName ||
                  item.subTopic ||
                  item.topic ||
                  'Genel Konu',
                normalizedSubTopicName:
                  this.normalizationService.normalizeSubTopicName(
                    item.subTopicName ||
                      item.subTopic ||
                      item.topic ||
                      'Genel Konu',
                  ),
                difficulty: item.difficulty || 'medium',
                questionType: item.questionType || 'multiple_choice',
                cognitiveDomain: item.cognitiveDomain || 'understanding',
              }));

            if (validQuestions.length > 0) {
              questions.push(...validQuestions);
            }
          } else if (json.questions && Array.isArray(json.questions)) {
            // JSON bir nesne ve questions alanı var mı kontrol et
            const validQuestions = json.questions
              .filter(
                (item) =>
                  item &&
                  typeof item === 'object' &&
                  (item.questionText || item.question) &&
                  Array.isArray(item.options),
              )
              .map((item) => ({
                id:
                  item.id ||
                  `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                questionText:
                  item.questionText || item.question || 'Soru metni eksik',
                options: item.options || [
                  'A) Seçenek eksik',
                  'B) Seçenek eksik',
                  'C) Seçenek eksik',
                  'D) Seçenek eksik',
                ],
                correctAnswer:
                  item.correctAnswer ||
                  item.correct ||
                  item.answer ||
                  'Cevap eksik',
                explanation:
                  item.explanation || item.reason || 'Açıklama eksik',
                subTopicName:
                  item.subTopicName ||
                  item.subTopic ||
                  item.topic ||
                  'Genel Konu',
                normalizedSubTopicName:
                  this.normalizationService.normalizeSubTopicName(
                    item.subTopicName ||
                      item.subTopic ||
                      item.topic ||
                      'Genel Konu',
                  ),
                difficulty: item.difficulty || 'medium',
                questionType: item.questionType || 'multiple_choice',
                cognitiveDomain: item.cognitiveDomain || 'understanding',
              }));

            questions.push(...validQuestions);
          }
        } catch (e) {
          // Tüm metni JSON olarak parse edemedik, zaten tek tek bloklara ayırarak denemiştik
        }
      }
    } catch (error) {
      // Metinde JSON bloğu bulunamadı veya işleme hatalıydı
      this.logger.warn(
        `Metinden soru nesneleri çıkarılamadı: ${error.message}`,
        'QuizValidationService.extractQuestionsFromText',
      );
    }

    return questions;
  }

  /**
   * AI yanıt alınamadığında veya işlenemediğinde Fallback soru seti oluştur
   * @param metadata QuizMetadata
   * @returns Varsayılan soru seti
   */
  createFallbackQuestions(metadata: QuizMetadata): QuizQuestion[] {
    const {
      subTopicsCount = 0,
      subTopics = [],
      documentId = null,
      difficulty = 'medium',
      keywords = '',
      specialTopic = '',
      traceId = 'fallback',
    } = metadata;

    // Fallback soruların izlenebilmesi için log ekle
    this.logger.warn(
      `⚠️ [${traceId}] Fallback sorular oluşturuluyor (konu: ${
        Array.isArray(subTopics)
          ? typeof subTopics[0] === 'string'
            ? (subTopics as string[]).slice(0, 3).join(', ')
            : (subTopics as { subTopicName: string }[])
                .slice(0, 3)
                .map((t) => t.subTopicName)
                .join(', ')
          : 'bilinmeyen'
      }${
        Array.isArray(subTopics) && subTopics.length > 3 ? '...' : ''
      }, belge ID: ${documentId || 'yok'})`,
      'QuizValidationService.createFallbackQuestions',
    );

    this.flowTracker.trackStep(
      `AI yanıtı işlenemiyor, fallback sorular oluşturuluyor. Alt konular: ${Array.isArray(subTopics) ? subTopics.length : 0} adet`,
      'QuizValidationService',
    );

    // Eğer özel Eksaskala konusu ise, ilgili konuya özel sorular üret
    if (
      specialTopic === 'eksaskala' ||
      (Array.isArray(subTopics) &&
        subTopics.some((topic) => {
          if (typeof topic === 'string')
            return topic.toLowerCase().includes('eksaskala');
          if (typeof topic === 'object' && topic && topic.subTopicName)
            return topic.subTopicName.toLowerCase().includes('eksaskala');
          return false;
        }))
    ) {
      this.flowTracker.trackStep(
        `Eksaskala konusuna özel sorular üretiliyor`,
        'QuizValidationService',
      );
      return this.createEksaskalaSpecificQuestions(subTopics);
    }

    // Anahtar kelimeleri içeren konulara göre dinamik sorular üret
    // Anahtar kelimeler, quiz-generation.service.ts'de belge içeriğinden çıkarılıyor
    if (keywords && keywords.length > 0) {
      const keywordsList = keywords.split(',').map((k) => k.trim());
      if (keywordsList.length >= 3) {
        this.flowTracker.trackStep(
          `Belge içeriğinden çıkarılan ${keywordsList.length} anahtar kelimeye dayalı sorular üretiliyor`,
          'QuizValidationService',
        );
        return this.createKeywordBasedQuestions(keywordsList, subTopics);
      }
    }

    // Zorluk seviyesine göre farklı soru tipleri dağıt - İngilizce değerleri kullan
    // 'hard', 'medium', 'easy' değerlerini doğrudan kullan, Türkçe dönüşüm yapma
    const difficultyLevel = difficulty === 'mixed' ? 'medium' : difficulty;

    this.flowTracker.trackStep(
      `Standart fallback sorular üretiliyor, zorluk: ${difficultyLevel}`,
      'QuizValidationService',
    );

    // Varsayılan alt konu adı
    const defaultSubTopic = 'Genel Konular';

    // Alt konuları normalleştirmeyi kontrol et ve konu başlıklarını daha anlaşılır hale getir
    const normalizedTopics = Array.isArray(subTopics)
      ? subTopics.map((topic) => {
          // Null/undefined kontrolü
          if (!topic) return defaultSubTopic;
          // String mi object mi kontrolü
          if (typeof topic === 'string') {
            // Normalleştirme sırasında - veya _ karakterlerini boşluğa çevir
            return topic.replace(/-/g, ' ').replace(/_/g, ' ');
          } else if (typeof topic === 'object' && topic && topic.subTopicName) {
            return topic.subTopicName.replace(/-/g, ' ').replace(/_/g, ' ');
          }
          return defaultSubTopic;
        })
      : [defaultSubTopic];

    // subTopics'ten string değer çıkarma helper fonksiyonu
    const getTopicString = (index: number): string => {
      if (!Array.isArray(subTopics) || index >= subTopics.length)
        return defaultSubTopic;

      const topic = subTopics[index];
      if (typeof topic === 'string') return topic;
      if (typeof topic === 'object' && topic && topic.subTopicName)
        return topic.subTopicName;

      return defaultSubTopic;
    };

    return [
      {
        id: `fallback_1_${Date.now()}`,
        questionText: `${normalizedTopics[0] || 'Programlama'} alanında, aşağıdakilerden hangisi ${normalizedTopics[0] || 'yazılım geliştirme'} sürecinde en önemli adımdır?`,
        options: [
          'A) Algoritma tasarımı',
          'B) Kodun test edilmesi',
          'C) Gereksinimlerin belirlenmesi',
          'D) Dokümantasyon yazımı',
        ],
        correctAnswer: 'C) Gereksinimlerin belirlenmesi',
        explanation: `${normalizedTopics[0] || 'Yazılım geliştirme'} sürecinde gereksinimlerin doğru belirlenmesi, projenin başarısı için en kritik adımdır. Diğer tüm adımlar da önemlidir ancak doğru gereksinimler olmadan başarılı bir proje geliştirmek mümkün değildir.`,
        subTopicName: subTopicsCount > 0 ? getTopicString(0) : defaultSubTopic,
        normalizedSubTopicName:
          subTopicsCount > 0
            ? this.normalizationService.normalizeSubTopicName(getTopicString(0))
            : this.normalizationService.normalizeSubTopicName(defaultSubTopic),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `fallback_2_${Date.now()}`,
        questionText: `${normalizedTopics[1] || normalizedTopics[0] || 'Bilgisayar Bilimleri'} konusunda, hangi yaklaşım daha verimli sonuçlar verir?`,
        options: [
          'A) İteratif geliştirme',
          'B) Waterfall metodolojisi',
          'C) Ad-hoc yaklaşım',
          'D) Tek seferde tamamlama',
        ],
        correctAnswer: 'A) İteratif geliştirme',
        explanation: `${normalizedTopics[1] || normalizedTopics[0] || 'Bilgisayar Bilimleri'} alanında iteratif geliştirme, geri bildirim döngülerini kullanarak sürekli iyileştirme sağladığı için genellikle daha verimli sonuçlar verir. Bu yaklaşım, hataların erken tespit edilmesini ve düzeltilmesini kolaylaştırır.`,
        subTopicName:
          subTopicsCount > 1
            ? getTopicString(1)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Yazılım Metodolojileri',
        normalizedSubTopicName:
          subTopicsCount > 1
            ? this.normalizationService.normalizeSubTopicName(getTopicString(1))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Yazılım Metodolojileri',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `fallback_3_${Date.now()}`,
        questionText: `${normalizedTopics[2] || normalizedTopics[0] || 'Veri Yapıları'} bağlamında en önemli performans faktörü nedir?`,
        options: [
          'A) Bellek kullanımı',
          'B) Zaman karmaşıklığı',
          'C) Kod okunabilirliği',
          'D) Uygulanabilirlik kolaylığı',
        ],
        correctAnswer: 'B) Zaman karmaşıklığı',
        explanation: `${normalizedTopics[2] || normalizedTopics[0] || 'Veri Yapıları'} değerlendirilirken zaman karmaşıklığı, bir algoritmanın veri miktarına göre ölçeklenmesini temsil eder ve genellikle en kritik performans faktörüdür. Özellikle büyük veri setleriyle çalışırken, zaman karmaşıklığı algoritma seçiminde belirleyici rol oynar.`,
        subTopicName:
          subTopicsCount > 2
            ? getTopicString(2)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Algoritma Analizi',
        normalizedSubTopicName:
          subTopicsCount > 2
            ? this.normalizationService.normalizeSubTopicName(getTopicString(2))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Algoritma Analizi',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `fallback_4_${Date.now()}`,
        questionText: `${normalizedTopics[3] || normalizedTopics[0] || 'Modern Yazılım Geliştirme'} yaklaşımında aşağıdakilerden hangisi doğrudur?`,
        options: [
          'A) Ekip çalışması, bireysel çalışmadan her zaman daha verimsizdir',
          'B) Dokümantasyon, modern geliştirme süreçlerinde tamamen gereksizdir',
          'C) Sürekli entegrasyon (CI), kod kalitesini artırmaya yardımcı olur',
          'D) Test yazımı sadece projenin sonunda yapılmalıdır',
        ],
        correctAnswer:
          'C) Sürekli entegrasyon (CI), kod kalitesini artırmaya yardımcı olur',
        explanation: `${normalizedTopics[3] || normalizedTopics[0] || 'Modern Yazılım Geliştirme'} pratiklerinde sürekli entegrasyon (CI), kodun düzenli olarak entegre edilmesini, otomatik testlerden geçirilmesini sağlayarak hataların erken tespit edilmesine ve kod kalitesinin artmasına yardımcı olur.`,
        subTopicName:
          subTopicsCount > 3
            ? getTopicString(3)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Yazılım Kalitesi',
        normalizedSubTopicName:
          subTopicsCount > 3
            ? this.normalizationService.normalizeSubTopicName(getTopicString(3))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Yazılım Kalitesi',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `fallback_5_${Date.now()}`,
        questionText: `${normalizedTopics[4] || normalizedTopics[0] || 'Bilgisayar Bilimi'} alanında, aşağıdaki ifadelerden hangisi doğrudur?`,
        options: [
          'A) Her problemin polinom zamanda çözülebildiği matematiksel olarak kanıtlanmıştır',
          'B) Yapay zeka, tüm programlama problemlerini otomatik olarak çözebilir',
          'C) NP-Tam problemlerin verimli çözümleri henüz bulunamamıştır',
          'D) Bilgisayarlar, insan beyni ile aynı şekilde düşünür ve öğrenir',
        ],
        correctAnswer:
          'C) NP-Tam problemlerin verimli çözümleri henüz bulunamamıştır',
        explanation: `${normalizedTopics[4] || normalizedTopics[0] || 'Bilgisayar Bilimi'} alanında, NP-Tam problemlerin polinom zamanda çözülüp çözülemeyeceği (P=NP problemi) hala açık bir sorudur. Bu problemlerin verimli çözümleri henüz bulunamamıştır ve bu, teorik bilgisayar biliminin en önemli açık problemlerinden biridir.`,
        subTopicName:
          subTopicsCount > 4
            ? getTopicString(4)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Teorik Bilgisayar Bilimi',
        normalizedSubTopicName:
          subTopicsCount > 4
            ? this.normalizationService.normalizeSubTopicName(getTopicString(4))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Teorik Bilgisayar Bilimi',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
    ];
  }

  /**
   * Eksaskala konularına özel sorular üretir
   */
  private createEksaskalaSpecificQuestions(
    subTopics: SubTopicType,
  ): QuizQuestion[] {
    // Alt konu adlarını dizeye çevirelim
    const subTopicNames = Array.isArray(subTopics)
      ? typeof subTopics[0] === 'string'
        ? (subTopics as string[])
        : (
            subTopics as {
              subTopicName: string;
              count: number;
              status?: string;
            }[]
          ).map((t) => t.subTopicName)
      : ['Eksaskala'];

    this.logger.info(
      `Eksaskala özel soruları oluşturuluyor (${subTopicNames.length} konu)`,
      'QuizValidationService.createEksaskalaSpecificQuestions',
    );

    return [
      {
        id: `eks_fallback_1_${Date.now()}`,
        questionText:
          'Eksaskala bilgi işlem sistemlerinin karşılaştığı temel yazılım zorlukları arasında aşağıdakilerden hangisi yer almaz?',
        options: [
          'A) Ölçeklenebilirlik sorunları',
          'B) Hata toleransı ve dayanıklılık',
          'C) Masaüstü kullanıcı arayüzü tasarımı',
          'D) Milyonlarca çekirdeğin etkin yönetimi',
        ],
        correctAnswer: 'C) Masaüstü kullanıcı arayüzü tasarımı',
        explanation:
          'Eksaskala sistemlerinde masaüstü kullanıcı arayüzü tasarımı temel bir yazılım zorluğu değildir. Eksaskala sistemleri daha çok ölçeklenebilirlik, hata toleransı, yüksek performanslı hesaplama, veri hareketi ve milyonlarca işlemci çekirdeğinin etkin yönetimi gibi zorluklarla karşılaşır.',
        subTopicName: 'Eksaskala Yazılım Zorlukları',
        normalizedSubTopicName: 'eksaskala-yazilim-zorluklari',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `eks_fallback_2_${Date.now()}`,
        questionText:
          'Eksaskala sistemlerinin ölçeklenebilirlik özelliği için aşağıdaki ifadelerden hangisi doğrudur?',
        options: [
          'A) Yüzbinlerce çekirdekle çalışan uygulamalar mevcut HPC uygulamalarının doğrudan ölçeklendirilmesiyle elde edilebilir',
          'B) Ölçeklenebilirlikte bellek erişim desenleri önemsizdir',
          'C) Uygulamaların zayıf ölçeklenebilirliği bile eksaskala sistem performansını etkilemez',
          'D) İdeal ölçeklenebilirlikte, işlemci sayısı iki katına çıktığında uygulama hızı da iki katına çıkar',
        ],
        correctAnswer:
          'D) İdeal ölçeklenebilirlikte, işlemci sayısı iki katına çıktığında uygulama hızı da iki katına çıkar',
        explanation:
          'İdeal ölçeklenebilirlikte (lineer ölçeklenebilirlik), işlemci sayısı iki katına çıktığında uygulama hızı da iki katına çıkar. Bu, eksaskala sistemlerinin hedeflediği optimum durumdur. Ancak gerçekte, iletişim gecikmesi, senkronizasyon ve diğer faktörler nedeniyle ideal ölçeklenebilirliğe ulaşmak zordur.',
        subTopicName: 'Ölçeklenebilirlik',
        normalizedSubTopicName: 'olceklenebilirlik',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'applying',
      },
      {
        id: `eks_fallback_3_${Date.now()}`,
        questionText: 'Eksaskala sistemlerinde hata toleransı neden önemlidir?',
        options: [
          'A) Sistem maliyetini azaltmak için',
          'B) Kullanıcı arayüzünü geliştirmek için',
          'C) Çok sayıda bileşen olduğundan, bileşen arızaları kaçınılmazdır',
          'D) Sadece askeri uygulamalarda gerekli olduğu için',
        ],
        correctAnswer:
          'C) Çok sayıda bileşen olduğundan, bileşen arızaları kaçınılmazdır',
        explanation:
          'Eksaskala sistemleri milyonlarca hesaplama bileşeni içerir. Bileşen sayısı arttıkça, arıza olasılığı da artar. Bu nedenle, eksaskala sistemlerinde bileşen arızaları kaçınılmazdır ve sistem çalışmaya devam edebilmek için hata toleransı mekanizmalarına ihtiyaç duyar.',
        subTopicName: 'Hata Toleransı',
        normalizedSubTopicName: 'hata-toleransi',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `eks_fallback_4_${Date.now()}`,
        questionText:
          'Eksaskala sistemlerinde veri hareketi ile ilgili aşağıdaki ifadelerden hangisi doğrudur?',
        options: [
          'A) Veri hareketi, enerji tüketiminde önemsiz bir faktördür',
          'B) Yerel bellek erişimleri ile uzak bellek erişimleri arasında performans farkı yoktur',
          'C) Veri hareketini minimize etmek, enerji verimliliğini artırır',
          'D) Tüm veriler her zaman tüm işlemcilere eşit mesafededir',
        ],
        correctAnswer:
          'C) Veri hareketini minimize etmek, enerji verimliliğini artırır',
        explanation:
          'Eksaskala sistemlerinde veri hareketi, hem enerji tüketiminde hem de performansta önemli bir faktördür. Veri hareketini minimize etmek, enerji verimliliğini artırır çünkü veri transferi işlemci hesaplamalarından daha fazla enerji tüketir. Bu nedenle, veri yerleşimi ve veri erişim desenleri eksaskala uygulamalarında kritik öneme sahiptir.',
        subTopicName: 'Veri Hareketi',
        normalizedSubTopicName: 'veri-hareketi',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `eks_fallback_5_${Date.now()}`,
        questionText:
          'Eksaskala işletim sistemleri için aşağıdakilerden hangisi doğrudur?',
        options: [
          'A) Geleneksel işletim sistemleri eksaskala sistemler için yeterlidir',
          'B) Hafif çekirdek (lightweight kernel) tasarımı, sistem kaynaklarını daha verimli kullanır',
          'C) İşletim sistemi servisleri tüm çekirdeklerde tam olarak çalışmalıdır',
          'D) Eksaskala sistemlerde işletim sistemi kullanmak gereksizdir',
        ],
        correctAnswer:
          'B) Hafif çekirdek (lightweight kernel) tasarımı, sistem kaynaklarını daha verimli kullanır',
        explanation:
          'Eksaskala sistemlerinde, hafif çekirdek (lightweight kernel) tasarımı tercih edilir çünkü sistem kaynaklarını daha verimli kullanır. Geleneksel işletim sistemleri, her düğümde tam olarak çalıştığında önemli miktarda kaynak tüketir ve ölçeklenebilirlik sorunlarına neden olabilir. Hafif çekirdek tasarımı, işletim sistemi servislerinin minimize edilmesini ve hesaplama düğümlerinde sadece gerekli servislerin çalışmasını sağlar.',
        subTopicName: 'Hafif Çekirdek Tasarımı',
        normalizedSubTopicName: 'hafif-cekirdek-tasarimi',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        cognitiveDomain: 'evaluating',
      },
    ];
  }

  /**
   * Belge içeriğinden çıkarılan anahtar kelimelere dayalı sorular üretir
   */
  private createKeywordBasedQuestions(
    keywords: string[],
    subTopics: SubTopicType,
  ): QuizQuestion[] {
    // Alt konu adlarını dizeye çevirelim
    const subTopicNames = Array.isArray(subTopics)
      ? typeof subTopics[0] === 'string'
        ? (subTopics as string[])
        : (
            subTopics as {
              subTopicName: string;
              count: number;
              status?: string;
            }[]
          ).map((t) => t.subTopicName)
      : [];

    this.logger.info(
      `Anahtar kelime tabanlı sorular oluşturuluyor (${keywords.slice(0, 5).join(', ')}...)`,
      'QuizValidationService.createKeywordBasedQuestions',
    );

    const topKeywords = keywords.slice(0, 15); // En önemli 15 anahtar kelime
    const questions: QuizQuestion[] = [];

    // İlk 5 alt konu veya daha azı varsa hepsini kullan
    const availableTopics = subTopicNames
      .filter((topic) => topic) // undefined/null değerleri filtrele
      .slice(0, Math.min(5, subTopicNames.length));

    // Alt konu yoksa varsayılan konular kullan
    const defaultTopics = [
      'Genel Kavramlar',
      'Temel İlkeler',
      'Uygulama Alanları',
      'Teorik Çerçeve',
      'Temel Tanımlar',
    ];

    // Kullanılacak alt konular
    const topicsToUse =
      availableTopics.length > 0 ? availableTopics : defaultTopics;

    // Farklı soru kalıpları
    const questionTemplates = [
      (topic, kw1, kw2) =>
        `"${topic}" konusunda, ${kw1} ve ${kw2} arasındaki ilişki nedir?`,
      (topic, kw1, kw2) => `${topic} alanında ${kw1} kavramının önemi nedir?`,
      (topic, kw1, kw2) =>
        `${topic} kapsamında ${kw1}, ${kw2} üzerinde nasıl bir etki yaratır?`,
      (topic, kw1, kw2) =>
        `${topic} yaklaşımında ${kw1} ve ${kw2} nasıl kullanılır?`,
      (topic, kw1, kw2) =>
        `${kw1} ve ${kw2} arasındaki fark nedir (${topic} bağlamında)?`,
    ];

    // Farklı seçenek kalıpları
    const optionTemplates = [
      (kw1, kw2, kw3) => [
        `A) ${kw1}, ${kw2}'nin bir alt kümesidir`,
        `B) ${kw2}, ${kw1}'nin özel bir uygulamasıdır`,
        `C) ${kw1} ve ${kw2} tamamen farklı kavramlardır`,
        `D) ${kw1} ve ${kw2} tamamlayıcı kavramlardır`,
      ],
      (kw1, kw2, kw3) => [
        `A) ${kw1}, sadece teorik alanlarda önemlidir`,
        `B) ${kw1}, sistem performansını doğrudan etkiler`,
        `C) ${kw1}, ${kw3} ile ilişkili değildir`,
        `D) ${kw1}, sadece ${kw2} olmadığında kullanılır`,
      ],
      (kw1, kw2, kw3) => [
        `A) ${kw1}, ${kw2}'yi tamamen ortadan kaldırır`,
        `B) ${kw1}, ${kw2}'nin etkinliğini artırır`,
        `C) ${kw1} ve ${kw2} arasında hiçbir etkileşim yoktur`,
        `D) ${kw1}, ${kw2} üzerinde değişken etkilere sahiptir`,
      ],
    ];

    // Doğru cevap-açıklama kalıpları
    const correctAnswerTemplates = [
      (kw1, kw2, kw3, topic) => ({
        answer: `D) ${kw1} ve ${kw2} tamamlayıcı kavramlardır`,
        explanation: `"${topic}" alanında, ${kw1} ve ${kw2} genellikle tamamlayıcı kavramlar olarak düşünülür. ${kw1} daha çok ${kw3} odaklıyken, ${kw2} ise sistemin farklı yönlerine odaklanır. Bu iki kavram birlikte ele alındığında daha kapsamlı bir yaklaşım sağlar.`,
      }),
      (kw1, kw2, kw3, topic) => ({
        answer: `B) ${kw1}, sistem performansını doğrudan etkiler`,
        explanation: `${topic} bağlamında, ${kw1} kavramı sistem performansını doğrudan etkiler çünkü ${kw2} ve ${kw3} ile yakından ilişkilidir. Bu kavram, optimal sistem kaynak kullanımı sağlar ve verimliliği artırır.`,
      }),
      (kw1, kw2, kw3, topic) => ({
        answer: `B) ${kw1}, ${kw2}'nin etkinliğini artırır`,
        explanation: `${topic} alanında, ${kw1} genellikle ${kw2}'nin etkinliğini artırır. Bu etki, ${kw3} süreçlerini optimize ederek gerçekleşir ve sistemin genel performansını iyileştirir.`,
      }),
    ];

    // Her bir alt konu için bir soru oluştur
    topicsToUse.forEach((topic, index) => {
      // Normalleştirilmiş konu adı
      const normalizedTopic = topic.replace(/-/g, ' ').replace(/_/g, ' ');

      // Kullanılacak anahtar kelimeler (her soru için farklı)
      const kw1 = topKeywords[index % topKeywords.length];
      const kw2 = topKeywords[(index + 1) % topKeywords.length];
      const kw3 = topKeywords[(index + 2) % topKeywords.length];

      // Soru şablonu seç
      const questionTemplate =
        questionTemplates[index % questionTemplates.length];

      // Seçenek şablonu seç
      const optionTemplate = optionTemplates[index % optionTemplates.length];

      // Doğru cevap ve açıklama şablonu seç
      const correctTemplate =
        correctAnswerTemplates[index % correctAnswerTemplates.length];

      // Doğru cevap ve açıklama oluştur
      const { answer, explanation } = correctTemplate(
        kw1,
        kw2,
        kw3,
        normalizedTopic,
      );

      // Soru metni oluştur
      const questionText = questionTemplate(normalizedTopic, kw1, kw2);

      // Seçenekleri oluştur
      const options = optionTemplate(kw1, kw2, kw3);

      // Konu null/undefined kontrolü
      const safeTopicName = topic || 'Genel Kavramlar';

      questions.push({
        id: `keyword_fallback_${index + 1}_${Date.now()}`,
        questionText,
        options,
        correctAnswer: answer,
        explanation,
        subTopicName: safeTopicName,
        normalizedSubTopicName:
          this.normalizationService.normalizeSubTopicName(safeTopicName),
        difficulty: 'medium', // Türkçe değer yerine İngilizce değer kullan
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      });
    });

    // Eğer yeterli soru oluşturulmadıysa, genel sorularla tamamla
    if (questions.length < 5) {
      const generalTopics = [
        'Genel Kavramlar',
        'Temel İlkeler',
        'Uygulama Alanları',
        'Geleceğe Yönelik Yaklaşımlar',
      ];

      // Eksik sorular için genel konular üret
      for (let i = questions.length; i < 5; i++) {
        const topicIndex = i % generalTopics.length;
        const kw1 = topKeywords[i % topKeywords.length];
        const kw2 = topKeywords[(i + 3) % topKeywords.length];
        const kw3 = topKeywords[(i + 5) % topKeywords.length];

        // Farklı bir soru şablonu kullan
        const qIndex = (i + topicsToUse.length) % questionTemplates.length;
        const questionText = questionTemplates[qIndex](
          generalTopics[topicIndex],
          kw1,
          kw2,
        );

        // Farklı bir seçenek şablonu kullan
        const oIndex = (i + topicsToUse.length) % optionTemplates.length;
        const options = optionTemplates[oIndex](kw1, kw2, kw3);

        // Farklı bir doğru cevap şablonu kullan
        const cIndex = (i + topicsToUse.length) % correctAnswerTemplates.length;
        const { answer, explanation } = correctAnswerTemplates[cIndex](
          kw1,
          kw2,
          kw3,
          generalTopics[topicIndex],
        );

        // Konu adı
        const safeTopicName = generalTopics[topicIndex];

        questions.push({
          id: `keyword_fallback_general_${i + 1}_${Date.now()}`,
          questionText,
          options,
          correctAnswer: answer,
          explanation,
          subTopicName: safeTopicName,
          normalizedSubTopicName:
            this.normalizationService.normalizeSubTopicName(safeTopicName),
          difficulty: 'medium', // Türkçe değer yerine İngilizce değer kullan
          questionType: 'multiple_choice',
          cognitiveDomain: 'analyzing',
        });
      }
    }

    return questions;
  }

  /**
   * Zod şeması ile quiz yanıtını doğrular
   * @param parsedJson Parse edilmiş JSON
   * @param metadata Loglama için metadata
   * @param rawResponse Ham yanıt
   */
  validateQuizResponseSchema(
    parsedJson: any,
    metadata: QuizMetadata,
    rawResponse: string,
  ) {
    const { traceId } = metadata;

    this.flowTracker.trackStep(
      'Şema validasyonu yapılıyor',
      'QuizValidationService.validateQuizResponseSchema',
    );

    try {
      // Hata ayıklama için JSON yapısını logla
      this.logger.debug(
        `[${traceId}] JSON şema validasyonu başlatılıyor. Yapı: ${JSON.stringify(
          Object.keys(parsedJson || {}),
        )}`,
        'QuizValidationService.validateQuizResponseSchema',
      );

      // Gelen veri doğrudan bir dizi ise, questions dizisine dönüştür
      if (Array.isArray(parsedJson)) {
        this.logger.debug(
          `[${traceId}] Dizi olarak gelen yanıt, questions formatına dönüştürülüyor`,
          'QuizValidationService.validateQuizResponseSchema',
        );
        parsedJson = { questions: parsedJson };
      }

      // Yanıt içinde questions yoksa (ama doğrudan soru listesi içerik olabilir)
      if (!parsedJson.questions) {
        this.logger.debug(
          `[${traceId}] Yanıtta 'questions' alanı bulunamadı, alternatif yapılar aranıyor`,
          'QuizValidationService.validateQuizResponseSchema',
        );

        // ID, questionText ve options içeren nesneleri bul
        const foundQuestions: Record<string, any>[] = [];

        // Gelen objede soru benzeri alanlar var mı kontrol et
        const keys = Object.keys(parsedJson);
        const containsQuestionProperties = keys.some(
          (key) =>
            typeof parsedJson[key] === 'object' &&
            parsedJson[key] &&
            parsedJson[key].questionText &&
            Array.isArray(parsedJson[key].options),
        );

        if (containsQuestionProperties) {
          this.logger.debug(
            `[${traceId}] JSON içinde soru benzeri nesneler tespit edildi, bunları işlemeye çalışılacak`,
            'QuizValidationService.validateQuizResponseSchema',
          );

          for (const key of keys) {
            const obj = parsedJson[key];
            if (
              typeof obj === 'object' &&
              obj &&
              obj.questionText &&
              Array.isArray(obj.options)
            ) {
              foundQuestions.push(obj);
            }
          }
        }

        // Eğer hala soru bulunamadıysa, içiçe yapıları kontrol et
        if (foundQuestions.length === 0) {
          for (const key of Object.keys(parsedJson)) {
            const value = parsedJson[key];

            // İç içe yapılarda soru dizisi olabilir
            if (Array.isArray(value) && value.length > 0) {
              const likelyQuestions = value.filter(
                (item) =>
                  typeof item === 'object' &&
                  item &&
                  item.questionText &&
                  Array.isArray(item.options),
              );

              if (likelyQuestions.length > 0) {
                this.logger.debug(
                  `[${traceId}] '${key}' alanı altında ${likelyQuestions.length} adet soru bulundu`,
                  'QuizValidationService.validateQuizResponseSchema',
                );
                foundQuestions.push(
                  ...(likelyQuestions as Record<string, any>[]),
                );
              }
            }
          }
        }

        // Son bir deneme: metinde JSON bloklarını bul
        if (foundQuestions.length === 0 && rawResponse) {
          this.logger.debug(
            `[${traceId}] Standart yapıda sorular bulunamadı, ham yanıttan sorular çıkarılmaya çalışılacak`,
            'QuizValidationService.validateQuizResponseSchema',
          );

          const extractedQuestions = this.extractQuestionsFromText(rawResponse);
          if (extractedQuestions && extractedQuestions.length > 0) {
            // QuizQuestion tipindeki soruları foundQuestions dizisine ekle
            extractedQuestions.forEach((question) => {
              foundQuestions.push(question as unknown as Record<string, any>);
            });
            this.logger.info(
              `[${traceId}] Ham yanıttan ${extractedQuestions.length} adet soru çıkarıldı`,
              'QuizValidationService.validateQuizResponseSchema',
            );
          }
        }

        if (foundQuestions.length > 0) {
          return { questions: foundQuestions };
        }

        this.logger.error(
          `[${traceId}] Quiz AI yanıtında 'questions' dizisi bulunamadı`,
          'QuizValidationService.validateQuizResponseSchema',
          __filename,
          undefined,
          undefined,
          { parsedJsonKeys: Object.keys(parsedJson) },
        );

        // Örnek içerik tespit edildi mi kontrol et
        const containsExamples = this.detectExampleContent(rawResponse);

        // questions bulunamadıysa hata fırlat
        throw new BadRequestException({
          code: 'MISSING_QUESTIONS_FIELD',
          message: containsExamples
            ? 'AI yanıtı şablondaki örnekleri yanıt olarak döndürdü'
            : 'AI yanıtında "questions" alanı bulunamadı',
          details: {
            traceId,
            availableKeys: Object.keys(parsedJson),
            expectedKey: 'questions',
            rawResponsePreview: rawResponse.substring(0, 100) + '...',
            containsExampleContent: containsExamples,
          },
        });
      }

      // Şema doğrulaması yap
      try {
        return QuizGenerationResponseSchema.parse(parsedJson);
      } catch (zodError) {
        // Zod hatası durumunda daha toleranslı doğrulama deneyelim
        this.logger.warn(
          `[${traceId}] Strict şema validasyonu başarısız oldu, esnek doğrulama deneniyor: ${zodError.message}`,
          'QuizValidationService.validateQuizResponseSchema',
        );

        // Soruları özel işleyerek doğrulama
        if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
          // Her bir soruyu temizle ve gerekli alanları ekle
          const cleanedQuestions = parsedJson.questions.map((q, index) => {
            // Zorluk seviyesini Türkçe'den İngilizce'ye çevir
            const difficulty = q.difficulty || metadata.difficulty || 'medium';
            const translatedDifficulty =
              this.translateDifficultyToEnglish(difficulty);

            return {
              id: q.id || `q_${Date.now()}_${index}`,
              questionText:
                q.questionText || q.question || q.text || 'Soru metni eksik',
              options: Array.isArray(q.options)
                ? q.options
                : [
                    'A) Seçenek eksik',
                    'B) Seçenek eksik',
                    'C) Seçenek eksik',
                    'D) Seçenek eksik',
                  ],
              correctAnswer:
                q.correctAnswer || q.correct || q.answer || 'Cevap eksik',
              explanation: q.explanation || q.reason || 'Açıklama eksik',
              subTopicName:
                q.subTopicName ||
                q.subTopic ||
                q.topic ||
                metadata.subTopics?.[0] ||
                'Genel Konu',
              normalizedSubTopicName:
                this.normalizationService.normalizeSubTopicName(
                  q.subTopicName ||
                    q.subTopic ||
                    q.topic ||
                    metadata.subTopics?.[0] ||
                    'Genel Konu',
                ),
              difficulty: translatedDifficulty,
              questionType: q.questionType || 'multiple_choice',
              cognitiveDomain: q.cognitiveDomain || 'understanding',
            };
          });

          return { questions: cleanedQuestions };
        }

        // Bu da başarısızsa orjinal hatayı fırlat
        throw zodError;
      }
    } catch (validationError) {
      this.logger.error(
        `[${traceId}] Quiz AI yanıtı şema validasyonundan geçemedi: ${validationError.message}`,
        'QuizValidationService.validateQuizResponseSchema',
        undefined,
        validationError,
      );

      // Örnek içerik tespit edildi mi kontrol et
      const containsExamples = this.detectExampleContent(rawResponse);

      // Log için debug bilgisi (ayrı bir log kaydı olarak)
      this.logger.debug(
        `[${traceId}] Hatalı yanıt detayları: ${rawResponse?.substring(0, 1000)}, Yapı: ${JSON.stringify(Object.keys(parsedJson || {}))}, Örnek içeriği: ${containsExamples}`,
        'QuizValidationService.validateQuizResponseSchema',
      );

      // Hata fırlat
      throw new BadRequestException({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: containsExamples
          ? 'AI yanıtında örnek içerik tespit edildi ve şema doğrulaması başarısız oldu'
          : 'AI yanıtı şema validasyonundan geçemedi',
        details: {
          traceId,
          validationError: validationError.message,
          rawResponsePreview: rawResponse.substring(0, 200) + '...',
          containsExamples,
        },
      });
    }
  }

  /**
   * Türkçe zorluk seviyelerini İngilizce karşılıklarına çevirir
   * @param difficulty Türkçe zorluk seviyesi
   * @returns İngilizce zorluk seviyesi
   */
  private translateDifficultyToEnglish(difficulty: string): string {
    if (!difficulty) return 'medium';

    const lowerDifficulty = difficulty.toLowerCase().trim();

    switch (lowerDifficulty) {
      case 'kolay':
        return 'easy';
      case 'orta':
        return 'medium';
      case 'zor':
        return 'hard';
      case 'karışık':
      case 'karısık':
      case 'karisik':
      case 'karma':
        return 'mixed';
      default:
        // Halihazırda İngilizce değer mi kontrol et
        if (['easy', 'medium', 'hard', 'mixed'].includes(lowerDifficulty)) {
          return lowerDifficulty;
        }
        // Varsayılan değeri döndür
        return 'medium';
    }
  }

  /**
   * Doğrulanmış JSON'dan quiz soruları oluşturur
   * @param validatedData Doğrulanmış veri
   * @param metadata Loglama için metadata
   */
  transformAndValidateQuestions(
    validatedData: any,
    metadata: QuizMetadata,
  ): QuizQuestion[] {
    const { traceId } = metadata;

    const questionsArray = Array.isArray(validatedData)
      ? validatedData
      : validatedData?.questions;

    if (!questionsArray || !Array.isArray(questionsArray)) {
      this.logger.error(
        `[${traceId}] Validasyon sonrası 'questions' array bulunamadı veya array değil. Alınan veri: ${JSON.stringify(validatedData)?.substring(0, 500)}`,
        'QuizValidationService.transformAndValidateQuestions',
      );

      // Hata fırlat
      throw new BadRequestException({
        code: 'INVALID_QUESTIONS_FORMAT',
        message: 'Doğrulanmış veride soru dizisi bulunamadı',
        details: {
          traceId,
          receivedStructure:
            JSON.stringify(validatedData).substring(0, 200) + '...',
        },
      });
    }

    const validQuestions: QuizQuestion[] = [];
    const invalidQuestions: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < questionsArray.length; i++) {
      const q_input = questionsArray[i];

      try {
        // subTopic veya subTopicName alanını al
        let subTopicNameFromInput: string;

        // API yanıtındaki olası subTopic/subTopicName formatlarını kontrol et
        if (typeof q_input.subTopicName === 'string' && q_input.subTopicName) {
          // Doğrudan subTopicName alanı varsa
          subTopicNameFromInput = q_input.subTopicName;
        } else if (typeof q_input.subTopic === 'string' && q_input.subTopic) {
          // Doğrudan string olarak subTopic varsa
          subTopicNameFromInput = q_input.subTopic;
        } else if (
          typeof q_input.subTopic === 'object' &&
          q_input.subTopic !== null
        ) {
          // subTopic bir nesne ise (subTopicName veya name alanı olabilir)
          subTopicNameFromInput =
            q_input.subTopic.subTopicName ||
            q_input.subTopic.name ||
            'Bilinmeyen Konu';
        } else {
          // Hiçbir alt konu bilgisi bulunamadıysa
          subTopicNameFromInput = 'Bilinmeyen Konu';
        }

        // Alt konu adını normalize et
        let normalizedSubTopicName: string;
        try {
          normalizedSubTopicName =
            this.normalizationService.normalizeSubTopicName(
              subTopicNameFromInput,
            );
        } catch (normError) {
          this.logger.warn(
            `[${traceId}] Alt konu normalizasyonu sırasında hata (${subTopicNameFromInput}): ${normError.message}`,
            'QuizValidationService.transformAndValidateQuestions',
          );
          normalizedSubTopicName = subTopicNameFromInput.toLowerCase().trim();
        }

        // Zorluk seviyesini Türkçe'den İngilizce'ye çevir
        const translatedDifficulty = this.translateDifficultyToEnglish(
          q_input.difficulty,
        );

        // QuizQuestion interface'ine göre veri oluştur
        const questionData = {
          id: q_input.id || `q_${Date.now()}_${i}`,
          questionText: q_input.questionText,
          options: q_input.options,
          correctAnswer: q_input.correctAnswer,
          explanation: q_input.explanation || 'Açıklama yok',
          subTopicName: subTopicNameFromInput,
          normalizedSubTopicName: normalizedSubTopicName,
          difficulty: translatedDifficulty,
          questionType: q_input.questionType || 'multiple_choice',
          cognitiveDomain: q_input.cognitiveDomain || 'understanding',
        };

        // Zod şemasıyla validasyon
        const validatedQuestion = QuizQuestionSchema.parse(questionData);
        validQuestions.push(questionData as QuizQuestion);
      } catch (questionValidationError) {
        this.logger.warn(
          `[${traceId}] Oluşturulan quiz sorusu (ID: ${q_input.id || `q_${i}`}) validasyondan geçemedi: ${questionValidationError.message}. Soru atlanacak.`,
          'QuizValidationService.transformAndValidateQuestions',
          undefined,
          questionValidationError,
        );

        // Hatalı soruları kaydet
        invalidQuestions.push({
          index: i,
          error: questionValidationError.message,
        });

        // Hatalı soruyu atla ve diğerlerine devam et
        continue;
      }
    }

    // Eğer hiç geçerli soru yoksa, hata fırlat
    if (validQuestions.length === 0) {
      this.logger.warn(
        `[${traceId}] Hiç geçerli soru oluşturulamadı, hata fırlatılıyor`,
        'QuizValidationService.transformAndValidateQuestions',
      );

      throw new BadRequestException({
        code: 'NO_VALID_QUESTIONS',
        message: 'Hiç geçerli soru oluşturulamadı',
        details: {
          traceId,
          invalidQuestionsCount: invalidQuestions.length,
          errors: invalidQuestions.slice(0, 5), // İlk 5 hatayı göster
          totalQuestionsInResponse: questionsArray.length,
        },
      });
    }

    // Bazı sorular hatalıysa loglayalım
    if (invalidQuestions.length > 0) {
      this.logger.info(
        `[${traceId}] ${validQuestions.length} geçerli soru oluşturuldu, ${invalidQuestions.length} soru geçersiz olduğu için atlandı`,
        'QuizValidationService.transformAndValidateQuestions',
      );
    }

    return validQuestions;
  }
}
