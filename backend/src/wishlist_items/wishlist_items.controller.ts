import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WishlistItemsService } from './wishlist_items.service';
import { CreateWishlistItemDto } from './dto/create-wishlist_item.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist_item.dto';

@Controller('wishlist-items')
export class WishlistItemsController {
  constructor(private readonly wishlistItemsService: WishlistItemsService) {}

  @Post()
  create(@Body() createWishlistItemDto: CreateWishlistItemDto) {
    return this.wishlistItemsService.create(createWishlistItemDto);
  }

  @Get()
  findAll() {
    return this.wishlistItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistItemsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWishlistItemDto: UpdateWishlistItemDto) {
    return this.wishlistItemsService.update(+id, updateWishlistItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wishlistItemsService.remove(+id);
  }
}
