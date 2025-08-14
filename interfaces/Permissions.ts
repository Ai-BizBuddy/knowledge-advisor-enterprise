/**
 * Permissions Table Interfaces
 *
 * Type definitions for the role permissions table component
 */

import { Permission } from "./UserManagement";

/**
 * Action types for permissions matrix
 */
export enum PermissionActions {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  ADMIN = "admin",
  INSERT = "insert", // Alias for CREATE
  MANAGE = "manage", // Alias for ADMIN
}

/**
 * Resource metadata from database
 */
export interface ResourceMetadata {
  icon: string;
  displayName: string;
}

/**
 * Resource configuration for permissions table
 */
export interface ResourceConfig {
  name: string;
  icon: string;
  displayName: string;
  actions: string[];
}

/**
 * Grouped permissions by resource
 */
export interface GroupedPermissions {
  [resource: string]: {
    permissions: Permission[];
    hasAllActions: boolean;
    availableActions: string[];
  };
}

/**
 * Permission selection state
 */
export interface PermissionSelection {
  [permissionId: number]: boolean;
}

/**
 * Permission row data for table display
 */
export interface PermissionRowData {
  resource: string;
  displayName: string;
  icon: string;
  permissions: {
    [action: string]: Permission | null;
  };
  hasAllActions: boolean;
}

/**
 * Form values for permissions selection
 */
export interface PermissionsFormValues extends Record<string, unknown> {
  selectedPermissions: PermissionSelection;
}

/**
 * Props for PermissionsTable component
 */
export interface PermissionsTableProps {
  roleId?: number;
  selectedPermissions?: number[];
  onPermissionChange?: (permissionIds: number[]) => void;
  readonly?: boolean;
  showSummary?: boolean;
  className?: string;
}

/**
 * Standard action columns for the table
 */
export const STANDARD_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "ADMIN"];
