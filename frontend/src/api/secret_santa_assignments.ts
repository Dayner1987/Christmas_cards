import { api } from './http';

import type {
  SecretSantaAssignment,
  SecretSantaSummaryItem,
  SecretSantaDrawResponse,
  SecretSantaPrivateAssignment,
} from '../types/secret_santa_assignments.schema';



export const drawSecretSantaAssignments = async (
  eventId: string,
): Promise<SecretSantaDrawResponse> => {
  const response = await api.post<SecretSantaDrawResponse>(
    `/secret-santa-assignments/event/${eventId}/draw`,
  );

  return response.data;
};

export const getMySecretSantaAssignment = async (
  eventId: string,
): Promise<SecretSantaPrivateAssignment> => {
  const response =
    await api.get<SecretSantaPrivateAssignment>(
      `/secret-santa-assignments/event/${eventId}/me`,
    );

  return response.data;
};

export const markGiftAsDelivered = async (
  eventId: string,
): Promise<{ message: string; assignment: SecretSantaAssignment; eventCompleted: boolean }> => {
  const response = await api.patch<{ message: string; assignment: SecretSantaAssignment; eventCompleted: boolean }>(
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
export async function getGuestAssignment(eventId: string, token: string): Promise<SecretSantaPrivateAssignment> {
  return (await api.get<SecretSantaPrivateAssignment>(`/secret-santa-guests/event/${eventId}/me`, { headers: { 'x-guest-token': token } })).data;
}
export async function markGuestGiftDelivered(eventId: string, token: string): Promise<unknown> {
  return (await api.patch(`/secret-santa-guests/event/${eventId}/delivered`, {}, { headers: { 'x-guest-token': token } })).data;
}

export interface OrganizerAssignment {
  id: string;
  giverMemberId: string | null;
  giverName: string;
  receiverMemberId: string | null;
  receiverName: string;
  giftStatus: 'pending' | 'delivered';
  deliveredAt: string | null;
}

export interface OrganizerAssignmentsResponse {
  eventId: string;
  eventName: string;
  groupId: string;
  total: number;
  delivered: number;
  assignments: OrganizerAssignment[];
}

export async function getOrganizerAssignments(
  eventId: string,
): Promise<OrganizerAssignmentsResponse> {
  const response = await api.get<OrganizerAssignmentsResponse>(
    `/secret-santa-assignments/event/${eventId}/organizer-assignments`,
  );

  return response.data;
}
