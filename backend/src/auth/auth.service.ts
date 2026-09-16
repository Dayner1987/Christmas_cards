import {
  ConflictException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(
    AuthService.name,
  );

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.createAdminFromEnv();
  }

  private async createAdminFromEnv(): Promise<void> {
    const autoCreate =
      this.configService.get<string>(
        'ADMIN_AUTO_CREATE',
      ) === 'true';

    if (!autoCreate) {
      return;
    }

    const username =
      this.configService.get<string>(
        'ADMIN_USERNAME',
      );

    const email =
      this.configService.get<string>('ADMIN_EMAIL');

    const password =
      this.configService.get<string>(
        'ADMIN_PASSWORD',
      );

    const firstName =
      this.configService.get<string>(
        'ADMIN_FIRST_NAME',
      ) ?? 'Administrador';

    if (!username || !email || !password) {
      this.logger.warn(
        'Faltan datos del administrador en el archivo .env',
      );

      return;
    }

    const admin =
      await this.usersService.ensureAdminUser({
        username,
        email,
        password,
        firstName,
      });

    this.logger.log(
      `Administrador listo: ${admin.email} - rol: ${admin.role}`,
    );
  }

  async register(registerDto: RegisterDto) {
    const usernameExists =
      await this.usersService.findByUsername(
        registerDto.username,
      );

    if (usernameExists) {
      throw new ConflictException(
        'El username ya está registrado',
      );
    }

    const emailExists =
      await this.usersService.findByEmail(
        registerDto.email,
      );

    if (emailExists) {
      throw new ConflictException(
        'El email ya está registrado',
      );
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      10,
    );

    const user =
      await this.usersService.createFromAuth({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        
      });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user =
      await this.usersService
        .findByEmailOrUsernameWithPassword(
          loginDto.identifier,
        );

    if (!user) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(
        'Usuario inactivo o suspendido',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    await this.usersService.updateLastLogin(user.id);
    user.lastLoginAt = new Date();

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.usersService.toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findOne(userId);

    return this.usersService.toPublicUser(user);
  }
}