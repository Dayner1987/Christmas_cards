import { API_CONFIG } from '../config/api.config';

import { authStorage } from '../config/auth.storage';

import type {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '../types/auth.schema';

// =====================================================
// MANEJO DE ERRORES
// =====================================================

async function handleResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    let message =
      'Ocurrió un error inesperado';

    try {
      const errorData =
        await response.json();

      if (Array.isArray(errorData.message)) {
        message =
          errorData.message.join(', ');
      } else if (errorData.message) {
        message =
          errorData.message;
      }
    } catch {
      // Si no se puede leer JSON,
      // usamos el mensaje genérico.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// =====================================================
// LOGIN
// =====================================================

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/auth/login`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(credentials),
    },
  );

  const data =
    await handleResponse<AuthResponse>(
      response,
    );

  authStorage.saveSession(data);

  return data;
}

// =====================================================
// REGISTER
// =====================================================

export async function register(
  registerData: RegisterData,
): Promise<AuthResponse> {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/auth/register`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(registerData),
    },
  );

  const data =
    await handleResponse<AuthResponse>(
      response,
    );

  authStorage.saveSession(data);

  return data;
}

// =====================================================
// OBTENER USUARIO ACTUAL
// =====================================================

export async function getCurrentUser(): Promise<AuthUser> {
  const token =
    authStorage.getToken();

  if (!token) {
    throw new Error(
      'No existe una sesión activa',
    );
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}/auth/me`,
    {
      method: 'GET',

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    },
  );

  return handleResponse<AuthUser>(
    response,
  );
}

// =====================================================
// LOGOUT
// =====================================================

export function logout() {
  authStorage.clearSession();
}