//typeorm/config/ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbSsl = configService.get<string>('DB_SSL') === 'true';

  return {
    type: 'postgres',

    host: configService.getOrThrow<string>('DB_HOST'),
    port: Number(configService.get<string>('DB_PORT') || 5432),

    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),

    autoLoadEntities: true,

    // Desarrollo: las columnas nuevas se crean al iniciar NestJS.
    // Una configuración explícita sigue teniendo prioridad.
    synchronize: configService.get<string>('DB_SYNCHRONIZE') !== undefined
      ? configService.get<string>('DB_SYNCHRONIZE') === 'true'
      : configService.get<string>('NODE_ENV') !== 'production',

    ssl: dbSsl
      ? {
          rejectUnauthorized: false,
        }
      : false,
  };
};