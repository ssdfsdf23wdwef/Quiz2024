import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIProviderService } from '../providers/ai-provider.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import { TopicDetectionResult } from '../interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import pRetry from 'p-retry';
import {
  TopicDetectionAiResponseSchema,
  FinalNormalizedTopicDetectionResultSchema,
} from '../schemas/topic-detection.schema';

@Injectable()
export class TopicDetectionService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
  private readonly MAX_RETRIES = 3;

  // Varsayılan Türkçe konu tespiti prompt'u
  private readonly DEFAULT_TOPIC_DETECTION_PROMPT_TR = `
## GÖREV: Eğitim Materyalinden Konuları ve Alt Konuları Algılama

Aşağıdaki eğitim materyali metnini analiz et ve içindeki ana konuları ve alt konuları tespit et.

### Talimatlar:
1. Metni okuyarak ana konuları ve bunlara ait alt konuları belirle
2. Her ana konunun altında, o konuyla ilgili alt konuları listele
3. Çok genel konulardan kaçın, mümkün olduğunca spesifik ol
4. Metinde geçen terimler ve kavramlar arasındaki ilişkileri koru
5. En önemli/belirgin 5-10 konu ve alt konuyu belirle

### Yanıt Formatı:
Sonuçları JSON formatında, aşağıdaki yapıda döndür:

\`\`\`json
{
  "topics": [
    {
      "mainTopic": "Ana Konu Adı 1",
      "subTopics": ["Alt Konu 1.1", "Alt Konu 1.2"]
    },
    {
      "mainTopic": "Ana Konu Adı 2",
      "subTopics": ["Alt Konu 2.1", "Alt Konu 2.2"]
    }
  ]
}
\`\`\`

Sadece JSON döndür, başka açıklama yapma.
`;

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
        'TopicDetectionService.RETRY_OPTIONS.onFailedAttempt',
        __filename,
      );
    },
  };

  constructor(
    private readonly aiProviderService: AIProviderService,
    private readonly normalizationService: NormalizationService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  /**
   * Detect topics from the provided document text
   */
  async detectTopics(
    documentText: string,
    existingTopics: string[] = [],
    cacheKey?: string,
  ): Promise<TopicDetectionResult> {
    const processingStartTime = Date.now();
    const traceId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.logger.debug(
        `[${traceId}] AI servisi metin analizi başlatılıyor (${documentText.length} karakter)`,
        'TopicDetectionService.detectTopics',
        __filename,
      );

      this.flowTracker.trackStep(
        'Dokümandan konular algılanıyor',
        'TopicDetectionService',
      );

      // Eğer metin çok kısaysa uyarı ver
      if (documentText.length < 100) {
        this.logger.warn(
          `[${traceId}] Analiz için çok kısa metin (${documentText.length} karakter). Minimum önerilen: 100 karakter`,
          'TopicDetectionService.detectTopics',
          __filename,
        );
      }

      // Önbellek kontrolü - eğer cacheKey verilmişse
      if (cacheKey) {
        this.logger.debug(
          `[${traceId}] Önbellek anahtarı ile kontrol: ${cacheKey}`,
          'TopicDetectionService.detectTopics',
          __filename,
        );
        // TODO: İleride bir önbellek servisi entegre edildiğinde,
        // burada önbellekten veri çekme kodları yer alacak
      }

      // Truncate document text if too long
      const maxTextLength = 15000;
      let truncatedText = documentText;
      let isTextTruncated = false;

      if (documentText.length > maxTextLength) {
        const originalLength = documentText.length;
        truncatedText = documentText.slice(0, maxTextLength) + '...';
        isTextTruncated = true;

        this.logger.warn(
          `[${traceId}] Metin çok uzun, ${maxTextLength} karaktere kısaltıldı (orijinal: ${originalLength} karakter)`,
          'TopicDetectionService.detectTopics',
          __filename,
        );
      }

      // Building the prompt using the content from detect-topics-tr.txt file
      const promptFilePath = path.resolve(
        __dirname,
        '..',
        'prompts',
        'detect-topics-tr.txt',
      );
      let promptContent = '';
      let promptSource = 'file';

      try {
        promptContent = fs.readFileSync(promptFilePath, 'utf8');
      } catch (error) {
        promptSource = 'default';
        this.logger.error(
          `[${traceId}] Prompt dosyası okuma hatası: ${error.message}, varsayılan prompt kullanılacak`,
          'TopicDetectionService.detectTopics',
          __filename,
          undefined,
          error,
        );

        this.logger.info(
          `[${traceId}] Varsayılan prompt kullanılıyor (${this.DEFAULT_TOPIC_DETECTION_PROMPT_TR.length} karakter)`,
          'TopicDetectionService.detectTopics',
          __filename,
        );

        promptContent = this.DEFAULT_TOPIC_DETECTION_PROMPT_TR;
      }

      // Append the document text to the prompt
      const prompt = `${promptContent}\n\n**Input Text to Analyze:**\n${truncatedText}`;

      // Build existing topics list if any
      const existingTopicsText =
        existingTopics.length > 0
          ? `\n\nExisting topics: ${existingTopics.join(', ')}`
          : '';

      // Combine prompt with existing topics
      const fullPrompt = prompt + existingTopicsText;

      this.logger.debug(
        `[${traceId}] Hazırlanan prompt uzunluğu: ${fullPrompt.length} karakter`,
        'TopicDetectionService.detectTopics',
        __filename,
      );

      // Track the AI service being used
      this.flowTracker.trackStep(
        `Konular tespit ediliyor`,
        'TopicDetectionService',
      );

      let result: TopicDetectionResult = { topics: [] };

      // Her durumda yeniden deneme mekanizması kullan
      this.logger.info(
        `[${traceId}] AI modeli çağrısı başlatılıyor`,
        'TopicDetectionService.detectTopics',
        __filename,
      );

      const aiCallStartTime = Date.now();

      // AI isteğini gerçekleştir
      result = await pRetry(async () => {
        const aiResponseText =
          await this.aiProviderService.generateContent(fullPrompt);

        const parsedResponse = this.parseJsonResponse<any>(aiResponseText.text); // Tipini any yapıp validasyona bırakalım

        try {
          TopicDetectionAiResponseSchema.parse(parsedResponse); // Zod ile validasyon
        } catch (validationError) {
          this.logger.error(
            `[${traceId}] AI yanıtı şema validasyonundan geçemedi: ${validationError.message}`,
            'TopicDetectionService.detectTopics.ZodValidation',
            __filename,
            undefined,
            validationError,
            { rawResponse: aiResponseText.text.substring(0, 1000) }, // Yanıtın ilk 1000 karakterini logla
          );
          // Zod hatalarını daha okunabilir hale getir
          const errorMessages = validationError.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('; ');
          throw new BadRequestException(
            `AI yanıtı geçersiz formatta: ${errorMessages}`,
          );
        }

        // Validasyondan geçtiyse, normalizasyona devam et
        return this.normalizeTopicResult(parsedResponse);
      }, this.RETRY_OPTIONS);

      const aiCallDuration = Date.now() - aiCallStartTime;

      this.logger.info(
        `[${traceId}] AI modeli yanıt verdi (${aiCallDuration}ms)`,
        'TopicDetectionService.detectTopics',
        __filename,
      );

      // Normalizasyon sonrası sonucu da valide edelim (opsiyonel ama iyi bir pratik)
      try {
        FinalNormalizedTopicDetectionResultSchema.parse(result);
      } catch (normalizationValidationError) {
        this.logger.error(
          `[${traceId}] Normalleştirilmiş konu sonucu şema validasyonundan geçemedi: ${normalizationValidationError.message}`,
          'TopicDetectionService.detectTopics.NormalizationValidation',
          __filename,
          undefined,
          normalizationValidationError,
          { normalizedResult: result },
        );
        // Bu noktada bir hata fırlatmak yerine uyarı logu ile devam edilebilir veya default bir sonuç döndürülebilir.
        // Şimdilik loglayıp devam edelim, çünkü ana validasyon AI yanıtı için yapıldı.
      }

      // Check if we got valid results (Bu kontrol Zod ile yapıldığı için gerek kalmayabilir veya daha basit hale getirilebilir)
      if (!result || !result.topics || !Array.isArray(result.topics)) {
        // ... (Bu kısım Zod validasyonu sonrası muhtemelen gereksiz olacak veya uyarıya dönüşecek)
      }

      // Sonuç boşsa veya çok az konu içeriyorsa uyarı log'u
      if (result.topics.length === 0) {
        this.logger.warn(
          `[${traceId}] Belgede hiçbir konu algılanamadı`,
          'TopicDetectionService.detectTopics',
          __filename,
        );
      } else if (result.topics.length < 3 && documentText.length > 1000) {
        this.logger.warn(
          `[${traceId}] Uzun belgede çok az konu algılandı (${result.topics.length})`,
          'TopicDetectionService.detectTopics',
          __filename,
        );
      }

      // Log işleme süresini
      const processingDuration = Date.now() - processingStartTime;
      this.logger.debug(
        `[${traceId}] Konular başarıyla algılandı (${result.topics.length} konu, ${processingDuration}ms)`,
        'TopicDetectionService.detectTopics',
        __filename,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `[${traceId}] Konu tespiti sırasında hata: ${error.message}`,
        'TopicDetectionService.detectTopics',
        __filename,
        undefined,
        error,
      );
      throw error;
    }
  }

  /**
   * Generic JSON response parser for AI responses
   */
  private parseJsonResponse<T>(text: string | undefined | null): T {
    if (!text) {
      this.logger.warn(
        'AI yanıtı boş, varsayılan boş konu yapısı döndürülüyor',
        'TopicDetectionService.parseJsonResponse',
        __filename,
      );
      return { topics: [] } as T; // Boş yanıt durumunda boş topic listesi döndür
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
      jsonText = this.cleanJsonString(jsonText);

      // Parantez dengesini kontrol et
      jsonText = this.balanceBrackets(jsonText);

      // Trailing comma temizleme (,] veya ,} gibi geçersiz JSON yapıları)
      jsonText = jsonText.replace(/,\s*([}\]])/g, '$1');

      // Debug olarak temizlenmiş JSON'ı logla
      this.logger.debug(
        `JSON parse hazır. Temizlenmiş metin: ${jsonText.substring(0, 200)}...`,
        'TopicDetectionService.parseJsonResponse',
        __filename,
      );

      // Parse JSON
      try {
        return JSON.parse(jsonText) as T;
      } catch (initialParseError) {
        this.logger.warn(
          `İlk JSON parse denemesi başarısız: ${initialParseError.message}, onarım deneniyor...`,
          'TopicDetectionService.parseJsonResponse',
          __filename,
        );

        // Onarım dene
        const repairedJson = this.repairJsonString(jsonText);

        try {
          return JSON.parse(repairedJson) as T;
        } catch (repairParseError) {
          this.logger.warn(
            `Onarılmış JSON parse denemesi de başarısız: ${repairParseError.message}, yapay konular oluşturulacak`,
            'TopicDetectionService.parseJsonResponse',
            __filename,
          );

          // Her iki parse denemesi de başarısız, varsayılan konular oluştur
          return this.generateDefaultTopics(text) as T;
        }
      }
    } catch (error) {
      this.logger.error(
        `AI yanıtı JSON olarak parse edilemedi: ${error.message}. Yanıt (ilk 500kr): ${text.substring(0, 500)}`,
        'TopicDetectionService.parseJsonResponse',
        __filename,
        undefined,
        error,
      );

      // Her durumda varsayılan konuları döndür - üretimi aksatmamak için
      this.logger.warn(
        `JSON ayrıştırma başarısız oldu, varsayılan konular oluşturuluyor`,
        'TopicDetectionService.parseJsonResponse',
        __filename,
      );

      return this.generateDefaultTopics(text) as T;
    }
  }

  /**
   * Clean JSON string by removing extra text before/after JSON and fixing common issues
   */
  private cleanJsonString(input: string): string {
    let result = input.trim();

    // LLM'in eklediği ekstra açıklamaları kaldır
    result = result.replace(/[\r\n]+Bu JSON çıktısı.*$/g, '');
    result = result.replace(/^.*?(\{[\s\S]*\}).*$/g, '$1');

    return result;
  }

  /**
   * Balance brackets in JSON string
   */
  private balanceBrackets(input: string): string {
    let result = input;

    // Açık ve kapalı parantez sayılarını hesapla
    const openBraces = (result.match(/{/g) || []).length;
    const closeBraces = (result.match(/}/g) || []).length;
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
   * Repair a broken JSON string using common fixes
   */
  private repairJsonString(input: string): string {
    let result = input;

    // Alan adlarında çift tırnak olmayan yerleri düzelt
    // Örnek: {name: "value"} -> {"name": "value"}
    result = result.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

    // Değerlerde eksik çift tırnak
    // Örnek: {"name": value} -> {"name": "value"}
    // Dikkat: Sadece alfanümerik değerlere tırnak ekler, true/false/null ve numerik değerlere dokunmaz
    result = result.replace(
      /(:\s*)([a-zA-Z][a-zA-Z0-9_]*)(\s*[,}])/g,
      '$1"$2"$3',
    );

    return result;
  }

  private shouldReturnDefaultTopics(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Normalize topic detection result
   */
  private normalizeTopicResult(result: any): TopicDetectionResult {
    // Boş sonuç kontrolü
    if (!result) {
      return { topics: [] };
    }

    try {
      // AI'dan gelen format toplevel "topics" dizisi içerebilir
      const topicsArray = Array.isArray(result)
        ? result
        : Array.isArray(result.topics)
          ? result.topics
          : null;

      if (!topicsArray) {
        this.logger.warn(
          'AI yanıtı beklenen formatta değil, boş konu listesi döndürülüyor',
          'TopicDetectionService.normalizeTopicResult',
          __filename,
        );
        return { topics: [] };
      }

      // AI modeli "mainTopic" ve "subTopics" formatında döndürebilir
      // Bu formattan standart formata dönüştürme yapmamız gerekiyor
      const normalizedTopics: Array<{
        subTopicName: string;
        normalizedSubTopicName: string;
        parentTopic?: string;
        isMainTopic?: boolean;
      }> = [];

      // Ana konuları işle
      topicsArray.forEach((topic: any) => {
        if (topic.mainTopic) {
          // mainTopic - subTopics formatı
          const mainTopicName = topic.mainTopic;

          // String kontrolü ekle
          if (typeof mainTopicName !== 'string') {
            this.logger.warn(
              `Geçersiz ana konu türü: ${typeof mainTopicName}`,
              'TopicDetectionService.normalizeTopicResult',
              __filename,
            );
            return; // Bu topic'i atla
          }

          const normalizedMainTopic =
            this.normalizationService.normalizeSubTopicName(mainTopicName);

          // Ana konuyu ekle
          normalizedTopics.push({
            subTopicName: mainTopicName,
            normalizedSubTopicName: normalizedMainTopic,
            isMainTopic: true,
          });

          // Alt konuları ekle
          if (Array.isArray(topic.subTopics)) {
            topic.subTopics.forEach((subTopic: any) => {
              // Eğer subTopic bir string ise
              if (typeof subTopic === 'string') {
                normalizedTopics.push({
                  subTopicName: subTopic,
                  normalizedSubTopicName:
                    this.normalizationService.normalizeSubTopicName(subTopic),
                  parentTopic: mainTopicName,
                  isMainTopic: false,
                });
              }
              // Eğer subTopic bir obje ve subTopicName içeriyorsa
              else if (
                typeof subTopic === 'object' &&
                subTopic !== null &&
                subTopic.subTopicName
              ) {
                normalizedTopics.push({
                  subTopicName: subTopic.subTopicName,
                  normalizedSubTopicName:
                    subTopic.normalizedSubTopicName ||
                    this.normalizationService.normalizeSubTopicName(
                      subTopic.subTopicName,
                    ),
                  parentTopic: mainTopicName,
                  isMainTopic: false,
                });
              } else {
                this.logger.warn(
                  `Geçersiz alt konu türü: ${typeof subTopic}`,
                  'TopicDetectionService.normalizeTopicResult',
                  __filename,
                );
              }
            });
          }
        } else if (
          typeof topic === 'object' &&
          topic !== null &&
          topic.subTopicName
        ) {
          // Direkt subTopicName formatı
          if (typeof topic.subTopicName !== 'string') {
            this.logger.warn(
              `Geçersiz subTopicName türü: ${typeof topic.subTopicName}`,
              'TopicDetectionService.normalizeTopicResult',
              __filename,
            );
            return; // Bu topic'i atla
          }

          normalizedTopics.push({
            subTopicName: topic.subTopicName,
            normalizedSubTopicName:
              this.normalizationService.normalizeSubTopicName(
                topic.subTopicName,
              ),
            parentTopic: topic.parentTopic,
            isMainTopic: !!topic.isMainTopic,
          });
        } else if (typeof topic === 'string') {
          // String formatı - düz konu listesi
          normalizedTopics.push({
            subTopicName: topic,
            normalizedSubTopicName:
              this.normalizationService.normalizeSubTopicName(topic),
            isMainTopic: true,
          });
        }
      });

      return { topics: normalizedTopics };
    } catch (error) {
      this.logger.error(
        `Konu sonuç normalizasyonu sırasında hata: ${error.message}`,
        'TopicDetectionService.normalizeTopicResult',
        __filename,
        undefined,
        error,
      );
      return { topics: [] };
    }
  }

  /**
   * Generate default topics from text when AI parsing fails
   * @param text The document text to extract topics from
   * @returns A basic topic structure
   */
  private generateDefaultTopics(text: string): { topics: any[] } {
    try {
      // Metin içinden en sık geçen kelimeleri bul
      const words = text
        .split(/\s+/)
        .filter((word) => word.length > 5) // En az 5 karakterli kelimeleri al
        .map((word) => word.replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, '')) // Alfanümerik olmayan karakterleri temizle
        .filter((word) => word.length > 0); // Boş kelimeleri filtrele

      // Kelime frekansını hesapla
      const wordFrequency: Record<string, number> = {};
      words.forEach((word) => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });

      // En sık kullanılan 5 kelimeyi al
      const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1]) // Frekansa göre sırala
        .slice(0, 5) // İlk 5'i al
        .map((entry) => entry[0]); // Sadece kelimeleri al

      // Başlıktan potansiyel konu çıkar
      const titleMatch = text.match(/^(.*?)[\n\r]/);
      const potentialTitle = titleMatch ? titleMatch[1].trim() : '';

      // Varsayılan bir konu listesi oluştur
      const defaultTopics: Array<{ mainTopic: string; subTopics: string[] }> =
        [];

      // Başlıktan bir ana konu ekle
      if (
        potentialTitle &&
        potentialTitle.length > 3 &&
        potentialTitle.length < 100
      ) {
        defaultTopics.push({
          mainTopic: potentialTitle,
          subTopics: topWords.map((word) => `${potentialTitle} - ${word}`),
        });
      }

      // En sık geçen kelimelerden bir konu ekle
      if (topWords.length > 0) {
        defaultTopics.push({
          mainTopic: 'Otomatik Tespit Edilen Konular',
          subTopics: topWords,
        });
      }

      // Hiç konu bulunamadıysa, genel bir konu ekle
      if (defaultTopics.length === 0) {
        defaultTopics.push({
          mainTopic: 'Belge İçeriği',
          subTopics: ['Ana Konu', 'Diğer Konular'],
        });
      }

      this.logger.info(
        `AI yanıtından konu çıkarılamadı, ${defaultTopics.length} adet varsayılan konu oluşturuldu`,
        'TopicDetectionService.generateDefaultTopics',
        __filename,
      );

      return { topics: defaultTopics };
    } catch (error) {
      this.logger.error(
        `Varsayılan konu oluşturma sırasında hata: ${error.message}`,
        'TopicDetectionService.generateDefaultTopics',
        __filename,
        undefined,
        error,
      );

      // En son çare - sabit konular
      return {
        topics: [
          {
            mainTopic: 'Belge İçeriği',
            subTopics: ['Ana Konu', 'Yardımcı Konular'],
          },
        ],
      };
    }
  }
}
