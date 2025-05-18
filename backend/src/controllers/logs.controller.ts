import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Get,
} from '@nestjs/common';
import { LoggerService as BackendLoggerService } from '../common/services/logger.service';
import * as path from 'path';
import * as fs from 'fs';

// Frontend LoggerService'den gelen LogEntry tipi
interface FrontendLoggerEntry {
  timestamp: string;
  level: string; // LogLevel enum'unun string hali (DEBUG, INFO, WARN, ERROR)
  message: string;
  context?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

// Frontend FlowTrackerService'den gelen FlowStep tipi
interface FrontendFlowStep {
  id: string;
  timestamp: number; // Epoch time
  category: string; // FlowCategory enum'unun string hali
  message: string;
  context: string;
  timing?: number;
  metadata?: Record<string, unknown>;
}

@Controller('logs')
export class LogsController {
  private readonly logsDir = path.join(process.cwd(), 'logs');

  constructor(private readonly backendLogger: BackendLoggerService) {
    this.backendLogger.info(
      'LogsController başlatıldı - Frontend logları için API hazır.',
      'LogsController',
    );
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  @Post('frontend') // LoggerService logları için
  @HttpCode(HttpStatus.OK)
  async logFrontendEntries(
    @Body() logEntries: FrontendLoggerEntry[], // Artık bir dizi bekliyoruz
  ): Promise<{ success: boolean; message?: string }> {
    if (!Array.isArray(logEntries) || logEntries.length === 0) {
      this.backendLogger.warn(
        'Boş veya geçersiz formatta log isteği alındı.',
        'LogsController.logFrontendEntries',
      );
      return { success: false, message: 'Log verisi yok veya format yanlış.' };
    }

    try {
      this.backendLogger.debug(
        `${logEntries.length} adet frontend log isteği alındı.`,
        'LogsController.logFrontendEntries',
      );

      for (const entry of logEntries) {
        const logFileName =
          entry.level.toUpperCase() === 'ERROR'
            ? 'frontend-error.log'
            : 'frontend-general.log';
        const logFilePath = path.join(this.logsDir, logFileName);

        const logLine = `[${new Date(entry.timestamp).toISOString()}] [${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}${entry.stack ? `\nStack: ${entry.stack}` : ''}`;

        if (!entry.message) {
          this.backendLogger.warn(
            'Log mesajı boş, log atlanıyor.',
            'LogsController.logFrontendEntries',
            undefined,
            undefined,
            { receivedEntry: entry },
          );
          continue;
        }
        await fs.promises.appendFile(logFilePath, logLine + '\n', {
          encoding: 'utf8',
        });
      }

      this.backendLogger.debug(
        `${logEntries.length} log başarıyla kaydedildi.`,
        'LogsController.logFrontendEntries',
      );
      return { success: true, message: 'Loglar başarıyla kaydedildi' };
    } catch (error) {
      const errorObject =
        error instanceof Error ? error : new Error(String(error));
      this.backendLogger.error(
        `Frontend logları kaydedilemedi: ${errorObject.message}`,
        errorObject.stack || '',
        'LogsController.logFrontendEntries',
      );
      return {
        success: false,
        message: `Loglar kaydedilemedi: ${errorObject.message}`,
      };
    }
  }

  @Post('frontend-flow') // FlowTrackerService logları için
  @HttpCode(HttpStatus.OK)
  async logFrontendFlowSteps(
    @Body() flowSteps: FrontendFlowStep[], // Artık bir dizi bekliyoruz
  ): Promise<{ success: boolean; message?: string }> {
    if (!Array.isArray(flowSteps) || flowSteps.length === 0) {
      this.backendLogger.warn(
        'Boş veya geçersiz formatta flow log isteği alındı.',
        'LogsController.logFrontendFlowSteps',
      );
      return {
        success: false,
        message: 'Flow log verisi yok veya format yanlış.',
      };
    }

    try {
      this.backendLogger.debug(
        `${flowSteps.length} adet frontend flow log isteği alındı.`,
        'LogsController.logFrontendFlowSteps',
      );
      const logFilePath = path.join(this.logsDir, 'frontend-flow-tracker.log');

      let logContent = '';
      for (const step of flowSteps) {
        const logLine = `[${new Date(step.timestamp).toISOString()}] [${step.category.toUpperCase()}] ${step.context ? `[${step.context}] ` : ''}${step.message}${step.timing ? ` (Timing: ${step.timing.toFixed(2)}ms)` : ''}`;
        if (!step.message) {
          this.backendLogger.warn(
            'Flow log mesajı boş, log atlanıyor.',
            'LogsController.logFrontendFlowSteps',
            undefined,
            undefined,
            { receivedStep: step },
          );
          continue;
        }
        logContent += logLine + '\n';
      }

      if (logContent) {
        await fs.promises.appendFile(logFilePath, logContent, {
          encoding: 'utf8',
        });
      }

      this.backendLogger.debug(
        `${flowSteps.length} flow log başarıyla kaydedildi.`,
        'LogsController.logFrontendFlowSteps',
      );
      return { success: true, message: 'Flow logları başarıyla kaydedildi' };
    } catch (error) {
      const errorObject =
        error instanceof Error ? error : new Error(String(error));
      this.backendLogger.error(
        `Frontend flow logları kaydedilemedi: ${errorObject.message}`,
        errorObject.stack || '',
        'LogsController.logFrontendFlowSteps',
      );
      return {
        success: false,
        message: `Flow logları kaydedilemedi: ${errorObject.message}`,
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
