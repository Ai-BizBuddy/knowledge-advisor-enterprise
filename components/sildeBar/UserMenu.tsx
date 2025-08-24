import { APP_STRINGS } from '@/constants';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useRef } from 'react';

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  handleLogout?: () => void;
}

/**
 * User dropdown menu component with dynamic profile data
 */
export const UserMenu = ({ isOpen, onToggle, handleLogout }: UserMenuProps) => {
  const { userProfile, loading } = useUserProfile();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Display values with fallbacks
  const displayName =
    userProfile?.full_name ||
    userProfile?.email?.split('@')[0] ||
    APP_STRINGS.DEFAULT_USER_NAME;
  const displayEmail = userProfile?.email || APP_STRINGS.DEFAULT_USER_EMAIL;

  return (
    <div className='relative' ref={menuRef}>
      <button
        type='button'
        className='flex rounded-full bg-gray-800 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600'
        aria-expanded={isOpen}
        onClick={onToggle}
        disabled={loading}
      >
        <span className='sr-only'>Open user menu</span>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white'>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className='absolute top-14 right-0 z-50 list-none divide-y divide-gray-100 rounded-sm bg-white text-base shadow-sm dark:divide-gray-600 dark:bg-gray-700'>
          <div className='px-4 py-3' role='none'>
            <p className='text-sm text-gray-900 dark:text-white' role='none'>
              {displayName}
            </p>
            <p
              className='truncate text-sm font-medium text-gray-900 dark:text-gray-300'
              role='none'
            >
              {displayEmail}
            </p>
          </div>
          <ul className='py-1' role='none'>
            <li>
              <button
                onClick={handleLogout}
                className='block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white'
                role='menuitem'
              >
                {APP_STRINGS.ACTIONS.SIGN_OUT}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
