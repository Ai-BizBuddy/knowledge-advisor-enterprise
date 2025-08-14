# Knowledge Advisor - Enhanced Copilot Instructions

## Project Overview

**Last Updated**: 2025-08-10 00:13:55 UTC

This is a Next.js 15 CSR Only Mode, TypeScript project for an AI-powered knowledge base ingestion system called "Knowledge Advisor". The application manages RAG (Retrieval-Augmented Generation) projects with document upload and processing capabilities.

## 🚨 CRITICAL DEVELOPMENT WORKFLOW

### Required Testing Process

**MANDATORY**: After completing any code changes, ALWAYS execute the following commands in order:

1. **Development Testing**

   ```bash
   npm run dev
   ```

   - Start development server
   - Open browser and test UI functionality
   - Verify all components render correctly
   - Check console for errors
   - Test user interactions
   - **WAIT** for confirmation that UI works properly

2. **Production Build Verification**

   ```bash
   npm run build
   ```

   - **WAIT** for build process to complete fully
   - Check for TypeScript errors
   - Verify no build failures
   - Confirm all imports resolve correctly
   - **DO NOT** assume build is successful until process completes

3. **Additional Checks**
   ```bash
   npm run lint        # Check code quality
   npm run type-check  # Verify TypeScript types
   ```

### ⚠️ Important Notes

- **NEVER** assume code is correct without testing
- **ALWAYS** wait for build completion before concluding work
- **CHECK** browser console for runtime errors
- **VERIFY** all new components render properly
- **TEST** form submissions and user interactions
- **CONFIRM** responsive design works on different screen sizes

### Common Issues to Watch For

- Missing imports or circular dependencies
- TypeScript type mismatches
- CSS class conflicts
- Supabase client initialization errors
- Authentication state issues
- Form validation problems
- Image loading failures
- API endpoint connection issues

## Tech Stack & Architecture

### Core Technologies

- **Framework**: Next.js 15.3.3 with App Router and Turbo mode
- **Language**: TypeScript 5 (strict mode enabled)
- **Database**: Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Tailwind CSS + flowbite-react components
- **Animation**: Framer Motion 12.16.0
- **State Management**: React hooks + Zustand (if needed)
- **Forms**: React Hook Form with custom utilities
- **File Upload**: Supabase Storage with progress tracking

### Development Tools

- **Linting**: ESLint + TypeScript strict rules
- **Formatting**: Prettier
- **Package Manager**: npm
- **Build Tool**: Turbo (Next.js built-in)

## Database Schema & Supabase Setup

### Core Tables

```sql
-- Users and Authentication
auth.users (Supabase managed)
profiles (id, email, full_name, avatar_url, created_at, updated_at, deleted_at)
user_roles (user_id, role_id, assigned_at, assigned_by)
roles (id, name, description, permissions)

-- Projects and Documents
projects (id, name, description, status, owner_id, created_at, updated_at)
documents (id, project_id, filename, file_path, status, processed_at)
sync_history (id, project_id, action, status, details, created_at)

-- Activity Tracking
activity_logs (id, user_id, action, resource_type, resource_id, details, created_at)
```

### RLS Policies Example

```sql
-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

-- Documents: Access based on project ownership
CREATE POLICY "Users can view project documents" ON documents
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
```

## Development Standards

### TypeScript Best Practices

#### ❌ Never Use

```typescript
// DON'T
const data: any = response.data;
const error: any = e;
function handleCallback(cb: any) {}
```

#### ✅ Always Use

```typescript
// DO
interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: "success" | "error";
}

const data: ApiResponse<Project[]> = response.data;
const error: unknown = e;
function handleCallback<T>(cb: (data: T) => void) {}

// For unknown errors
if (error instanceof Error) {
  console.error(error.message);
} else {
  console.error("Unknown error occurred");
}
```

#### Type Definitions Structure

```typescript
// /src/interfaces/Project.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  owner_id: string;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = "active" | "paused" | "archived";

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
}
```

### Component Development Patterns

#### Component Structure

```
src/components/ProjectCard/
├── index.tsx          # Main component
├── ProjectCard.tsx    # Implementation
├── ProjectCard.types.ts # Type definitions
└── ProjectCard.test.tsx # Tests (optional)
```

#### Component Template

```typescript
// /src/components/ProjectCard/index.tsx
export { ProjectCard } from './ProjectCard';
export type { ProjectCardProps } from './ProjectCard.types';

// /src/components/ProjectCard/ProjectCard.types.ts
export interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

// /src/components/ProjectCard/ProjectCard.tsx
import { motion } from 'framer-motion';
import type { ProjectCardProps } from './ProjectCard.types';

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800 rounded-lg p-6 ${className}`}
    >
      {/* Component content */}
    </motion.div>
  );
};
```

### Forms Pattern (Enhanced)

#### Form Hook Usage

```typescript
// /src/hooks/useReactHookForm.ts
import { useForm, UseFormProps } from "react-hook-form";

export function useReactHookForm<TFormValues extends Record<string, unknown>>(
  options?: UseFormProps<TFormValues>,
) {
  return useForm<TFormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    ...options,
  });
}
```

#### Form Implementation Example

```typescript
// Project form example
interface ProjectFormValues {
  name: string;
  description?: string;
  status: ProjectStatus;
}

