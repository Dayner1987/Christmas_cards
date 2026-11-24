import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
//src/auth/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DataSource,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const token =
      this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token no enviado',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync(
          token,
        );

      const user = await this.db.getRepository(User).createQueryBuilder('u')
        .addSelect('u.passwordChangedAt').where('u.id = :id', { id: payload.sub }).getOne();
      if (!user || user.status !== 'active' || (payload.pwd ?? 0) !== (user.passwordChangedAt?.getTime() ?? 0)) {
        throw new UnauthorizedException('Inicia sesión nuevamente.');
      }
      request.user = { ...payload, role: user.role };
    } catch {
      throw new UnauthorizedException(
        'Token inválido o expirado',
      );
    }

    return true;
  }

  private extractTokenFromHeader(
    request: any,
  ): string | undefined {
    const authorization =
      request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [
      type,
      token,
    ] = authorization.split(' ');

    return type === 'Bearer'
      ? token
      : undefined;
  }
}