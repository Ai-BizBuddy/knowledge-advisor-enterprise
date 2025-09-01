
// UI Constants
export const UI_CONSTANTS = {
  // Dimensions
  CARD_WIDTH: 320, // w-80 = 320px
  SIDEBAR_WIDTH: 256, // w-64 = 256px
  AVATAR_SIZE: 32,
  ICON_SIZE: 24,

  // Animation Delays
  ANIMATION_DELAY_1: 100,
  ANIMATION_DELAY_2: 200,
  ANIMATION_DELAY_3: 300,

  // Z-Index Values
  Z_INDEX_SIDEBAR: 40,
  Z_INDEX_NAVBAR: 50,
  Z_INDEX_MODAL: 99,

  // Responsive Breakpoints (Tailwind defaults)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },
} as const;

// Application Strings
export const APP_STRINGS = {
  APP_NAME: 'Knowledge Advisor',
  DEFAULT_USER_NAME: 'Neil Sims',
  DEFAULT_USER_EMAIL: 'neil.sims@flowbite.com',

  // Navigation
  NAV_ITEMS: {
    DASHBOARD: 'Dashboard',
    AI_CHAT: 'AI Chat',
    KNOWLEDGE_BASE: 'Knowledge Base',
    DOCUMENTS: 'Documents',
    USER_SETTINGS: 'Settings',
  },

  // Common Actions
  ACTIONS: {
    SAVE: 'Save',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
    EDIT: 'Edit',
    VIEW: 'View',
    SETTINGS: 'Settings',
    SIGN_OUT: 'Sign out',
  },

  // Status Messages
  STATUS: {
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    SAVED: 'Saved successfully',
    ERROR: 'An error occurred',
    NO_DATA: 'No data available',
  },
} as const;

// API Constants
export const API_CONSTANTS = {
  // Timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 120000,

  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // File Upload Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'txt', 'md'],

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Theme Constants
export const THEME_CONSTANTS = {
  // Color Classes
  COLORS: {
    PRIMARY: 'bg-blue-600',
    SUCCESS: 'bg-green-500',
    WARNING: 'bg-yellow-400',
    ERROR: 'bg-red-500',
    INFO: 'bg-blue-500',
  },

  // Text Colors
  TEXT_COLORS: {
    PRIMARY: 'text-gray-900 dark:text-white',
    SECONDARY: 'text-gray-500 dark:text-gray-400',
    MUTED: 'text-gray-400 dark:text-gray-500',
  },

  // Background Colors
  BG_COLORS: {
    PRIMARY: 'bg-white dark:bg-gray-900',
    SECONDARY: 'bg-gray-100 dark:bg-gray-800',
    HOVER: 'hover:bg-gray-100 dark:hover:bg-gray-700',
  },
} as const;

// Route Constants
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  KNOWLEDGE_BASE: '/knowledge-base',
  DOCUMENTS: '/documents',
  LOGIN: '/login',
  SETTINGS: '/settings',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access to this resource is forbidden.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size exceeds the maximum limit of ${API_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB.`,
  INVALID_FILE_TYPE: `Invalid file type. Allowed types: ${API_CONSTANTS.ALLOWED_FILE_TYPES.join(', ')}`,
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_SAVED: 'Data saved successfully',
  DATA_UPDATED: 'Data updated successfully',
  DATA_DELETED: 'Data deleted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',

  // User Management specific messages
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_PROFILE_UPDATED: 'User profile updated successfully',
  USER_STATUS_UPDATED: 'User status updated successfully',
} as const;
