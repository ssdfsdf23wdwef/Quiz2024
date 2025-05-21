import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProvider,
  AIProviderConfig,
  AIRequestOptions,
  AIResponse,
} from './ai-provider.interface';
import { GeminiProviderService } from './gemini-provider.service';

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private readonly providers: Map<string, AIProvider> = new Map();
  private activeProvider: AIProvider;
  private config: AIProviderConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiProvider: GeminiProviderService,
  ) {
    this.initialize();
  }

  private initialize(): void {
    // Sağlayıcıları kaydet
    this.providers.set('gemini', this.geminiProvider);

    // Yapılandırmayı yükle
    const llmConfig = this.configService.get('llm');

    if (!llmConfig) {
      this.logger.warn(
        'LLM yapılandırması bulunamadı, varsayılan değerler kullanılıyor',
      );
      this.config = {
        provider: 'gemini',
        apiKey: 'AIzaSyCIYYYDSYB_QN00OgoRPQgXR2cUUWCzRmw', // Varsayılan demo anahtar
        model: 'gemini-2.0-flash',
        temperature: 0.5,
        maxTokens: 30048,
      };
    } else {
      this.config = llmConfig as AIProviderConfig;

      // Yapılandırma bulunsa bile, belirli ayarların varsayılan değerlerini güncelle
      if (this.config.model === 'gemini-2.0-flash') {
        this.logger.log(
          'Gemini model sürümü "gemini-2.0-flash-001" olarak güncelleniyor (daha kaliteli içerik üretimi için)',
        );
        this.config.model = 'gemini-2.0-flash-001';
      }

      // Sıcaklık değeri 0.7'den yüksekse, daha tutarlı yanıtlar için 0.5'e düşür
      if (
        this.config.temperature === undefined ||
        this.config.temperature > 0.7
      ) {
        this.logger.log(
          'Sıcaklık değeri 0.5 olarak ayarlanıyor (daha tutarlı içerik üretimi için)',
        );
        this.config.temperature = 0.5;
      }

      // Token limiti düşükse güncelle
      if (this.config.maxTokens === undefined || this.config.maxTokens < 1024) {
        this.logger.log(
          'Token limiti 2048 olarak güncelleniyor (daha kapsamlı yanıtlar için)',
        );
        this.config.maxTokens = 2048;
      }
    }

    // Aktif sağlayıcıyı ayarla
    const provider = this.providers.get(this.config.provider);

    if (!provider) {
      throw new Error(`${this.config.provider} sağlayıcısı bulunamadı`);
    }

    provider.initialize(this.config);
    this.activeProvider = provider;

    this.logger.log(
      `AI Provider Service başlatıldı (sağlayıcı: ${this.config.provider}, model: ${this.config.model})`,
    );
  }

  /**
   * Metinden içerik üretir
   */
  async generateContent(
    prompt: string,
    options?: AIRequestOptions,
  ): Promise<AIResponse> {
    if (!this.activeProvider) {
      throw new Error('Hiçbir AI sağlayıcısı aktif değil');
    }

    try {
      // Prompt'un uzunluğunu logla
      this.logger.debug(
        `AI içerik üretme isteği: ${prompt.length} karakter, model: ${this.config.model}`,
      );

      // AIRequestOptions içinde metadata varsa çıkar ve log için kullan
      const metadata = options?.metadata || {};
      const traceId =
        metadata.traceId ||
        `ai-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // AI'ya gönderilen prompt'u iyileştirmek için yapılandırmayı ayarla
      const enhancedOptions = {
        ...options,
        systemInstruction:
          options?.systemInstruction ||
          `Sen eğitim içeriği hazırlayan profesyonel bir eğitmensin. 
          Verilen konulara özel, doğru, kapsamlı ve eğitici sorular hazırla.
          
          Talimatlar:
          1. Her soru net ve anlaşılır olmalı.
          2. Soruların zorluk seviyesini belirtilen zorluk seviyesine göre ayarla.
          3. Her soruda 4 seçenek olmalı ve sadece bir doğru cevap bulunmalı.
          4. Tüm cevaplar gerçekçi ve makul olmalı, açıkça yanlış veya saçma şıklar olmamalı.
          5. Seçenekler arasında karmaşıklık seviyesi benzer olmalı.
          6. Her soru için doğru cevabı açıklayan bir açıklama ekle.
          7. Kodlama/programlama ile ilgili sorularda, kodun mantığını ve işlevini test et.
          8. Matematiksel içerikte, formülleri ve hesaplamaları doğru ver.
          9. Hemen uygulanabilir pratik bilgiye odaklan.
          10. Yanıtını her zaman talep edilen JSON formatında ver.

          JSON formatı:
          {
            "questions": [
              {
                "questionText": "Soru metni",
                "options": ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"],
                "correctAnswer": "Doğru seçenek",
                "explanation": "Neden bu cevabın doğru olduğunun açıklaması"
              }
            ]
          }`,
      };

      this.logger.log(
        `[${traceId}] AI içerik üretme başlatılıyor (${prompt.length} karakter)`,
        'AIProviderService.generateContent',
        __filename,
        undefined,
        {
          promptLength: prompt.length,
          modelName: this.config.model,
          provider: this.config.provider,
          traceId,
        },
      );

      // İstek başlangıç zamanını kaydet
      const startTime = Date.now();

      // Aktif AI sağlayıcısı ile içerik üret
      const response = await this.activeProvider.generateContent(
        prompt,
        enhancedOptions,
      );

      // Tamamlanma süresini hesapla
      const duration = Date.now() - startTime;

      this.logger.log(
        `[${traceId}] AI içerik üretme tamamlandı (${duration}ms, yanıt: ${response.text?.length || 0} karakter)`,
        'AIProviderService.generateContent',
        __filename,
        undefined,
        {
          duration,
          responseLength: response.text?.length || 0,
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
          traceId,
          hasJsonContent:
            response.text?.includes('{') && response.text?.includes('}'),
        },
      );

      // Yanıt içeriğini kontrol et - JSON sonucu bekleniyorsa ve yanıtta JSON yok ise hata fırlat
      const expectingJson =
        prompt.toLowerCase().includes('json') ||
        (enhancedOptions.systemInstruction &&
          enhancedOptions.systemInstruction.toLowerCase().includes('json'));

      if (
        expectingJson &&
        response.text &&
        (!response.text.includes('{') || !response.text.includes('}'))
      ) {
        this.logger.warn(
          `[${traceId}] AI yanıtında JSON bekleniyordu, ancak JSON yapısı bulunamadı`,
          'AIProviderService.generateContent',
          __filename,
          undefined,
          { responsePreview: response.text.substring(0, 100) + '...', traceId },
        );
      }

      return response;
    } catch (error) {
      // Hata durumunda detaylı loglama
      this.logger.error(
        `AI içerik üretme hatası: ${error.message}`,
        'AIProviderService.generateContent',
        __filename,
        undefined,
        error,
      );

      // Sağlayıcı hatası durumunda yedek sağlayıcıya geçme seçeneği (şimdilik sadece loglama)
      this.logger.warn(
        `AI sağlayıcısı hatası: ${this.config.provider}, ${this.config.model}. Yedek sağlayıcı kullanılabilir.`,
        'AIProviderService.generateContent',
      );

      // Hatayı yukarı fırlat
      throw error;
    }
  }

  /**
   * Farklı bir sağlayıcıya geçiş yapar
   */
  switchProvider(providerName: string, config?: AIProviderConfig): void {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`${providerName} sağlayıcısı bulunamadı`);
    }

    // Eğer yeni yapılandırma verilmişse kullan, yoksa mevcut olanı güncelle
    const newConfig = config || { ...this.config, provider: providerName };

    provider.initialize(newConfig);
    this.activeProvider = provider;
    this.config = newConfig;

    this.logger.log(`Sağlayıcı değiştirildi: ${providerName}`);
  }
}
