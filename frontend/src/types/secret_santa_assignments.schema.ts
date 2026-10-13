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
export interface SecretSantaDrawResponse { message: string; eventId: string; participants: number; status: 'drawn'; }
export interface SecretSantaPrivateAssignment {
  id: string; eventId: string; giftStatus: GiftStatus; assignedAt: string; deliveredAt: string | null;
  receiver: { id: string; name: string; avatarUrl?: string | null; isGuest: boolean };
  wishlist: Array<{ name: string; description?: string | null; note?: string | null; productUrl?: string | null; imageUrl?: string | null }>;
}
