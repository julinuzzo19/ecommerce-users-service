import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.setGlobalPrefix('api/v1');

  // log http requests
  app.use(morgan('dev'));

  // serve avatar users
  app.use('/avatars', express.static(join(process.cwd(), 'public', 'avatars')));

  await app.listen(configService.get<number>('PORT') || 3001);
}
bootstrap();
