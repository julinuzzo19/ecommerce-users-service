// First import tracing NEEDED FOR INITIALIZATION
import { initializeTracing } from './observability/tracing';
const serviceName = process.env.SERVICE_NAME;
initializeTracing(serviceName);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';
import helmet from 'helmet';
import { LoggerService } from './observability/services/logger.service';
import pinoHttp from 'pino-http';
import { MetricsInterceptor } from 'src/observability/interceptors/metrics.interceptor';
import { AllExceptionsFilter } from 'src/observability/filters/error.filters';
import { MetricsService } from 'src/observability/services/metrics.service';
import type { Server } from 'http';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { createGatewayDetectionMiddleware } from './middlewares/gatewayDetection.middleware';
import { GatewayGuard } from 'src/middlewares/gateway.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs hasta que configuremos nuestro logger
  });

  const logger = app.get(LoggerService);
  const metricsService = app.get(MetricsService);
  const metricsInterceptor = app.get(MetricsInterceptor);
  const exceptionFilter = app.get(AllExceptionsFilter);
  const configService = app.get(ConfigService);
  const gatewayGuard = app.get(GatewayGuard);

  app.useLogger(logger);

  // Global guard (NestJS): corre en el pipeline de Nest, después de los middlewares de Express.
  // Depende de req.isGatewayRequest seteado por gatewayDetectionMiddleware.
  app.useGlobalGuards(gatewayGuard);

  // Interceptors globales (NestJS)
  // Nota: los interceptors NO corren antes que los middlewares de Express.
  // Orden real (alto nivel) para una request HTTP:
  // 1) Express middlewares (en el orden en que se registran con app.use)
  // 2) Nest pipeline: Guards -> Interceptors (before) -> Pipes -> Controller/Handler
  // 3) Nest pipeline unwind: Interceptors (after)
  // 4) Exception filters (si hubo excepción en el pipeline de Nest)
  app.useGlobalInterceptors(metricsInterceptor);

  // Middlewares de Express (orden importa)
  // - requestIdMiddleware debe correr antes de pino-http para que pino-http pueda
  //   usar req.id / x-request-id y correlacionar logs.
  // - gatewayDetectionMiddleware debe correr antes de Guards que dependan de
  //   req.isGatewayRequest (ej: GatewayGuard si se usa a futuro).
  app.use(requestIdMiddleware);
  app.use(
    createGatewayDetectionMiddleware({
      expectedSecret: configService.get<string>('GATEWAY_SECRET'),
    }),
  );

  // log http requests
  app.use(pinoHttp({ logger: (logger as any).logger }));

  // Exception filter global (NestJS)
  // Importante: captura excepciones del pipeline de Nest (guards/interceptors/pipes/controllers)
  // pero NO reemplaza a los error-handlers de Express para fallos dentro de middlewares puros.
  app.useGlobalFilters(exceptionFilter);

  // helmet configuration
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
    origin:
      configService.get<string>('NODE_ENV') === 'production'
        ? configService.get<string>('CLIENT_URL')
        : '*',
    credentials: true,
  });

  // add prefix
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });

  // serve avatar users
  // app.use('/avatars', express.static(join(process.cwd(), 'public', 'avatars')));

  const port = configService.get<number>('PORT') || 3001;

  const host =
    configService.get<string>('NODE_ENV') === 'production'
      ? configService.get<string>('HOST') || '0.0.0.0'
      : '0.0.0.0';

  const server: Server = await app.listen(port, host);

  server.setTimeout(10000); // 10 segundos para requests HTTP

  // Registrar métrica de inicio de aplicación
  metricsService.businessOperationsTotal.inc({
    operation: 'app.started',
    status: 'success',
  });

  logger.info(`Application is running on: ${port}`);
}
bootstrap();
