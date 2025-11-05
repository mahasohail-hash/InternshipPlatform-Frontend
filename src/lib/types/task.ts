import { Milestone } from './milestone';
import { UserBasic } from './user'; // Use UserBasic

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // CRITICAL FIX: This should be 'string' (ISO format from backend)
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked'; // Use specific enum values
  milestoneId: string; // Foreign key
  assigneeId?: string; // Foreign key, can be optional for unassigned tasks
  milestone?: Milestone; // Optional, loaded via relations
  assignee?: UserBasic; // Optional, loaded via relations
  createdAt?: string; // Add createdAt
  updatedAt?: string; // Add updatedAt
}

// DTO for creating a task
export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string; // CRITICAL FIX: This should be 'string'
  status?: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  assignedToInternId?: string; // Assignee ID
}

// DTO for updating a task
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  dueDate?: string; // CRITICAL FIX: This should be 'string'
  status?: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  assignedToInternId?: string | null; // Allow unassigning
}