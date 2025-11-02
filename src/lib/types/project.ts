// src/lib/types/project.ts

// --- IMPORT REQUIRED TYPES ---
import { User } from './user'; // Import the User interface from user.ts
import { Milestone } from './milestone'; // Import the Milestone interface from milestone.ts
// --- END IMPORT REQUIRED TYPES ---

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  mentorId: string;
  internId: string;
  mentor?: User; // Now 'User' is recognized
  intern?: User; // Now 'User' is recognized
  milestones?: Milestone[]; // Now 'Milestone' is recognized
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  internId: string;
  mentorId: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: string;
  internId?: string;
  mentorId?: string;
}