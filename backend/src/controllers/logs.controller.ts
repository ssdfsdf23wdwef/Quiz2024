import { Controller, Post, Body, Injectable } from '@nestjs/common';
import { LoggerService } from '../common/services/logger.service';
import * as path from 'path';
import * as fs from 'fs';

interface FrontendLogEntry {
  formattedLog: string;
  isError: boolean;
  entry: {
    timestamp: string;
    level: string;
    message: string;
    context?: string;
    filePath?: string;
    lineNumber?: number;
    metadata?: Record<string, unknown>;
    stackTrace?: string;
  };
}

@Controller('api/logs')
export class LogsController {
  constructor(private readonly loggerService: LoggerService) {}

  @Post('frontend')
  async logFrontendEntry(
    @Body() logData: FrontendLogEntry,
  ): Promise<{ success: boolean }> {
    try {
      // Dosya yolunu belirle - hata mı yoksa akış logu mu
      const logDir = path.join(process.cwd(), '..', 'logs');
      const logFile = logData.isError
        ? 'frontend-error.log'
        : 'frontend-flow-tracker.log';
      const logPath = path.join(logDir, logFile);

      // Dizin kontrolü ve oluşturma
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Log dosyasına yaz
      fs.appendFileSync(logPath, logData.formattedLog + '\n', {
        encoding: 'utf8',
      });

      // Başarılı yanıt
      return { success: true };
    } catch (error) {
      // Hata durumunu backend loguna kaydet
      this.loggerService.error(
        `Frontend log kaydedilemedi: ${error.message}`,
        'LogsController.logFrontendEntry',
        __filename,
        31,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Başarısız yanıt
      return { success: false };
    }
  }
}
