import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateGroupMember,
  GroupMember,
  UpdateGroupMember,
} from '../types/group_members.schema';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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
    `/groups/${groupId}/members/${userId}`,
    data,
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