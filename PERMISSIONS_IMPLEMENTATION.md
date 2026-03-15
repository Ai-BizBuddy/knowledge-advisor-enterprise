# Permission-Based Access Control Implementation

## Overview

This document describes the implementation of a comprehensive permission-based access control system for the Knowledge Advisor Enterprise application. The system validates user permissions at the page level and conditionally renders UI components based on user roles and permissions.

## Implementation Summary

### 1. Permission Constants (`/constants/permissions.ts`)

Created a centralized permission constants file that maps all permissions from the database:

```typescript
export const PERMISSIONS = {
  DASHBOARD: { READ: 'dashboard:read' },
  KNOWLEDGE_BASE: {
    READ: 'knowledge-base:read',
    CREATE: 'knowledge-base:create',
    UPDATE: 'knowledge-base:update',
    DELETE: 'knowledge-base:delete',
  },
  KNOWLEDGE_BASE_PUBLIC: {
    INSERT: 'knowledge-base-public:insert',
    UPDATE: 'knowledge-base-public:update',
    DELETE: 'knowledge-base-public:delete',
    SYNC: 'knowledge-base-public:sync',
  },
  KNOWLEDGE_BASE_DEPARTMENT: {
    INSERT: 'knowledge-base-department:insert',
    UPDATE: 'knowledge-base-department:update',
    DELETE: 'knowledge-base-department:delete',
    SYNC: 'knowledge-base-department:sync',
  },
  USER: {
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
  },
  DOCUMENT: { DELETE: 'document.delete' },
  DEPARTMENT: {
    READ: 'department.read',
    INSERT: 'department.insert',
    UPDATE: 'department.update',
    DELETE: 'department.delete',
  },
};

export const PAGE_PERMISSIONS = {
  DASHBOARD: ['dashboard:read'],
  KNOWLEDGE_BASE: ['knowledge-base:read'],
  DOCUMENTS: ['knowledge-base:read'],
  LOGS: [], // Handled by isAdmin() check
  SETTINGS: {
    USERS: ['user:read'],
    ROLES: [],
    PERMISSIONS: [],
    DEPARTMENTS: ['department.read'],
  },
};
```

### 2. PageGuard Component (`/components/pageGuard/`)

Created a reusable `PageGuard` component that protects pages based on required permissions:

**Features:**
- Checks user permissions before rendering page content
- Shows loading state while checking permissions
- Displays AccessDenied component if unauthorized
- Supports redirect to another page on access denied
- Flexible requirement types: 'any' or 'all' permissions

**Usage Example:**
```typescript
<PageGuard
  requiredPermissions={PAGE_PERMISSIONS.DASHBOARD}
  deniedTitle='Dashboard Access Required'
  deniedMessage='You need dashboard:read permission to view this page.'
>
  <DashboardContent />
</PageGuard>
```

### 3. Page-Level Protection

Applied `PageGuard` to all main pages:

#### Dashboard Page (`/app/(main)/dashboard/page.tsx`)
- **Required Permission:** `dashboard:read`
- Shows dashboard statistics, recent activity, and system metrics

#### Knowledge Base Page (`/app/(main)/knowledge-base/page.tsx`)
- **Required Permission:** `knowledge-base:read`
- Lists all knowledge bases the user has access to
- Additional permissions checked per knowledge base:
  - Department KB: requires `knowledge-base-department:*` permissions
  - Public KB: requires `knowledge-base-public:*` permissions

#### Documents Page (`/app/(main)/documents/page.tsx`)
- **Required Permission:** `knowledge-base:read`
- Shows all documents across knowledge bases
- Document deletion requires specific permissions

#### Logs Page (`/app/(main)/logs/page.tsx`)
- **Special Case:** Uses `isAdmin()` check instead of specific permission
- Only administrators can view system logs

### 4. Sidebar Menu Permission Filtering

The sidebar navigation automatically filters menu items based on user permissions:

**Implementation** (`/components/sildeBar/useSidebar.ts`):
- Loads user permissions from JWT token on mount
- Filters navigation items based on `requiredPermissions` and `requiredRoles`
- Shows skeleton loader while checking permissions
- Only displays menu items the user has access to

