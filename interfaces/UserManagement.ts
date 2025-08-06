/**
 * User, Role, and Permission Management Interfaces
 * 
 * Comprehensive type definitions for user management system
 * with Supabase Auth integration and permission-based access control.
 */

/**
 * User interface extending Supabase Auth user with additional fields
 */
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role_id: string;
  role?: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

/**
 * Role interface with hierarchical permissions
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // Higher level = more permissions
  permissions: Permission[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Permission interface for granular access control
 */
export interface Permission {
  id: string;
  name: string;
  resource: string; // e.g., 'project', 'document', 'user'
  action: PermissionAction;
  description: string;
  created_at: string;
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
  EXECUTE = 'execute' // For special actions like RAG sync
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
  ADMIN = 'admin'
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  password: string;
  display_name?: string;
  role_id: string;
  metadata?: Record<string, unknown>;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  email?: string;
  display_name?: string;
  role_id?: string;
  status?: UserStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Role creation input
 */
export interface CreateRoleInput {
  name: string;
  description: string;
  level: number;
  permission_ids: string[];
}

/**
 * Role update input
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  level?: number;
  permission_ids?: string[];
}

/**
 * User filter options
 */
export interface UserFilter {
  status?: UserStatus[];
  role_ids?: string[];
  search?: string;
  sort_by?: 'email' | 'display_name' | 'created_at' | 'last_login_at';
  sort_order?: 'asc' | 'desc';
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
  VIEWER: 'viewer'
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
  TEAM: 'team'
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
