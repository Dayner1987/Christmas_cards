import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  WishlistItemsService,
} from './wishlist_items.service';

import {
  CreateWishlistItemDto,
} from './dto/create-wishlist_item.dto';

import {
  UpdateWishlistItemDto,
} from './dto/update-wishlist_item.dto';

@Controller(
  'wishlists/:wishlistId/items',
)
@UseGuards(JwtAuthGuard)
export class WishlistItemsController {
  constructor(
    private readonly wishlistItemsService:
      WishlistItemsService,
  ) {}

  @Post()
  create(
    @Param('wishlistId')
    wishlistId: string,

    @Req()
    request: any,

    @Body()
    dto: CreateWishlistItemDto,
  ) {
    return this.wishlistItemsService.create(
      wishlistId,
      request.user.sub,
      dto,
    );
  }

  @Get()
  findAll(
    @Param('wishlistId')
    wishlistId: string,

    @Req()
    request: any,
  ) {
    return this.wishlistItemsService.findAll(
      wishlistId,
      request.user.sub,
    );
  }

  @Get(':itemId')
  findOne(
    @Param('wishlistId')
    wishlistId: string,

    @Param('itemId')
    itemId: string,

    @Req()
    request: any,
  ) {
    return this.wishlistItemsService.findOne(
      wishlistId,
      itemId,
      request.user.sub,
    );
  }

  @Patch(':itemId')
  update(
    @Param('wishlistId')
    wishlistId: string,

    @Param('itemId')
    itemId: string,

    @Req()
    request: any,

    @Body()
    dto: UpdateWishlistItemDto,
  ) {
    return this.wishlistItemsService.update(
      wishlistId,
      itemId,
      request.user.sub,
      dto,
    );
  }

  @Delete(':itemId')
  remove(
    @Param('wishlistId')
    wishlistId: string,

    @Param('itemId')
    itemId: string,

    @Req()
    request: any,
  ) {
    return this.wishlistItemsService.remove(
      wishlistId,
      itemId,
      request.user.sub,
    );
  }
}