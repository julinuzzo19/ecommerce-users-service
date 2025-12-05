import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from 'src/health/health.module';

@Module({
  imports: [
    // enable environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'mysql'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'nest_db'),

        // Entities - specify each entity or use glob pattern
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        // synchronize based on environment
        synchronize:
          configService.get<string>('NODE_ENV', 'development') ===
          'development',

        // Logging
        // logging: true,

        // SSL for production
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,

        // Additional configurations
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        cli: {
          migrationsDir: 'src/migrations',
        },
      }),
    }),
    UsersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
