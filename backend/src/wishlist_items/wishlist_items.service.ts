import { Injectable } from '@nestjs/common';
import { CreateWishlistItemDto } from './dto/create-wishlist_item.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist_item.dto';

@Injectable()
export class WishlistItemsService {
  create(createWishlistItemDto: CreateWishlistItemDto) {
    return 'This action adds a new wishlistItem';
  }

  findAll() {
    return `This action returns all wishlistItems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wishlistItem`;
  }

  update(id: number, updateWishlistItemDto: UpdateWishlistItemDto) {
    return `This action updates a #${id} wishlistItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} wishlistItem`;
  }
}
