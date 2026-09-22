import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupMember } from './entities/group_member.entity';
import { GroupMembersController } from './group_members.controller';
import { GroupMembersService } from './group_members.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupMember,
    ]),
    AuthModule,
  ],

  controllers: [
    GroupMembersController,
  ],

  providers: [
    GroupMembersService,
  ],

  exports: [
    GroupMembersService,
  ],
})
export class GroupMembersModule {}