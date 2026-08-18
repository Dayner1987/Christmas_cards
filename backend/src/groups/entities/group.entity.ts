import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum GroupVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum GroupJoinMode {
  LINK = 'link',
  APPROVAL = 'approval',
  CLOSED = 'closed',
}

export enum GroupStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_groups',
  })
  id: string;

  @Column({
    name: 'id_users_owner',
    type: 'uuid',
  })
  ownerId: string;

  @ManyToOne(
    () => User,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_owner',
  })
  owner: User;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 120,
  })
  name: string;

  @Column({
    name: 'description',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  imageUrl: string | null;

  @Column({
    name: 'invitation_code',
    type: 'varchar',
    length: 100,
    unique: true,
  })
  invitationCode: string;

  @Column({
    name: 'invitation_url',
    type: 'varchar',
    length: 700,
    unique: true,
  })
  invitationUrl: string;

  @Column({
    name: 'visibility',
    type: 'varchar',
    length: 20,
    default: GroupVisibility.PRIVATE,
  })
  visibility: GroupVisibility;

  @Column({
    name: 'join_mode',
    type: 'varchar',
    length: 20,
    default: GroupJoinMode.LINK,
  })
  joinMode: GroupJoinMode;

  @Column({
    name: 'maximum_members',
    type: 'integer',
    nullable: true,
  })
  maximumMembers: number | null;

  @Column({
    name: 'invitation_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  invitationExpiresAt: Date | null;

  @Column({
    name: 'invitation_enabled',
    type: 'boolean',
    default: true,
  })
  invitationEnabled: boolean;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: GroupStatus.ACTIVE,
  })
  status: GroupStatus;

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
}