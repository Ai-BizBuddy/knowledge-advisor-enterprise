# Quick Reference: Using Permission System

## Import Permission Constants

```typescript
import { PERMISSIONS, PAGE_PERMISSIONS } from '@/constants';
import { useJWTPermissions } from '@/hooks';
import { PageGuard } from '@/components';
```

## Sidebar Menu Filtering

The sidebar automatically filters menu items based on user permissions. Menu items are configured in `/components/sildeBar/constants.tsx`:

### Add Permission to Menu Item

```typescript
// In constants.tsx
export const getDefaultNavigationItems = (): NavigationMenuItem[] => [
  {
    name: 'My Feature',
    url: '/my-feature',
    icon: <MyIcon />,
    active: false,
    requiredPermissions: [PERMISSIONS.MY_FEATURE.READ], // User needs this permission
  },
  {
    name: 'Admin Panel',
    url: '/admin',
    icon: <AdminIcon />,
    active: false,
    requiredRoles: ['admin'], // User needs admin role
  },
  {
    name: 'Chat',
    url: '/chat',
    icon: <ChatIcon />,
    active: false,
    // No permissions required - accessible to all authenticated users
  },
];
```

### Permission Check Logic

- **No permissions/roles required**: Menu item visible to all authenticated users
- **Permissions required**: User needs at least ONE of the specified permissions
- **Roles required**: User needs at least ONE of the specified roles
- **Both required**: User must satisfy BOTH role AND permission requirements

## Page-Level Protection

### Protect Entire Page
```typescript
export default function MyPage() {
  return (
    <PageGuard
      requiredPermissions={[PERMISSIONS.DASHBOARD.READ]}
      deniedTitle='Access Denied'
      deniedMessage='You need dashboard:read permission to access this page.'
    >
      <YourPageContent />
    </PageGuard>
  );
}
```

### Require Multiple Permissions (ANY)
```typescript
<PageGuard
  requiredPermissions={[
    PERMISSIONS.USER.READ,
    PERMISSIONS.USER.CREATE
  ]}
  requirementType='any' // User needs at least ONE of these
>
  <Content />
</PageGuard>
```

### Require Multiple Permissions (ALL)
```typescript
<PageGuard
  requiredPermissions={[
    PERMISSIONS.USER.READ,
    PERMISSIONS.USER.UPDATE
  ]}
  requirementType='all' // User needs ALL of these
>
  <Content />
</PageGuard>
```

### Redirect on Access Denied
```typescript
<PageGuard
  requiredPermissions={[PERMISSIONS.USER.READ]}
  redirectTo='/dashboard' // Redirect instead of showing error
>
  <Content />
</PageGuard>
```

## Component-Level Permission Checks

### Conditional Rendering

```typescript
const { hasPermission, hasAnyPermission, hasAllPermissions } = useJWTPermissions();

// Check single permission
{hasPermission(PERMISSIONS.USER.CREATE) && (
  <button>Create User</button>
)}

// Check any of multiple permissions
{hasAnyPermission([
  PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.INSERT,
  PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.INSERT
]) && (
  <button>Create Knowledge Base</button>
)}

// Check all permissions required
{hasAllPermissions([
  PERMISSIONS.USER.READ,
  PERMISSIONS.USER.UPDATE
]) && (
  <button>Edit User</button>
)}
```

### Determine Permissions Dynamically

```typescript
const { hasAnyPermission } = useJWTPermissions();

// For department knowledge bases
const isDepartmentKB = knowledgeBase.visibility === 'department';
const isPublicKB = knowledgeBase.visibility === 'public';

let canCreate, canUpdate, canDelete;

if (isDepartmentKB) {
  canCreate = hasAnyPermission([PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.INSERT]);
  canUpdate = hasAnyPermission([PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.UPDATE]);
  canDelete = hasAnyPermission([PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.DELETE]);
} else if (isPublicKB) {
  canCreate = hasAnyPermission([PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.INSERT]);
  canUpdate = hasAnyPermission([PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.UPDATE]);
  canDelete = hasAnyPermission([PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.DELETE]);
}
```

## Available Permission Constants

### Dashboard
- `PERMISSIONS.DASHBOARD.READ`

