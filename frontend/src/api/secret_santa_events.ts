import { api, imageForm } from './http';

import type {
  CreateSecretSantaEvent,
  SecretSantaEvent,
  UpdateSecretSantaEvent,
} from '../types/secret_santa_events.schema';



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
export async function uploadEventImage(id: string, file: File): Promise<SecretSantaEvent> {
  return (await api.post<SecretSantaEvent>(`/secret-santa-events/${id}/image`, imageForm(file))).data;
}
