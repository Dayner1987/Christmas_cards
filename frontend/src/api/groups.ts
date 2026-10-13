import { api, imageForm } from './http';

import type {
  CreateGroup,
  Group,
  UpdateGroup,
} from '../types/group.schema';



export const createGroup = async (
  data: CreateGroup,
): Promise<Group> => {
  const response = await api.post<Group>('/groups', data);

  return response.data;
};

export const getGroups = async (): Promise<Group[]> => {
  const response = await api.get<Group[]>('/groups');

  return response.data;
};

export const getMyGroups = async (): Promise<Group[]> => {
  const response = await api.get<Group[]>('/groups/me');

  return response.data;
};

export const getGroupByInvitationCode = async (
  code: string,
): Promise<Group> => {
  const response = await api.get<Group>(
    `/groups/invitation/${encodeURIComponent(code)}`,
  );

  return response.data;
};

export const getGroupById = async (
  id: string,
): Promise<Group> => {
  const response = await api.get<Group>(`/groups/${id}`);

  return response.data;
};

export const updateGroup = async (
  id: string,
  data: UpdateGroup,
): Promise<Group> => {
  const response = await api.patch<Group>(
    `/groups/${id}`,
    data,
  );

  return response.data;
};

export const archiveGroup = async (
  id: string,
): Promise<Group> => {
  const response = await api.patch<Group>(
    `/groups/${id}/archive`,
  );

  return response.data;
};

export const updateGroupInvitation = async (
  id: string,
): Promise<Group> => {
  const response = await api.patch<Group>(
    `/groups/${id}/invitation`,
  );

  return response.data;
};

export const deleteGroup = async (
  id: string,
): Promise<void> => {
  await api.delete(`/groups/${id}`);
};
export async function getAdminGroups(): Promise<Group[]> {
  return (await api.get<Group[]>('/groups/admin')).data;
}
export async function getInvitationQr(id: string): Promise<{ qrDataUrl: string; invitationUrl: string }> {
  return (await api.get(`/groups/${id}/invitation/qr`)).data;
}
export async function uploadGroupImage(id: string, file: File): Promise<Group> {
  return (await api.post<Group>(`/groups/${id}/image`, imageForm(file))).data;
}
export async function removeGroupImage(id: string): Promise<Group> {
  return (await api.delete<Group>(`/groups/${id}/image`)).data;
}
export async function joinRegisteredGroup(code: string): Promise<unknown> {
  return (await api.post(`/groups/invitation/${encodeURIComponent(code)}/join`)).data;
}
export interface GuestJoinResult { memberId: string; groupId: string; name: string; status: string; guestToken: string; }
export async function joinGuestGroup(code: string, name: string): Promise<GuestJoinResult> {
  return (await api.post<GuestJoinResult>(`/groups/invitation/${encodeURIComponent(code)}/guests`, { name })).data;
}
export async function addGuestToGroup(groupId: string, name: string): Promise<GuestJoinResult> {
  return (await api.post<GuestJoinResult>(`/groups/${groupId}/guests`, { name })).data;
}
