---
name: component-ui
description: "Use when: creating a new React component, adding UI elements, building a modal, card, table, or form following the project's Tailwind v4 + Flowbite React + Framer Motion design system. Also use for component refactoring or accessibility improvements."
---

# UI Component Development

You are building a UI component for this Next.js 16 CSR-only app. Follow the dark-theme-first, glass morphism design language with Tailwind v4, Flowbite React, and Framer Motion 12.

**Non-negotiables**: No `any`. No `console.log`. `'use client'` on components with state. Accessibility via keyboard nav + ARIA. Mobile-first. Dark theme default.

---

## Step 0: Choose the Right Component Type

| What you're building | Pattern |
|----------------------|---------|
| Reusable, multi-prop widget | Full folder structure (Step 1) |
| Simple single-use display | Inline within parent page/component |
| Modal/dialog | Use `deleteConfirmModal` or `createKnowledgeBaseModal` as template |
| Data table | Extend `components/dataTable/` |
| Form | Use React Hook Form + `useReactHookForm<T>` |
| Page guard | Use `components/pageGuard/` pattern |
| Already exists in Flowbite | Import from `flowbite-react` directly |

Check `components/` for existing components before building new ones.

---

## Step 1: Folder Structure

```
components/<ComponentName>/
├── index.tsx              ← re-export barrel
├── <ComponentName>.tsx    ← implementation
└── <ComponentName>.types.ts  ← prop types
```

**index.tsx** (always this shape):
```typescript
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';
```

**ComponentName.types.ts**:
```typescript
export interface ComponentNameProps {
  // required props first
  title: string;
  // optional props with defaults
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  children?: React.ReactNode;
  // callbacks
  onClick?: () => void;
}
```

**ComponentName.tsx**:
```typescript
'use client';

import { motion } from 'framer-motion';
import React from 'react';
import type { ComponentNameProps } from './ComponentName.types';

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  variant = 'primary',
  className = '',
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`... ${className}`}
    >
      {/* content */}
    </motion.div>
  );
};
```

---

## Step 2: Styling Reference

### Core Design Tokens (Tailwind classes)

```typescript
// Backgrounds
'bg-white dark:bg-gray-800'                    // card surface
'bg-gray-50 dark:bg-gray-900'                  // page background
'bg-gray-800/80 backdrop-blur-xl'              // glass morphism

// Borders
'border border-gray-200 dark:border-gray-700'  // standard
'border border-gray-700/50'                    // subtle dark

// Text
'text-gray-900 dark:text-white'                // headings
'text-gray-500 dark:text-gray-400'             // muted / subtitles
'text-gray-700 dark:text-gray-300'             // body

// Interactive
'hover:shadow-lg hover:scale-[1.02] transition-all duration-300'  // card hover
'rounded-lg'                                   // standard radius
'rounded-xl'                                   // larger cards

// Accent (project palette)
'text-blue-500 dark:text-blue-400'
'bg-blue-50 dark:bg-blue-900/20'
'bg-indigo-600 hover:bg-indigo-700'            // primary action
```

### Button Variants
```typescript
const buttonVariants = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-2',
  danger:    'bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2',
  ghost:     'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg px-3 py-2',
  icon:      'rounded-lg p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
};
```

### Status Badge
```typescript
const statusClasses = {
  ready:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  queued:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error:      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status]}`}>
  {status}
</span>
```

---

## Step 3: Framer Motion Patterns

```typescript
import { AnimatePresence, motion } from 'framer-motion';

// Card entrance
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// List with stagger
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// Modal overlay
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

// Modal panel
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: -20 },
  visible: { opacity: 1, scale: 1,    y: 0,   transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit:    { opacity: 0, scale: 0.95, y: -20 },
};

// Use AnimatePresence for conditional renders
<AnimatePresence>
  {isOpen && (
    <motion.div key="modal" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
      ...
    </motion.div>
  )}
</AnimatePresence>
```

---

## Step 4: Forms

```typescript
'use client';

import { useReactHookForm } from '@/hooks';

interface MyFormValues {
  name: string;
  description?: string;
}

export const MyForm: React.FC<{ onSubmit: (v: MyFormValues) => Promise<void> }> = ({ onSubmit }) => {
  const form = useReactHookForm<MyFormValues>({
    defaultValues: { name: '', description: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Submission failed',
      });
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          {...form.register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      {form.formState.errors.root && (
        <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {form.formState.isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
```

---

## Step 5: Modal Pattern

```typescript
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const MyModal: React.FC<MyModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1,    y: 0    }}
            exit={{    opacity: 0, scale: 0.95, y: -20  }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

---

## Step 6: Performance

Apply these when the component renders frequently or appears in lists:

```typescript
import React, { memo, useCallback, useMemo } from 'react';

// Memoize list items
const ListItem = memo(({ item, onSelect }: ListItemProps) => { ... });

// Stable callbacks in parent
const handleSelect = useCallback((id: string) => { ... }, []);

// Expensive derived state
const filtered = useMemo(
  () => items.filter((i) => i.name.includes(search)),
  [items, search]
);
```

Rule of thumb: `memo` list items with 10+ instances; `useCallback` all callbacks passed to memoized children.

---

## Step 7: Accessibility

Every interactive element must have:

```typescript
// Clickable div
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
  aria-label="Edit knowledge base"
>

// Icon button with no visible text
<button aria-label="Delete item" title="Delete item">
  <TrashIcon />
</button>

// Loading state
<button disabled={loading} aria-busy={loading}>
  {loading ? 'Loading...' : 'Save'}
</button>
```

---

## Step 8: Validate

```bash
npm run dev     # Check in browser: render, dark mode toggle, mobile view
npm run build   # Zero TypeScript errors required
npm run lint    # Fix ESLint issues
```

**Review checklist**:
- [ ] Component renders in both light and dark mode
- [ ] Mobile layout works (test at 375px width)
- [ ] Keyboard navigation: Tab, Enter, Escape work
- [ ] Loading / empty / error states handled
- [ ] No `any` types
- [ ] Framer Motion `exit` animations need `AnimatePresence` wrapper
- [ ] Build passes

---

## Flowbite React Quick Reference

```typescript
import { Badge, Button, Dropdown, Modal, Spinner, Table, Tabs, Tooltip } from 'flowbite-react';

// Prefer Flowbite for: tables, modals, badges, dropdowns, tabs, spinners
// Build custom for: cards, headers, specialized entity-specific components
```

See existing usages in `components/logsTable/`, `components/dataTable/`, `components/tabs/` for patterns.
