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

export enum CardCategory {
  CHRISTMAS = 'christmas',
  NEW_YEAR = 'new_year',
  SECRET_SANTA = 'secret_santa',
  CUSTOM = 'custom',
}

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_cards',
  })
  id: string;

  @Column({
    name: 'id_users_creator',
    type: 'uuid',
    nullable: true,
  })
  creatorId: string | null;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 150,
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
    name: 'front_image_url',
    type: 'varchar',
    length: 1000,
  })
  frontImageUrl: string;

  @Column({
    name: 'background_image_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  backgroundImageUrl: string | null;

  @Column({
    name: 'preview_image_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  previewImageUrl: string | null;

  @Column({
    name: 'category',
    type: 'varchar',
    length: 30,
    default: CardCategory.CHRISTMAS,
  })
  category: CardCategory;

  @Column({
    name: 'is_public',
    type: 'boolean',
    default: false,
  })
  isPublic: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

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
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'id_users_creator',
    referencedColumnName: 'id',
  })
  creator: User | null;
}

