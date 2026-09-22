import { useState } from 'react';

import {
  archiveGroup as archiveGroupRequest,
  createGroup as createGroupRequest,
  deleteGroup as deleteGroupRequest,
  getGroupById,
  getGroupByInvitationCode,
  getGroups,
  getMyGroups,
  updateGroup as updateGroupRequest,
  updateGroupInvitation as updateGroupInvitationRequest,
} from '../api/groups';

import type {
  CreateGroup,
  Group,
  UpdateGroup,
} from '../types/group.schema';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (
    error: unknown,
    defaultMessage: string,
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : defaultMessage;

    setError(message);
    throw error;
  };

  const clearError = () => {
    setError(null);
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getGroups();
      setGroups(response);

      return response;
    } catch (error) {
      handleError(error, 'Error al obtener los grupos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMyGroups();
      setGroups(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al obtener tus grupos',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getGroupById(id);
      setGroup(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al obtener el grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupByInvitationCode = async (
    code: string,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await getGroupByInvitationCode(code);

      setGroup(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al buscar el grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (data: CreateGroup) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createGroupRequest(data);

      setGroups((currentGroups) => [
        response,
        ...currentGroups,
      ]);

      setGroup(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al crear el grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateGroup = async (
    id: string,
    data: UpdateGroup,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateGroupRequest(
        id,
        data,
      );

      setGroups((currentGroups) =>
        currentGroups.map((currentGroup) =>
          currentGroup.id === id
            ? response
            : currentGroup,
        ),
      );

      setGroup((currentGroup) =>
        currentGroup?.id === id
          ? response
          : currentGroup,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al actualizar el grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  const archiveGroup = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await archiveGroupRequest(id);

      setGroups((currentGroups) =>
        currentGroups.map((currentGroup) =>
          currentGroup.id === id
            ? response
            : currentGroup,
        ),
      );

      setGroup((currentGroup) =>
        currentGroup?.id === id
          ? response
          : currentGroup,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al archivar el grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateGroupInvitation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await updateGroupInvitationRequest(id);

      setGroups((currentGroups) =>
        currentGroups.map((currentGroup) =>
          currentGroup.id === id
            ? response
            : currentGroup,
        ),
      );

      setGroup((currentGroup) =>
        currentGroup?.id === id
          ? response
          : currentGroup,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'Error al actualizar la invitación',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await deleteGroupRequest(id);

      setGroups((currentGroups) =>
        currentGroups.filter(
          (currentGroup) => currentGroup.id !== id,
        ),
      );

      setGroup((currentGroup) =>
        currentGroup?.id === id
          ? null
          : currentGroup,
      );
    } catch (error) {
      handleError(
        error,
        'Error al eliminar el grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    groups,
    group,
    loading,
    error,
    clearError,
    fetchGroups,
    fetchMyGroups,
    fetchGroupById,
    fetchGroupByInvitationCode,
    createGroup,
    updateGroup,
    archiveGroup,
    updateGroupInvitation,
    deleteGroup,
  };
}