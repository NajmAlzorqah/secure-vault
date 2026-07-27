# SecureVault — User Flow Documentation

## Overview

This document describes all user-facing flows in the SecureVault Password Administration System. Each flow includes the user's perspective, UI screens, decision points, and success/failure outcomes.

---

## User Roles & Permissions

| Role | Description | Credential Access | User Mgmt | Security Settings | Export |
|------|-------------|-------------------|-----------|-------------------|--------|
| **SUPER_ADMIN** | Full system administrator | Full CRUD + Reveal | Full CRUD | Read/Write | ✅ |
| **EDITOR** | Credential manager | Full CRUD + Reveal | ❌ | Read-only | ❌ |
| **VIEWER** | Read-only access | List only (no reveal) | ❌ | Read-only | ❌ |

---

## Flow 1: Initial Access & Authentication

### 1.1 Landing Page → Login Redirect
```
User visits / 
    │
    ├─► No session? ──► Redirect to /login
    │
    └─► Has session? ──► Redirect to /dashboard
```

### 1.2 Login Flow (`/login`)
```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN PAGE                                │
├─────────────────────────────────────────────────────────────────┤
│  Email:    [____________________]  (validation: required, email) │
│  Password: [____________________]  (show/hide toggle)           │
│  [Password Rules Checklist - always visible]                    │
│  [Forgot Password?] ──────────────────────────► /forgot-password │
│  [Sign In Button]                                               │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  SUBMIT (FormData)  │
         └─────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Server Action: login │
        │ (auth.ts)            │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   SUCCESS               FAILURE
        │                     │
        ▼                     ▼
┌───────────────┐    ┌────────────────────┐
│ Create JWT    │    │ Generic error:     │
│ session cookie│    │ "Invalid email or  │
│ sessionVersion│    │  password."        │
│ (24h expiry)  │    │                    │
│               │    │ Rate limited?      │
│ Check pwd     │    │ Show delay:        │
│ expiry        │    │ "Wait N seconds"   │
│               │    │                    │
│ Expired?      │    │ Max attempts?      │
│   Yes ──►     │    │ Account locked     │
│   forceChange │    │ "Locked for N min" │
│   = true      │    │                    │
│               │    │ Audit: LOGIN_FAILED│
│ Redirect      │    └────────────────────┘
│ /dashboard    │
│ or            │
│ /settings     │
│ ?forceChange=1│
└───────────────┘
```

#### Login Page Elements
| Element | Behavior |
|---------|----------|
| Email field | Required, email format, lowercase trim |
| Password field | Required, show/hide toggle (Eye/EyeOff icon) |
| Password Rules | Real-time checklist (length, uppercase, lowercase, number, special) |
| Error display | Server errors (generic) + field validation errors |
| Loading state | Button shows spinner "Authenticating..." |
| Forgot password link | Navigates to `/forgot-password` |

#### Progressive Delay Messages
| Attempt # | Delay | Message |
|-----------|-------|---------|
| 1-4 | 0s | "Invalid email or password." |
| 5-9 | 5s | "Invalid email or password. Please wait 5 seconds before trying again." |
| 10-14 | 30s | "Invalid email or password. Please wait 30 seconds before trying again." |
| 15+ | 5min | "Too many failed attempts. Account locked for 15 minutes." |

---

## Flow 2: Password Reset (Forgot Password)

