export type GroupMemberRole = 'owner' | 'admin' | 'member';

export type MembershipStatus =
  | 'pending'
  | 'active'
  | 'rejected'
  | 'left'
  | 'removed';

export type JoinedBy =
  | 'owner'
  | 'invitation_link'
  | 'direct_invitation';

export interface GroupMember {
  id: string;
  groupId: string;
  // La respuesta del backend envía los datos del usuario, no userId plano.
  user?: { id: string; username: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null;
  isGuest: boolean;
  guestName: string | null;
  guestAvatarUrl: string | null;
  role: GroupMemberRole;
  membershipStatus: MembershipStatus;
  userId?: string | null;
  joinedBy?: JoinedBy;
  joinedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupMember {
  userId: string;
  role?: GroupMemberRole;
}

export interface UpdateGroupMember {
  role?: GroupMemberRole;
  membershipStatus?: MembershipStatus;
}