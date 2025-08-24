/**
 * User, Role, and Permission Management Interfaces
 *
 * Comprehensive type definitions for user management system
 * with Supabase Auth integration and permission-based access control.
 */

/**
 * Custom error interface for user management operations
 */
export interface UserManagementError extends Error {
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Department interface for organizational structure
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
}

/**
 * User interface extending Supabase Auth user with additional fields
 */
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  user_roles: UserRoleRow[];
  department_id?: string;
  department?: Department;
  status: UserStatus;
  profile: Profile;
  created_at: string;
  updated_at: string;
}

export interface UserDepartment {
  name: string;
}

export interface Profile {
  full_name: string;
  avatar_url: string;
}

export interface UserRolePermission {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export type UserDisplayPermission = User & {
  user_roles: UserRolePermission[];
};

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * Role interface with hierarchical permissions
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
  level?: number;
  permissions: Permission[];
  is_system_role?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  role: Pick<Role, 'id' | 'name' | 'description'>;
}

/**
 * Permission interface for granular access control
 */
export interface Permission {
  id: number;
  name: string;
  resource?: string; // e.g., 'project', 'document', 'user'
  action?: PermissionAction;
  description?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Permission actions enum
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full access
  EXECUTE = 'execute', // For special actions like RAG sync
}

/**
 * Feature access interface for menu/page control
 */
export interface FeatureAccess {
  feature: string;
  access_level: AccessLevel;
  permissions: PermissionAction[];
}

/**
 * Access level enum
 */
export enum AccessLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  password: string;
  display_name?: string;
  role_ids: number[]; // Array of role IDs
  department_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  email?: string;
  display_name?: string;
  role_ids?: number[]; // Array of role IDs
  department_id?: string;
  status?: UserStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Role creation input
 */
export interface CreateRoleInput {
  name: string;
  description?: string;
  level?: number;
  permission_ids: number[];
}

/**
 * Role update input
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  level?: number;
  permission_ids?: number[];
}

/**
 * Permission creation input
 */
export interface CreatePermissionInput {
  name: string;
  resource?: string;
  action?: PermissionAction;
  description?: string;
}

/**
 * Permission update input
 */
export interface UpdatePermissionInput {
  name?: string;
  resource?: string;
  action?: PermissionAction;
  description?: string;
}

/**
 * Department creation input
 */
export interface CreateDepartmentInput {
  name: string;
  description?: string;
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Department update input
 */
export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

/**
 * User filter options
 */
export interface UserFilter {
  status?: UserStatus[];
  role_ids?: number[]; // Array of role IDs for filtering
  department_ids?: string[];
  search?: string;
  sort_by?: 'email' | 'display_name' | 'created_at' | 'last_login_at';
  sort_order?: 'asc' | 'desc';
  include_deleted?: boolean;
}

/**
 * User activity log
 */
export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  required_permission?: string;
}

/**
 * User session with permissions
 */
export interface UserSession {
  user: User;
  permissions: Permission[];
  features: FeatureAccess[];
  session_id: string;
  expires_at: string;
}

/**
 * Default system roles
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

/**
 * Default features for navigation control
 */
export const FEATURES = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects',
  DOCUMENTS: 'documents',
  CHAT: 'chat',
  USER_MANAGEMENT: 'user_management',
  SETTINGS: 'settings',
  TEAM: 'team',
} as const;

/**
 * Navigation item with permission requirements
 */
export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  requiredFeature?: string;
  requiredPermissions?: PermissionAction[];
  minimumRole?: number;
}
