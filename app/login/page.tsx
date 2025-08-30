'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { useAuth, useReactHookForm } from '@/hooks';
import { LoginFormData } from '@/interfaces/LoginForm';
import {
  getRememberedCredentials,
  saveRememberedCredentials
} from '@/utils/authHelpers';
import { Button, Checkbox, Label, TextInput } from 'flowbite-react';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login, getSession, error } = useAuth();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const { setLoading } = useLoading();

  const form = useReactHookForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        if (session) {
          window.location.href = '/dashboard';
          return; // Don't set loading to false if redirecting
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        setLoading(false);
      }
    };

    // Check for saved credentials
    const rememberedCredentials = getRememberedCredentials();
    if (rememberedCredentials) {
      setFormState({ email: rememberedCredentials.email, password: '' });
      setRememberMe(rememberedCredentials.rememberMe);
    }

    checkSession();
  }, [getSession, setLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await login(data.email, data.password, data.rememberMe);

      // Handle remember me functionality
      saveRememberedCredentials(data.email, data.rememberMe ?? false);
    } catch (err) {
      console.error('Login failed:', err);
      // Set form error for display
      if (err instanceof Error) {
        form.setError('root', { message: err.message });
      }
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900'>
      <div className='w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800'>
        {/* Logo or Title */}
        <div className='mb-6 text-center'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Knowledge Advisor
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error message */}
        {(error || form.formState.errors.root) &&
          !form.formState.isSubmitting && (
            <div className='mb-4 rounded-lg bg-red-100 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-900 dark:text-red-300'>
              {form.formState.errors.root?.message ||
                (typeof error === 'string'
                  ? error
                  : 'Login failed. Please try again.')}
            </div>
          )}

        {/* Success message */}
        {form.formState.isSubmitSuccessful && !form.formState.isSubmitting && (
          <div className='mb-4 rounded-lg bg-green-100 px-3 py-2 text-center text-sm text-green-600 dark:bg-green-900 dark:text-green-300'>
            Login successful! Redirecting...
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-5'>
          {form.formState.isValidating && (
            <div className='text-center text-sm text-yellow-600 dark:text-yellow-400'>
              <span className='inline-flex items-center gap-2'>
                <svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    fill='none'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8v8z'
                  />
                </svg>
                Validating...
              </span>
            </div>
          )}

          <div>
            <Label htmlFor='email'>Email</Label>
            <TextInput
              id='email'
              type='email'
              placeholder='name@example.com'
              required
              {...form.register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              disabled={form.formState.isSubmitting || form.formState.disabled}
              className={`${form.formState.isSubmitting || form.formState.disabled ? 'opacity-50' : ''} ${
                form.formState.errors.email ? 'border-red-500' : ''
              } ${form.formState.isDirty && !form.formState.errors.email ? 'border-green-500' : ''}`}
            />
            {form.formState.errors.email && (
              <span className='text-sm text-red-600 dark:text-red-400'>
                {form.formState.errors.email.message}
              </span>
            )}
          </div>

          <div>
            <Label htmlFor='password'>Password</Label>
            <TextInput
              id='password'
              type='password'
              placeholder='••••••••'
              required
              {...form.register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              disabled={form.formState.isSubmitting || form.formState.disabled}
              className={`${form.formState.isSubmitting || form.formState.disabled ? 'opacity-50' : ''} ${
                form.formState.errors.password ? 'border-red-500' : ''
              } ${form.formState.isDirty && !form.formState.errors.password ? 'border-green-500' : ''}`}
            />
            {form.formState.errors.password && (
              <span className='text-sm text-red-600 dark:text-red-400'>
                {form.formState.errors.password.message}
              </span>
            )}
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='remember'
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Label htmlFor='remember'>Remember me</Label>
            </div>
            <a
              href='#'
              className={`text-sm text-blue-600 hover:underline dark:text-blue-400 ${
                form.formState.isSubmitting
                  ? 'pointer-events-none opacity-50'
                  : ''
              }`}
            >
              Forgot password?
            </a>
          </div>

          <Button
            type='submit'
            className='w-full'
            disabled={
              form.formState.isSubmitting ||
              form.formState.disabled ||
              !form.formState.isValid
            }
          >
            {form.formState.isSubmitting ? (
              <>
                <svg
                  aria-hidden='true'
                  role='status'
                  className='mr-2 inline h-4 w-4 animate-spin text-white'
                  viewBox='0 0 100 101'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                    fill='#E5E7EB'
                  />
                  <path
                    d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                    fill='currentColor'
                  />
                </svg>
                Signing in... (Attempt #{form.formState.submitCount + 1})
              </>
            ) : form.formState.isSubmitSuccessful ? (
              'Success! Redirecting...'
            ) : !form.formState.isValid && form.formState.isDirty ? (
              'Please fix errors above'
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
