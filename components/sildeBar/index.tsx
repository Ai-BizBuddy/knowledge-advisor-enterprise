'use client';

import { APP_STRINGS, UI_CONSTANTS } from '@/constants';
import Image from 'next/image';
import { useState } from 'react';
import { SafeDarkThemeToggle } from '../SafeDarkThemeToggle';
import { NavigationMenu } from './NavigationMenu';
import { UserMenu } from './UserMenu';
import { MenuIcon } from './constants';
import type { SlideBarProps } from './types';
import { useSidebar } from './useSidebar';

/**
 * Sidebar layout component with navigation and user menu
 */

export default function SlideBar({
  children,
  onNavigate,
  handleLogout,
}: SlideBarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    navigationItems,
    isUserMenuOpen,
    handleMenuItemClick,
    toggleUserMenu,
  } = useSidebar();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className='bg-opacity-50 fixed inset-0 z-30 bg-black sm:hidden'
          onClick={closeSidebar}
          aria-hidden='true'
        />
      )}

      {/* Navigation Bar */}
      <nav className='fixed top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='px-3 py-3 lg:px-5 lg:pl-3'>
          <div className='flex items-center justify-between'>
            {/* Logo and Mobile Menu Button */}
            <div className='flex items-center justify-start rtl:justify-end'>
              <button
                type='button'
                onClick={toggleSidebar}
                className='inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none sm:hidden md:hidden lg:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600'
                aria-label='Toggle sidebar'
              >
                <span className='sr-only'>Open sidebar</span>
                <MenuIcon />
              </button>

              <a href='https://flowbite.com' className='ms-2 flex md:me-24'>
                <Image
                  src='/assets/logo-ka.svg'
                  width={UI_CONSTANTS.AVATAR_SIZE}
                  height={UI_CONSTANTS.AVATAR_SIZE}
                  className='me-3 h-8 w-auto'
                  alt='Knowledge Advisor Logo'
                />
                <span className='self-center text-xl font-semibold whitespace-nowrap sm:text-2xl dark:text-white'>
                  {APP_STRINGS.APP_NAME}
                </span>
              </a>
            </div>

            {/* User Actions */}
            <div className='flex items-center'>
              <div className='ms-3 flex items-center gap-3'>
                <div>
                  <SafeDarkThemeToggle />
                </div>
                <UserMenu
                  isOpen={isUserMenuOpen}
                  onToggle={toggleUserMenu}
                  handleLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        id='logo-sidebar'
        className={`fixed top-0 left-0 z-40 h-screen w-full border-r border-gray-200 bg-white transition-transform sm:w-64 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0 dark:border-gray-700 dark:bg-gray-800`}
        aria-label='Sidebar'
      >
        <div className='bg-white dark:bg-gray-800'></div>
        <div className='h-full overflow-y-auto w-[inherit] bg-white dark:bg-gray-800 pt-20'>
          <NavigationMenu
            items={navigationItems}
            onItemClick={(index) => {
              if (onNavigate) onNavigate();
              handleMenuItemClick(index);
              closeSidebar();
            }}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className='h-full bg-gray-200 sm:ml-64 dark:bg-gray-900 overflow-auto'>
        <div className='mt-14 h-lvh overflow-x-auto'>{children}</div>
      </div>
    </>
  );
}
