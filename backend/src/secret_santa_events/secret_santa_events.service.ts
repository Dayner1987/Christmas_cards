import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  In,
  Repository,
} from 'typeorm';

import {
  CreateSecretSantaEventDto,
} from './dto/create-secret_santa_event.dto';

import {
  UpdateSecretSantaEventDto,
} from './dto/update-secret_santa_event.dto';

import {
  SecretSantaEvent,
  SecretSantaEventStatus,
} from './entities/secret_santa_event.entity';

import {
  Group,
  GroupStatus,
} from '../groups/entities/group.entity';

import {
  GroupMember,
  GroupMemberRole,
  MembershipStatus,
} from '../group_members/entities/group_member.entity';

@Injectable()
export class SecretSantaEventsService {
  constructor(
    @InjectRepository(SecretSantaEvent)
    private readonly eventsRepository:
      Repository<SecretSantaEvent>,

    @InjectRepository(Group)
    private readonly groupsRepository:
      Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMembersRepository:
      Repository<GroupMember>,
  ) {}

  // =====================================================
  // CREAR EVENTO
  // =====================================================

  async create(
    userId: string,
    createDto: CreateSecretSantaEventDto,
  ) {
    await this.validateCanManageGroup(
      createDto.groupId,
      userId,
    );

    const drawDate =
      createDto.drawDate
        ? new Date(createDto.drawDate)
        : null;

    const giftDeliveryDate =
      createDto.giftDeliveryDate
        ? new Date(
            createDto.giftDeliveryDate,
          )
        : null;

    this.validateDates(
      drawDate,
      giftDeliveryDate,
    );

    const event =
      this.eventsRepository.create({
        groupId: createDto.groupId,
        creatorId: userId,
        name: createDto.name.trim(),
        description:
          createDto.description?.trim() ??
          null,
        budget:
          createDto.budget ?? null,
        currencyCode:
          createDto.currencyCode ?? 'BOB',
        drawDate,
        giftDeliveryDate,
        status:
          SecretSantaEventStatus.DRAFT,
      });

    return await this.eventsRepository.save(
      event,
    );
  }

  // =====================================================
  // MIS EVENTOS
  // =====================================================

  async findMyEvents(userId: string) {
    return await this.eventsRepository
      .createQueryBuilder('event')
      .innerJoin(
        Group,
        'group',
        'group.id_groups = event.id_groups',
      )
      .leftJoin(
        GroupMember,
        'membership',
        `
          membership.id_groups = event.id_groups
          AND membership.id_users = :userId
          AND membership.membership_status = :activeStatus
        `,
        {
          userId,
          activeStatus:
            MembershipStatus.ACTIVE,
        },
      )
      .where(
        `
          group.id_users_owner = :userId
          OR membership.id_group_members IS NOT NULL
        `,
        {
          userId,
        },
      )
      .orderBy(
        'event.created_at',
        'DESC',
      )
      .getMany();
  }

  // =====================================================
  // EVENTOS DE UN GRUPO
  // =====================================================

