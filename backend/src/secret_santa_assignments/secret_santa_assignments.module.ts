import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  SecretSantaAssignmentsService,
} from './secret_santa_assignments.service';

import {
  SecretSantaAssignmentsController,
} from './secret_santa_assignments.controller';

import {
  SecretSantaAssignment,
} from './entities/secret_santa_assignment.entity';

import {
  SecretSantaEvent,
} from '../secret_santa_events/entities/secret_santa_event.entity';

import {
  Group,
} from '../groups/entities/group.entity';

import {
  GroupMember,
} from '../group_members/entities/group_member.entity';

import {
  User,
} from '../users/entities/user.entity';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SecretSantaAssignment,
      SecretSantaEvent,
      Group,
      GroupMember,
      User,
    ]),

    AuthModule,
  ],

  controllers: [
    SecretSantaAssignmentsController,
  ],

  providers: [
    SecretSantaAssignmentsService,
    JwtAuthGuard,
  ],

  exports: [
    SecretSantaAssignmentsService,
    TypeOrmModule,
  ],
})
export class SecretSantaAssignmentsModule {}