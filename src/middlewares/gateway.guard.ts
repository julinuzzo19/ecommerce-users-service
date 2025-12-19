import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class GatewayGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Si no es HTTP (ej: microservices/ws), no aplicamos este guard.
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest() as Request & {
      isGatewayRequest?: boolean;
    };

    // Endpoints de infra suelen necesitar ser públicos (liveness/readiness/metrics).
    // Si querés que también requieran gateway secret, eliminá este bloque.
    const url = typeof request?.url === 'string' ? request.url : '';
    const method = typeof request?.method === 'string' ? request.method : '';
    if (
      method === 'GET' &&
      (url === '/health' || url.startsWith('/health?') || url === '/metrics')
    ) {
      return true;
    }

    if (!request?.isGatewayRequest) {
      throw new UnauthorizedException('Gateway secret is required');
    }

    return true;
  }
}
