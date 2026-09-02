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

        // Evitamos usuarios repetidos.

        const participantIds =
          Array.from(
            new Set(
              members.map(
                (member) =>
                  member.userId,
              ),
            ),
          );

        // Si por algún error el dueño no estuviera en
        // group_members, lo incluimos automáticamente.

        if (
          !participantIds.includes(
            group.ownerId,
          )
        ) {
          participantIds.push(
            group.ownerId,
          );
        }

        if (participantIds.length < 3) {
          throw new BadRequestException(
            'Se necesitan al menos 3 participantes activos para realizar el sorteo',
          );
        }

        const receiverIds =
          this.generateDerangement(
            participantIds,
          );

        const assignments =
          participantIds.map(
            (giverId, index) =>
              assignmentRepository.create({
                eventId,
                giverId,
                receiverId:
                  receiverIds[index],
                giftStatus:
                  GiftStatus.PENDING,
                assignedAt:
                  new Date(),
                deliveredAt:
                  null,
              }),
          );

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

    const assignment =
      await this.assignmentsRepository.findOne({
        where: {
          eventId,
          giverId: userId,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'No tienes una asignación en este evento',
      );
    }

    // Seleccionamos únicamente datos públicos.
    // No devolvemos contraseña, email ni teléfono.

    const receiver =
      await this.usersRepository.findOne({
        where: {
          id: assignment.receiverId,
        },

        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      });

    if (!receiver) {
      throw new NotFoundException(
        'El usuario asignado ya no existe',
      );
    }

    return {
      id: assignment.id,
      eventId:
        assignment.eventId,

      giftStatus:
        assignment.giftStatus,

      assignedAt:
        assignment.assignedAt,

      deliveredAt:
        assignment.deliveredAt,

      receiver,
    };
  }

  // =====================================================
  // MARCAR REGALO COMO ENTREGADO
  // =====================================================

  async markAsDelivered(
    eventId: string,
    userId: string,
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

        const assignment =
          await assignmentRepository.findOne({
            where: {
              eventId,
              giverId: userId,
            },

            lock: {
              mode: 'pessimistic_write',
            },
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

    if (group.ownerId === userId) {
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