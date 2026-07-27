# SecureVault — Developer Guide

This document covers everything a developer needs to know to work with the SecureVault codebase.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Key Patterns & Conventions](#key-patterns--conventions)
- [Adding New Features](#adding-new-features)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js v18+
- pnpm v10+
- Docker & Docker Compose

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start database
docker compose up -d

# 3. Push schema + seed
pnpm db:push
pnpm db:seed

# 4. Start dev server
pnpm dev
```

Default admin: `admin@vault.local` / `Admin@2024!Secure`

---

## Development Workflow

### Common Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm lint             # Run Biome linter + auto-fix
pnpm format           # Format all files with Biome
pnpm db:push          # Push schema changes to database
pnpm db:seed          # Re-seed database
pnpm db:studio        # Open Prisma Studio (DB GUI)
pnpm db:generate      # Regenerate Prisma client
```

### After Schema Changes

```bash
pnpm db:push          # Push to DB + regenerate client
```

The Prisma client is generated to `src/generated/prisma/`. The generator config in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### Prisma 7 Connection Pattern

```typescript
// src/lib/db.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const db = new PrismaClient({ adapter });
```

> **Note:** Prisma 7 uses `PrismaPg({ connectionString })` directly — no manual `Pool` creation needed.

---

## Key Patterns & Conventions

### Server Actions

All mutations use Next.js Server Actions (not REST API routes):

```typescript
// "use server" at top of file
export async function createUser(
  _prevState: UserState | undefined,  // Prefixed with _ if unused
  formData: FormData,
): Promise<UserState> {
  // Validation, DB operations, return result
}
```

**Convention:** Server actions receive `(prevState, formData)` for use with `useActionState` from React.

### Dynamic Zod Schemas

Password validation is dynamic based on `SecuritySettings`:

```typescript
// Server-side: build schema from DB settings
const settings = await getSecuritySettings();
const schema = getCreateUserSchema(settings);
const parsed = schema.safeParse({ ... });
```

```typescript
// Client-side: static schema with sensible defaults
import { createUserSchema } from "@/lib/validations";
```

### Authentication Flow

1. **Login:** `login()` → `createSession()` → JWT cookie → redirect to `/dashboard`
2. **Session check:** `verifySession()` reads JWT from cookie → verifies version against DB
3. **Proxy/middleware:** `src/proxy.ts` checks JWT on every request, redirects unauthenticated users

### RBAC Enforcement

```typescript
// In server actions:
const session = await requireRole(["SUPER_ADMIN"]); // Throws if unauthorized

// In pages/layouts:
const session = await verifySession(); // Redirects to /login if no session
```

### Caching Pattern (SecuritySettings)

```typescript
let cachedSettings: SecuritySettingsData | null = null;

export async function getSecuritySettings() {
  if (cachedSettings) return cachedSettings;
  const row = await db.securitySettings.findFirst();
  cachedSettings = row;
  return row;
}

export function clearSettingsCache() {
  cachedSettings = null;
}
```

### Audit Logging

```typescript
await logAudit({
  userId: session.userId,
  action: "CREATE_CREDENTIAL",
  details: `Created credential: ${title}`,
  ipAddress,
  userAgent,
});
```

---

## Adding New Features

### Adding a New Server Action

1. Create or edit `src/app/actions/your-action.ts`
2. Add `"use server"` at top
3. Define return type interface
4. Use `verifySession()` or `requireRole()` for auth
5. Validate input with Zod
6. Log with `logAudit()`
7. Call `revalidatePath()` if needed

### Adding a New Page

1. Create `src/app/your-route/page.tsx`
2. For dashboard pages, create under `src/app/dashboard/your-route/page.tsx`
3. Use `verifySession()` in server components for auth
4. Client components go in `src/components/`

### Adding a New Model

1. Add to `prisma/schema.prisma`
2. Run `pnpm db:push`
3. Update `prisma/seed.ts` if initial data needed
4. Add audit action to `AuditAction` enum if applicable

### Adding a New Client Component

1. Create in `src/components/` (dashboard or ui folder)
2. Mark with `"use client"` at top
3. Use `react-hook-form` + Zod for forms
4. Use existing Shadcn components from `src/components/ui/`
5. Follow existing color conventions: `emerald-500` (primary), `zinc-900` (backgrounds)

---

## Troubleshooting

### "Invalid input syntax for type uuid"

**Cause:** Passing a string where a UUID is expected (e.g., email passed as userId).

**Fix:** Check function call argument order. Example in `auth.ts`:
```typescript
// CORRECT order: email first, userId second
await recordFailedAttempt(user.email, user.id, ipAddress, userAgent);
```

### Infinite Redirect Loop on `/dashboard/settings`

**Cause:** Layout redirect targeting a page inside the same layout.

**Fix:** Don't redirect from the layout. Use a dialog overlay instead, or check the current path before redirecting.

### `@ts-expect-error` with `zodResolver(null)`

**Cause:** Missing Zod schema for form validation.

**Fix:** Create a proper Zod schema in `validations.ts` and use it:
```typescript
import { mySchema } from "@/lib/validations";
const { register, handleSubmit } = useForm({ resolver: zodResolver(mySchema) });
```

### Google Fonts Fetch Error (Build)

**Cause:** Network not available during `next build`.

**Fix:** This is environmental. The code is correct. Use `@fontsource` packages (already installed) as fallback, or ensure network access during build.

### Prisma Client Not Found

**Fix:**
```bash
pnpm db:generate
# or
pnpm install   # runs postinstall: prisma generate
```

### Biome Lint Errors

```bash
pnpm lint      # Auto-fix safe issues
pnpm format    # Format all files
```

Common rules enforced:
- `noNonNullAssertion` — use `.at(-1)` or null checks instead of `!`
- `noExplicitAny` — use proper types instead of `any`
- `noUnusedImports` — remove unused imports
- `useHookAtTopLevel` — functions starting with `use` must be hooks

---

## File Reference

### Core Security Files

| File | Purpose |
|---|---|
| `src/lib/security-settings.ts` | Fetch/cache SecuritySettings from DB |
| `src/lib/password-policy.ts` | Validate password against policy |
| `src/lib/password-history.ts` | Check/reuse/record password history |
| `src/lib/password-expiry.ts` | Check if password is expired |
| `src/lib/password-reset.ts` | Generate/validate reset tokens |
| `src/lib/progressive-delay.ts` | DB-backed login delay + lockout |
| `src/lib/validations.ts` | All Zod schemas (dynamic + static) |

### Action Files

| File | Purpose |
|---|---|
| `src/app/actions/auth.ts` | Login/logout with progressive delay |
| `src/app/actions/users.ts` | User CRUD + password change + force change |
| `src/app/actions/credentials.ts` | Credential CRUD + reveal |
| `src/app/actions/security-settings.ts` | Admin policy settings |
| `src/app/actions/password-reset.ts` | Reset request + reset password |

### Security Components

| File | Purpose |
|---|---|
| `src/components/dashboard/ForcePasswordChangeDialog.tsx` | Mandatory password change modal |
| `src/components/dashboard/SecurityDashboardClient.tsx` | Security overview + score |
| `src/components/dashboard/SecuritySettingsClient.tsx` | Admin policy config form |
| `src/components/dashboard/SettingsClient.tsx` | User settings + password age |
| `src/components/ui/PasswordRules.tsx` | Dynamic password requirements checklist |
