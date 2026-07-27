# Implementation Plan: Advanced Password Security Features

## Overview

Add 10 security features to SecureVault: Password Policy, Expiration, History, Failed Login Tracking, Progressive Delay, Reset Tokens, Force Change, Configurable Settings, Password Age Display, and Security Dashboard.

## Phase 1: Database Schema Changes

### File: `prisma/schema.prisma`

**New enum values on `AuditAction`:**
- `PASSWORD_RESET_REQUEST`
- `PASSWORD_RESET_COMPLETE`

**User model additions (3 new fields):**
```
passwordChangedAt   DateTime? @map("password_changed_at")
forcePasswordChange Boolean   @default(false) @map("force_password_change")
lockedUntil         DateTime? @map("locked_until")
```

Plus relations: `passwordHistory PasswordHistory[]`, `failedLoginAttempts FailedLoginAttempt[]`, `resetTokens PasswordResetToken[]`

**4 new models:**

1. **SecuritySettings** (singleton row) — `minimumPasswordLength` (12), `passwordHistory` (5), `lockDuration` (15 min), `expirationDays` (90), `mfaRequired` (false), `maxFailedAttempts` (5), `requireSpecialChar` (true), `requireUppercase` (true), `requireNumber` (true), `requireLowercase` (true)

2. **PasswordHistory** — `userId` (FK, cascade), `passwordHash`, `createdAt`. Index on `[userId, createdAt desc]`

3. **FailedLoginAttempt** — `email`, `userId` (nullable FK), `ipAddress`, `userAgent`, `attemptedAt`. Index on `[email, attemptedAt desc]`

4. **PasswordResetToken** — `userId` (FK, cascade), `token` (unique, varchar 255), `expiresAt`, `usedAt`. Index on `[token]`

---

## Phase 2: Security Settings Infrastructure

### New: `src/lib/security-settings.ts`
- `getSecuritySettings()` — fetches singleton row with globalThis caching
- `updateSecuritySettings(data)` — admin update

### Modified: `prisma/seed.ts`
- Upsert SecuritySettings with defaults
- Create initial PasswordHistory entries for seeded users

---

## Phase 3: Password Policy Engine

### New: `src/lib/password-policy.ts`
- `validatePasswordAgainstPolicy(password, settings)` — checks length, uppercase, lowercase, number, special char. Returns `{ valid, errors[] }`
- `validatePasswordHistory(userId, newPassword, settings)` — checks against last N hashes via bcrypt.compare

### Modified: `src/lib/validations.ts`
- `getPasswordValidationSchema(settings)` — returns dynamic Zod schema based on SecuritySettings
- Keep existing schemas for backward compat but update them to use the dynamic generator

### Modified: `src/components/ui/PasswordRules.tsx`
- Accept `settings: SecuritySettings` prop
- Dynamically show/hide rules based on settings
- Update labels to reflect configured minimum length

---

## Phase 4: Password History

### New: `src/lib/password-history.ts`
- `checkPasswordHistory(userId, newPasswordHash, settings)` — checks reuse, returns `{ allowed, message }`
- `recordPasswordHistory(userId, passwordHash, settings)` — stores hash, prunes old entries
- `getPasswordHistoryCount(userId)` — for dashboard display

### Modified: `src/app/actions/users.ts`
- `changePassword()` — call checkPasswordHistory before update, recordPasswordHistory after
- `createUser()` — recordPasswordHistory for initial password
- `updateUser()` — recordPasswordHistory when admin sets password

---

## Phase 5: Failed Login Tracking + Progressive Delay

### New: `src/lib/progressive-delay.ts`
Progressive delay tiers:
- Attempt 1-4: 0 sec
- Attempt 5-9: 5 sec
- Attempt 10-14: 30 sec
- Attempt 15+: 5 min

Functions:
- `getProgressiveDelay(attemptCount)` — returns ms delay
- `recordFailedAttempt(email, ipAddress, userAgent)` — writes to FailedLoginAttempt, returns `{ attemptCount, delayMs }`
- `clearFailedAttempts(email)` — on successful login
- `getRecentFailedAttempts(email, withinMinutes?)` — count

### Modified: `src/app/actions/auth.ts` `login()`
1. After credential failure: call `recordFailedAttempt()`
2. Before session creation: check `user.lockedUntil` — reject if still locked
3. On too many failures: set `user.lockedUntil` based on settings lockDuration
4. On success: call `clearFailedAttempts()`, reset `lockedUntil`
5. Return delay info to client for display

### Modified: `src/app/login/page.tsx`
- Add "Forgot your password?" link
- Display wait time message when delayed

---

## Phase 6: Password Expiration

### New: `src/lib/password-expiry.ts`
- `isPasswordExpired(passwordChangedAt, expirationDays)` — boolean
- `getPasswordAgeInfo(passwordChangedAt, expirationDays)` — `{ ageInDays, isExpired, daysUntilExpiry }`

### Modified: `src/app/dashboard/layout.tsx`
- After session verification, check password expiry
- If expired or `forcePasswordChange`, redirect to `/dashboard/settings?forceChange=1`

