import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

import {
  Card,
  CardCategory,
} from './entities/card.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardsRepository: Repository<Card>,
  ) {}

  // =====================================================
  // CREAR TARJETA
  // =====================================================

  async create(
    userId: string,
    createCardDto: CreateCardDto,
  ) {
    const card = this.cardsRepository.create({
      ...createCardDto,

      creatorId: userId,

      category:
        createCardDto.category ??
        CardCategory.CHRISTMAS,

      isPublic:
        createCardDto.isPublic ??
        false,

      isActive: true,
    });

    return await this.cardsRepository.save(card);
  }

  // =====================================================
  // LISTAR TARJETAS PÚBLICAS
  // =====================================================

  async findPublic() {
    return await this.cardsRepository.find({
      where: {
        isPublic: true,
        isActive: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // OBTENER UNA TARJETA PÚBLICA
  // =====================================================

  async findPublicOne(id: string) {
    const card =
      await this.cardsRepository.findOne({
        where: {
          id,
          isPublic: true,
          isActive: true,
        },
      });

    if (!card) {
      throw new NotFoundException(
        'Tarjeta pública no encontrada',
      );
    }

    return card;
  }

  // =====================================================
  // LISTAR TARJETAS DEL USUARIO AUTENTICADO
  // =====================================================

  async findMyCards(userId: string) {
    return await this.cardsRepository.find({
      where: {
        creatorId: userId,
        isActive: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =====================================================
  // OBTENER UNA TARJETA PROPIA
  // =====================================================

  async findMyCard(
    id: string,
    userId: string,
  ) {
    const card =
      await this.findActiveCardById(id);

    this.validateOwnership(
      card,
      userId,
    );

    return card;
  }

  // =====================================================
  // ACTUALIZAR TARJETA
  // =====================================================

  async update(
    id: string,
    userId: string,
    updateCardDto: UpdateCardDto,
  ) {
    const card =
      await this.findActiveCardById(id);

    this.validateOwnership(
      card,
      userId,
    );

    Object.assign(
      card,
      updateCardDto,
    );

    return await this.cardsRepository.save(card);
  }

  // =====================================================
  // DESACTIVAR TARJETA
  // =====================================================

  async remove(
    id: string,
    userId: string,
  ) {
    const card =
      await this.findActiveCardById(id);

    this.validateOwnership(
      card,
      userId,
    );

    card.isActive = false;

    await this.cardsRepository.save(card);

    return {
      message:
        'Tarjeta desactivada correctamente',
      id: card.id,
    };
  }

  // =====================================================
  // BUSCAR TARJETA ACTIVA
  // =====================================================

  private async findActiveCardById(
    id: string,
  ) {
    const card =
      await this.cardsRepository.findOne({
        where: {
          id,
          isActive: true,
        },
      });

    if (!card) {
      throw new NotFoundException(
        'Tarjeta no encontrada',
      );
    }

    return card;
  }

  // =====================================================
  // VALIDAR PROPIETARIO
  // =====================================================

  private validateOwnership(
    card: Card,
    userId: string,
  ) {
    if (card.creatorId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta tarjeta',
      );
    }
  }
}