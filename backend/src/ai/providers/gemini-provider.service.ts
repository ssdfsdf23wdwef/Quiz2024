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
      model: config.model || 'gemini-2.0-flash',
      safetySettings: defaultSafetySettings,
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 30000,
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
      const traceId =
        options?.metadata?.traceId ||
        `gemini-${startTime}-${Math.random().toString(36).substring(2, 7)}`;

      // DETAYLI LOGLAMA: API isteği başlangıcı
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Gemini API isteği hazırlanıyor (${prompt.length} karakter)`,
      );
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Prompt ilk 500 karakteri: ${prompt.substring(0, 500)}...`,
      );

      // Özel ayarlar varsa onları kullan, yoksa modeldeki ayarları kullan
      const requestParams = options || {};

      // İstek içeriklerini oluştur
      let contents: Array<{ role: string; parts: Array<{ text: string }> }> =
        [];

      // Sistem mesajı varsa ekle
      if (options?.systemInstruction) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Sistem talimatı ekleniyor (${options.systemInstruction.length} karakter)`,
        );
        contents.push({
          role: 'user', // Gemini modelinde system role yerine user kullanılır
          parts: [
            {
              text: `SYSTEM INSTRUCTIONS:\n${options.systemInstruction}\n\nPlease follow these instructions carefully and format your response as specified.`,
            },
          ],
        });
      }

      // Ana promptu ekle
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      console.log(
        `[QUIZ_DEBUG] [${traceId}] Toplam mesaj sayısı: ${contents.length}, toplam karakter: ${contents.reduce((sum, msg) => sum + msg.parts.reduce((s, p) => s + p.text.length, 0), 0)}`,
      );

      this.logger.debug(
        `[${traceId}] Gemini API isteği hazırlanıyor: ${contents.length} mesaj`,
        'GeminiProviderService.generateContent',
        __filename,
        undefined,
        { messagesCount: contents.length, promptLength: prompt.length },
      );

      // API çağrısı öncesi son hazırlıklar
      const generationConfig = {
        temperature:
          requestParams.temperature || this.config.temperature || 0.5,
        maxOutputTokens:
          requestParams.maxTokens || this.config.maxTokens || 30048,
        topK: requestParams.topK || 40,
        topP: requestParams.topP || 0.95,
      };

      console.log(`[QUIZ_DEBUG] [${traceId}] Gemini API konfigürasyonu:`, {
        model: this.config.model,
        temperature: generationConfig.temperature,
        maxOutputTokens: generationConfig.maxOutputTokens,
        topK: generationConfig.topK,
        topP: generationConfig.topP,
      });

      // DETAYLI LOGLAMA: API çağrısı yapılıyor
      console.log(`[QUIZ_DEBUG] [${traceId}] Gemini API çağrısı yapılıyor...`);
      console.time(`[QUIZ_DEBUG] [${traceId}] Gemini API yanıt süresi`);

      // API çağrısı
      const response = await this.model.generateContent({
        contents,
        generationConfig: {
          temperature: requestParams.temperature || this.config.temperature,
          maxOutputTokens: requestParams.maxTokens || this.config.maxTokens,
          topK: requestParams.topK || 40,
          topP: requestParams.topP || 0.95,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
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
        ],
      });

      // Tamamlanma süresini hesapla
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.timeEnd(`[QUIZ_DEBUG] [${traceId}] Gemini API yanıt süresi`);
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Gemini API yanıtı alındı, süre: ${duration}ms`,
      );

      // Yanıt metnini alma -  response.response.candidates[0].content.parts[0].text kullanabiliriz
      let responseText = '';

      try {
        // Direktmen response'u string olarak almaya çalış
        if (response.response) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Yanıt nesnesinin yapısı:`,
            Object.keys(response.response),
          );

          if (
            response.response.candidates &&
            response.response.candidates[0] &&
            response.response.candidates[0].content &&
            response.response.candidates[0].content.parts &&
            response.response.candidates[0].content.parts[0]
          ) {
            responseText =
              response.response.candidates[0].content.parts[0].text || '';

            console.log(
              `[QUIZ_DEBUG] [${traceId}] Yanıt metni (ilk 500 karakter): ${responseText.substring(0, 500)}...`,
            );
            console.log(
              `[QUIZ_DEBUG] [${traceId}] Yanıt uzunluğu: ${responseText.length} karakter`,
            );
            console.log(
              `[QUIZ_DEBUG] [${traceId}] JSON içeriyor mu: ${responseText.includes('{') && responseText.includes('}') ? 'EVET' : 'HAYIR'}`,
            );

            this.logger.log(
              `[${traceId}] Yanıt metni başarıyla elde edildi (candidates yoluyla)`,
              'GeminiProviderService.generateContent',
            );
          } else {
            console.warn(
              `[QUIZ_DEBUG] [${traceId}] UYARI: Yanıt candidates yapısında beklendiği gibi değil!`,
            );
            console.log(
              `[QUIZ_DEBUG] [${traceId}] Yanıt nesnesinin detayları:`,
              JSON.stringify(response.response).substring(0, 1000),
            );
          }
        } else if (typeof (response as any).text === 'function') {
          // Bazı Gemini API sürümlerinde doğrudan text() metodu ile yanıt dönebilir
          responseText = (response as any).text();
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Yanıt text() metodu ile alındı. Uzunluk: ${responseText.length} karakter`,
          );
          this.logger.log(
            `[${traceId}] Yanıt metni başarıyla elde edildi (text() metodu ile)`,
            'GeminiProviderService.generateContent',
          );
        } else if (typeof (response as any).text === 'string') {
          // Text bir string olabilir
          responseText = (response as any).text;
          this.logger.log(
            `[${traceId}] Yanıt metni başarıyla elde edildi (text string özelliği ile)`,
            'GeminiProviderService.generateContent',
          );
        } else {
          // Gemini API response yapısını ayrıntılı loglayalım (hata ayıklama amaçlı)
          this.logger.warn(
            `[${traceId}] Yanıt metni alınamadı, response yapısı beklenenden farklı`,
            'GeminiProviderService.generateContent',
          );

          // Eğer response bir fonksiyon içeriyorsa ve adı text ise
          if (typeof response === 'object' && response !== null) {
            // Response nesnesinin anahtarlarını loglayalım
            const keys = Object.keys(response);
            this.logger.debug(
              `[${traceId}] Response özellikleri: ${keys.join(', ')}`,
              'GeminiProviderService.generateContent',
            );

            if (typeof response.toString === 'function') {
              responseText = response.toString();
              this.logger.log(
                `[${traceId}] Yanıt metni başarıyla elde edildi (toString() metodu ile)`,
                'GeminiProviderService.generateContent',
              );
            }
          }
        }
      } catch (textError) {
        // Tüm response nesnesini loglayalım (hatayı tespit etmek için)
        this.logger.warn(
          `[${traceId}] Yanıt metni alınamadı, hata: ${textError.message}`,
          'GeminiProviderService.generateContent',
        );

        this.logger.debug(
          `[${traceId}] Response yapısı: ${JSON.stringify(response).substring(0, 500)}`,
          'GeminiProviderService.generateContent',
        );

        // Son çare: tüm nesneyi JSON'a çevirmeyi dene
        try {
          const responseJson = JSON.stringify(response);
          const textMatch = responseJson.match(/"text"\s*:\s*"([^"]+)"/);
          if (textMatch && textMatch[1]) {
            responseText = textMatch[1];
            this.logger.log(
              `[${traceId}] Yanıt metni JSON stringfy ile çıkarıldı`,
              'GeminiProviderService.generateContent',
            );
          }
        } catch (jsonError) {
          // JSON'a çevirme de başarısız oldu
          this.logger.error(
            `[${traceId}] Yanıt JSON'a çevrilemedi: ${jsonError.message}`,
            'GeminiProviderService.generateContent',
          );
        }

        // Yine de yanıt alınamadıysa boş metin kullan
        if (!responseText) {
          responseText = '';
        }
      }

      // Basit token hesaplaması (kesin değil, sadece tahmin)
      const promptTokenEstimate = Math.ceil(prompt.length / 4);
      const completionTokenEstimate = Math.ceil(
        (responseText?.length || 0) / 4,
      );
      const totalTokenEstimate = promptTokenEstimate + completionTokenEstimate;

      this.logger.log(
        `[${traceId}] Gemini yanıtı alındı: ${responseText?.length || 0} karakter, ${duration}ms sürede yanıt verildi`,
        'GeminiProviderService.generateContent',
        __filename,
        undefined,
        {
          responseLength: responseText?.length || 0,
          estimatedTokens: totalTokenEstimate,
          duration,
          traceId,
        },
      );

      // JSON içerik kontrolü
      if (
        responseText &&
        (prompt.toLowerCase().includes('json') ||
          (options?.systemInstruction &&
            options.systemInstruction.toLowerCase().includes('json')))
      ) {
        try {
          // Basit bir JSON kontrolü yap
          const containsJsonBraces =
            responseText.includes('{') && responseText.includes('}');

          if (containsJsonBraces) {
            const jsonPrefix = responseText.indexOf('{');
            const jsonSuffix = responseText.lastIndexOf('}') + 1;

            // JSON olabilecek metni çıkarmayı dene
            const possibleJson = responseText.substring(jsonPrefix, jsonSuffix);

            try {
              // JSON parse etmeyi dene (sadece kontrol amaçlı)
              JSON.parse(possibleJson);
              this.logger.log(
                `[${traceId}] Yanıtta geçerli JSON formatı tespit edildi`,
                'GeminiProviderService.generateContent',
              );
            } catch (jsonError) {
              this.logger.warn(
                `[${traceId}] Yanıtta JSON bulunuyor ancak geçerli JSON formatında değil: ${jsonError.message}`,
                'GeminiProviderService.generateContent',
              );
            }
          } else {
            this.logger.warn(
              `[${traceId}] JSON bekleniyordu ancak yanıtta JSON formatı bulunamadı`,
              'GeminiProviderService.generateContent',
            );
          }
        } catch (formatError) {
          this.logger.warn(
            `[${traceId}] JSON formatı kontrol edilirken hata: ${formatError.message}`,
            'GeminiProviderService.generateContent',
          );
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
      this.logger.error(
        `Gemini sağlayıcı hatası: ${error.message}`,
        'GeminiProviderService.generateContent',
        __filename,
        undefined,
        error,
      );

      // Gemini API'nin döndürebileceği özel hata kodlarını kontrol et
      if (error.status) {
        // HTTP durum kodu varsa
        this.logger.error(
          `Gemini API hatası - HTTP ${error.status}: ${error.message}`,
          'GeminiProviderService.generateContent',
        );
      } else if (error.code) {
        // Gemini API hata kodu varsa
        this.logger.error(
          `Gemini API hatası - Kod ${error.code}: ${error.message}`,
          'GeminiProviderService.generateContent',
        );
      }

      // Rate limit aşımında özel loglama
      if (
        error.message?.includes('rate limit') ||
        error.message?.includes('quota')
      ) {
        this.logger.error(
          `Gemini API kota veya oran sınırı aşıldı: ${error.message}`,
          'GeminiProviderService.generateContent',
        );
      }

      // Input filtering/safety hatalarında özel loglama
      if (
        error.message?.includes('safety') ||
        error.message?.includes('blocked')
      ) {
        this.logger.error(
          `Gemini API güvenlik filtresi hatası: ${error.message}`,
          'GeminiProviderService.generateContent',
        );
      }

      throw error;
    }
  }
}
