import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Group } from './entities/group.entity';

import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
    ]),

    UsersModule,

    // IMPORTANTE:
    // JwtAuthGuard viene de AuthModule
    AuthModule,
  ],

  controllers: [
    GroupsController,
  ],

  providers: [
    GroupsService,
  ],

  exports: [
    GroupsService,
  ],
})
export class GroupsModule {}