  async findByGroup(
    groupId: string,
    userId: string,
  ) {
    await this.validateGroupAccess(
      groupId,
      userId,
    );

    return await this.eventsRepository.find({
      where: {
        groupId,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // VER UN EVENTO
  // =====================================================

  async findOne(
    id: string,
    userId: string,
  ) {
    const event =
      await this.findEventById(id);

    await this.validateGroupAccess(
      event.groupId,
      userId,
    );

    return event;
  }

  // =====================================================
  // ACTUALIZAR EVENTO
  // =====================================================

  async update(
    id: string,
    userId: string,
    updateDto: UpdateSecretSantaEventDto,
  ) {
    const event =
      await this.findEventById(id);

    await this.validateCanManageGroup(
      event.groupId,
      userId,
    );

    if (
      event.status !==
      SecretSantaEventStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Solo se pueden modificar eventos en borrador',
      );
    }

    const drawDate =
      updateDto.drawDate !== undefined
        ? new Date(updateDto.drawDate)
        : event.drawDate;

    const giftDeliveryDate =
      updateDto.giftDeliveryDate !==
      undefined
        ? new Date(
            updateDto.giftDeliveryDate,
          )
        : event.giftDeliveryDate;

    this.validateDates(
      drawDate,
      giftDeliveryDate,
    );

    if (updateDto.name !== undefined) {
      event.name =
        updateDto.name.trim();
    }

    if (
      updateDto.description !==
      undefined
    ) {
      event.description =
        updateDto.description.trim();
    }

    if (updateDto.budget !== undefined) {
      event.budget =
        updateDto.budget;
    }

    if (
      updateDto.currencyCode !==
      undefined
    ) {
      event.currencyCode =
        updateDto.currencyCode;
    }

    if (updateDto.drawDate !== undefined) {
      event.drawDate =
        drawDate;
    }

    if (
      updateDto.giftDeliveryDate !==
      undefined
    ) {
      event.giftDeliveryDate =
        giftDeliveryDate;
    }

    return await this.eventsRepository.save(
      event,
    );
  }

  // =====================================================
  // CANCELAR EVENTO
  // =====================================================

  async cancel(
    id: string,
    userId: string,
  ) {
    const event =
      await this.findEventById(id);

    await this.validateCanManageGroup(
      event.groupId,
      userId,
    );

    if (
      event.status ===
      SecretSantaEventStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'No se puede cancelar un evento completado',
      );
    }

    if (
      event.status ===
      SecretSantaEventStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'El evento ya está cancelado',
      );
    }

    event.status =
      SecretSantaEventStatus.CANCELLED;

    return await this.eventsRepository.save(
      event,
    );
  }

  // =====================================================
  // COMPLETAR EVENTO
  // =====================================================

  async complete(
    id: string,
    userId: string,
  ) {
    const event =
      await this.findEventById(id);

    await this.validateCanManageGroup(
      event.groupId,
      userId,
    );

    if (
      event.status !==
      SecretSantaEventStatus.DRAWN
    ) {
      throw new BadRequestException(
        'Solo se puede completar un evento cuyo sorteo ya fue realizado',
      );
    }

    event.status =
      SecretSantaEventStatus.COMPLETED;

    return await this.eventsRepository.save(
      event,
    );
  }

  // =====================================================
  // BUSCAR EVENTO
  // =====================================================

  private async findEventById(
    id: string,
  ) {
    const event =
      await this.eventsRepository.findOne({
        where: {
          id,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Evento de amigo secreto no encontrado',
      );
    }

    return event;
  }

  // =====================================================
  // VALIDAR ACCESO AL GRUPO
  // =====================================================

  private async validateGroupAccess(
    groupId: string,
    userId: string,
  ) {
    const group =
      await this.groupsRepository.findOne({
        where: {
          id: groupId,
        },
      });

    if (!group) {
      throw new NotFoundException(
        'El grupo no existe',
      );
    }

    // El dueño siempre puede acceder.

    if (group.ownerId === userId) {
      return group;
    }

    const membership =
      await this.groupMembersRepository.findOne({
        where: {
          groupId,
          userId,
          membershipStatus:
            MembershipStatus.ACTIVE,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'No eres miembro activo de este grupo',
      );
    }

    return group;
  }

  // =====================================================
  // VALIDAR PERMISOS DE ADMINISTRACIÓN
  // =====================================================

  private async validateCanManageGroup(
    groupId: string,
    userId: string,
  ) {
    const group =
      await this.groupsRepository.findOne({
        where: {
          id: groupId,
        },
      });

    if (!group) {
      throw new NotFoundException(
        'El grupo no existe',
      );
    }

    if (
      group.status !== GroupStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'El grupo no está activo',
      );
    }

    // El dueño registrado en groups siempre administra.

    if (group.ownerId === userId) {
      return group;
    }

    const membership =
      await this.groupMembersRepository.findOne({
        where: {
          groupId,
          userId,
          membershipStatus:
            MembershipStatus.ACTIVE,
          role: In([
            GroupMemberRole.OWNER,
            GroupMemberRole.ADMIN,
          ]),
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'Solo el dueño o un administrador del grupo puede realizar esta acción',
      );
    }

    return group;
  }

  // =====================================================
  // VALIDAR FECHAS
  // =====================================================

  private validateDates(
    drawDate: Date | null,
    giftDeliveryDate: Date | null,
  ) {
    if (
      drawDate &&
      giftDeliveryDate &&
      drawDate.getTime() >
        giftDeliveryDate.getTime()
    ) {
      throw new BadRequestException(
        'La fecha de entrega debe ser posterior o igual a la fecha del sorteo',
      );
    }
  }
}