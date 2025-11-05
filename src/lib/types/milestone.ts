import { Project } from './project';
import { Task } from './task';

export interface Milestone {
  id: string;
  title: string; // CRITICAL FIX: Use 'title' consistently
  description?: string;
  dueDate?: string; // Add if Milestone entity has a dueDate
  projectId?: string; // Foreign key
  project?: Project; // Relation to Project (optional if not always loaded)
  tasks?: Task[]; // Relation to Tasks
  createdAt?: string; // Add createdAt
  updatedAt?: string; // Add updatedAt
}