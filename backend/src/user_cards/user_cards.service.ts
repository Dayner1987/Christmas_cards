import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  CreateUserCardDto,
} from './dto/create-user_card.dto';

import {
  UpdateUserCardDto,
} from './dto/update-user_card.dto';

import {
  DeliveryChannel,
  DeliveryStatus,
  UserCard,
} from './entities/user_card.entity';

import {
  Card,
} from '../cards/entities/card.entity';

import {
  User,
} from '../users/entities/user.entity';

import {
  Group,
} from '../groups/entities/group.entity';

@Injectable()
export class UserCardsService {
  constructor(
    @InjectRepository(UserCard)
    private readonly userCardsRepository:
      Repository<UserCard>,

    @InjectRepository(Card)
    private readonly cardsRepository:
      Repository<Card>,

    @InjectRepository(User)
    private readonly usersRepository:
      Repository<User>,

    @InjectRepository(Group)
    private readonly groupsRepository:
      Repository<Group>,
  ) {}

  // =====================================================
  // CREAR TARJETA DE USUARIO
  // =====================================================

  async create(
    senderId: string,
    createDto: CreateUserCardDto,
  ) {
    if (senderId === createDto.recipientId) {
      throw new BadRequestException(
        'No puedes enviarte una tarjeta a ti mismo',
      );
    }

    await this.validateCard(
      createDto.cardId,
      senderId,
    );

    await this.validateRecipient(
      createDto.recipientId,
    );

    if (createDto.groupId) {
      await this.validateGroup(
        createDto.groupId,
      );
    }

    const scheduledAt =
      createDto.scheduledAt
        ? new Date(createDto.scheduledAt)
        : null;

    if (
      scheduledAt &&
      scheduledAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'La fecha programada debe ser futura',
      );
    }

    const deliveryStatus =
      scheduledAt
        ? DeliveryStatus.SCHEDULED
        : DeliveryStatus.DRAFT;

    const userCard =
      this.userCardsRepository.create({
        cardId: createDto.cardId,
        senderId,
        recipientId:
          createDto.recipientId,
        groupId:
          createDto.groupId ?? null,
        title:
          createDto.title ?? null,
        message:
          createDto.message,
        senderName:
          createDto.senderName ?? null,
        recipientName:
          createDto.recipientName ?? null,
        deliveryChannel:
          createDto.deliveryChannel ??
          DeliveryChannel.APPLICATION,
        deliveryStatus,
        scheduledAt,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
      });

