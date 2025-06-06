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
    await this.loadPrompt('generate-quiz-new-topics-tr.txt');
    await this.loadPrompt('detect-topics-tr.txt');
    await this.loadPrompt('detect_new_topics_exclusive_tr.txt');
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

    // Koşullu içeriği işle ({{#VARIABLE}}...{{/VARIABLE}})
    const conditionalMatches = template.match(
      /{{#([^}]+)}}([\s\S]*?){{\/\1}}/g,
    );
    if (conditionalMatches) {
      for (const match of conditionalMatches) {
        const variableMatch = match.match(/{{#([^}]+)}}/);
        const contentMatch = match.match(/{{#[^}]+}}([\s\S]*?){{\/[^}]+}}/);

        if (
          variableMatch &&
          variableMatch[1] &&
          contentMatch &&
          contentMatch[1]
        ) {
          const variableName = variableMatch[1];
          const content = contentMatch[1];

          if (variables[variableName]) {
            // Değişken mevcutsa, koşullu içeriği ekle (başlık etiketlerini kaldırarak)
            compiledPrompt = compiledPrompt.replace(match, content);
          } else {
            // Değişken mevcut değilse, tüm koşullu içeriği kaldır
            compiledPrompt = compiledPrompt.replace(match, '');
          }
        }
      }
    }

    // Alternatif koşullu içerik formatını da işle ({#VARIABLE}...{/VARIABLE})
    const altCondMatches = template.match(/\{#([^}]+)\}([\s\S]*?)\{\/\1\}/g);
    if (altCondMatches) {
      for (const match of altCondMatches) {
        const variableMatch = match.match(/\{#([^}]+)\}/);
        const contentMatch = match.match(/\{#[^}]+\}([\s\S]*?)\{\/[^}]+\}/);

        if (
          variableMatch &&
          variableMatch[1] &&
          contentMatch &&
          contentMatch[1]
        ) {
          const variableName = variableMatch[1];
          const content = contentMatch[1];

          if (variables[variableName]) {
            // Değişken mevcutsa, koşullu içeriği ekle
            compiledPrompt = compiledPrompt.replace(match, content);
          } else {
            // Değişken mevcut değilse, tüm koşullu içeriği kaldır
            compiledPrompt = compiledPrompt.replace(match, '');
          }
        }
      }
    }

    // Normal değişkenleri değiştir
    for (const [key, value] of Object.entries(variables)) {
      // İki format için de değişkenleri değiştir: {{VAR}} ve {VAR}
      compiledPrompt = compiledPrompt.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value || '',
      );

      compiledPrompt = compiledPrompt.replace(
        new RegExp(`\{${key}\}`, 'g'),
        value || '',
      );
    }

    // Kalan değişkenleri kontrol et ama JSON örnek formatlarını ve şablonları hariç tut
    // Önce örnek bölümlerini ve JSON blok içeriklerini tespit et
    const jsonExampleBlocks = [
      // Markdown JSON bloklarını tespit et
      /(```json[\s\S]*?```)/g,
      // Örnek başlıklı bölümleri tespit et
      /(örnek|example)[\s\S]*?(\{[\s\S]*?\})/gi,
      // id: "q1" veya id: "soru-id-auto-generated" içeren JSON nesnelerini tespit et
      /(\{[\s\S]*?("id"\s*:\s*"q\d+"|"id"\s*:\s*"soru-id)[\s\S]*?\})/g,
      // Örnek sorularını içeren blokları tespit et
      /(-- ÖRNEK BAŞLANGIÇ[\s\S]*?-- ÖRNEK BİTİŞ --)/g,
    ];

    // Örnekleri geçici olarak kaldır
    let tempPrompt = compiledPrompt;
    const exampleBlocks: string[] = [];
    for (const pattern of jsonExampleBlocks) {
      const matches = tempPrompt.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Örnek bloğunu geçici olarak placeholder ile değiştir
          const placeholder = `__EXAMPLE_BLOCK_${exampleBlocks.length}__`;
          exampleBlocks.push(match);
          tempPrompt = tempPrompt.replace(match, placeholder);
        }
      }
    }

    // Şimdi kalan gerçek değişkenleri kontrol et
    const remainingVars1 = tempPrompt.match(/{{[^}]+}}/g);
    const remainingVars2 = tempPrompt.match(/\{[^#\/][^}]*\}/g);

    const remainingVariables = [
      ...(remainingVars1 || []),
      ...(remainingVars2 || []),
    ].filter((variable) => {
      // Örnek değişkenleri filtrele
      return (
        !variable.includes('example') &&
        !variable.includes('örnek') &&
        !variable.includes('q1') &&
        !variable.includes('q2') &&
        !variable.includes('soru-id-auto-generated')
      );
    });

    if (remainingVariables && remainingVariables.length > 0) {
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
