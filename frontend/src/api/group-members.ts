import { api } from './http';

import type {
  CreateGroupMember,
  GroupMember,
  UpdateGroupMember,
} from '../types/group_members.schema';



export const getGroupMembers = async (
  groupId: string,
): Promise<GroupMember[]> => {
  const response = await api.get<GroupMember[]>(
    `/groups/${groupId}/members`,
  );

  return response.data;
};

export const addGroupMember = async (
  groupId: string,
  data: CreateGroupMember,
): Promise<GroupMember> => {
  const response = await api.post<GroupMember>(
    `/groups/${groupId}/members`,
    data,
  );

  return response.data;
};

export const updateGroupMember = async (
  groupId: string,
  userId: string,
  data: UpdateGroupMember,
): Promise<GroupMember> => {
  const response = await api.patch<GroupMember>(
    `/groups/${groupId}/members/${userId}/role`,
    { role: data.role },
  );

  return response.data;
};

export const deleteGroupMember = async (
  groupId: string,
  userId: string,
): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${userId}`);
};

export const leaveGroup = async (
  groupId: string,
): Promise<void> => {
  await api.post(`/groups/${groupId}/members/leave`);
};
export async function approveGroupMember(groupId: string, userId: string): Promise<GroupMember> {
  return (await api.patch<GroupMember>(`/groups/${groupId}/members/${userId}/approve`)).data;
}
export async function approveGuestMember(groupId: string, guestId: string): Promise<unknown> {
  return (await api.patch(`/groups/${groupId}/guests/${guestId}/approve`)).data;
}
export async function removeGuestMember(groupId: string, guestId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/guests/${guestId}`);
}
