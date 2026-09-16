import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import {
  User,
  UserRole,
} from './entities/user.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    await this.validateUniqueFields(
      userData.email,
      userData.username,
      userData.phone,
    );

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
      role: UserRole.CLIENT,
      status: 'active',
    });

    const savedUser =
      await this.usersRepository.save(user);

    return this.toPublicUser(savedUser);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user || user.status === 'deleted') {
      throw new NotFoundException(
        `Usuario con ID ${id} no encontrado`,
      );
    }

    return user;
  }

  async findByEmailOrUsername(
    value: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:value)', {
        value,
      })
      .orWhere(
        'LOWER(user.username) = LOWER(:value)',
        { value },
      )
      .getOne();
  }

  async findByEmailOrUsernameWithPassword(
    value: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:value)', {
        value,
      })
      .orWhere(
        'LOWER(user.username) = LOWER(:value)',
        { value },
      )
      .getOne();
  }

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', {
        email,
      })
      .getOne();
  }

  async findByUsername(
    username: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.username) = LOWER(:username)',
        { username },
      )
      .getOne();
  }

  async createFromAuth(data: {
    username: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      role: UserRole.CLIENT,
      status: 'active',
    });

    return this.usersRepository.save(user);
  }

  async ensureAdminUser(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
  }): Promise<User> {
    let admin = await this.findByEmail(data.email);

    if (admin) {
      admin.role = UserRole.ADMIN;
      admin.status = 'active';

      return this.usersRepository.save(admin);
    }

    const usernameExists = await this.findByUsername(
      data.username,
    );

    if (usernameExists) {
      usernameExists.role = UserRole.ADMIN;
      usernameExists.status = 'active';

      return this.usersRepository.save(usernameExists);
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      10,
    );

    admin = this.usersRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
      firstName: data.firstName ?? null,
      role: UserRole.ADMIN,
      status: 'active',
    });

    return this.usersRepository.save(admin);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.findOne(id);

    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      const existingEmail = await this.findByEmail(
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
          where: { phone: updateUserDto.phone },
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

    const { password, ...updateData } = updateUserDto;

    Object.assign(user, updateData);

    if (password) {
      user.passwordHash = await bcrypt.hash(
        password,
        10,
      );
    }

    const updatedUser =
      await this.usersRepository.save(user);

    return this.toPublicUser(updatedUser);
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    user.status = 'deleted';
    await this.usersRepository.save(user);

    return {
      message: 'Usuario eliminado correctamente',
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(
      { id },
      { lastLoginAt: new Date() },
    );
  }

  private async validateUniqueFields(
    email: string,
    username: string,
    phone?: string,
  ): Promise<void> {
    if (await this.findByEmail(email)) {
      throw new ConflictException(
        'El correo electrónico ya está registrado',
      );
    }

    if (await this.findByUsername(username)) {
      throw new ConflictException(
        'El nombre de usuario ya está registrado',
      );
    }

    if (phone) {
      const existingPhone =
        await this.usersRepository.findOne({
          where: { phone },
        });

      if (existingPhone) {
        throw new ConflictException(
          'El número de teléfono ya está registrado',
        );
      }
    }
  }

  public toPublicUser(user: User) {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}