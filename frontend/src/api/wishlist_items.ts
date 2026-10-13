import { api, imageForm } from './http';

import type {
  CreateWishlistItem,
  UpdateWishlistItem,
  WishlistItem,
} from '../types/wishlist_items.schema';



export const getWishlistItems = async (
  wishlistId: string,
): Promise<WishlistItem[]> => {
  const response = await api.get<WishlistItem[]>(
    `/wishlists/${wishlistId}/items`,
  );

  return response.data;
};

export const getWishlistItemById = async (
  wishlistId: string,
  itemId: string,
): Promise<WishlistItem> => {
  const response = await api.get<WishlistItem>(
    `/wishlists/${wishlistId}/items/${itemId}`,
  );

  return response.data;
};

export const createWishlistItem = async (
  wishlistId: string,
  data: CreateWishlistItem,
): Promise<WishlistItem> => {
  const response = await api.post<WishlistItem>(
    `/wishlists/${wishlistId}/items`,
    data,
  );

  return response.data;
};

export const updateWishlistItem = async (
  wishlistId: string,
  itemId: string,
  data: UpdateWishlistItem,
): Promise<WishlistItem> => {
  const response = await api.patch<WishlistItem>(
    `/wishlists/${wishlistId}/items/${itemId}`,
    data,
  );

  return response.data;
};

export const deleteWishlistItem = async (
  wishlistId: string,
  itemId: string,
): Promise<void> => {
  await api.delete(
    `/wishlists/${wishlistId}/items/${itemId}`,
  );
};
export async function uploadWishlistItemImage(wishlistId: string, itemId: string, file: File): Promise<WishlistItem> {
  return (await api.post<WishlistItem>(`/wishlists/${wishlistId}/items/${itemId}/image`, imageForm(file))).data;
}
export async function deleteWishlistItemImage(wishlistId: string, itemId: string): Promise<WishlistItem> {
  return (await api.delete<WishlistItem>(`/wishlists/${wishlistId}/items/${itemId}/image`)).data;
}
