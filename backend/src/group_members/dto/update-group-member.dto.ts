import { IsEnum, IsOptional } from 'class-validator';
import {
  GroupMemberRole,
  MembershipStatus,
} from '../entities/group_member.entity';

export class UpdateGroupMemberDto {
  @IsOptional()
  @IsEnum(GroupMemberRole)
  role?: GroupMemberRole;

  @IsOptional()
  @IsEnum(MembershipStatus)
  membershipStatus?: MembershipStatus;
}