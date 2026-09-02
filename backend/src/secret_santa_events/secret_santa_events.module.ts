import { Module,} from '@nestjs/common';
import { TypeOrmModule, } from '@nestjs/typeorm';
import { SecretSantaEventsService, } from './secret_santa_events.service';
import { SecretSantaEventsController, } from './secret_santa_events.controller';

import {
  SecretSantaEvent,
} from './entities/secret_santa_event.entity';

import {
  Group,
} from '../groups/entities/group.entity';

import {
  GroupMember,
} from '../group_members/entities/group_member.entity';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SecretSantaEvent,
      Group,
      GroupMember,
    ]),

    AuthModule,
  ],

  controllers: [
    SecretSantaEventsController,
  ],

  providers: [
    SecretSantaEventsService,
    JwtAuthGuard,
  ],

  exports: [
    SecretSantaEventsService,
    TypeOrmModule,
  ],
})
export class SecretSantaEventsModule {}
