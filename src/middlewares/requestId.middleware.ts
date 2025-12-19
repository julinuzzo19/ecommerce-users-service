import type { RequestHandler } from 'express';

/**
 * Genera un ID único por petición y lo propaga vía `x-request-id`.
 *
 * Útil para correlación de logs y para respuestas de error (incluyendo 429).
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const headerValue = req.header('x-request-id');

  const requestId =
    typeof headerValue === 'string' &&
    headerValue.length > 0 &&
    headerValue.length <= 128
      ? headerValue
      : generateRequestId();

  req.requestId = requestId;
  // pino-http uses req.id if present
  (req as any).id = requestId;

  res.setHeader('x-request-id', requestId);
  next();
};
