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
  private readonly RETRY_OPTIONS = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 15000,
    onFailedAttempt: (error: pRetry.FailedAttemptError) => {
      this.logger.warn(
        `AI çağrısı ${error.attemptNumber}. denemede başarısız oldu. ${error.retriesLeft} deneme kaldı. Hata: ${error.message}`,
        'AiService.RETRY_OPTIONS.onFailedAttempt',
        __filename,
        42,
        {
          error: error.message,
          attemptNumber: error.attemptNumber,
          retriesLeft: error.retriesLeft,
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

    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      'AIzaSyCIYYYDSYB_QN00OgoRPQgXR2cUUWCzRmw';

    if (!apiKey) {
      this.logger.error(
        'Gemini API anahtarı tanımlanmamış (.env dosyasında GEMINI_API_KEY eksik)',
        'AiService.constructor',
        __filename,
        60,
      );
      throw new BadRequestException(
        'Yapay zeka servisi başlatılamadı. Lütfen sistem yöneticisiyle iletişime geçin.',
        'GEMINI_API_KEY ortam değişkeninde tanımlanmamış.',
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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
        temperature: 0,
      },
    });
  }

  /**
   * Generic JSON response parser for AI responses
   */
  @LogMethod()
  private parseJsonResponse<T>(text: string | undefined | null): T {
    if (!text) {
      this.logger.error(
        'Parse edilecek AI yanıtı boş veya tanımsız.',
        'AiService.parseJsonResponse',
        __filename,
        122,
      );
      throw new Error('AI yanıtı parse edilemedi: Yanıt boş.');
    }

    try {
      this.flowTracker.trackStep(
        'AI yanıtı JSON formatına çevriliyor',
        'AiService',
      );
      // Try to extract JSON from the response
      const jsonMatch =
        text.match(/```json([\s\S]*?)```/) ||
        text.match(/```JSON([\s\S]*?)```/) ||
        text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        this.logger.warn(
          'Response içinde JSON bloğu bulunamadı.',
          'AiService.parseJsonResponse',
          __filename,
          138,
          { textLength: text.length },
        );
        throw new Error('AI yanıtında JSON bloğu bulunamadı');
      }

      // Extract the JSON part
      const jsonString = jsonMatch[0]
        .replace(/```json|```JSON|```/g, '')
        .trim();

      if (!jsonString) {
        this.logger.error(
          'Temizlenmiş AI yanıtı boş.',
          'AiService.parseJsonResponse',
          __filename,
          149,
        );
        throw new Error('AI yanıtı parse edilemedi: Temizlenmiş yanıt boş.');
      }

      // Try to parse JSON with a more robust approach
      try {
        return JSON.parse(jsonString) as T;
      } catch (parseError) {
        // In case of parsing error, try to clean up the JSON string
        this.logger.warn(
          `İlk JSON parse denemesi başarısız: ${parseError.message}, JSON temizleniyor...`,
          'AiService.parseJsonResponse',
          __filename,
          160,
          {
            parseError: parseError.message,
            jsonStringLength: jsonString.length,
          },
        );

        // Clean potential issues in the JSON string and try again
        const cleanedJson = jsonString
          .replace(/\\n/g, '\\n') // Remove literal line breaks
          .replace(/\\'/g, "\\'") // Fix escaped single quotes
          .replace(/\\"/g, '\\"') // Fix escaped double quotes
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}') // Remove trailing commas in objects
          .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
          .replace(/undefined/g, 'null'); // Replace undefined with null

        return JSON.parse(cleanedJson) as T;
      }
    } catch (error) {
      this.logger.logError(error, 'AiService.parseJsonResponse', {
        responseLength: text?.length || 0,
      });
      throw new Error(
        `AI yanıt formatı geçersiz veya parse edilemedi: ${error.message}`,
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
  ): Promise<TopicDetectionResult> {
    try {
      this.logger.debug(
        `AI servisi metin analizi başlatılıyor (${documentText.length} karakter)`,
        'AiService.detectTopics',
        __filename,
      );

      this.flowTracker.trackStep('Dokümandan konular algılanıyor', 'AiService');

      // Truncate document text if too long
      const truncatedText =
        documentText.length > 15000
          ? documentText.slice(0, 15000) + '...'
          : documentText;

      // Building the prompt using the content from detect-topics-tr.txt file
      const promptFilePath = path.resolve(
        __dirname,
        'prompts',
        'detect-topics-tr.txt',
      );
      let promptContent = '';

      try {
        promptContent = fs.readFileSync(promptFilePath, 'utf8');
      } catch (error) {
        this.logger.error(
          `Error reading prompt file: ${error.message}`,
          'AiService',
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

      // Get AI service configuration
      const llmConfig = this.configService.get('llm');
      this.logger.debug(
        `Using LLM config: ${JSON.stringify(llmConfig)}`,
        'AiService',
        __filename,
      );

      // Track the AI service being used
      this.flowTracker.trackStep(
        `Using AI service: ${llmConfig.provider}`,
        'AiService',
      );

      let result: TopicDetectionResult = { topics: [] };

      // Choose AI service based on configuration
      if (llmConfig.provider === 'gemini') {
        result = await this.getTopicsWithGemini(fullPrompt);
      } else if (llmConfig.provider === 'openai') {
        result = await this.getTopicsWithOpenAI(fullPrompt);
      } else {
        throw new Error(`Unsupported LLM provider: ${llmConfig.provider}`);
      }

      // Check if we got valid results
      if (!result || !result.topics || !Array.isArray(result.topics)) {
        throw new Error(
          'Invalid topic detection result format from AI service',
        );
      }

      // Log the results
      this.logger.info(
        `Detected ${result.topics.length} topics from document text`,
        'AiService',
        __filename,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error detecting topics: ${error.message}`,
        'AiService',
      );
      throw new BadRequestException(
        `Failed to detect topics: ${error.message}`,
      );
    }
  }

  /**
   * Normalize topic detection result
   */
  @LogMethod()
  private normalizeTopicResult(result: any): TopicDetectionResult {
    const normalizedResult: TopicDetectionResult = {
      topics: [],
    };

    if (result.topics && Array.isArray(result.topics)) {
      // Convert to the expected format and normalize topic names
      result.topics.forEach((topic) => {
        // Handle main topics
        if (topic.mainTopic) {
          const mainTopic = {
            subTopicName: topic.mainTopic,
            normalizedSubTopicName:
              this.normalizationService.normalizeSubTopicName(topic.mainTopic),
            isMainTopic: true,
          };

          normalizedResult.topics.push(mainTopic);

          // Handle sub-topics if they exist
          if (topic.subTopics && Array.isArray(topic.subTopics)) {
            topic.subTopics.forEach((subTopic) => {
              const normalizedSubTopic = {
                subTopicName: subTopic,
                normalizedSubTopicName:
                  this.normalizationService.normalizeSubTopicName(subTopic),
                parentTopic: topic.mainTopic,
                isMainTopic: false,
              };

              normalizedResult.topics.push(normalizedSubTopic);
            });
          }
        } else if (typeof topic === 'string' || topic.subTopicName) {
          // Handle legacy format (flat list)
            const subTopicName =
            typeof topic === 'string' ? topic : topic.subTopicName;
          normalizedResult.topics.push({
              subTopicName,
              normalizedSubTopicName:
                this.normalizationService.normalizeSubTopicName(subTopicName),
            isMainTopic: true,
          });
        }
      });
    }

    return normalizedResult;
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
    // Use p-retry for resilience
    const aiResponse = await pRetry(async () => {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      return this.parseTopicDetectionResponse(text);
    }, this.RETRY_OPTIONS);

    // Normalize the topics
    return this.normalizeTopicResult(aiResponse);
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
}
