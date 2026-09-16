import type {
  AuthResponse,
  AuthUser,
} from '../types/auth.schema';

const TOKEN_KEY = 'christmas_cards_token';
const USER_KEY = 'christmas_cards_user';

export const authStorage = {
  saveSession(authResponse: AuthResponse): void {
    localStorage.setItem(
      TOKEN_KEY,
      authResponse.accessToken,
    );

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(authResponse.user),
    );
  },

  updateUser(user: AuthUser): void {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const user = localStorage.getItem(USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};