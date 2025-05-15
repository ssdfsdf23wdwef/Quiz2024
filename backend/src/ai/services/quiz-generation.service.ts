import { Injectable, Logger } from '@nestjs/common';
import { AIProviderService } from '../providers/ai-provider.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import { QuizQuestion, QuizGenerationOptions } from '../interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import pRetry from 'p-retry';

@Injectable()
export class QuizGenerationService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
  private readonly MAX_RETRIES = 3;

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
        'QuizGenerationService.RETRY_OPTIONS.onFailedAttempt',
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
   * Quiz soruları oluşturur
   */
  async generateQuizQuestions(
    options: QuizGenerationOptions,
  ): Promise<QuizQuestion[]> {
    try {
      this.flowTracker.trackStep(
        'Quiz soruları oluşturuluyor',
        'QuizGenerationService',
      );

      // Prompt dosyasını oku
      const promptPath = path.join(
        __dirname,
        '..',
        'prompts',
        'generate-quiz-tr.txt',
      );

      let basePrompt: string;
      try {
        basePrompt = await fs.promises.readFile(promptPath, 'utf-8');
      } catch (error) {
        this.logger.error(
          `Quiz prompt dosyası okunamadı: ${error.message}`,
          'QuizGenerationService.generateQuizQuestions',
          __filename,
          undefined,
          error,
        );
        basePrompt = this.getDefaultQuizPrompt();
      }

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
          .map(
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
        // String dizisi ise basitçe işle
        const stringTopics = options.subTopics as string[];
        topicsText = Array.isArray(stringTopics)
          ? stringTopics.join(', ')
          : 'Belirtilen konu yok';
      }

      const ayarMetni = `Soru sayısı: ${options.questionCount}\nZorluk: ${options.difficulty}\nKonu listesi:\n${topicsText}`;
      const promptText = `${ayarMetni}\n\n${basePrompt}`;

      // p-retry ile gelişmiş yeniden deneme mekanizması
      const aiResponse = await pRetry(async () => {
        const result = await this.aiProviderService.generateContent(promptText);
        return result.text;
      }, this.RETRY_OPTIONS);

      return this.parseQuizGenerationResponse(aiResponse);
    } catch (error) {
      this.logger.error(
        `Quiz soruları oluşturulurken hata: ${error.message}`,
        'QuizGenerationService.generateQuizQuestions',
        __filename,
        undefined,
        error,
        {
          subTopicsCount: options.subTopics?.length || 0,
          difficulty: options.difficulty,
          questionCount: options.questionCount,
        },
      );
      throw error;
    }
  }

  /**
   * AI yanıtını parse ederek quiz soruları oluşturur
   */
  private parseQuizGenerationResponse(response: string): QuizQuestion[] {
    try {
      this.flowTracker.trackStep(
        'Quiz oluşturma yanıtı işleniyor',
        'QuizGenerationService',
      );

      // Parse JSON
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

        // Normalizasyon için ek tip kontrolü
        let normalizedSubTopicName;
        try {
          normalizedSubTopicName =
            this.normalizationService.normalizeSubTopicName(subTopicName);
        } catch (error) {
          this.logger.warn(
            `Alt konu normalizasyonu sırasında hata: ${error.message}`,
            'QuizGenerationService.parseQuizGenerationResponse',
            __filename,
          );
          normalizedSubTopicName = subTopicName.toLowerCase().trim(); // Basit yedek normalleştirme
        }

        return {
          id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'No explanation provided',
          subTopicName: subTopicName,
          normalizedSubTopicName: normalizedSubTopicName,
          difficulty: q.difficulty || 'medium',
        } as QuizQuestion;
      });
    } catch (error) {
      this.logger.error(
        `Quiz yanıtı işlenemedi: ${error.message}`,
        'QuizGenerationService.parseQuizGenerationResponse',
        __filename,
        undefined,
        error,
        {
          responseLength: response?.length || 0,
        },
      );
      throw new Error(`Quiz yanıtı işlenemedi: ${error.message}`);
    }
  }

  /**
   * JSON yanıtını ayrıştırır
   */
  private parseJsonResponse<T>(text: string | undefined | null): T {
    if (!text) {
      throw new Error('AI yanıtı parse edilemedi: Yanıt boş.');
    }

    try {
      // Check for JSON code blocks
      let jsonText = text;
      let jsonMatch: RegExpMatchArray | null = null;

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

      return JSON.parse(jsonText) as T;
    } catch (error) {
      this.logger.error(
        `JSON parse hatası: ${error.message}`,
        'QuizGenerationService.parseJsonResponse',
        __filename,
        undefined,
        error,
      );

      throw new Error(
        `AI yanıt formatı geçersiz veya parse edilemedi: ${error.message}`,
      );
    }
  }

  /**
   * Varsayılan quiz prompt'unu döndürür
   */
  private getDefaultQuizPrompt(): string {
    return `
## GÖREV: Eğitim Konuları için Test Soruları Oluşturma

### Hedef:
Verilen konulara dayalı olarak, öğrencinin bilgisini sınayacak çoktan seçmeli sorular oluştur.

### Talimatlar:
1. Her konuya ait belirtilen sayıda çoktan seçmeli soru oluştur
2. Her soru için dört seçenek hazırla (A, B, C, D)
3. Her sorunun yalnızca bir doğru cevabı olmalı
4. Sorular, belirtilen zorluk seviyesine uygun olmalı
5. Her soru için kısa bir açıklama ekle
6. Soruları belirtilen formatta JSON olarak döndür

### Format:
\`\`\`json
{
  "questions": [
    {
      "id": "1",
      "questionText": "Soru metni?",
      "options": ["A) Seçenek 1", "B) Seçenek 2", "C) Seçenek 3", "D) Seçenek 4"],
      "correctAnswer": "A) Seçenek 1",
      "explanation": "Doğru cevabın açıklaması",
      "subTopic": "İlgili alt konu",
      "difficulty": "easy|medium|hard"
    }
  ]
}
\`\`\`
`;
  }
}
