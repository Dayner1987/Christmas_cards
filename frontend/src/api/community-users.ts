// src/api/community-users.ts

import { getGroupMembers } from './group-members';

import type {
  GroupMemberRole,
} from '../types/group_members.schema';

export interface CommunityUser {
  id: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
  role: GroupMemberRole;
}

/**
 * Obtiene los participantes visibles de un grupo.
 * Funciona con usuarios registrados e invitados.
 */
export async function getCommunityUsers(
  groupId: string,
): Promise<CommunityUser[]> {
  if (!groupId.trim()) {
    throw new Error('El grupo es obligatorio.');
  }

  const members = await getGroupMembers(groupId);

  return members.map((member) => {
    const user = member.user;

    const fullName = [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id: member.id,
      userId: user?.id ?? null,
      displayName: member.isGuest
        ? member.guestName || 'Invitado'
        : fullName || user?.username || 'Usuario',
      avatarUrl: member.isGuest
        ? member.guestAvatarUrl
        : user?.avatarUrl ?? null,
      isGuest: member.isGuest,
      role: member.role,
    };
  });
}
