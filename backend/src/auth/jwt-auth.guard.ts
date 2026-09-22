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

      request.user = payload;
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