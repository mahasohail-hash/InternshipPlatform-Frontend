
export interface UserFrontendType {
  id: string;
  email: string; 
}

export interface ChecklistTemplateFrontendType {
  id: string;
  name: string; 

}

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

export interface InternChecklistFrontendType {
  id: string; 
  internId: string; 
  templateId: string; 

  
  intern?: UserFrontendType; 
  template?: ChecklistTemplateFrontendType;

  items?: InternChecklistItemFrontendType[]; 
  createdAt: string;
  updatedAt: string; 
}