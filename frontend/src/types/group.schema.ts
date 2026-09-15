export type GroupVisibility =
  | 'private'
  | 'public';

export type GroupJoinMode =
  | 'invite_only'
  | 'invitation_link'
  | 'open';

export type GroupStatus =
  | 'active'
  | 'archived';

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  invitationCode: string | null;
  invitationUrl: string | null;
  visibility: GroupVisibility;
  joinMode: GroupJoinMode;
  maximumMembers: number | null;
  invitationExpiresAt: string | null;
  invitationEnabled: boolean;
  status: GroupStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroup {
  name: string;
  description?: string;
  imageUrl?: string;
  visibility?: GroupVisibility;
  joinMode?: GroupJoinMode;
  maximumMembers?: number;
  invitationExpiresAt?: string;
  invitationEnabled?: boolean;
}

export interface UpdateGroup {
  name?: string;
  description?: string;
  imageUrl?: string;
  visibility?: GroupVisibility;
  joinMode?: GroupJoinMode;
  maximumMembers?: number;
  invitationExpiresAt?: string;
  invitationEnabled?: boolean;
}