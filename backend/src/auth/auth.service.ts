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
  // CREAR ADMINISTRADOR AUTOMÁTICAMENTE
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
        'No se creó el admin porque faltan ADMIN_USERNAME, ADMIN_EMAIL o ADMIN_PASSWORD en el .env',
      );

      return;
    }

    const existingAdmin =
      await this.usersService.findByEmailOrUsername(
        email,
      );

    if (existingAdmin) {
      this.logger.log(
        'El usuario admin ya existe, no se creó otro.',
      );

      return;
    }

    const existingUsername =
      await this.usersService.findByEmailOrUsername(
        username,
      );

    if (existingUsername) {
      this.logger.warn(
        'No se creó el admin porque el ADMIN_USERNAME ya existe.',
      );

      return;
    }

    const password_hash =
      await bcrypt.hash(password, 10);

    await this.usersService.createFromAuth({
      username,
      email,
      password_hash,

      first_name: firstName,

      role: 'ADMIN',
      status: 'active',
    });

    this.logger.log(
      'Usuario admin creado correctamente desde .env',
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

    const password_hash =
      await bcrypt.hash(
        registerDto.password,
        10,
      );

    const user =
      await this.usersService.createFromAuth({
        username: registerDto.username,
        email: registerDto.email,
        password_hash,

      
        role: 'CLIENT',
        status: 'active',
      });

    return this.buildAuthResponse(user);
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async login(loginDto: LoginDto) {
    const user =
      await this.usersService.findByEmailOrUsernameWithPassword(
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
        user.password_hash,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    return this.buildAuthResponse(user);
  }

  // =====================================================
  // CREAR RESPUESTA JWT
  // =====================================================

  private async buildAuthResponse(user: User) {
    const payload = {
      sub: user.id_users,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const access_token =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      access_token,
      user: this.sanitizeUser(user),
    };
  }

  // =====================================================
  // QUITAR PASSWORD DE LA RESPUESTA
  // =====================================================

  private sanitizeUser(user: User) {
    const {
      password_hash,
      ...safeUser
    } = user;

    return safeUser;
  }
}