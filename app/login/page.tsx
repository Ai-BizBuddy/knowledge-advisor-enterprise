'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { useAuth } from '@/hooks';
import { Alert, Spinner } from 'flowbite-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { setLoading } = useLoading();
  const { login, getSession, error } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const disabled = submitting || !form.email || !form.password;

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        if (session) {
          //router.replace('/dashboard');
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking session:', err);
        setLoading(false);
      }
    };
    checkSession();
  }, [getSession, router, setLoading]);

  const onChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', form);
    setSubmitting(true);
    setTimeout(async () => {
      if (form.email && form.password) {
        await login(form.email, form.password, form.remember);
      }
      setSubmitting(false);
    }, 1000);
  };

  return (
    <section className='h-[110vh] bg-gray-50 dark:bg-gray-900'>
      <div className='m-[-10vh] mx-auto flex h-screen flex-col items-center justify-center px-6 py-8 lg:py-0'>
        <a
          href='#'
          className='mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white'
        >
          <Image
            src='/assets/logo-ka.svg'
            alt='Knowledge Advisor logo'
            width={32}
            height={32}
            className='mr-3 h-12 w-12'
            priority
          />
          Knowledge Advisor
        </a>

        <div className='w-full rounded-lg bg-white shadow sm:max-w-md md:mt-0 xl:p-0 dark:border dark:border-gray-700 dark:bg-gray-800'>
          <div className='space-y-4 p-6 sm:p-8 md:space-y-6'>
            <h1 className='text-xl leading-tight font-bold tracking-tight text-gray-900 md:text-2xl dark:text-white'>
              Sign in to your account
            </h1>

            {error ? (
              
              <Alert color='failure' className='mt-2 items-center'>
                <span className='font-medium'>Error:</span> {error}
              </Alert>
            ) : null}

            <form className='space-y-4 md:space-y-6' onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor='email'
                  className='mb-2 block text-sm font-medium text-gray-900 dark:text-white'
                >
                  Your email
                </label>
                <input
                  type='email'
                  name='email'
                  id='email'
                  placeholder='Email address'
                  required
                  autoComplete='email'
                  disabled={submitting}
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className='focus:border-primary-600 focus:ring-primary-600 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
                />
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='mb-2 block text-sm font-medium text-gray-900 dark:text-white'
                >
                  Password
                </label>
                <input
                  type='password'
                  name='password'
                  id='password'
                  placeholder='••••••••'
                  required
                  autoComplete='current-password'
                  disabled={submitting}
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  className='focus:border-primary-600 focus:ring-primary-600 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-start'>
                  <div className='flex h-5 items-center'>
                    <input
                      id='remember'
                      aria-describedby='remember'
                      type='checkbox'
                      checked={form.remember}
                      onChange={(e) => onChange('remember', e.target.checked)}
                      className='focus:ring-primary-300 dark:focus:ring-primary-600 h-4 w-4 rounded border border-gray-300 bg-gray-50 focus:ring-3 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800'
                    />
                  </div>
                  <div className='ml-3 text-sm'>
                    <label
                      htmlFor='remember'
                      className='text-gray-500 dark:text-gray-300'
                    >
                      Remember me
                    </label>
                  </div>
                </div>
              </div>

              <button
                type='submit'
                disabled={disabled}
                className='bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 w-full rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
              >
                {submitting ? (
                  <span className='inline-flex items-center justify-center gap-2'>
                    <Spinner size='sm' /> Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className='flex justify-center'>
                <p className='text-center text-sm font-light text-gray-500 dark:text-gray-400'>
                  Copyright © 2025 ai factory. All Rights Reserved.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
