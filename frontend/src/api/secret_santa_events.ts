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

// Catálogo general del administrador, independiente de los sorteos por grupo.
import type {
  SecretSantaTemplate,
  CreateSecretSantaTemplate,
  UpdateSecretSantaTemplate,
  ApplyTemplateResult,
} from '../types/secret_santa_templates.schema';

export async function getSecretSantaTemplates(): Promise<SecretSantaTemplate[]> {
  return (await api.get<SecretSantaTemplate[]>('/secret-santa-events/templates')).data;
}

export async function createSecretSantaTemplate(
  data: CreateSecretSantaTemplate,
): Promise<SecretSantaTemplate> {
  return (await api.post<SecretSantaTemplate>('/secret-santa-events/templates', data)).data;
}

export async function updateSecretSantaTemplate(
  id: string,
  data: UpdateSecretSantaTemplate,
): Promise<SecretSantaTemplate> {
  return (await api.patch<SecretSantaTemplate>(`/secret-santa-events/templates/${id}`, data)).data;
}

export async function deactivateSecretSantaTemplate(id: string): Promise<void> {
  await api.delete(`/secret-santa-events/templates/${id}`);
}

export async function uploadSecretSantaTemplateImage(
  id: string,
  file: File,
): Promise<SecretSantaTemplate> {
  return (await api.post<SecretSantaTemplate>(
    `/secret-santa-events/templates/${id}/image`, imageForm(file),
  )).data;
}

export async function applySecretSantaTemplate(
  groupId: string,
  templateId: string,
): Promise<ApplyTemplateResult> {
  return (await api.post<ApplyTemplateResult>(
    `/secret-santa-events/group/${groupId}/from-template/${templateId}`,
  )).data;
}