const CreateProjectForm: React.FC = () => {
  const form = useReactHookForm<ProjectFormValues>({
    defaultValues: {
      name: '',
      description: '',
      status: 'active'
    }
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      await createProject(data);
      // Handle success
    } catch (error) {
      // Handle error with proper typing
      if (error instanceof Error) {
        form.setError('root', { message: error.message });
      }
    }
  };

  return (
    <InteractionForm
      defaultValues={form.getValues()}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel="Create Project"
    >
      <input
        {...form.register('name', {
          required: 'Project name is required',
          minLength: { value: 3, message: 'Name must be at least 3 characters' }
        })}
        placeholder="Project name"
      />
      {form.formState.errors.name && (
        <span className="text-red-500">{form.formState.errors.name.message}</span>
      )}
    </InteractionForm>
  );
};
```

### Server Actions Pattern

```typescript
// /src/actions/project.actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(
  data: CreateProjectRequest,
): Promise<TypedResponse<Project>> {
  try {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        ...data,
        owner_id: user.user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: project };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Error Handling Patterns

#### Typed Error Responses

```typescript
// /src/interfaces/ApiTypes.ts
export interface TypedResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TypedError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Usage in components
const handleCreateProject = async (data: ProjectFormValues) => {
  const result = await createProject(data);

  if (!result.success) {
    setError(result.error || "Failed to create project");
    return;
  }

  // Handle success
  setProjects((prev) => [...prev, result.data!]);
};
```

## UI/UX Design System

### Color Palette

```css
/* Dark Theme Variables */
:root {
  --bg-primary: #0f172a; /* slate-900 */
  --bg-secondary: #1e293b; /* slate-800 */
  --bg-tertiary: #334155; /* slate-700 */

  --text-primary: #f8fafc; /* slate-50 */
  --text-secondary: #cbd5e1; /* slate-300 */
  --text-muted: #94a3b8; /* slate-400 */

  --accent-primary: #6366f1; /* indigo-500 */
  --accent-secondary: #8b5cf6; /* violet-500 */
  --accent-tertiary: #3b82f6; /* blue-500 */

  --glass-bg: rgba(15, 23, 42, 0.8);
  --glass-border: rgba(148, 163, 184, 0.1);
}
```

### Component Styling Patterns

```typescript
// Glass morphism effect
const glassStyles =
  "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50";

// Gradient backgrounds
const gradientBg =
  "bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10";

// Interactive states
const hoverStates =
  "hover:bg-slate-800 hover:scale-105 transition-all duration-200";

// Button variants
const buttonVariants = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
  secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "bg-transparent hover:bg-slate-800 text-slate-300",
};
```

## Development Workflow Checklist

### Before Starting Work

- [ ] Pull latest changes from main branch
- [ ] Check current Node.js version compatibility
- [ ] Ensure all dependencies are installed (`npm ci`)
- [ ] Verify environment variables are set

### During Development

- [ ] Follow TypeScript strict typing rules
- [ ] Use proper component structure
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Consider responsive design
- [ ] Include accessibility features

### Before Completing Work

- [ ] **Run `npm run dev`** - Test UI functionality
- [ ] **Verify all features work in browser**
- [ ] **Check browser console for errors**
- [ ] **Run `npm run build`** - Wait for completion
- [ ] **Confirm build succeeds without errors**
- [ ] Run `npm run lint` - Fix any issues
- [ ] Run `npm run type-check` - Resolve type errors
- [ ] Test responsive design on different screen sizes
- [ ] Verify form submissions work correctly
- [ ] Check authentication flows

### Production Readiness

- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Proper error boundaries implemented
- [ ] Loading states for async operations
- [ ] Optimized images and assets
- [ ] Environment variables configured
- [ ] Security headers configured

## Quick Reference Commands

```bash
# Development
npm run dev              # Start development server (REQUIRED after changes)
npm run build           # Production build (REQUIRED to verify)
npm run start           # Start production server
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run type-check     # TypeScript type checking

# Database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/interfaces/database.types.ts

# Testing
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report

# Code Quality
npm run prettier       # Format code
npm run analyze        # Bundle analysis
```

---

## Ultra-Condensed Quick Reference

````markdown
# Knowledge Advisor - Quick Reference

## 🚨 MANDATORY WORKFLOW

1. Make changes
2. `npm run dev` → Test UI
3. `npm run build` → Wait for completion
4. Verify no errors

## Stack

Next.js 15 + TypeScript + Supabase + Tailwind + Framer Motion

## Golden Rules

❌ NO `any` types → use `unknown`, interfaces, unions
✅ React Hook Form: `useReactHookForm<T>()`
✅ Server Actions for mutations
✅ Component per folder with index.tsx
✅ Mobile-first + dark theme + glass morphism
🚨 ALWAYS test before claiming completion

## Patterns

```typescript
// Types
interface ApiResponse<T> { success: boolean; data?: T; error?: string; }

// Forms
const form = useReactHookForm<FormValues>();

// Server Actions
export async function action(data: T): Promise<TypedResponse<R>> {}

// Components
export const Component: React.FC<Props> = ({ ... }) => { ... };
```
````

## Priority

Replace mock → Real Supabase → Complete type safety → ALWAYS test with dev + build

```

```
