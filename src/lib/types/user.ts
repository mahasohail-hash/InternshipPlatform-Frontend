// lib/types/user.ts
export enum UserRole {
  ADMIN = 'admin',
  MENTOR = 'mentor',
  INTERN = 'intern',
  HR = 'hr',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'intern' | 'mentor' | 'hr'; // Example roles
  createdAt: Date;
  updatedAt: Date;
}
export interface Intern {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  // Add other properties relevant to an intern
  program: string;
  startDate: string;
  endDate: string;
}

export interface Mentor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  // Add other properties relevant to a mentor
  department: string;
  specialization: string;
}