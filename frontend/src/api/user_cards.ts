import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateUserCard,
  UpdateUserCard,
  UserCard,
} from '../types/user_cards.schema';

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

export const createUserCard = async (
  data: CreateUserCard,
): Promise<UserCard> => {
  const response = await api.post<UserCard>(
    '/user-cards',
    data,
  );

  return response.data;
};

export const getSentUserCards = async (): Promise<UserCard[]> => {
  const response = await api.get<UserCard[]>(
    '/user-cards/sent',
  );

  return response.data;
};

export const getReceivedUserCards = async (): Promise<UserCard[]> => {
  const response = await api.get<UserCard[]>(
    '/user-cards/received',
  );

  return response.data;
};

export const getUserCardById = async (
  id: string,
): Promise<UserCard> => {
  const response = await api.get<UserCard>(
    `/user-cards/${id}`,
  );

  return response.data;
};

export const updateUserCard = async (
  id: string,
  data: UpdateUserCard,
): Promise<UserCard> => {
  const response = await api.patch<UserCard>(
    `/user-cards/${id}`,
    data,
  );

  return response.data;
};

export const sendUserCard = async (
  id: string,
): Promise<UserCard> => {
  const response = await api.patch<UserCard>(
    `/user-cards/${id}/send`,
  );

  return response.data;
};

export const markUserCardAsRead = async (
  id: string,
): Promise<UserCard> => {
  const response = await api.patch<UserCard>(
    `/user-cards/${id}/read`,
  );

  return response.data;
};

export const cancelUserCard = async (
  id: string,
): Promise<UserCard> => {
  const response = await api.patch<UserCard>(
    `/user-cards/${id}/cancel`,
  );

  return response.data;
};