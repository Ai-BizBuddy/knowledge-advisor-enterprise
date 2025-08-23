export interface PermissionTableRow {
  id: number;
  resource: string;
  action: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  displayName: string;
  icon: string;
}

export interface PermissionModalData {
  id?: number;
  resource: string;
  action: string;
  description: string;
}

export interface PermissionsTableProps {
  selectedPermissions?: number[];
  onPermissionChange?: (permissionIds: number[]) => void;
  readonly?: boolean;
  showSummary?: boolean;
  className?: string;
}