### Modified: `src/app/actions/auth.ts` `login()`
- After successful login, check password age, set `forcePasswordChange = true` if expired

---

## Phase 7: Password Reset Tokens

### New: `src/lib/password-reset.ts`
- `generateResetToken(userId)` — crypto.randomBytes(32), store hashed, expires in 15 min
- `validateResetToken(token)` — check exists, not expired, not used
- `useResetToken(token)` — mark usedAt

### New: `src/app/actions/password-reset.ts`
- `requestPasswordReset(email)` — generate token, log audit, return generic message
- `resetPassword(token, newPassword, confirmPassword)` — validate, update password, increment sessionVersion, record history, mark token used

### New pages:
- `/forgot-password/page.tsx` — email input form
- `/reset-password/page.tsx` — token from query param, new password form

### Modified: `src/app/login/page.tsx` — add "Forgot your password?" link

---

## Phase 8: Force Password Change

### Modified: `src/app/actions/users.ts` `updateUser()`
- Accept `forcePasswordChange` boolean from form data
- Set on target user

### Modified: `src/components/dashboard/UserForm.tsx`
- Add "Force password change on next login" checkbox (admin only)

### Modified: `src/components/dashboard/SettingsClient.tsx`
- Accept `forceChange` prop
- Show prominent banner when forced

---

## Phase 9: Security Dashboard

### New: `/dashboard/security/page.tsx`
SUPER_ADMIN only. Shows:
- Password policy summary
- Account lockout overview
- Recent failed login attempts
- Password age distribution
- Security status

### New: `src/components/dashboard/SecurityDashboardClient.tsx`
Interactive security overview with colored status indicators.

### New: `/dashboard/security/settings/page.tsx`
Admin form to edit SecuritySettings.

### New: `src/components/dashboard/SecuritySettingsClient.tsx`
Form with all policy controls.

### Modified: `src/components/dashboard/Sidebar.tsx`
Add nav item:
```
{ href: "/dashboard/security", label: "Security", icon: ShieldCheck, roles: ["SUPER_ADMIN"] }
```

---

## Phase 10: Password Age Display

### Modified: `src/app/dashboard/settings/page.tsx`
- Pass `passwordChangedAt` and `passwordAgeInfo` to SettingsClient

### Modified: `src/components/dashboard/SettingsClient.tsx`
- Add "Password Age" display in Profile card
- Show "Changed X days ago" / "Expires in Y days"
- Visual progress bar

---

## Phase 11: Login Page Updates

### Modified: `src/app/login/page.tsx`
- "Forgot your password?" link below form
- Progressive delay wait message
- Better error messaging for locked accounts

---

## File Summary

| Action | File |
|--------|------|
| MODIFY | `prisma/schema.prisma` |
| MODIFY | `prisma/seed.ts` |
| CREATE | `src/lib/security-settings.ts` |
| CREATE | `src/lib/password-policy.ts` |
| CREATE | `src/lib/password-history.ts` |
| CREATE | `src/lib/password-expiry.ts` |
| CREATE | `src/lib/password-reset.ts` |
| CREATE | `src/lib/progressive-delay.ts` |
| CREATE | `src/app/actions/security-settings.ts` |
| CREATE | `src/app/actions/password-reset.ts` |
| CREATE | `src/app/forgot-password/page.tsx` |
| CREATE | `src/app/reset-password/page.tsx` |
| CREATE | `src/app/dashboard/security/page.tsx` |
| CREATE | `src/app/dashboard/security/settings/page.tsx` |
| CREATE | `src/components/dashboard/SecurityDashboardClient.tsx` |
| CREATE | `src/components/dashboard/SecuritySettingsClient.tsx` |
| MODIFY | `src/app/actions/auth.ts` |
| MODIFY | `src/app/actions/users.ts` |
| MODIFY | `src/lib/validations.ts` |
| MODIFY | `src/components/ui/PasswordRules.tsx` |
| MODIFY | `src/components/dashboard/Sidebar.tsx` |
| MODIFY | `src/components/dashboard/SettingsClient.tsx` |
| MODIFY | `src/components/dashboard/UserForm.tsx` |
| MODIFY | `src/components/dashboard/UsersClient.tsx` |
| MODIFY | `src/app/dashboard/settings/page.tsx` |
| MODIFY | `src/app/dashboard/layout.tsx` |
| MODIFY | `src/app/dashboard/page.tsx` |
| MODIFY | `src/app/login/page.tsx` |
| MODIFY | `src/app/dashboard/users/page.tsx` |
| MODIFY | `src/app/dashboard/audit/page.tsx` |

## Execution Order

1. Schema + Seed (Phase 1-2)
2. Lib files (Phase 3-7 core)
3. Server actions (Phase 3-8 actions)
4. UI components (Phase 3, 8, 10)
5. New pages (Phase 7, 9)
6. Existing page modifications (Phase 5, 6, 11)
7. Prisma generate + build + lint
