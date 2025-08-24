/**
 * Create User Form Component Types
 */

export interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: import('@/interfaces/UserManagement').User) => void;
  availableRoles?: import('@/interfaces/UserManagement').Role[];
  availableDepartments?: import('@/interfaces/UserManagement').Department[];
}

export interface CreateUserFormData extends Record<string, unknown> {
  email: string;
  password: string;
  confirmPassword: string;
  display_name: string;
  role_ids: number[];
  department_id?: string;
}
