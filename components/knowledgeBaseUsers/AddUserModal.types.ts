/**
 * Add User to Knowledge Base Modal Component Types
 */

import { KnowledgeBaseRole } from '@/interfaces/KnowledgeBaseUserRole';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBaseId: string;
  onSuccess?: () => void;
}

export interface AddUserFormData extends Record<string, unknown> {
  selectedUserId: string;
  role: KnowledgeBaseRole;
  expiresAt?: string;
}

export interface SearchUserResult {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}
