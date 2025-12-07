import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from 'src/observability/services/metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      service: process.env.SERVICE_NAME ,
      timestamp: new Date().toISOString(),
    };
  }
}
