export type CardCategory =
  | 'christmas'
  | 'new_year'
  | 'secret_santa'
  | 'custom';

export interface Card {
  id: string;
  creatorId: string | null;
  name: string;
  description: string | null;
  frontImageUrl: string;
  backgroundImageUrl: string | null;
  previewImageUrl: string | null;
  category: CardCategory;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCard {
  name: string;
  description?: string;
  frontImageUrl: string;
  backgroundImageUrl?: string;
  previewImageUrl?: string;
  category?: CardCategory;
  isPublic?: boolean;
}

export type UpdateCard = Partial<CreateCard>;