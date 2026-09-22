import {
  Body,
  Controller,
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
  WishlistsService,
} from './wishlists.service';

import {
  CreateWishlistDto,
} from './dto/create-wishlist.dto';

import {
  UpdateWishlistDto,
} from './dto/update-wishlist.dto';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(
    private readonly wishlistsService:
      WishlistsService,
  ) {}

  @Post()
  create(
    @Req() request: any,
    @Body() dto: CreateWishlistDto,
  ) {
    return this.wishlistsService.create(
      request.user.sub,
      dto,
    );
  }

  @Get()
  findAll(
    @Req() request: any,
  ) {
    return this.wishlistsService
      .findAllByUser(
        request.user.sub,
      );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() request: any,
  ) {
    return this.wishlistsService.findOne(
      id,
      request.user.sub,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: any,
    @Body() dto: UpdateWishlistDto,
  ) {
    return this.wishlistsService.update(
      id,
      request.user.sub,
      dto,
    );
  }

  @Patch(':id/archive')
  archive(
    @Param('id') id: string,
    @Req() request: any,
  ) {
    return this.wishlistsService.archive(
      id,
      request.user.sub,
    );
  }
}