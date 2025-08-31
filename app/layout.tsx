'use client';

import { ToastProvider } from '@/components/toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ThemeModeScript } from 'flowbite-react';
import { Noto_Sans, Noto_Sans_Mono } from 'next/font/google';
import { ThemeInit } from '../.flowbite-react/init';
import './globals.css';

const notoSans = Noto_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const notoMono = Noto_Sans_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <title>Knowledge Advisor</title>
        <meta
          name='description'
          content='A platform for ai agentic document knowledge.'
        />
        <link
          rel='icon'
          type='image/svg+xml'
          href='/assets/logo-ka.svg'
        />
        <ThemeModeScript />
      </head>
      <body
        className={`${notoSans.variable} ${notoMono.variable} bg-gray-200 antialiased dark:bg-gray-800`}
      >
        <ThemeInit />
        <AuthProvider>
          <LoadingProvider>
            <ToastProvider>{children}</ToastProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
