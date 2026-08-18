export interface User {
  id_users: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  biography: string | null;
  birth_date: string | null;
  timezone: string;
  language_code: string;
  status: string;
  role: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUser {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  biography?: string;
  birth_date?: string;
  role?: string;
}

export interface UpdateUser {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  biography?: string;
  birth_date?: string;
  role?: string;
}