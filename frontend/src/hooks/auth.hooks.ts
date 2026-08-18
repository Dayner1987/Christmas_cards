import {
  useState,
} from 'react';

import {
  getCurrentUser,
  login,
  logout,
  register,
} from '../api/auth';

import { authStorage } from '../config/auth.storage';

import type {
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '../types/auth.schema';

export function useAuth() {
  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    authStorage.getUser(),
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  // =====================================================
  // LOGIN
  // =====================================================

  const loginUser =
    async (
      credentials: LoginCredentials,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await login(credentials);

        setUser(response.user);

        return response;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Error al iniciar sesión';

        setError(message);

        throw error;
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // REGISTER
  // =====================================================

  const registerUser =
    async (
      data: RegisterData,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await register(data);

        setUser(response.user);

        return response;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Error al registrarse';

        setError(message);

        throw error;
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // REFRESCAR USUARIO
  // =====================================================

  const refreshUser =
    async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser =
          await getCurrentUser();

        setUser(currentUser);

        return currentUser;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Error al obtener el usuario';

        setError(message);

        throw error;
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logoutUser = () => {
    logout();

    setUser(null);
    setError(null);
  };

  return {
    user,

    loading,
    error,

    isAuthenticated:
      !!user &&
      authStorage.isAuthenticated(),

    loginUser,
    registerUser,
    refreshUser,
    logoutUser,
  };
}