### 2.1 Request Reset (`/forgot-password`)
```
┌─────────────────────────────────────────────────────────────────┐
│                    FORGOT PASSWORD PAGE                          │
├─────────────────────────────────────────────────────────────────┤
│  Email: [____________________]  (required, email format)        │
│  [Submit Button]                                                │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ requestPasswordReset   │
         │ (password-reset.ts)    │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    USER EXISTS              USER NOT FOUND
         │                       │
         ▼                       ▼
┌────────────────────┐  ┌────────────────────┐
│ Generate 256-bit   │  │ Return SAME generic│
│ random token       │  │ message:           │
│ Bcrypt hash (cost 10)│  │ "If an account   │
│ Store in DB        │  │  with that email   │
│ Invalidate old     │  │  exists, a reset   │
│ tokens for user    │  │  link has been     │
│                    │  │  sent."            │
│ Log audit:         │  │                    │
│ PASSWORD_RESET_    │  │ Log audit:         │
│ REQUEST            │  │ PASSWORD_RESET_    │
│                    │  │ REQUEST (no userId)│
│ Return token (dev) │  │                    │
│ or generic msg     │  │ Return generic msg │
└────────────────────┘  └────────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌────────────────────────┐
         │ Display: "If an account│
         │ with that email exists, │
         │ a reset link has been   │
         │ sent."                  │
         │                          │
         │ [Back to Login] link    │
         └────────────────────────┘
```

### 2.2 Reset Password (`/reset-password?token=...`)
```
┌─────────────────────────────────────────────────────────────────┐
│                    RESET PASSWORD PAGE                           │
├─────────────────────────────────────────────────────────────────┤
│  Token: [hidden from URL, passed via query param]               │
│  New Password:    [____________________] (show/hide)            │
│  Confirm Password:[____________________] (show/hide)            │
│  [Password Rules Checklist - driven by SecuritySettings]        │
│  [Reset Password Button]                                        │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ resetPassword          │
         │ (password-reset.ts)    │
         └───────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    INVALID      PASSWORD      VALID
    TOKEN        MISMATCH       │
        │            │           ▼
        ▼            ▼    ┌──────────────┐
    "Invalid or    "Passwords  │ Validate vs  │
    expired reset   do not     │ SecuritySettings│
    token."         match."    │ policy        │
        │            │           └──────┬───────┘
        ▼            ▼                  │
   Back to       Stay on          ┌─────┴─────┐
   /forgot-pwd   page             ▼           ▼
                            PASS         FAIL
                              │           │
                              ▼           ▼
                      ┌────────────┐  Show errors:
                      │ Check pwd  │  - Min length
                      │ history    │  - Missing chars
                      │ (bcrypt)   │  - etc.
                      └─────┬──────┘
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
              REUSED              NEW
                   │                 │
                   ▼                 ▼
            "Cannot reuse   ┌──────────────────┐
             last N        │ Hash password    │
             passwords"    │ (bcrypt cost 12) │
                   │       │ Update user:     │
                   ▼       │ - passwordHash   │
                      ┌──────────────────┐   │
                      │ - passwordChanged│   │
                      │   At = now()     │   │
                      │ - sessionVersion │   │
                      │   +1 (invalidate │   │
                      │   all sessions)  │   │
                      │ - forcePassword  │   │
                      │   Change = false │   │
                      └────────┬─────────┘   │
                               │             │
                               ▼             │
                      ┌──────────────────┐   │
                      │ Record in        │   │
                      │ password_history │   │
                      │ Prune old        │   │
                      │ entries > limit  │   │
                      └────────┬─────────┘   │
                               │             │
                               ▼             │
                      ┌──────────────────┐   │
                      │ Mark token used  │   │
                      │ (usedAt = now()) │   │
                      └────────┬─────────┘   │
                               │             │
                               ▼             │
                      ┌──────────────────┐   │
                      │ Log audit:       │   │
                      │ PASSWORD_RESET_  │   │
                      │ COMPLETE         │   │
                      └────────┬─────────┘   │
                               │             │
                               ▼             │
                      ┌──────────────────┐   │
                      │ Success:         │   │
                      │ "Password reset  │   │
                      │ successfully.    │   │
                      │ You can now log  │   │
                      │ in with your new │   │
                      │ password."       │   │
                      │ [Go to Login]    │   │
                      └──────────────────┘   │
```

---

## Flow 3: Dashboard Navigation (Authenticated)

