import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { SecretSantaEvent } from '../secret_santa_events/entities/secret_santa_event.entity';
import { GroupMember } from '../group_members/entities/group_member.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      SecretSantaEvent,
    ]),
    UsersModule,
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