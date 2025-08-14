/**
 * Role Modal Component Exports
 *
 * Main exports for the role creation modal system
 */

export { RoleModal } from "./RoleModal";
export { PermissionsTable } from "./PermissionsTable";
export { PermissionRow } from "./PermissionRow";
export { ActionHeader } from "./ActionHeader";

// Export types
export type {
  RoleModalProps,
  PermissionsTableProps,
  PermissionRowProps,
  ActionHeaderProps,
  CreateRoleFormData,
  CreateRolePayload,
  PermissionRow as PermissionRowType,
  ActionKey,
  AccessLevel,
} from "@/interfaces/RoleModal";
