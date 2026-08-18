export interface AuthUser {
  id: string;

  username: string;
  email: string;

  firstName: string | null;
  lastName: string | null;

  phone: string | null;

  avatarUrl: string | null;
  biography: string | null;

  birthDate: string | null;

  timezone: string;
  languageCode: string;

  status: string;

  emailVerifiedAt: string | null;
  lastLoginAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;

  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  username: string;

  iat?: number;
  exp?: number;
}