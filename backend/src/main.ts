import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ||
    'http://localhost:5173';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const prefix = configService.get<string>('API_PREFIX')?.replace(/^\/+|\/+$/g, '');
  if (prefix) app.setGlobalPrefix(prefix);

  app.enableCors({
    origin: (configService.get<string>('CORS_ORIGINS') || frontendUrl).split(',').map(v => v.trim()),
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-guest-token',
    ],
    credentials: true,
  });

  const port =
    Number(configService.get<string>('PORT') || configService.get<string>('APP_PORT')) || 3000;

  await app.listen(port);

  console.log(
    `Servidor NestJS corriendo en http://localhost:${port}`,
  );
}

void bootstrap();