### 3.1 Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD LAYOUT                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │  SIDEBAR    │  │              MAIN CONTENT               │  │
│  │             │  │                                         │  │
│  │  [Logo]     │  │  ┌─────────────────────────────────┐   │  │
│  │             │  │  │ TOP BAR                         │   │  │
│  │  Navigation │  │  │ [Page Title] [User Menu ▼]      │   │  │
│  │  ─────────  │  │  └─────────────────────────────────┘   │  │
│  │  📋 Vault   │  │                                         │  │
│  │  👥 Users*  │  │  PAGE CONTENT                         │  │
│  │  📊 Audit*  │  │  (varies by route)                    │  │
│  │  🔒 Security│  │                                         │  │
│  │     ├Settings│  │                                         │  │
│  │             │  │                                         │  │
│  │             │  │                                         │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
  * SUPER_ADMIN only
```

### 3.2 User Menu (Top Bar)
```
┌─────────────────────────────────────────────────────────────────┐
│  [User Avatar]  John Doe (EDITOR)  ▼                            │
├─────────────────────────────────────────────────────────────────┤
│  👤 Profile              (not implemented - placeholder)        │
│  🔑 Change Password      ──────────────────► /settings          │
│  ────────────────────────────────────────────────────────────   │
│  🚪 Logout               ──────────────────► /login (POST)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Credentials Vault (`/dashboard/vault`)

### 4.1 Vault List View
```
┌─────────────────────────────────────────────────────────────────┐
│                      CREDENTIALS VAULT                           │
├─────────────────────────────────────────────────────────────────┤
│  [Search: ________________________]  [Category Filter ▼]        │
│  [+ Add Credential]  (SUPER_ADMIN/EDITOR only)                  │
│  ─────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Title          │ Category │ Username │ Password │ URL     │  │
│  ├────────────────┼──────────┼──────────┼──────────┼─────────┤  │
│  │ AWS Prod       │ Cloud    │ admin    │ [👁] [📋]│ aws.com │  │
│  │ GitHub Org     │ Code     │ deploy   │ [👁] [📋]│ github  │  │
│  │ Database       │ Infra    │ root     │ [👁] [📋]│ internal│  │
│  └───────────────────────────────────────────────────────────┘  │
│  [Actions per row: Edit 📝 | Delete 🗑]  (SUPER_ADMIN/EDITOR)   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Reveal Password Flow
```
User clicks 👁 (Eye) button
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/credentials/reveal                                   │
│  { credentialId: "uuid" }                                       │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Server-side checks:                                     │   │
│  │ 1. Valid session (JWT from HttpOnly cookie)             │   │
│  │ 2. CSRF: Origin/Referer === Host                        │   │
│  │ 3. Rate limit: 20 req/min per user                      │   │
│  │ 4. Credential exists                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  Decrypt: AES-256-GCM(encryptedPassword, iv, authTag)          │
│       │                                                         │
│       ▼                                                         │
│  Log audit: VIEW_PASSWORD (credentialId, title, IP, UA)        │
│       │                                                         │
│       ▼                                                         │
│  Return: { password: "plaintext" }                             │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Client displays password in mono font
        │
        ▼
Auto-hide after 10 seconds → shows ••••••••
        │
        ▼
Copy button 📋:
  - Copy to clipboard
  - Show ✓ for 2s
  - Auto-clear clipboard after 30s (security)
