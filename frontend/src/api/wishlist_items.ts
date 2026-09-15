import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateWishlistItem,
  UpdateWishlistItem,
  WishlistItem,
} from '../types/wishlist_items.schema';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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