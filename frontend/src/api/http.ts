// src/api/http.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { authStorage } from '../config/auth.storage';

export const api = axios.create({ baseURL: API_CONFIG.baseUrl });
api.interceptors.request.use(config => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function imageForm(file: File): FormData {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Selecciona una imagen JPG, PNG o WEBP.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen debe pesar como máximo 5 MB.');
  }
  const body = new FormData();
  body.append('file', file);
  return body;
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message as string | string[] | undefined;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    if (!error.response) return 'Sin conexión con NestJS. Revisa el puerto y CORS.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
