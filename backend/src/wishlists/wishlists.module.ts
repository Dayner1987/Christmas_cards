import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  Wishlist,
} from './entities/wishlist.entity';

import {
  WishlistsController,
} from './wishlists.controller';

import {
  WishlistsService,
} from './wishlists.service';

import {
  AuthModule,
} from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wishlist,
    ]),

    AuthModule,
  ],

  controllers: [
    WishlistsController,
  ],

  providers: [
    WishlistsService,
  ],

  exports: [
    WishlistsService,
  ],
})
export class WishlistsModule {}