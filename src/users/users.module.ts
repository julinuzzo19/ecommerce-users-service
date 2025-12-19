import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservabilityModule } from 'src/observability/observability.module';
import { User } from 'src/users/user.entity';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';

@Module({
  /*
   * imports: Otros módulos que este módulo necesita.
   *
   * TypeOrmModule.forFeature([User]) registra la entidad User
   * con TypeORM y hace que el Repository<User> esté disponible
   * para inyección en este módulo.
   */
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User]),
    ObservabilityModule,
  ],

  /**
   * 1. Registra sus rutas en el sistema de routing
   * 2. Inyecta las dependencias que necesita (UsersService en este caso)
   */

  controllers: [UsersController],

  /**
   * providers: Los servicios y otros providers que este módulo provee.
   *
   * Al poner UsersService acá, le decimos a NestJS:
   * "Creá una instancia de UsersService y hacela disponible para
   * inyección en cualquier clase dentro de este módulo".
   *
   * NestJS usa un patrón Singleton por defecto: una sola instancia
   * de UsersService se crea y se reutiliza en toda la app.
   */
  providers: [UsersService],

  /**
   * exports: Qué providers querés hacer disponibles para otros módulos.
   *
   * Si otro módulo importa UsersModule, podrá inyectar UsersService.
   * Si no exportás nada, UsersService solo está disponible internamente.
   *
   * Ejemplo: Si tenés un NotificationsModule que necesita crear tareas
   * automáticamente, ese módulo importaría UsersModule y podría usar UsersService.
   *
   * Ejemplo: TypeOrmModule, // Exportamos TypeOrmModule para que otros puedan usar Repository<User>
   */
  exports: [],
})
export class UsersModule {}
