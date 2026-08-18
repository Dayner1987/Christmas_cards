import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login-auth.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // =====================================================
  // CREAR USUARIO ADMINISTRATIVO AUTOMÁTICAMENTE
  // =====================================================
  //
  // IMPORTANTE:
  // Actualmente la tabla users NO tiene columna "role".
  // Por eso este usuario se crea como un usuario normal.
  //
  // Si más adelante necesitamos un administrador global
  // de la plataforma, debemos diseñar ese permiso
  // explícitamente.
  // =====================================================

  async onApplicationBootstrap() {
    await this.createAdminFromEnv();
  }

  private async createAdminFromEnv() {
    const autoCreate =
      this.configService.get<string>(
        'ADMIN_AUTO_CREATE',
      );

    if (autoCreate !== 'true') {
      return;
    }

    const username =
      this.configService.get<string>(
        'ADMIN_USERNAME',
      );

    const email =
      this.configService.get<string>(
        'ADMIN_EMAIL',
      );

    const password =
      this.configService.get<string>(
        'ADMIN_PASSWORD',
      );

    const firstName =
      this.configService.get<string>(
        'ADMIN_FIRST_NAME',
      ) || 'Administrador';

    if (!username || !email || !password) {
      this.logger.warn(
        'No se creó el usuario administrativo porque faltan ADMIN_USERNAME, ADMIN_EMAIL o ADMIN_PASSWORD en el .env',
      );

      return;
    }

    const existingEmail =
      await this.usersService.findByEmailOrUsername(
        email,
      );

    if (existingEmail) {
      this.logger.log(
        'El usuario administrativo ya existe, no se creó otro.',
      );

      return;
    }

    const existingUsername =
      await this.usersService.findByEmailOrUsername(
        username,
      );

    if (existingUsername) {
      this.logger.warn(
        'No se creó el usuario administrativo porque el ADMIN_USERNAME ya existe.',
      );

      return;
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10,
      );

    await this.usersService.createFromAuth({
      username,
      email,
      passwordHash,
      firstName,
    });

    this.logger.log(
      'Usuario administrativo creado correctamente desde .env',
    );
  }

  // =====================================================
  // REGISTER
  // =====================================================

  async register(registerDto: RegisterDto) {
    const usernameExists =
      await this.usersService.findByEmailOrUsername(
        registerDto.username,
      );

    if (usernameExists) {
      throw new ConflictException(
        'El username ya está registrado',
      );
    }

    const emailExists =
      await this.usersService.findByEmailOrUsername(
        registerDto.email,
      );

    if (emailExists) {
      throw new ConflictException(
        'El email ya está registrado',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        registerDto.password,
        10,
      );

    const user =
      await this.usersService.createFromAuth({
        username:
          registerDto.username,

        email:
          registerDto.email,

        passwordHash,
      });

    return this.buildAuthResponse(user);
  }

  // =====================================================
  // LOGIN
  // =====================================================

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

    const isPasswordValid =
      await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    // Actualizamos último inicio de sesión.
    await this.usersService.updateLastLogin(
      user.id,
    );

    // También actualizamos el objeto para que la
    // respuesta tenga el valor reciente.
    user.lastLoginAt = new Date();

    return this.buildAuthResponse(user);
  }

  // =====================================================
  // CREAR RESPUESTA JWT
  // =====================================================

  private async buildAuthResponse(
    user: User,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      accessToken,

      user:
        this.sanitizeUser(user),
    };
  }

  // =====================================================
  // QUITAR PASSWORD DE LA RESPUESTA
  // =====================================================

  private sanitizeUser(user: User) {
    const {
      passwordHash,
      ...safeUser
    } = user;

    return safeUser;
  }

  // =====================================================
// OBTENER USUARIO AUTENTICADO
// =====================================================

async me(userId: string) {
  return await this.usersService.findOne(
    userId,
  );
}
}