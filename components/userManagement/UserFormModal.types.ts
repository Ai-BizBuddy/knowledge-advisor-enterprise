/**
 * User Form Modal Component Types
 */

import type { User, Role, Department } from '@/interfaces/UserManagement';

export interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: User | null;
  availableRoles?: Role[];
  availableDepartments?: Department[];
  onSuccess?: (user: User) => void;
}

export interface UserFormData extends Record<string, unknown> {
  email: string;
  password?: string;
  confirmPassword?: string;
  display_name: string;
  role_ids: number[];
  department_id?: string;
  status?: import('@/interfaces/UserManagement').UserStatus;
}
