import axios from 'axios';
import { authStorage } from '../config/auth.storage';

import type {
  SecretSantaAssignment,
  SecretSantaAssignmentWithUsers,
  SecretSantaSummaryItem,
} from '../types/secret_santa_assignments.schema';

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

export const drawSecretSantaAssignments = async (
  eventId: string,
): Promise<SecretSantaAssignment[]> => {
  const response = await api.post<SecretSantaAssignment[]>(
    `/secret-santa-assignments/event/${eventId}/draw`,
  );

  return response.data;
};

export const getMySecretSantaAssignment = async (
  eventId: string,
): Promise<SecretSantaAssignmentWithUsers> => {
  const response =
    await api.get<SecretSantaAssignmentWithUsers>(
      `/secret-santa-assignments/event/${eventId}/me`,
    );

  return response.data;
};

export const markGiftAsDelivered = async (
  eventId: string,
): Promise<SecretSantaAssignment> => {
  const response = await api.patch<SecretSantaAssignment>(
    `/secret-santa-assignments/event/${eventId}/delivered`,
  );

  return response.data;
};

export const getSecretSantaAssignmentSummary = async (
  eventId: string,
): Promise<SecretSantaSummaryItem[]> => {
  const response =
    await api.get<SecretSantaSummaryItem[]>(
      `/secret-santa-assignments/event/${eventId}/summary`,
    );

  return response.data;
};