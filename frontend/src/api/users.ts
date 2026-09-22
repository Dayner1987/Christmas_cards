import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateUser,
  UpdateUser,
  User,
} from '../types/user.schema';

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

export const createUser = async (
  data: CreateUser,
): Promise<User> => {
  const response = await api.post<User>('/users', data);
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const getUserById = async (
  id: string,
): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUser,
): Promise<User> => {
  const response = await api.patch<User>(
    `/users/${id}`,
    data,
  );

  return response.data;
};

export const deleteUser = async (
  id: string,
): Promise<void> => {
  await api.delete(`/users/${id}`);
};