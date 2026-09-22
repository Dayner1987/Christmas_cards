import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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

import {
  CloudinaryService,
} from '../cloudinary/cloudinary.service';

import {
  IMAGE_FOLDERS,
} from '../cloudinary/cloudinary.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(
    UsersService.name,
  );

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.avatarUrl !== undefined) {
      throw new BadRequestException(
        'La fotografía se carga mediante la ruta de avatar.',
      );
    }

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
      role: UserRole.CLIENT,
      status: 'active',
      avatarUrl: null,
      avatarPublicId: null,
    });

    const savedUser = await this.saveUser(user);

    return this.toPublicUser(savedUser);
  }

  async findAll() {
    const users = await this.usersRepository.find({
      where: {
        status: 'active',
      },

      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) =>
      this.toPublicUser(user),
    );
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

  async assertAccess(
    actorId: string,
    targetId?: string,
    adminOnly = false,
  ): Promise<User> {
    const actor = await this.findOne(actorId);

    if (actor.status !== 'active') {
      throw new ForbiddenException(
        'Tu cuenta no está activa.',
      );
    }

    const isAdmin = actor.role === UserRole.ADMIN;

    if (adminOnly && !isAdmin) {
      throw new ForbiddenException(
        'Esta operación requiere permisos de administrador.',
      );
    }

    if (
      targetId &&
      targetId !== actor.id &&
      !isAdmin
    ) {
      throw new ForbiddenException(
        'No tienes permiso para modificar o consultar este usuario.',
      );
    }

    return actor;
  }

  async findByEmailOrUsername(
    value: string,
  ): Promise<User | null> {
    return this.usersRepository
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

  async findByEmailOrUsernameWithPassword(
    value: string,
  ): Promise<User | null> {
    return this.usersRepository
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

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.email) = LOWER(:email)',
        { email },
      )
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

    return this.saveUser(user);
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

      return this.saveUser(admin);
    }

    const usernameExists = await this.findByUsername(
      data.username,
    );

    if (usernameExists) {
      usernameExists.role = UserRole.ADMIN;
      usernameExists.status = 'active';

      return this.saveUser(usernameExists);
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

    return this.saveUser(admin);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    // La imagen se administra exclusivamente mediante
    // las rutas de avatar.
    if (updateUserDto.avatarUrl !== undefined) {
      throw new BadRequestException(
        'Usa la ruta de avatar para cambiar o quitar la fotografía.',
      );
    }

    const user = await this.findOne(id);

    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      const existingEmail = await this.findByEmail(
        updateUserDto.email,
      );

      if (existingEmail && existingEmail.id !== id) {
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

      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictException(
          'El número de teléfono ya está registrado',
        );
      }
    }

    // Lista explícita: no permite modificar rol,
    // estado ni identificadores de Cloudinary.
    const changes: Partial<User> = {};

    if (updateUserDto.username !== undefined) {
      changes.username = updateUserDto.username;
    }

    if (updateUserDto.email !== undefined) {
      changes.email = updateUserDto.email;

      if (
        updateUserDto.email.toLowerCase() !==
        user.email.toLowerCase()
      ) {
        changes.emailVerifiedAt = null;
      }
    }

    if (updateUserDto.firstName !== undefined) {
      changes.firstName =
        updateUserDto.firstName?.trim() || null;
    }

    if (updateUserDto.lastName !== undefined) {
      changes.lastName =
        updateUserDto.lastName?.trim() || null;
    }

    if (updateUserDto.phone !== undefined) {
      changes.phone =
        updateUserDto.phone?.trim() || null;
    }

    if (updateUserDto.biography !== undefined) {
      changes.biography =
        updateUserDto.biography?.trim() || null;
    }

    if (updateUserDto.birthDate !== undefined) {
      changes.birthDate =
        updateUserDto.birthDate || null;
    }

    if (updateUserDto.timezone !== undefined) {
      changes.timezone = updateUserDto.timezone;
    }

    if (updateUserDto.languageCode !== undefined) {
      changes.languageCode =
        updateUserDto.languageCode;
    }

    if (updateUserDto.password) {
      changes.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
    }

    try {
      const updatedUser =
        await this.usersRepository.manager.transaction(
          async (manager) => {
            const repository =
              manager.getRepository(User);

            const current = await repository.findOne({
              where: { id },
              lock: {
                mode: 'pessimistic_write',
              },
            });

            if (
              !current ||
              current.status === 'deleted'
            ) {
              throw new NotFoundException(
                'Usuario no encontrado.',
              );
            }

            Object.assign(current, changes);

            return repository.save(current);
          },
        );

      return this.toPublicUser(updatedUser);
    } catch (error) {
      this.rethrowDatabaseError(error);
    }
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File | undefined,
  ) {
    await this.findOne(id);

    const uploaded =
      await this.cloudinaryService.uploadImage(
        file,
        IMAGE_FOLDERS.USERS,
      );

    let previousPublicId: string | null = null;
    let updatedUser: User;

    try {
      updatedUser =
        await this.usersRepository.manager.transaction(
          async (manager) => {
            const repository =
              manager.getRepository(User);

            const user = await repository.findOne({
              where: { id },
              lock: {
                mode: 'pessimistic_write',
              },
            });

            if (
              !user ||
              user.status !== 'active'
            ) {
              throw new ForbiddenException(
                'El usuario no está disponible para actualizar su foto.',
              );
            }

            previousPublicId =
              user.avatarPublicId ?? null;

            user.avatarUrl = uploaded.url;
            user.avatarPublicId = uploaded.publicId;

            return repository.save(user);
          },
        );
    } catch (error) {
      // La BD no guardó la nueva foto:
      // intentamos retirar el archivo recién subido.
      await this.cleanupImage(uploaded.publicId);

      throw error;
    }

    // El cambio ya está confirmado en la BD.
    await this.cleanupImage(previousPublicId);

    return this.toPublicUser(updatedUser);
  }

  async removeAvatar(id: string) {
    let previousPublicId: string | null = null;

    const updatedUser =
      await this.usersRepository.manager.transaction(
        async (manager) => {
          const repository =
            manager.getRepository(User);

          const user = await repository.findOne({
            where: { id },
            lock: {
              mode: 'pessimistic_write',
            },
          });

          if (
            !user ||
            user.status !== 'active'
          ) {
            throw new ForbiddenException(
              'El usuario no está disponible para actualizar su foto.',
            );
          }

          previousPublicId =
            user.avatarPublicId ?? null;

          user.avatarUrl = null;
          user.avatarPublicId = null;

          return repository.save(user);
        },
      );

    await this.cleanupImage(previousPublicId);

    return this.toPublicUser(updatedUser);
  }

  async remove(id: string) {
    let previousPublicId: string | null = null;

    await this.usersRepository.manager.transaction(
      async (manager) => {
        const repository = manager.getRepository(User);

        const user = await repository.findOne({
          where: { id },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!user || user.status === 'deleted') {
          throw new NotFoundException(
            `Usuario con ID ${id} no encontrado`,
          );
        }

        previousPublicId =
          user.avatarPublicId ?? null;

        user.status = 'deleted';
        user.avatarUrl = null;
        user.avatarPublicId = null;

        await repository.save(user);
      },
    );

    await this.cleanupImage(previousPublicId);

    return {
      message: 'Usuario eliminado correctamente',
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(
      { id },
      {
        lastLoginAt: new Date(),
      },
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

  private async saveUser(user: User): Promise<User> {
    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      this.rethrowDatabaseError(error);
    }
  }

  private rethrowDatabaseError(error: unknown): never {
    const databaseError = error as {
      code?: string;
      driverError?: {
        code?: string;
      };
    };

    const code =
      databaseError?.driverError?.code ??
      databaseError?.code;

    if (code === '23505') {
      throw new ConflictException(
        'El correo, nombre de usuario o teléfono ya está registrado.',
      );
    }

    throw error;
  }

  private async cleanupImage(
    publicId: string | null,
  ): Promise<void> {
    if (!publicId) return;

    try {
      await this.cloudinaryService.deleteImage(publicId);
    } catch {
      // No convertimos una actualización exitosa del
      // perfil en un error por la limpieza del archivo.
      this.logger.warn(
        `No se pudo limpiar la imagen ${publicId}. Requiere reintento.`,
      );
    }
  }

  public toPublicUser(user: User) {
    const {
      passwordHash: _passwordHash,
      avatarPublicId: _avatarPublicId,
      ...publicUser
    } = user;

    return publicUser;
  }
}