import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { TopicDetectionService } from './services/topic-detection.service';
import { AIProviderService } from './providers/ai-provider.service';
import { QuizGenerationService } from './services/quiz-generation.service';

@Injectable()
export class AiService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
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
    private readonly topicDetectionService: TopicDetectionService,
    private readonly aiProviderService: AIProviderService,
    private readonly quizGenerationService: QuizGenerationService,
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
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTokens: 1024,
      };
    }

    this.logger.info(
      'AI servisi başlatıldı, AIProviderService kullanılıyor',
      'AiService.constructor',
      __filename,
    );
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
    try {
      // TopicDetectionService'e yönlendirerek kodu basitleştiriyoruz
      return await this.topicDetectionService.detectTopics(
        documentText,
        existingTopics,
        cacheKey,
      );
    } catch (error) {
      // Hata loglama ve yeniden fırlatma
      this.logger.error(
        `Konu tespiti sırasında hata: ${error.message}`,
        'AiService.detectTopics',
        __filename,
        error,
      );
      throw error;
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
    const startTime = Date.now();
    const traceId = `ai-${startTime}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.logger.debug(
        `[${traceId}] Quiz soruları oluşturma işlemi başlatılıyor`,
        'AiService.generateQuizQuestions',
        __filename,
        undefined,
        { options },
      );

      this.flowTracker.trackStep(
        'Quiz sorularının oluşturulması için AI çağrısı yapılıyor',
        'AiService',
      );

      // Quiz soruları oluştur
      const questions =
        await this.quizGenerationService.generateQuizQuestions(options);

      const duration = Date.now() - startTime;
      this.logger.info(
        `[${traceId}] Quiz soruları oluşturuldu: ${questions.length} soru (${duration}ms)`,
        'AiService.generateQuizQuestions',
        __filename,
        undefined,
        {
          questionCount: questions.length,
          duration,
          options,
        },
      );

      return questions;
    } catch (error) {
      this.logger.error(
        `[${traceId}] Quiz soruları oluşturulurken hata: ${error.message}`,
        'AiService.generateQuizQuestions',
        __filename,
        undefined,
        error,
      );
      throw error;
    }
  }

  /**
   * Hızlı quiz soruları oluştur
   * @param documentText Belge metni
   * @param subTopics Alt konular
   * @param questionCount Soru sayısı
   * @param difficulty Zorluk seviyesi
   * @returns Quiz soruları
   */
  async generateQuickQuiz(
    documentText: string,
    subTopics: string[],
    questionCount: number = 10,
    difficulty: string = 'medium',
  ): Promise<QuizQuestion[]> {
    const startTime = Date.now();
    const traceId = `ai-quick-${startTime}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.logger.debug(
        `[${traceId}] Hızlı quiz soruları oluşturma işlemi başlatılıyor`,
        'AiService.generateQuickQuiz',
        __filename,
        undefined,
        {
          textLength: documentText.length,
          subTopicsCount: subTopics.length,
          questionCount,
          difficulty,
        },
      );

      this.flowTracker.trackStep(
        'Hızlı quiz sorularının oluşturulması için AI çağrısı yapılıyor',
        'AiService',
      );

      // Hızlı quiz oluşturma işlemini QuizGenerationService'e devredelim
      const questions =
        await this.quizGenerationService.generateQuickQuizQuestions(
          documentText,
          subTopics,
          questionCount,
          difficulty,
        );

      const duration = Date.now() - startTime;
      this.logger.info(
        `[${traceId}] Hızlı quiz soruları oluşturuldu: ${questions.length} soru (${duration}ms)`,
        'AiService.generateQuickQuiz',
        __filename,
        undefined,
        {
          questionCount: questions.length,
          duration,
          subTopicsCount: subTopics.length,
        },
      );

      return questions;
    } catch (error) {
      this.logger.error(
        `[${traceId}] Hızlı quiz soruları oluşturulurken hata: ${error.message}`,
        'AiService.generateQuickQuiz',
        __filename,
        undefined,
        error,
      );
      throw error;
    }
  }

  /**
   * Kişiselleştirilmiş quiz soruları oluştur
   * @param subTopics Alt konular
   * @param userPerformance Kullanıcı performans verileri
   * @param questionCount Soru sayısı
   * @param difficulty Zorluk seviyesi
   * @param documentText Belge metni (opsiyonel)
   * @param learningTargets Öğrenme hedefleri (opsiyonel)
   * @returns Quiz soruları
   */
  async generatePersonalizedQuiz(
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
    const startTime = Date.now();
    const traceId = `ai-personalized-${startTime}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.logger.debug(
        `[${traceId}] Kişiselleştirilmiş quiz soruları oluşturma işlemi başlatılıyor`,
        'AiService.generatePersonalizedQuiz',
        __filename,
        undefined,
        {
          subTopicsCount: subTopics.length,
          questionCount,
          difficulty,
          hasDocumentText: !!documentText,
          hasLearningTargets: !!learningTargets,
          weakTopicsCount: userPerformance.weakTopics.length,
          mediumTopicsCount: userPerformance.mediumTopics.length,
          failedQuestionsCount: userPerformance.failedQuestions?.length || 0,
        },
      );

      this.flowTracker.trackStep(
        'Kişiselleştirilmiş quiz sorularının oluşturulması için AI çağrısı yapılıyor',
        'AiService',
      );

      // Kişiselleştirilmiş quiz oluşturma işlemini QuizGenerationService'e devredelim
      const questions =
        await this.quizGenerationService.generatePersonalizedQuizQuestions(
          subTopics,
          userPerformance,
          questionCount,
          difficulty,
          documentText,
          learningTargets,
        );

      const duration = Date.now() - startTime;
      this.logger.info(
        `[${traceId}] Kişiselleştirilmiş quiz soruları oluşturuldu: ${questions.length} soru (${duration}ms)`,
        'AiService.generatePersonalizedQuiz',
        __filename,
        undefined,
        {
          questionCount: questions.length,
          duration,
          subTopicsCount: subTopics.length,
        },
      );

      return questions;
    } catch (error) {
      this.logger.error(
        `[${traceId}] Kişiselleştirilmiş quiz soruları oluşturulurken hata: ${error.message}`,
        'AiService.generatePersonalizedQuiz',
        __filename,
        undefined,
        error,
      );
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
      const aiResponse = await pRetry(async () => {
        return await this.aiProviderService.generateContent(prompt);
      }, this.RETRY_OPTIONS);

      if (!aiResponse.text) {
        throw new Error("AI'dan boş özet yanıtı alındı");
      }

      return aiResponse.text;
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
      const aiResponse = await pRetry(async () => {
        return await this.aiProviderService.generateContent(prompt);
      }, this.RETRY_OPTIONS);

      if (!aiResponse.text) {
        throw new Error("AI'dan boş açıklayıcı içerik yanıtı alındı");
      }

      return aiResponse.text;
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
      const aiResponse = await pRetry(async () => {
        return await this.aiProviderService.generateContent(prompt);
      }, this.RETRY_OPTIONS);

      if (!aiResponse.text) {
        throw new Error("AI'dan boş geri bildirim yanıtı alındı");
      }

      // Merkezi parseJsonResponse metodunu kullan
      return this.parseJsonResponse<Record<string, any>>(aiResponse.text);
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
      const aiResponse = await pRetry(async () => {
        return await this.aiProviderService.generateContent(prompt);
      }, this.RETRY_OPTIONS);

      if (!aiResponse.text) {
        throw new Error("AI'dan boş harita yanıtı alındı");
      }

      // Merkezi parseJsonResponse metodunu kullan
      return this.parseJsonResponse<Record<string, any>>(aiResponse.text);
    } catch (error) {
      this.logger.logError(error, 'AiService.generateLearningPathMap', {
        courseId,
        subTopicsCount: subTopics.length,
        documentLength: documentText?.length || 0,
      });
      throw error;
    }
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
