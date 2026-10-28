import {
  ForbiddenException,
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

import {
  Card,
  CardCategory,
} from './entities/card.entity';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  constructor(
    @InjectRepository(Card)
    private readonly cardsRepository: Repository<Card>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
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
      frontImageUrl: null,
      backgroundImageUrl: null,
      previewImageUrl: null,

      category:
        createCardDto.category ??
        CardCategory.CHRISTMAS,

      isPublic: createCardDto.isPublic ?? true,

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

    await this.validateOwnership(
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

    await this.validateOwnership(
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

    await this.validateOwnership(
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

  async findAllForAdmin(actorId: string) {
    await this.usersService.assertAccess(actorId, undefined, true);
    return this.cardsRepository.find({ order: { createdAt: 'DESC' } });
  }

  private getSlot(slot: string): { url: 'frontImageUrl' | 'backgroundImageUrl' | 'previewImageUrl'; id: 'frontImagePublicId' | 'backgroundImagePublicId' | 'previewImagePublicId' } {
    if (!['front', 'background', 'preview'].includes(slot)) throw new BadRequestException('Posición de imagen inválida.');
    return { url: `${slot}ImageUrl` as any, id: `${slot}ImagePublicId` as any };
  }

  async uploadImage(cardId: string, userId: string, slot: string, file: Express.Multer.File | undefined) {
    const card = await this.findActiveCardById(cardId);
    await this.validateOwnership(card, userId);
    const fields = this.getSlot(slot);
    const uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDERS.CARDS);
    const previousIds = new Set<string>();
    try {
      const updated = await this.cardsRepository.manager.transaction(async manager => {
        const repo = manager.getRepository(Card);
        const current = await repo.findOne({ where: { id: cardId }, lock: { mode: 'pessimistic_write' } });
        if (!current || !current.isActive) throw new NotFoundException('Tarjeta no encontrada.');
        if (current[fields.id]) previousIds.add(current[fields.id]!);
        if (slot === 'front') {
          if (current.backgroundImagePublicId) previousIds.add(current.backgroundImagePublicId);
          if (current.previewImagePublicId) previousIds.add(current.previewImagePublicId);
        }
        current[fields.id] = uploaded.publicId;
        current[fields.url] = uploaded.url;
        // La misma imagen sirve para portada, fondo y miniatura.
        // Solo se guarda UN publicId real para evitar borrados duplicados.
        if (slot === 'front') {
          current.backgroundImageUrl = uploaded.url;
          current.previewImageUrl = uploaded.url;
          current.backgroundImagePublicId = null;
          current.previewImagePublicId = null;
        }
        return repo.save(current);
      });
      for (const publicId of previousIds) {
        if (publicId !== uploaded.publicId) await this.cleanupImage(publicId);
      }
      return updated;
    } catch (error) {
      await this.cleanupImage(uploaded.publicId);
      throw error;
    }
  }

  async deleteImage(cardId: string, userId: string, slot: string) {
    const card = await this.findActiveCardById(cardId);
    await this.validateOwnership(card, userId);
    const fields = this.getSlot(slot);
    const previous = card[fields.id];
    const removedUrl = card[fields.url];
    card[fields.url] = null;
    card[fields.id] = null;
    if (slot === 'front') {
      if (card.previewImageUrl === removedUrl) card.previewImageUrl = null;
      if (card.backgroundImageUrl === removedUrl) card.backgroundImageUrl = null;
    }
    const saved = await this.cardsRepository.save(card);
    await this.cleanupImage(previous);
    return saved;
  }

  private async cleanupImage(id: string | null) {
    if (!id) return;
    try { await this.cloudinaryService.deleteImage(id); }
    catch { this.logger.warn(`Limpieza pendiente en Cloudinary: ${id}`); }
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

  private async validateOwnership(
    card: Card,
    userId: string,
  ) {
    const actor = await this.usersService.findOne(userId);
    if (card.creatorId !== userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta tarjeta',
      );
    }
  }
}