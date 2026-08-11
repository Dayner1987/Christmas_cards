import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // =====================================================
  // CREAR USUARIO
  // =====================================================

  async create(createUserDto: CreateUserDto) {
    const {
      password,
      ...userData
    } = createUserDto;

    const password_hash = await bcrypt.hash(
      password,
      10,
    );

    const user = this.usersRepository.create({
      ...userData,
      password_hash,
    });

    return await this.usersRepository.save(user);
  }

  // =====================================================
  // LISTAR USUARIOS
  // =====================================================

  async findAll() {
    return await this.usersRepository.find();
  }

  // =====================================================
  // BUSCAR USUARIO POR UUID
  // =====================================================

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id_users: id,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con ID ${id} no encontrado`,
      );
    }

    return user;
  }

  // =====================================================
  // BUSCAR POR EMAIL O USERNAME
  // =====================================================

  async findByEmailOrUsername(value: string) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :value', { value })
      .orWhere('user.username = :value', { value })
      .getOne();
  }

  // =====================================================
  // BUSCAR POR EMAIL O USERNAME + PASSWORD
  // =====================================================

  async findByEmailOrUsernameWithPassword(
    value: string,
  ) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :value', { value })
      .orWhere('user.username = :value', { value })
      .getOne();
  }

  // =====================================================
  // CREAR USUARIO DESDE AUTH
  // =====================================================

  async createFromAuth(data: Partial<User>) {
    const user = this.usersRepository.create(data);

    return await this.usersRepository.save(user);
  }

  // =====================================================
  // ACTUALIZAR USUARIO
  // =====================================================

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.findOne(id);

    const updateData: Record<string, any> = {
      ...updateUserDto,
    };

    // Si se cambia la contraseña,
    // se vuelve a generar el hash.
    if (updateData.password) {
      updateData.password_hash =
        await bcrypt.hash(
          updateData.password,
          10,
        );

      delete updateData.password;
    }

    Object.assign(user, updateData);

    return await this.usersRepository.save(user);
  }

  // =====================================================
  // ELIMINAR USUARIO
  // =====================================================

  async remove(id: string) {
    const user = await this.findOne(id);

    await this.usersRepository.remove(user);

    return {
      message: 'Usuario eliminado correctamente',
    };
  }
}