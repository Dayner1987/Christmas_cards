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
  userId: string;
  role: GroupMemberRole;
  membershipStatus: MembershipStatus;
  joinedBy: JoinedBy;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupMember {
  userId: string;
  role?: GroupMemberRole;
}

export interface UpdateGroupMember {
  role?: GroupMemberRole;
  membershipStatus?: MembershipStatus;
}