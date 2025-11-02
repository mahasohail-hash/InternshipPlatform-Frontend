// lib/types/milestone.ts
import { Project } from './project';
import { Task } from './task';
import dayjs from 'dayjs'; // <--- THIS IS THE FIX: Import dayjs

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: string;
  projectId: string;
  project?: Project; // Optional, loaded via relations
  tasks?: Task[]; // Optional, loaded via relations
}

export interface CreateMilestonePayload {
  name: string;
  description?: string;
  dueDate?: dayjs.Dayjs; // Use dayjs object for form, convert to string for API
  projectId: string;
}

export interface UpdateMilestonePayload {
  name?: string;
  description?: string;
  dueDate?: dayjs.Dayjs;
  status?: string;
}