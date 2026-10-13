import {
  ForbiddenException,
  BadRequestException,
  Logger,
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
import * as QRCode from 'qrcode';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';
import { UserRole } from '../users/entities/user.entity';
import { GroupVisibility } from './entities/group.entity';

import {
  Group,
  GroupStatus,
} from './entities/group.entity';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

import { UsersService } from '../users/users.service';

import {
  GroupMember,
  GroupMemberRole,
  JoinedBy,
  MembershipStatus,
} from '../group_members/entities/group_member.entity';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,

    private readonly usersService: UsersService,

    private readonly configService: ConfigService,

    private readonly cloudinaryService: CloudinaryService,
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

    // Verificar que el usuario autenticado exista
    const owner = await this.usersService.findOne(ownerId);
    if (owner.status !== 'active') throw new ForbiddenException('Usuario inactivo.');

    // Generar código único de invitación
    const invitationCode = randomUUID().replace(/-/g, '');

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    const invitationUrl =
      `${frontendUrl.replace(/\/+$/, '')}/groups/join/${invitationCode}`;

    const group = this.groupsRepository.create({
      ...groupData,
      ownerId,
      invitationCode,
      invitationUrl,
      invitationExpiresAt: invitationExpiresAt
        ? new Date(invitationExpiresAt)
        : null,
    });

    // La creación del grupo y su dueño deben ser atómicas.
    return this.groupsRepository.manager.transaction(async manager => {
      const savedGroup = await manager.save(Group, group);
      const membership = manager.create(GroupMember, {
        groupId: savedGroup.id, userId: ownerId, role: GroupMemberRole.OWNER,
        membershipStatus: MembershipStatus.ACTIVE, joinedBy: JoinedBy.OWNER,
        joinedAt: new Date(),
      });
      await manager.save(GroupMember, membership);
      return savedGroup;
    });
  }

  // =====================================================
  // LISTAR GRUPOS
  // No devuelve grupos eliminados.
  // =====================================================

  async findAll() {
    const groups = await this.groupsRepository.find({
      where: {
        status: GroupStatus.ACTIVE,
        visibility: GroupVisibility.PUBLIC,
      },
      order: { createdAt: 'DESC' },
    });
    return groups.map(({ invitationCode: _code, invitationUrl: _url, imagePublicId: _imageId, ...group }) => group);
  }

  // =====================================================
  // BUSCAR GRUPO POR UUID
  // =====================================================

  async findAllForAdmin(userId: string) {
    await this.usersService.assertAccess(userId, undefined, true);
    return this.groupsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const group = await this.groupsRepository.findOne({
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
  // =====================================================

  async findByOwner(userId: string) {
    // /groups/me devuelve todos los grupos activos en los que participa
    // el usuario, incluidos los privados y los que no ha creado.
    const memberships = await this.groupMembersRepository.find({
      where: { userId, membershipStatus: MembershipStatus.ACTIVE },
      relations: { group: true },
      order: { createdAt: 'DESC' },
    });

    return memberships
      .map((membership) => membership.group)
      .filter((group) => group && group.status === GroupStatus.ACTIVE);
  }

  // =====================================================
  // BUSCAR GRUPO POR CÓDIGO DE INVITACIÓN
  // =====================================================

  async findByInvitationCode(
    invitationCode: string,
  ) {
    const group = await this.groupsRepository.findOne({
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

    if (!group.invitationEnabled) {
      throw new NotFoundException(
        'La invitación ya no está disponible',
      );
    }

    if (
      group.invitationExpiresAt &&
      group.invitationExpiresAt < new Date()
    ) {
      throw new NotFoundException(
        'La invitación ha expirado',
      );
    }

    return { id: group.id, name: group.name, description: group.description, imageUrl: group.imageUrl, themeColor: group.themeColor, joinMode: group.joinMode, maximumMembers: group.maximumMembers };
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
    const group = await this.findOne(id);

    await this.validateOwner(group, userId);

    const {
      invitationExpiresAt,
      ...updateData
    } = updateGroupDto;

    Object.assign(group, updateData);

    if (invitationExpiresAt !== undefined) {
      group.invitationExpiresAt =
        invitationExpiresAt
          ? new Date(invitationExpiresAt)
          : null;
    }

    return await this.groupsRepository.save(group);
  }

  // =====================================================
  // ARCHIVAR GRUPO
  // =====================================================

  async archive(
    id: string,
    userId: string,
  ) {
    const group = await this.findOne(id);

    await this.validateOwner(group, userId);

    group.status = GroupStatus.ARCHIVED;
    group.invitationEnabled = false;

    return await this.groupsRepository.save(group);
  }

  // =====================================================
  // ELIMINAR GRUPO
  // Borrado lógico.
  // =====================================================

  async remove(
    id: string,
    userId: string,
  ) {
    const group = await this.findOne(id);

    await this.validateOwner(group, userId);

    group.status = GroupStatus.DELETED;
    group.invitationEnabled = false;

    await this.groupsRepository.save(group);

    return {
      message: 'Grupo eliminado correctamente',
    };
  }

  // =====================================================
  // REGENERAR INVITACIÓN
  // =====================================================

  async regenerateInvitation(
    id: string,
    userId: string,
  ) {
    const group = await this.findOne(id);

    await this.validateOwner(group, userId);

    const invitationCode =
      randomUUID().replace(/-/g, '');

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    group.invitationCode = invitationCode;

    group.invitationUrl =
      `${frontendUrl.replace(/\/+$/, '')}/groups/join/${invitationCode}`;

    group.invitationEnabled = true;

    return await this.groupsRepository.save(group);
  }

  // =====================================================
  // VALIDAR PROPIETARIO DEL GRUPO
  // =====================================================

  async assertCanView(id: string, userId: string) {
    const group = await this.findOne(id);
    const actor = await this.usersService.findOne(userId);
    if (actor.role === UserRole.ADMIN || group.ownerId === userId) return group;
    if (group.visibility === GroupVisibility.PUBLIC) return {
      id: group.id, name: group.name, description: group.description, imageUrl: group.imageUrl, themeColor: group.themeColor,
      visibility: group.visibility, status: group.status, createdAt: group.createdAt,
    };
    const member = await this.groupMembersRepository.findOne({
      where: { groupId: id, userId, membershipStatus: MembershipStatus.ACTIVE },
    });
    if (!member) throw new ForbiddenException('No perteneces a este grupo.');
    return group;
  }

  async updateImage(id: string, actorId: string, file: Express.Multer.File | undefined) {
    const group = await this.findOne(id);
    await this.validateOwner(group, actorId);
    if (group.status !== GroupStatus.ACTIVE) throw new BadRequestException('El grupo no está activo.');
    const uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDERS.GROUPS);
    let previous: string | null = null;
    try {
      const updated = await this.groupsRepository.manager.transaction(async manager => {
        const repo = manager.getRepository(Group);
        const current = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!current || current.status !== GroupStatus.ACTIVE) throw new BadRequestException('Grupo no disponible.');
        previous = current.imagePublicId;
        current.imageUrl = uploaded.url;
        current.imagePublicId = uploaded.publicId;
        return repo.save(current);
      });
      await this.cleanupImage(previous);
      return updated;
    } catch (error) {
      await this.cleanupImage(uploaded.publicId);
      throw error;
    }
  }

  async removeImage(id: string, actorId: string) {
    const group = await this.findOne(id);
    await this.validateOwner(group, actorId);
    const previous = group.imagePublicId;
    group.imageUrl = null;
    group.imagePublicId = null;
    const updated = await this.groupsRepository.save(group);
    await this.cleanupImage(previous);
    return updated;
  }

  async invitationQr(id: string, actorId: string) {
    const group = await this.findOne(id);
    await this.validateOwner(group, actorId);
    if (group.status !== GroupStatus.ACTIVE || !group.invitationEnabled ||
        (group.invitationExpiresAt && group.invitationExpiresAt < new Date())) {
      throw new BadRequestException('La invitación no está disponible.');
    }
    return {
      groupId: group.id,
      invitationUrl: group.invitationUrl,
      qrDataUrl: await QRCode.toDataURL(group.invitationUrl, {
        errorCorrectionLevel: 'H', margin: 2, width: 384,
      }),
    };
  }

  private async cleanupImage(publicId: string | null) {
    if (!publicId) return;
    try { await this.cloudinaryService.deleteImage(publicId); }
    catch { this.logger.warn(`Limpieza pendiente en Cloudinary: ${publicId}`); }
  }


  private async validateOwner(
    group: Group,
    userId: string,
  ) {
    const actor = await this.usersService.findOne(userId);
    if (actor.status !== 'active') throw new ForbiddenException('Usuario inactivo.');
    if (group.ownerId !== userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para realizar esta acción en este grupo',
      );
    }
  }
}