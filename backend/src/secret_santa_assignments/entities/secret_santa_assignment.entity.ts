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

import { GroupMember } from '../../group_members/entities/group_member.entity';

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
@Unique('uk_secret_santa_assignments_giver_member', ['eventId', 'giverMemberId'])
@Unique('uk_secret_santa_assignments_receiver_member', ['eventId', 'receiverMemberId'])
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
    nullable: true,
  })
  giverId: string | null;

  @Column({
    name: 'id_users_receiver',
    type: 'uuid',
    nullable: true,
  })
  receiverId: string | null;

  @Column({ name: 'id_group_members_giver', type: 'uuid', nullable: true })
  giverMemberId: string | null;

  @Column({ name: 'id_group_members_receiver', type: 'uuid', nullable: true })
  receiverMemberId: string | null;

  @ManyToOne(() => GroupMember, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_group_members_giver', referencedColumnName: 'id' })
  giverMember: GroupMember | null;

  @ManyToOne(() => GroupMember, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_group_members_receiver', referencedColumnName: 'id' })
  receiverMember: GroupMember | null;

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
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_giver',
    referencedColumnName: 'id',
  })
  giver: User | null;

  @ManyToOne(
    () => User,
    {
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_receiver',
    referencedColumnName: 'id',
  })
  receiver: User | null;
}