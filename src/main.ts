// First import tracing NEEDED FOR INITIALIZATION
import { initializeTracing } from './observability/tracing';
const serviceName = process.env.SERVICE_NAME || 'nestjs-service';
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs hasta que configuremos nuestro logger
  });

  const logger = app.get(LoggerService);
  const metricsService = app.get(MetricsService);
  const metricsInterceptor = app.get(MetricsInterceptor);
  const exceptionFilter = app.get(AllExceptionsFilter);

  app.useLogger(logger);

  // global metrics interceptor
  app.useGlobalInterceptors(metricsInterceptor);

  // log http requests
  app.use(pinoHttp({ logger: (logger as any).logger }));

  // global exception filter
  app.useGlobalFilters(exceptionFilter);

  const configService = app.get(ConfigService);

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

  await app.listen(port);

  // Registrar métrica de inicio de aplicación
  metricsService.businessOperationsTotal.inc({
    operation: 'app.started',
    status: 'success',
  });

  logger.info(`Application is running on: ${port}`);
}
bootstrap();
