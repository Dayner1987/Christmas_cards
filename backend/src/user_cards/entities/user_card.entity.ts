
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
  Card,
} from '../../cards/entities/card.entity';

import {
  User,
} from '../../users/entities/user.entity';

import {
  Group,
} from '../../groups/entities/group.entity';

export enum DeliveryChannel {
  APPLICATION = 'application',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  LINK = 'link',
}

export enum DeliveryStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  CANCELLED = 'cancelled',
}

@Entity({
  name: 'user_cards',
})
@Check(
  'chk_user_cards_different_users',
  '"id_users_sender" <> "id_users_recipient"',
)
export class UserCard {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_user_cards',
  })
  id: string;

  @Column({
    name: 'id_cards',
    type: 'uuid',
  })
  cardId: string;

  @Column({
    name: 'id_users_sender',
    type: 'uuid',
  })
  senderId: string;

  @Column({
    name: 'id_users_recipient',
    type: 'uuid',
  })
  recipientId: string;

  @Column({
    name: 'id_groups',
    type: 'uuid',
    nullable: true,
  })
  groupId: string | null;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  title: string | null;

  @Column({
    name: 'message',
    type: 'text',
  })
  message: string;

  @Column({
    name: 'sender_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  senderName: string | null;

  @Column({
    name: 'recipient_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  recipientName: string | null;

  @Column({
    name: 'delivery_channel',
    type: 'varchar',
    length: 20,
    default: DeliveryChannel.APPLICATION,
  })
  deliveryChannel: DeliveryChannel;

  @Column({
    name: 'delivery_status',
    type: 'varchar',
    length: 20,
    default: DeliveryStatus.DRAFT,
  })
  deliveryStatus: DeliveryStatus;

  @Column({
    name: 'scheduled_at',
    type: 'timestamptz',
    nullable: true,
  })
  scheduledAt: Date | null;

  @Column({
    name: 'sent_at',
    type: 'timestamptz',
    nullable: true,
  })
  sentAt: Date | null;

  @Column({
    name: 'delivered_at',
    type: 'timestamptz',
    nullable: true,
  })
  deliveredAt: Date | null;

  @Column({
    name: 'read_at',
    type: 'timestamptz',
    nullable: true,
  })
  readAt: Date | null;

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
    () => Card,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_cards',
    referencedColumnName: 'id',
  })
  card: Card;

  @ManyToOne(
    () => User,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_sender',
    referencedColumnName: 'id',
  })
  sender: User;

  @ManyToOne(
    () => User,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_users_recipient',
    referencedColumnName: 'id',
  })
  recipient: User;

  @ManyToOne(
    () => Group,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'id_groups',
    referencedColumnName: 'id',
  })
  group: Group | null;
}