export type GroupVisibility =
  | 'private'
  | 'public';

export type GroupJoinMode = 'link' | 'approval' | 'closed';

export type GroupStatus =
  | 'active'
  | 'archived';

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  themeColor: string;
  imagePublicId?: string | null;
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
  selectedEventId?: string | null;
}

export interface CreateGroup {
  name: string;
  description?: string;
  themeColor?: string;
  visibility?: GroupVisibility;
  joinMode?: GroupJoinMode;
  maximumMembers?: number;
  invitationExpiresAt?: string;
  invitationEnabled?: boolean;
}

export interface UpdateGroup {
  name?: string;
  description?: string;
  themeColor?: string;
  visibility?: GroupVisibility;
  joinMode?: GroupJoinMode;
  maximumMembers?: number;
  invitationExpiresAt?: string;
  invitationEnabled?: boolean;
  selectedEventId?: string | null;
}