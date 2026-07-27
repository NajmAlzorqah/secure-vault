# SecureVault — Advanced Security Features Documentation

This document provides a detailed technical breakdown of all 10 advanced security features implemented in SecureVault, including the architecture decisions, data flow, and integration points.

---

## Table of Contents

1. [Configurable Password Policy](#1-configurable-password-policy)
2. [Password History](#2-password-history)
3. [Failed Login Tracking & Progressive Delay](#3-failed-login-tracking--progressive-delay)
4. [Password Expiration](#4-password-expiration)
5. [Forced Password Change Dialog](#5-forced-password-change-dialog)
6. [Password Reset Tokens](#6-password-reset-tokens)
7. [Security Settings Configuration](#7-security-settings-configuration)
8. [Security Dashboard](#8-security-dashboard)
9. [Password Age Display](#9-password-age-display)
10. [Admin Force Password Change](#10-admin-force-password-change)

---

## 1. Configurable Password Policy

**Files:** `src/lib/password-policy.ts`, `src/lib/security-settings.ts`, `src/lib/validations.ts`

### Description
All password complexity requirements are driven by a singleton `SecuritySettings` row in the database. This allows administrators to configure the policy without code changes.

### Settings Available
| Setting | Type | Default | Description |
|---|---|---|---|
| `minimumPasswordLength` | Int | 12 | Minimum password length |
| `requireUppercase` | Boolean | true | Require A-Z |
| `requireLowercase` | Boolean | true | Require a-z |
| `requireNumber` | Boolean | true | Require 0-9 |
| `requireSpecialChar` | Boolean | true | Require non-alphanumeric |

### Implementation
- `getPasswordValidationString(settings)` builds a dynamic Zod string schema based on current settings
- `getPasswordRulesFromSettings(settings)` returns client-side rules for the `PasswordRules` component
- `validatePasswordAgainstPolicy(password, settings)` validates directly without Zod
- Dynamic schemas are used in: `getCreateUserSchema()`, `getUpdateUserSchema()`, `getChangePasswordSchema()`, `getResetPasswordSchema()`

### Flow
```
Admin updates settings → clearSettingsCache() → next request fetches fresh settings
User creates/changes password → getSecuritySettings() → dynamic Zod schema → validate
```

---

## 2. Password History

**Files:** `src/lib/password-history.ts`, `prisma/schema.prisma` (PasswordHistory model)

### Description
Prevents users from reusing recently used passwords. The system stores the last N bcrypt hashes per user and compares new passwords against them.

### Database Model
```prisma
model PasswordHistory {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at")
}
```

### Functions
| Function | Description |
|---|---|
| `isPasswordReused(userId, newPassword, settings)` | Checks new password against last N hashes |
| `recordPasswordHistory(userId, passwordHash, settings)` | Stores hash, prunes old records |
| `getPasswordHistoryCount(userId)` | Returns total history entries |

### Integration Points
- `createUser()` — records initial password in history
- `updateUser()` — checks reuse before updating password
- `changePassword()` — checks reuse before changing
- `forceChangePassword()` — checks reuse before forced change
- `resetPassword()` — checks reuse before reset

### Pruning
After recording, old entries beyond `settings.passwordHistory` are deleted (most recent kept).

---

## 3. Failed Login Tracking & Progressive Delay

**Files:** `src/lib/progressive-delay.ts`, `src/app/actions/auth.ts`

### Description
Replaces the original in-memory rate limiter with a database-backed system. Failed attempts are persisted and used to calculate progressive delays before allowing the next attempt.

### Database Model
```prisma
model FailedLoginAttempt {
  id          String   @id @default(uuid()) @db.Uuid
  email       String   @db.VarChar(255)
  userId      String?  @map("user_id") @db.Uuid
  ipAddress   String   @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.Text
  attemptedAt DateTime @default(now()) @map("attempted_at")
}
```

### Progressive Delay Tiers
| Attempt Range | Delay |
|---|---|
| 1-4 | 0 seconds |
| 5-9 | 5 seconds |
| 10-14 | 30 seconds |
| 15+ | 5 minutes |

### Functions
| Function | Description |
|---|---|
| `getProgressiveDelay(attemptCount)` | Returns delay in ms for given count |
| `recordFailedAttempt(email, userId, ip, ua)` | Records attempt, returns count + delay |
| `clearFailedAttempts(email)` | Removes all attempts for email (on success) |
| `checkAccountLock(userId)` | Checks if account is currently locked |
| `lockAccount(userId, durationMinutes)` | Sets `lockedUntil` on User |

### Login Flow
```
1. User submits credentials
2. If user not found → recordFailedAttempt (null userId) → same error message
3. If account locked → return lock duration remaining
4. If password wrong → recordFailedAttempt → return delay info
5. If password correct → clearFailedAttempts → create session → redirect
```

### Account Lockout
After `settings.maxFailedAttempts` failures in the 15-minute window, the account is locked for `settings.lockDuration` minutes. The `User.lockedUntil` field is checked on every login attempt.

---

## 4. Password Expiration

**Files:** `src/lib/password-expiry.ts`, `src/app/dashboard/layout.tsx`

### Description
Passwords can be set to expire after a configurable number of days. Expired passwords trigger a mandatory change flow.

### Configuration
- `SecuritySettings.expirationDays` — 0 means never expire, otherwise number of days

### Functions
| Function | Description |
|---|---|
| `isPasswordExpired(passwordChangedAt, expirationDays)` | Returns boolean |
| `getPasswordAgeInfo(passwordChangedAt, expirationDays)` | Returns detailed age object |
| `formatPasswordAge(passwordChangedAt)` | Human-readable age string |

### PasswordAgeInfo Object
```typescript
{
  ageDays: number;        // Days since last change
  totalDays: number;      // Total expiration window
  percentUsed: number;    // 0-100 percentage of window used
  isExpired: boolean;     // Whether currently expired
  daysRemaining: number;  // Days until expiration (negative if expired)
}
```

### Integration
- **Layout check:** `DashboardLayout` checks expiration on every render. If expired, sets `forcePasswordChange = true`
- **Settings display:** `SettingsClient` shows a color-coded progress bar with age and expiration countdown
- **Login:** Expired passwords trigger the `ForcePasswordChangeDialog`

---

## 5. Forced Password Change Dialog

**Files:** `src/components/dashboard/ForcePasswordChangeDialog.tsx`, `src/app/actions/users.ts` (`forceChangePassword`)

### Description
A full-screen, inescapable modal that blocks all interaction when a user must change their password (admin-forced or expiry-triggered).

### Design Decisions
- **No close button** — cannot be dismissed
- **No escape key** — keyboard shortcut disabled
- **Backdrop blur** — page content visible but inaccessible
- **Session preserved** — unlike voluntary change, does not delete the session or increment `sessionVersion`

### Fields
| Field | Validation |
|---|---|
| Current Password | Required, verified against bcrypt hash |
| New Password | Dynamic policy from SecuritySettings |
| Confirm Password | Must match new password |

### Server Action: `forceChangePassword`
Unlike `changePassword()` which deletes the session, this action:
- Verifies current password
- Checks password history
- Updates password hash
- Sets `forcePasswordChange = false`
- Does NOT increment `sessionVersion` (session stays valid)
- Calls `revalidatePath("/dashboard")` → `router.refresh()` → dialog disappears

### Flow
```
1. User logs in with expired/forced password
2. DashboardLayout renders ForcePasswordChangeDialog overlay
3. User fills current + new + confirm password
4. Client-side Zod validation
5. forceChangePassword() server action
6. forcePasswordChange = false → revalidatePath
7. router.refresh() → layout re-renders → no dialog
```

---

## 6. Password Reset Tokens

**Files:** `src/lib/password-reset.ts`, `src/app/actions/password-reset.ts`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`

### Description
Allows users to reset their password via a time-limited, single-use token when they cannot access their account.

### Database Model
```prisma
model PasswordResetToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @unique @db.VarChar(255)  // bcrypt hash
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")
}
```

### Token Generation
1. Generate 32 random bytes via `crypto.randomBytes(32)`
2. Encode as hex string (raw token sent to user)
3. Bcrypt hash the raw token before storing in database
4. Token expires after 1 hour

### Functions
| Function | Description |
|---|---|
| `generateResetToken(userId)` | Creates token, returns raw value |
| `validateResetToken(token)` | Bcrypt-compares against stored hash |
| `markResetTokenUsed(token)` | Sets `usedAt` timestamp |
| `cleanupExpiredTokens()` | Removes expired/used tokens |

### Security Measures
- Raw token never stored — only bcrypt hash
- Generic response regardless of email existence (prevents enumeration)
- Single-use (marked as used after successful reset)
- Time-limited (1-hour expiry)

### User Flow
```
1. User clicks "Forgot your password?" on login page
2. Enters email → requestPasswordReset() → generic confirmation
3. (Dev mode: token shown in UI for testing)
4. User clicks token link → /reset-password?token=...
5. Enters new password + confirm
6. resetPassword() validates token → updates password → marks token used
7. Redirects to login
```

---

## 7. Security Settings Configuration

**Files:** `src/lib/security-settings.ts`, `src/app/actions/security-settings.ts`, `src/components/dashboard/SecuritySettingsClient.tsx`

### Description
SUPER_ADMIN-only interface to configure all security policies from a single page.

### Admin Page
`/dashboard/security/settings` — accessible only to SUPER_ADMIN role.

### Settings Form Fields
| Section | Fields |
|---|---|
| Password Policy | Minimum length, history count, character requirements (4 checkboxes) |
| Lockout Policy | Max failed attempts, lock duration |
| Expiration Policy | Expiration days |

### Caching
- `getSecuritySettings()` caches the singleton row using `globalThis` (per-request lifecycle)
- `clearSettingsCache()` is called after updates to force fresh fetch
- `getDefaultSettings()` provides defaults without DB access (for client components)

### Validation
- Server-side: Custom validators in `security-settings.ts` (manual range checks)
- Client-side: Zod schema `securitySettingsSchema` in `validations.ts`

---

## 8. Security Dashboard

**Files:** `src/app/dashboard/security/page.tsx`, `src/components/dashboard/SecurityDashboardClient.tsx`

### Description
SUPER_ADMIN-only overview of the system's security posture with computed score, live stats, and recent events.

### Security Score (0-100)
Calculated from:
- Password length: up to 25 points
- Character requirements: 5 points each (20 max)
- History: up to 15 points
- Lockout: up to 15 points
- Expiration: up to 15 points

Score ranges:
- **80-100:** Strong (green)
- **50-79:** Moderate (yellow)
- **0-49:** Weak (red)

### Stats Displayed
| Stat | Source |
|---|---|
| Total Users | `db.user.count()` |
| Locked Users | `db.user.count({ where: { lockedUntil: { gt: now } } })` |
| Failed Attempts (24h) | `db.failedLoginAttempt.count()` |
| Expired Passwords | `db.user.count()` with date comparison |

### Recent Events
Last 20 security events filtered to: `LOGIN_FAILED`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_COMPLETE`

---

## 9. Password Age Display

**Files:** `src/components/dashboard/SettingsClient.tsx`, `src/app/dashboard/settings/page.tsx`

### Description
Visual indicators on the user's Settings page showing when their password was last changed and when it will expire.

### Components
- **Password Age Progress Bar:** Color transitions from green → yellow → red based on `percentUsed`
- **Expiration Countdown:** "Expires in X days" or "Expired X days ago"
- **Force Change Banner:** Yellow warning when `forceChange=true` param is present
- **Age Text:** "Password last changed X days ago"

### Color Thresholds
| % Used | Color |
|---|---|
| 0-60% | Emerald (green) |
| 61-80% | Amber (yellow) |
| 81-100%+ | Red |

---

## 10. Admin Force Password Change

**Files:** `src/components/dashboard/UserForm.tsx`, `src/app/actions/users.ts`

### Description
SUPER_ADMIN can force any user to change their password on their next login by checking a checkbox in the user edit form.

### How It Works
1. Admin opens user edit form → checks "Force password change on next login"
2. `updateUser()` sets `forcePasswordChange = true` on the target user
3. Target user's next dashboard render triggers `ForcePasswordChangeDialog`
4. User must change password before accessing any dashboard content
5. After change, `forcePasswordChange` is set to `false` automatically

### The Checkbox
- Only visible in edit mode (`mode === "edit"`)
- Sent as `formData.append("forcePasswordChange", "on")`
- Parsed as boolean in the action: `formData.get("forcePasswordChange") === "on"`

---

## Cross-Cutting Concerns

### Audit Logging
All security features produce audit entries:
- Failed login attempts → `LOGIN_FAILED`
- Password reset requests → `PASSWORD_RESET_REQUEST`
- Password resets → `PASSWORD_RESET_COMPLETE`
- Password changes → `CHANGE_PASSWORD`
- Settings updates → `UPDATE_USER` (with details)

### Session Invalidation
- Voluntary password change (`changePassword`) → increments `sessionVersion` + deletes session (forces re-login)
- Forced password change (`forceChangePassword`) → does NOT increment `sessionVersion` (session stays valid)
- Password reset → increments `sessionVersion` (all sessions invalidated)

### Middleware (proxy.ts)
- **Public routes:** `/login`, `/forgot-password`, `/reset-password`
- Unauthenticated users → redirected to `/login`
- Authenticated users on `/login` → redirected to `/dashboard`
- All other routes require valid JWT session
