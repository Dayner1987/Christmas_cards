import { api, imageForm } from './http';

import type {
  Card,
  CreateCard,
  UpdateCard,
} from '../types/cards.schema';



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
export type CardImageSlot = 'front' | 'background' | 'preview';
export async function uploadCardImage(id: string, slot: CardImageSlot, file: File): Promise<Card> {
  return (await api.post<Card>(`/cards/${id}/images/${slot}`, imageForm(file))).data;
}
export async function deleteCardImage(id: string, slot: CardImageSlot): Promise<Card> {
  return (await api.delete<Card>(`/cards/${id}/images/${slot}`)).data;
}
export async function getAdminCards(): Promise<Card[]> {
  return (await api.get<Card[]>('/cards/admin')).data;
}
