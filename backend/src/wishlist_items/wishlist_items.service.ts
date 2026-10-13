import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';

import {
  WishlistItem,
} from './entities/wishlist_item.entity';

import {
  CreateWishlistItemDto,
} from './dto/create-wishlist_item.dto';

import {
  UpdateWishlistItemDto,
} from './dto/update-wishlist_item.dto';

import {
  WishlistsService,
} from '../wishlists/wishlists.service';

@Injectable()
export class WishlistItemsService {
  private readonly logger = new Logger(WishlistItemsService.name);
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistItemsRepository:
      Repository<WishlistItem>,

    private readonly wishlistsService:
      WishlistsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    wishlistId: string,
    userId: string,
    dto: CreateWishlistItemDto,
  ) {
    await this.wishlistsService.findOne(
      wishlistId,
      userId,
    );

    const item =
      this.wishlistItemsRepository.create({
        wishlistId,

        name: dto.name,

        description:
          dto.description ?? null,

        productUrl:
          dto.productUrl ?? null,

        imageUrl: null,
        imagePublicId: null,

        estimatedPrice:
          dto.estimatedPrice ?? null,

        currencyCode:
          dto.currencyCode ?? 'BOB',

        priority:
          dto.priority,

        quantity:
          dto.quantity ?? 1,

        isReceived: false,
      });

    return this.wishlistItemsRepository.save(
      item,
    );
  }

  async findAll(
    wishlistId: string,
    userId: string,
  ) {
    await this.wishlistsService.findOne(
      wishlistId,
      userId,
    );

    return this.wishlistItemsRepository.find({
      where: {
        wishlistId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    wishlistId: string,
    itemId: string,
    userId: string,
  ) {
    await this.wishlistsService.findOne(
      wishlistId,
      userId,
    );

    const item =
      await this.wishlistItemsRepository.findOne({
        where: {
          id: itemId,
          wishlistId,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Elemento de lista de deseos no encontrado',
      );
    }

    return item;
  }

  async update(
    wishlistId: string,
    itemId: string,
    userId: string,
    dto: UpdateWishlistItemDto,
  ) {
    const item = await this.findOne(
      wishlistId,
      itemId,
      userId,
    );

    this.wishlistItemsRepository.merge(
      item,
      dto,
    );

    return this.wishlistItemsRepository.save(
      item,
    );
  }

  async uploadImage(wishlistId: string, itemId: string, userId: string, file: Express.Multer.File | undefined) {
    const item = await this.findOne(wishlistId, itemId, userId);
    const uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDERS.WISHLIST_ITEMS);
    let previous: string | null = null;
    try {
      const saved = await this.wishlistItemsRepository.manager.transaction(async manager => {
        const repo = manager.getRepository(WishlistItem);
        const current = await repo.findOne({ where: { id: item.id, wishlistId }, lock: { mode: 'pessimistic_write' } });
        if (!current) throw new NotFoundException('Elemento no encontrado.');
        previous = current.imagePublicId;
        current.imageUrl = uploaded.url;
        current.imagePublicId = uploaded.publicId;
        return repo.save(current);
      });
      await this.cleanupImage(previous);
      return saved;
    } catch (error) {
      await this.cleanupImage(uploaded.publicId);
      throw error;
    }
  }

  async deleteImage(wishlistId: string, itemId: string, userId: string) {
    const item = await this.findOne(wishlistId, itemId, userId);
    const previous = item.imagePublicId;
    item.imageUrl = null;
    item.imagePublicId = null;
    const saved = await this.wishlistItemsRepository.save(item);
    await this.cleanupImage(previous);
    return saved;
  }

  private async cleanupImage(id: string | null) {
    if (!id) return;
    try { await this.cloudinaryService.deleteImage(id); }
    catch { this.logger.warn(`Limpieza pendiente en Cloudinary: ${id}`); }
  }


  async remove(
    wishlistId: string,
    itemId: string,
    userId: string,
  ) {
    const item = await this.findOne(
      wishlistId,
      itemId,
      userId,
    );

    await this.wishlistItemsRepository.remove(item);
    await this.cleanupImage(item.imagePublicId);

    return {
      message:
        'Elemento eliminado correctamente',
    };
  }
}