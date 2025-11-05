// --- IMPORT REQUIRED TYPES ---
import { UserBasic } from './user'; // Import the UserBasic interface from user.ts (defined below)
import { Milestone } from './milestone'; // Import the Milestone interface from milestone.ts
// --- END IMPORT REQUIRED TYPES ---

export interface Project {
  id: string;
  title: string; // CRITICAL FIX: Consistent with backend entity (title, not name)
  description?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  mentorId?: string; // Optional as it might be nested
  internId?: string; // Optional as it might be nested
  mentor?: UserBasic; // Now 'UserBasic' is recognized
  intern?: UserBasic; // Now 'UserBasic' is recognized
  milestones?: Milestone[]; // Now 'Milestone' is recognized
}

// DTO for creating a new project (should match backend CreateProjectDto)
export interface CreateProjectPayload {
  title: string; // CRITICAL FIX: Consistent with backend DTO
  description?: string;
  internId: string; // Frontend sends internId for project creation
  milestones?: { // Nested milestones
    title: string;
    description?: string; // Added description to milestone DTO
    dueDate?: string; // Added dueDate to milestone DTO
    tasks?: { // Nested tasks
      title: string;
      description?: string;
      dueDate?: string;
      assignedToInternId?: string; // Assignee for the task
    }[];
  }[];
}

// DTO for updating a project (should match backend UpdateProjectDto)
export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  status?: string;
  internId?: string;
  mentorId?: string; // Can update mentor
  milestones?: { // Allow updating nested milestones
    id?: string; // ID is required for updating existing items
    title: string;
    description?: string;
    dueDate?: string;
    tasks?: {
      id?: string; // ID is required for updating existing items
      title: string;
      description?: string;
      dueDate?: string;
      assignedToInternId?: string | null;
    }[];
  }[];
}