/**
 * Authentication and User Types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  /** From the phone-number sign-in plugin (tenants). */
  phoneNumber?: string | null;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  TENANT = "tenant",
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}

export function isStaffRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return normalized === UserRole.ADMIN || normalized === UserRole.SUPERADMIN;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: Date;
}
