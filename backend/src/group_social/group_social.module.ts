
 // backend/src/group_social/group_social.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';

import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group_members/entities/group_member.entity';
import { User } from '../users/entities/user.entity';
import { Wishlist } from '../wishlists/entities/wishlist.entity';
import { WishlistItem } from '../wishlist_items/entities/wishlist_item.entity';

import { GroupSocialController } from './group_social.controller';
import { GroupSocialService } from './group_social.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      User,
      Wishlist,
      WishlistItem,
    ]),
    AuthModule,
  ],
  controllers: [GroupSocialController],
  providers: [GroupSocialService],
})
export class GroupSocialModule {}
