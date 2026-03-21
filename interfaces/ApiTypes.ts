export interface TypedResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TypedError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
