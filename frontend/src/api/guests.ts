// src/api/guests.ts
import { api, imageForm } from './http';
export interface GuestWish { name: string; productUrl?: string; note?: string; }
export interface GuestProfile {
  memberId: string; groupId: string; name: string; status: 'active' | 'pending' | string;
  avatarUrl: string | null; wishlist: GuestWish[] | null;
  
group: GuestGroupInfo;
members: GuestGroupMember[];

}
const headers = (token: string) => ({ 'x-guest-token': token });
export async function getGuestProfile(token: string): Promise<GuestProfile> {
  return (await api.get<GuestProfile>('/guests/me', { headers: headers(token) })).data;
}
export async function saveGuestWishlist(token: string, items: GuestWish[]): Promise<GuestProfile> {
  return (await api.put<GuestProfile>('/guests/me/wishlist', { items }, { headers: headers(token) })).data;
}
export async function uploadGuestAvatar(token: string, file: File): Promise<GuestProfile> {
  return (await api.post<GuestProfile>('/guests/me/avatar', imageForm(file), { headers: headers(token) })).data;
}

// Agregar a src/api/guests.ts

import type {
  AuthResponse,
  RegisterData,
} from '../types/auth.schema';

export interface GuestEvent {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  budget: number | string | null;
  currencyCode: string;
  status: 'draft' | 'drawn' | 'completed';
  drawDate: string | null;
  giftDeliveryDate: string | null;
}

export interface GuestGroupMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  isGuest: boolean;
  role: string;
}

export interface GuestGroupInfo {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export type GuestRegistrationResult = AuthResponse & {
  groupId: string;
};

export async function getGuestEvents(
  token: string,
): Promise<GuestEvent[]> {
  const response = await api.get<GuestEvent[]>(
    '/secret-santa-guests/events',
    {
      headers: {
        'x-guest-token': token,
      },
    },
  );

  return response.data;
}

export async function registerGuestAccount(
  token: string,
  data: RegisterData,
): Promise<GuestRegistrationResult> {
  const response = await api.post<GuestRegistrationResult>(
    '/guests/me/register',
    data,
    {
      headers: {
        'x-guest-token': token,
      },
    },
  );

  return response.data;
}
