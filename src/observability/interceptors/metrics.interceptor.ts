import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from 'src/observability/services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const start = Date.now();
    const method = request.method;
    const route = request.route?.path || request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const statusCode = response.statusCode.toString();
          const normalizedRoute = this.normalizeRoute(route);

          // Actualizar métricas
          this.metricsService.httpRequestsTotal.inc({
            method,
            route: normalizedRoute,
            status_code: statusCode,
          });

          this.metricsService.httpRequestDuration.observe(
            { method, route: normalizedRoute, status_code: statusCode },
            duration,
          );
        },
        error: (error) => {
          const duration = (Date.now() - start) / 1000;
          const statusCode = error.status?.toString() || '500';
          const normalizedRoute = route.replace(/\/\d+/g, '/:id');

          this.metricsService.httpRequestsTotal.inc({
            method,
            route: normalizedRoute,
            status_code: statusCode,
          });

          this.metricsService.httpRequestDuration.observe(
            { method, route: normalizedRoute, status_code: statusCode },
            duration,
          );
        },
      }),
    );
  }

  private normalizeRoute(route: string): string {
    return route
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ':id',
      )
      .replace(/\/\d+/g, '/:id');
  }
}
