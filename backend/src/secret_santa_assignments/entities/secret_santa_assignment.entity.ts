import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import {
  SecretSantaEvent,
} from '../../secret_santa_events/entities/secret_santa_event.entity';

import {
  User,
} from '../../users/entities/user.entity';

export enum GiftStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
}

@Entity({
  name: 'secret_santa_assignments',
})
@Unique(
  'uk_secret_santa_assignments_giver',
  ['eventId', 'giverId'],
)
@Unique(
  'uk_secret_santa_assignments_receiver',
  ['eventId', 'receiverId'],
)
@Check(
  'chk_secret_santa_assignments_users',
  '"id_users_giver" <> "id_users_receiver"',
)
export class SecretSantaAssignment {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_secret_santa_assignments',
  })
  id: string;

  @Column({
    name: 'id_secret_santa_events',
    type: 'uuid',
  })
  eventId: string;

  @Column({
    name: 'id_users_giver',
    type: 'uuid',
  })
  giverId: string;

  @Column({
    name: 'id_users_receiver',
    type: 'uuid',
  })
  receiverId: string;

  @Column({
    name: 'gift_status',
    type: 'varchar',
    length: 20,
    default: GiftStatus.PENDING,
  })
  giftStatus: GiftStatus;

  @Column({
    name: 'assigned_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  assignedAt: Date;

  @Column({
    name: 'delivered_at',
    type: 'timestamptz',
    nullable: true,
  })
  deliveredAt: Date | null;

  @ManyToOne(
    () => SecretSantaEvent,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'id_secret_santa_events',
    referencedColumnName: 'id',
  })
  event: SecretSantaEvent;

  @ManyToOne(
    () => User,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_giver',
    referencedColumnName: 'id',
  })
  giver: User;

  @ManyToOne(
    () => User,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_receiver',
    referencedColumnName: 'id',
  })
  receiver: User;
}