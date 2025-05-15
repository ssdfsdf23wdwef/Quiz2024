import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIProviderService } from '../providers/ai-provider.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import { TopicDetectionResult } from '../interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import pRetry from 'p-retry';

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
        // AI isteğini gerçekleştir
        const aiResponse =
          await this.aiProviderService.generateContent(fullPrompt);

        // Yanıtı ayrıştır
        const parsedResponse = this.parseJsonResponse(aiResponse.text);

        // Yanıtı normalize et
        return this.normalizeTopicResult(parsedResponse);
      }, this.RETRY_OPTIONS);

      const aiCallDuration = Date.now() - aiCallStartTime;

      this.logger.info(
        `[${traceId}] AI modeli yanıt verdi (${aiCallDuration}ms)`,
        'TopicDetectionService.detectTopics',
        __filename,
      );

      // Check if we got valid results
      if (!result || !result.topics || !Array.isArray(result.topics)) {
        this.logger.error(
          `[${traceId}] AI çıktısı geçersiz format içeriyor`,
          'TopicDetectionService.detectTopics',
          __filename,
          undefined,
          undefined,
          { error: 'Invalid AI response format' },
        );

        throw new Error(
          'AI servisinden geçersiz konu algılama sonuç formatı alındı',
        );
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
      throw new Error('AI yanıtı parse edilemedi: Yanıt boş.');
    }

    try {
      // Check for common formatting issues before parsing
      let jsonText = text;
      let jsonMatch: RegExpMatchArray | null = null;

      // First, try to detect JSON code blocks
      if (text.includes('```')) {
        const codeBlockRegexes = [
          /```json([\s\S]*?)```/,
          /```JSON([\s\S]*?)```/,
          /```([\s\S]*?)```/,
        ];

        for (const regex of codeBlockRegexes) {
          jsonMatch = text.match(regex);
          if (jsonMatch && jsonMatch[1]) {
            jsonText = jsonMatch[1].trim();
            break;
          }
        }
      }

      // If no code blocks, try to extract using brace matching
      if (!jsonMatch) {
        const jsonObjectRegex = /\{[\s\S]*\}/;
        jsonMatch = text.match(jsonObjectRegex);

        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }

      // Check if brackets need balancing (common AI error)
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;

      if (openBraces !== closeBraces) {
        // Attempt to balance brackets if possible
        if (openBraces > closeBraces) {
          const missingCloseBraces = openBraces - closeBraces;
          jsonText = jsonText + '}'.repeat(missingCloseBraces);
        } else if (closeBraces > openBraces) {
          const missingOpenBraces = closeBraces - openBraces;
          jsonText = '{'.repeat(missingOpenBraces) + jsonText;
        }
      }

      return JSON.parse(jsonText) as T;
    } catch (error) {
      this.logger.error(
        `JSON parse hatası: ${error.message}`,
        'TopicDetectionService.parseJsonResponse',
        __filename,
        undefined,
        error,
      );
      throw new Error(
        `AI yanıtı JSON olarak parse edilemedi: ${error.message}`,
      );
    }
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
              if (typeof subTopic === 'string') {
                normalizedTopics.push({
                  subTopicName: subTopic,
                  normalizedSubTopicName:
                    this.normalizationService.normalizeSubTopicName(subTopic),
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
}
