import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  UserCardsService,
} from './user_cards.service';

import {
  UserCardsController,
} from './user_cards.controller';

import {
  UserCard,
} from './entities/user_card.entity';

import {
  Card,
} from '../cards/entities/card.entity';

import {
  User,
} from '../users/entities/user.entity';

import {
  Group,
} from '../groups/entities/group.entity';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCard,
      Card,
      User,
      Group,
    ]),

    AuthModule,
  ],

  controllers: [
    UserCardsController,
  ],

  providers: [
    UserCardsService,
    JwtAuthGuard,
  ],

  exports: [
    UserCardsService,
    TypeOrmModule,
  ],
})
export class UserCardsModule {}