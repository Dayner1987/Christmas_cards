import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  Card,
  CreateCard,
  UpdateCard,
} from '../types/cards.schema';

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

export const createCard = async (
  data: CreateCard,
): Promise<Card> => {
  const response = await api.post<Card>(
    '/cards',
    data,
  );

  return response.data;
};

export const getPublicCards = async (): Promise<Card[]> => {
  const response = await api.get<Card[]>(
    '/cards/public',
  );

  return response.data;
};

export const getPublicCardById = async (
  id: string,
): Promise<Card> => {
  const response = await api.get<Card>(
    `/cards/public/${id}`,
  );

  return response.data;
};

export const getMyCards = async (): Promise<Card[]> => {
  const response = await api.get<Card[]>(
    '/cards/my',
  );

  return response.data;
};

export const getMyCardById = async (
  id: string,
): Promise<Card> => {
  const response = await api.get<Card>(
    `/cards/my/${id}`,
  );

  return response.data;
};

export const updateCard = async (
  id: string,
  data: UpdateCard,
): Promise<Card> => {
  const response = await api.patch<Card>(
    `/cards/${id}`,
    data,
  );

  return response.data;
};

export const deleteCard = async (
  id: string,
): Promise<void> => {
  await api.delete(`/cards/${id}`);
};