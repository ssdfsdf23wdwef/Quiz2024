import { Injectable, Logger, BadRequestException } from '@nestjs/common';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@Injectable()
export class DocumentProcessingService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor() {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'DocumentProcessingService başlatıldı',
      'DocumentProcessingService.constructor',
      __filename,
      14,
    );
  }

  /**
   * Extract text from a document buffer based on file type
   */
  @LogMethod({ trackParams: true })
  async extractText(buffer: Buffer, fileType: string): Promise<string> {
    this.flowTracker.trackStep(
      `${fileType} tipindeki belgeden metin çıkarılıyor`,
      'DocumentProcessingService',
    );

    try {
      switch (fileType.toLowerCase()) {
        case 'application/pdf':
          return this.extractFromPdf(buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return this.extractFromDocx(buffer);
        case 'text/plain':
          return buffer.toString('utf-8');
        default:
          throw new BadRequestException(
            `Desteklenmeyen dosya türü: ${fileType}`,
          );
      }
    } catch (error) {
      this.logger.logError(error, 'DocumentProcessingService.extractText', {
        fileType,
        additionalInfo: 'Metin çıkarma işlemi sırasında hata oluştu',
      });
      throw new BadRequestException(
        `Belge işlenirken hata oluştu: ${error.message}`,
      );
    }
  }

  /**
   * Extract text from a PDF buffer
   */
  @LogMethod({ trackParams: false })
  private async extractFromPdf(buffer: Buffer): Promise<string> {
    this.flowTracker.trackStep(
      'PDF belgesi işleniyor',
      'DocumentProcessingService',
    );
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.logError(error, 'DocumentProcessingService.extractFromPdf', {
        additionalInfo: 'PDF belgesi işlenirken hata oluştu',
      });
      throw new BadRequestException('PDF dosyası işlenirken hata oluştu');
    }
  }

  /**
   * Extract text from a DOCX buffer
   */
  @LogMethod({ trackParams: false })
  private async extractFromDocx(buffer: Buffer): Promise<string> {
    this.flowTracker.trackStep(
      'DOCX belgesi işleniyor',
      'DocumentProcessingService',
    );
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.logError(error, 'DocumentProcessingService.extractFromDocx', {
        additionalInfo: 'DOCX belgesi işlenirken hata oluştu',
      });
      throw new BadRequestException('DOCX dosyası işlenirken hata oluştu');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  @LogMethod({ trackParams: false })
  normalizeText(text: string): string {
    this.flowTracker.trackStep(
      'Metin normalleştiriliyor',
      'DocumentProcessingService',
    );

    // Remove excess whitespace
    let normalized = text.replace(/\s+/g, ' ').trim();

    // Remove unusual characters and normalize line breaks
    normalized = normalized.replace(/[\r\n]+/g, '\n');

    // Other potential text normalizations can be added here
    this.logger.debug(
      'Metin normalleştirildi',
      'DocumentProcessingService.normalizeText',
      __filename,
      76,
      { originalLength: text.length, normalizedLength: normalized.length },
    );

    return normalized;
  }
}
