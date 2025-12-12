import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import { getCurrentTraceId } from 'src/observability/span.helper';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      base: {
        service: process.env.SERVICE_NAME,
        environment: process.env.NODE_ENV || 'development',
      },
      // Mixin para agregar trace_id automáticamente
      mixin() {
        const traceId = getCurrentTraceId();
        return traceId ? { trace_id: traceId } : {};
      },
      transport:
        process.env.NODE_ENV === 'development' &&
        process.env.IN_DOCKER !== 'true'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });
  }

  // Métodos requeridos por NestJS LoggerService
  log(message: any, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: any, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: any, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: any, context?: string) {
    this.logger.trace({ context }, message);
  }

  // Métodos adicionales para uso avanzado
  info(message: string, meta?: Record<string, any>) {
    this.logger.info(meta, message);
  }

  child(bindings: Record<string, any>) {
    return this.logger.child(bindings);
  }
}
