
 // src/api/group-social.ts

import { api } from './http';

export interface FriendWish {
  id: string;
  name: string;
  description: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  estimatedPrice: string | null;
}

export interface FriendWishlist {
  id: string;
  name: string;
  items: FriendWish[];
}

export interface FriendProfile {
  memberId: string;
  groupId: string;
  userId: string | null;
  isGuest: boolean;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  wishlists: FriendWishlist[];
}

export async function getFriendProfile(
  groupId: string,
  memberId: string,
): Promise<FriendProfile> {
  const response = await api.get<FriendProfile>(
    `/groups/${groupId}/social/members/${memberId}`,
  );

  return response.data;
}
