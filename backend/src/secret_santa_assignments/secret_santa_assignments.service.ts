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
  DataSource,
  EntityManager,
  In,
  Repository,
} from 'typeorm';

import { GroupMembersService } from '../group_members/group_members.service';
import { Wishlist, WishlistStatus, WishlistVisibility } from '../wishlists/entities/wishlist.entity';
import { WishlistItem } from '../wishlist_items/entities/wishlist_item.entity';

import {
  randomInt,
} from 'crypto';

import {
  GiftStatus,
  SecretSantaAssignment,
} from './entities/secret_santa_assignment.entity';

import {
  SecretSantaEvent,
  SecretSantaEventStatus,
} from '../secret_santa_events/entities/secret_santa_event.entity';

import {
  Group,
  GroupStatus,
} from '../groups/entities/group.entity';

import {
  GroupMember,
  GroupMemberRole,
  MembershipStatus,
} from '../group_members/entities/group_member.entity';

import { UserRole } from '../users/entities/user.entity';

import {
  User,
} from '../users/entities/user.entity';

@Injectable()
export class SecretSantaAssignmentsService {
  constructor(
    @InjectRepository(
      SecretSantaAssignment,
    )
    private readonly assignmentsRepository:
      Repository<SecretSantaAssignment>,

    @InjectRepository(
      SecretSantaEvent,
    )
    private readonly eventsRepository:
      Repository<SecretSantaEvent>,

    @InjectRepository(User)
    private readonly usersRepository:
      Repository<User>,

    private readonly dataSource:
      DataSource,

    private readonly membersService: GroupMembersService,
  ) {}

  // =====================================================
  // REALIZAR SORTEO
  // =====================================================

  async draw(
    eventId: string,
    userId: string,
  ) {
    return await this.dataSource.transaction(
      async (manager) => {
        const eventRepository =
          manager.getRepository(
            SecretSantaEvent,
          );

        const assignmentRepository =
          manager.getRepository(
            SecretSantaAssignment,
          );

        // Bloqueamos el evento durante el sorteo para
        // evitar dos sorteos simultáneos.

        const event =
          await eventRepository.findOne({
            where: {
              id: eventId,
            },

            lock: {
              mode: 'pessimistic_write',
            },
          });

        if (!event) {
          throw new NotFoundException(
            'Evento de amigo secreto no encontrado',
          );
        }

        await this.validateCanManageGroup(
          manager,
          event.groupId,
          userId,
        );

        if (
          event.status !==
          SecretSantaEventStatus.DRAFT
        ) {
          throw new BadRequestException(
            'Este evento ya fue sorteado, completado o cancelado',
          );
        }

        const existingAssignments =
          await assignmentRepository.count({
            where: {
              eventId,
            },
          });

        if (existingAssignments > 0) {
          throw new BadRequestException(
            'El evento ya tiene asignaciones registradas',
          );
        }

        const memberRepository =
          manager.getRepository(
            GroupMember,
          );

        const members =
          await memberRepository.find({
            where: {
              groupId: event.groupId,
              membershipStatus:
                MembershipStatus.ACTIVE,
            },

            order: {
              joinedAt: 'ASC',
            },
          });

        const group =
          await manager
            .getRepository(Group)
            .findOne({
              where: {
                id: event.groupId,
              },
            });

        if (!group) {
          throw new NotFoundException(
            'El grupo no existe',
          );
        }

        // Sorteamos membresías, no cuentas: incluye invitados sin registro.
        if (!members.some(m => m.userId === group.ownerId)) {
          throw new BadRequestException('El propietario debe ser miembro activo antes del sorteo.');
        }
        const participantIds = members.map(m => m.id);

        if (participantIds.length < 3) {
          throw new BadRequestException(
            'Se necesitan al menos 3 participantes activos para realizar el sorteo',
          );
        }

        const receiverIds =
          this.generateDerangement(
            participantIds,
          );

        const byMemberId = new Map(members.map(m => [m.id, m]));
        const assignments = participantIds.map((giverMemberId, index) => {
          const receiverMemberId = receiverIds[index];
          const giver = byMemberId.get(giverMemberId)!;
          const receiver = byMemberId.get(receiverMemberId)!;
          return assignmentRepository.create({
            eventId, giverMemberId, receiverMemberId,
            giverId: giver.userId ?? null,
            receiverId: receiver.userId ?? null,
            giftStatus: GiftStatus.PENDING, assignedAt: new Date(), deliveredAt: null,
          });
        });

        await assignmentRepository.save(
          assignments,
        );

        event.status =
          SecretSantaEventStatus.DRAWN;

        if (!event.drawDate) {
          event.drawDate =
            new Date();
        }

        await eventRepository.save(
          event,
        );

        // No devolvemos las parejas para mantener
        // secreto el resultado.

        return {
          message:
            'Sorteo realizado correctamente',
          eventId: event.id,
          participants:
            assignments.length,
          status:
            event.status,
        };
      },
    );
  }

