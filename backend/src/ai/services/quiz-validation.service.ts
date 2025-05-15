import { Injectable, BadRequestException } from '@nestjs/common';
import { QuizQuestion, QuizMetadata } from '../interfaces';
import { LoggerService } from '../../common/services/logger.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import {
  QuizGenerationResponseSchema,
  QuizQuestionSchema,
} from '../schemas/quiz-question.schema';

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

    try {
      // Check for common formatting issues before parsing
      let jsonText = text;
      let jsonMatch: RegExpMatchArray | null = null;

      // First, try to detect JSON code blocks
      if (text.includes('```')) {
        const codeBlockRegexes = [
          /```json([\s\S]*?)```/i, // Büyük/küçük harfe duyarsız
          /```([\s\S]*?)```/, // Herhangi bir dil belirtilmemiş kod bloğu
        ];

        for (const regex of codeBlockRegexes) {
          jsonMatch = text.match(regex);
          if (jsonMatch && jsonMatch[1]) {
            jsonText = jsonMatch[1].trim();
            break;
          }
        }
      }

      // Metinden ilk { ile başlayıp son } ile biten bölümü çıkarmaya çalış
      if (!jsonMatch) {
        const firstOpen = jsonText.indexOf('{');
        const lastClose = jsonText.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          jsonText = jsonText.substring(firstOpen, lastClose + 1);
        }
      }

      // Temizleme ve düzeltme işlemleri
      jsonText = this.cleanJsonText(jsonText);

      // Parantez dengesini kontrol et
      jsonText = this.balanceJsonBrackets(jsonText);

      // Trailing comma temizleme (,] veya ,} gibi geçersiz JSON yapıları)
      jsonText = jsonText.replace(/,\s*([}\]])/g, '$1');

      this.logger.debug(
        `[${traceId}] JSON parse hazır. Temizlenmiş metin: ${jsonText.substring(0, 200)}...`,
        'QuizValidationService.parseAIResponseToJSON',
      );

      return JSON.parse(jsonText) as T;
    } catch (error) {
      this.logger.error(
        `[${traceId}] JSON parse hatası: ${error.message}. Yanıt (ilk 500kr): ${text.substring(0, 500)}`,
        'QuizValidationService.parseAIResponseToJSON',
        undefined,
        error,
      );

      // Fallback çözümü dene
      try {
        // Eksik tırnak işaretleri gibi yaygın sorunları düzeltmeye çalış
        const fixedJson = this.attemptToFixJson(text);

        if (fixedJson) {
          this.logger.info(
            `[${traceId}] Fallback JSON düzeltme işlemi uygulandı, yeniden deneniyor`,
            'QuizValidationService.parseAIResponseToJSON',
          );

          return JSON.parse(fixedJson) as T;
        }
      } catch (fallbackError) {
        this.logger.error(
          `[${traceId}] Fallback JSON düzeltme denemesi başarısız: ${fallbackError.message}`,
          'QuizValidationService.parseAIResponseToJSON',
          undefined,
          fallbackError,
        );
      }

      // AI yanıtı parse edilemediğinde örnek sorular döndür
      this.logger.warn(
        `[${traceId}] JSON ayrıştırma başarısız oldu, örnek quiz soruları döndürülüyor`,
        'QuizValidationService.parseAIResponseToJSON',
      );

      // Fallback: 5 adet örnek soru içeren bir yapı oluştur
      const fallbackQuestions = this.generateFallbackQuestions(metadata);

      return { questions: fallbackQuestions } as T;
    }
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
   * JSON içerikli metni temizler
   */
  private cleanJsonText(text: string): string {
    let result = text.trim();

    // LLM'in eklediği ekstra açıklamaları kaldır
    result = result.replace(/[\r\n]+Bu JSON çıktısı.*$/, '');
    result = result.replace(/^.*?(\{[\s\S]*\}).*$/, '$1');

    return result;
  }

  /**
   * JSON parantezlerini dengeler
   */
  private balanceJsonBrackets(text: string): string {
    let result = text;

    // Açık ve kapalı parantezleri say
    const openBraces = (result.match(/\{/g) || []).length;
    const closeBraces = (result.match(/\}/g) || []).length;
    const openBrackets = (result.match(/\[/g) || []).length;
    const closeBrackets = (result.match(/\]/g) || []).length;

    // Süslü parantezleri dengele
    if (openBraces > closeBraces) {
      result += '}'.repeat(openBraces - closeBraces);
    }

    // Köşeli parantezleri dengele
    if (openBrackets > closeBrackets) {
      result += ']'.repeat(openBrackets - closeBrackets);
    }

    return result;
  }

  /**
   * Bozuk JSON'ı düzeltmeye çalışır (son çare)
   */
  private attemptToFixJson(text: string): string | null {
    if (!text) return null;

    try {
      // İlk ve son süslü parantez arasındaki metni al
      const regex = /\{[\s\S]*\}/;
      const match = text.match(regex);

      if (!match) return null;

      let jsonText = match[0];

      // Alan adlarında çift tırnak olmayan yerleri düzelt
      // Örnek: {name: "value"} -> {"name": "value"}
      jsonText = jsonText.replace(
        /([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g,
        '$1"$2"$3',
      );

      return jsonText;
    } catch {
      return null;
    }
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

      const errorMessages = validationError.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');

      throw new BadRequestException(
        `Quiz AI yanıtı geçersiz formatta (şema): ${errorMessages}`,
      );
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
