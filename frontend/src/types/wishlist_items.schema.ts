export type WishlistItemPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface WishlistItem {
  id: string;
  wishlistId: string;
  name: string;
  description: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  estimatedPrice: string | null;
  currencyCode: string;
  priority: WishlistItemPriority;
  quantity: number;
  isReceived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistItem {
  name: string;
  description?: string;
  productUrl?: string;
  imageUrl?: string;
  estimatedPrice?: string;
  currencyCode?: string;
  priority?: WishlistItemPriority;
  quantity?: number;
}

export interface UpdateWishlistItem {
  name?: string;
  description?: string;
  productUrl?: string;
  imageUrl?: string;
  estimatedPrice?: string;
  currencyCode?: string;
  priority?: WishlistItemPriority;
  quantity?: number;
  isReceived?: boolean;
}