  // =====================================================
  // VER A QUIÉN DEBO REGALAR
  // =====================================================

  async findMyAssignment(
    eventId: string,
    userId: string,
  ) {
    const event =
      await this.eventsRepository.findOne({
        where: {
          id: eventId,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Evento de amigo secreto no encontrado',
      );
    }

    if (
      event.status !==
        SecretSantaEventStatus.DRAWN &&
      event.status !==
        SecretSantaEventStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'El sorteo todavía no fue realizado',
      );
    }

    const member = await this.dataSource.getRepository(GroupMember).findOne({
      where: { groupId: event.groupId, userId, membershipStatus: MembershipStatus.ACTIVE },
    });
    if (!member) throw new ForbiddenException('No perteneces al grupo.');
    const assignment = await this.assignmentsRepository.findOne({
      where: [{ eventId, giverId: userId }, { eventId, giverMemberId: member.id }],
    });

    if (!assignment) {
      throw new NotFoundException(
        'No tienes una asignación en este evento',
      );
    }

    return this.toPrivateAssignment(assignment);
  }

  // =====================================================
  // MARCAR REGALO COMO ENTREGADO
  // =====================================================

  async markAsDelivered(
    eventId: string,
    userId: string,
    guestMemberId?: string,
  ) {
    return await this.dataSource.transaction(
      async (manager) => {
        const assignmentRepository =
          manager.getRepository(
            SecretSantaAssignment,
          );

        const eventRepository =
          manager.getRepository(
            SecretSantaEvent,
          );

        const event = await eventRepository.findOne({ where: { id: eventId } });
        if (!event) throw new NotFoundException('Evento no encontrado.');
        if (event.status !== SecretSantaEventStatus.DRAWN) {
          throw new BadRequestException('El evento no admite nuevas entregas.');
        }
        const membership = guestMemberId ? null : await manager.getRepository(GroupMember).findOne({
          where: { userId, groupId: event.groupId, membershipStatus: MembershipStatus.ACTIVE },
        });
        const conditions: any[] = guestMemberId
          ? [{ eventId, giverMemberId: guestMemberId }]
          : [{ eventId, giverId: userId }];
        if (membership) conditions.push({ eventId, giverMemberId: membership.id });
        const assignment = await assignmentRepository.findOne({
          where: conditions,
          lock: { mode: 'pessimistic_write' },
        });

        if (!assignment) {
          throw new NotFoundException(
            'No tienes una asignación en este evento',
          );
        }

        if (
          assignment.giftStatus ===
          GiftStatus.DELIVERED
        ) {
          return {
            message:
              'El regalo ya estaba marcado como entregado',
            assignment,
          };
        }

        assignment.giftStatus =
          GiftStatus.DELIVERED;

        assignment.deliveredAt =
          new Date();

        await assignmentRepository.save(
          assignment,
        );

        const pendingAssignments =
          await assignmentRepository.count({
            where: {
              eventId,
              giftStatus:
                GiftStatus.PENDING,
            },
          });

        // Si todos entregaron su regalo, terminamos
        // automáticamente el evento.

        if (pendingAssignments === 0) {
          const event =
            await eventRepository.findOne({
              where: {
                id: eventId,
              },
            });

          if (
            event &&
            event.status ===
              SecretSantaEventStatus.DRAWN
          ) {
            event.status =
              SecretSantaEventStatus.COMPLETED;

            await eventRepository.save(
              event,
            );
          }
        }

        return {
          message:
            'Regalo marcado como entregado',
          assignment,
          eventCompleted:
            pendingAssignments === 0,
        };
      },
    );
  }

