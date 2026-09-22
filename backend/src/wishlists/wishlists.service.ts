import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
} from 'typeorm';

import {
  Wishlist,
  WishlistStatus,
} from './entities/wishlist.entity';

import {
  CreateWishlistDto,
} from './dto/create-wishlist.dto';

import {
  UpdateWishlistDto,
} from './dto/update-wishlist.dto';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository:
      Repository<Wishlist>,

    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // CREAR LISTA
  // ==========================================

  async create(
    userId: string,
    dto: CreateWishlistDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const repository =
          manager.getRepository(Wishlist);

        if (dto.isDefault) {
          await repository.update(
            {
              userId,
              isDefault: true,
            },
            {
              isDefault: false,
            },
          );
        }

        const wishlist = repository.create({
          userId,

          name:
            dto.name ??
            'Mi lista de deseos',

          description:
            dto.description ?? null,

          visibility:
            dto.visibility,

          isDefault:
            dto.isDefault ?? false,

          status:
            WishlistStatus.ACTIVE,
        });

        return repository.save(wishlist);
      },
    );
  }

  // ==========================================
  // OBTENER MIS LISTAS
  // ==========================================

  async findAllByUser(userId: string) {
    return this.wishlistsRepository.find({
      where: {
        userId,
      },
      order: {
        isDefault: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  // ==========================================
  // OBTENER UNA LISTA
  // ==========================================

  async findOne(
    id: string,
    userId: string,
  ) {
    const wishlist =
      await this.wishlistsRepository.findOne({
        where: {
          id,
          userId,
        },
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Lista de deseos no encontrada',
      );
    }

    return wishlist;
  }

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  async update(
    id: string,
    userId: string,
    dto: UpdateWishlistDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const repository =
          manager.getRepository(Wishlist);

        const wishlist =
          await repository.findOne({
            where: {
              id,
              userId,
            },
          });

        if (!wishlist) {
          throw new NotFoundException(
            'Lista de deseos no encontrada',
          );
        }

        if (dto.isDefault === true) {
          await repository.update(
            {
              userId,
              isDefault: true,
            },
            {
              isDefault: false,
            },
          );
        }

        repository.merge(
          wishlist,
          dto,
        );

        return repository.save(wishlist);
      },
    );
  }

  // ==========================================
  // ARCHIVAR
  // ==========================================

  async archive(
    id: string,
    userId: string,
  ) {
    const wishlist =
      await this.findOne(
        id,
        userId,
      );

    wishlist.status =
      WishlistStatus.ARCHIVED;

    wishlist.isDefault = false;

    return this.wishlistsRepository.save(
      wishlist,
    );
  }
}