**Menu Item Configuration** (`/components/sildeBar/constants.tsx`):
```typescript
{
  name: APP_STRINGS.NAV_ITEMS.DASHBOARD,
  url: ROUTES.DASHBOARD,
  icon: <DashboardIcon />,
  active: false,
  requiredPermissions: [PERMISSIONS.DASHBOARD.READ],
},
{
  name: APP_STRINGS.NAV_ITEMS.KNOWLEDGE_BASE,
  url: ROUTES.KNOWLEDGE_BASE,
  icon: <KnowledgeBaseIcon />,
  active: false,
  requiredPermissions: [PERMISSIONS.KNOWLEDGE_BASE.READ],
},
{
  name: APP_STRINGS.NAV_ITEMS.LOGS,
  url: ROUTES.LOGS,
  icon: <LogsIcon />,
  active: false,
  requiredRoles: ['admin'], // Role-based restriction
},
```

**How It Works:**
1. User logs in and JWT token contains permissions/roles
2. Sidebar hook decodes JWT and extracts permissions
3. Each menu item is checked against user's permissions
4. Only accessible menu items are displayed
5. Users cannot see navigation links they don't have access to

### 5. Component-Level Permission Checks

Many components already implement permission checks using `useJWTPermissions` hook:

#### DocumentList Component
```typescript
const { hasAnyPermission } = useJWTPermissions();
const canCreateDocument = hasAnyPermission(['knowledge-base-department:insert']);
const canDeleteDocument = hasAnyPermission(['knowledge-base-department:delete']);
const canUpdateDocument = hasAnyPermission(['knowledge-base-department:update']);
```

#### Knowledge Base Card
```typescript
// Check visibility-specific permissions
const isDepartmentKB = kb.visibility === 'department';
const isPublicKB = kb.visibility === 'public';

let canEdit = canUpdateKB;
let canDelete = canDeleteKB;

if (isDepartmentKB) {
  canEdit = hasAnyPermission(['knowledge-base-department:update']);
  canDelete = hasAnyPermission(['knowledge-base-department:delete']);
} else if (isPublicKB) {
  canEdit = hasAnyPermission(['knowledge-base-public:update']);
  canDelete = hasAnyPermission(['knowledge-base-public:delete']);
}
```

## Permission Database Structure

The permissions are stored in the database with the following structure:

| ID | Name | Resource | Action | Description |
|----|------|----------|--------|-------------|
| 1 | dashboard:read | dashboard | read | View dashboard information |
| 2 | knowledge-base:read | knowledge-base | read | View project details |
| 3 | knowledge-base:create | knowledge-base | insert | Create new projects |
| 4 | knowledge-base:update | knowledge-base | update | Update existing projects |
| 5 | knowledge-base:delete | knowledge-base | delete | Delete projects |
| 6 | user:read | user | read | View user information |
| 9 | user:create | user | insert | Create new users |
| 10 | user:update | user | update | Update user information |
| 11 | user:delete | user | delete | Delete users |
| 13 | document.delete | document | delete | Delete documents |
| 19 | knowledge-base-public:insert | knowledge-base-public | insert | Create public knowledge bases |
| 20 | knowledge-base-public:update | knowledge-base-public | update | Update public knowledge bases |
| 21 | knowledge-base-public:delete | knowledge-base-public | delete | Delete public knowledge bases |
| 22 | knowledge-base-department:insert | knowledge-base-department | insert | Create department-level knowledge bases |
| 23 | knowledge-base-department:update | knowledge-base-department | update | Update department-level knowledge bases |
| 24 | knowledge-base-department:delete | knowledge-base-department | delete | Delete department-level knowledge bases |
| 42 | knowledge-base-public:sync | knowledge-base-public | sync | Sync public knowledge bases |
| 43 | knowledge-base-department:sync | knowledge-base-department | sync | Sync department-level knowledge bases |

## JWT Permissions Hook (`useJWTPermissions`)

The existing `useJWTPermissions` hook provides:

- **hasPermission(permission: string)**: Check single permission
- **hasAnyPermission(permissions: string[])**: Check if user has ANY of the permissions
- **hasAllPermissions(permissions: string[])**: Check if user has ALL permissions
- **hasRole(role: string)**: Check if user has specific role
- **hasAnyRole(roles: string[])**: Check if user has ANY of the roles
- **isAdmin()**: Check if user is an administrator

