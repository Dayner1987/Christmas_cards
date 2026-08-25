import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  WishlistItem,
} from './entities/wishlist_item.entity';

import {
  WishlistItemsController,
} from './wishlist_items.controller';

import {
  WishlistItemsService,
} from './wishlist_items.service';

import {
  WishlistsModule,
} from '../wishlists/wishlists.module';

import {
  AuthModule,
} from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WishlistItem,
    ]),

    WishlistsModule,

    AuthModule,
  ],

  controllers: [
    WishlistItemsController,
  ],

  providers: [
    WishlistItemsService,
  ],

  exports: [
    WishlistItemsService,
  ],
})
export class WishlistItemsModule {}