```

### 4.3 Create Credential Modal
```
┌─────────────────────────────────────────────────────────────────┐
│                    ADD CREDENTIAL                                │
├─────────────────────────────────────────────────────────────────┤
│  Title:       [____________________] * (required, max 100)      │
│  Username:    [____________________] * (required, max 100)      │
│  Password:    [____________________] * (required, min 12)       │
│               [👁 Show] [🎲 Generate] [Strength Meter]          │
│  URL:         [____________________]   (optional, valid URL)    │
│  Notes:       [____________________]   (optional, max 5000)     │
│  Category:    [____________________]   (optional, max 50)       │
│                                                                 │
│  [Cancel]                    [Save Credential]                  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ createCredential       │
         │ (credentials.ts)       │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      SUCCESS                 FAILURE
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Encrypt password │   │ Validation errors│
│ (AES-256-GCM)    │   │ (Zod)            │
│ Store in DB      │   │                  │
│ Log audit:       │   │ Return errors    │
│ CREATE_CREDENTIAL│   │ to form          │
│ Revalidate paths │   └──────────────────┘
│ Close modal      │
│ Toast: Success   │
└──────────────────┘
```

### 4.4 Edit Credential Modal
```
┌─────────────────────────────────────────────────────────────────┐
│                    EDIT CREDENTIAL                               │
├─────────────────────────────────────────────────────────────────┤
│  Title:       [AWS Prod____________] *                          │
│  Username:    [admin______________] *                           │
│  Password:    [____________________]   (optional - leave blank  │
│               to keep current)                                  │
│  URL:         [https://aws.amazon.com]                          │
│  Notes:       [Production AWS account]                          │
│  Category:    [Cloud______________]                             │
│                                                                 │
│  [Cancel]                    [Update Credential]                │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ updateCredential       │
         │ (credentials.ts)       │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      SUCCESS                 FAILURE
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ If password      │   │ Validation errors│
│ provided:        │   │                  │
│  - Encrypt new   │   │ Return errors    │
│  - Update iv,    │   │ to form          │
│    authTag       │   └──────────────────┘
│ Log audit:       │
│ UPDATE_CREDENTIAL│
│ Revalidate       │
│ Close modal      │
│ Toast: Success   │
└──────────────────┘
```

### 4.5 Delete Credential
```
User clicks 🗑 (Trash) button
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONFIRM DELETION DIALOG                                         │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  Confirm Credential Deletion                                 │
│                                                                  │
│  Are you sure you want to permanently delete this credential?   │
│  This action cannot be undone and will be written to the        │
│  security audit log.                                             │
│                                                                  │
│  [Cancel]                    [Permanently Delete] 🔴            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ (Confirm)
┌─────────────────────────────────────────────────────────────────┐
│  Server Action: deleteCredential                                 │
│  - Delete from DB                                                │
│  - Log audit: DELETE_CREDENTIAL                                  │
│  - Revalidate paths                                              │
│  - Toast: Success                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Export Credentials (SUPER_ADMIN Only)
```
User clicks Export button (Security page)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/credentials/export                                     │
│       │                                                         │
│       ▼                                                         │
│  requireRole(["SUPER_ADMIN"])                                    │
│       │                                                         │
│       ▼                                                         │
│  Fetch ALL credentials (with encrypted passwords)               │
│       │                                                         │
│       ▼                                                         │
│  Log audit: EXPORT_CREDENTIALS (count, IP, UA)                  │
│       │                                                         │
│       ▼                                                         │
│  Return JSON attachment:                                         │
│  securevault-backup-YYYY-MM-DD.json                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 5: User Management (`/dashboard/users`) — SUPER_ADMIN Only

### 5.1 Users List View
```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM USERS                                │
├─────────────────────────────────────────────────────────────────┤
│  [Search: ________________________]                             │
│  [+ Add User]                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Name          │ Email              │ Role       │ Created │  │
│  ├───────────────┼────────────────────┼────────────┼─────────┤  │
│  │ John Doe  👤  │ john@company.com   │ SUPER_ADMIN│ Jan 15  │  │
│  │ Jane Smith    │ jane@company.com   │ EDITOR     │ Feb 20  │  │
│  │ Bob Wilson    │ bob@company.com    │ VIEWER     │ Mar 10  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  [Actions: Edit 📝 | Delete 🗑]  (no self-delete)               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Create User Modal
```
┌─────────────────────────────────────────────────────────────────┐
│                    ADD USER                                      │
├─────────────────────────────────────────────────────────────────┤
│  Name:       [____________________] * (2-100 chars)             │
│  Email:      [____________________] * (valid email, unique)     │
│  Password:   [____________________] * (per SecuritySettings)    │
│  Role:       [SUPER_ADMIN ▼] * (enum)                           │
│                                                                 │
│  [Cancel]                    [Create User]                      │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ createUser             │
         │ (users.ts)             │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      SUCCESS                 FAILURE
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Hash password    │   │ - Duplicate email│
│ (bcrypt cost 12) │   │ - Validation errs│
│ Create user      │   │                  │
│ passwordChangedAt│   │ Return errors    │
│ = now()          │   │ to form          │
│ Record in        │   └──────────────────┘
│ password_history │
│ Log audit:       │
│ CREATE_USER      │
│ Revalidate       │
│ Close modal      │
│ Toast: Success   │
└──────────────────┘
```

### 5.3 Edit User Modal
```
┌─────────────────────────────────────────────────────────────────┐
│                    EDIT USER                                     │
├─────────────────────────────────────────────────────────────────┤
│  Name:       [John Doe____________]                             │
│  Email:      [john@company.com____]  (unique check)             │
│  Role:       [SUPER_ADMIN ▼]                                    │
│  Password:   [____________________]  (optional - blank = keep)  │
│  ☐ Force password change on next login                          │
│                                                                 │
│  [Cancel]                    [Update User]                      │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ updateUser             │
         │ (users.ts)             │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      SUCCESS                 FAILURE
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ If password:     │   │ - Duplicate email│
│  - Check history │   │ - History reuse  │
│  - Hash new      │   │ - Validation     │
│  - sessionVersion│   │                  │
│    +1            │   │ Return errors    │
│  - Record history│   │ to form          │
│ Log audit:       │   └──────────────────┘
│ UPDATE_USER      │
│ Revalidate       │
│ Close modal      │
│ Toast: Success   │
└──────────────────┘
```

### 5.4 Delete User
```
User clicks 🗑 on user row (not self)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  DELETE USER DIALOG                                              │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  Delete Administrator User                                   │
│                                                                  │
│  Are you sure you want to permanently delete this administrator │
│  user? This will instantly revoke their access to the password  │
│  system and will be written to the security audit trail.        │
│                                                                  │
│  [Cancel]                    [Revoke Access] 🔴                 │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ (Confirm)
┌─────────────────────────────────────────────────────────────────┐
│  Server Action: deleteUser                                       │
│  - Prevent self-delete                                           │
│  - Delete from DB (cascades: history, attempts, tokens)         │
│  - Log audit: DELETE_USER                                        │
│  - Revalidate paths                                              │
│  - Toast: Success                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 6: Security Settings (`/dashboard/security/settings`) — SUPER_ADMIN Only

### 6.1 Settings Form
```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY SETTINGS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ PASSWORD POLICY ────────────────────────────────────────┐   │
│  │  Minimum Length:    [12]  (12-64)                        │   │
│  │  History Count:     [5]   (0-24)                         │   │
│  │  ☑ Require Uppercase                                      │   │
│  │  ☑ Require Lowercase                                      │   │
│  │  ☑ Require Numbers                                        │   │
│  │  ☑ Require Special Chars                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ LOCKOUT POLICY ──────────────────────────────────────────┐   │
│  │  Max Failed Attempts: [5]   (1-50)                        │   │
│  │  Lock Duration (min): [15]  (1-1440)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ EXPIRATION POLICY ────────────────────────────────────────┐   │
│  │  Expiration (days):   [90]  (0 = never, max 3650)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Save Settings]                                                │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ updateSecuritySettings │
         │ (security-settings.ts) │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      SUCCESS                 FAILURE
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Update singleton │   │ Validation errors│
│ SecuritySettings │   │ (per-field)      │
│ Clear settings   │   │                  │
│ cache            │   │ Return errors    │
│ Log audit:       │   │ to form          │
│ UPDATE_USER*     │   └──────────────────┘
│ Revalidate paths │
│ Toast: Success   │
└──────────────────┘
```
*Note: Audit action is UPDATE_USER (legacy naming)*

---

## Flow 7: Audit Log (`/dashboard/security`) — All Roles (Read)

### 7.1 Audit Log View
```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY AUDIT LOG                          │
├─────────────────────────────────────────────────────────────────┤
│  [Filters: Action ▼ | User ▼ | Date Range]                      │
│  ─────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Time           │ User       │ Action          │ Details   │  │
│  ├────────────────┼────────────┼─────────────────┼───────────┤  │
│  │ 2024-01-15     │ john@...   │ LOGIN           │ User      │  │
│  │ 10:30:45       │            │                 │ logged in │  │
│  │ 2024-01-15     │ jane@...   │ VIEW_PASSWORD   │ Revealed  │  │
│  │ 10:31:12       │            │                 │ AWS Prod  │  │
│  │ 2024-01-15     │ (unknown)  │ LOGIN_FAILED    │ Failed    │  │
│  │ 10:32:01       │            │                 │ login for │  │
│  │                │            │                 │ evil@x.com│  │
│  └───────────────────────────────────────────────────────────┘  │
│  [Pagination]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 8: Personal Settings (`/dashboard/settings`)

