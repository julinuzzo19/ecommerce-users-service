import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from 'src/health/health.module';
import { ObservabilityModule } from 'src/observability/observability.module';
import { MetricsController } from 'src/observability/metrics.controller';

@Module({
  imports: [
    ObservabilityModule,
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
  controllers: [MetricsController],
  providers: [],
})
export class AppModule {}
