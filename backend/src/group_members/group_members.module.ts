import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupMember } from './entities/group_member.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GuestsController, GuestSelfController } from './guests.controller';
import { GroupMembersController } from './group_members.controller';
import { GroupMembersService } from './group_members.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupMember, Group, User,
    ]),
    AuthModule,
  ],

  controllers: [
    GroupMembersController, GuestsController, GuestSelfController,
  ],

  providers: [
    GroupMembersService,
  ],

  exports: [
    GroupMembersService,
  ],
})
export class GroupMembersModule {}