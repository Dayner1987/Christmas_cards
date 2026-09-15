import { useState } from 'react';

import {
  addGroupMember as addGroupMemberRequest,
  deleteGroupMember as deleteGroupMemberRequest,
  getGroupMembers,
  leaveGroup as leaveGroupRequest,
  updateGroupMember as updateGroupMemberRequest,
} from '../api/group-members';

import type {
  CreateGroupMember,
  GroupMember,
  UpdateGroupMember,
} from '../types/group_members.schema';

export function useGroupMembers(groupId?: string) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const validateGroupId = (): string => {
    if (!groupId) {
      throw new Error('El ID del grupo es obligatorio');
    }

    return groupId;
  };

  const fetchMembers = async (): Promise<GroupMember[]> => {
    try {
      const validGroupId = validateGroupId();

      setLoading(true);
      setError(null);

      const response = await getGroupMembers(validGroupId);

      setMembers(response);

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al obtener los miembros del grupo';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (
    data: CreateGroupMember,
  ): Promise<GroupMember> => {
    try {
      const validGroupId = validateGroupId();

      setLoading(true);
      setError(null);

      const response = await addGroupMemberRequest(
        validGroupId,
        data,
      );

      setMembers((currentMembers) => [
        ...currentMembers,
        response,
      ]);

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al añadir el miembro';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (
    userId: string,
    data: UpdateGroupMember,
  ): Promise<GroupMember> => {
    try {
      const validGroupId = validateGroupId();

      setLoading(true);
      setError(null);

      const response = await updateGroupMemberRequest(
        validGroupId,
        userId,
        data,
      );

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.userId === userId
            ? response
            : member,
        ),
      );

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al actualizar el miembro';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (
    userId: string,
  ): Promise<void> => {
    try {
      const validGroupId = validateGroupId();

      setLoading(true);
      setError(null);

      await deleteGroupMemberRequest(
        validGroupId,
        userId,
      );

      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) => member.userId !== userId,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al eliminar el miembro';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const leaveCurrentGroup = async (): Promise<void> => {
    try {
      const validGroupId = validateGroupId();

      setLoading(true);
      setError(null);

      await leaveGroupRequest(validGroupId);

      setMembers([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al salir del grupo';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    members,
    loading,
    error,
    clearError,
    fetchMembers,
    addMember,
    updateMember,
    removeMember,
    leaveCurrentGroup,
  };
}