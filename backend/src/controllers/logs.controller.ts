import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Get,
} from '@nestjs/common';
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

@Controller('logs')
export class LogsController {
  private readonly logsDir = path.join(process.cwd(), 'logs');

  constructor(private readonly loggerService: LoggerService) {
    console.log(
      '[LogsController] Başlatıldı - Frontend logları için API hazır',
    );

    // logs klasörünün varlığını kontrol et, yoksa oluştur
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  @Post('frontend')
  @HttpCode(HttpStatus.OK)
  async logFrontendEntry(
    @Body() logData: FrontendLogEntry,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(
        '[LogsController] Frontend log isteği alındı:',
        logData.isError ? 'ERROR' : 'INFO',
      );

      // Hata mı akış logu mu belirle
      const logFileName = logData.isError
        ? 'frontend-error.log'
        : 'frontend-flow-tracker.log';
      const logFilePath = path.join(this.logsDir, logFileName);

      // Log içeriği kontrolü
      if (!logData.formattedLog) {
        console.warn('[LogsController] Log içeriği boş');
        return { success: false, message: 'Log içeriği boş' };
      }

      // Log dosyasına asenkron olarak yaz
      await fs.promises.appendFile(logFilePath, logData.formattedLog + '\n', {
        encoding: 'utf8',
      });

      console.log(`[LogsController] Log başarıyla kaydedildi: ${logFilePath}`);

      // Başarılı yanıt
      return { success: true, message: 'Log başarıyla kaydedildi' };
    } catch (error) {
      // Hata durumunu backend loguna kaydet
      console.error('[LogsController] Frontend log kaydedilemedi:', error);

      this.loggerService.error(
        `Frontend log kaydedilemedi: ${error instanceof Error ? error.message : String(error)}`,
        'LogsController.logFrontendEntry',
        __filename,
        31,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Başarısız yanıt
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Beklenmeyen hata',
      };
    }
  }

  @Get('status')
  getStatus() {
    const files = fs.readdirSync(this.logsDir);
    const logStats = files.map((file) => {
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);
      return {
        fileName: file,
        size: stats.size,
        lastModified: stats.mtime,
      };
    });

    return {
      status: 'online',
      logFiles: logStats,
    };
  }
}
