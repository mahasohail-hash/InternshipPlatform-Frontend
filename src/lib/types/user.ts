import { UserRole } from '../../common/enums/user-role.enum'; // CRITICAL FIX: Correct import path

// Minimal User interface for display in nested objects (e.g., in ProjectDetailsDto)
export interface UserBasic {
  id: string;
  firstName?: string | null; // Make nullable to match backend
  lastName?: string | null;  // Make nullable to match backend
  email: string;
  role?: UserRole; // Role can be optional in basic DTOs
}

// Full User interface (if fetching complete user profile)
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole; // Use UserRole enum
  githubUsername?: string; // Add if exists
  createdAt: string; // Dates typically as ISO strings
  updatedAt: string; // Dates typically as ISO strings
  // Add relations as needed if fetched (e.g., projects, evaluations)
  mentoredProjects?: { id: string; title: string; status: string; }[];
  assignedProjects?: { id: string; title: string; status: string; }[];
  internChecklists?: any[]; // Simple any array for now
  receivedEvaluations?: any[];
  givenEvaluations?: any[];
  assignedTasks?: any[];
  githubMetrics?: any[];
  nlpSummaries?: any[];
}