    return await this.userCardsRepository.save(
      userCard,
    );
  }

  // =====================================================
  // TARJETAS ENVIADAS
  // =====================================================

  async findSent(senderId: string) {
    return await this.userCardsRepository.find({
      where: {
        senderId,
      },

      relations: {
        card: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // TARJETAS RECIBIDAS
  // =====================================================

  async findReceived(recipientId: string) {
    return await this.userCardsRepository.find({
      where: {
        recipientId,
      },

      relations: {
        card: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // VER UNA TARJETA
  // =====================================================

  async findOne(
    id: string,
    userId: string,
  ) {
    const userCard =
      await this.findById(id);

    this.validateRelatedUser(
      userCard,
      userId,
    );

    return userCard;
  }

  // =====================================================
  // ACTUALIZAR BORRADOR O PROGRAMADA
  // =====================================================

  async update(
    id: string,
    senderId: string,
    updateDto: UpdateUserCardDto,
  ) {
    const userCard =
      await this.findById(id);

    this.validateSender(
      userCard,
      senderId,
    );

    if (
      userCard.deliveryStatus !==
        DeliveryStatus.DRAFT &&
      userCard.deliveryStatus !==
        DeliveryStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Solo se pueden modificar tarjetas en borrador o programadas',
      );
    }

    const recipientId =
      updateDto.recipientId ??
      userCard.recipientId;

    if (recipientId === senderId) {
      throw new BadRequestException(
        'No puedes enviarte una tarjeta a ti mismo',
      );
    }

    if (updateDto.cardId) {
      await this.validateCard(
        updateDto.cardId,
        senderId,
      );
    }

    if (updateDto.recipientId) {
      await this.validateRecipient(
        updateDto.recipientId,
      );
    }

    if (updateDto.groupId) {
      await this.validateGroup(
        updateDto.groupId,
      );
    }

    if (updateDto.scheduledAt) {
      const scheduledAt =
        new Date(updateDto.scheduledAt);

      if (
        scheduledAt.getTime() <= Date.now()
      ) {
        throw new BadRequestException(
          'La fecha programada debe ser futura',
        );
      }

      userCard.scheduledAt =
        scheduledAt;

      userCard.deliveryStatus =
        DeliveryStatus.SCHEDULED;
    }

    if (updateDto.cardId !== undefined) {
      userCard.cardId =
        updateDto.cardId;
    }

    if (
      updateDto.recipientId !== undefined
    ) {
      userCard.recipientId =
        updateDto.recipientId;
    }

    if (updateDto.groupId !== undefined) {
      userCard.groupId =
        updateDto.groupId;
    }

    if (updateDto.title !== undefined) {
      userCard.title =
        updateDto.title;
    }

    if (updateDto.message !== undefined) {
      userCard.message =
        updateDto.message;
    }

    if (
      updateDto.senderName !== undefined
    ) {
      userCard.senderName =
        updateDto.senderName;
    }

    if (
      updateDto.recipientName !== undefined
    ) {
      userCard.recipientName =
        updateDto.recipientName;
    }

    if (
      updateDto.deliveryChannel !==
      undefined
    ) {
      userCard.deliveryChannel =
        updateDto.deliveryChannel;
    }

    return await this.userCardsRepository.save(
      userCard,
    );
  }

  // =====================================================
  // ENVIAR AHORA
  // =====================================================

  async send(
    id: string,
    senderId: string,
  ) {
    const userCard =
      await this.findById(id);

    this.validateSender(
      userCard,
      senderId,
    );

    if (
      userCard.deliveryStatus !==
        DeliveryStatus.DRAFT &&
      userCard.deliveryStatus !==
        DeliveryStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Esta tarjeta ya fue enviada o cancelada',
      );
    }

    userCard.deliveryStatus =
      DeliveryStatus.SENT;

    userCard.sentAt =
      new Date();

    return await this.userCardsRepository.save(
      userCard,
    );
  }

  // =====================================================
  // MARCAR COMO LEÍDA
  // =====================================================

  async markAsRead(
    id: string,
    recipientId: string,
  ) {
    const userCard =
      await this.findById(id);

    if (
      userCard.recipientId !==
      recipientId
    ) {
      throw new ForbiddenException(
        'Solo el destinatario puede marcar la tarjeta como leída',
      );
    }

    if (
      userCard.deliveryStatus !==
        DeliveryStatus.SENT &&
      userCard.deliveryStatus !==
        DeliveryStatus.DELIVERED &&
      userCard.deliveryStatus !==
        DeliveryStatus.READ
    ) {
      throw new BadRequestException(
        'La tarjeta todavía no fue enviada',
      );
    }

    if (!userCard.deliveredAt) {
      userCard.deliveredAt =
        new Date();
    }

    if (!userCard.readAt) {
      userCard.readAt =
        new Date();
    }

    userCard.deliveryStatus =
      DeliveryStatus.READ;

    return await this.userCardsRepository.save(
      userCard,
    );
  }

  // =====================================================
  // CANCELAR TARJETA
  // =====================================================

  async cancel(
    id: string,
    senderId: string,
  ) {
    const userCard =
      await this.findById(id);

    this.validateSender(
      userCard,
      senderId,
    );

    if (
      userCard.deliveryStatus !==
        DeliveryStatus.DRAFT &&
      userCard.deliveryStatus !==
        DeliveryStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar borradores o tarjetas programadas',
      );
    }

    userCard.deliveryStatus =
      DeliveryStatus.CANCELLED;

    return await this.userCardsRepository.save(
      userCard,
    );
  }

  // =====================================================
  // BUSCAR POR ID
  // =====================================================

  private async findById(
    id: string,
  ) {
    const userCard =
      await this.userCardsRepository.findOne({
        where: {
          id,
        },

        relations: {
          card: true,
        },
      });

    if (!userCard) {
      throw new NotFoundException(
        'Tarjeta de usuario no encontrada',
      );
    }

    return userCard;
  }

  // =====================================================
  // VALIDAR TARJETA BASE
  // =====================================================

  private async validateCard(
    cardId: string,
    senderId: string,
  ) {
    const card =
      await this.cardsRepository.findOne({
        where: [
          {
            id: cardId,
            isActive: true,
            isPublic: true,
          },
          {
            id: cardId,
            isActive: true,
            creatorId: senderId,
          },
        ],
      });

    if (!card) {
      throw new NotFoundException(
        'La tarjeta seleccionada no existe, está inactiva o no tienes acceso',
      );
    }

    return card;
  }

  // =====================================================
  // VALIDAR DESTINATARIO
  // =====================================================

  private async validateRecipient(
    recipientId: string,
  ) {
    const recipient =
      await this.usersRepository.findOne({
        where: {
          id: recipientId,
          status: 'active',
        },
      });

    if (!recipient) {
      throw new NotFoundException(
        'El destinatario no existe o está inactivo',
      );
    }

    return recipient;
  }

  // =====================================================
  // VALIDAR GRUPO
  // =====================================================

  private async validateGroup(
    groupId: string,
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

    return group;
  }

  // =====================================================
  // VALIDAR REMITENTE
  // =====================================================

  private validateSender(
    userCard: UserCard,
    senderId: string,
  ) {
    if (
      userCard.senderId !== senderId
    ) {
      throw new ForbiddenException(
        'Solo el remitente puede realizar esta acción',
      );
    }
  }

  // =====================================================
  // VALIDAR USUARIO RELACIONADO
  // =====================================================

  private validateRelatedUser(
    userCard: UserCard,
    userId: string,
  ) {
    const isSender =
      userCard.senderId === userId;

    const isRecipient =
      userCard.recipientId === userId;

    if (!isSender && !isRecipient) {
      throw new ForbiddenException(
        'No tienes permiso para ver esta tarjeta',
      );
    }
  }
}
