import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';

    // Log de request entrante
    this.logger.log(
      `→ ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`
    );

    // Log de archivos si existen
    if (request.files && Array.isArray(request.files)) {
      const files = request.files as Express.Multer.File[];
      if (files.length > 0) {
        const fileInfo = files.map(f => `${f.originalname} (${f.size} bytes)`).join(', ');
        this.logger.log(`📁 Archivos recibidos: ${fileInfo}`);
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;
          
          // Log de response exitosa
          this.logger.log(
            `← ${method} ${url} ${statusCode} - ${duration}ms`
          );

          // Log adicional para endpoint principal
          if (url.includes('process-claims') && data?.metadata) {
            this.logger.log(
              `📊 Procesamiento: ${data.metadata.processed_files}/${data.metadata.total_expected} archivos en ${data.metadata.processing_time_ms}ms`
            );
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || 500;
          
          // Log de error
          this.logger.error(
            `← ${method} ${url} ${statusCode} - ${duration}ms - Error: ${error.message}`
          );
        },
      }),
    );
  }
} 