/**
 * Status Constants
 * 
 * Centralized definitions for all status values across the application.
 * These constants match the database constraints to ensure consistency.
 */

// ============================================
// DOCUMENT STATUS
// ============================================
/**
 * Document status values matching database constraint:
 * document_status_check: ('uploaded', 'queued', 'processing', 'ready', 'error', 'archived')
 */
export const DOCUMENT_STATUS = {
  UPLOADED: 'uploaded',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
  ARCHIVED: 'archived',
} as const;

export type DocumentStatus = typeof DOCUMENT_STATUS[keyof typeof DOCUMENT_STATUS];

/**
 * Document status display names
 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  [DOCUMENT_STATUS.UPLOADED]: 'Uploaded',
  [DOCUMENT_STATUS.QUEUED]: 'Queued',
  [DOCUMENT_STATUS.PROCESSING]: 'Processing',
  [DOCUMENT_STATUS.READY]: 'Ready',
  [DOCUMENT_STATUS.ERROR]: 'Error',
  [DOCUMENT_STATUS.ARCHIVED]: 'Archived',
};

/**
 * Document statuses that cannot be synced
 */
export const DOCUMENT_SYNC_DISABLED_STATUSES: DocumentStatus[] = [
  DOCUMENT_STATUS.QUEUED,
  DOCUMENT_STATUS.PROCESSING,
  DOCUMENT_STATUS.READY,
  DOCUMENT_STATUS.ARCHIVED,
];

// ============================================
// KNOWLEDGE BASE VISIBILITY
// ============================================
/**
 * Knowledge base visibility values matching database constraint:
 * knowledge_base_visibility_check: ('public', 'department', 'private', 'custom')
 */
export const KB_VISIBILITY = {
  PUBLIC: 'public',
  DEPARTMENT: 'department',
  PRIVATE: 'private',
  CUSTOM: 'custom',
} as const;

export type KBVisibility = typeof KB_VISIBILITY[keyof typeof KB_VISIBILITY];

/**
 * Knowledge base visibility display names
 */
export const KB_VISIBILITY_LABELS: Record<KBVisibility, string> = {
  [KB_VISIBILITY.PUBLIC]: 'Public',
  [KB_VISIBILITY.DEPARTMENT]: 'Department',
  [KB_VISIBILITY.PRIVATE]: 'Private',
  [KB_VISIBILITY.CUSTOM]: 'Custom',
};

/**
 * Knowledge base visibility descriptions
 */
export const KB_VISIBILITY_DESCRIPTIONS: Record<KBVisibility, string> = {
  [KB_VISIBILITY.PUBLIC]: 'Accessible to all users in the organization',
  [KB_VISIBILITY.DEPARTMENT]: 'Accessible to users in the same department',
  [KB_VISIBILITY.PRIVATE]: 'Accessible only to the owner',
  [KB_VISIBILITY.CUSTOM]: 'Custom access control',
};

// ============================================
// USER STATUS
// ============================================
/**
 * User status values matching database constraint:
 * users_status_check: ('active', 'inactive', 'suspended', 'pending')
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

/**
 * User status display names
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [USER_STATUS.ACTIVE]: 'Active',
  [USER_STATUS.INACTIVE]: 'Inactive',
  [USER_STATUS.SUSPENDED]: 'Suspended',
  [USER_STATUS.PENDING]: 'Pending',
};

/**
 * User status descriptions
 */
export const USER_STATUS_DESCRIPTIONS: Record<UserStatus, string> = {
  [USER_STATUS.ACTIVE]: 'User can access the system',
  [USER_STATUS.INACTIVE]: 'User account is temporarily disabled',
  [USER_STATUS.SUSPENDED]: 'User account is suspended due to policy violation',
  [USER_STATUS.PENDING]: 'User registration is pending approval',
};

// ============================================
// RAG SYNC STATUS
// ============================================
/**
 * RAG sync status values
 */
export const RAG_STATUS = {
  NOT_SYNCED: 'not_synced',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
} as const;

export type RagStatus = typeof RAG_STATUS[keyof typeof RAG_STATUS];

/**
 * RAG status display names
 */
export const RAG_STATUS_LABELS: Record<RagStatus, string> = {
  [RAG_STATUS.NOT_SYNCED]: 'Not Synced',
  [RAG_STATUS.SYNCING]: 'Syncing',
  [RAG_STATUS.SYNCED]: 'Synced',
  [RAG_STATUS.ERROR]: 'Error',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if document status allows syncing
 */
export function canSyncDocument(status: string): boolean {
  return !DOCUMENT_SYNC_DISABLED_STATUSES.includes(status as DocumentStatus);
}

/**
 * Check if document status indicates an error state
 */
export function isDocumentError(status: string): boolean {
  return status === DOCUMENT_STATUS.ERROR;
}

/**
 * Check if user is active
 */
export function isUserActive(status: string): boolean {
  return status === USER_STATUS.ACTIVE;
}

/**
 * Check if user can login
 */
export function canUserLogin(status: string): boolean {
  return status === USER_STATUS.ACTIVE;
}

/**
 * Get status color for UI components
 */
export function getStatusColor(status: string, type: 'document' | 'user' | 'kb' | 'rag'): string {
  switch (type) {
    case 'document':
      switch (status as DocumentStatus) {
        case DOCUMENT_STATUS.UPLOADED:
          return 'blue';
        case DOCUMENT_STATUS.QUEUED:
          return 'indigo';
        case DOCUMENT_STATUS.PROCESSING:
          return 'yellow';
        case DOCUMENT_STATUS.READY:
          return 'green';
        case DOCUMENT_STATUS.ERROR:
          return 'red';
        case DOCUMENT_STATUS.ARCHIVED:
          return 'gray';
        default:
          return 'gray';
      }
    
    case 'user':
      switch (status as UserStatus) {
        case USER_STATUS.ACTIVE:
          return 'green';
        case USER_STATUS.INACTIVE:
          return 'gray';
        case USER_STATUS.SUSPENDED:
          return 'red';
        case USER_STATUS.PENDING:
          return 'yellow';
        default:
          return 'gray';
      }
    
    case 'kb':
      switch (status as KBVisibility) {
        case KB_VISIBILITY.PUBLIC:
          return 'green';
        case KB_VISIBILITY.DEPARTMENT:
          return 'blue';
        case KB_VISIBILITY.PRIVATE:
          return 'purple';
        case KB_VISIBILITY.CUSTOM:
          return 'indigo';
        default:
          return 'gray';
      }
    
    case 'rag':
      switch (status as RagStatus) {
        case RAG_STATUS.SYNCED:
          return 'green';
        case RAG_STATUS.SYNCING:
          return 'yellow';
        case RAG_STATUS.NOT_SYNCED:
          return 'gray';
        case RAG_STATUS.ERROR:
          return 'red';
        default:
          return 'gray';
      }
    
    default:
      return 'gray';
  }
}

/**
 * Format any status value for display
 */
export function formatStatus(status: string, type: 'document' | 'user' | 'kb' | 'rag'): string {
  switch (type) {
    case 'document':
      return DOCUMENT_STATUS_LABELS[status as DocumentStatus] || status;
    case 'user':
      return USER_STATUS_LABELS[status as UserStatus] || status;
    case 'kb':
      return KB_VISIBILITY_LABELS[status as KBVisibility] || status;
    case 'rag':
      return RAG_STATUS_LABELS[status as RagStatus] || status;
    default:
      return status;
  }
}
