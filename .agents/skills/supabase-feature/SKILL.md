---
name: supabase-feature
description: "Use when: adding a new Supabase-backed feature, creating a new data table, building CRUD for a new entity, or scaffolding interface → service → hook → component for this project."
---

# Supabase Feature Development

You are a full-stack developer building a new data-backed feature in this Next.js 16 CSR-only app. Follow the stack: TypeScript strict, Supabase JS v2, React Hook Form, Tailwind v4, Flowbite React, Framer Motion.

**Golden rules**: Never `use server`. Never `any`. No `console.log`. Return `TypedResponse<T>` from services. Test with `npm run dev` → `npm run build`.

---

## Step 0: Understand the Entity

Ask (or infer) before writing code:
1. What is the entity name? (e.g. `Tag`, `Conversation`, `Integration`)
2. What are its fields and relationships?
3. Who owns/accesses it? (per-user, per-knowledge-base, org-wide?)
4. Does it need pagination, filtering, or sorting?

---

## Step 1: Interface Definition

**File**: `interfaces/<Entity>.ts`

```typescript
// interfaces/Tag.ts
export interface Tag {
  id: string;
  name: string;
  color: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export type TagStatus = 'active' | 'archived';

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput extends Partial<CreateTagInput> {}
```

**Checklist**:
- [ ] No `any` — use `string | null`, unions, optionals
- [ ] Separate `Create*Input` / `Update*Input` from the entity
- [ ] Export from `interfaces/index.ts` if one exists

---

## Step 2: Supabase SQL

```sql
-- New table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: owner-only access
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags" ON tags
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Auto-update trigger
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Patterns used in this codebase**:
- `createClientTable()` — use for auth-aware queries
- `createClient()` — use for storage operations
- Views like `document_view` expose joined data — prefer views for complex reads

---

## Step 3: Service Class

**File**: `services/TagService/index.ts`

```typescript
import type { CreateTagInput, Tag, UpdateTagInput } from '@/interfaces/Tag';
import type { TypedResponse } from '@/interfaces/ApiTypes';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientTable } from '@/utils/supabase/client';

class TagService {
  private async getCurrentUser() {
    const session = await getAuthSession();
    if (!session?.user) throw new Error('User not authenticated');
    return session.user;
  }

  async getTags(): Promise<TypedResponse<Tag[]>> {
    try {
      const user = await this.getCurrentUser();
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data: data ?? [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createTag(input: CreateTagInput): Promise<TypedResponse<Tag>> {
    try {
      const user = await this.getCurrentUser();
      const supabase = createClientTable();

      const { data, error } = await supabase
        .from('tags')
        .insert({ ...input, owner_id: user.id })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Tag };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateTag(id: string, input: UpdateTagInput): Promise<TypedResponse<Tag>> {
    try {
      const supabase = createClientTable();
      const { data, error } = await supabase
        .from('tags')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Tag };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteTag(id: string): Promise<TypedResponse<null>> {
    try {
      const supabase = createClientTable();
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

const tagService = new TagService();
export default tagService;
```

**Register in** `services/index.ts`:
```typescript
export { default as tagService } from './TagService';
```

**Checklist**:
- [ ] Private `getCurrentUser()` method for auth guard
- [ ] Always return `TypedResponse<T>`, never throw from public methods
- [ ] `.select().single()` for single-row returns
- [ ] Singleton export (`const tagService = new TagService()`)

---

## Step 4: React Hook

**File**: `hooks/useTags.tsx`

```typescript
'use client';

import type { CreateTagInput, Tag, UpdateTagInput } from '@/interfaces/Tag';
import { tagService } from '@/services';
import { useCallback, useEffect, useState } from 'react';

export interface UseTagsReturn {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  createTag: (input: CreateTagInput) => Promise<Tag>;
  updateTag: (id: string, input: UpdateTagInput) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await tagService.getTags();
    if (!result.success) setError(result.error ?? 'Failed to load');
    else setTags(result.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  const createTag = useCallback(async (input: CreateTagInput): Promise<Tag> => {
    const result = await tagService.createTag(input);
    if (!result.success) throw new Error(result.error ?? 'Failed to create');
    setTags((prev) => [result.data!, ...prev]);
    return result.data!;
  }, []);

  const updateTag = useCallback(async (id: string, input: UpdateTagInput) => {
    const result = await tagService.updateTag(id, input);
    if (!result.success) throw new Error(result.error ?? 'Failed to update');
    setTags((prev) => prev.map((t) => (t.id === id ? result.data! : t)));
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    const result = await tagService.deleteTag(id);
    if (!result.success) throw new Error(result.error ?? 'Failed to delete');
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tags, loading, error, createTag, updateTag, deleteTag, refresh: loadTags };
}
```

**Export from** `hooks/index.ts`:
```typescript
export { useTags } from './useTags';
```

**Checklist**:
- [ ] `'use client'` at top
- [ ] `useCallback` on all functions returned from hook
- [ ] Optimistic UI updates (setTags locally, don't re-fetch)
- [ ] `refresh` exposed for manual reload

---

## Step 5: Component

Follow the full component skill (`component-ui`) for this step, but key points:

```
components/<EntityName>Card/
├── index.tsx           → re-exports
├── <EntityName>Card.tsx
└── <EntityName>Card.types.ts
```

Import the hook, not the service, in components.

---

## Step 6: Pagination (if needed)

Check `interfaces/Pagination.ts` and `hooks/useSorting.tsx` for existing patterns. Add to the hook:

```typescript
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 10;
const totalPages = Math.ceil(tags.length / ITEMS_PER_PAGE);
const paginatedTags = useMemo(
  () => tags.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
  [tags, currentPage]
);
```

---

## Step 7: Permissions Guard (if needed)

If the feature is permission-gated, check `hooks/useJWTPermissions.tsx` and `constants/permissions.ts`:

```typescript
const { hasPermission } = useJWTPermissions();
if (!hasPermission('tags:create')) return <AccessDenied />;
```

---

## Step 8: Validate

```bash
npm run dev       # Open browser, test all CRUD actions
npm run build     # Must complete with zero errors
npm run lint      # Fix any ESLint issues
```

**Runtime checklist**:
- [ ] Data loads on mount
- [ ] Create/update/delete updates local state without full reload
- [ ] Loading spinner shown during async operations
- [ ] Toast notification on success/error (use `react-toastify`)
- [ ] Build passes with zero TypeScript errors

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `error.message` on unknown | `error instanceof Error ? error.message : 'Unknown error'` |
| RLS blocking data | Check that `auth.uid() = owner_id` matches how rows are inserted |
| Stale data after mutation | Always update local state optimistically, avoid unnecessary re-fetches |
| `any` from Supabase `.select()` | Cast explicitly: `data as Tag[]` |
| Missing `'use client'` | Hooks and components using state must have this at the top |
| Service not exported | Add to `services/index.ts` singleton export |
