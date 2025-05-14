import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  GenerateContentResult,
} from '@google/generative-ai';
import {
  TopicDetectionResult,
  QuizQuestion,
  QuizGenerationOptions,
} from './interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { NormalizationService } from '../shared/normalization/normalization.service';
import { QuizQuestionDto } from './dto/generate-personalized-feedback.dto';
import pRetry from 'p-retry';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

// Varsayılan Türkçe konu tespiti prompt'u
const DEFAULT_TOPIC_DETECTION_PROMPT_TR = `
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

@Injectable()
export class AiService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly MAX_RETRIES = 3;
  private readonly llmConfig: any;
  private readonly RETRY_OPTIONS = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 15000,
    onFailedAttempt: (error: any) => {
      // Hem Error tipini hem de pRetry'nin özel özelliklerini ele al
      const attemptNumber = error.attemptNumber || 1;
      const retriesLeft = error.retriesLeft || 0;
      const errorTraceId = `retry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      this.logger.warn(
        `[${errorTraceId}] AI çağrısı ${attemptNumber}. denemede başarısız oldu. ${retriesLeft} deneme kaldı. Hata: ${error.message}`,
        'AiService.RETRY_OPTIONS.onFailedAttempt',
        __filename,
        42,
        {
          errorMessage: error.message,
          errorName: error.name,
          errorType: error.constructor?.name || 'Unknown',
          attemptNumber,
          retriesLeft,
          waitTimeMs: Math.min(
            this.RETRY_OPTIONS.maxTimeout,
            this.RETRY_OPTIONS.minTimeout *
              Math.pow(this.RETRY_OPTIONS.factor, attemptNumber - 1),
          ),
          processingEvent: 'retry-attempt-failed',
          traceId: errorTraceId,
        },
      );
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly normalizationService: NormalizationService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();

    // LLM yapılandırmasını config servisinden al
    this.llmConfig = this.configService.get('llm');
    this.logger.debug(
      `LLM yapılandırması yükleniyor: ${JSON.stringify(this.llmConfig || 'Yapılandırma bulunamadı')}`,
      'AiService.constructor',
      __filename,
    );

    // Yapılandırma bulunamazsa varsayılan değerler kullan
    if (!this.llmConfig) {
      this.logger.warn(
        'LLM yapılandırması bulunamadı, varsayılan değerler kullanılıyor',
        'AiService.constructor',
        __filename,
      );
      this.llmConfig = {
        provider: 'gemini',
        apiKey: 'AIzaSyCIYYYDSYB_QN00OgoRPQgXR2cUUWCzRmw', // Varsayılan demo anahtar
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1024,
      };
    }

    const apiKey = this.llmConfig.apiKey;

    if (!apiKey) {
      this.logger.error(
        'LLM API anahtarı tanımlanmamış',
        'AiService.constructor',
        __filename,
        60,
      );
      throw new BadRequestException(
        'Yapay zeka servisi başlatılamadı. Lütfen sistem yöneticisiyle iletişime geçin.',
        'LLM_API_KEY ortam değişkeninde tanımlanmamış.',
      );
    }

    // Gemini API'yi başlat
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.llmConfig.model || 'gemini-1.5-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: {
        temperature: this.llmConfig.temperature || 0,
        maxOutputTokens: this.llmConfig.maxTokens || 1024,
      },
    });
  }

  /**
   * Generic JSON response parser for AI responses
   */
  @LogMethod()
  private parseJsonResponse<T>(text: string | undefined | null): T {
    const startTime = Date.now();
    const traceId = `parse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (!text) {
      this.logger.error(
        `[${traceId}] Parse edilecek AI yanıtı boş veya tanımsız.`,
        'AiService.parseJsonResponse',
        __filename,
        173,
        undefined, // Error nesnesi yok
        { responseValue: text, traceId }, // additionalInfo olarak geçirilmeli
      );
      throw new Error('AI yanıtı parse edilemedi: Yanıt boş.');
    }

    this.logger.debug(
      `[${traceId}] AI yanıtı JSON'a çevriliyor (${text.length} karakter)`,
      'AiService.parseJsonResponse',
      __filename,
      181,
      { textLength: text.length, traceId },
    );

    try {
      this.flowTracker.trackStep(
        'AI yanıtı JSON formatına çevriliyor',
        'AiService',
      );

      // Check for common formatting issues before parsing
      let jsonText = text;
      let jsonMatch: RegExpMatchArray | null = null;
      let extractionMethod = 'direct';

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
            extractionMethod = 'code-block';

            this.logger.debug(
              `[${traceId}] JSON kodu bloğu tespit edildi (regex: ${regex.toString()})`,
              'AiService.parseJsonResponse',
              __filename,
              204,
              {
                extractionMethod,
                originalLength: text.length,
                extractedLength: jsonText.length,
                matchStart: text.indexOf(jsonMatch[0]),
                matchEnd: text.indexOf(jsonMatch[0]) + jsonMatch[0].length,
                traceId,
              },
            );
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
          extractionMethod = 'brace-match';

          this.logger.debug(
            `[${traceId}] JSON nesnesi süslü parantezlerle tespit edildi (pozisyon: ${text.indexOf(jsonMatch[0])})`,
            'AiService.parseJsonResponse',
            __filename,
            222,
            {
              extractionMethod,
              originalLength: text.length,
              extractedLength: jsonText.length,
              matchPosition: text.indexOf(jsonMatch[0]),
              surroundingText: {
                before: text.substring(
                  Math.max(0, text.indexOf(jsonMatch[0]) - 20),
                  text.indexOf(jsonMatch[0]),
                ),
                after: text.substring(
                  text.indexOf(jsonMatch[0]) + jsonMatch[0].length,
                  Math.min(
                    text.length,
                    text.indexOf(jsonMatch[0]) + jsonMatch[0].length + 20,
                  ),
                ),
              },
              traceId,
            },
          );
        }
      }

      // Check if brackets need balancing (common AI error)
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;

      if (openBraces !== closeBraces) {
        this.logger.warn(
          `[${traceId}] JSON'da dengesiz parantezler: { = ${openBraces}, } = ${closeBraces}`,
          'AiService.parseJsonResponse',
          __filename,
          238,
          {
            openBraces,
            closeBraces,
            imbalance: Math.abs(openBraces - closeBraces),
            jsonTextPreview: jsonText.substring(0, 100) + '...',
            formattingIssue: 'unbalanced-braces',
            traceId,
          },
        );

        // Attempt to balance brackets if possible
        if (openBraces > closeBraces) {
          const missingCloseBraces = openBraces - closeBraces;
          const originalText = jsonText;
          jsonText = jsonText + '}'.repeat(missingCloseBraces);

          this.logger.debug(
            `[${traceId}] ${missingCloseBraces} adet kapanış süslü parantezi eklendi (yeni uzunluk: ${jsonText.length})`,
            'AiService.parseJsonResponse',
            __filename,
            254,
            {
              missingCloseBraces,
              originalLength: originalText.length,
              newLength: jsonText.length,
              recovery: 'added-closing-braces',
              traceId,
            },
          );
        } else if (closeBraces > openBraces) {
          const missingOpenBraces = closeBraces - openBraces;
          const originalText = jsonText;
          jsonText = '{'.repeat(missingOpenBraces) + jsonText;

          this.logger.debug(
            `[${traceId}] ${missingOpenBraces} adet açılış süslü parantezi eklendi (yeni uzunluk: ${jsonText.length})`,
            'AiService.parseJsonResponse',
            __filename,
            263,
            {
              missingOpenBraces,
              originalLength: originalText.length,
              newLength: jsonText.length,
              recovery: 'added-opening-braces',
              traceId,
            },
          );
        }
      }

      // Check for and replace invalid escape sequences
      if (jsonText.includes('\\')) {
        const originalText = jsonText;
        const invalidEscapeRegex = /\\(?!["\\/bfnrt])/g;
        const hasInvalidEscapes = invalidEscapeRegex.test(jsonText);

        // Fix common invalid escape sequences
        if (hasInvalidEscapes) {
          jsonText = jsonText
            .replace(/\\(?!["\\/bfnrt])/g, '\\\\') // Escape backslashes that aren't part of valid escapes
            .replace(/\n/g, '\\n') // Replace newlines with proper escape
            .replace(/\r/g, '\\r') // Replace carriage returns
            .replace(/\t/g, '\\t') // Replace tabs
            .replace(/"/g, '\\"'); // Escape quotes

          this.logger.debug(
            `[${traceId}] Geçersiz escape karakterleri düzeltildi (önceki: ${originalText.length}, yeni: ${jsonText.length})`,
            'AiService.parseJsonResponse',
            __filename,
            281,
            {
              originalLength: originalText.length,
              newLength: jsonText.length,
              recovery: 'fixed-escape-sequences',
              invalidEscapesFound: hasInvalidEscapes,
              traceId,
            },
          );
        }
      }

      // Try to parse the JSON text
      try {
        const parseStartTime = Date.now();
        const parsedData = JSON.parse(jsonText) as T;
        const parseEndTime = Date.now();

        // Check if the parsed data has structure
        const isNull = parsedData === null;
        const isEmpty =
          typeof parsedData === 'object' &&
          parsedData !== null &&
          Object.keys(parsedData).length === 0;

        if (isNull || isEmpty) {
          this.logger.warn(
            `[${traceId}] JSON parse edildi fakat sonuç ${isNull ? 'null' : 'boş nesne'}`,
            'AiService.parseJsonResponse',
            __filename,
            299,
            {
              parsedDataType: typeof parsedData,
              isNull,
              isEmpty,
              parseTimeMs: parseEndTime - parseStartTime,
              traceId,
            },
          );
        }

        const duration = Date.now() - startTime;

        this.logger.debug(
          `[${traceId}] JSON başarıyla parse edildi (${duration}ms, metod: ${extractionMethod})`,
          'AiService.parseJsonResponse',
          __filename,
          313,
          {
            duration,
            parseTimeMs: parseEndTime - parseStartTime,
            extractionMethod,
            resultKeys:
              parsedData !== null && typeof parsedData === 'object'
                ? Object.keys(parsedData)
                : [],
            resultSize: JSON.stringify(parsedData).length,
            traceId,
          },
        );

        return parsedData;
      } catch (parseError) {
        const error = parseError as Error;
        this.logger.error(
          `[${traceId}] JSON parse hatası: ${error.message} (metin: ${jsonText.substring(0, 100)}...)`,
          'AiService.parseJsonResponse',
          __filename,
          326,
          error, // Hata nesnesi
          {
            jsonTextPreview:
              jsonText.substring(0, 150) + (jsonText.length > 150 ? '...' : ''),
            jsonTextLength: jsonText.length,
            positionHint:
              error.message.match(/position (\d+)/)?.[1] || 'unknown',
            extractionMethod,
            traceId,
          },
        );

        // Make one more attempt with direct regex
        const lastResortMatch = text.match(/\{[\s\S]*\}/);

        if (lastResortMatch) {
          try {
            const lastResortJson = lastResortMatch[0];
            const recoveryStartTime = Date.now();
            const parsedData = JSON.parse(lastResortJson) as T;
            const recoveryEndTime = Date.now();

            const duration = Date.now() - startTime;

            this.logger.info(
              `[${traceId}] Son çare recovery ile JSON başarıyla parse edildi (${duration}ms, kurtarma süresi: ${recoveryEndTime - recoveryStartTime}ms)`,
              'AiService.parseJsonResponse',
              __filename,
              343,
              {
                recoveryMethod: 'regex-direct',
                originalError: parseError.message,
                processingTime: duration,
                recoveryTime: recoveryEndTime - recoveryStartTime,
                matchPosition: text.indexOf(lastResortMatch[0]),
                matchLength: lastResortMatch[0].length,
                traceId,
              },
            );

            return parsedData;
          } catch (lastError) {
            const error = lastError as Error;
            this.logger.error(
              `[${traceId}] Son çare JSON parse denemesi de başarısız oldu: ${error.message}`,
              'AiService.parseJsonResponse',
              __filename,
              355,
              error, // Hata nesnesi
              {
                originalError: parseError.message,
                failureReason: 'both-parsing-attempts-failed',
                traceId,
              },
            );
          }
        }

        // If we get here, both attempts failed
        throw parseError;
      }
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;

      this.logger.error(
        `[${traceId}] JSON parse hatası: ${err.message} (${duration}ms)`,
        'AiService.parseJsonResponse',
        __filename,
        371,
        err, // Hata nesnesi
        {
          processingTime: duration,
          textFirstChars: text.substring(0, 150),
          textLastChars: text.substring(Math.max(0, text.length - 150)),
          textLength: text.length,
          traceId,
        },
      );

      // Log the text that failed to parse (truncated)
      const maxLogLength = 500;
      if (text.length > maxLogLength) {
        this.logger.debug(
          `[${traceId}] Parse edilemeyen metin (kısaltılmış, toplam ${text.length} karakter): ${text.substring(0, maxLogLength / 2)}...${text.substring(text.length - maxLogLength / 2)}`,
          'AiService.parseJsonResponse',
          __filename,
          387,
          {
            textLength: text.length,
            loggedChars: maxLogLength,
            failureType: 'complete-parse-failure',
            traceId,
          },
        );
      } else {
        this.logger.debug(
          `[${traceId}] Parse edilemeyen metin (tam, ${text.length} karakter): ${text}`,
          'AiService.parseJsonResponse',
          __filename,
          397,
          {
            textLength: text.length,
            failureType: 'complete-parse-failure',
            traceId,
          },
        );
      }

      throw new Error(
        `AI yanıt formatı geçersiz veya parse edilemedi: ${err.message}`,
      );
    }
  }

  /**
   * Detect topics from the provided document text
   */
  @LogMethod({ trackParams: true })
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
        'AiService.detectTopics',
        __filename,
        260,
        {
          textLength: documentText.length,
          existingTopicsCount: existingTopics.length,
          hasCacheKey: !!cacheKey,
          memoryUsage: process.memoryUsage(),
          traceId,
        },
      );

      this.flowTracker.trackStep('Dokümandan konular algılanıyor', 'AiService');

      // Eğer metin çok kısaysa uyarı ver
      if (documentText.length < 100) {
        this.logger.warn(
          `[${traceId}] Analiz için çok kısa metin (${documentText.length} karakter). Minimum önerilen: 100 karakter`,
          'AiService.detectTopics',
          __filename,
          275,
          {
            textLength: documentText.length,
            validationWarning: 'text-too-short',
            traceId,
          },
        );
      }

      // Önbellek kontrolü - eğer cacheKey verilmişse
      if (cacheKey) {
        this.logger.debug(
          `[${traceId}] Önbellek anahtarı ile kontrol: ${cacheKey}`,
          'AiService.detectTopics',
          __filename,
          284,
          {
            cacheKey,
            processingEvent: 'cache-check',
            traceId,
          },
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
          `[${traceId}] Metin çok uzun, ${maxTextLength} karaktere kısaltıldı (orijinal: ${originalLength} karakter, kırpma: %${Math.round((1 - maxTextLength / originalLength) * 100)})`,
          'AiService.detectTopics',
          __filename,
          301,
          {
            originalLength,
            truncatedLength: truncatedText.length,
            truncationPercentage: Math.round(
              (1 - maxTextLength / originalLength) * 100,
            ),
            processingEvent: 'text-truncated',
            traceId,
          },
        );
      }

      // Building the prompt using the content from detect-topics-tr.txt file
      const promptFilePath = path.resolve(
        __dirname,
        'prompts',
        'detect-topics-tr.txt',
      );
      let promptContent = '';
      let promptSource = 'file';

      try {
        const promptReadStartTime = Date.now();
        this.logger.debug(
          `[${traceId}] Prompt dosyası okunuyor: ${promptFilePath}`,
          'AiService.detectTopics',
          __filename,
          319,
          {
            promptFilePath,
            processingEvent: 'reading-prompt-file',
            traceId,
          },
        );

        promptContent = fs.readFileSync(promptFilePath, 'utf8');
        const promptReadDuration = Date.now() - promptReadStartTime;

        this.logger.debug(
          `[${traceId}] Prompt dosyası başarıyla okundu (${promptContent.length} karakter, ${promptReadDuration}ms)`,
          'AiService.detectTopics',
          __filename,
          327,
          {
            promptLength: promptContent.length,
            promptReadDuration,
            promptFirstLines: promptContent.split('\n').slice(0, 3).join('\n'),
            processingEvent: 'prompt-file-read-success',
            traceId,
          },
        );
      } catch (error) {
        promptSource = 'default';
        this.logger.error(
          `[${traceId}] Prompt dosyası okuma hatası: ${error.message}, varsayılan prompt kullanılacak`,
          'AiService.detectTopics',
          __filename,
          334,
          error, // Error nesnesi en uygun biçimde
          {
            // 'error' yerine 'errorMessage' kullan
            errorMessage: error.message,
            errorName: error.name,
            errorType: error.constructor?.name || 'Unknown',
            errorCode: (error as any).code || 'UNKNOWN',
            promptFilePath,
            processingError: 'prompt-file-read-error',
            traceId,
          },
        );

        this.logger.info(
          `[${traceId}] Varsayılan prompt kullanılıyor (${DEFAULT_TOPIC_DETECTION_PROMPT_TR.length} karakter)`,
          'AiService.detectTopics',
          __filename,
          345,
          {
            promptSource,
            promptLength: DEFAULT_TOPIC_DETECTION_PROMPT_TR.length,
            processingEvent: 'using-default-prompt',
            traceId,
          },
        );

        promptContent = DEFAULT_TOPIC_DETECTION_PROMPT_TR;
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
      const promptBuildTime = Date.now() - processingStartTime;

      this.logger.debug(
        `[${traceId}] Hazırlanan prompt uzunluğu: ${fullPrompt.length} karakter (oluşturma: ${promptBuildTime}ms)`,
        'AiService.detectTopics',
        __filename,
        364,
        {
          promptLength: fullPrompt.length,
          hasExistingTopics: existingTopics.length > 0,
          existingTopicsCount: existingTopics.length,
          promptBuildTime,
          promptTextRatio: truncatedText.length / fullPrompt.length,
          processingEvent: 'prompt-prepared',
          traceId,
        },
      );

      // Get AI service configuration from the instance variable
      this.logger.debug(
        `[${traceId}] Kullanılan LLM yapılandırması: ${JSON.stringify(this.llmConfig)}`,
        'AiService.detectTopics',
        __filename,
        375,
        {
          llmConfig: this.llmConfig,
          processingEvent: 'using-llm-config',
          traceId,
        },
      );

      // Track the AI service being used
      this.flowTracker.trackStep(
        `Kullanılan AI servisi: ${this.llmConfig.provider}`,
        'AiService',
      );

      let result: TopicDetectionResult = { topics: [] };

      // Her durumda yeniden deneme mekanizması kullan
      this.logger.info(
        `[${traceId}] AI modeli çağrısı başlatılıyor (provider: ${this.llmConfig.provider})`,
        'AiService.detectTopics',
        __filename,
        389,
        {
          provider: this.llmConfig.provider,
          retries: this.RETRY_OPTIONS.retries,
          promptTokenEstimate: Math.ceil(fullPrompt.length / 4),
          processingEvent: 'ai-call-start',
          traceId,
        },
      );

      const aiCallStartTime = Date.now();

      // Birinci iyileştirme: pRetry kullanımı için tip tanımını düzeltelim
      result = await pRetry(async (attempt: number) => {
        // Attempt her zaman bir number'dır
        const attemptNumber = attempt;

        this.logger.debug(
          `[${traceId}] AI isteği deneme #${attemptNumber} başlatılıyor`,
          'AiService.detectTopics',
          __filename,
          398,
          {
            attemptNumber,
            maxAttempts: this.RETRY_OPTIONS.retries,
            provider: this.llmConfig.provider,
            elapsedTimeSinceStart: Date.now() - aiCallStartTime,
            processingEvent: 'ai-attempt-start',
            traceId,
          },
        );

        const attemptStartTime = Date.now();

        try {
          // Choose AI service based on configuration
          let response: TopicDetectionResult;

          if (this.llmConfig.provider === 'gemini') {
            response = await this.getTopicsWithGemini(fullPrompt);
          } else if (this.llmConfig.provider === 'openai') {
            response = await this.getTopicsWithOpenAI(fullPrompt);
          } else {
            throw new Error(
              `Desteklenmeyen LLM sağlayıcısı: ${this.llmConfig.provider}`,
            );
          }

          const attemptDuration = Date.now() - attemptStartTime;

          this.logger.debug(
            `[${traceId}] AI isteği deneme #${attemptNumber} başarılı (${attemptDuration}ms)`,
            'AiService.detectTopics',
            __filename,
            422,
            {
              attemptNumber,
              attemptDuration,
              topicsCount: response.topics.length,
              processingEvent: 'ai-attempt-success',
              traceId,
            },
          );

          return response;
        } catch (attemptError) {
          const attemptDuration = Date.now() - attemptStartTime;

          this.logger.warn(
            `[${traceId}] AI isteği deneme #${attemptNumber} başarısız (${attemptDuration}ms): ${attemptError.message}`,
            'AiService.detectTopics',
            __filename,
            439,
            {
              attemptNumber,
              attemptDuration,
              error: attemptError.message,
              errorType: attemptError.constructor?.name || 'Unknown',
              processingEvent: 'ai-attempt-failed',
              traceId,
            },
          );

          // Yeniden deneme yapılacaksa bu hatayı fırlat
          throw attemptError;
        }
      }, this.RETRY_OPTIONS);

      const aiCallDuration = Date.now() - aiCallStartTime;

      this.logger.info(
        `[${traceId}] AI modeli yanıt verdi (${aiCallDuration}ms)`,
        'AiService.detectTopics',
        __filename,
        418,
        {
          aiCallDuration,
          topicsCount: result.topics.length,
          processingEvent: 'ai-call-completed',
          traceId,
        },
      );

      // Check if we got valid results
      if (!result || !result.topics || !Array.isArray(result.topics)) {
        this.logger.error(
          `[${traceId}] AI çıktısı geçersiz format içeriyor: ${JSON.stringify(result)}`,
          'AiService.detectTopics',
          __filename,
          429,
          new Error('Invalid AI response format'), // Hata nesnesi oluştur
          {
            // 'result' yerine 'resultData' kullan
            resultData: result
              ? JSON.stringify(result).substring(0, 100)
              : 'null',
            validationError: 'invalid-ai-response-format',
            traceId,
          },
        );

        throw new Error(
          'AI servisinden geçersiz konu algılama sonuç formatı alındı',
        );
      }

      // Sonuç boşsa veya çok az konu içeriyorsa uyarı log'u
      if (result.topics.length === 0) {
        this.logger.warn(
          `[${traceId}] Belgede hiçbir konu algılanamadı`,
          'AiService.detectTopics',
          __filename,
          441,
          {
            documentLength: documentText.length,
            truncated: isTextTruncated,
            validationWarning: 'no-topics-detected',
            traceId,
          },
        );
      } else if (result.topics.length < 3 && documentText.length > 1000) {
        this.logger.warn(
          `[${traceId}] Uzun belgede çok az konu algılandı (${result.topics.length})`,
          'AiService.detectTopics',
          __filename,
          452,
          {
            topicsCount: result.topics.length,
            documentLength: documentText.length,
            validationWarning: 'few-topics-for-long-document',
            traceId,
          },
        );
      }

      const processingDuration = Date.now() - processingStartTime;

      // Log the results
      this.logger.info(
        `[${traceId}] Belgeden ${result.topics.length} konu tespit edildi (toplam: ${processingDuration}ms, AI çağrısı: ${aiCallDuration}ms)`,
        'AiService.detectTopics',
        __filename,
        466,
        {
          topicsCount: result.topics.length,
          processingDuration,
          aiCallDuration,
          aiCallPercentage: Math.round(
            (aiCallDuration / processingDuration) * 100,
          ),
          mainTopicsCount: result.topics.filter((t) => t.isMainTopic).length,
          subTopicsCount: result.topics.filter((t) => !t.isMainTopic).length,
          memoryUsage: process.memoryUsage(),
          processingEvent: 'topics-detection-completed',
          traceId,
        },
      );

      // Önbellekte saklama işlemi burada yapılabilir
      if (cacheKey) {
        this.logger.debug(
          `[${traceId}] Sonuçlar önbelleğe alınabilir: ${cacheKey}`,
          'AiService.detectTopics',
          __filename,
          480,
          {
            cacheKey,
            topicsCount: result.topics.length,
            processingEvent: 'cache-store-opportunity',
            traceId,
          },
        );
        // TODO: Önbellek implementasyonu
      }

      return result;
    } catch (err) {
      const error = err as Error;
      const processingDuration = Date.now() - processingStartTime;

      this.logger.error(
        `[${traceId}] Konu tespit hatası: ${error.message} (${processingDuration}ms)`,
        'AiService.detectTopics',
        __filename,
        492,
        error, // Hata nesnesi
        {
          processingDuration,
          documentLength: documentText?.length || 0,
          processingError: 'topic-detection-failed',
          traceId,
        },
      );

      // Kullanıcı dostu hata mesajı
      let errorMessage = 'Konular tespit edilemedi';
      let errorDetails = '';

      if (
        error.message.includes('rate limit') ||
        error.message.includes('quota')
      ) {
        errorMessage = 'AI servis kota sınırına ulaşıldı';
        errorDetails = 'Kota sınırlaması nedeniyle istek reddedildi';
      } else if (
        error.message.includes('harmful') ||
        error.message.includes('safety')
      ) {
        errorMessage = 'İçerik güvenliği kontrollerinde takıldı';
        errorDetails = 'Metin içeriği içerik kurallarını ihlal ediyor olabilir';
      } else if (
        error.message.includes('connect') ||
        error.message.includes('network') ||
        error.message.includes('timeout')
      ) {
        errorMessage = 'AI servisi bağlantı sorunu';
        errorDetails = 'API servisine bağlantı kurulamadı';
      } else if (error.message.includes('format')) {
        errorMessage = 'AI servisi yanıtı işlenemedi';
        errorDetails = 'Yanıt beklenmeyen bir formatta döndü';
      }

      this.logger.warn(
        `[${traceId}] Kullanıcıya gösterilecek hata: ${errorMessage} (${errorDetails})`,
        'AiService.detectTopics',
        __filename,
        525,
        {
          errorMessage,
          errorDetails,
          originalError: error.message,
          processingEvent: 'user-friendly-error-generated',
          traceId,
        },
      );

      throw new BadRequestException(errorMessage, errorDetails);
    }
  }

  /**
   * Normalize topic detection result
   */
  @LogMethod()
  private normalizeTopicResult(result: any): TopicDetectionResult {
    const startTime = Date.now();
    const traceId = `norm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.logger.debug(
        `[${traceId}] Konu sonuçları normalize ediliyor`,
        'AiService.normalizeTopicResult',
        __filename,
        421,
        {
          resultType: typeof result,
          hasTopics: !!result?.topics,
          resultKeys: result ? Object.keys(result) : [],
          traceId,
        },
      );

      const normalizedResult: TopicDetectionResult = {
        topics: [],
      };

      if (!result) {
        this.logger.error(
          `[${traceId}] Normalize edilecek sonuç nesnesi boş veya tanımsız`,
          'AiService.normalizeTopicResult',
          __filename,
          432,
          undefined, // Error nesnesi yok
          {
            resultValue: result ? 'undefined' : 'null',
            validationFailed: 'null-or-undefined-result',
            traceId,
          },
        );
        return normalizedResult;
      }

      if (!result.topics) {
        this.logger.error(
          `[${traceId}] Sonuç nesnesinde topics alanı yok veya tanımsız`,
          'AiService.normalizeTopicResult',
          __filename,
          441,
          undefined, // Error nesnesi yok
          {
            resultKeys: Object.keys(result),
            availableFields: JSON.stringify(result).substring(0, 200),
            validationFailed: 'missing-topics-field',
            traceId,
          },
        );
        return normalizedResult;
      }

      if (!Array.isArray(result.topics)) {
        this.logger.error(
          `[${traceId}] Sonuç nesnesindeki topics alanı bir dizi değil (tipi: ${typeof result.topics})`,
          'AiService.normalizeTopicResult',
          __filename,
          450,
          undefined, // null yerine undefined
          {
            topicsType: typeof result.topics,
            topicsValue: JSON.stringify(result.topics).substring(0, 200),
            validationFailed: 'topics-not-array',
            traceId,
          },
        );
        return normalizedResult;
      }

      if (result.topics.length === 0) {
        this.logger.warn(
          `[${traceId}] Sonuç nesnesindeki topics dizisi boş`,
          'AiService.normalizeTopicResult',
          __filename,
          459,
          {
            validationWarning: 'empty-topics-array',
            traceId,
          },
        );
        return normalizedResult;
      }

      this.logger.debug(
        `[${traceId}] Normalize edilecek ${result.topics.length} konu bulundu`,
        'AiService.normalizeTopicResult',
        __filename,
        467,
        {
          topicsCount: result.topics.length,
          firstFewTopics: result.topics
            .slice(0, 3)
            .map((t) =>
              typeof t === 'object'
                ? t.mainTopic ||
                  t.subTopicName ||
                  JSON.stringify(t).substring(0, 50)
                : String(t),
            ),
          traceId,
        },
      );

      // İşleme başlangıcı: Her bir konu için ayrıntılı loglama
      let mainTopicCounter = 0;
      let subTopicCounter = 0;
      let errorCounter = 0;
      const processingStartTime = Date.now();

      // Convert to the expected format and normalize topic names
      result.topics.forEach((topic, index) => {
        try {
          // Handle main topics
          if (topic.mainTopic) {
            const mainTopicName = String(topic.mainTopic || ''); // String'e çevir

            if (!mainTopicName || mainTopicName.trim() === '') {
              this.logger.warn(
                `[${traceId}] Ana konu adı boş (index: ${index})`,
                'AiService.normalizeTopicResult',
                __filename,
                485,
                {
                  topic,
                  index,
                  processingWarning: 'empty-main-topic-name',
                  traceId,
                },
              );
              return; // Bu konuyu atla
            }

            const normalizationStartTime = Date.now();
            const normalizedName =
              this.normalizationService.normalizeSubTopicName(mainTopicName);
            const normalizationDuration = Date.now() - normalizationStartTime;

            const mainTopic = {
              subTopicName: mainTopicName,
              normalizedSubTopicName: normalizedName,
              isMainTopic: true,
            };

            this.logger.debug(
              `[${traceId}] Ana konu normalize edildi: "${mainTopicName}" → "${mainTopic.normalizedSubTopicName}" (${normalizationDuration}ms)`,
              'AiService.normalizeTopicResult',
              __filename,
              498,
              {
                original: mainTopicName,
                normalized: mainTopic.normalizedSubTopicName,
                normalizationDuration,
                index,
                traceId,
              },
            );

            normalizedResult.topics.push(mainTopic);
            mainTopicCounter++;

            // Handle sub-topics if they exist
            if (topic.subTopics && Array.isArray(topic.subTopics)) {
              this.logger.debug(
                `[${traceId}] Ana konu "${mainTopicName}" için ${topic.subTopics.length} alt konu işleniyor`,
                'AiService.normalizeTopicResult',
                __filename,
                513,
                {
                  subTopicsCount: topic.subTopics.length,
                  parentTopic: mainTopicName,
                  traceId,
                },
              );

              topic.subTopics.forEach((subTopic, subIndex) => {
                try {
                  // Alt konu farklı formatlarda gelebilir (string, object, vs.)
                  let subTopicName = '';
                  let sourceFormat = 'unknown';

                  if (typeof subTopic === 'string') {
                    subTopicName = subTopic;
                    sourceFormat = 'string';
                  } else if (subTopic && typeof subTopic === 'object') {
                    // Nesne formatında bir alt konu
                    if (subTopic.subTopicName) {
                      subTopicName = String(subTopic.subTopicName);
                      sourceFormat = 'object-with-subTopicName';
                    } else if (subTopic.name) {
                      subTopicName = String(subTopic.name);
                      sourceFormat = 'object-with-name';
                    } else {
                      // Diğer nesne özelliklerini kontrol et
                      const keys = Object.keys(subTopic);
                      if (keys.length > 0) {
                        // İlk string değeri bul
                        for (const key of keys) {
                          const value = subTopic[key];
                          if (
                            typeof value === 'string' &&
                            value.trim() !== ''
                          ) {
                            subTopicName = value;
                            sourceFormat = `object-with-${key}`;
                            break;
                          }
                        }
                      }
                    }
                  }

                  // Eğer hala boşsa varsayılan bir isim kullan
                  if (!subTopicName || subTopicName.trim() === '') {
                    this.logger.warn(
                      `[${traceId}] Boş alt konu adı, varsayılan ad kullanılıyor (parent: ${mainTopicName}, index: ${subIndex})`,
                      'AiService.normalizeTopicResult',
                      __filename,
                      538,
                      {
                        subTopic,
                        sourceFormat,
                        subIndex,
                        parentTopic: mainTopicName,
                        processingWarning: 'empty-subtopic-name-using-default',
                        traceId,
                      },
                    );
                    subTopicName = `Alt Konu ${subIndex + 1}`;
                  }

                  const normalizationStartTime = Date.now();
                  const normalizedSubTopicName =
                    this.normalizationService.normalizeSubTopicName(
                      subTopicName,
                    );
                  const normalizationDuration =
                    Date.now() - normalizationStartTime;

                  const normalizedSubTopic = {
                    subTopicName: subTopicName,
                    normalizedSubTopicName: normalizedSubTopicName,
                    parentTopic: mainTopicName,
                    isMainTopic: false,
                  };

                  this.logger.debug(
                    `[${traceId}] Alt konu normalize edildi (ana konu: "${mainTopicName}"): "${subTopicName}" → "${normalizedSubTopic.normalizedSubTopicName}" (${normalizationDuration}ms)`,
                    'AiService.normalizeTopicResult',
                    __filename,
                    552,
                    {
                      original: subTopicName,
                      normalized: normalizedSubTopic.normalizedSubTopicName,
                      parentTopic: mainTopicName,
                      normalizationDuration,
                      sourceFormat,
                      subIndex,
                      traceId,
                    },
                  );

                  normalizedResult.topics.push(normalizedSubTopic);
                  subTopicCounter++;
                } catch (subTopicError) {
                  errorCounter++;
                  this.logger.error(
                    `[${traceId}] Alt konu normalizasyon hatası (ana konu: ${mainTopicName}, index: ${subIndex}): ${subTopicError.message}`,
                    'AiService.normalizeTopicResult',
                    __filename,
                    569,
                    subTopicError, // Hata nesnesi
                    {
                      errorMessage: subTopicError.message,
                      errorName: subTopicError.name,
                      errorType: subTopicError.constructor?.name || 'Unknown',
                      errorStack: subTopicError.stack,
                      parentTopic: mainTopicName,
                      subTopic:
                        typeof subTopic === 'object'
                          ? JSON.stringify(subTopic).substring(0, 200)
                          : String(subTopic),
                      subIndex,
                      processingError: 'subtopic-normalization-error',
                      traceId,
                    },
                  );
                }
              });
            } else if (topic.subTopics) {
              this.logger.warn(
                `[${traceId}] Ana konu "${mainTopicName}" için subTopics bir dizi değil (tipi: ${typeof topic.subTopics})`,
                'AiService.normalizeTopicResult',
                __filename,
                584,
                {
                  subTopicsType: typeof topic.subTopics,
                  mainTopic: mainTopicName,
                  processingWarning: 'subtopics-not-array',
                  traceId,
                },
              );
            }
          } else {
            // Check if it's a direct topic object without main/sub structure
            let topicName = '';

            if (typeof topic === 'string') {
              topicName = topic;
            } else if (topic && typeof topic === 'object') {
              if (topic.name) {
                topicName = String(topic.name);
              } else if (topic.topic) {
                topicName = String(topic.topic);
              } else if (topic.subTopicName) {
                topicName = String(topic.subTopicName);
              }
            }

            if (topicName && topicName.trim() !== '') {
              const normalizedTopicName =
                this.normalizationService.normalizeSubTopicName(topicName);

              normalizedResult.topics.push({
                subTopicName: topicName,
                normalizedSubTopicName: normalizedTopicName,
                isMainTopic: true, // Tek seviyeli konu olduğu için ana konu olarak işaretle
              });

              mainTopicCounter++;

              this.logger.debug(
                `[${traceId}] Düz konu yapısında konu normalize edildi: "${topicName}" → "${normalizedTopicName}"`,
                'AiService.normalizeTopicResult',
                __filename,
                615,
                {
                  original: topicName,
                  normalized: normalizedTopicName,
                  topicStructure: 'flat-topic',
                  traceId,
                },
              );
            } else {
              this.logger.warn(
                `[${traceId}] Geçersiz konu yapısı (index: ${index}): ${JSON.stringify(topic).substring(0, 100)}`,
                'AiService.normalizeTopicResult',
                __filename,
                626,
                {
                  topic: JSON.stringify(topic).substring(0, 200),
                  index,
                  processingWarning: 'invalid-topic-structure',
                  traceId,
                },
              );
            }
          }
        } catch (topicError) {
          errorCounter++;
          this.logger.error(
            `[${traceId}] Konu normalizasyon hatası (index: ${index}): ${topicError.message}`,
            'AiService.normalizeTopicResult',
            __filename,
            638,
            topicError, // Hata nesnesi
            {
              errorMessage: topicError.message,
              errorName: topicError.name,
              errorType: topicError.constructor?.name || 'Unknown',
              errorStack: topicError.stack,
              topic: JSON.stringify(topic).substring(0, 200),
              index,
              processingError: 'topic-normalization-error',
              traceId,
            },
          );
        }
      });

      const processingDuration = Date.now() - processingStartTime;
      const totalDuration = Date.now() - startTime;

      // Başarıyla tamamlandığını bildir
      this.logger.info(
        `[${traceId}] Konu normalizasyonu tamamlandı: ${normalizedResult.topics.length} konu (${mainTopicCounter} ana, ${subTopicCounter} alt) (${totalDuration}ms)`,
        'AiService.normalizeTopicResult',
        __filename,
        654,
        {
          totalTopics: normalizedResult.topics.length,
          mainTopics: mainTopicCounter,
          subTopics: subTopicCounter,
          errorCount: errorCounter,
          processingDuration,
          totalDuration,
          traceId,
        },
      );

      return normalizedResult;
    } catch (err) {
      const error = err as Error;
      const duration = Date.now() - startTime;

      this.logger.error(
        `[${traceId}] Konu normalizasyon genel hatası: ${error.message} (${duration}ms)`,
        'AiService.normalizeTopicResult',
        __filename,
        670,
        error, // Hata nesnesi
        {
          resultData: result
            ? JSON.stringify(result).substring(0, 200) + '...'
            : 'null',
          duration,
          processingError: 'general-normalization-error',
          traceId,
        },
      );

      // Boş sonuç dön
      return { topics: [] };
    }
  }

  /**
   * Parses the AI response for topic detection
   */
  @LogMethod()
  private parseTopicDetectionResponse(response: string): any {
    try {
      this.flowTracker.trackStep('Konu algılama yanıtı işleniyor', 'AiService');
      // Parse JSON using the generic method
      return this.parseJsonResponse(response);
    } catch (error) {
      this.logger.logError(error, 'AiService.parseTopicDetectionResponse', {
        responseLength: response?.length || 0,
      });
      throw new InternalServerErrorException(
        'AI response could not be processed',
      );
    }
  }

  /**
   * Parse the AI response for quiz generation
   */
  @LogMethod()
  private parseQuizGenerationResponse(response: string): QuizQuestion[] {
    try {
      this.flowTracker.trackStep(
        'Quiz oluşturma yanıtı işleniyor',
        'AiService',
      );
      // Parse JSON using the generic method
      const jsonResponse = this.parseJsonResponse<
        QuizQuestion[] | { questions: QuizQuestion[] }
      >(response);

      // Validate and transform the response
      const questions = Array.isArray(jsonResponse)
        ? jsonResponse
        : jsonResponse.questions;

      if (!questions || !Array.isArray(questions)) {
        throw new Error('Invalid response format: questions array not found');
      }

      // Process each question and ensure it has all required fields
      return questions.map((q: any, index: number) => {
        // Generate an ID if not provided
        const id = q.id || `q_${Date.now()}_${index}`;

        // Ensure all required fields are present
        if (
          !q.questionText ||
          !q.options ||
          !Array.isArray(q.options) ||
          !q.correctAnswer ||
          !q.subTopic
        ) {
          throw new Error(`Question ${id} is missing required fields`);
        }

        // Use checked subTopicName with proper type checking
        const subTopicName =
          typeof q.subTopic === 'string'
            ? q.subTopic
            : q.subTopic?.toString() || 'Bilinmeyen Konu';

        return {
          id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'No explanation provided',
          subTopicName: subTopicName,
          normalizedSubTopicName:
            this.normalizationService.normalizeSubTopicName(subTopicName),
          difficulty: q.difficulty || 'medium',
        } as QuizQuestion;
      });
    } catch (error) {
      this.logger.logError(error, 'AiService.parseQuizGenerationResponse', {
        responseLength: response?.length || 0,
      });
      throw new Error(`Quiz yanıtı işlenemedi: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions based on provided topics and options
   */
  @LogMethod({ trackParams: true })
  async generateQuizQuestions(
    options: QuizGenerationOptions,
  ): Promise<QuizQuestion[]> {
    try {
      this.flowTracker.trackStep('Quiz soruları oluşturuluyor', 'AiService');
      // Prompt dosyasını oku
      const promptPath = path.join(
        __dirname,
        'prompts',
        'generate-quiz-tr.txt',
      );
      const basePrompt = await fs.promises.readFile(promptPath, 'utf-8');

      // Konu ve ayarları prompt başına ekle
      let topicsText: string;
      const subTopicsArr = options.subTopics as any[];
      if (
        Array.isArray(subTopicsArr) &&
        subTopicsArr.length > 0 &&
        typeof subTopicsArr[0] !== 'string' &&
        'count' in subTopicsArr[0]
      ) {
        topicsText = subTopicsArr
          .map<string>(
            (
              t:
                | { subTopicName: string; count: number; status?: string }
                | string,
            ) =>
              typeof t === 'string'
                ? t
                : `${t.subTopicName} (${t.count} soru, durum: ${t.status || 'pending'})`,
          )
          .join('\n');
      } else {
        // If not the complex type, assume it's string[] based on QuizGenerationOptions
        const stringTopics = options.subTopics as string[]; // Cast based on interface
        topicsText = Array.isArray(stringTopics)
          ? stringTopics
              .map<string>((t: string) => t) // Now t is string
              .join(', ')
          : 'Belirtilen konu yok';
      }

      const ayarMetni = `Soru sayısı: ${options.questionCount}\nZorluk: ${options.difficulty}\nKonu listesi:\n${topicsText}`;
      const promptText = `${ayarMetni}\n\n${basePrompt}`;

      // p-retry ile gelişmiş yeniden deneme mekanizması
      return await pRetry(async () => {
        const result: GenerateContentResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
        });

        const response = result.response;
        const text = response.text();

        if (!text) {
          throw new Error("AI'dan boş yanıt alındı");
        }

        return this.parseQuizGenerationResponse(text);
      }, this.RETRY_OPTIONS);
    } catch (error) {
      this.logger.logError(error, 'AiService.generateQuizQuestions', {
        subTopicsCount: options.subTopics?.length || 0,
        difficulty: options.difficulty,
        questionCount: options.questionCount,
      });
      throw error;
    }
  }

  /**
   * Doküman metni özetleme
   */
  @LogMethod({ trackParams: true })
  async generateDocumentSummary(
    documentText: string,
    maxLength: number = 500,
  ): Promise<string> {
    try {
      this.flowTracker.trackStep('Doküman özeti oluşturuluyor', 'AiService');
      // Prompt hazırlama
      const prompt = `**Rol:** Sen, karmaşık ve uzun akademik veya teknik metinleri anlaşılır ve özlü özetlere dönüştüren bir Uzman İçerik Özetleyicisin.

**Görev:** Aşağıdaki metni özlü, anlaşılır ve tutarlı bir özete dönüştür. Özet, ana fikirleri, temel kavramları ve önemli noktaları içermeli, ancak gereksiz detayları ve tekrarları elemeli.

**Kurallar:**
1. Özet en fazla ${maxLength} karakter olmalı.
2. Metnin ana fikir ve kavramlarına odaklan.
3. Özet, orijinal metnin yapısını ve akışını yansıtmalı.
4. Anlaşılır, akıcı bir dil kullan.
5. Herhangi bir kişisel yorum veya değerlendirme ekleme.
6. Alıntı veya dipnot kullanma.

**Metin:**
${documentText.substring(0, 15000)}

**Özet:**`;

      // p-retry ile gelişmiş yeniden deneme mekanizması
      return await pRetry(async () => {
        const result: GenerateContentResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const summary: string = result.response.text();

        if (!summary) {
          throw new Error("AI'dan boş özet yanıtı alındı");
        }

        return summary;
      }, this.RETRY_OPTIONS);
    } catch (error) {
      this.logger.logError(error, 'AiService.generateDocumentSummary', {
        documentLength: documentText?.length || 0,
        maxLength,
      });
      throw error;
    }
  }

  /**
   * Belirli bir konu veya belge için açıklayıcı içerik üretir
   */
  @LogMethod({ trackParams: true })
  async generateExplanatoryContent(
    topic: string,
    documentText?: string,
    contentType:
      | 'definition'
      | 'example'
      | 'detailed_explanation'
      | 'comparison' = 'detailed_explanation',
  ): Promise<string> {
    try {
      this.flowTracker.trackStep(
        `${topic} konusu için açıklayıcı içerik oluşturuluyor`,
        'AiService',
      );
      // Prompt hazırlama
      let prompt = `**Rol:** Sen, karmaşık kavramları anlaşılır hale getiren ve öğrenmeyi kolaylaştıran bir Eğitim İçeriği Uzmanısın.

**Görev:** "${topic}" konusu hakkında bir ${this.getContentTypeInTurkish(contentType)} oluştur.`;

      if (documentText) {
        prompt += `\n\n**Referans Metin:**\n${documentText.substring(0, 10000)}`;
      }

      prompt += `\n\n**Kurallar:**
1. İçerik, konuyu anlamayı kolaylaştırmalı ve öğrenmeyi pekiştirmeli.
2. Açık, anlaşılır ve akıcı bir dil kullan.
3. Gerekirse, görselleştirmeler, benzetmeler veya gerçek dünya örnekleri kullan.
4. Karmaşık kavramları daha basit terimlerle açıkla.
5. İçerik, hedef kitlenin anlayabileceği düzeyde olmalı.
6. 300-500 kelime arasında olmalı.

**${this.getContentTypeInTurkish(contentType)}:**`;

      // p-retry ile gelişmiş yeniden deneme mekanizması
      return await pRetry(async () => {
        const result: GenerateContentResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const explanatoryContent: string = result.response.text();

        if (!explanatoryContent) {
          throw new Error("AI'dan boş açıklayıcı içerik yanıtı alındı");
        }

        return explanatoryContent;
      }, this.RETRY_OPTIONS);
    } catch (error) {
      this.logger.logError(error, 'AiService.generateExplanatoryContent', {
        topic,
        documentLength: documentText?.length || 0,
        contentType,
      });
      throw error;
    }
  }

  /**
   * İçerik türünü Türkçe'ye çevirir
   */
  @LogMethod()
  private getContentTypeInTurkish(
    contentType:
      | 'definition'
      | 'example'
      | 'detailed_explanation'
      | 'comparison',
  ): string {
    switch (contentType) {
      case 'definition':
        return 'kavram tanımı';
      case 'example':
        return 'örnek';
      case 'detailed_explanation':
        return 'detaylı açıklama';
      case 'comparison':
        return 'karşılaştırma';
      default:
        return 'içerik';
    }
  }

  /**
   * Kişiselleştirilmiş geri bildirim üretir
   */
  @LogMethod({ trackParams: true })
  async generatePersonalizedFeedback(
    quizQuestions: QuizQuestionDto[],
    userAnswers: Record<string, string>,
  ): Promise<Record<string, any>> {
    try {
      this.flowTracker.trackStep(
        'Kişiselleştirilmiş geri bildirim oluşturuluyor',
        'AiService',
      );
      // Doğru ve yanlış cevapları tespit et
      const correctAnswers: string[] = [];
      const incorrectAnswers: {
        id: string;
        question: string;
        userAnswer: string;
        correctAnswer: string;
      }[] = [];

      quizQuestions.forEach((question) => {
        const questionId = question.id;
        const userAnswer = userAnswers[questionId];

        if (userAnswer === question.correctAnswer) {
          correctAnswers.push(questionId);
        } else {
          incorrectAnswers.push({
            id: questionId,
            question: question.questionText,
            userAnswer: userAnswer || 'Cevap yok',
            correctAnswer: question.correctAnswer,
          });
        }
      });

      // Öğrenme hedeflerini grupla
      const subTopicToQuestions = quizQuestions.reduce(
        (acc, question) => {
          // Normalize the subtopic name received from the DTO
          const normalizedSubTopic =
            this.normalizationService.normalizeSubTopicName(
              question.subTopicName,
            );
          if (!acc[normalizedSubTopic]) {
            acc[normalizedSubTopic] = [];
          }
          acc[normalizedSubTopic].push(question.id);
          return acc;
        },
        <Record<string, string[]>>{},
      );

      // Alt konulara göre doğru/yanlış cevap sayılarını hesapla
      const subTopicPerformance: Record<
        string,
        { total: number; correct: number; score: number }
      > = {};

      Object.entries(subTopicToQuestions).forEach(
        ([normalizedSubTopic, questionIds]) => {
          const total = questionIds.length;
          const correct = questionIds.filter((id) =>
            correctAnswers.includes(id),
          ).length;
          const score = total > 0 ? (correct / total) * 100 : 0;

          subTopicPerformance[normalizedSubTopic] = {
            total,
            correct,
            score,
          };
        },
      );

      // Genel skorları hesapla
      const totalQuestions = quizQuestions.length;
      const totalCorrect = correctAnswers.length;
      const overallScore =
        totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Güçlü ve zayıf alanları belirle
      const weakAreas = Object.entries(subTopicPerformance)
        .filter(([, stats]) => stats.score < 50)
        .map(([subTopic]) => subTopic);

      const mediumAreas = Object.entries(subTopicPerformance)
        .filter(([, stats]) => stats.score >= 50 && stats.score < 70)
        .map(([subTopic]) => subTopic);

      const strongAreas = Object.entries(subTopicPerformance)
        .filter(([, stats]) => stats.score >= 70)
        .map(([subTopic]) => subTopic);

      // Orijinal alt konu isimlerini al
      const normalizedToOriginal = quizQuestions.reduce((acc, question) => {
        const normalizedName = this.normalizationService.normalizeSubTopicName(
          question.subTopicName,
        );
        if (!acc[normalizedName]) {
          acc[normalizedName] = question.subTopicName;
        }
        return acc;
      }, {});

      const prompt = `**Rol:** Sen, öğrencilerin sınav sonuçlarını analiz ederek kişiselleştirilmiş geri bildirim ve öğrenme önerileri oluşturan bir Eğitim Koçusun.

**Sınav Sonuçları:**
- Toplam Soru: ${totalQuestions}
- Doğru Cevap: ${totalCorrect}
- Genel Başarı Yüzdesi: ${overallScore.toFixed(2)}%

**Alt Konu Bazında Performans:**
${Object.entries(subTopicPerformance)
  .map(
    ([normalizedSubTopic, stats]) =>
      `- ${normalizedToOriginal[normalizedSubTopic]}: ${stats.correct}/${
        stats.total
      } doğru (${stats.score.toFixed(2)}%)`,
  )
  .join('\n')}

**Güçlü Alanlar (Başarı >= 70%):**
${
  strongAreas.length > 0
    ? strongAreas.map((area) => `- ${normalizedToOriginal[area]}`).join('\n')
    : '- Yok'
}

**Orta Alanlar (Başarı = 50-69%):**
${
  mediumAreas.length > 0
    ? mediumAreas.map((area) => `- ${normalizedToOriginal[area]}`).join('\n')
    : '- Yok'
}

**Zayıf Alanlar (Başarı < 50%):**
${
  weakAreas.length > 0
    ? weakAreas.map((area) => `- ${normalizedToOriginal[area]}`).join('\n')
    : '- Yok'
}

**Yanlış Cevaplanan Sorular:**
${
  incorrectAnswers.length > 0
    ? incorrectAnswers
        .map(
          (q) =>
            `- Soru: ${q.question}\n  * Kullanıcının cevabı: ${q.userAnswer}\n  * Doğru cevap: ${q.correctAnswer}`,
        )
        .join('\n\n')
    : '- Yok'
}

**Analiz ve Geri Bildirim İstekleri:**
1. Genel performansa dayalı, motive edici ve yapıcı geri bildirim (200 karakter)
2. Öğrencinin geliştirebileceği 3-5 maddelik çalışma önerileri listesi
3. Öncelikli olarak odaklanması gereken 2-3 alt konu (iyileştirilmesi gereken zayıf alanlar)
4. Öğrencinin güçlü olduğu 1-2 alt konu

**Format:**
{
  "feedback": "Genel geri bildirim buraya yazılacak",
  "recommendations": ["Öneri 1", "Öneri 2", "Öneri 3"],
  "focusAreas": ["Odak alanı 1", "Odak alanı 2"],
  "strengthAreas": ["Güçlü alan 1", "Güçlü alan 2"]}`;

      // p-retry ile gelişmiş yeniden deneme mekanizması
      const result = await pRetry(async () => {
        const result: GenerateContentResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const response = result.response.text();

        if (!response) {
          throw new Error("AI'dan boş geri bildirim yanıtı alındı");
        }

        // Merkezi parseJsonResponse metodunu kullan
        return this.parseJsonResponse<Record<string, any>>(response);
      }, this.RETRY_OPTIONS);

      this.logger.info(
        'Kişiselleştirilmiş geri bildirim başarıyla oluşturuldu',
        'AiService.generatePersonalizedFeedback',
        __filename,
        undefined,
        {
          questionsCount: quizQuestions.length,
          answersCount: Object.keys(userAnswers).length,
        },
      );

      return result;
    } catch (error) {
      this.logger.logError(error, 'AiService.generatePersonalizedFeedback', {
        questionsCount: quizQuestions.length,
        answersCount: Object.keys(userAnswers).length,
      });
      throw error;
    }
  }

  /**
   * Konular arası ilişkileri analiz ederek öğrenme haritası oluşturur
   */
  @LogMethod({ trackParams: true })
  async generateLearningPathMap(
    courseId: string,
    subTopics: Array<{ subTopicName: string; normalizedSubTopicName: string }>,
    documentText?: string,
  ): Promise<Record<string, any>> {
    try {
      this.flowTracker.trackStep(
        'Öğrenme yolu haritası oluşturuluyor',
        'AiService',
      );
      const prompt = `**Rol:** Sen, öğrencilerin öğrenme süreçlerini planlamalarına yardımcı olan bir akademik danışmansın.

**Görev:** Verilen alt konular arasındaki mantıksal ilişkileri analiz ederek bir öğrenme haritası oluştur. Bu harita, hangi konuların önkoşul olduğunu, hangi konuların daha zor olduğunu ve önerilen öğrenme sırasını göstermelidir.

**Alt Konular:**
${subTopics.map((topic) => `- ${topic.subTopicName}`).join('\n')}

${
  documentText
    ? `**İlgili Belge İçeriği:** 
${documentText.slice(0, 1500)}... (metin kısaltıldı)`
    : ''
}

**İhtiyaçlar:**
1. Konuları zorluk seviyelerine göre sınıflandır (1-5 arası, 1 en kolay)
2. Konular arasındaki bağlantıları belirle (hangi konular diğerlerinden önce öğrenilmeli)
3. Önerilen öğrenme sırası oluştur
4. Her alt konu için tahmini çalışma süresi belirle (saat cinsinden)

**Format:**
Yanıtını aşağıdaki JSON formatında ver:

{
  "topics": [
    {
      "name": "Alt Konu Adı",
      "difficulty": 3,
      "prerequisites": ["Önkoşul Konu 1", "Önkoşul Konu 2"],
      "estimatedStudyHours": 2,
      "description": "Bu konunun kısa açıklaması (1-2 cümle)"
    }
  ],
  "recommendedPath": ["Konu 1", "Konu 2", "Konu 3", "..."],
  "totalEstimatedHours": 15,
  "difficulty": "orta" // genel zorluk: "kolay", "orta", "zor"
}`;

      // p-retry ile gelişmiş yeniden deneme mekanizması
      return await pRetry(async () => {
        const result: GenerateContentResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const response = result.response.text();

        if (!response) {
          throw new Error("AI'dan boş harita yanıtı alındı");
        }

        // Merkezi parseJsonResponse metodunu kullan
        return this.parseJsonResponse<Record<string, any>>(response);
      }, this.RETRY_OPTIONS);
    } catch (error) {
      this.logger.logError(error, 'AiService.generateLearningPathMap', {
        courseId,
        subTopicsCount: subTopics.length,
        documentLength: documentText?.length || 0,
      });
      throw error;
    }
  }

  /**
   * Get topics using Gemini AI model
   */
  private async getTopicsWithGemini(
    prompt: string,
  ): Promise<TopicDetectionResult> {
    const startTime = Date.now();
    const traceId = `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.logger.info(
        `[${traceId}] Gemini AI ile konu tespiti başlatıldı (prompt: ${prompt.length} karakter)`,
        'AiService.getTopicsWithGemini',
        __filename,
        1078,
        {
          promptLength: prompt.length,
          modelName: this.llmConfig.model || 'gemini-1.5-flash',
          temperature: this.llmConfig.temperature || 0.7,
          maxTokens: this.llmConfig.maxTokens || 1024,
          processingEvent: 'gemini-call-start',
          traceId,
        },
      );

      // Use p-retry for resilience
      const aiResponse = await pRetry(async (attempt: number) => {
        // Attempt her zaman bir number'dır
        const attemptNumber = attempt;

        try {
          this.logger.debug(
            `[${traceId}] Gemini API isteği başlatılıyor (deneme: ${attemptNumber})`,
            'AiService.getTopicsWithGemini',
            __filename,
            1089,
            {
              attemptNumber,
              maxAttempts: this.RETRY_OPTIONS.retries,
              elapsedSinceStart: Date.now() - startTime,
              processingEvent: 'gemini-attempt-start',
              traceId,
            },
          );

          // AI isteği zamanını izle
          const attemptStartTime = Date.now();

          // İstek parametrelerini hazırla
          const requestParams: any = {
            temperature: this.llmConfig.temperature || 0.7,
            maxOutputTokens: this.llmConfig.maxTokens || 1024,
          };

          const geminiModel = this.model;
          const response = await geminiModel.generateContent(
            prompt,
            requestParams,
          );
          const responseText = response.response.text();
          const responseTime = Date.now() - attemptStartTime;

          this.logger.debug(
            `[${traceId}] Gemini API yanıtı alındı (${responseTime}ms, deneme: ${attemptNumber})`,
            'AiService.getTopicsWithGemini',
            __filename,
            1103,
            {
              responseTime,
              attemptNumber,
              promptTokenEstimate: Math.ceil(prompt.length / 4),
              outputTokenEstimate: Math.ceil(responseText.length / 4),
              requestParams,
              processingEvent: 'gemini-response-received',
              traceId,
            },
          );

          this.logger.debug(
            `[${traceId}] Yanıt metin uzunluğu: ${responseText.length} karakter (deneme: ${attemptNumber})`,
            'AiService.getTopicsWithGemini',
            __filename,
            1119,
            {
              textLength: responseText.length,
              attemptNumber,
              responsePreview: responseText.substring(0, 200),
              processingEvent: 'gemini-text-received',
              traceId,
            },
          );

          // JSON yanıtını ayrıştır
          const jsonParseStart = Date.now();
          const parsedResponse = this.parseTopicDetectionResponse(responseText);
          const parseTime = Date.now() - jsonParseStart;

          this.logger.debug(
            `[${traceId}] Gemini yanıtı başarıyla JSON'a çevrildi (${parseTime}ms, toplam: ${Date.now() - attemptStartTime}ms)`,
            'AiService.getTopicsWithGemini',
            __filename,
            1131,
            {
              parseTime,
              attemptDuration: Date.now() - attemptStartTime,
              attemptNumber,
              parsedTopics: parsedResponse.topics
                ? parsedResponse.topics.length
                : 0,
              hasTopicsArray: !!parsedResponse.topics,
              processingEvent: 'gemini-parse-success',
              traceId,
            },
          );

          return parsedResponse;
        } catch (error) {
          // Hata detayları
          this.logger.error(
            `[${traceId}] Gemini API yanıtı işlenirken hata oluştu (deneme: ${attemptNumber}): ${error.message}`,
            'AiService.getTopicsWithGemini',
            __filename,
            1138,
            error,
            {
              errorMessage: error.message,
              errorName: error.name || 'Unknown',
              errorType: error.constructor?.name || 'Unknown',
              attemptNumber,
              elapsedSinceStart: Date.now() - startTime,
              processingEvent: 'gemini-attempt-error',
              traceId,
            },
          );

          // Yeniden deneme yapılacaksa bu hatayı fırlat
          throw error;
        }
      }, this.RETRY_OPTIONS);

      // JSON dönüşümü tamamlandı, şimdi konuları normalize et
      this.logger.debug(
        'Konular normalize ediliyor',
        'AiService.getTopicsWithGemini',
        __filename,
        1161,
      );

      const normalizedResult = this.normalizeTopicResult(aiResponse);

      // Topics dizisinin var olduğundan emin ol ve SubTopic formatına dönüştür
      const result: TopicDetectionResult = { topics: [] };

      // Asıl çözüm: aiResponse içindeki konuları doğrudan işle
      if (aiResponse && aiResponse.topics && Array.isArray(aiResponse.topics)) {
        // aiResponse içindeki topicler direkt olarak işlenebilir
        result.topics = aiResponse.topics;

        this.logger.info(
          `Konu tespiti tamamlandı: ${result.topics.length} konu bulundu`,
          'AiService.getTopicsWithGemini',
          __filename,
          1169,
          {
            topicCount: result.topics.length,
            mainTopicCount: result.topics.filter((t) => t.isMainTopic).length,
            subTopicCount: result.topics.filter((t) => !t.isMainTopic).length,
          },
        );
        return result;
      }

      // Önceki normalizeTopicResult'a dayalı yaklaşımı dene
      if (
        normalizedResult &&
        normalizedResult.topics &&
        Array.isArray(normalizedResult.topics)
      ) {
        // Gemini'den gelen konu formatını SubTopic formatına çevir
        normalizedResult.topics.forEach((topicItem) => {
          // topicItem'ı any olarak işle
          const anyTopic = topicItem as any;

          if (typeof anyTopic === 'object' && anyTopic !== null) {
            // Ana konular
            if (anyTopic.mainTopic || anyTopic.name || anyTopic.title) {
              const mainTopicName =
                anyTopic.mainTopic ||
                anyTopic.name ||
                anyTopic.title ||
                'Isimsiz Konu';
              const normalizedMainTopicName =
                this.normalizationService.normalizeSubTopicName(mainTopicName);

              // SubTopic arayüzüne uygun biçimde ekle
              result.topics.push({
                subTopicName: mainTopicName,
                normalizedSubTopicName: normalizedMainTopicName,
                isMainTopic: true,
              });

              // Alt konular
              if (Array.isArray(anyTopic.subTopics)) {
                anyTopic.subTopics.forEach((subTopicItem) => {
                  if (typeof subTopicItem === 'string') {
                    // String olarak gelen alt konu
                    result.topics.push({
                      subTopicName: subTopicItem,
                      normalizedSubTopicName:
                        this.normalizationService.normalizeSubTopicName(
                          subTopicItem,
                        ),
                      parentTopic: mainTopicName,
                      isMainTopic: false,
                    });
                  } else if (
                    typeof subTopicItem === 'object' &&
                    subTopicItem !== null
                  ) {
                    // Nesne olarak gelen alt konu
                    const anySubTopic = subTopicItem as any;
                    const subTopicName =
                      anySubTopic.subTopicName ||
                      anySubTopic.name ||
                      'Alt konu';
                    result.topics.push({
                      subTopicName: subTopicName,
                      normalizedSubTopicName:
                        this.normalizationService.normalizeSubTopicName(
                          subTopicName,
                        ),
                      parentTopic: mainTopicName,
                      isMainTopic: false,
                    });
                  }
                });
              }
            } else if (anyTopic.subTopicName) {
              // Direkt SubTopic formatında gelen konu
              result.topics.push({
                subTopicName: anyTopic.subTopicName,
                normalizedSubTopicName:
                  anyTopic.normalizedSubTopicName ||
                  this.normalizationService.normalizeSubTopicName(
                    anyTopic.subTopicName,
                  ),
                isMainTopic: !!anyTopic.isMainTopic,
              });
            }
          } else if (typeof anyTopic === 'string') {
            // String olarak gelen konu (ana konu olarak kabul et)
            result.topics.push({
              subTopicName: anyTopic,
              normalizedSubTopicName:
                this.normalizationService.normalizeSubTopicName(anyTopic),
              isMainTopic: true,
            });
          }
        });

        this.logger.info(
          `Konu tespiti tamamlandı: ${result.topics.length} konu bulundu`,
          'AiService.getTopicsWithGemini',
          __filename,
          1169,
          {
            topicCount: result.topics.length,
            mainTopicCount: result.topics.filter((t) => t.isMainTopic).length,
            subTopicCount: result.topics.filter((t) => !t.isMainTopic).length,
          },
        );
      } else {
        // Eğer normalizedResult.topics dizisi yoksa veya dizi değilse
        this.logger.warn(
          `[${traceId}] Konu tespiti tamamlandı ancak geçerli sonuç bulunamadı`,
          'AiService.getTopicsWithGemini',
          __filename,
          1204,
          {
            normalizedResultType: typeof normalizedResult,
            hasTopics: !!normalizedResult?.topics,
            isArray: Array.isArray(normalizedResult?.topics),
            processingEvent: 'topics-not-found',
            traceId,
          },
        );
      }

      return result;
    } catch (error) {
      // Tüm işlem sırasında oluşan hatalar
      this.logger.error(
        `[${traceId}] Konu tespiti başarısız oldu: ${error.message}`,
        'AiService.getTopicsWithGemini',
        __filename,
        1220,
        error,
        {
          errorMessage: error.message,
          errorName: error.name || 'Unknown',
          errorType: error.constructor?.name || 'Unknown',
          elapsedSinceStart: Date.now() - startTime,
          processingEvent: 'topic-detection-failed',
          traceId,
        },
      );

      // Hata durumunda boş bir sonuç döndür
      return { topics: [] };
    }
  }

  /**
   * Get topics using OpenAI model
   */
  private async getTopicsWithOpenAI(
    prompt: string,
  ): Promise<TopicDetectionResult> {
    // Bu metod şu an için uygulanmadı, OpenAI entegrasyonu gerektiğinde eklenecek
    this.logger.warn(
      'OpenAI integration not yet implemented',
      'AiService',
      __filename,
    );

    // Şimdilik Gemini kullanarak devam et
    return this.getTopicsWithGemini(prompt);
  }

  private detectTruncatedTextMarkers(text: string): {
    isTextTruncated: boolean;
    truncatedText: string | null;
  } {
    const startTime = Date.now();
    const traceId = `truncate-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      // İfadeyi düzenle - arama ifadesini farklı değişkenler olarak tanımla
      const truncatedRegex = /\[TEXT_TRUNCATED:([0-9]+)\]/i;
      const match = text.match(truncatedRegex);

      if (!match) {
        this.logger.debug(
          `[${traceId}] Metinde kısaltma işareti bulunamadı`,
          'AiService.detectTruncatedTextMarkers',
          __filename,
          689,
          {
            textLength: text.length,
            processingEvent: 'no-truncation-found',
            traceId,
          },
        );
        return { isTextTruncated: false, truncatedText: null };
      }

      // Eşleşme varsa
      const charCount = parseInt(match[1], 10);
      this.logger.debug(
        `[${traceId}] Metinde kısaltma işareti bulundu: ${charCount} karakter`,
        'AiService.detectTruncatedTextMarkers',
        __filename,
        700,
        {
          charCount,
          matchLocation: match.index,
          processingEvent: 'truncation-found',
          traceId,
        },
      );

      return {
        isTextTruncated: true,
        truncatedText: text.replace(truncatedRegex, ''),
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `[${traceId}] Kısaltma işareti tespiti sırasında hata: ${error.message}`,
        'AiService.detectTruncatedTextMarkers',
        __filename,
        711,
        error, // Hata nesnesi
        {
          // additionalInfo
          processingDuration: Date.now() - startTime,
          textLength: text.length,
          traceId,
        },
      );
      return { isTextTruncated: false, truncatedText: null };
    }
  }
}
