export type WishlistVisibility =
  | 'private'
  | 'groups'
  | 'public';

export type WishlistStatus =
  | 'active'
  | 'archived';

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  visibility: WishlistVisibility;
  isDefault: boolean;
  status: WishlistStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlist {
  name?: string;
  description?: string;
  visibility?: WishlistVisibility;
  isDefault?: boolean;
}

export interface UpdateWishlist {
  name?: string;
  description?: string;
  visibility?: WishlistVisibility;
  isDefault?: boolean;
  status?: WishlistStatus;
}