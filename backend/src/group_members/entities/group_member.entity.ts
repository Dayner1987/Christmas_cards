import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum MembershipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  LEFT = 'left',
  REMOVED = 'removed',
}

export enum JoinedBy {
  OWNER = 'owner',
  INVITATION_LINK = 'invitation_link',
  DIRECT_INVITATION = 'direct_invitation',
}

@Entity('group_members')
@Unique('uk_group_members_group_user', ['groupId', 'userId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_group_members',
  })
  id: string;

  @Column('uuid', {
    name: 'id_groups',
  })
  groupId: string;

  @Column('uuid', {
    name: 'id_users',
  })
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  @Column({
    name: 'membership_status',
    type: 'varchar',
    length: 20,
    default: MembershipStatus.ACTIVE,
  })
  membershipStatus: MembershipStatus;

  @Column({
    name: 'joined_by',
    type: 'varchar',
    length: 30,
    default: JoinedBy.INVITATION_LINK,
  })
  joinedBy: JoinedBy;

  @Column({
    name: 'joined_at',
    type: 'timestamptz',
    nullable: true,
  })
  joinedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  @ManyToOne(() => Group, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_groups',
    referencedColumnName: 'id',
  })
  group: Group;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_users',
    referencedColumnName: 'id',
  })
  user: User;
}