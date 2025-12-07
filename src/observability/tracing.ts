import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

// Usando las constantes correctas del entry-point incubating
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_TELEMETRY_SDK_NAME,
  ATTR_TELEMETRY_SDK_VERSION,
  ATTR_TELEMETRY_SDK_LANGUAGE,
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from '@opentelemetry/semantic-conventions/incubating';

// Configuración del SDK
export function initializeTracing(serviceName: string) {
  const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces';

  const traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
      : {},
  });

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
    [ATTR_SERVICE_INSTANCE_ID]:
      process.env.HOSTNAME || process.env.POD_NAME || `instance-${Date.now()}`,
    [ATTR_TELEMETRY_SDK_NAME]: 'opentelemetry',
    [ATTR_TELEMETRY_SDK_LANGUAGE]: 'nodejs',
    [ATTR_TELEMETRY_SDK_VERSION]: process.env.OTEL_SDK_VERSION || '1.0.0',
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
      }),
    ],
  });
  try {
    sdk.start();
    console.log(`✅ OpenTelemetry iniciado correctamente para ${serviceName}`);
    console.log(`📊 Exportando traces a: ${otlpEndpoint}`);
  } catch (error) {
    console.error('❌ Error iniciando OpenTelemetry:', error);
    console.warn('⚠️  La aplicación continuará sin tracing');
  }

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(
        () => console.log('OpenTelemetry cerrado correctamente'),
        (err) => console.error('Error cerrando OpenTelemetry', err),
      )
      .finally(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    sdk
      .shutdown()
      .then(
        () => console.log('OpenTelemetry cerrado correctamente'),
        (err) => console.error('Error cerrando OpenTelemetry', err),
      )
      .finally(() => process.exit(0));
  });

  return sdk;
}
