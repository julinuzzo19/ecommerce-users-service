import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GatewayGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const gatewaySecret = request.headers['x-gateway-secret'];

    if (!gatewaySecret) {
      throw new UnauthorizedException('Gateway secret is required');
    }

    const expectedSecret = this.configService.get<string>('GATEWAY_SECRET');

    if (gatewaySecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid gateway secret');
    }

    return true;
  }
}
