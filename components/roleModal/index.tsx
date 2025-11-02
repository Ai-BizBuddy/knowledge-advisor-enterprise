/**
 * Role Modal Component Exports
 *
 * Main exports for the role creation modal system
 */

export { ActionHeader } from './ActionHeader';
export { PermissionRow } from './PermissionRow';
export { PermissionsTable } from './PermissionsTable';
export { RoleModal } from './RoleModal';

// Export types
export type {
  ActionHeaderProps, ActionKey, CreateRoleFormData,
  CreateRolePayload, PermissionRowProps, PermissionRow as PermissionRowType, PermissionsTableProps, RoleModalProps
} from '@/interfaces/RoleModal';

