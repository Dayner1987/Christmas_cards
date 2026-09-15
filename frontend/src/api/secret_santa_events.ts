import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  CreateSecretSantaEvent,
  SecretSantaEvent,
  UpdateSecretSantaEvent,
} from '../types/secret_santa_events.schema';

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

export const createSecretSantaEvent = async (
  data: CreateSecretSantaEvent,
): Promise<SecretSantaEvent> => {
  const response = await api.post<SecretSantaEvent>(
    '/secret-santa-events',
    data,
  );

  return response.data;
};

export const getMySecretSantaEvents = async (): Promise<
  SecretSantaEvent[]
> => {
  const response = await api.get<SecretSantaEvent[]>(
    '/secret-santa-events/my',
  );

  return response.data;
};

export const getSecretSantaEventsByGroup = async (
  groupId: string,
): Promise<SecretSantaEvent[]> => {
  const response = await api.get<SecretSantaEvent[]>(
    `/secret-santa-events/group/${groupId}`,
  );

  return response.data;
};

export const getSecretSantaEventById = async (
  id: string,
): Promise<SecretSantaEvent> => {
  const response = await api.get<SecretSantaEvent>(
    `/secret-santa-events/${id}`,
  );

  return response.data;
};

export const updateSecretSantaEvent = async (
  id: string,
  data: UpdateSecretSantaEvent,
): Promise<SecretSantaEvent> => {
  const response = await api.patch<SecretSantaEvent>(
    `/secret-santa-events/${id}`,
    data,
  );

  return response.data;
};

export const cancelSecretSantaEvent = async (
  id: string,
): Promise<SecretSantaEvent> => {
  const response = await api.patch<SecretSantaEvent>(
    `/secret-santa-events/${id}/cancel`,
  );

  return response.data;
};

export const completeSecretSantaEvent = async (
  id: string,
): Promise<SecretSantaEvent> => {
  const response = await api.patch<SecretSantaEvent>(
    `/secret-santa-events/${id}/complete`,
  );

  return response.data;
};