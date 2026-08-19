import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum WishlistVisibility {
  PRIVATE = 'private',
  GROUPS = 'groups',
  PUBLIC = 'public',
}

export enum WishlistStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('wishlists')
@Index(
  'uk_wishlists_default_user',
  ['userId'],
  {
    unique: true,
    where: '"is_default" = TRUE',
  },
)
export class Wishlist {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_wishlists',
  })
  id: string;

  @Column('uuid', {
    name: 'id_users',
  })
  userId: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'Mi lista de deseos',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: WishlistVisibility.GROUPS,
  })
  visibility: WishlistVisibility;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  isDefault: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: WishlistStatus.ACTIVE,
  })
  status: WishlistStatus;

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

  @ManyToOne(
    () => User,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'id_users',
    referencedColumnName: 'id',
  })
  user: User;
}