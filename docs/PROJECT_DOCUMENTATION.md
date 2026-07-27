# SecureVault — Password Administration System
## Comprehensive Technical Documentation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Cryptography & Hashing](#cryptography--hashing)
4. [Security Architecture](#security-architecture)
5. [User & Password Management](#user--password-management)
6. [Database Schema](#database-schema)
7. [API & Server Actions](#api--server-actions)
8. [Frontend Architecture](#frontend-architecture)
9. [Configuration & Environment](#configuration--environment)
10. [Security Considerations & Best Practices](#security-considerations--best-practices)

---

## Project Overview

**SecureVault** is a Next.js 14+ (App Router) password administration system designed for secure credential storage and management. Built with TypeScript, Prisma ORM, PostgreSQL, and modern web security practices.

### Key Features
- **AES-256-GCM encrypted credential storage** — passwords encrypted at rest
- **bcrypt (cost factor 12) for user password hashing** — resistant to brute force
- **Role-based access control** — SUPER_ADMIN, EDITOR, VIEWER
- **Configurable security policies** — password complexity, history, expiry, lockout
- **Comprehensive audit logging** — append-only tamper-evident logs
- **Progressive delay & account lockout** — mitigates brute-force attacks
- **Password reset with secure tokens** — bcrypt-hashed tokens, single-use
- **Session management with JWT** — HttpOnly cookies, session versioning
- **Credential vault UI** — search, filter, reveal with auto-hide, copy with auto-clear

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth-style custom JWT sessions |
| Crypto | Node.js `crypto` (AES-256-GCM), `bcrypt` |
| Validation | Zod schemas (server + client) |
| Forms | React Hook Form + Zod resolvers |
| UI | |
| Styling | Tailwind CSS + shadcn/ui components |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APPLICATION                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Server      │  │  Client      │  │  API Routes  │              │
│  │  Components  │  │  Components  │  │  (reveal,    │              │
│  │  (RSC)       │  │  (use client)│  │  export)     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SERVER ACTIONS                             │  │
│  │  auth.ts  │ credentials.ts │ users.ts │ password-reset.ts    │  │
│  │  security-settings.ts                                        │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                          │
│         ┌─────────────────┼─────────────────┐                       │
│         ▼                 ▼                 ▼                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   lib/      │  │   Prisma    │  │  Security   │                  │
│  │  crypto.ts  │  │   Client    │  │  Modules    │                  │
│  │  auth.ts    │  │   (db.ts)   │  │  (rate-limit,                │
│  │  session.ts │  └─────────────┘  │  progressive-                │
│  │  audit.ts   │                   │  delay, etc)                  │
│  └─────────────┘                   └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                             │
│  ┌─────────┐ ┌─────────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │ users   │ │ credentials │ │ audit_logs│ │ security_settings │  │
│  └─────────┘ └─────────────┘ └───────────┘ └───────────────────┘  │
│  ┌──────────────┐ ┌─────────────────┐ ┌────────────────────────┐  │
│  │ password_    │ │ failed_login_   │ │ password_reset_        │  │
│  │ history      │ │ attempts        │ │ tokens                 │  │
│  └──────────────┘ └─────────────────┘ └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow Examples

#### Login Flow
```
1. POST /login (Server Action: login)
   ├─ Rate limit check (5 attempts / 15 min per IP)
   ├─ Validate email/password (Zod)
   ├─ Find user by email
   ├─ Check account lock status
   ├─ bcrypt.compare(password, passwordHash)
   ├─ On failure: recordFailedAttempt → progressive delay → maybe lockAccount
   ├─ On success: clearFailedAttempts → createSession (JWT + cookie)
   ├─ Check password expiry → forcePasswordChange if needed
   ├─ logAudit(LOGIN)
   └─ Redirect to /dashboard (or /settings?forceChange=1)
```

#### Credential Reveal Flow
```
1. POST /api/credentials/reveal (API Route)
   ├─ getSession() → verify JWT from HttpOnly cookie
   ├─ CSRF check (Origin/Referer vs Host)
   ├─ Rate limit (20 req/min per user)
   ├─ Validate credentialId (Zod UUID)
   ├─ Fetch credential (encryptedPassword, iv, authTag)
   ├─ decrypt(encryptedPassword, iv, authTag) → plaintext
   ├─ logAudit(VIEW_PASSWORD)
   └─ Return { password: plaintext }
```

---

## Cryptography & Hashing

### 1. Credential Encryption — AES-256-GCM
**File:** `src/lib/crypto.ts`

```typescript
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;       // 96-bit IV (GCM standard)
const KEY_LENGTH = 32;      // 256-bit key
```

#### Encryption Process
```typescript
export function encrypt(plaintext: string): {
  encryptedData: string;  // hex
  iv: string;             // hex (12 bytes)
  authTag: string;        // hex (16 bytes)
} {
  const key = getEncryptionKey();        // 32 bytes from ENCRYPTION_KEY env
  const iv = crypto.randomBytes(IV_LENGTH);  // Fresh IV per encryption
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return { encryptedData: encrypted, iv: iv.toString("hex"), authTag };
}
```

#### Decryption Process
```typescript
export function decrypt(encryptedData: string, ivHex: string, authTagHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

#### Security Properties
| Property | Implementation |
|----------|----------------|
| **Confidentiality** | AES-256 encryption |
| **Integrity** | GCM authentication tag (16 bytes) — any tampering throws on decrypt |
| **IV Uniqueness** | `crypto.randomBytes(12)` per encryption — prevents pattern analysis |
| **Key Management** | `ENCRYPTION_KEY` env var (32 bytes hex = 64 chars) |
| **Key Validation** | Startup validation: exact length, valid hex |

#### Key Generation
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Database Storage (Credential Model)
```prisma
model Credential {
  encryptedPassword String  @map("encrypted_password") @db.Text
  iv                String  @db.VarChar(100)      // 12 bytes = 24 hex chars
  authTag           String  @map("auth_tag") @db.VarChar(100)  // 16 bytes = 32 hex chars
}
```

---

### 2. User Password Hashing — bcrypt (Cost Factor 12)
**File:** `src/lib/auth.ts`

```typescript
const BCRYPT_COST_FACTOR = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### Why bcrypt?
| Property | Benefit |
|----------|---------|
| **Deliberately slow** | ~100-300ms per hash at cost 12 — resists brute force |
| **Per-hash salt** | Unique salt embedded in hash — defeats rainbow tables |
| **Adjustable cost** | Can increase `BCRYPT_COST_FACTOR` as hardware improves |
| **Battle-tested** | 20+ years of cryptanalysis, widely adopted |

#### Cost Factor Analysis (2024 hardware)
| Cost Factor | Approx. Time (modern CPU) | Security Margin |
|-------------|---------------------------|-----------------|
| 10 | ~50ms | Low (GPU clusters) |
| **12** | **~200ms** | **Recommended baseline** |
| 14 | ~800ms | High |
| 16 | ~3s | Very high (may impact UX) |

> **Note:** Cost factor 12 is a balanced choice for 2024. Monitor NIST guidelines and consider increasing to 14+ in future.

---

### 3. Secure Token Generation
**Files:** `src/lib/password-reset.ts`, `src/lib/crypto.ts`

```typescript
// Password reset tokens — 32 random bytes (256 bits entropy)
const rawToken = crypto.randomBytes(32).toString("hex");  // 64 hex chars

// Stored as bcrypt hash (not plaintext!)
const hashedToken = await bcrypt.hash(rawToken, 10);
```

#### Token Validation (Constant-Time Comparison via bcrypt)
```typescript
// Can't index by token (bcrypt is one-way), so scan recent unused tokens
const recentTokens = await db.passwordResetToken.findMany({
  where: { usedAt: null, expiresAt: { gte: new Date() }},
  orderBy: { createdAt: "desc" },
  take: 50,
  select: { id: true, token: true, userId: true }
});

for (const entry of recentTokens) {
  const matches = await bcrypt.compare(rawToken, entry.token);
  if (matches) return { valid: true, userId: entry.userId };
}
```

---

### 4. Session Token — JWT (HS256) via `jose`
**File:** `src/lib/session.ts`

```typescript
const token = await new SignJWT({
  userId,
  role,
  sessionVersion,    // Incremented on password change
  expiresAt: expiresAt.toISOString(),
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime(expiresAt)
  .sign(getSecretKey());  // SESSION_SECRET env var
```

#### Cookie Security Flags
```typescript
cookieStore.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,                    // No JS access (XSS protection)
  secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
  sameSite: "lax",                   // CSRF protection
  expires: expiresAt,
  path: "/",
});
```

#### Session Versioning (Cross-Device Invalidation)
```typescript
// On password change:
await db.user.update({
  where: { id: userId },
  data: { sessionVersion: { increment: 1 } }
});

// On session verification:
const user = await db.user.findUnique({ where: { id: userId }});
if (user.sessionVersion !== sessionVersion) return null;  // Invalidated
```

---

## Security Architecture

### 1. Rate Limiting
**File:** `src/lib/rate-limit.ts`

In-memory sliding window (sufficient for single-instance deployment; Redis recommended for scale).

```typescript
export const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,  // 15 minutes
};

export const REVEAL_RATE_LIMIT = {
  maxAttempts: 20,
  windowMs: 60 * 1000,  // 1 minute
};
```

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 min |
| Password Reveal | 20 requests | 1 min |

---

### 2. Progressive Delay & Account Lockout
**File:** `src/lib/progressive-delay.ts`

#### Delay Tiers
```typescript
const DELAY_TIERS = [
  { maxAttempts: 4,  delayMs: 0 },        // 1-4: no delay
  { maxAttempts: 9,  delayMs: 5_000 },    // 5-9: 5 seconds
  { maxAttempts: 14, delayMs: 30_000 },   // 10-14: 30 seconds
  { maxAttempts: Infinity, delayMs: 300_000 }  // 15+: 5 minutes
];
```

#### Lockout Trigger
```typescript
// In login action (auth.ts)
if (attemptCount >= settings.maxFailedAttempts) {  // Default: 5
  await lockAccount(user.id, settings.lockDuration);  // Default: 15 min
}
```

#### Lock Storage (User Model)
```prisma
model User {
  lockedUntil DateTime? @map("locked_until")
}
```

---

### 3. Audit Logging (Append-Only)
**File:** `src/lib/audit.ts`

```typescript
export async function logAudit({
  userId,
  action,           // AuditAction enum
  targetId,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void>
```

#### Audit Action Enum
```prisma
enum AuditAction {
  LOGIN
  LOGOUT
  LOGIN_FAILED
  VIEW_PASSWORD          // Credential reveal
  CREATE_CREDENTIAL
  UPDATE_CREDENTIAL
  DELETE_CREDENTIAL
  CREATE_USER
  UPDATE_USER
  DELETE_USER
  CHANGE_PASSWORD
  EXPORT_CREDENTIALS     // SUPER_ADMIN only
  PASSWORD_RESET_REQUEST
  PASSWORD_RESET_COMPLETE
}
```

#### Tamper-Evident Design
- **No UPDATE/DELETE API exposed** — only `create()`
- **Immutable timestamp** — `timestamp DateTime @default(now())`
- **IP & User-Agent captured** — forensic context
- **Error swallowing** — audit failures never crash the app

```typescript
try {
  await db.auditLog.create({ data: {...} });
} catch (error) {
  console.error("[AUDIT ERROR]", error);  // Log, don't throw
}
```

---

### 4. CSRF Protection (Credential Reveal)
**File:** `src/app/api/credentials/reveal/route.ts`

```typescript
const origin = csrfHeaders.get("origin");
const referer = csrfHeaders.get("referer");
const host = csrfHeaders.get("host");
const allowedOrigin = origin ?? referer;

if (allowedOrigin) {
  const url = new URL(allowedOrigin);
  if (url.host !== host) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
}
```

---

### 5. Role-Based Access Control (RBAC)
**File:** `src/lib/auth.ts`

```typescript
enum Role {
  SUPER_ADMIN  // Full system access: user mgmt, security settings, export
  EDITOR       // Credential CRUD, view passwords
  VIEWER       // Read-only credential list (no reveal)
}
```

| Action | SUPER_ADMIN | EDITOR | VIEWER |
|--------|-------------|--------|--------|
| View credential list | ✅ | ✅ | ✅ |
| Reveal password | ✅ | ✅ | ❌ |
| Create/Edit/Delete credential | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Security settings | ✅ | ❌ | ❌ |
| Export credentials | ✅ | ❌ | ❌ |
| Audit log view | ✅ | ✅ | ✅ |

#### Authorization Helpers
```typescript
export async function verifySession(): Promise<SessionPayload>
export async function requireRole(allowedRoles: Role[]): Promise<SessionPayload>
```

Used in Server Actions and API Routes:
```typescript
const session = await requireRole(["SUPER_ADMIN", "EDITOR"]);
```

---

### 6. Security Headers (Next.js Config)
**File:** `next.config.ts`

```typescript
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
```

---

## User & Password Management

### 1. User Model
**File:** `prisma/schema.prisma`

```prisma
model User {
  id                  String    @id @default(uuid()) @db.Uuid
  email               String    @unique @db.VarChar(255)
  passwordHash        String    @map("password_hash") @db.VarChar(255)
  name                String    @db.VarChar(100)
  role                Role      @default(VIEWER)
  sessionVersion      Int       @default(0) @map("session_version")
  passwordChangedAt   DateTime? @map("password_changed_at")
  forcePasswordChange Boolean   @default(false) @map("force_password_change")
  lockedUntil         DateTime? @map("locked_until")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  auditLogs           AuditLog[]
  passwordHistory     PasswordHistory[]
  failedLoginAttempts FailedLoginAttempt[]
  resetTokens         PasswordResetToken[]
}
```

---

### 2. Security Settings (Singleton)
**File:** `src/lib/security-settings.ts`, `prisma/schema.prisma`

```prisma
model SecuritySettings {
  id                    String   @id @default(uuid()) @db.Uuid
  minimumPasswordLength Int      @default(12) @map("minimum_password_length")
  passwordHistory       Int      @default(5)  @map("password_history")
  lockDuration          Int      @default(15) @map("lock_duration_minutes")
  expirationDays        Int      @default(90) @map("expiration_days")
  mfaRequired           Boolean  @default(false) @map("mfa_required")
  maxFailedAttempts     Int      @default(5)  @map("max_failed_attempts")
  requireSpecialChar    Boolean  @default(true) @map("require_special_char")
  requireUppercase      Boolean  @default(true) @map("require_uppercase")
  requireNumber         Boolean  @default(true) @map("require_number")
  requireLowercase      Boolean  @default(true) @map("require_lowercase")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  
  @@map("security_settings")
}
```

#### Default Policy (Secure by Default)
| Setting | Default | Range |
|---------|---------|-------|
| Minimum Password Length | 12 | 12-64 |
| Password History | 5 | 0-24 |
| Lock Duration (min) | 15 | 1-1440 |
| Expiration Days | 90 | 0-3650 (0 = never) |
| Max Failed Attempts | 5 | 1-50 |
| Require Special Char | true | — |
| Require Uppercase | true | — |
| Require Number | true | — |
| Require Lowercase | true | — |

#### Dynamic Validation (Server + Client)
**File:** `src/lib/validations.ts`

```typescript
export function getPasswordValidationString(settings: SecuritySettingsData): z.ZodString {
  let field = z.string().min(settings.minimumPasswordLength, ...);
  
  if (settings.requireUppercase) field = field.regex(/[A-Z]/, ...);
  if (settings.requireLowercase) field = field.regex(/[a-z]/, ...);
  if (settings.requireNumber) field = field.regex(/[0-9]/, ...);
  if (settings.requireSpecialChar) field = field.regex(/[^a-zA-Z0-9]/, ...);
  
  return field;
}
```

---

### 3. Password History (Reuse Prevention)
**File:** `src/lib/password-history.ts`

```typescript
export async function isPasswordReused(
  userId: string,
  newPassword: string,  // PLAINTEXT - compared before hashing
  settings: SecuritySettingsData
): Promise<{ reused: boolean; message?: string }> {
  if (settings.passwordHistory <= 0) return { reused: false };
  
  const history = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: settings.passwordHistory,
    select: { passwordHash: true }
  });
  
  for (const entry of history) {
    const matches = await bcrypt.compare(newPassword, entry.passwordHash);
    if (matches) {
      return { reused: true, message: `Cannot reuse last ${settings.passwordHistory} passwords` };
    }
  }
  return { reused: false };
}

export async function recordPasswordHistory(
  userId: string,
  passwordHash: string,  // Already bcrypt hashed
  settings: SecuritySettingsData
): Promise<void> {
  await db.passwordHistory.create({ data: { userId, passwordHash } });
  
  // Prune old entries beyond limit
  if (settings.passwordHistory > 0) {
    const excess = await db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: settings.passwordHistory,
      select: { id: true }
    });
    if (excess.length > 0) {
      await db.passwordHistory.deleteMany({
        where: { id: { in: excess.map(e => e.id) }}
      });
    }
  }
}
```

#### PasswordHistory Model
```prisma
model PasswordHistory {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at")
  
  @@index([userId, createdAt(sort: Desc)])
  @@map("password_history")
}
```

---

### 4. Password Expiry
**File:** `src/lib/password-expiry.ts`

```typescript
export function isPasswordExpired(
  passwordChangedAt: Date | null,
  expirationDays: number
): boolean {
  if (expirationDays <= 0) return false;  // Never expires
  if (!passwordChangedAt) return true;    // Never changed = expired
  
  const expiryDate = new Date(
    passwordChangedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000
  );
  return new Date() > expiryDate;
}
```

#### On Login (auth.ts)
```typescript
// Force password change if expired or first login (sessionVersion === 0)
let forcePasswordChange = false;
if (settings.expirationDays > 0 && user.sessionVersion === 0) {
  forcePasswordChange = true;
}
if (forcePasswordChange) redirect("/dashboard/settings?forceChange=1");
```

#### On Password Change
```typescript
// Increment sessionVersion → invalidates ALL other sessions
await db.user.update({
  where: { id: userId },
  data: {
    passwordHash: newHash,
    passwordChangedAt: new Date(),
    sessionVersion: { increment: 1 },
    forcePasswordChange: false,
  }
});
```

---

### 5. Password Reset Flow
**Files:** `src/lib/password-reset.ts`, `src/app/actions/password-reset.ts`

#### Request Reset (No Email Enumeration)
```typescript
export async function requestPasswordReset(email: string): Promise<PasswordResetState> {
  // Always return generic message
  const genericMsg = "If an account with that email exists, a reset link has been sent.";
  
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { message: genericMsg };
  
  const rawToken = await generateResetToken(user.id);  // Creates bcrypt hash, stores in DB
  
  // In production: send email with rawToken
  // For dev: log to audit + return in response
  await logAudit({ userId: user.id, action: "PASSWORD_RESET_REQUEST", ... });
  
  return { message: genericMsg, token: rawToken };  // Token only in dev
}
```

#### Token Generation & Storage
```typescript
export async function generateResetToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");  // 256 bits
  const hashedToken = await bcrypt.hash(rawToken, 10);
  
  // Invalidate old unused tokens
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() }
  });
  
  await db.passwordResetToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)  // 15 min
    }
  });
  
  return rawToken;  // Only time plaintext exists
}
```

#### Token Validation
```typescript
export async function validateResetToken(rawToken: string): Promise<{ valid: boolean; userId?: string }> {
  const recentTokens = await db.passwordResetToken.findMany({
    where: { usedAt: null, expiresAt: { gte: new Date() }},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, token: true, userId: true }
  });
  
  for (const entry of recentTokens) {
    if (await bcrypt.compare(rawToken, entry.token)) {
      return { valid: true, userId: entry.userId };
    }
  }
  return { valid: false };
}
```

#### Complete Reset
```typescript
export async function completePasswordReset(
  token: string,
  newPassword: string,
  settings: SecuritySettingsData
): Promise<PasswordResetState> {
  const { valid, userId } = await validateResetToken(token);
  if (!valid || !userId) return { message: "Invalid or expired reset token." };
  
  // Validate against current policy
  const policy = validatePasswordAgainstPolicy(newPassword, settings);
  if (!policy.valid) return { errors: policy.errors };
  
  // Check history
  const { reused } = await isPasswordReused(userId, newPassword, settings);
  if (reused) return { message: "Cannot reuse recent password." };
  
  // Hash & update
  const newHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
      forcePasswordChange: false,
    }
  });
  
  // Record in history
  await recordPasswordHistory(userId, newHash, settings);
  
  // Mark token used
  await markResetTokenUsed(token);
  
  await logAudit({ userId, action: "PASSWORD_RESET_COMPLETE", ... });
  
  return { success: true, message: "Password reset successfully." };
}
```

#### Reset Token Model
```prisma
model PasswordResetToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String    @unique @db.VarChar(255)  // bcrypt hash
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")
  
  @@index([token])
  @@index([userId])
  @@map("password_reset_tokens")
}
```

---

### 6. Failed Login Attempts Tracking
**File:** `prisma/schema.prisma`, `src/lib/progressive-delay.ts`

```prisma
model FailedLoginAttempt {
  id          String   @id @default(uuid()) @db.Uuid
  email       String   @db.VarChar(255)
  userId      String?  @map("user_id") @db.Uuid
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  ipAddress   String   @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.Text
  attemptedAt DateTime @default(now()) @map("attempted_at")
  
  @@index([email, attemptedAt(sort: Desc)])
  @@index([userId])
  @@map("failed_login_attempts")
}
```

#### Recording Attempts
```typescript
export async function recordFailedAttempt(
  email: string,
  userId: string | null,
  ipAddress: string,
  userAgent: string | null
): Promise<{ attemptCount: number; delayMs: number }> {
  await db.failedLoginAttempt.create({ data: { email, userId, ipAddress, userAgent }});
  
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const attemptCount = await db.failedLoginAttempt.count({
    where: { email, attemptedAt: { gte: fifteenMinutesAgo }}
  });
  
  return { attemptCount, delayMs: getProgressiveDelay(attemptCount) };
}
```

#### Clearing on Success
```typescript
export async function clearFailedAttempts(email: string): Promise<void> {
  await db.failedLoginAttempt.deleteMany({ where: { email }});
}
```

---

## Database Schema

### Complete ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS TABLE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)          │ uuid                                                      │
│ email (UQ)       │ varchar(255)                                              │
│ password_hash    │ varchar(255)  -- bcrypt hash                              │
│ name             │ varchar(100)                                              │
│ role             │ enum(SUPER_ADMIN, EDITOR, VIEWER) default VIEWER         │
│ session_version  │ int default 0                                             │
│ password_changed_at│ timestamp?                                              │
│ force_password_change│ boolean default false                                │
│ locked_until     │ timestamp?                                                │
│ created_at       │ timestamp default now()                                   │
│ updated_at       │ timestamp                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ├──────────────────┐
          ▼                  ▼
┌──────────────────┐ ┌──────────────────┐
│ PASSWORD_HISTORY │ │ FAILED_LOGIN_    │
│                  │ │ ATTEMPTS         │
├──────────────────┤ ├──────────────────┤
│ id (PK)          │ │ id (PK)          │
│ user_id (FK)     │ │ email            │
│ password_hash    │ │ user_id (FK, nullable)│
│ created_at       │ │ ip_address       │
└──────────────────┘ │ user_agent       │
                     │ attempted_at     │
                     └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          CREDENTIALS TABLE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              │ uuid                                                  │
│ title                │ varchar(100)                                          │
│ username             │ varchar(100)                                          │
│ encrypted_password   │ text  -- AES-256-GCM ciphertext (hex)                │
│ iv                   │ varchar(100)  -- 12-byte IV (hex)                    │
│ auth_tag             │ varchar(100)  -- 16-byte GCM auth tag (hex)          │
│ url                  │ varchar(500)?                                         │
│ notes                │ text?                                                 │
│ category             │ varchar(50)?                                          │
│ created_by (FK)      │ uuid  → users.id                                      │
│ created_at           │ timestamp default now()                               │
│ updated_at           │ timestamp                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUDIT_LOGS TABLE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              │ uuid                                                  │
│ user_id (FK, null)   │ uuid  → users.id (ON DELETE SET NULL)                │
│ action               │ enum(AuditAction)                                     │
│ target_id (FK, null) │ uuid  → credentials.id (ON DELETE SET NULL)          │
│ details              │ text?                                                 │
│ ip_address           │ varchar(45)?                                          │
│ user_agent           │ text?                                                 │
│ timestamp            │ timestamp default now()                               │
│                                                                              │
│ INDEXES: user_id, action, timestamp                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY_SETTINGS TABLE (SINGLETON)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                    │ uuid                                            │
│ minimum_password_length    │ int default 12                                  │
│ password_history           │ int default 5                                   │
│ lock_duration_minutes      │ int default 15                                  │
│ expiration_days            │ int default 90                                  │
│ mfa_required               │ boolean default false                           │
│ max_failed_attempts        │ int default 5                                   │
│ require_special_char       │ boolean default true                            │
│ require_uppercase          │ boolean default true                            │
│ require_number             │ boolean default true                            │
│ require_lowercase          │ boolean default true                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      PASSWORD_RESET_TOKENS TABLE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              │ uuid                                                  │
│ user_id (FK)         │ uuid  → users.id (ON DELETE CASCADE)                 │
│ token (UQ)           │ varchar(255)  -- bcrypt hash of raw token            │
│ expires_at           │ timestamp                                             │
│ used_at              │ timestamp?                                            │
│ created_at           │ timestamp default now()                               │
│                                                                              │
│ INDEXES: token, user_id                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API & Server Actions

### Authentication Actions (`src/app/actions/auth.ts`)
| Action | Description |
|--------|-------------|
| `login(formData)` | Authenticate user, create session, handle lockout |
| `logout()` | Delete session, audit log, redirect to login |

### Credential Actions (`src/app/actions/credentials.ts`)
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `createCredential(formData)` | SUPER_ADMIN, EDITOR | Encrypt & store new credential |
| `updateCredential(formData)` | SUPER_ADMIN, EDITOR | Update credential (re-encrypt if password changed) |
| `deleteCredential(id)` | SUPER_ADMIN, EDITOR | Delete credential, audit log |

### User Actions (`src/app/actions/users.ts`)
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `createUser(formData)` | SUPER_ADMIN | Create user with hashed password, record history |
| `updateUser(formData)` | SUPER_ADMIN | Update user (optional password change) |
| `deleteUser(id)` | SUPER_ADMIN | Delete user (prevents self-delete) |

### Password Reset Actions (`src/app/actions/password-reset.ts`)
| Action | Description |
|--------|-------------|
| `requestPasswordReset(email)` | Generate token, audit log (no enum) |
| `resetPassword(formData)` | Validate token, policy, history, update password |

### Security Settings Actions (`src/app/actions/security-settings.ts`)
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `updateSecuritySettings(formData)` | SUPER_ADMIN | Update singleton SecuritySettings row |

### API Routes
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/credentials/reveal` | POST | Session + CSRF | Decrypt & return password (rate limited) |
| `/api/credentials/export` | GET | SUPER_ADMIN | Download encrypted credentials JSON |

---

## Frontend Architecture

### Component Hierarchy
```
app/
├── layout.tsx                 # Root layout, providers
├── page.tsx                   # Landing → redirect to /dashboard or /login
├── login/page.tsx             # Login form (client)
├── forgot-password/page.tsx   # Request reset (client)
├── reset-password/page.tsx    # Complete reset (client)
└── dashboard/
    ├── layout.tsx             # Sidebar + topbar, session check
    ├── page.tsx               # Overview (redirects to vault)
    ├── vault/page.tsx         # Credentials vault (RSC + VaultClient)
    ├── users/page.tsx         # User management (RSC + UsersClient)
    ├── security/page.tsx      # Audit log viewer (RSC)
    ├── security/settings/page.tsx  # SecuritySettingsClient
    └── settings/page.tsx      # Password change (ForcePasswordChangeDialog)
```

### Key Client Components
| Component | Purpose |
|-----------|---------|
| `VaultClient` | Credential table, search, filter, create/edit/delete modals |
| `RevealPassword` | Eye button → fetch `/api/credentials/reveal` → display 10s auto-hide |
| `CredentialForm` | Create/edit modal with password generator & strength meter |
| `PasswordGenerator` | Configurable random password generation (client-side crypto) |
| `PasswordStrength` | zxcvbn-style strength estimation (visual feedback) |
| `UsersClient` | User table, create/edit/delete modals |
| `SecuritySettingsClient` | Policy configuration form (dynamic validation) |
| `ForcePasswordChangeDialog` | Modal forcing password change on expiry/first login |

### State Management
- **Server State**: React Server Components + Server Actions (no client cache)
- **Client State**: React `useState`, `useTransition` for pending UI
- **Forms**: React Hook Form + Zod resolvers (client + server shared schemas)

---

## Configuration & Environment

### Required Environment Variables
**File:** `.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

# Encryption (32 bytes = 64 hex chars)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-64-character-hex-string-here"

# Session JWT signing (min 32 chars)
SESSION_SECRET="your-super-secret-session-key-min-32-chars"

# Next.js
NODE_ENV="development"
```

### Key Generation Commands
```bash
# ENCRYPTION_KEY (AES-256-GCM)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# SESSION_SECRET (HS256)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Production Checklist
- [ ] `NODE_ENV=production`
- [ ] `ENCRYPTION_KEY` set (64 hex chars)
- [ ] `SESSION_SECRET` set (32+ chars, high entropy)
- [ ] `DATABASE_URL` points to managed PostgreSQL (SSL required)
- [ ] HTTPS enforced (Secure cookies)
- [ ] Rate limiting moved to Redis (if multi-instance)
- [ ] Audit logs exported to SIEM / immutable storage
- [ ] MFA enabled in Security Settings (when implemented)
- [ ] Backup encryption keys stored securely (HSM / KMS)

---

## Security Considerations & Best Practices

### Implemented Defenses

| Threat | Mitigation |
|--------|------------|
| **Credential theft (DB breach)** | AES-256-GCM encryption at rest; key not in DB |
| **Password cracking** | bcrypt cost 12; per-hash salt |
| **Brute force login** | Rate limit (5/15min) + progressive delay + account lockout |
| **Credential stuffing** | No email enumeration (generic error messages) |
| **Session hijacking** | HttpOnly + Secure + SameSite=Lax cookies; JWT short expiry (24h) |
| **Session fixation** | Session version increments on password change |
| **CSRF** | Origin/Referer check on sensitive API (reveal) |
| **XSS** | React auto-escaping; HttpOnly cookies; CSP-ready headers |
| **Password reuse** | Configurable history (default 5) with bcrypt comparison |
| **Weak passwords** | Dynamic policy: length, charset requirements |
| **Stale passwords** | Expiry policy (default 90 days) + forced change |
| **Audit tampering** | Append-only logs; no update/delete API |
| **Token leakage** | Reset tokens bcrypt-hashed; 15-min expiry; single-use |

### Known Limitations & Future Improvements

| Area | Current State | Recommended Enhancement |
|------|---------------|------------------------|
| **Rate Limiting** | In-memory Map | Redis-backed (Upstash/ioredis) for multi-instance |
| **MFA** | Schema field only (`mfaRequired`) | TOTP (RFC 6238) + WebAuthn / Passkeys |
| **Key Rotation** | Single `ENCRYPTION_KEY` | Key versioning + re-encryption job |
| **Audit Export** | UI only | Automated SIEM streaming (syslog/HTTP) |
| **Password Strength** | Policy regex only | zxcvbn entropy estimation + breach check (HIBP) |
| **Session Revocation** | Version-based (all devices) | Per-device session management UI |
| **Backup Encryption** | Export = encrypted JSON | Age/GPG encryption for offline backups |

### Threat Model Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                     ATTACK SURFACE                               │
├──────────────────────────────────────────────────────────────────┤
│  NETWORK                    APPLICATION                      DATA │
│  ────────                    ────────────                      ─────│
│  ▸ MITM (TLS)             ▸ SQL Injection (Prisma safe)       │
│  ▸ DNS Hijack             ▸ XSS (React safe, CSP headers)     ▸ DB │
│  ▸ BGP Hijack             ▸ CSRF (Origin check + SameSite)     Theft│
│  ▸ DDoS                   ▸ Auth Bypass (JWT verify)          (enc)│
│                           ▸ Priv Esc (RBAC checks)             │
│                           ▸ Info Leak (audit + generic errors) │
└──────────────────────────────────────────────────────────────────┘
```

### Compliance Alignment
| Standard | Coverage |
|----------|----------|
| **NIST 800-63B** | ✅ Password complexity, history, expiry, lockout |
| **OWASP ASVS 4.0** | ✅ V2 (Auth), V3 (Session), V5 (Validation), V7 (Crypto), V12 (Logging) |
| **GDPR Art. 32** | ✅ Encryption at rest, access control, audit logging |
| **SOC 2 Type II** | ✅ Audit trail, access control, encryption |

---

## File Reference Quick Index

| Category | Files |
|----------|-------|
| **Crypto** | `src/lib/crypto.ts` |
| **Auth & Hashing** | `src/lib/auth.ts`, `src/lib/session.ts` |
| **Password Policy** | `src/lib/password-policy.ts`, `src/lib/security-settings.ts` |
| **Password History** | `src/lib/password-history.ts` |
| **Password Expiry** | `src/lib/password-expiry.ts` |
| **Password Reset** | `src/lib/password-reset.ts` |
| **Rate Limiting** | `src/lib/rate-limit.ts` |
| **Progressive Delay** | `src/lib/progressive-delay.ts` |
| **Audit Logging** | `src/lib/audit.ts` |
| **Database** | `src/lib/db.ts`, `prisma/schema.prisma` |
| **Validations** | `src/lib/validations.ts` |
| **Auth Actions** | `src/app/actions/auth.ts` |
| **Credential Actions** | `src/app/actions/credentials.ts` |
| **User Actions** | `src/app/actions/users.ts` |
| **Password Reset Actions** | `src/app/actions/password-reset.ts` |
| **Security Settings Actions** | `src/app/actions/security-settings.ts` |
| **Reveal API** | `src/app/api/credentials/reveal/route.ts` |
| **Export API** | `src/app/api/credentials/export/route.ts` |
| **Vault UI** | `src/components/credential/VaultClient.tsx` |
| **Reveal UI** | `src/components/credential/RevealPassword.tsx` |
| **User Mgmt UI** | `src/components/dashboard/UsersClient.tsx` |
| **Security Settings UI** | `src/components/dashboard/SecuritySettingsClient.tsx` |
| **Login Page** | `src/app/login/page.tsx` |
| **Reset Pages** | `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx` |

---

## Appendix: Cryptographic Parameters Summary

| Component | Algorithm | Key Size | Mode/Params | Key Source |
|-----------|-----------|----------|-------------|------------|
| Credential Encryption | AES | 256-bit | GCM, 12-byte IV, 16-byte tag | `ENCRYPTION_KEY` env |
| User Password Hash | bcrypt | N/A | Cost factor 12 | Per-hash salt |
| Reset Token Hash | bcrypt | N/A | Cost factor 10 | Per-hash salt |
| Session Token | JWT | 256-bit | HS256, 24h expiry | `SESSION_SECRET` env |
| Reset Token Entropy | CSPRNG | 256-bit | 32 random bytes | `crypto.randomBytes` |
| IV/Nonce | CSPRNG | 96-bit | 12 random bytes | `crypto.randomBytes` |

---

*Document generated from source code analysis — SecureVault Password Administration System*
*Last updated: 2026-07-28*