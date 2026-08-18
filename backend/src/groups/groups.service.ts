import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import {
  Not,
  Repository,
} from 'typeorm';

import { randomUUID } from 'crypto';

import {
  Group,
  GroupStatus,
} from './entities/group.entity';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

import { UsersService } from '../users/users.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    private readonly usersService: UsersService,

    private readonly configService: ConfigService,
  ) {}

  // =====================================================
  // CREAR GRUPO
  // El ownerId viene del JWT, no del frontend.
  // =====================================================

  async create(
    ownerId: string,
    createGroupDto: CreateGroupDto,
  ) {
    const {
      invitationExpiresAt,
      ...groupData
    } = createGroupDto;

    // Verificar que el usuario autenticado exista.
    await this.usersService.findOne(ownerId);

    // Generar código único de invitación.
    const invitationCode =
      randomUUID().replace(/-/g, '');

    const frontendUrl =
      this.configService.get<string>(
        'FRONTEND_URL',
      ) || 'http://localhost:3001';

    const invitationUrl =
      `${frontendUrl}/groups/join/${invitationCode}`;

    const group =
      this.groupsRepository.create({
        ...groupData,

        ownerId,

        invitationCode,
        invitationUrl,

        invitationExpiresAt:
          invitationExpiresAt
            ? new Date(invitationExpiresAt)
            : null,
      });

    return await this.groupsRepository.save(
      group,
    );
  }

  // =====================================================
  // LISTAR GRUPOS
  // No devuelve grupos eliminados.
  // =====================================================

  async findAll() {
    return await this.groupsRepository.find({
      where: {
        status: Not(GroupStatus.DELETED),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // BUSCAR GRUPO POR UUID
  // =====================================================

  async findOne(id: string) {
    const group =
      await this.groupsRepository.findOne({
        where: {
          id,
        },
      });

    if (
      !group ||
      group.status === GroupStatus.DELETED
    ) {
      throw new NotFoundException(
        `Grupo con ID ${id} no encontrado`,
      );
    }

    return group;
  }

  // =====================================================
  // LISTAR GRUPOS CREADOS POR UN USUARIO
  // El ownerId normalmente vendrá del JWT.
  // =====================================================

  async findByOwner(ownerId: string) {
    return await this.groupsRepository.find({
      where: {
        ownerId,
        status: Not(GroupStatus.DELETED),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // BUSCAR GRUPO POR CÓDIGO DE INVITACIÓN
  // =====================================================

  async findByInvitationCode(
    invitationCode: string,
  ) {
    const group =
      await this.groupsRepository.findOne({
        where: {
          invitationCode,
          status: GroupStatus.ACTIVE,
        },
      });

    if (!group) {
      throw new NotFoundException(
        'Invitación no encontrada',
      );
    }

    // Si la invitación fue deshabilitada,
    // no permitimos utilizarla.
    if (!group.invitationEnabled) {
      throw new NotFoundException(
        'La invitación ya no está disponible',
      );
    }

    // Si tiene fecha de expiración,
    // comprobamos que siga vigente.
    if (
      group.invitationExpiresAt &&
      group.invitationExpiresAt < new Date()
    ) {
      throw new NotFoundException(
        'La invitación ha expirado',
      );
    }

    return group;
  }

  // =====================================================
  // ACTUALIZAR GRUPO
  // Solo el propietario puede modificarlo.
  // =====================================================

  async update(
    id: string,
    userId: string,
    updateGroupDto: UpdateGroupDto,
  ) {
    const group =
      await this.findOne(id);

    this.validateOwner(
      group,
      userId,
    );

    const {
      invitationExpiresAt,
      ...updateData
    } = updateGroupDto;

    Object.assign(
      group,
      updateData,
    );

    if (
      invitationExpiresAt !== undefined
    ) {
      group.invitationExpiresAt =
        new Date(invitationExpiresAt);
    }

    return await this.groupsRepository.save(
      group,
    );
  }

  // =====================================================
  // ARCHIVAR GRUPO
  // Solo el propietario puede archivarlo.
  // =====================================================

  async archive(
    id: string,
    userId: string,
  ) {
    const group =
      await this.findOne(id);

    this.validateOwner(
      group,
      userId,
    );

    group.status =
      GroupStatus.ARCHIVED;

    group.invitationEnabled = false;

    return await this.groupsRepository.save(
      group,
    );
  }

  // =====================================================
  // ELIMINAR GRUPO
  // BORRADO LÓGICO
  // Solo el propietario puede eliminarlo.
  // =====================================================

  async remove(
    id: string,
    userId: string,
  ) {
    const group =
      await this.findOne(id);

    this.validateOwner(
      group,
      userId,
    );

    group.status =
      GroupStatus.DELETED;

    group.invitationEnabled = false;

    await this.groupsRepository.save(
      group,
    );

    return {
      message:
        'Grupo eliminado correctamente',
    };
  }

  // =====================================================
  // REGENERAR INVITACIÓN
  // Solo el propietario puede hacerlo.
  // =====================================================

  async regenerateInvitation(
    id: string,
    userId: string,
  ) {
    const group =
      await this.findOne(id);

    this.validateOwner(
      group,
      userId,
    );

    const invitationCode =
      randomUUID().replace(/-/g, '');

    const frontendUrl =
      this.configService.get<string>(
        'FRONTEND_URL',
      ) || 'http://localhost:3001';

    group.invitationCode =
      invitationCode;

    group.invitationUrl =
      `${frontendUrl}/groups/join/${invitationCode}`;

    group.invitationEnabled = true;

    return await this.groupsRepository.save(
      group,
    );
  }

  // =====================================================
  // VALIDAR PROPIETARIO DEL GRUPO
  // =====================================================

  private validateOwner(
    group: Group,
    userId: string,
  ) {
    if (group.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para realizar esta acción en este grupo',
      );
    }
  }
}