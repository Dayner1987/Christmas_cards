import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  In,
  Repository,
} from 'typeorm';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';
import { UsersService } from '../users/users.service';
import { SecretSantaTemplate } from './entities/secret_santa_template.entity';
import { CreateSecretSantaTemplateDto, UpdateSecretSantaTemplateDto } from './dto/create-secret_santa_template.dto';
import { UserRole } from '../users/entities/user.entity';

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
  private readonly logger = new Logger(SecretSantaEventsService.name);
  constructor(
    @InjectRepository(SecretSantaEvent)
    private readonly eventsRepository:
      Repository<SecretSantaEvent>,

    @InjectRepository(SecretSantaTemplate)
    private readonly templatesRepository: Repository<SecretSantaTemplate>,

    @InjectRepository(Group)
    private readonly groupsRepository:
      Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMembersRepository:
      Repository<GroupMember>,

    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
  ) {}

  // =====================================================
  // PLANTILLAS GLOBALES (SOLO ADMIN CREA/EDITA)
  // El sorteo SIEMPRE se efectúa sobre una instancia por grupo.
  // =====================================================

  private async requireGlobalAdmin(userId: string) {
    const actor = await this.usersService.findOne(userId);
    if (actor.status !== 'active' || actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo el administrador puede gestionar eventos globales.');
    }
  }

  async findTemplates() {
    return this.templatesRepository.find({
      where: { isActive: true }, order: { createdAt: 'DESC' },
    });
  }

  async createTemplate(userId: string, dto: CreateSecretSantaTemplateDto) {
    await this.requireGlobalAdmin(userId);
    const template = this.templatesRepository.create({
      creatorId: userId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      budget: dto.budget ?? null,
      currencyCode: dto.currencyCode ?? 'BOB',
      isActive: true,
    });
    return this.templatesRepository.save(template);
  }

  async updateTemplate(id: string, userId: string, dto: UpdateSecretSantaTemplateDto) {
    await this.requireGlobalAdmin(userId);
    const template = await this.templatesRepository.findOne({ where: { id, isActive: true } });
    if (!template) throw new NotFoundException('Evento global no encontrado.');
    if (dto.name !== undefined) template.name = dto.name.trim();
    if (dto.description !== undefined) template.description = dto.description.trim();
    if (dto.budget !== undefined) template.budget = dto.budget;
    if (dto.currencyCode !== undefined) template.currencyCode = dto.currencyCode;
    return this.templatesRepository.save(template);
  }

  async deactivateTemplate(id: string, userId: string) {
    await this.requireGlobalAdmin(userId);
    const template = await this.templatesRepository.findOne({ where: { id, isActive: true } });
    if (!template) throw new NotFoundException('Evento global no encontrado.');
    template.isActive = false;
    await this.templatesRepository.save(template);
    return { message: 'Evento global desactivado correctamente.' };
  }

  async uploadTemplateImage(id: string, userId: string, file: Express.Multer.File | undefined) {
    await this.requireGlobalAdmin(userId);
    const template = await this.templatesRepository.findOne({ where: { id, isActive: true } });
    if (!template) throw new NotFoundException('Evento global no encontrado.');
    const uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDERS.EVENTS);
    let previous: string | null = null;
    try {
      const updated = await this.templatesRepository.manager.transaction(async (manager) => {
        const repo = manager.getRepository(SecretSantaTemplate);
        const current = await repo.findOne({ where: { id, isActive: true }, lock: { mode: 'pessimistic_write' } });
        if (!current) throw new NotFoundException('Evento global no disponible.');
        previous = current.imagePublicId;
        const previousUrl = current.imageUrl;
        current.imageUrl = uploaded.url;
        current.imagePublicId = uploaded.publicId;
        const saved = await repo.save(current);
        // Actualizar las instancias que todavía heredan la portada global.
        const instances = manager.getRepository(SecretSantaEvent).createQueryBuilder()
          .update(SecretSantaEvent)
          .set({ imageUrl: uploaded.url })
          .where('source_template_id = :templateId', { templateId: id })
          .andWhere('image_public_id IS NULL');
        if (previousUrl === null) {
          instances.andWhere('image_url IS NULL');
        } else {
          instances.andWhere('image_url = :previousUrl', { previousUrl });
        }
        await instances.execute();
        return saved;
      });
      await this.cleanupImage(previous);
      return updated;
    } catch (error) {
      await this.cleanupImage(uploaded.publicId);
      throw error;
    }
  }

  /** Selecciona una plantilla global y crea/reutiliza un sorteo EXCLUSIVO del grupo. */
  async applyTemplate(groupId: string, templateId: string, userId: string) {
    await this.validateCanManageGroup(groupId, userId);
    const template = await this.templatesRepository.findOne({
      where: { id: templateId, isActive: true },
    });
    if (!template) throw new NotFoundException('Evento global no disponible.');

    return this.eventsRepository.manager.transaction(async (manager) => {
      const groupRepo = manager.getRepository(Group);
      const eventRepo = manager.getRepository(SecretSantaEvent);
      const group = await groupRepo.findOne({
        where: { id: groupId, status: GroupStatus.ACTIVE },
        lock: { mode: 'pessimistic_write' },
      });
      if (!group) throw new NotFoundException('El grupo no está activo.');
      let event = await eventRepo.findOne({
        where: { groupId, sourceTemplateId: templateId },
        order: { createdAt: 'DESC' },
      });
      if (!event || event.status === SecretSantaEventStatus.CANCELLED) {
        event = eventRepo.create({
          groupId, creatorId: userId, sourceTemplateId: templateId,
          name: template.name,
          description: template.description,
          budget: template.budget,
          currencyCode: template.currencyCode,
          imageUrl: template.imageUrl,
          // No se hereda el publicId: pertenece a la plantilla y no debe eliminarse.
          imagePublicId: null,
          drawDate: null, giftDeliveryDate: null,
          status: SecretSantaEventStatus.DRAFT,
        });
        event = await eventRepo.save(event);
      }
      group.selectedEventId = event.id;
      await groupRepo.save(group);
      return { groupId: group.id, selectedEventId: event.id, event };
    });
  }

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

  async uploadImage(eventId: string, actorId: string, file: Express.Multer.File | undefined) {
    const event = await this.findEventById(eventId);
    await this.validateCanManageGroup(event.groupId, actorId);
    const uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDERS.EVENTS);
    let previous: string | null = null;
    try {
      const updated = await this.eventsRepository.manager.transaction(async manager => {
        const repo = manager.getRepository(SecretSantaEvent);
        const current = await repo.findOne({ where: { id: eventId }, lock: { mode: 'pessimistic_write' } });
        if (!current) throw new NotFoundException('Evento no encontrado.');
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

  async deleteImage(eventId: string, actorId: string) {
    const event = await this.findEventById(eventId);
    await this.validateCanManageGroup(event.groupId, actorId);
    const previous = event.imagePublicId;
    event.imageUrl = null;
    event.imagePublicId = null;
    const updated = await this.eventsRepository.save(event);
    await this.cleanupImage(previous);
    return updated;
  }

  private async cleanupImage(publicId: string | null) {
    if (!publicId) return;
    try { await this.cloudinaryService.deleteImage(publicId); }
    catch { this.logger.warn(`Limpieza pendiente en Cloudinary: ${publicId}`); }
  }

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

    // El dueño y el administrador global pueden acceder.
    const actor = await this.usersService.findOne(userId);
    if (actor.status !== 'active') throw new ForbiddenException('Cuenta inactiva.');
    if (group.ownerId === userId || actor.role === UserRole.ADMIN) {
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

    // El dueño y el administrador global pueden administrar.
    const actor = await this.usersService.findOne(userId);
    if (actor.status !== 'active') throw new ForbiddenException('Cuenta inactiva.');
    if (group.ownerId === userId || actor.role === UserRole.ADMIN) {
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