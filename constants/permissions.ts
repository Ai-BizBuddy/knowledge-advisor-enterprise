/**
 * Permission Constants
 * Based on the permissions table structure
 * 
 * Format: resource:action (e.g., 'dashboard:read', 'knowledge-base:create')
 */

export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD: {
    READ: 'dashboard:read',
  },

  // Knowledge Base permissions (general)
  KNOWLEDGE_BASE: {
    READ: 'knowledge-base:read',
    CREATE: 'knowledge-base:create',
    UPDATE: 'knowledge-base:update',
    DELETE: 'knowledge-base:delete',
  },

  // Knowledge Base Public permissions
  KNOWLEDGE_BASE_PUBLIC: {
    INSERT: 'knowledge-base-public:insert',
    UPDATE: 'knowledge-base-public:update',
    DELETE: 'knowledge-base-public:delete',
    SYNC: 'knowledge-base-public:sync',
  },

  // Knowledge Base Department permissions
  KNOWLEDGE_BASE_DEPARTMENT: {
    INSERT: 'knowledge-base-department:insert',
    UPDATE: 'knowledge-base-department:update',
    DELETE: 'knowledge-base-department:delete',
    SYNC: 'knowledge-base-department:sync',
  },

  // User permissions
  USER: {
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
  },

  // Document permissions
  DOCUMENT: {
    DELETE: 'document.delete',
  },

  // Department permissions
  DEPARTMENT: {
    READ: 'department.read',
    INSERT: 'department.insert',
    UPDATE: 'department.update',
    DELETE: 'department.delete',
  },
} as const;

/**
 * Page-level permission requirements
 * Maps routes to required permissions
 */
export const PAGE_PERMISSIONS = {
  DASHBOARD: [PERMISSIONS.DASHBOARD.READ] as string[],
  KNOWLEDGE_BASE: [PERMISSIONS.KNOWLEDGE_BASE.READ] as string[],
  DOCUMENTS: [PERMISSIONS.KNOWLEDGE_BASE.READ] as string[], // Users need to read knowledge bases to see documents
  LOGS: [] as string[], // Handled by isAdmin() check in the page component
  SETTINGS: {
    USERS: [PERMISSIONS.USER.READ] as string[],
    ROLES: [] as string[], // Currently no specific permission defined
    PERMISSIONS: [] as string[], // Currently no specific permission defined
    DEPARTMENTS: [PERMISSIONS.DEPARTMENT.READ] as string[],
  },
};

/**
 * Helper function to get all permissions as an array
 */
export const getAllPermissions = (): string[] => {
  const permissions: string[] = [];
  
  Object.values(PERMISSIONS).forEach((category) => {
    Object.values(category).forEach((permission) => {
      permissions.push(permission);
    });
  });
  
  return permissions;
};

/**
 * Helper function to check if a permission exists
 */
export const isValidPermission = (permission: string): boolean => {
  return getAllPermissions().includes(permission);
};

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  // All knowledge base permissions (any visibility)
  KNOWLEDGE_BASE_ANY: [
    PERMISSIONS.KNOWLEDGE_BASE.CREATE,
    PERMISSIONS.KNOWLEDGE_BASE.UPDATE,
    PERMISSIONS.KNOWLEDGE_BASE.DELETE,
    PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.INSERT,
    PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.UPDATE,
    PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.DELETE,
    PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.INSERT,
    PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.UPDATE,
    PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.DELETE,
  ],
  
  // All user management permissions
  USER_MANAGEMENT: [
    PERMISSIONS.USER.READ,
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.UPDATE,
    PERMISSIONS.USER.DELETE,
  ],
  
  // All department permissions
  DEPARTMENT_MANAGEMENT: [
    PERMISSIONS.DEPARTMENT.READ,
    PERMISSIONS.DEPARTMENT.INSERT,
    PERMISSIONS.DEPARTMENT.UPDATE,
    PERMISSIONS.DEPARTMENT.DELETE,
  ],
} as const;