### Knowledge Base (General)
- `PERMISSIONS.KNOWLEDGE_BASE.READ`
- `PERMISSIONS.KNOWLEDGE_BASE.CREATE`
- `PERMISSIONS.KNOWLEDGE_BASE.UPDATE`
- `PERMISSIONS.KNOWLEDGE_BASE.DELETE`

### Knowledge Base (Public)
- `PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.INSERT`
- `PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.UPDATE`
- `PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.DELETE`
- `PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.SYNC`

### Knowledge Base (Department)
- `PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.INSERT`
- `PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.UPDATE`
- `PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.DELETE`
- `PERMISSIONS.KNOWLEDGE_BASE_DEPARTMENT.SYNC`

### User Management
- `PERMISSIONS.USER.READ`
- `PERMISSIONS.USER.CREATE`
- `PERMISSIONS.USER.UPDATE`
- `PERMISSIONS.USER.DELETE`

### Document Management
- `PERMISSIONS.DOCUMENT.DELETE`

### Department Management
- `PERMISSIONS.DEPARTMENT.READ`
- `PERMISSIONS.DEPARTMENT.INSERT`
- `PERMISSIONS.DEPARTMENT.UPDATE`
- `PERMISSIONS.DEPARTMENT.DELETE`

## Role-Based Checks

```typescript
const { hasRole, hasAnyRole, isAdmin } = useJWTPermissions();

// Check specific role
{hasRole('manager') && <ManagerPanel />}

// Check any of multiple roles
{hasAnyRole(['admin', 'manager']) && <ManagementPanel />}

// Check admin access
{isAdmin() && <AdminPanel />}
```

## Loading State

```typescript
const { loading, permissions } = useJWTPermissions();

if (loading) {
  return <LoadingSpinner />;
}

// Show content based on permissions
return (
  <div>
    {hasPermission(PERMISSIONS.USER.READ) && <UserList />}
  </div>
);
```

## Common Patterns

### Button with Permission Check
```typescript
{canDelete && (
  <button
    onClick={handleDelete}
    className='btn-danger'
  >
    <TrashIcon />
    Delete
  </button>
)}
```

### Menu Item with Permission Check
```typescript
{hasPermission(PERMISSIONS.USER.READ) && (
  <MenuItem href='/settings/users'>
    User Management
  </MenuItem>
)}
```

### Feature Flag with Permission
```typescript
const showAdvancedFeatures = hasAllPermissions([
  PERMISSIONS.KNOWLEDGE_BASE.UPDATE,
  PERMISSIONS.KNOWLEDGE_BASE_PUBLIC.SYNC
]);

{showAdvancedFeatures && <AdvancedSettings />}
```

## Best Practices

1. **Always use constants** instead of hardcoded strings
   ```typescript
   // ❌ Bad
   hasPermission('user:read')
   
   // ✅ Good
   hasPermission(PERMISSIONS.USER.READ)
   ```

2. **Check permissions at the right level**
   - Page-level: Use `PageGuard`
   - Component-level: Use `useJWTPermissions` hook

3. **Provide clear error messages**
   ```typescript
   <PageGuard
     requiredPermissions={[PERMISSIONS.USER.READ]}
     deniedMessage='You need user:read permission to view user information. Please contact your administrator.'
   >
   ```

4. **Handle loading states**
   ```typescript
   const { loading, hasPermission } = useJWTPermissions();
   
   if (loading) return <LoadingSpinner />;
   ```

5. **Combine with feature flags**
   ```typescript
   const canManageUsers = hasAllPermissions([
     PERMISSIONS.USER.READ,
     PERMISSIONS.USER.CREATE,
     PERMISSIONS.USER.UPDATE
   ]);
   ```

## Testing Permissions

1. Create test users with different roles
2. Assign specific permissions to roles
3. Login as test user and verify:
   - Pages are accessible/denied correctly
   - Buttons appear/hide based on permissions
   - Actions are allowed/prevented correctly

## Debugging

```typescript
const { permissions, roles } = useJWTPermissions();

// Log current user permissions
console.log('Current permissions:', permissions);
console.log('Current roles:', roles);

// Check specific permission
console.log('Has user:read?', hasPermission(PERMISSIONS.USER.READ));
```
