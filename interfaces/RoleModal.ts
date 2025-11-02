/**
 * Role Modal Interface Definitions
 *
 * TypeScript types for the Create New Role modal system
 * with table-based permissions UI and comprehensive form validation.
 * Updated to support dynamic actions and enhanced permission structure.
 */

// Action types for permissions table - now supports dynamic actions
export type ActionKey = string; // Made more flexible to support custom actions

// Permission row structure for the table
export interface PermissionRow {
  resource: string;
  actions: Record<string, { id: string; value: boolean }>;
}

// Form data structure using React Hook Form
export interface CreateRoleFormData extends Record<string, unknown> {
  roleName: string;
  description?: string;
  permissions: PermissionRow[];
}

// API submission payload
/**
 * API payload for creating/updating a role
 */
export interface CreateRolePayload {
  id?: string; // For edit mode
  roleName: string;
  description?: string;
  permissions: {
    resource: string;
    actions: { action: string; id: string }[];
  }[];
}

// Form validation rules
export const VALIDATION_RULES = {
  roleName: {
    required: 'Role name is required',
    minLength: { value: 2, message: 'Role name must be at least 2 characters' },
    maxLength: {
      value: 50,
      message: 'Role name must be less than 50 characters',
    },
    pattern: {
      value: /^[a-zA-Z0-9\s_-]+$/,
      message:
        'Role name can only contain letters, numbers, spaces, hyphens, and underscores',
    },
  },
  description: {
    maxLength: {
      value: 200,
      message: 'Description must be less than 200 characters',
    },
  }
};

// Component props interfaces
/**
 * RoleModal Component Props
 */
export interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRolePayload) => Promise<void>;
  loading?: boolean;
  mode?: 'create' | 'edit';
  initialData?: {
    id: string;
    roleName: string;
    description?: string;
    permissions: PermissionRow[];
  };
}

// Updated props for enhanced PermissionsTable
export interface PermissionsTableProps {
  permissions: PermissionRow[];
  onChange: (permissions: PermissionRow[]) => void;
  className?: string;
  validationErrors?: {
    [resource: string]: string;
  };
}

export interface PermissionRowProps {
  resource: string;
  actions: Record<string, boolean>; // Updated to use Record<string, boolean>
  onChange: (
    resource: string,
    actions: Record<string, boolean>, // Updated to use Record<string, boolean>
  ) => void;
  className?: string;
}

// Updated ActionHeader props for enhanced functionality
export interface ActionHeaderProps {
  action: string; // Changed from ActionKey to string
  allResources: string[];
  permissions: Array<{
    resource: string;
    actions: Record<string, boolean>; // Updated to use Record<string, boolean>
  }>;
  onToggleAll: (action: string, checked: boolean) => void; // Changed action type to string
  className?: string;
}
