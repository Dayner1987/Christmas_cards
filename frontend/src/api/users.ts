import axios from 'axios';

import { authStorage } from '../config/auth.storage';

import type {
  ChangePassword,
  CreateUser,
  UpdateUser,
  User,
} from '../types/user.schema';

const API_URL = 'http://localhost:3000';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Actualiza la sesión únicamente si la respuesta
 * pertenece al usuario autenticado.
 */
const syncSessionUser = (user: User): void => {
  const currentUser = authStorage.getUser();

  if (!currentUser || currentUser.id !== user.id) {
    return;
  }

  const updatedSessionUser = {
    ...currentUser,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };

  authStorage.updateUser(updatedSessionUser);

  window.dispatchEvent(
    new Event('profile:updated'),
  );
};

/**
 * Normaliza campos vacíos que representan valores nulos.
 * No modifica ni recorta contraseñas.
 */
const prepareUpdate = (
  data: UpdateUser,
): UpdateUser => {
  const payload = { ...data };

  if (payload.password === '') {
    delete payload.password;
  }

  if (payload.birthDate === '') {
    payload.birthDate = null;
  }

  if (payload.phone === '') {
    payload.phone = null;
  }

  return payload;
};

export const createUser = async (
  data: CreateUser,
): Promise<User> => {
  const response = await api.post<User>(
    '/users',
    data,
  );

  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');

  return response.data;
};

export const getUserById = async (
  id: string,
): Promise<User> => {
  const response = await api.get<User>(
    `/users/${id}`,
  );

  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUser,
): Promise<User> => {
  const response = await api.patch<User>(
    `/users/${id}`,
    prepareUpdate(data),
  );

  syncSessionUser(response.data);

  return response.data;
};

export const deleteUser = async (
  id: string,
): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const getMyProfile = async (): Promise<User> => {
  const response = await api.get<User>('/users/me');

  syncSessionUser(response.data);

  return response.data;
};

export const updateMyProfile = async (
  data: UpdateUser,
): Promise<User> => {
  const response = await api.patch<User>(
    '/users/me',
    prepareUpdate(data),
  );

  syncSessionUser(response.data);

  return response.data;
};

export const uploadMyAvatar = async (
  file: File,
): Promise<User> => {
  if (!file || file.size === 0) {
    throw new Error(
      'Debes seleccionar una imagen válida.',
    );
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      'Solo se permiten imágenes JPG, PNG o WEBP.',
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      'La imagen no puede superar los 5 MB.',
    );
  }

  const formData = new FormData();

  // Debe coincidir con FileInterceptor('file') del backend.
  formData.append('file', file);

  const response = await api.post<User>(
    '/users/me/avatar',
    formData,
  );

  syncSessionUser(response.data);

  return response.data;
};

export const deleteMyAvatar = async (): Promise<User> => {
  const response = await api.delete<User>(
    '/users/me/avatar',
  );

  syncSessionUser(response.data);

  return response.data;
};
export const uploadUserAvatar = async (
  id: string,
  file: File,
): Promise<User> => {
  if (!file || file.size === 0) {
    throw new Error('Selecciona una imagen válida.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      'Solo se permiten imágenes JPG, PNG o WEBP.',
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      'La imagen no puede superar los 5 MB.',
    );
  }

  const formData = new FormData();

  formData.append('file', file);

  const response = await api.post<User>(
    `/users/${encodeURIComponent(id)}/avatar`,
    formData,
  );

  syncSessionUser(response.data);

  return response.data;
};

export const deleteUserAvatar = async (
  id: string,
): Promise<User> => {
  const response = await api.delete<User>(
    `/users/${encodeURIComponent(id)}/avatar`,
  );

  syncSessionUser(response.data);

  return response.data;
};
export const changeMyPassword = async (
  data: ChangePassword,
): Promise<User> => {
  if (
    data.password.length < 8 ||
    data.password.length > 100
  ) {
    throw new Error(
      'La contraseña debe tener entre 8 y 100 caracteres.',
    );
  }

  return updateMyProfile({
    password: data.password,
  });

  
};