# Hydration Mismatch Fixes

## Problem Summary

The application was experiencing hydration mismatches where server-rendered HTML didn't match client-rendered HTML, causing React to be unable to patch the differences.

## Root Causes Found & Fixed

### 1. DarkThemeToggle Component ✅ FIXED

**Issue**: Flowbite's `DarkThemeToggle` reads user theme preference which can differ between server and client.

**Solution**: Created `SafeDarkThemeToggle` wrapper that:

- Shows placeholder during SSR
- Only renders actual toggle after hydration
- Prevents mismatch by deferring client-specific rendering

**Files Changed**:

- Created: `components/SafeDarkThemeToggle.tsx`
- Updated: `components/sildeBar/index.tsx`
- Updated: `components/index.tsx`

### 2. AuthContext Window Access ✅ FIXED

**Issue**: Direct `window.location` access in auth state change handler caused server/client differences.

**Solution**: Wrapped redirect logic in `setTimeout` to defer execution until after hydration.

**Files Changed**:

- Updated: `contexts/AuthContext.tsx` (line 136)

### 3. Main Layout Window Access ✅ FIXED

**Issue**: Auth check and logout handler accessed `window.location` directly during render.

**Solution**: Used `setTimeout` to defer window access until after hydration.

**Files Changed**:

- Updated: `app/(main)/layout.tsx` (logout handler and auth check)

## Implementation Details

### SafeDarkThemeToggle Pattern

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return (
    <div className="h-6 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
  );
}

return <DarkThemeToggle />;
```

### Window Access Pattern

```tsx
// Before (causes hydration mismatch)
if (typeof window !== "undefined" && condition) {
  window.location.href = "/login";
}

// After (hydration-safe)
setTimeout(() => {
  if (condition) {
    window.location.href = "/login";
  }
}, 0);
```

## Verified Safe Areas

### ✅ These components are hydration-safe:

- `RecentActivityCard` - Uses static timestamps
- Dashboard mock data - Static content
- Chat hooks - Date/time used only in user interactions, not initial render
- Document hooks - Random IDs used only for user actions
- All page components - No SSR-sensitive logic

### ✅ These patterns are safe:

- `Date.now()` and `Math.random()` in event handlers
- `localStorage` access in hooks with proper guards
- Static mock data with fixed timestamps
- State management with consistent initial values

## Prevention Guidelines

### ❌ Avoid in render:

- `typeof window !== 'undefined'` branching
- `Date.now()`, `Math.random()` during initial render
- `new Date().toLocaleString()` variations
- Direct DOM/window access
- Browser-specific APIs during SSR

### ✅ Safe alternatives:

- Use `useEffect` for client-only logic
- `setTimeout` for deferred window access
- Hydration guards with `useState(false)` + `useEffect`
- Static data for initial render
- Server-provided timestamps

## Testing

After these fixes, the hydration mismatches should be resolved. The application will:

- Render consistently on server and client
- Show smooth transitions for theme toggle
- Handle auth redirects properly after hydration
- Maintain all functionality without SSR/client conflicts

## Monitoring

Watch for these warning patterns in the console:

- "Text content does not match server-rendered HTML"
- "Hydration failed because the initial UI does not match"
- "A tree hydrated but some attributes didn't match"

If these warnings appear, investigate for:

- New components using client-only APIs during render
- Date/time formatting during SSR
- Environment-specific rendering logic
- Third-party components without hydration guards