### 8.1 Change Password
```
┌─────────────────────────────────────────────────────────────────┐
│                    CHANGE PASSWORD                               │
├─────────────────────────────────────────────────────────────────┤
│  Current Password: [____________________] * (required)          │
│  New Password:     [____________________] * (per policy)        │
│  Confirm Password: [____________________] *                     │
│  [Password Rules Checklist]                                     │
│                                                                 │
│  [Cancel]                    [Change Password]                  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ Server Action:         │
         │ changePassword         │
         │ (users.ts)             │
         └───────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      SUCCESS                 FAILURE
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Verify current   │   │ - Wrong current  │
│ password         │   │ - History reuse  │
│                  │   │ - Policy fail    │
│ Hash new         │   │                  │
│ Update user:     │   │ Return errors    │
│ - passwordHash   │   │ to form          │
│ - sessionVersion │   └──────────────────┘
│   +1 (logout all)│
│ - passwordChanged│
│   At = now()     │
│ - forcePwdChange │
│   = false        │
│ Record history   │
│ Log audit:       │
│ CHANGE_PASSWORD  │
│ DELETE SESSION   │
│ Redirect: /login │
│ Toast: Success   │
└──────────────────┘
```

### 8.2 Force Password Change (On Login — Expired/First Login)
```
User logs in with expired password or sessionVersion === 0
        │
        ▼
Redirect to /dashboard/settings?forceChange=1
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  FORCE PASSWORD CHANGE DIALOG (Modal - cannot dismiss)          │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  Password Change Required                                    │
│                                                                  │
│  Your password has expired (or this is your first login).       │
│  You must set a new password to continue.                       │
│                                                                  │
│  Current Password: [____________________] *                     │
│  New Password:     [____________________] *                     │
│  Confirm Password: [____________________] *                     │
│  [Password Rules Checklist]                                     │
│                                                                  │
│  [Change Password]  (no cancel - mandatory)                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Server Action: forceChangePassword (users.ts)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  - Verify current password                                       │
│  - Check history                                                 │
│  - Hash new password                                             │
│  - Update user:                                                  │
│     - passwordHash                                               │
│     - passwordChangedAt = now()                                  │
│     - forcePasswordChange = false                                │
│     - (NO sessionVersion increment - keeps session)              │
│  - Record history                                                │
│  - Log audit: CHANGE_PASSWORD (forced)                          │
│  - Revalidate /dashboard                                         │
│  - Close modal, stay on dashboard                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 9: Logout

```
User clicks Logout in user menu
        │
        ▼
