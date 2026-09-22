import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateWishlist,
  UpdateWishlist,
  Wishlist,
} from '../types/wishlists.schema';

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
