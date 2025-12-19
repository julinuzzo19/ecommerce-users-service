import type { RequestHandler } from 'express';

type GatewayDetectionOptions = {
  expectedSecret?: string;
};

export function createGatewayDetectionMiddleware(
  options: GatewayDetectionOptions,
): RequestHandler {
  return (req, _res, next) => {
    const gatewaySecret = req.header('x-gateway-secret');

    req.isGatewayRequest = options.expectedSecret === gatewaySecret;

    next();
  };
}
