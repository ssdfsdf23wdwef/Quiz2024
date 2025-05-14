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

/**
 * Tüm HTTP istisnaları için özel filter
 * Daha zengin hata mesajları ve loglama sağlar
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
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

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Hata detaylarını al
    let errorResponse: any = exception.getResponse
      ? exception.getResponse()
      : { message: exception.message };
    const errorMessage =
      typeof errorResponse === 'string'
        ? errorResponse
        : errorResponse.message || exception.message;

    // İstek bilgilerini topla
    const requestInfo = {
      path: request.url,
      method: request.method,
      ip: request.ip,
      headers: this.sanitizeHeaders(request.headers),
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
      timestamp: new Date().toISOString(),
    };

    // Hata yanıtı oluştur
    const responseBody = {
      statusCode: status,
      message: status >= 500 ? 'Internal server error' : errorMessage, // 500'ler için genel mesaj ver
      path: request.url,
      timestamp: new Date().toISOString(),
      traceId:
        request.headers['x-trace-id'] ||
        `trace-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      errorDetails: Array.isArray(errorResponse.message)
        ? errorResponse.message
        : undefined,
    };

    // Hata seviyesine göre doğru log metodunu seç
    const logMethod =
      status >= 500
        ? this.logger.error.bind(this.logger)
        : this.logger.warn.bind(this.logger);

    // Detaylı log
    logMethod(
      `HTTP Hata [${status}]: ${errorMessage}`,
      `HttpExceptionFilter.catch`,
      __filename,
      undefined, // satır numarası
      {
        exception: {
          name: exception.name,
          message: exception.message,
          status,
        },
        request: requestInfo,
        response: responseBody,
        stack: exception.stack,
      },
    );

    // Geliştirme ortamında stack trace ekle
    if (process.env.NODE_ENV !== 'production' && status >= 500) {
      responseBody['stack'] = exception.stack
        ?.split('\n')
        .map((line) => line.trim());
    }

    // Yanıtı gönder
    response.status(status).json(responseBody);

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
        this.logger.warn(
          'Sentry entegrasyonu yapılandırılmamış',
          'HttpExceptionFilter.catch',
          __filename,
        );
      }
    }

    // Akış takibine ekle
    this.flowTracker.track(
      `🔴 HTTP ${status} yanıtı gönderiliyor: ${request.method} ${request.url}`,
      'HttpExceptionFilter',
    );
  }

  /**
   * İstek header'larını temizler, hassas bilgileri maskeler
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Hassas header'ları maskele
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * İstek gövdesini temizler, hassas bilgileri maskeler
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };

    // Hassas alanları maskele
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'credit_card',
    ];

    const maskSensitiveFields = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      Object.keys(obj).forEach((key) => {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = maskSensitiveFields(obj[key]);
        }
      });

      return obj;
    };

    return maskSensitiveFields(sanitized);
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
