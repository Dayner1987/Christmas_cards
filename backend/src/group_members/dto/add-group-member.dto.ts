import { IsEnum, IsUUID } from 'class-validator';
import { GroupMemberRole } from '../entities/group_member.entity';

export class AddGroupMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(GroupMemberRole)
  role: GroupMemberRole;
}