  async findGuestAssignment(eventId: string, guestToken: string) {
    const guest = await this.membersService.getGuestEntityByToken(guestToken);
    const event = await this.eventsRepository.findOne({ where: { id: eventId, groupId: guest.groupId } });
    if (!event || ![SecretSantaEventStatus.DRAWN, SecretSantaEventStatus.COMPLETED].includes(event.status)) {
      throw new NotFoundException('No existe un sorteo disponible para este invitado.');
    }
    const assignment = await this.assignmentsRepository.findOne({
      where: { eventId, giverMemberId: guest.id },
    });
    if (!assignment) throw new NotFoundException('No tienes una asignación en este evento.');
    return this.toPrivateAssignment(assignment);
  }

  async markGuestAsDelivered(eventId: string, guestToken: string) {
    const guest = await this.membersService.getGuestEntityByToken(guestToken);
    const event = await this.eventsRepository.findOne({ where: { id: eventId, groupId: guest.groupId } });
    if (!event) throw new NotFoundException('Evento no encontrado.');
    return this.markAsDelivered(eventId, '', guest.id);
  }

  private async toPrivateAssignment(assignment: SecretSantaAssignment) {
    let receiver: { id: string; name: string; avatarUrl?: string | null; isGuest: boolean };
    let wishlist: Array<any> = [];
    if (assignment.receiverMemberId) {
      const membership = await this.dataSource.getRepository(GroupMember).findOne({ where: { id: assignment.receiverMemberId } });
      if (!membership) throw new NotFoundException('Participante no encontrado.');
      if (membership.userId) {
        const user = await this.usersRepository.findOne({
          where: { id: membership.userId },
          select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true },
        });
        if (!user) throw new NotFoundException('Destinatario no encontrado.');
        receiver = { id: membership.id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
          avatarUrl: user.avatarUrl, isGuest: false };
        const lists = await this.dataSource.getRepository(Wishlist).find({ where: [
          { userId: user.id, status: WishlistStatus.ACTIVE, visibility: WishlistVisibility.GROUPS },
          { userId: user.id, status: WishlistStatus.ACTIVE, visibility: WishlistVisibility.PUBLIC },
        ] });
        if (lists.length) wishlist = await this.dataSource.getRepository(WishlistItem).find({
          where: lists.map(l => ({ wishlistId: l.id })),
        });
      } else {
        receiver = { id: membership.id, name: membership.guestName || 'Invitado', avatarUrl: membership.guestAvatarUrl, isGuest: true };
        wishlist = membership.guestWishlist ?? [];
      }
    } else if (assignment.receiverId) {
      const user = await this.usersRepository.findOne({ where: { id: assignment.receiverId },
        select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true } });
      if (!user) throw new NotFoundException('Destinatario no encontrado.');
      receiver = { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
        avatarUrl: user.avatarUrl, isGuest: false };
    } else throw new NotFoundException('Destinatario no encontrado.');
    return { id: assignment.id, eventId: assignment.eventId, giftStatus: assignment.giftStatus,
      assignedAt: assignment.assignedAt, deliveredAt: assignment.deliveredAt, receiver, wishlist };
  }

  // =====================================================
  // INFORMACIÓN GENERAL DEL SORTEO
  // =====================================================

  async getEventSummary(
    eventId: string,
    userId: string,
  ) {
    const event =
      await this.eventsRepository.findOne({
        where: {
          id: eventId,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Evento de amigo secreto no encontrado',
      );
    }

    await this.validateCanManageGroup(
      this.dataSource.manager,
      event.groupId,
      userId,
    );

    const total =
      await this.assignmentsRepository.count({
        where: {
          eventId,
        },
      });

    const delivered =
      await this.assignmentsRepository.count({
        where: {
          eventId,
          giftStatus:
            GiftStatus.DELIVERED,
        },
      });

    // Mostramos cantidades, pero nunca las parejas.

    return {
      eventId,
      eventName:
        event.name,
      eventStatus:
        event.status,
      participants:
        total,
      delivered,
      pending:
        total - delivered,
    };
  }

  // =====================================================
  // GENERAR SORTEO SIN AUTOSORTEOS
  // =====================================================

  private generateDerangement(
    participantIds: string[],
  ) {
    // Intentamos generar una mezcla completamente
    // aleatoria donde nadie se saque a sí mismo.

    for (
      let attempt = 0;
      attempt < 100;
      attempt++
    ) {
      const shuffled =
        this.shuffle([
          ...participantIds,
        ]);

      const isValid =
        shuffled.every(
          (receiverId, index) =>
            receiverId !==
            participantIds[index],
        );

      if (isValid) {
        return shuffled;
      }
    }

    // Respaldo seguro: rotamos una posición.
    // También garantiza que nadie se saque solo.

    return [
      ...participantIds.slice(1),
      participantIds[0],
    ];
  }

  // =====================================================
  // MEZCLAR PARTICIPANTES
  // =====================================================

  private shuffle(
    values: string[],
  ) {
    for (
      let index =
        values.length - 1;
      index > 0;
      index--
    ) {
      const randomIndex =
        randomInt(index + 1);

      [
        values[index],
        values[randomIndex],
      ] = [
        values[randomIndex],
        values[index],
      ];
    }

    return values;
  }

async findGuestEvents(guestToken: string) {
  const guest =
    await this.membersService.getGuestEntityByToken(
      guestToken,
    );

  const events = await this.eventsRepository.find({
    where: {
      groupId: guest.groupId,
      status: In([
        SecretSantaEventStatus.DRAFT,
        SecretSantaEventStatus.DRAWN,
        SecretSantaEventStatus.COMPLETED,
      ]),
    },
    order: {
      createdAt: 'DESC',
    },
  });

  const group = await this.dataSource.getRepository(Group).findOne({
    where: { id: guest.groupId, status: GroupStatus.ACTIVE },
  });
  // No mostrar una celebración cualquiera cuando existan varias.
  // Para grupos anteriores sin selección, mantener el único evento existente.
  const visible = group?.selectedEventId
    ? events.filter((event) => event.id === group.selectedEventId)
    : events.length === 1 ? events : [];

  return visible.map((event) => ({
    id: event.id,
    groupId: event.groupId,
    name: event.name,
    description: event.description,
    imageUrl: event.imageUrl,
    budget: event.budget,
    currencyCode: event.currencyCode,
    status: event.status,
    drawDate: event.drawDate,
    giftDeliveryDate: event.giftDeliveryDate,
  }));
}

async getOrganizerAssignments(
  eventId: string,
  requesterId: string,
) {
  const event = await this.eventsRepository.findOne({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundException('Evento no encontrado.');
  }

  const group = await this.dataSource
    .getRepository(Group)
    .findOne({
      where: {
        id: event.groupId,
        status: GroupStatus.ACTIVE,
      },
    });

  if (!group) {
    throw new NotFoundException('Grupo no disponible.');
  }

  if (group.ownerId !== requesterId) {
    throw new ForbiddenException(
      'Solo el propietario puede consultar las parejas del sorteo.',
    );
  }

  if (
    event.status !== SecretSantaEventStatus.DRAWN &&
    event.status !== SecretSantaEventStatus.COMPLETED
  ) {
    throw new BadRequestException(
      'El sorteo todavía no se realizó.',
    );
  }

  const assignments = await this.assignmentsRepository.find({
    where: { eventId },
    relations: {
      giverMember: { user: true },
      receiverMember: { user: true },
    },
    order: { assignedAt: 'ASC' },
  });

  const getName = (member: GroupMember | null): string => {
    if (!member) return 'Participante no disponible';

    if (!member.userId) {
      return member.guestName || 'Invitado';
    }

    const person = member.user;

    if (!person) return 'Usuario no disponible';

    return (
      [person.firstName, person.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      person.username
    );
  };

  return {
    eventId: event.id,
    eventName: event.name,
    groupId: event.groupId,
    total: assignments.length,
    delivered: assignments.filter(
      (item) => item.giftStatus === GiftStatus.DELIVERED,
    ).length,
    assignments: assignments.map((item) => ({
      id: item.id,
      giverMemberId: item.giverMemberId,
      giverName: getName(item.giverMember),
      receiverMemberId: item.receiverMemberId,
      receiverName: getName(item.receiverMember),
      giftStatus: item.giftStatus,
      deliveredAt: item.deliveredAt,
    })),
  };
}

  // =====================================================
  // VALIDAR DUEÑO O ADMINISTRADOR
  // =====================================================

  private async validateCanManageGroup(
    manager: EntityManager,
    groupId: string,
    userId: string,
  ) {
    const group =
      await manager
        .getRepository(Group)
        .findOne({
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
      group.status !==
      GroupStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'El grupo no está activo',
      );
    }

    const actor = await manager.getRepository(User).findOne({ where: { id: userId, status: 'active' } });
    if (group.ownerId === userId || actor?.role === UserRole.ADMIN) {
      return group;
    }

    const membership =
      await manager
        .getRepository(GroupMember)
        .findOne({
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
        'Solo el dueño o un administrador puede realizar esta acción',
      );
    }

    return group;
  }
}