// lib/types/task.ts
import { Milestone } from './milestone';
import { User } from './user';
import type { Dayjs } from 'dayjs'; // <--- ADD THIS IMPORT for the Dayjs type

export interface Task {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Blocked';
  priority: 1 | 2 | 3; // Low, Medium, High
  milestoneId: string;
  assigneeId?: string;
  milestone?: Milestone; // Optional, loaded via relations
  assignee?: User; // Optional, loaded via relations
}

export interface CreateTaskPayload {
  name: string;
  description?: string;
  dueDate?: string; // <--- FIX: This should be 'string'
  status?: 'Pending' | 'InProgress' | 'Completed' | 'Blocked'; // Status might be optional on creation
  priority?: 1 | 2 | 3; // Priority might be optional on creation
  milestoneId: string;
  assigneeId?: string;
}

export interface UpdateTaskPayload {
  name?: string;
  description?: string;
     dueDate?: string; // <--- FIX: This should be 'string'
  status?: 'Pending' | 'InProgress' | 'Completed' | 'Blocked';
  priority?: 1 | 2 | 3;
  assigneeId?: string | null; // Allow unassigning
}