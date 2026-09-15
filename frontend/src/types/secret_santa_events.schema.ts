export type SecretSantaEventStatus =
  | 'draft'
  | 'drawn'
  | 'completed'
  | 'cancelled';

export interface SecretSantaEvent {
  id: string;
  groupId: string;
  creatorId: string;
  name: string;
  description: string | null;
  budget: number | null;
  currencyCode: string;
  drawDate: string | null;
  giftDeliveryDate: string | null;
  status: SecretSantaEventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecretSantaEvent {
  groupId: string;
  name: string;
  description?: string;
  budget?: number;
  currencyCode?: string;
  drawDate?: string;
  giftDeliveryDate?: string;
}

export type UpdateSecretSantaEvent = Partial<
  Omit<CreateSecretSantaEvent, 'groupId'>
>;