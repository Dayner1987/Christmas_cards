import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Wishlist } from '../../wishlists/entities/wishlist.entity';

export enum WishlistItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_wishlist_items',
  })
  id: string;

  @Column('uuid', {
    name: 'id_wishlists',
  })
  wishlistId: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 700,
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'product_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  productUrl: string | null;

  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  imageUrl: string | null;

  @Column({
    name: 'estimated_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  estimatedPrice: string | null;

  @Column({
    name: 'currency_code',
    type: 'char',
    length: 3,
    default: 'BOB',
  })
  currencyCode: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: WishlistItemPriority.MEDIUM,
  })
  priority: WishlistItemPriority;

  @Column({
    type: 'smallint',
    default: 1,
  })
  quantity: number;

  @Column({
    name: 'is_received',
    type: 'boolean',
    default: false,
  })
  isReceived: boolean;

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
    () => Wishlist,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'id_wishlists',
    referencedColumnName: 'id',
  })
  wishlist: Wishlist;
}