export type GiftStatus =
  | 'pending'
  | 'delivered';

export interface SecretSantaAssignment {
  id: string;
  eventId: string;
  giverId: string;
  receiverId: string;
  giftStatus: GiftStatus;
  assignedAt: string;
  deliveredAt: string | null;
}

export interface SecretSantaAssignmentWithUsers
  extends SecretSantaAssignment {
  giver?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };

  receiver?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface SecretSantaSummaryItem {
  giverId: string;
  receiverId: string;
  giftStatus: GiftStatus;
  assignedAt: string;
  deliveredAt: string | null;
}