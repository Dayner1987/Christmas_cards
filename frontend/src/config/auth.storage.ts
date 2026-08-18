import type {
  AuthResponse,
  AuthUser,
} from '../types/auth.schema';

const TOKEN_KEY = 'christmas_cards_token';
const USER_KEY = 'christmas_cards_user';

export const authStorage = {
  // =====================================================
  // GUARDAR SESIÓN
  // =====================================================

  saveSession(authResponse: AuthResponse) {
    localStorage.setItem(
      TOKEN_KEY,
      authResponse.accessToken,
    );

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(authResponse.user),
    );
  },

  // =====================================================
  // OBTENER TOKEN
  // =====================================================

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  getUser(): AuthUser | null {
    const user =
      localStorage.getItem(USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthUser;
    } catch {
      return null;
    }
  },

  // =====================================================
  // VERIFICAR SI EXISTE SESIÓN
  // =====================================================

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // =====================================================
  // ELIMINAR SESIÓN
  // =====================================================

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};