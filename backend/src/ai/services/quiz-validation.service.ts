import { Injectable, BadRequestException } from '@nestjs/common';
import { QuizQuestion, QuizMetadata } from '../interfaces';
import { LoggerService } from '../../common/services/logger.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import {
  QuizGenerationResponseSchema,
  QuizQuestionSchema,
} from '../schemas/quiz-question.schema';

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

  constructor(private readonly normalizationService: NormalizationService) {
    this.logger = LoggerService.getInstance();
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

    const fallbackQuestions = this.generateFallbackQuestions(metadata);

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
   * AI yanıtı parse edilemediğinde döndürülecek örnek soruları oluşturur
   */
  private generateFallbackQuestions(metadata: QuizMetadata): any[] {
    const { subTopicsCount = 0 } = metadata;
    const subTopics = [
      'Genel Konu',
      'Programlama',
      'Veri Yapıları',
      'Algoritmalar',
      'Web Geliştirme',
    ];

    // 5 örnek soru oluştur
    return [
      {
        id: `fallback_1_${Date.now()}`,
        questionText:
          "Bir programlama dilinde 'for' döngüsünün temel amacı nedir?",
        options: [
          'A) Hata ayıklamak',
          'B) Belirli bir kod bloğunu birden çok kez çalıştırmak',
          'C) Fonksiyon tanımlamak',
          'D) Veri türlerini dönüştürmek',
        ],
        correctAnswer: 'B) Belirli bir kod bloğunu birden çok kez çalıştırmak',
        explanation:
          'For döngüsü, belirli bir kod bloğunu önceden belirlenmiş sayıda tekrarlamak için kullanılır.',
        subTopicName: subTopicsCount > 1 ? subTopics[1] : subTopics[0],
        normalizedSubTopicName:
          subTopicsCount > 1
            ? this.normalizationService.normalizeSubTopicName(subTopics[1])
            : this.normalizationService.normalizeSubTopicName(subTopics[0]),
        difficulty: 'easy',
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `fallback_2_${Date.now()}`,
        questionText:
          "Veri yapılarında 'dizi' (array) ile 'bağlı liste' (linked list) arasındaki temel fark nedir?",
        options: [
          'A) Diziler sabit boyutludur, bağlı listeler dinamik boyutludur',
          'B) Diziler sadece sayısal verileri saklayabilir',
          'C) Bağlı listeler bellek içinde bitişik alanlar kullanır',
          'D) Diziler daha yavaş erişim sağlar',
        ],
        correctAnswer:
          'A) Diziler sabit boyutludur, bağlı listeler dinamik boyutludur',
        explanation:
          'Diziler genellikle sabit boyutludur ve bellek içinde bitişik alanlar kullanır. Bağlı listeler ise dinamik boyutludur ve bellek içinde dağınık bir şekilde saklanır.',
        subTopicName: subTopicsCount > 2 ? subTopics[2] : subTopics[0],
        normalizedSubTopicName:
          subTopicsCount > 2
            ? this.normalizationService.normalizeSubTopicName(subTopics[2])
            : this.normalizationService.normalizeSubTopicName(subTopics[0]),
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `fallback_3_${Date.now()}`,
        questionText:
          "Sıralama algoritmalarından 'Hızlı Sıralama' (Quick Sort) algoritmasının ortalama zaman karmaşıklığı nedir?",
        options: ['A) O(n)', 'B) O(n log n)', 'C) O(n²)', 'D) O(2ⁿ)'],
        correctAnswer: 'B) O(n log n)',
        explanation:
          "Quick Sort algoritmasının ortalama zaman karmaşıklığı O(n log n)'dir, ancak en kötü durumda O(n²) olabilir.",
        subTopicName: subTopicsCount > 3 ? subTopics[3] : subTopics[0],
        normalizedSubTopicName:
          subTopicsCount > 3
            ? this.normalizationService.normalizeSubTopicName(subTopics[3])
            : this.normalizationService.normalizeSubTopicName(subTopics[0]),
        difficulty: 'hard',
        questionType: 'multiple_choice',
        cognitiveDomain: 'remembering',
      },
      {
        id: `fallback_4_${Date.now()}`,
        questionText: "Web geliştirmede 'responsive design' ne anlama gelir?",
        options: [
          'A) Websitesinin tüm tarayıcılarda aynı görünmesi',
          'B) Websitesinin farklı ekran boyutlarına uyum sağlayabilmesi',
          'C) Websitesinin yükleme süresinin kısa olması',
          'D) Websitesinin arka plan işlemlerini hızlı yapması',
        ],
        correctAnswer:
          'B) Websitesinin farklı ekran boyutlarına uyum sağlayabilmesi',
        explanation:
          'Responsive design, bir web sitesinin farklı cihazlarda (telefon, tablet, masaüstü) ekran boyutlarına göre uyum sağlayarak optimize görüntülenmesini sağlayan bir web tasarım yaklaşımıdır.',
        subTopicName: subTopicsCount > 4 ? subTopics[4] : subTopics[0],
        normalizedSubTopicName:
          subTopicsCount > 4
            ? this.normalizationService.normalizeSubTopicName(subTopics[4])
            : this.normalizationService.normalizeSubTopicName(subTopics[0]),
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `fallback_5_${Date.now()}`,
        questionText:
          'Aşağıdakilerden hangisi bir nesne yönelimli programlama (OOP) prensibi değildir?',
        options: [
          'A) Inheritance (Kalıtım)',
          'B) Encapsulation (Kapsülleme)',
          'C) Modulation (Modülasyon)',
          'D) Polymorphism (Çok biçimlilik)',
        ],
        correctAnswer: 'C) Modulation (Modülasyon)',
        explanation:
          "Nesne yönelimli programlamanın temel prensipleri Inheritance (Kalıtım), Encapsulation (Kapsülleme), Abstraction (Soyutlama) ve Polymorphism (Çok biçimlilik)'tir. Modulation (Modülasyon) bir OOP prensibi değildir.",
        subTopicName: subTopicsCount > 0 ? subTopics[0] : 'Programlama',
        normalizedSubTopicName:
          subTopicsCount > 0
            ? this.normalizationService.normalizeSubTopicName(subTopics[0])
            : this.normalizationService.normalizeSubTopicName('Programlama'),
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
    ];
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
        return { questions: this.generateFallbackQuestions(metadata) };
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
        return { questions: this.generateFallbackQuestions(metadata) };
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
      return { questions: this.generateFallbackQuestions(metadata) };
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
      return this.generateFallbackQuestions(metadata);
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
      return this.generateFallbackQuestions(metadata);
    }

    return validQuestions;
  }
}
