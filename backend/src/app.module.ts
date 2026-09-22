import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { ScheduleModule } from '@nestjs/schedule';

import { typeOrmConfig } from './config/typeorm.config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { GroupMembersModule } from './group_members/group_members.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { WishlistItemsModule } from './wishlist_items/wishlist_items.module';
import { CardsModule } from './cards/cards.module';
import { UserCardsModule } from './user_cards/user_cards.module';
import { SecretSantaEventsModule } from './secret_santa_events/secret_santa_events.module';
import { SecretSantaAssignmentsModule } from './secret_santa_assignments/secret_santa_assignments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) =>
        typeOrmConfig(configService),
    }),

    AuthModule,
    UsersModule,
    GroupsModule,
    GroupMembersModule,
    WishlistsModule,
    WishlistItemsModule,
    CardsModule,
    UserCardsModule,
    SecretSantaEventsModule,
    SecretSantaAssignmentsModule,
  ],
})
export class AppModule {}