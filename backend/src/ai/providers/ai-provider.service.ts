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
        model: 'gemini-1.5-flash-001',
        temperature: 0.5,
        maxTokens: 2048,
      };
    } else {
      this.config = llmConfig as AIProviderConfig;

      // Yapılandırma bulunsa bile, belirli ayarların varsayılan değerlerini güncelle
      if (this.config.model === 'gemini-1.5-flash') {
        this.logger.log(
          'Gemini model sürümü "gemini-1.5-flash-001" olarak güncelleniyor (daha kaliteli içerik üretimi için)',
        );
        this.config.model = 'gemini-1.5-flash-001';
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

      // AI'ya gönderilen prompt'u iyileştirmek için yapılandırmayı ayarla
      const enhancedOptions = {
        ...options,
        systemInstruction:
          options?.systemInstruction ||
          `Sen eğitim içeriği hazırlayan profesyonel bir eğitmensin. 
          Verilen konulara özel, doğru, kapsamlı ve eğitici sorular hazırla.
          
          Talimatlar:
          1. Sorular, belirtilen alt konulara ve belge içeriğine uygun ve spesifik olmalı
          2. Her soru, öğrenmeyi destekleyici ve net olmalı
          3. Açıklamalar detaylı ve öğretici olmalı, öğrencinin konuyu anlamasına yardımcı olmalı
          4. Doğru cevaplar, alt konulara ve gerçek bilgiye dayalı olmalı
          5. Sadece yanıtını bildiğin soruları hazırla, uydurma veya hatalı içerik kullanma
          6. Yanıtlarını JSON formatında ver ve formatı kesinlikle bozma
          
          İstenilen format:
          {
            "questions": [{
              "questionText": "Soru metni",
              "options": ["A) Şık 1", "B) Şık 2", "C) Şık 3", "D) Şık 4"],
              "correctAnswer": "A) Şık 1",
              "explanation": "Neden bu cevabın doğru olduğuna dair açıklama",
              "subTopicName": "İlgili alt konu adı",
              "difficulty": "medium" // kolay, orta, zor
            }]
          }`,
      };

      return await this.activeProvider.generateContent(prompt, enhancedOptions);
    } catch (error) {
      this.logger.error(`İçerik üretme hatası: ${error.message}`, error.stack);
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
