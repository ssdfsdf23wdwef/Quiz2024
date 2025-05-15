import { Injectable, Logger } from '@nestjs/common';
import {
  GenerateContentResult,
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
} from '@google/generative-ai';
import {
  AIProvider,
  AIProviderConfig,
  AIRequestOptions,
  AIResponse,
} from './ai-provider.interface';

@Injectable()
export class GeminiProviderService implements AIProvider {
  private readonly logger = new Logger(GeminiProviderService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: AIProviderConfig;

  initialize(config: AIProviderConfig): void {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);

    const defaultSafetySettings = [
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
    ];

    this.model = this.genAI.getGenerativeModel({
      model: config.model || 'gemini-1.5-flash',
      safetySettings: defaultSafetySettings,
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 1024,
      },
    });

    this.logger.log(`Gemini AI sağlayıcısı başlatıldı. Model: ${config.model}`);
  }

  async generateContent(
    prompt: string,
    options?: AIRequestOptions,
  ): Promise<AIResponse> {
    try {
      const startTime = Date.now();

      // Özel ayarlar varsa onları kullan, yoksa modeldeki ayarları kullan
      const requestParams = options || {};

      const result: GenerateContentResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...requestParams,
      });

      const responseText = result.response.text();
      const duration = Date.now() - startTime;

      // Token sayılarını kabaca tahmin et
      const promptTokenEstimate = Math.ceil(prompt.length / 4);
      const completionTokenEstimate = Math.ceil(responseText.length / 4);

      this.logger.debug(
        `Gemini yanıtı alındı (${duration}ms, yaklaşık ${promptTokenEstimate + completionTokenEstimate} token)`,
      );

      return {
        text: responseText,
        usage: {
          promptTokens: promptTokenEstimate,
          completionTokens: completionTokenEstimate,
          totalTokens: promptTokenEstimate + completionTokenEstimate,
        },
      };
    } catch (error) {
      this.logger.error(
        `Gemini içerik oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
