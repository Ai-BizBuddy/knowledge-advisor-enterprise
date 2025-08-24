/**
 * Login Form Types
 */

export interface LoginFormData extends Record<string, unknown> {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}
