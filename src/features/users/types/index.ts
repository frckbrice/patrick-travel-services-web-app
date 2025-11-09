// Types for Users feature

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  street?: string;
  city?: string;
  country?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  country?: string;
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
}
