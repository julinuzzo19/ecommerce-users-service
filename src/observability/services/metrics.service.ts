import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly register: client.Registry;

  // Métricas HTTP
  public readonly httpRequestsTotal: client.Counter;
  public readonly httpRequestDuration: client.Histogram;

  // Métricas de negocio (ejemplo)
  public readonly businessOperationsTotal: client.Counter;
  public readonly businessOperationDuration: client.Histogram;

  constructor() {
    this.register = new client.Registry();

    // Métricas por defecto del sistema
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'nodejs_',
    });

    // Métricas HTTP
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total de requests HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duración de requests HTTP',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.businessOperationDuration = new client.Histogram({
      name: 'business_operation_duration_seconds',
      help: 'Duración de operaciones de negocio',
      // requeridos si se agregan aca
      labelNames: ['operation', 'status'],
      // personalizados para consultas e inserciones a db (mas rapidos que peticiones http)
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    });

    // Métricas de negocio personalizadas
    this.businessOperationsTotal = new client.Counter({
      name: 'business_operations_total',
      help: 'Total de operaciones de negocio',
      labelNames: ['operation', 'status'],
      registers: [this.register],
    });
  }

  // Método helper para obtener métricas en formato Prometheus
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper para crear counters custom
  createCounter(name: string, help: string, labelNames: string[] = []) {
    return new client.Counter({
      name,
      help,
      labelNames,
      registers: [this.register],
    });
  }

  // Helper para crear histograms custom
  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ) {
    return new client.Histogram({
      name,
      help,
      labelNames,
      buckets: buckets || [0.001, 0.01, 0.1, 1, 10],
      registers: [this.register],
    });
  }
}
