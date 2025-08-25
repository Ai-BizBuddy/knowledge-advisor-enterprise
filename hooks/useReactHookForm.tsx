'use client';
/**
 * React Hook Form Utility
 *
 * Enhanced React Hook Form hook with proper TypeScript support
 * and consistent configuration across the application.
 */

import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';

/**
 * Custom React Hook Form hook with standard configuration
 *
 * @param options - Standard useForm options
 * @returns Enhanced useForm return with consistent settings
 */
export function useReactHookForm<TFormValues extends Record<string, unknown>>(
  options?: UseFormProps<TFormValues>,
): UseFormReturn<TFormValues> {
  return useForm<TFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    ...options,
  });
}
