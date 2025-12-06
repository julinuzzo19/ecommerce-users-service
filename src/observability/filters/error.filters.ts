import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from 'src/observability/services/metrics.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // ⬅️ AÑADIR: Incrementar métrica de errores
    this.metrics.businessOperationsTotal.inc({
      operation: 'http.error',
      status: status.toString(),
    });

    // Log del error con contexto completo
    this.logger.error(
      {
        type: 'unhandled_exception',
        method: request.method,
        url: request.url,
        status,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      'Exception capturada',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        process.env.NODE_ENV === 'development'
          ? message
          : 'Internal server error',
    });
  }
}
