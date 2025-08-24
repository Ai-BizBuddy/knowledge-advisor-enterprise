'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { useAuth } from '@/hooks';
import { Button, Checkbox, Label, TextInput } from 'flowbite-react';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login, getSession, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const { setLoading, isLoading } = useLoading();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        if (session) {
          setLoading(true); // Keep loading while redirecting
          window.location.href = '/dashboard';
          return; // Don't set loading to false if redirecting
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        setLoading(false);
      }
    };
    checkSession();
  }, [getSession, setLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setLoading(true);
      await login(form.email, form.password);
      
      // Check if login was successful
      const session = await getSession();
      if (session) {
        // Keep loading state while redirecting
        window.location.href = '/dashboard';
      } else {
        // Login failed, stop loading
        setLoading(false);
        setIsSubmitting(false);
      }
    } catch (err) {
      setLoading(false);
      setIsSubmitting(false);
      console.error('Login failed:', err);
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

        {/* Loading overlay */}
        {(isLoading || isSubmitting) && (
          <div className='mb-4 flex items-center justify-center rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20'>
            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'></div>
            <span className='text-sm text-blue-600 dark:text-blue-400'>
              {isSubmitting ? 'Signing in...' : 'Loading...'}
            </span>
          </div>
        )}

        {/* Error message */}
        {error && !isSubmitting && (
          <div className='mb-4 rounded-lg bg-red-100 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-900 dark:text-red-300'>
            {typeof error === 'string'
              ? error
              : 'Login failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <Label htmlFor='email'>Email</Label>
            <TextInput
              id='email'
              type='email'
              placeholder='name@example.com'
              required
              name='email'
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
              className={isSubmitting ? 'opacity-50' : ''}
            />
          </div>

          <div>
            <Label htmlFor='password'>Password</Label>
            <TextInput
              id='password'
              type='password'
              placeholder='••••••••'
              required
              name='password'
              value={form.password}
              onChange={handleChange}
              disabled={isSubmitting}
              className={isSubmitting ? 'opacity-50' : ''}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Checkbox id='remember' disabled={isSubmitting} />
              <Label htmlFor='remember' className={isSubmitting ? 'opacity-50' : ''}>
                Remember me
              </Label>
            </div>
            <a
              href='#'
              className={`text-sm text-blue-600 hover:underline dark:text-blue-400 ${
                isSubmitting ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Forgot password?
            </a>
          </div>

          <Button 
            type='submit' 
            className='w-full' 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className='flex items-center justify-center'>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
