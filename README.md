## Knowledge Advisor Enterprise

AI-powered knowledge base ingestion and RAG project manager built with Next.js App Router
(CSR-only), TypeScript, Tailwind CSS v4, Supabase, and Flowbite React.

### Tech stack

- Next.js 15.x (App Router, output=standalone)
- React 19, TypeScript 5 (strict)
- Tailwind CSS v4 via @tailwindcss/postcss, Flowbite React
- Supabase JS v2 (Auth, Storage, DB)
- Framer Motion, React Hook Form, React Toastify

### Project structure (high level)

```
app/                 # Routes (CSR), layouts, loading/not-found
components/          # Reusable UI + feature components (per-folder)
  pageGuard/         # Permission-based page protection component
contexts/            # React contexts (Auth, Loading)
hooks/               # Typed hooks (data fetching, forms, state)
  useJWTPermissions  # JWT-based permission checking hook
interfaces/          # Shared TypeScript interfaces/types
constants/           # App constants
  permissions.ts     # Centralized permission definitions
services/            # API/Supabase client & service helpers
utils/               # Utilities (formatters, helpers)
public/              # Static assets
styles/              # Global styles (Tailwind v4 via PostCSS)
```

Note: Path alias is configured as `@/*` → project root (see `tsconfig.json`).

### Permission System

This application implements a comprehensive permission-based access control system. See:
- **[PERMISSIONS_IMPLEMENTATION.md](./PERMISSIONS_IMPLEMENTATION.md)** - Complete implementation details
- **[PERMISSIONS_QUICK_REFERENCE.md](./PERMISSIONS_QUICK_REFERENCE.md)** - Developer quick reference

Key features:
- Page-level protection with `PageGuard` component
- Component-level permission checks with `useJWTPermissions` hook
- Centralized permission constants
- Flexible requirement types (any/all permissions)
- Type-safe permission checks

## Getting started

1. Prerequisites

- Node.js 18.18+ or 20+
- npm

2. Install deps

```bash
npm ci
```

3. Configure environment Create `.env.local` from the example and fill values:

```bash
copy .env.local.example .env.local
```

Required (CSR-friendly):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Set up Supabase Storage

Create required storage buckets (for avatars, etc.):

```bash
npm run setup:storage
```

Or manually create the `avatars` bucket in Supabase Dashboard:
- Go to Storage > New Bucket
- Name: `avatars`
- Public: ON
- File size limit: 5MB

See [docs/STORAGE_SETUP.md](docs/STORAGE_SETUP.md) for detailed instructions.

5. Run in development

```bash
npm run dev
```

Open http://localhost:3000 and check console for errors.

6. Verify production build

```bash
npm run build
```

Wait for completion and ensure there are no TypeScript/build errors.

## Scripts

```bash
npm run dev          # Start dev server (Turbo)
npm run build        # Production build (standalone)
npm run start        # Start production server
npm run lint         # ESLint (Next.js config)
npm run lint:fix     # ESLint with --fix
npm run format       # Prettier write
npm run format:check # Prettier check
npm run quotes:check # ESLint check for quotes & general rules
npm run quotes:fix   # ESLint fix + Prettier write
npm run setup:storage # Create required Supabase storage buckets
```

## Development workflow

1. Implement changes (TypeScript strict, no `any`)
2. Run dev and test UI flows in browser
3. Run build to catch type and bundling issues
4. Lint/format before committing

Tailwind CSS v4 is enabled via PostCSS plugin (`postcss.config.mjs`). No explicit `tailwind.config`
is required unless you need customization.

## Environment variables

CSR-only usage requires public keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add other configuration as needed. Never commit secrets.

## Conventions

- Folder names: prefer kebab-case; React components PascalCase files
- Component-per-folder; export via local `index.tsx` when helpful
- Types in `interfaces/`; avoid `any` (prefer unions, generics, unknown)
- Hooks are pure and typed; side-effects isolated in services

## Deployment

- `next.config.ts` uses `output: 'standalone'` and Flowbite React plugin
- Image optimization allows whitelisted remote hosts (Flowbite, Supabase storage)
- Optional redirect to force HTTPS in production is configured

Deploy to Vercel or any Node runtime that runs `npm run start` after build.

## Troubleshooting

- Clear `.next/` and rerun build if you see stale module errors
- Verify env variables are present in browser (`NEXT_PUBLIC_*`)
- Check terminal and browser console for runtime errors
