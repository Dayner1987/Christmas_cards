import {
  useCallback,
  useState,
} from 'react';

import axios from 'axios';

import {
  changeMyPassword,
  createUser,
  deleteMyAvatar,
  deleteUser,
  getMyProfile,
  getUserById,
  getUsers,
  updateMyProfile,
  updateUser,
  uploadMyAvatar,
   deleteUserAvatar,
  uploadUserAvatar,
} from '../api/users';


import type {
  ChangePassword,
  CreateUser,
  UpdateUser,
  User,
} from '../types/user.schema';

interface ApiErrorResponse {
  message?: string | string[];
}

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (typeof message === 'string' && message) {
      return message;
    }

    if (!error.response) {
      return 'No se pudo conectar con el servidor.';
    }

    return fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [profile, setProfile] = useState<User | null>(null);

  const [pendingRequests, setPendingRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loading = pendingRequests > 0;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Centraliza loading y errores.
   * El contador mantiene loading activo si coinciden
   * varias solicitudes.
   */
  const runRequest = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      fallbackMessage: string,
    ): Promise<T> => {
      setPendingRequests((current) => current + 1);
      setError(null);

      try {
        return await operation();
      } catch (error) {
        setError(
          getErrorMessage(error, fallbackMessage),
        );

        throw error;
      } finally {
        setPendingRequests((current) =>
          Math.max(0, current - 1),
        );
      }
    },
    [],
  );

  const replaceUserInList = useCallback(
    (updatedUser: User) => {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id
            ? updatedUser
            : user,
        ),
      );
    },
    [],
  );

  const applyProfile = useCallback(
    (updatedUser: User) => {
      setProfile(updatedUser);
      replaceUserInList(updatedUser);
    },
    [replaceUserInList],
  );

  const fetchUsers = useCallback(
    async (): Promise<User[]> => {
      // Conserva el comportamiento anterior:
      // fetchUsers propaga el error al componente.
      return runRequest(
        async () => {
          const data = await getUsers();

          setUsers(data);

          return data;
        },
        'No se pudieron obtener los usuarios.',
      );
    },
    [runRequest],
  );

  const fetchUserById = useCallback(
    async (id: string): Promise<User | null> => {
      try {
        return await runRequest(
          () => getUserById(id),
          'No se pudo obtener el usuario.',
        );
      } catch {
        return null;
      }
    },
    [runRequest],
  );

  const addUser = useCallback(
    async (
      data: CreateUser,
    ): Promise<User | null> => {
      try {
        return await runRequest(
          async () => {
            const user = await createUser(data);

            setUsers((currentUsers) => [
              user,
              ...currentUsers,
            ]);

            return user;
          },
          'No se pudo crear el usuario.',
        );
      } catch {
        return null;
      }
    },
    [runRequest],
  );

  const editUser = useCallback(
    async (
      id: string,
      data: UpdateUser,
    ): Promise<User | null> => {
      try {
        return await runRequest(
          async () => {
            const updatedUser = await updateUser(
              id,
              data,
            );

            replaceUserInList(updatedUser);

            setProfile((currentProfile) =>
              currentProfile?.id === updatedUser.id
                ? updatedUser
                : currentProfile,
            );

            return updatedUser;
          },
          'No se pudo actualizar el usuario.',
        );
      } catch {
        return null;
      }
    },
    [runRequest, replaceUserInList],
  );

  const removeUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await runRequest(
          async () => {
            await deleteUser(id);

            setUsers((currentUsers) =>
              currentUsers.filter(
                (user) => user.id !== id,
              ),
            );

            setProfile((currentProfile) =>
              currentProfile?.id === id
                ? null
                : currentProfile,
            );
          },
          'No se pudo eliminar el usuario.',
        );

        return true;
      } catch {
        return false;
      }
    },
    [runRequest],
  );

  const fetchMyProfile = useCallback(
    async (): Promise<User | null> => {
      try {
        return await runRequest(
          async () => {
            const user = await getMyProfile();

            applyProfile(user);

            return user;
          },
          'No se pudo cargar tu perfil.',
        );
      } catch {
        return null;
      }
    },
    [runRequest, applyProfile],
  );

  const editMyProfile = useCallback(
    async (
      data: UpdateUser,
    ): Promise<User | null> => {
      try {
        return await runRequest(
          async () => {
            const user = await updateMyProfile(data);

            applyProfile(user);

            return user;
          },
          'No se pudo actualizar tu perfil.',
        );
      } catch {
        return null;
      }
    },
    [runRequest, applyProfile],
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<User | null> => {
      try {
        return await runRequest(
          async () => {
            const user = await uploadMyAvatar(file);

            applyProfile(user);

            return user;
          },
          'No se pudo subir la fotografía.',
        );
      } catch {
        return null;
      }
    },
    [runRequest, applyProfile],
  );

  const removeAvatar = useCallback(
    async (): Promise<User | null> => {
      try {
        return await runRequest(
          async () => {
            const user = await deleteMyAvatar();

            applyProfile(user);

            return user;
          },
          'No se pudo quitar la fotografía.',
        );
      } catch {
        return null;
      }
    },
    [runRequest, applyProfile],
  );

  const changePassword = useCallback(
    async (
      data: ChangePassword,
    ): Promise<boolean> => {
      try {
        await runRequest(
          async () => {
            const user = await changeMyPassword(data);

            applyProfile(user);
          },
          'No se pudo cambiar la contraseña.',
        );

        return true;
      } catch {
        return false;
      }
    },
    [runRequest, applyProfile],
  );
  const uploadUserPhoto = useCallback(
  async (
    id: string,
    file: File,
  ): Promise<User | null> => {
    try {
      return await runRequest(
        async () => {
          const updatedUser = await uploadUserAvatar(
            id,
            file,
          );

          replaceUserInList(updatedUser);

          setProfile((currentProfile) =>
            currentProfile?.id === updatedUser.id
              ? updatedUser
              : currentProfile,
          );

          return updatedUser;
        },
        'No se pudo actualizar la fotografía.',
      );
    } catch {
      return null;
    }
  },
  [runRequest, replaceUserInList],
);

const removeUserPhoto = useCallback(
  async (id: string): Promise<User | null> => {
    try {
      return await runRequest(
        async () => {
          const updatedUser = await deleteUserAvatar(id);

          replaceUserInList(updatedUser);

          setProfile((currentProfile) =>
            currentProfile?.id === updatedUser.id
              ? updatedUser
              : currentProfile,
          );

          return updatedUser;
        },
        'No se pudo quitar la fotografía.',
      );
    } catch {
      return null;
    }
  },
  [runRequest, replaceUserInList],
);

return {
  users,
  profile,
  loading,
  error,
  clearError,
  fetchUsers,
  fetchUserById,
  addUser,
  editUser,
  removeUser,
  fetchMyProfile,
  editMyProfile,
  uploadAvatar,
  removeAvatar,
  changePassword,
  uploadUserPhoto,
  removeUserPhoto,
};
};