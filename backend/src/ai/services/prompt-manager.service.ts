import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../../common/services/logger.service';

/**
 * AI promptlarını yöneten servis
 */
@Injectable()
export class PromptManagerService implements OnModuleInit {
  private readonly logger: LoggerService;
  private promptCache: Map<string, string> = new Map();
  private readonly PROMPT_DIR = path.join(__dirname, '..', 'prompts');

  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Servis başlangıcında çalışır
   */
  async onModuleInit() {
    // Başlangıçta sık kullanılan promptları önbelleğe yükle
    await this.loadPrompt('generate-quiz-tr.txt');
    await this.loadPrompt('detect-topics-tr.txt');
  }

  /**
   * Prompt dosyasını yükler ve önbelleğe alır
   * @param promptFileName Prompt dosya adı
   * @returns Prompt içeriği
   */
  async loadPrompt(promptFileName: string): Promise<string> {
    try {
      // Eğer önbellekte varsa, onu döndür
      if (this.promptCache.has(promptFileName)) {
        const cachedPrompt = this.promptCache.get(promptFileName);
        if (cachedPrompt) {
          return cachedPrompt;
        }
      }

      // Dosyayı oku
      const promptPath = path.join(this.PROMPT_DIR, promptFileName);
      const content = await fs.promises.readFile(promptPath, 'utf-8');

      // Önbelleğe al
      this.promptCache.set(promptFileName, content);
      this.logger.info(
        `Prompt dosyası başarıyla yüklendi: ${promptFileName}`,
        'PromptManagerService.loadPrompt',
      );

      return content;
    } catch (error) {
      this.logger.error(
        `Prompt dosyası yüklenemedi: ${promptFileName} - ${error.message}`,
        'PromptManagerService.loadPrompt',
        undefined,
        error,
      );
      return '';
    }
  }

  /**
   * Prompt içeriğindeki değişkenleri değiştirir
   * @param template Prompt şablonu
   * @param variables Değişken değerleri
   * @returns Derlenmiş prompt
   */
  compilePrompt(template: string, variables: Record<string, string>): string {
    if (!template) {
      this.logger.warn(
        'Boş şablon ile compilePrompt çağrıldı',
        'PromptManagerService.compilePrompt',
      );
      return '';
    }

    let compiledPrompt = template;
    for (const [key, value] of Object.entries(variables)) {
      compiledPrompt = compiledPrompt.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value || '',
      );
    }

    // Kalan değişkenleri kontrol et
    const remainingVariables = compiledPrompt.match(/{{[^}]+}}/g);
    if (remainingVariables) {
      this.logger.warn(
        `Prompt şablonunda doldurulmamış değişkenler var: ${remainingVariables.join(', ')}`,
        'PromptManagerService.compilePrompt',
      );
    }

    return compiledPrompt;
  }

  /**
   * Fallback quiz prompt içeriğini döndürür
   */
  getFallbackQuizPrompt(): string {
    this.logger.warn(
      "Fallback quiz prompt kullanılıyor. Lütfen 'generate-quiz-tr.txt' dosyasının varlığını kontrol edin.",
      'PromptManagerService.getFallbackQuizPrompt',
    );

    return JSON.stringify({
      questions: [
        {
          id: 'fallback-1',
          questionText: 'Fallback Soru: Lütfen sistem ayarlarını kontrol edin.',
          options: [
            'A) Tamam',
            'B) Anlaşıldı',
            'C) Kontrol Edilecek',
            'D) Devam Et',
          ],
          correctAnswer: 'A) Tamam',
          explanation: 'Bu bir fallback sorusudur, prompt yüklenemedi.',
          subTopicName: 'Sistem Hatası',
          normalizedSubTopicName: 'sistem_hatasi',
          difficulty: 'medium',
          questionType: 'multiple_choice',
          cognitiveDomain: 'understanding',
        },
      ],
    });
  }
}
