export type UserRole = 'admin' | 'client';

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'deleted';

export interface User {
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
  status: UserStatus;
  role: UserRole;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUser {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  biography?: string;
  birthDate?: string;
  timezone?: string;
  languageCode?: string;
}

export interface UpdateUser {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  biography?: string | null;
  birthDate?: string | null;
  timezone?: string;
  languageCode?: string;
}

export interface ChangePassword {
  password: string;
}