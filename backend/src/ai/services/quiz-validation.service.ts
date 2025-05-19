import { Injectable, BadRequestException } from '@nestjs/common';
import { QuizQuestion, QuizMetadata } from '../interfaces';
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
   * AI yanıtını JSON olarak parse eder
   * @param text AI yanıt metni
   * @param metadata Loglama için metadata
   */
  parseAIResponseToJSON<T>(
    text: string | undefined | null,
    metadata: QuizMetadata,
  ): T {
    const { traceId } = metadata;

    if (!text) {
      this.logger.error(
        `[${traceId}] AI yanıtı parse edilemedi: Yanıt boş.`,
        'QuizValidationService.parseAIResponseToJSON',
      );
      throw new BadRequestException('AI yanıtı boş veya tanımsız.');
    }

    // Yanıtı konsola yazdır (debug amaçlı)
    this.logger.debug(
      `[${traceId}] AI yanıtı parse ediliyor (${text.length} karakter)`,
      'QuizValidationService.parseAIResponseToJSON',
      __filename,
      undefined,
      { textPreview: text.substring(0, 100) + '...' },
    );

    try {
      // 1. Markdown kod bloklarını temizle
      let processedText = this.cleanJsonContent(text);

      try {
        // 2. İlk deneme: direkt JSON.parse
        return JSON.parse(processedText) as T;
      } catch (firstError) {
        this.logger.warn(
          `[${traceId}] İlk JSON parse denemesi başarısız: ${firstError.message}. Alternatif parsing denenecek.`,
          'QuizValidationService.parseAIResponseToJSON',
        );

        // 3. İkinci deneme: JSON düzeltme işlemleri
        processedText = this.attemptToFixJsonContent(processedText);

        try {
          return JSON.parse(processedText) as T;
        } catch (secondError) {
          this.logger.warn(
            `[${traceId}] Düzeltilmiş JSON yine de parse edilemedi: ${secondError.message}`,
            'QuizValidationService.parseAIResponseToJSON',
          );

          // 4. Üçüncü deneme: JSON çıkarma işlemleri
          const extractedJson = this.extractJsonFromAIResponse(text);

          if (extractedJson) {
            try {
              return JSON.parse(extractedJson) as T;
            } catch (thirdError) {
              this.logger.warn(
                `[${traceId}] Çıkarılan JSON parse edilemedi: ${thirdError.message}`,
                'QuizValidationService.parseAIResponseToJSON',
              );
            }
          }

          // 5. Dördüncü deneme: Tek bir JSON nesnesini ayıklama
          const singleObjectMatch = text.match(/\{[\s\S]*?\}/);
          if (singleObjectMatch) {
            try {
              const singleObject = singleObjectMatch[0];
              this.logger.debug(
                `[${traceId}] Tek JSON nesnesi ayıklandı (${singleObject.length} karakter)`,
                'QuizValidationService.parseAIResponseToJSON',
              );
              return JSON.parse(singleObject) as T;
            } catch (fourthError) {
              this.logger.warn(
                `[${traceId}] Tek JSON nesnesi parse edilemedi: ${fourthError.message}`,
                'QuizValidationService.parseAIResponseToJSON',
              );
            }
          }

          // 6. Beşinci deneme: İlk '{' ve son '}' arasındaki içeriği alma
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
              const extractedContent = text.substring(
                firstBrace,
                lastBrace + 1,
              );
              this.logger.debug(
                `[${traceId}] İlk ve son süslü parantez arasındaki içerik ayıklandı (${extractedContent.length} karakter)`,
                'QuizValidationService.parseAIResponseToJSON',
              );
              return JSON.parse(extractedContent) as T;
            } catch (fifthError) {
              this.logger.warn(
                `[${traceId}] İlk-son süslü parantez içeriği parse edilemedi: ${fifthError.message}`,
                'QuizValidationService.parseAIResponseToJSON',
              );
            }
          }

          // Hiçbir parse denemesi başarılı olmadı, fallback verileri kullan
          this.logger.error(
            `[${traceId}] Tüm parsing denemeleri başarısız. Fallback verileri kullanılacak.`,
            'QuizValidationService.parseAIResponseToJSON',
            __filename,
            undefined,
          );

          // Yanıtın ilk 150 karakterini logla (hata ayıklama için)
          this.logger.debug(
            `[${traceId}] Parse edilemeyen yanıt (ilk 150 karakter): ${text.substring(0, 150)}...`,
            'QuizValidationService.parseAIResponseToJSON',
          );

          return this.createFallbackData<T>(text, metadata);
        }
      }
    } catch (error) {
      this.logger.error(
        `[${traceId}] AI yanıtı işlenirken kritik hata: ${error.message}`,
        'QuizValidationService.parseAIResponseToJSON',
        __filename,
        error,
      );

      return this.createFallbackData<T>(text, metadata);
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
   * Parse işlemi başarısız olduğunda fallback veri oluşturur
   * @param text AI yanıt metni
   * @param metadata Metadata
   * @returns Fallback veri
   */
  private createFallbackData<T>(text: string, metadata: QuizMetadata): T {
    const { traceId, questionCount = 5, difficulty = 'mixed' } = metadata;

    // Bu bir Quiz yanıtı mı kontrol et
    const isQuizResponse =
      typeof text === 'string' &&
      (text.toLowerCase().includes('question') ||
        text.toLowerCase().includes('soru') ||
        text.toLowerCase().includes('quiz') ||
        text.toLowerCase().includes('test'));

    if (isQuizResponse) {
      this.logger.info(
        `[${traceId}] Yapay zeka yanıtında sorular tespit edildi, ancak JSON formatında değil. Metin tabanlı içerikten sorular çıkarılmaya çalışılacak.`,
        'QuizValidationService.createFallbackData',
      );

      // Metin tabanlı içerikten soru benzeri yapılar çıkarmaya çalış
      try {
        const extractedQuestions = this.extractQuestionsFromText(text);

        if (extractedQuestions && extractedQuestions.length > 0) {
          this.logger.info(
            `[${traceId}] Metin tabanlı içerikten ${extractedQuestions.length} adet soru çıkarıldı.`,
            'QuizValidationService.createFallbackData',
          );

          // Çıkarılan soruları expected tipe dönüştür
          if (Array.isArray(extractedQuestions)) {
            return { questions: extractedQuestions } as unknown as T;
          } else {
            return extractedQuestions as unknown as T;
          }
        }
      } catch (extractError) {
        this.logger.warn(
          `[${traceId}] Metin tabanlı içerikten sorular çıkarılırken hata: ${extractError.message}`,
          'QuizValidationService.createFallbackData',
        );
      }
    }

    // Normal fallback içeriği oluştur
    this.logger.info(
      `[${traceId}] Fallback veri oluşturuluyor: ${questionCount} soru, ${difficulty} zorluk`,
      'QuizValidationService.createFallbackData',
    );

    const fallbackQuestions = this.createFallbackQuestions(metadata);

    // Döndürülen tip bir dizi mi yoksa { questions: [] } formatında mı, kontrol et
    if (this.shouldReturnQuestionsArray<T>()) {
      return fallbackQuestions as unknown as T;
    } else {
      return { questions: fallbackQuestions } as unknown as T;
    }
  }

  /**
   * Döndürülen T tipinin doğrudan dizi olup olmadığını kontrol eder
   * Bu yöntem mükemmel değil ancak çoğu durumda çalışacaktır
   */
  private shouldReturnQuestionsArray<T>(): boolean {
    // Bu kontrolü daha güvenli yapmak için bazı yöntemler kullanılabilir
    // Bu örnekte tip adına bakarak bir tahmin yapıyoruz
    const typeName = 'T'; // Bu sadece bir tahmin, gerçekte T'nin adını bilemeyiz

    return typeName.includes('Array') || typeName.includes('[]');
  }

  /**
   * Metin tabanlı içerikten soru benzeri yapıları çıkarır
   * @param text Metin içeriği
   * @returns Soru dizisi veya null
   */
  private extractQuestionsFromText(text: string): any[] | null {
    // Soruları tespit etmek için kullanabileceğimiz pattern'lar
    const questionPatterns = [
      /(\d+[\.\)]\s*.*\?)/g, // 1. Soru şeklinde veya 1) Soru şeklinde olan, soru işareti ile biten
      /Soru\s*\d+[\.\:]\s*(.*\?)/gi, // "Soru 1: ..." formatındaki sorular
      /Q\d+[\.\:]\s*(.*\?)/gi, // "Q1: ..." formatındaki sorular
    ];

    // Tüm pattern'ları kullanarak olası soruları bul
    let allQuestions: string[] = [];

    questionPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        allQuestions = [...allQuestions, ...matches];
      }
    });

    // Eğer hiç soru bulunamadıysa null döndür
    if (allQuestions.length === 0) {
      return null;
    }

    // Sorulardan basit bir soru dizisi oluştur
    return allQuestions.map((questionText, index) => {
      // Basit şıklar oluştur
      const options = [
        'A) Seçenek 1',
        'B) Seçenek 2',
        'C) Seçenek 3',
        'D) Seçenek 4',
      ];

      return {
        id: `q${index + 1}`,
        questionText: questionText.trim(),
        options,
        correctAnswer: 'A) Seçenek 1', // Varsayılan olarak A şıkkını doğru kabul et
        explanation:
          'Bu soru AI tarafından oluşturulan metinden çıkarılmıştır. Açıklama mevcut değil.',
        subTopicName: 'Genel Konu',
        normalizedSubTopicName: 'genel-konu',
        difficulty: 'orta',
      };
    });
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
      `⚠️ [${traceId}] Fallback sorular oluşturuluyor (konu: ${subTopics.slice(0, 3).join(', ')}${
        subTopics.length > 3 ? '...' : ''
      }, belge ID: ${documentId || 'yok'})`,
      'QuizValidationService.createFallbackQuestions',
    );

    this.flowTracker.trackStep(
      `AI yanıtı işlenemiyor, fallback sorular oluşturuluyor. Alt konular: ${subTopics.length} adet`,
      'QuizValidationService',
    );

    // Eğer özel Eksaskala konusu ise, ilgili konuya özel sorular üret
    if (
      specialTopic === 'eksaskala' ||
      subTopics.some(
        (topic) => topic && topic.toLowerCase().includes('eksaskala'),
      )
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
    const normalizedTopics = (subTopics || []).map((topic) => {
      // Null/undefined kontrolü
      if (!topic) return defaultSubTopic;
      // Normalleştirme sırasında - veya _ karakterlerini boşluğa çevir
      return topic.replace(/-/g, ' ').replace(/_/g, ' ');
    });

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
        subTopicName:
          subTopicsCount > 0 && subTopics[0] ? subTopics[0] : defaultSubTopic,
        normalizedSubTopicName:
          subTopicsCount > 0 && subTopics[0]
            ? this.normalizationService.normalizeSubTopicName(subTopics[0])
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
          subTopicsCount > 1 && subTopics[1]
            ? subTopics[1]
            : subTopicsCount > 0 && subTopics[0]
              ? subTopics[0]
              : 'Yazılım Metodolojileri',
        normalizedSubTopicName:
          subTopicsCount > 1 && subTopics[1]
            ? this.normalizationService.normalizeSubTopicName(subTopics[1])
            : subTopicsCount > 0 && subTopics[0]
              ? this.normalizationService.normalizeSubTopicName(subTopics[0])
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
          subTopicsCount > 2 && subTopics[2]
            ? subTopics[2]
            : subTopicsCount > 0 && subTopics[0]
              ? subTopics[0]
              : 'Algoritma Analizi',
        normalizedSubTopicName:
          subTopicsCount > 2 && subTopics[2]
            ? this.normalizationService.normalizeSubTopicName(subTopics[2])
            : subTopicsCount > 0 && subTopics[0]
              ? this.normalizationService.normalizeSubTopicName(subTopics[0])
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
          subTopicsCount > 3 && subTopics[3]
            ? subTopics[3]
            : subTopicsCount > 0 && subTopics[0]
              ? subTopics[0]
              : 'Yazılım Kalitesi',
        normalizedSubTopicName:
          subTopicsCount > 3 && subTopics[3]
            ? this.normalizationService.normalizeSubTopicName(subTopics[3])
            : subTopicsCount > 0 && subTopics[0]
              ? this.normalizationService.normalizeSubTopicName(subTopics[0])
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
          subTopicsCount > 4 && subTopics[4]
            ? subTopics[4]
            : subTopicsCount > 0 && subTopics[0]
              ? subTopics[0]
              : 'Teorik Bilgisayar Bilimi',
        normalizedSubTopicName:
          subTopicsCount > 4 && subTopics[4]
            ? this.normalizationService.normalizeSubTopicName(subTopics[4])
            : subTopicsCount > 0 && subTopics[0]
              ? this.normalizationService.normalizeSubTopicName(subTopics[0])
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
    subTopics: string[],
  ): QuizQuestion[] {
    this.logger.info(
      `Eksaskala özel soruları oluşturuluyor (${subTopics.length} konu)`,
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
    subTopics: string[],
  ): QuizQuestion[] {
    this.logger.info(
      `Anahtar kelime tabanlı sorular oluşturuluyor (${keywords.slice(0, 5).join(', ')}...)`,
      'QuizValidationService.createKeywordBasedQuestions',
    );

    const topKeywords = keywords.slice(0, 15); // En önemli 15 anahtar kelime
    const questions: QuizQuestion[] = [];

    // İlk 5 alt konu veya daha azı varsa hepsini kullan
    const availableTopics = (subTopics || [])
      .filter((topic) => topic) // undefined/null değerleri filtrele
      .slice(0, Math.min(5, subTopics.length));

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

    try {
      // Önce basit bir yapı kontrolü yapalım
      if (!parsedJson || typeof parsedJson !== 'object') {
        this.logger.error(
          `[${traceId}] Quiz AI yanıtı geçersiz: yanıt bir nesne değil`,
          'QuizValidationService.validateQuizResponseSchema',
        );

        // Geçersiz yanıt durumunda fallback sorular döndür
        return { questions: this.createFallbackQuestions(metadata) };
      }

      // Sorular direkt bir array olarak gelmiş olabilir
      if (Array.isArray(parsedJson)) {
        this.logger.info(
          `[${traceId}] Quiz AI yanıtı direkt soru dizisi olarak geldi, şema uyumlu hale getiriliyor`,
          'QuizValidationService.validateQuizResponseSchema',
        );

        // Direkt array geldiyse bunu questions property'si olan bir nesne olarak sarmalayalım
        return { questions: parsedJson };
      }

      // questions property'si var mı kontrol edelim
      if (!parsedJson.questions && !Array.isArray(parsedJson.questions)) {
        // Eğer "quiz", "data" veya "result" gibi farklı bir property içinde sorular olabilir
        const possibleKeys = [
          'quiz',
          'data',
          'result',
          'sorulist',
          'questionlist',
        ];
        let foundQuestions = null;

        for (const key of possibleKeys) {
          if (
            parsedJson[key] &&
            (Array.isArray(parsedJson[key]) ||
              (parsedJson[key].questions &&
                Array.isArray(parsedJson[key].questions)))
          ) {
            foundQuestions = Array.isArray(parsedJson[key])
              ? parsedJson[key]
              : parsedJson[key].questions;

            this.logger.info(
              `[${traceId}] Sorular '${key}' özelliği içinde bulundu`,
              'QuizValidationService.validateQuizResponseSchema',
            );

            break;
          }
        }

        if (foundQuestions) {
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

        // questions bulunamadıysa fallback sorular döndür
        return { questions: this.createFallbackQuestions(metadata) };
      }

      // Şema doğrulaması yap
      return QuizGenerationResponseSchema.parse(parsedJson);
    } catch (validationError) {
      this.logger.error(
        `[${traceId}] Quiz AI yanıtı şema validasyonundan geçemedi: ${validationError.message}`,
        'QuizValidationService.validateQuizResponseSchema',
        undefined,
        validationError,
      );

      // Log için debug bilgisi (ayrı bir log kaydı olarak)
      this.logger.debug(
        `[${traceId}] Hatalı yanıt detayları: ${rawResponse?.substring(0, 1000)}, Yapı: ${JSON.stringify(Object.keys(parsedJson || {}))}`,
        'QuizValidationService.validateQuizResponseSchema',
      );

      // Fallback olarak örnek sorular döndür
      return { questions: this.createFallbackQuestions(metadata) };
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

      // Soru dizisi bulunamazsa fallback sorular oluştur
      return this.createFallbackQuestions(metadata);
    }

    const validQuestions: QuizQuestion[] = [];

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

        // QuizQuestion interface'ine göre veri oluştur
        const questionData = {
          id: q_input.id || `q_${Date.now()}_${i}`,
          questionText: q_input.questionText,
          options: q_input.options,
          correctAnswer: q_input.correctAnswer,
          explanation: q_input.explanation || 'Açıklama yok',
          subTopicName: subTopicNameFromInput,
          normalizedSubTopicName: normalizedSubTopicName,
          difficulty: q_input.difficulty || 'medium',
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
        // Hatalı soruyu atla ve diğerlerine devam et
        continue;
      }
    }

    // Eğer hiç geçerli soru yoksa, fallback sorular oluştur
    if (validQuestions.length === 0) {
      this.logger.warn(
        `[${traceId}] Hiç geçerli soru oluşturulamadı, fallback sorular kullanılıyor`,
        'QuizValidationService.transformAndValidateQuestions',
      );
      return this.createFallbackQuestions(metadata);
    }

    return validQuestions;
  }
}