Server Action: logout (auth.ts)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  - Get current session                                           │
│  - Log audit: LOGOUT (userId, IP, UA)                           │
│  - Delete session cookie                                         │
│  - Redirect to /login                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 10: Password Generator (Client-Side)

### 10.1 Generator Modal (from Credential Form)
```
User clicks 🎲 Generate button
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PASSWORD GENERATOR                            │
├─────────────────────────────────────────────────────────────────┤
│  Length: [16]  (8-64)                                           │
│  ☑ Uppercase (A-Z)                                              │
│  ☑ Lowercase (a-z)                                              │
│  ☑ Numbers (0-9)                                                │
│  ☑ Symbols (!@#$%^&*)                                           │
│  ☐ Exclude Similar (il1Lo0O)                                    │
│  ☐ Exclude Ambiguous ({ } [ ] ( ) / \ ' " ` ~ , ; : . < >)     │
│                                                                  │
│  Generated: [Xk9#mP2$vL5@nQ7!]  [Copy] [Regenerate]            │
│  Strength: ████████████ Very Strong (zxcvbn)                   │
│                                                                  │
│  [Use Password]                    [Cancel]                     │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Client-Side Generation
```typescript
// Uses crypto.getRandomValues() for CSPRNG
// Character sets selected based on checkboxes
// Fisher-Yates shuffle for randomness
// zxcvbn for strength estimation
```

---

## Flow Summary Matrix

| Flow | Entry Point | Auth Required | Roles | Key Server Actions |
|------|-------------|---------------|-------|-------------------|
| Login | `/login` | None | All | `login` |
| Forgot Password | `/forgot-password` | None | All | `requestPasswordReset` |
| Reset Password | `/reset-password?token=` | None | All | `resetPassword` |
| Vault List | `/dashboard/vault` | Session | All | — (RSC fetch) |
| Reveal Password | Vault 👁 button | Session + CSRF | EDITOR+ | `/api/credentials/reveal` |
| Create Credential | Vault + button | Session | EDITOR+ | `createCredential` |
| Edit Credential | Vault 📝 button | Session | EDITOR+ | `updateCredential` |
| Delete Credential | Vault 🗑 button | Session | EDITOR+ | `deleteCredential` |
| Export Credentials | Security page | Session | SUPER_ADMIN | `/api/credentials/export` |
| User List | `/dashboard/users` | Session | SUPER_ADMIN | — (RSC fetch) |
| Create User | Users + button | Session | SUPER_ADMIN | `createUser` |
| Edit User | Users 📝 button | Session | SUPER_ADMIN | `updateUser` |
| Delete User | Users 🗑 button | Session | SUPER_ADMIN | `deleteUser` |
| Security Settings | `/dashboard/security/settings` | Session | SUPER_ADMIN | `updateSecuritySettings` |
| Audit Log | `/dashboard/security` | Session | All | — (RSC fetch) |
| Change Password | `/dashboard/settings` | Session | All | `changePassword` |
| Force Change Password | Login redirect | Session | All | `forceChangePassword` |
| Logout | User menu | Session | All | `logout` |

---

## Error Handling Patterns

### Form Validation Errors
```
┌─────────────────────────────────────────────────────────────────┐
│  Field-level: Red border + error message below field            │
│  Form-level:   Toast/alert at top of form                       │
│  Server errors: Displayed above form (generic for security)     │
└─────────────────────────────────────────────────────────────────┘
```

### Rate Limit Errors
```
┌─────────────────────────────────────────────────────────────────┐
│  Login: "Please wait N seconds before trying again."            │
│  Reveal: "Too many reveal requests. Please wait a moment."      │
│  Both show resetAt timestamp                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Account Lock Errors
```
┌─────────────────────────────────────────────────────────────────┐
│  "Account is temporarily locked. Please try again after        │
│   X minutes and Y seconds."                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Session Expired
```
┌─────────────────────────────────────────────────────────────────┐
│  Any authenticated request → 401 → Redirect to /login          │
│  All server actions check session via verifySession()           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| **Keyboard Navigation** | All interactive elements focusable, logical tab order |
| **ARIA Labels** | Icon buttons have `aria-label` (Reveal, Copy, Generate) |
| **Live Regions** | Error toasts use `role="alert"` |
| **Focus Management** | Modals trap focus, restore on close |
| **Color Contrast** | Meets WCAG AA (text/background ratios) |
| **Reduced Motion** | Respects `prefers-reduced-motion` for animations |

---

*Document Version: 1.0*
*Last Updated: 2026-07-28*
*Generated from SecureVault source code analysis*