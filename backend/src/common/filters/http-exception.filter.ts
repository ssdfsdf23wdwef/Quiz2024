import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';
import { FlowTrackerService } from '../services/flow-tracker.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly standardLogger = new Logger(HttpExceptionFilter.name);
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    @Optional()
    @Inject('SentryService')
    private readonly sentryClient?: any, // Geçici olarak any tipini kullanıyoruz
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      // Handle standard HTTP exceptions
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'object') {
        message = (errorResponse as any).message || exception.message;
        error = (errorResponse as any).error || 'HTTP Hatası';
      } else {
        message = errorResponse;
        error = exception.message;
      }
    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Beklenmeyen bir hata oluştu';
      error = 'Sunucu Hatası';

      // Log the full error for unexpected exceptions
      this.standardLogger.error(
        `Beklenmeyen hata: ${exception.message}`,
        exception.stack,
      );

      // Akış takibine ekle
      this.flowTracker.track(
        `❌ Beklenmeyen hata: ${exception.message}`,
        'HttpExceptionFilter',
      );
    }

    // Send error to Sentry if it's a server error (500+)
    if (status >= 500 && this.sentryClient) {
      // Build extra data for Sentry
      const extraData: Record<string, any> = {
        path: request.url,
        method: request.method,
        ip: request.ip,
        headers: this.sanitizeRequestBody(request.headers),
        body: this.sanitizeRequestBody(request.body),
        status,
      };

      // Add user info if available (for authenticated routes)
      if ('user' in request) {
        extraData.user = this.sanitizeRequestBody((request as any).user);
      }

      // Sentry entegrasyonu npm modülleri kurulduktan sonra doğru şekilde çalışacaktır
      if (typeof this.sentryClient.captureException === 'function') {
        this.sentryClient.captureException(exception, {
          extra: extraData,
          tags: {
            component: 'HttpExceptionFilter',
            statusCode: status.toString(),
          },
        });

        this.flowTracker.track(
          `Hata Sentry'e gönderildi: ${status} ${request.method} ${request.url}`,
          'HttpExceptionFilter',
        );
      } else {
        this.standardLogger.warn('Sentry entegrasyonu yapılandırılmamış');
      }
    }

    // Log detaylı hata bilgisini dosyaya yaz
    this.logger.error(
      `HTTP hata yakalandı: ${message}`,
      'HttpExceptionFilter.catch',
      __filename,
      undefined,
      exception,
      {
        method: request.method,
        url: request.url,
        statusCode: status,
        body: this.sanitizeRequestBody(request.body),
        headers: this.sanitizeRequestBody(request.headers),
        params: request.params,
        query: request.query,
      },
    );

    // Log the error to standard logger (with different levels based on status)
    if (status >= 500) {
      this.standardLogger.error(
        `${request.method} ${request.url} ${status} - ${message}`,
      );
    } else if (status >= 400) {
      this.standardLogger.warn(
        `${request.method} ${request.url} ${status} - ${message}`,
      );
    }

    // Akış takibine ekle
    this.flowTracker.track(
      `🔴 HTTP ${status} yanıtı gönderiliyor: ${request.method} ${request.url}`,
      'HttpExceptionFilter',
    );

    // Return a standardized error response
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Sanitize request body to remove sensitive information before sending to Sentry
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return {};

    // Create a deep copy to avoid modifying the original request
    const sanitized = JSON.parse(JSON.stringify(body));

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'passwordConfirmation',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'apiKey',
      'authorization',
      'auth',
    ];

    const redactObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach((key) => {
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          redactObject(obj[key]);
        }
      });
    };

    redactObject(sanitized);
    return sanitized;
  }
}
