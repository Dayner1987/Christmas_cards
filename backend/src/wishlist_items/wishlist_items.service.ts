import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistItemsRepository:
      Repository<WishlistItem>,

    private readonly wishlistsService:
      WishlistsService,
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

        imageUrl:
          dto.imageUrl ?? null,

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

    await this.wishlistItemsRepository.remove(
      item,
    );

    return {
      message:
        'Elemento eliminado correctamente',
    };
  }
}