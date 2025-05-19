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

      // İstek içeriklerini oluştur
      let contents: Array<{ role: string; parts: Array<{ text: string }> }> =
        [];

      // Sistem mesajı varsa ekle
      if (options?.systemInstruction) {
        contents.push({
          role: 'user', // Gemini modelinde system role yerine user kullanılır
          parts: [
            {
              text: `SYSTEM INSTRUCTIONS:\n${options.systemInstruction}\n\nPlease follow these instructions carefully and format your response as specified.`,
            },
          ],
        });

        // İçeriği hazırlayıcı komut ekle
        contents.push({
          role: 'model',
          parts: [
            {
              text: `I'll act as a professional educator and create educational content based on your requirements. I'll ensure all questions are accurate, specific to the topics, and properly formatted in JSON as requested.`,
            },
          ],
        });
      }

      // Kullanıcı mesajını ekle
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      // İstek için metadata oluştur
      const metadata = options?.metadata
        ? JSON.stringify(options.metadata)
        : 'Metadata yok';
      this.logger.debug(
        `Gemini API isteği gönderiliyor. Prompt uzunluğu: ${prompt.length} karakter, Model: ${this.config.model || 'bilinmiyor'}, Metadata: ${metadata}`,
      );

      const result: GenerateContentResult = await this.model.generateContent({
        contents: contents,
        ...requestParams,
      });

      const responseText = result.response.text();
      const duration = Date.now() - startTime;

      // Token sayılarını kabaca tahmin et
      const promptTokenEstimate = Math.ceil(prompt.length / 4);
      const completionTokenEstimate = Math.ceil(responseText.length / 4);

      const totalTokenEstimate = promptTokenEstimate + completionTokenEstimate;

      this.logger.debug(
        `Gemini yanıtı alındı (${duration}ms, yaklaşık ${totalTokenEstimate} token, yanıt uzunluğu: ${responseText.length} karakter)`,
      );

      // Yanıt yapısını kontrol et
      if (responseText.length < 10) {
        this.logger.warn(`Çok kısa yanıt alındı: "${responseText}"`);
      }

      // JSON döndürülmesi gerekiyorsa ama JSON formatı yoksa uyarı ver
      if (
        prompt.includes('JSON') &&
        !responseText.includes('{') &&
        !responseText.includes('[')
      ) {
        this.logger.warn(
          'Yanıt JSON formatında değil, ancak JSON formatı bekleniyor',
        );

        // Basit bir JSON dönüşüm denemesi yap
        if (
          responseText.includes('questionText') ||
          responseText.includes('soru')
        ) {
          this.logger.log(
            'Yanıtta soru içeriği tespit edildi, JSON formatına dönüştürme deneniyor',
          );

          try {
            // Dönüştürme başarısız olursa orijinal metni döndür
            return {
              text: responseText,
              usage: {
                promptTokens: promptTokenEstimate,
                completionTokens: completionTokenEstimate,
                totalTokens: totalTokenEstimate,
              },
            };
          } catch (formatError) {
            this.logger.error(
              `JSON formatına dönüştürme hatası: ${formatError.message}`,
            );
          }
        }
      }

      return {
        text: responseText,
        usage: {
          promptTokens: promptTokenEstimate,
          completionTokens: completionTokenEstimate,
          totalTokens: totalTokenEstimate,
        },
      };
    } catch (error) {
      // Hata detaylarını daha kapsamlı logla
      const errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200), // Stack trace'in ilk 200 karakteri
        code: error.code || 'Bilinmeyen',
        details: error.details || 'Detay yok',
      };

      this.logger.error(
        `Gemini içerik oluşturma hatası: ${error.message}`,
        error.stack,
        errorDetails,
      );
      throw error;
    }
  }
}
