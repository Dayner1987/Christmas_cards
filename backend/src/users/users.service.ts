import {
  ConflictException,
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

    await this.validateUniqueFields(
      userData.email,
      userData.username,
      userData.phone,
    );

    const passwordHash = await bcrypt.hash(
      password,
      10,
    );

    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
    });

    const savedUser =
      await this.usersRepository.save(user);

    return this.toPublicUser(savedUser);
  }

  // =====================================================
  // LISTAR USUARIOS
  // =====================================================

  async findAll() {
    return await this.usersRepository.find({
      where: {
        status: 'active',
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // BUSCAR USUARIO POR UUID
  // =====================================================

  async findOne(id: string) {
    const user =
      await this.usersRepository.findOne({
        where: {
          id,
        },
      });

    if (!user || user.status === 'deleted') {
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
      .where(
        'LOWER(user.email) = LOWER(:value)',
        { value },
      )
      .orWhere(
        'LOWER(user.username) = LOWER(:value)',
        { value },
      )
      .getOne();
  }

  // =====================================================
  // BUSCAR POR EMAIL O USERNAME + PASSWORD HASH
  // SE UTILIZA PRINCIPALMENTE DESDE AUTH
  // =====================================================

  async findByEmailOrUsernameWithPassword(
    value: string,
  ) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where(
        'LOWER(user.email) = LOWER(:value)',
        { value },
      )
      .orWhere(
        'LOWER(user.username) = LOWER(:value)',
        { value },
      )
      .getOne();
  }

  // =====================================================
  // BUSCAR POR EMAIL
  // =====================================================

  async findByEmail(email: string) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.email) = LOWER(:email)',
        { email },
      )
      .getOne();
  }

  // =====================================================
  // BUSCAR POR USERNAME
  // =====================================================

  async findByUsername(username: string) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.username) = LOWER(:username)',
        { username },
      )
      .getOne();
  }

  // =====================================================
  // CREAR USUARIO DESDE AUTH
  // =====================================================

 async createFromAuth(data: {
  username: string;
  email: string;
  passwordHash: string;

  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<User> {
  const user =
    this.usersRepository.create({
      ...data,
      status: 'active',
    });

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

    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      const existingEmail =
        await this.findByEmail(
          updateUserDto.email,
        );

      if (
        existingEmail &&
        existingEmail.id !== id
      ) {
        throw new ConflictException(
          'El correo electrónico ya está registrado',
        );
      }
    }

    if (
      updateUserDto.username &&
      updateUserDto.username !== user.username
    ) {
      const existingUsername =
        await this.findByUsername(
          updateUserDto.username,
        );

      if (
        existingUsername &&
        existingUsername.id !== id
      ) {
        throw new ConflictException(
          'El nombre de usuario ya está registrado',
        );
      }
    }

    if (
      updateUserDto.phone &&
      updateUserDto.phone !== user.phone
    ) {
      const existingPhone =
        await this.usersRepository.findOne({
          where: {
            phone: updateUserDto.phone,
          },
        });

      if (
        existingPhone &&
        existingPhone.id !== id
      ) {
        throw new ConflictException(
          'El número de teléfono ya está registrado',
        );
      }
    }

    const {
      password,
      ...updateData
    } = updateUserDto;

    Object.assign(
      user,
      updateData,
    );

    if (password) {
      user.passwordHash =
        await bcrypt.hash(
          password,
          10,
        );
    }

    const updatedUser =
      await this.usersRepository.save(user);

    return this.toPublicUser(updatedUser);
  }

  // =====================================================
  // ELIMINAR USUARIO
  // BORRADO LÓGICO
  // =====================================================

  async remove(id: string) {
    const user = await this.findOne(id);

    user.status = 'deleted';

    await this.usersRepository.save(user);

    return {
      message:
        'Usuario eliminado correctamente',
    };
  }

  // =====================================================
  // ACTUALIZAR ÚLTIMO LOGIN
  // =====================================================

  async updateLastLogin(id: string) {
    await this.usersRepository.update(
      {
        id,
      },
      {
        lastLoginAt: new Date(),
      },
    );
  }

  // =====================================================
  // VALIDAR DATOS ÚNICOS
  // =====================================================

  private async validateUniqueFields(
    email: string,
    username: string,
    phone?: string,
  ) {
    const existingEmail =
      await this.findByEmail(email);

    if (existingEmail) {
      throw new ConflictException(
        'El correo electrónico ya está registrado',
      );
    }

    const existingUsername =
      await this.findByUsername(username);

    if (existingUsername) {
      throw new ConflictException(
        'El nombre de usuario ya está registrado',
      );
    }

    if (phone) {
      const existingPhone =
        await this.usersRepository.findOne({
          where: {
            phone,
          },
        });

      if (existingPhone) {
        throw new ConflictException(
          'El número de teléfono ya está registrado',
        );
      }
    }
  }

  // =====================================================
  // ELIMINAR INFORMACIÓN PRIVADA DE LA RESPUESTA
  // =====================================================

  private toPublicUser(user: User) {
    const {
      passwordHash,
      ...publicUser
    } = user;

    return publicUser;
  }
}