## User Flow

1. **Authentication**: User logs in with credentials
2. **JWT Token**: Server issues JWT token with embedded permissions
3. **Permission Loading**: `useJWTPermissions` hook decodes JWT and extracts permissions
4. **Page Access**: `PageGuard` validates required permissions
5. **UI Rendering**: Components conditionally render based on permissions

## Testing Instructions

### 1. Test with Admin User
```bash
Email: admin@admin.co.th
Password: P@ssw0rd.
```

Admin users should have access to all pages and features.

### 2. Create Test Role with Limited Permissions

Navigate to Settings → Roles:
1. Create a new role (e.g., "Viewer")
2. Assign only `dashboard:read` and `knowledge-base:read` permissions
3. Save the role

### 3. Create Test User

Navigate to Settings → Users:
1. Create a new user
2. Assign the "Viewer" role
3. Save the user

### 4. Test Access Control

1. Logout from admin account
2. Login with test user credentials
3. Verify **Sidebar Menu**:
   - ✅ Dashboard menu item appears (if has `dashboard:read`)
   - ✅ Knowledge Base menu item appears (if has `knowledge-base:read`)
   - ✅ Documents menu item appears (if has `knowledge-base:read`)
   - ❌ Settings menu item hidden (requires `user:read`)
   - ❌ Logs menu item hidden (requires `admin` role)
4. Verify **Page Access**:
   - ✅ Can access Dashboard (read-only)
   - ✅ Can access Knowledge Base (read-only)
   - ✅ Can access Documents (read-only)
   - ❌ Cannot create/edit/delete knowledge bases
   - ❌ Cannot upload/delete documents
   - ❌ Cannot access Settings (redirected or shown access denied)
   - ❌ Cannot access Logs (redirected or shown access denied)
5. Verify **Component Actions**:
   - ❌ "Create Knowledge Base" button is hidden
   - ❌ "Upload Documents" button is hidden
   - ❌ Edit/Delete buttons on cards are hidden

## Benefits

1. **Centralized Permission Management**: All permissions defined in one place
2. **Type-Safe**: TypeScript ensures permission strings are correct
3. **Reusable Components**: `PageGuard` can be used anywhere
4. **Flexible**: Supports different requirement types (any/all)
5. **User-Friendly**: Clear error messages when access is denied
6. **Performance**: Permissions checked once per page load
7. **Maintainable**: Easy to add new permissions or modify existing ones
8. **Automatic Sidebar Filtering**: Users only see menu items they can access
9. **Seamless UX**: Menu items appear/disappear based on permissions without page reload

## Build Verification

✅ **Production build completed successfully**
- No TypeScript errors
- No linting errors
- All pages compile correctly
- Permission system fully integrated

## Files Modified

### New Files
- `/constants/permissions.ts` - Permission constants and mappings
- `/components/pageGuard/PageGuard.tsx` - Page protection component
- `/components/pageGuard/PageGuard.types.ts` - TypeScript types
- `/components/pageGuard/index.tsx` - Component exports

### Modified Files
- `/constants/index.ts` - Export permission constants
- `/components/index.tsx` - Export PageGuard component
- `/app/(main)/dashboard/page.tsx` - Added PageGuard
- `/app/(main)/knowledge-base/page.tsx` - Added PageGuard
- `/app/(main)/documents/page.tsx` - Added PageGuard
- `/app/(main)/logs/page.tsx` - Already has admin check

## Next Steps

1. **Role Management**: Use Settings → Roles to create custom roles
2. **User Assignment**: Assign roles to users in Settings → Users
3. **Testing**: Test different permission combinations
4. **Documentation**: Update user documentation with permission requirements
5. **Monitoring**: Track permission-related access denials in logs

## Notes

- The Logs page uses `isAdmin()` check instead of specific permissions
- Chat page has no permission requirements (accessible to all authenticated users)
- Settings tabs have their own permission checks defined in `PAGE_PERMISSIONS.SETTINGS`
- Knowledge base visibility (department/public) affects required permissions for CRUD operations
