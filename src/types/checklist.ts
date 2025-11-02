// src/common/types/checklist.ts (or wherever you manage frontend types)

// Assuming you also need types for User and ChecklistTemplate in the frontend
export interface UserFrontendType {
  id: string;
  email: string; // Or whatever minimal user data your frontend needs
  // ... other exposed properties
}

export interface ChecklistTemplateFrontendType {
  id: string;
  name: string; // Or other template properties
  // ... other exposed properties
}

// And the InternChecklistItemFrontendType as previously defined
export interface InternChecklistItemFrontendType {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  internChecklistId: string;
  createdAt: string;
  updatedAt: string;
}

// Now the InternChecklistFrontendType
export interface InternChecklistFrontendType {
  id: string; // From @PrimaryGeneratedColumn
  internId: string; // Foreign key
  templateId: string; // Foreign key

  // The 'intern' (User) and 'template' (ChecklistTemplate) objects
  // would usually be nested or hydrated by your API.
  // Define them as the frontend types, assuming your API sends them this way.
  intern?: UserFrontendType; // Make optional if API doesn't always include it
  template?: ChecklistTemplateFrontendType; // Make optional

  items?: InternChecklistItemFrontendType[]; // Array of items, make optional if not always loaded
  createdAt: string; // Dates typically come as ISO strings from API
  updatedAt: string; // Dates typically come as ISO strings from API
}