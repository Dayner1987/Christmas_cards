import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateGroup,
  Group,
  UpdateGroup,
} from '../types/group.schema';

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