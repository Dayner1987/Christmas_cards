import { Module } from '@nestjs/common';
import { WishlistItemsService } from './wishlist_items.service';
import { WishlistItemsController } from './wishlist_items.controller';

@Module({
  controllers: [WishlistItemsController],
  providers: [WishlistItemsService],
})
export class WishlistItemsModule {}
