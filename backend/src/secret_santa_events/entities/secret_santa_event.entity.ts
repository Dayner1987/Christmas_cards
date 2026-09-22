import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  Group,
} from '../../groups/entities/group.entity';

import {
  User,
} from '../../users/entities/user.entity';

export enum SecretSantaEventStatus {
  DRAFT = 'draft',
  DRAWN = 'drawn',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({
  name: 'secret_santa_events',
})
@Check(
  'chk_secret_santa_events_budget',
  '"budget" IS NULL OR "budget" >= 0',
)
@Check(
  'chk_secret_santa_events_dates',
  '"draw_date" IS NULL OR "gift_delivery_date" IS NULL OR "draw_date" <= "gift_delivery_date"',
)
export class SecretSantaEvent {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_secret_santa_events',
  })
  id: string;

  @Column({
    name: 'id_groups',
    type: 'uuid',
  })
  groupId: string;

  @Column({
    name: 'id_users_creator',
    type: 'uuid',
  })
  creatorId: string;

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
    name: 'budget',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  budget: number | null;

  @Column({
    name: 'currency_code',
    type: 'char',
    length: 3,
    default: 'BOB',
  })
  currencyCode: string;

  @Column({
    name: 'draw_date',
    type: 'timestamptz',
    nullable: true,
  })
  drawDate: Date | null;

  @Column({
    name: 'gift_delivery_date',
    type: 'timestamptz',
    nullable: true,
  })
  giftDeliveryDate: Date | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: SecretSantaEventStatus.DRAFT,
  })
  status: SecretSantaEventStatus;

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
    () => Group,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'id_groups',
    referencedColumnName: 'id',
  })
  group: Group;

  @ManyToOne(
    () => User,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_creator',
    referencedColumnName: 'id',
  })
  creator: User;
}