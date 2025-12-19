# Microservicio de Usuarios

Este microservicio es responsable de almacenar y gestionar la información personal de los usuarios del sistema de e-commerce.

## Características

- Gestión de información personal de usuarios (nombre, email, dirección, teléfono, etc.)
- API REST para operaciones CRUD sobre usuarios
- Integración con el microservicio de autenticación

## Base de Datos

Este microservicio utiliza la misma base de datos que el microservicio de autenticación, pero mantiene la información en tablas separadas:

- **Tabla de usuarios**: Almacena la información personal (perfil, datos de contacto, preferencias)
- **Tabla de credenciales**: Gestionada por el microservicio de autenticación (username, password hash, tokens)

Esta arquitectura permite:

- Separación de responsabilidades entre autenticación y gestión de perfiles
- Compartir la misma base de datos para mantener consistencia
- Escalabilidad independiente de cada microservicio

## Tecnologías

- NestJS
- TypeScript
- TypeORM

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
