import { APP_STRINGS, ROUTES } from '@/constants';
import type { NavigationMenuItem } from './types';

/**
 * Dashboard icon component
 */
export const DashboardIcon = () => (
  <svg
    className='h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    fill='currentColor'
    viewBox='0 0 22 21'
  >
    <path d='M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z' />
    <path d='M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z' />
  </svg>
);

/**
 * Chat icon component
 */
export const ChatIcon = () => (
  <svg
    className='h-6 w-6 text-gray-500 dark:text-gray-500'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      fillRule='evenodd'
      d='M3.559 4.544c.355-.35.834-.544 1.33-.544H19.11c.496 0 .975.194 1.33.544.356.35.559.829.559 1.331v9.25c0 .502-.203.981-.559 1.331-.355.35-.834.544-1.33.544H15.5l-2.7 3.6a1 1 0 0 1-1.6 0L8.5 17H4.889c-.496 0-.975-.194-1.33-.544A1.868 1.868 0 0 1 3 15.125v-9.25c0-.502.203-.981.559-1.331ZM7.556 7.5a1 1 0 1 0 0 2h8a1 1 0 0 0 0-2h-8Zm0 3.5a1 1 0 1 0 0 2H12a1 1 0 1 0 0-2H7.556Z'
      clipRule='evenodd'
    />
  </svg>
);

/**
 * Knowledge Base icon component
 */
export const KnowledgeBaseIcon = () => (
  <svg
    className='h-6 w-6 text-gray-500 dark:text-gray-500'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      fillRule='evenodd'
      d='M6 2a2 2 0 0 0-2 2v15a3 3 0 0 0 3 3h12a1 1 0 1 0 0-2h-2v-2h2a1 1 0 0 0 1-1V4a2 2 0 0 0-2-2h-8v16h5v2H7a1 1 0 1 1 0-2h1V2H6Z'
      clipRule='evenodd'
    />
  </svg>
);

/**
 * Documents icon component
 */
export const DocumentsIcon = () => (
  <svg
    className='h-6 w-6 text-gray-500 dark:text-gray-500'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      fillRule='evenodd'
      d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7ZM8 16a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1-5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9Z'
      clipRule='evenodd'
    />
  </svg>
);

/**
 * User Management icon component
 */
export const UserManagementIcon = () => (
  <svg
    className='h-6 w-6 text-gray-500 dark:text-gray-500'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      fillRule='evenodd'
      d='M12 6a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-1.5 8a4 4 0 0 0-4 4 2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-3Zm6.82-3.096a5.51 5.51 0 0 0-2.797-6.293 3.5 3.5 0 1 1 2.796 6.292ZM19.5 18h.5a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-1.1a5.503 5.503 0 0 1-.471.762A5.998 5.998 0 0 1 19.5 18ZM4 7.5a3.5 3.5 0 0 1 5.477-2.889 5.5 5.5 0 0 0-2.796 6.293A3.501 3.501 0 0 1 4 7.5ZM7.1 12H6a4 4 0 0 0-4 4 2 2 0 0 0 2 2h.5a5.998 5.998 0 0 1 3.071-5.238A5.505 5.505 0 0 1 7.1 12Z'
      clipRule='evenodd'
    />
  </svg>
);

/**
 * User Settings icon component
 */
export const UserSettingsIcon = () => (
  <svg
    className='h-6 w-6 text-gray-500 dark:text-gray-500'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      fillRule='evenodd'
      d='M12 2a2 2 0 0 1 2 2v1.09a7.001 7.001 0 0 1 3.36 1.94l.77-.77a2 2 0 1 1 2.83 2.83l-.77.77A7.001 7.001 0 0 1 20.91 10H22a2 2 0 1 1 0 4h-1.09a7.001 7.001 0 0 1-1.94 3.36l.77.77a2 2 0 1 1-2.83 2.83l-.77-.77A7.001 7.001 0 0 1 14 20.91V22a2 2 0 1 1-4 0v-1.09a7.001 7.001 0 0 1-3.36-1.94l-.77.77a2 2 0 1 1-2.83-2.83l.77-.77A7.001 7.001 0 0 1 3.09 14H2a2 2 0 1 1 0-4h1.09a7.001 7.001 0 0 1 1.94-3.36l-.77-.77a2 2 0 1 1 2.83-2.83l.77.77A7.001 7.001 0 0 1 10 3.09V2a2 2 0 0 1 2-2Zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'
      clipRule='evenodd'
    />
  </svg>
);

export const LogsIcon = () => (
  <svg
    className='h-6 w-6 text-gray-500 dark:text-gray-500'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      fillRule='evenodd'
      d='M20 10H4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8ZM9 13v-1h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1Z'
      clipRule='evenodd'
    />
    <path d='M2 6a2 2 0 0 1 2-2h16a2 2 0 1 1 0 4H4a2 2 0 0 1-2-2Z' />
  </svg>
);

/**
 * Menu icon component for mobile navigation
 */
export const MenuIcon = () => (
  <svg
    className='h-6 w-6'
    aria-hidden='true'
    fill='currentColor'
    viewBox='0 0 20 20'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      clipRule='evenodd'
      fillRule='evenodd'
      d='M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z'
    />
  </svg>
);

/**
 * Default navigation menu items
 */
export const getDefaultNavigationItems = (): NavigationMenuItem[] => [
  {
    name: APP_STRINGS.NAV_ITEMS.DASHBOARD,
    url: ROUTES.DASHBOARD,
    icon: <DashboardIcon />,
    active: false,
  },
  {
    name: APP_STRINGS.NAV_ITEMS.AI_CHAT,
    url: ROUTES.CHAT,
    icon: <ChatIcon />,
    active: false,
  },
  {
    name: APP_STRINGS.NAV_ITEMS.KNOWLEDGE_BASE,
    url: ROUTES.KNOWLEDGE_BASE,
    icon: <KnowledgeBaseIcon />,
    active: false,
  },
  {
    name: APP_STRINGS.NAV_ITEMS.DOCUMENTS,
    url: ROUTES.DOCUMENTS,
    icon: <DocumentsIcon />,
    active: false,
  },
  {
    name: APP_STRINGS.NAV_ITEMS.USER_SETTINGS,
    url: ROUTES.SETTINGS,
    icon: <UserSettingsIcon />,
    active: false,
  },

  {
    name: APP_STRINGS.NAV_ITEMS.LOGS,
    url: ROUTES.LOGS,
    icon: <LogsIcon />,
    active: false,
  },
];
