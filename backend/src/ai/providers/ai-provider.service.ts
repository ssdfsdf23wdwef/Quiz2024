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
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1024,
      };
    } else {
      this.config = llmConfig as AIProviderConfig;
    }

    // Aktif sağlayıcıyı ayarla
    const provider = this.providers.get(this.config.provider);

    if (!provider) {
      throw new Error(`${this.config.provider} sağlayıcısı bulunamadı`);
    }

    provider.initialize(this.config);
    this.activeProvider = provider;

    this.logger.log(
      `AI Provider Service başlatıldı (sağlayıcı: ${this.config.provider})`,
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
      return await this.activeProvider.generateContent(prompt, options);
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
