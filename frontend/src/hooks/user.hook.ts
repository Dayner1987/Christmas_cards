import { useState } from 'react';

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../api/users';

import type {
  User,
  CreateUser,
  UpdateUser,
} from '../types/user.schema';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error('ERROR AL OBTENER USUARIOS:', error);
      setError('No se pudieron obtener los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Obtener uno
  const fetchUserById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const user = await getUserById(id);

      return user;
    } catch (error) {
      setError('No se pudo obtener el usuario');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Crear
  const addUser = async (data: CreateUser) => {
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
      setError('No se pudo crear el usuario');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar
  const editUser = async (
    id: string,
    data: UpdateUser,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await updateUser(id, data);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id_users === id
            ? updatedUser
            : user,
        ),
      );

      return updatedUser;
    } catch (error) {
      setError('No se pudo actualizar el usuario');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar
  const removeUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await deleteUser(id);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id_users !== id,
        ),
      );

      return true;
    } catch (error) {
      setError('No se pudo eliminar el usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,

    fetchUsers,
    fetchUserById,
    addUser,
    editUser,
    removeUser,
  };
};