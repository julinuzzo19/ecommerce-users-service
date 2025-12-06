import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { MetricsService } from 'src/observability/services/metrics.service';
import { AllExceptionsFilter } from 'src/observability/filters/error.filters';
import { MetricsInterceptor } from 'src/observability/interceptors/metrics.interceptor';

@Global() // Hace que este módulo esté disponible globalmente
@Module({
  providers: [
    LoggerService,
    MetricsService,
    AllExceptionsFilter,
    MetricsInterceptor,
  ],
  exports: [
    LoggerService,
    MetricsService,
    AllExceptionsFilter,
    MetricsInterceptor,
  ], // Exportar para uso en otros módulos
})
export class ObservabilityModule {}
