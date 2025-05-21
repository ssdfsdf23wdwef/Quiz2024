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
      // PDF parse yapılandırması
      const options = {
        // Tüm sayfaları işleme ayarı
        max: 0, // 0 = sınırsız (tüm sayfalar)
        // Metin çıkarma stratejisi için PDF özel seçenekler
        pagerender: (pageData) => {
          // Sayfa metnini Türkçe karakterleri düzgün işleyecek şekilde al
          const renderOptions = {
            normalizeWhitespace: false, // Satır sonlarını korumak için false
            disableCombineTextItems: false, // Metin öğelerini birleştirmeyi devre dışı bırakma
          };
          return pageData
            .getTextContent(renderOptions)
            .then(function (textContent) {
              let lastY,
                text = '';
              // Her metin parçasını işle
              for (let item of textContent.items) {
                // Yeni satır kontrolü - farklı Y pozisyonları yeni satırları gösterir
                if (lastY != item.transform[5] && lastY !== undefined) {
                  text += '\n';
                }
                text += item.str;
                lastY = item.transform[5];
              }
              return text;
            });
        },
        // Sayfalar arasında ayırıcı ekle
        onPageEnd: (pageData, pageIndex) => {
          return '\n\n------ Sayfa ' + (pageIndex + 1) + ' Sonu ------\n\n';
        },
        // Metni çıkarırken ilerleme kaydı tut
        onProgress: (progressData) => {
          if (progressData.currentPage && progressData.currentPage % 10 === 0) {
            this.logger.debug(
              `PDF işleniyor: Sayfa ${progressData.currentPage}/${progressData.pagesCount}`,
              'DocumentProcessingService.extractFromPdf',
              __filename,
            );
          }
        },
      };

      // PDF'ten metni çıkar
      const data = await pdfParse(buffer, options);

      // Çıkarılan metni kaydet ve logla
      this.logger.debug(
        `PDF'den ${data.numpages} sayfa metin çıkarıldı. Toplam uzunluk: ${data.text.length} karakter, İlk 150 karakter: ${data.text.substring(0, 150)}`,
        'DocumentProcessingService.extractFromPdf',
        __filename,
        70,
        {
          pageCount: data.numpages,
          textLength: data.text.length,
          firstPageSample: data.text.substring(0, 200),
          lastPageSample: data.text.substring(data.text.length - 200),
        },
      );

      // Sayfalar arası "Sayfa X Sonu" yazılarını temizleme opsiyonu
      // const cleanText = data.text.replace(/\n\n------ Sayfa \d+ Sonu ------\n\n/g, '\n\n');

      return data.text;
    } catch (error) {
      this.logger.logError(error, 'DocumentProcessingService.extractFromPdf', {
        additionalInfo: 'PDF belgesi işlenirken hata oluştu',
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new BadRequestException(
        'PDF dosyası işlenirken hata oluştu: ' + error.message,
      );
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

    // Eğer text null veya undefined ise boş string döndür
    if (!text) {
      this.logger.warn(
        'Normalleştirilecek metin boş veya tanımsız',
        'DocumentProcessingService.normalizeText',
        __filename,
        100,
      );
      return '';
    }

    // Türkçe karakterleri korumak için özel bir işlem yapmaya gerek yok
    // çünkü JavaScript Unicode'u destekler

    // Çoklu ardışık boşlukları tek boşluğa dönüştür, ancak satır sonlarını koru
    let normalized = text.replace(/[ \t]+/g, ' ');

    // Boş satırları temizle ama satır yapısını koru
    // 3'ten fazla ardışık satır sonunu 2 satır sonu ile değiştir
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    // Satırların başındaki ve sonundaki boşlukları temizle
    normalized = normalized
      .split('\n')
      .map((line) => line.trim())
      .join('\n');

    // PDF'den çıkarılan metinlerde oluşabilen garip karakterleri temizle
    // Ancak Türkçe karakterleri koruyarak
    normalized = normalized.replace(
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,
      '',
    );

    this.logger.debug(
      'Metin normalleştirildi',
      'DocumentProcessingService.normalizeText',
      __filename,
      120,
      {
        originalLength: text.length,
        normalizedLength: normalized.length,
        sampleOriginal: text.substring(0, 100),
        sampleNormalized: normalized.substring(0, 100),
      },
    );

    return normalized;
  }
}
