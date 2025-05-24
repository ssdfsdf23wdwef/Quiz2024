import { Injectable } from '@nestjs/common';
import { AIProviderService } from '../providers/ai-provider.service';
import { QuizMetadata } from '../interfaces';
import { LoggerService } from '../../common/services/logger.service';

/**
 * generateAIContent metodu - AI yanıtı oluşturmak için kullanılır
 * Bu dosya quiz-generation.service.ts içinde kullanılmak üzere oluşturuldu
 */
export async function generateAIContent(
  this: any,
  promptText: string, 
  metadata: QuizMetadata
): Promise<string> {
  const traceId = metadata.traceId;
  const logger = this.logger || LoggerService.getInstance();
  
  logger.info(
    `[${traceId}] AI içerik üretme başlatılıyor (${promptText.length} karakter)`,
    'QuizGenerationService.generateAIContent',
  );

  // Yeniden deneme parametreleri
  const MAX_RETRIES = 2;
  let currentRetry = 0;
  let lastError: any = null;

  while (currentRetry <= MAX_RETRIES) {
    try {
      // AI içerik üretme
      const response = await this.aiProviderService.generateContent({
        prompt: promptText,
        modelName: 'gemini-2.0-flash',
        provider: 'gemini',
        traceId,
      });

      // Boş yanıt kontrolü
      if (response && response.includes('"questions": []') && currentRetry < MAX_RETRIES) {
        logger.warn(
          `[${traceId}] AI boş yanıt döndürdü (deneme: ${currentRetry + 1}/${MAX_RETRIES + 1}). Tekrar deneniyor...`,
          'QuizGenerationService.generateAIContent',
        );
        currentRetry++;
        // Kısa bir gecikme ekleyelim (250ms)
        await new Promise(resolve => setTimeout(resolve, 250));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (currentRetry < MAX_RETRIES) {
        logger.warn(
          `[${traceId}] AI içerik üretme hatası (deneme: ${currentRetry + 1}/${MAX_RETRIES + 1}): ${error.message}. Tekrar deneniyor...`,
          'QuizGenerationService.generateAIContent',
        );
        currentRetry++;
        // Hata durumunda biraz daha uzun bir gecikme ekleyelim (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        break;
      }
    }
  }

  // Tüm denemeler başarısız olursa
  logger.error(
    `[${traceId}] AI içerik üretme ${MAX_RETRIES + 1} denemeden sonra başarısız oldu: ${lastError?.message || 'Bilinmeyen hata'}`,
    'QuizGenerationService.generateAIContent',
  );

  throw new Error(
    `AI içerik üretme sırasında bir hata oluştu: ${lastError?.message || 'Boş yanıt'}`
  );
}
