# Sidebar Permission Filtering - Visual Guide

## Overview

The sidebar navigation automatically shows/hides menu items based on user permissions. This provides a seamless user experience where users only see features they can access.

## How It Works

### 1. User Login → JWT Token with Permissions
```
User Login
    ↓
Server Issues JWT Token
    ↓
Token Contains:
  - permissions: ["dashboard:read", "knowledge-base:read"]
  - roles: ["viewer"]
```

### 2. Sidebar Loads → Decodes JWT → Filters Menu
```
Sidebar Component Mounts
    ↓
useSidebar Hook Executes
    ↓
Decode JWT Token
    ↓
Extract Permissions & Roles
    ↓
Filter Menu Items
    ↓
Render Visible Items Only
```

### 3. Menu Item Filtering Logic
```typescript
For each menu item:
  1. Check if permissions required
     - If NO → Show item (accessible to all)
     - If YES → Check user has at least ONE permission
  
  2. Check if roles required
     - If NO → Continue
     - If YES → Check user has at least ONE role
  
  3. If ALL checks pass → Show item
     Otherwise → Hide item
```

## Example Scenarios

### Scenario 1: Admin User

**User Permissions:**
```json
{
  "permissions": ["dashboard:read", "knowledge-base:read", "user:read"],
  "roles": ["admin"]
}
```

**Visible Menu Items:**
- ✅ Dashboard (requires `dashboard:read`) ← HAS PERMISSION
- ✅ AI Chat (no requirements) ← ALWAYS VISIBLE
- ✅ Knowledge Base (requires `knowledge-base:read`) ← HAS PERMISSION
- ✅ Documents (requires `knowledge-base:read`) ← HAS PERMISSION
- ✅ Settings (requires `user:read`) ← HAS PERMISSION
- ✅ Logs (requires `admin` role) ← HAS ROLE

**Result:** Sees all 6 menu items

---

### Scenario 2: Viewer User

**User Permissions:**
```json
{
  "permissions": ["dashboard:read", "knowledge-base:read"],
  "roles": ["viewer"]
}
```

**Visible Menu Items:**
- ✅ Dashboard (requires `dashboard:read`) ← HAS PERMISSION
- ✅ AI Chat (no requirements) ← ALWAYS VISIBLE
- ✅ Knowledge Base (requires `knowledge-base:read`) ← HAS PERMISSION
- ✅ Documents (requires `knowledge-base:read`) ← HAS PERMISSION
- ❌ Settings (requires `user:read`) ← MISSING PERMISSION
- ❌ Logs (requires `admin` role) ← MISSING ROLE

**Result:** Sees 4 menu items (Dashboard, Chat, Knowledge Base, Documents)

---

### Scenario 3: Limited User

**User Permissions:**
```json
{
  "permissions": ["dashboard:read"],
  "roles": ["user"]
}
```

**Visible Menu Items:**
- ✅ Dashboard (requires `dashboard:read`) ← HAS PERMISSION
- ✅ AI Chat (no requirements) ← ALWAYS VISIBLE
- ❌ Knowledge Base (requires `knowledge-base:read`) ← MISSING PERMISSION
- ❌ Documents (requires `knowledge-base:read`) ← MISSING PERMISSION
- ❌ Settings (requires `user:read`) ← MISSING PERMISSION
- ❌ Logs (requires `admin` role) ← MISSING ROLE

**Result:** Sees 2 menu items (Dashboard, Chat only)

---

### Scenario 4: Chat-Only User

**User Permissions:**
```json
{
  "permissions": [],
  "roles": ["guest"]
}
```

**Visible Menu Items:**
- ❌ Dashboard (requires `dashboard:read`) ← MISSING PERMISSION
- ✅ AI Chat (no requirements) ← ALWAYS VISIBLE
- ❌ Knowledge Base (requires `knowledge-base:read`) ← MISSING PERMISSION
- ❌ Documents (requires `knowledge-base:read`) ← MISSING PERMISSION
- ❌ Settings (requires `user:read`) ← MISSING PERMISSION
- ❌ Logs (requires `admin` role) ← MISSING ROLE

**Result:** Sees 1 menu item (Chat only)

## Menu Item Configuration Reference

| Menu Item | Required Permission | Required Role | Notes |
|-----------|-------------------|---------------|-------|
| Dashboard | `dashboard:read` | - | Core feature |
| AI Chat | - | - | Accessible to all |
| Knowledge Base | `knowledge-base:read` | - | Core feature |
| Documents | `knowledge-base:read` | - | Shares KB permission |
| Settings | `user:read` | - | User management |
| Logs | - | `admin` | Admin only |

## Adding New Menu Items

### Step 1: Define Permission (if needed)
```typescript
// In constants/permissions.ts
export const PERMISSIONS = {
  // ... existing permissions
  MY_FEATURE: {
    READ: 'my-feature:read',
    CREATE: 'my-feature:create',
  },
};
```

### Step 2: Add Menu Item
```typescript
// In components/sildeBar/constants.tsx
{
  name: 'My Feature',
  url: '/my-feature',
  icon: <MyFeatureIcon />,
  active: false,
  requiredPermissions: [PERMISSIONS.MY_FEATURE.READ],
}
```

### Step 3: Add Page Protection
```typescript
// In app/(main)/my-feature/page.tsx
export default function MyFeaturePage() {
  return (
    <PageGuard requiredPermissions={[PERMISSIONS.MY_FEATURE.READ]}>
      <MyFeatureContent />
    </PageGuard>
  );
}
```

## Loading State

While permissions are being loaded, the sidebar shows a skeleton:

```
┌─────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Skeleton loading animation
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────┘

After Loading:
┌─────────────────┐
│ 🏠 Dashboard    │ ← Visible items based on permissions
│ 💬 AI Chat      │
│ 📚 Knowledge B. │
└─────────────────┘
```

## Benefits

1. **Security**: Users cannot see features they don't have access to
2. **Clean UX**: No clutter from inaccessible menu items
3. **Automatic**: No manual configuration needed per user
4. **Real-time**: Updates when permissions change
5. **Type-Safe**: Uses centralized permission constants
6. **Maintainable**: Easy to add/remove menu items

## Testing Checklist

When testing sidebar filtering:

- [ ] Login as admin → See all menu items
- [ ] Login as viewer → See limited menu items
- [ ] Create custom role with specific permissions
- [ ] Verify menu updates based on role
- [ ] Check skeleton shows during loading
- [ ] Verify menu items match user permissions
- [ ] Try accessing hidden pages directly → Should be blocked by PageGuard
- [ ] Check responsive design (mobile sidebar)

## Troubleshooting

### Menu items not showing?

1. Check JWT token contains correct permissions
   ```typescript
   // In browser console
   const { permissions, roles } = useJWTPermissions();
   console.log('Permissions:', permissions);
   console.log('Roles:', roles);
   ```

2. Verify permission constants match database
   - Check `constants/permissions.ts`
   - Compare with database permissions table

3. Check menu item configuration
   - Open `components/sildeBar/constants.tsx`
   - Verify `requiredPermissions` array

### All menu items showing?

1. Check if permissions are being loaded
   - Look for console logs from `useSidebar`
   - Verify `isLoadingPermissions` state

2. Verify JWT token structure
   - Decode token at jwt.io
   - Check custom claims are present

### Menu not updating after permission change?

1. User needs to logout and login again
2. Or refresh JWT token programmatically
3. Permissions are loaded on component mount
