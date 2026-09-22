export type DeliveryChannel =
  | 'application'
  | 'whatsapp'
  | 'email'
  | 'link';

export type DeliveryStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'cancelled';

export interface UserCard {
  id: string;
  cardId: string;
  senderId: string;
  recipientId: string;
  groupId: string | null;
  title: string | null;
  message: string;
  senderName: string | null;
  recipientName: string | null;
  deliveryChannel: DeliveryChannel;
  deliveryStatus: DeliveryStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserCard {
  cardId: string;
  recipientId: string;
  groupId?: string;
  title?: string;
  message: string;
  senderName?: string;
  recipientName?: string;
  deliveryChannel?: DeliveryChannel;
  scheduledAt?: string;
}

export type UpdateUserCard = Partial<CreateUserCard>;