import { useState } from 'react';

import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from '../api/users';

import type {
  CreateUser,
  UpdateUser,
  User,
} from '../types/user.schema';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const fetchUsers = async (): Promise<User[]> => {
    try {
      setLoading(true);
      setError(null);

      const data = await getUsers();
      setUsers(data);

      return data;
    } catch (error) {
      console.error('ERROR AL OBTENER USUARIOS:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron obtener los usuarios';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserById = async (
    id: string,
  ): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      return await getUserById(id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo obtener el usuario';

      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (
    data: CreateUser,
  ): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const user = await createUser(data);

      setUsers((currentUsers) => [
        ...currentUsers,
        user,
      ]);

      return user;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo crear el usuario';

      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const editUser = async (
    id: string,
    data: UpdateUser,
  ): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await updateUser(id, data);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === id ? updatedUser : user,
        ),
      );

      return updatedUser;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el usuario';

      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (
    id: string,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await deleteUser(id);

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== id),
      );

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el usuario';

      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    clearError,
    fetchUsers,
    fetchUserById,
    addUser,
    editUser,
    removeUser,
  };
};