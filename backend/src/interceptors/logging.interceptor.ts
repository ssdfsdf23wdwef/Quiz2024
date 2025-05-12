import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';

/**
 * HTTP istekleri ve yanıtları için loglama interceptor'ı
 * Bu interceptor, gelen HTTP isteklerini ve giden yanıtları otomatik olarak loglar
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query, headers } = request;
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const contextName = `${controllerName}.${handlerName}`;

    // İstek gövdesinden hassas verileri temizle
    const sanitizedBody = this.sanitizeSensitiveData(body);
    const sanitizedHeaders = this.sanitizeSensitiveData(headers);

    // İstek başlangıcını izle
    this.flowTracker.trackApiRequest(method, url, contextName);

    // İstek detaylarını logla (sadece debug amaçlı)
    this.logger.debug(
      `Gelen istek: ${method} ${url}`,
      contextName,
      __filename,
      undefined,
      {
        params,
        query,
        body: sanitizedBody,
        headers: sanitizedHeaders,
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;

          // Yanıt tamamlandı, akış takibine ekle
          this.flowTracker.trackApiResponse(
            method,
            url,
            200, // Başarılı yanıt
            responseTime,
            contextName,
          );

          // Yanıt detaylarını logla (sadece debug amaçlı)
          this.logger.debug(
            `Başarılı yanıt: ${method} ${url}`,
            contextName,
            __filename,
            undefined,
            {
              responseTime,
              // Çok büyük yanıtları loglamaktan kaçın
              responseSize: data ? JSON.stringify(data).length : 0,
            },
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          // Hata oluştu, akış takibine ekle
          this.flowTracker.trackApiResponse(
            method,
            url,
            error.status || 500,
            responseTime,
            contextName,
          );

          // Hatayı logla
          this.logger.logError(error, contextName, {
            method,
            url,
            params,
            query,
            body: sanitizedBody,
            responseTime,
          });
        },
      }),
    );
  }

  /**
   * Hassas verileri temizler
   * @param data Temizlenecek veri
   * @returns Temizlenmiş veri
   */
  private sanitizeSensitiveData(data: any): any {
    if (!data) {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'token',
      'authorization',
      'secret',
      'key',
      'apiKey',
      'refreshToken',
      'accessToken',
    ];

    if (typeof data === 'object' && !Array.isArray(data)) {
      const sanitized = { ...data };

      for (const key of Object.keys(sanitized)) {
        if (
          sensitiveKeys.some((sk) =>
            key.toLowerCase().includes(sk.toLowerCase()),
          )
        ) {
          sanitized[key] = '***gizli***';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
        }
      }

      return sanitized;
    }

    return data;
  }
}
