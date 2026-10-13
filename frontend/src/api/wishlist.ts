import { api } from './http';

import type {
  CreateWishlist,
  UpdateWishlist,
  Wishlist,
} from '../types/wishlists.schema';



export const getWishlists = async (): Promise<Wishlist[]> => {
  const response = await api.get<Wishlist[]>('/wishlists');
  return response.data;
};

export const getWishlistById = async (
  wishlistId: string,
): Promise<Wishlist> => {
  const response = await api.get<Wishlist>(
    `/wishlists/${wishlistId}`,
  );

  return response.data;
};

export const createWishlist = async (
  data: CreateWishlist = {},
): Promise<Wishlist> => {
  const response = await api.post<Wishlist>(
    '/wishlists',
    data,
  );

  return response.data;
};

export const updateWishlist = async (
  wishlistId: string,
  data: UpdateWishlist,
): Promise<Wishlist> => {
  const response = await api.patch<Wishlist>(
    `/wishlists/${wishlistId}`,
    data,
  );

  return response.data;
};

export const archiveWishlist = async (
  wishlistId: string,
): Promise<Wishlist> => {
  const response = await api.patch<Wishlist>(
    `/wishlists/${wishlistId}/archive`,
  );

  return response.data;
};
