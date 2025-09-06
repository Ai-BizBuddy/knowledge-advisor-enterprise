/**
 * Knowledge Base User Role Interfaces
 *
 * Type definitions for managing users and their roles within knowledge bases
 * supporting custom visibility and role-based access control.
 */

/**
 * Knowledge base user role from database
 */
export interface KnowledgeBaseUserRole {
  id: string;
  user_id: string;
  knowledge_base_id: string;
  role: KnowledgeBaseRole;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Knowledge base role enum
 */
export enum KnowledgeBaseRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  CONTRIBUTOR = 'contributor',
}

/**
 * User with knowledge base role information
 */
export interface KnowledgeBaseUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  full_name?: string;
  role: KnowledgeBaseRole;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  granter_name?: string;
}

/**
 * Input for adding user to knowledge base
 */
export interface AddUserToKnowledgeBaseInput {
  user_id: string;
  knowledge_base_id: string;
  role: KnowledgeBaseRole;
  expires_at?: string;
}

// Form data interfaces
export interface AddUserFormData extends Record<string, unknown> {
  userSearch: string;
  selectedUserId: string;
  role: KnowledgeBaseRole;
  expiresAt?: string;
}

/**
 * Input for updating user role in knowledge base
 */
export interface UpdateKnowledgeBaseUserRoleInput {
  role?: KnowledgeBaseRole;
  expires_at?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Search/filter options for knowledge base users
 */
export interface KnowledgeBaseUserFilter {
  role?: KnowledgeBaseRole[];
  is_active?: boolean;
  search?: string;
  granted_by?: string;
  sort_by?: 'email' | 'display_name' | 'granted_at' | 'role';
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated response for knowledge base users
 */
export interface PaginatedKnowledgeBaseUsers {
  users: KnowledgeBaseUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Role permission mapping for knowledge bases
 */
export const KNOWLEDGE_BASE_ROLE_PERMISSIONS = {
  [KnowledgeBaseRole.SUPER_ADMIN]: {
    level: 100,
    description: 'Full access to all knowledge base features',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
  },
  [KnowledgeBaseRole.ADMIN]: {
    level: 90,
    description: 'Administrative access to knowledge base',
    permissions: ['read', 'write', 'delete', 'manage_users'],
  },
  [KnowledgeBaseRole.EDITOR]: {
    level: 70,
    description: 'Can read, write, and delete documents',
    permissions: ['read', 'write', 'delete'],
  },
  [KnowledgeBaseRole.CONTRIBUTOR]: {
    level: 60,
    description: 'Can read and add documents',
    permissions: ['read', 'write'],
  },
  [KnowledgeBaseRole.VIEWER]: {
    level: 50,
    description: 'Read-only access to knowledge base',
    permissions: ['read'],
  },
} as const;

/**
 * Role selection options for UI
 */
export const KNOWLEDGE_BASE_ROLE_OPTIONS = [
  {
    value: KnowledgeBaseRole.SUPER_ADMIN,
    label: 'Super Admin',
    description: 'Full access to all features',
  },
  {
    value: KnowledgeBaseRole.ADMIN,
    label: 'Admin',
    description: 'Administrative access',
  },
  {
    value: KnowledgeBaseRole.EDITOR,
    label: 'Editor',
    description: 'Can read, write, and delete',
  },
  {
    value: KnowledgeBaseRole.CONTRIBUTOR,
    label: 'Contributor',
    description: 'Can read and add content',
  },
  {
    value: KnowledgeBaseRole.VIEWER,
    label: 'Viewer',
    description: 'Read-only access',
  },
] as const;

/**
 * Bulk operation for knowledge base users
 */
export interface BulkKnowledgeBaseUserOperation {
  user_ids: string[];
  action: 'add' | 'remove' | 'update_role';
  role?: KnowledgeBaseRole;
  expires_at?: string;
}

/**
 * Result of bulk operation
 */
export interface BulkKnowledgeBaseUserResult {
  success: boolean;
  processed_count: number;
  total_count: number;
  errors?: Array<{
    user_id: string;
    error: string;
  }>;
}
