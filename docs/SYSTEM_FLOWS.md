# SecureVault — System Flow Documentation

## Overview

This document describes the internal system flows, data flows, and technical execution paths in the SecureVault Password Administration System. It covers server-side processing, database interactions, cryptographic operations, and cross-component communication.

---

## System Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST PROCESSING LAYERS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HTTP REQUEST (Next.js App Router)                                  │   │
│  └─────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  MIDDLEWARE / LAYOUT (auth check, session verification)            │   │
│  └─────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                       │
│                    ┌───────────────┼───────────────┐                       │
│                    ▼               ▼               ▼                       │
│           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│           │ Server Action│ │  API Route   │ │  Page (RSC)  │              │
│           │  (POST form) │ │  (REST/JSON) │ │  (fetch DB)  │              │
│           └──────┬───────┘ └──────┬───────┘ └──────┬───────┘              │
│                  │                │                │                       │
│                  ▼                ▼                ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SERVICE LAYER (lib/*)                             │   │
│  │  auth.ts  │  session.ts  │  crypto.ts  │  audit.ts  │  *-policy.ts  │   │
│  └─────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER (Prisma Client)                        │   │
│  │  db.user          db.credential     db.auditLog                      │   │
│  │  db.passwordHistory                  db.securitySettings             │   │
│  │  db.failedLoginAttempt               db.passwordResetToken           │   │
│  └─────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    POSTGRESQL DATABASE                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 1: Authentication & Session Management

### 1.1 Session Creation (`createSession` in `lib/session.ts`)

```
Input: userId, role, sessionVersion
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Validate SESSION_SECRET env var exists                      │
│     - Throws if missing                                         │
│     - Returns Uint8Array from TextEncoder                       │
│                                                                 │
│  2. Calculate expiry: now() + 24 hours                          │
│                                                                 │
│  3. Create JWT with jose.SignJWT:                               │
│     Payload: {                                                  │
│       userId: string,                                           │
│       role: Role,                                               │
│       sessionVersion: number,                                   │
│       expiresAt: ISOString                                      │
│     }                                                           │
│     Header: { alg: "HS256" }                                    │
│     setIssuedAt()                                               │
│     setExpirationTime(expiresAt)                                │
│     sign(secretKey)                                             │
│                                                                 │
│  4. Set HttpOnly cookie:                                        │
│     Name: "session"                                             │
│     Value: JWT token                                            │
│     Options:                                                    │
│       httpOnly: true          // No JS access                   │
│       secure: prod only       // HTTPS in production            │
│       sameSite: "lax"         // CSRF protection                │
│       expires: expiresAt      // 24h                            │
│       path: "/"               // All routes                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Output: void (cookie set on response)
```

### 1.2 Session Verification (`getSession` in `lib/session.ts`)

```
Input: none (reads from cookies)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Read "session" cookie from request                          │
│     - Returns null if not present                               │
│                                                                 │
│  2. jwtVerify(token, secretKey, { algorithms: ["HS256"] })     │
│     - Validates signature, expiry, algorithm                    │
│     - Returns { payload } or throws                             │
│                                                                 │
│  3. Extract payload fields:                                     │
│     - userId (string)                                           │
│     - role (Role)                                               │
│     - sessionVersion (number | undefined) → default 0           │
│     - expiresAt (ISOString)                                     │
│                                                                 │
│  4. CRITICAL: Verify sessionVersion against database            │
│     const user = await db.user.findUnique({                     │
│       where: { id: userId },                                    │
│       select: { sessionVersion: true }                          │
│     })                                                          │
│     if (!user || user.sessionVersion !== sessionVersion) {     │
│       return null  // Session invalidated (password changed)   │
│     }                                                           │
│                                                                 │
│  5. Return SessionPayload:                                      │
│     { userId, role, sessionVersion, expiresAt: Date }          │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Output: SessionPayload | null
```

### 1.3 Session Invalidation (Password Change)

```
Trigger: User changes password (changePassword, forceChangePassword, resetPassword)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  db.user.update({                                               │
│    where: { id: userId },                                       │
│    data: {                                                      │
│      passwordHash: newHash,                                     │
│      passwordChangedAt: now(),                                  │
│      sessionVersion: { increment: 1 },  // ATOMIC INCREMENT    │
│      forcePasswordChange: false                                 │
│    }                                                            │
│  })                                                             │
│                                                                 │
│  Effect: All existing JWTs now have stale sessionVersion       │
│          Next getSession() → null → redirect to /login         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 2: Credential Encryption/Decryption

### 2.1 Encryption (`encrypt` in `lib/crypto.ts`)

```
Input: plaintext password (string)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Get encryption key:                                         │
│     - Read ENCRYPTION_KEY from env                              │
│     - Validate: 64 hex chars (32 bytes)                         │
│     - Buffer.from(key, "hex") → 32-byte Buffer                 │
│                                                                 │
│  2. Generate IV: crypto.randomBytes(12) → 12-byte Buffer       │
│     - GCM standard: 96-bit IV                                   │
│     - Unique per encryption                                     │
│                                                                 │
│  3. Create cipher:                                              │
│     crypto.createCipheriv("aes-256-gcm", key, iv)              │
│                                                                 │
│  4. Encrypt:                                                    │
│     let encrypted = cipher.update(plaintext, "utf8", "hex")    │
│     encrypted += cipher.final("hex")                            │
│                                                                 │
│  5. Get auth tag:                                               │
│     cipher.getAuthTag().toString("hex")  // 16 bytes = 32 hex  │
│                                                                 │
│  6. Return object:                                              │
│     {                                                           │
│       encryptedData: encrypted,   // hex string                 │
│       iv: iv.toString("hex"),       // 24 hex chars             │
│       authTag: authTag              // 32 hex chars             │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Output: { encryptedData, iv, authTag } → stored in Credential row
```

### 2.2 Decryption (`decrypt` in `lib/crypto.ts`)

```
Input: encryptedData (hex), ivHex (hex), authTagHex (hex)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Get encryption key (same as encrypt)                        │
│                                                                 │
│  2. Parse inputs:                                               │
│     iv = Buffer.from(ivHex, "hex")        // 12 bytes           │
│     authTag = Buffer.from(authTagHex, "hex") // 16 bytes        │
│                                                                 │
│  3. Create decipher:                                            │
│     crypto.createDecipheriv("aes-256-gcm", key, iv)            │
│                                                                 │
│  4. Set auth tag (CRITICAL - validates integrity):             │
│     decipher.setAuthTag(authTag)                                │
│     - Throws if tag doesn't match (tampering detected)         │
│                                                                 │
│  5. Decrypt:                                                    │
│     let decrypted = decipher.update(encryptedData, "hex", "utf8")│
│     decrypted += decipher.final("utf8")                         │
│                                                                 │
│  6. Return plaintext string                                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Output: plaintext password (string)
```

### 2.3 Credential Storage Flow (Create/Update)

```
┌─────────────────────────────────────────────────────────────────┐
│  CREATE CREDENTIAL                                              │
├─────────────────────────────────────────────────────────────────┤
│  Input: title, username, password, url, notes, category        │
│         │                                                       │
│         ▼                                                       │
│  encrypt(password) → { encryptedData, iv, authTag }            │
│         │                                                       │
│         ▼                                                       │
│  db.credential.create({                                         │
│    data: {                                                      │
│      title, username,                                           │
│      encryptedPassword: encryptedData,                          │
│      iv, authTag,                                               │
│      url, notes, category,                                      │
│      createdBy: session.userId                                  │
│    }                                                            │
│  })                                                             │
│         │                                                       │
│         ▼                                                       │
│  logAudit(CREATE_CREDENTIAL, credentialId, title)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  UPDATE CREDENTIAL (password optional)                          │
├─────────────────────────────────────────────────────────────────┤
│  If password provided:                                          │
│    encrypt(password) → new { encryptedData, iv, authTag }      │
│    Update all three fields                                      │
│  Else:                                                          │
│    Keep existing encryptedPassword, iv, authTag                 │
│  logAudit(UPDATE_CREDENTIAL)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 3: Password Hashing & Verification

### 3.1 Hash Password (`hashPassword` in `lib/auth.ts`)

```
Input: plaintext password
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  bcrypt.hash(password, 12)                                      │
│                                                                 │
│  Cost factor 12 = 2^12 = 4096 rounds                           │
│  - Generates unique salt per call                               │
│  - Embeds salt + cost + hash in result: $2b$12$...             │
│  - ~200ms on modern CPU                                         │
│                                                                 │
│  Returns: hash string (60 chars)                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Verify Password (`verifyPassword` in `lib/auth.ts`)

```
Input: plaintext password, stored hash
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  bcrypt.compare(password, hash)                                 │
│                                                                 │
│  - Constant-time comparison (prevents timing attacks)          │
│  - Extracts salt and cost from hash                             │
│  - Re-computes hash with same parameters                        │
│  - Returns boolean                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Login Processing (`login` action in `app/actions/auth.ts`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOGIN SERVER ACTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input: FormData { email, password }                                        │
│                                                                              │
│  1. RATE LIMIT CHECK                                                        │
│     checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT)                        │
│     - 5 attempts / 15 min sliding window                                    │
│     - In-memory Map (per-instance)                                          │
│     - If exceeded: return 429 with resetAt                                 │
│                                                                              │
│  2. VALIDATE INPUT (Zod loginSchema)                                        │
│     - email: required, valid email, lowercase                               │
│     - password: required                                                    │
│                                                                              │
│  3. FIND USER                                                               │
│     db.user.findUnique({                                                    │
│       where: { email },                                                     │
│       select: { id, email, passwordHash, role, name,                       │
│                 sessionVersion, lockedUntil }                               │
│     })                                                                      │
│     - No user found → generic error, still record attempt                  │
│                                                                              │
│  4. CHECK ACCOUNT LOCK                                                      │
│     checkAccountLock(user.id)                                               │
│     - Reads user.lockedUntil                                                │
│     - If locked & not expired: return lock message                         │
│     - If expired: clear lock, continue                                      │
│                                                                              │
│  5. VERIFY PASSWORD                                                         │
│     verifyPassword(password, user.passwordHash)                             │
│     - bcrypt.compare (constant-time)                                        │
│                                                                              │
│  6. ON FAILURE:                                                             │
│     recordFailedAttempt(email, userId, ip, userAgent)                      │
│       - Creates FailedLoginAttempt row                                      │
│       - Counts attempts in last 15 min                                      │
│       - Returns { attemptCount, delayMs }                                   │
│     logAudit(LOGIN_FAILED, attemptCount)                                    │
│                                                                              │
│     IF attemptCount >= maxFailedAttempts (default 5):                      │
│       lockAccount(user.id, lockDuration)  // default 15 min                │
│       Sets user.lockedUntil = now() + 15 min                               │
│       Returns lock message                                                  │
│     ELSE IF delayMs > 0:                                                    │
│       Returns progressive delay message                                     │
│     ELSE:                                                                   │
│       Returns generic "Invalid email or password"                          │
│                                                                              │
│  7. ON SUCCESS:                                                             │
│     clearFailedAttempts(email)  // Delete all FailedLoginAttempt rows      │
│                                                                              │
│     CHECK PASSWORD EXPIRY:                                                  │
│     forcePasswordChange = (expirationDays > 0 && sessionVersion === 0)    │
│                                                                              │
│     createSession(user.id, user.role, user.sessionVersion)                 │
│       - Sets JWT cookie                                                     │
│                                                                              │
│     logAudit(LOGIN)                                                         │
│                                                                              │
│     IF forcePasswordChange:                                                 │
│       redirect("/dashboard/settings?forceChange=1")                        │
│     ELSE:                                                                   │
│       redirect("/dashboard")                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 5: Password Reset System

### 5.1 Token Generation (`generateResetToken` in `lib/password-reset.ts`)

```
Input: userId
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Generate raw token: crypto.randomBytes(32).toString("hex") │
│     - 256 bits entropy, 64 hex chars                           │
│                                                                 │
│  2. Hash for storage: bcrypt.hash(rawToken, 10)                │
│     - Cost 10 (faster than password hash, still secure)        │
│     - Only hash stored in DB                                   │
│                                                                 │
│  3. Invalidate old tokens:                                     │
│     db.passwordResetToken.updateMany({                          │
│       where: { userId, usedAt: null },                          │
│       data: { usedAt: now() }  // Soft delete                  │
│     })                                                          │
│                                                                 │
│  4. Create new token:                                           │
│     db.passwordResetToken.create({                              │
│       data: {                                                   │
│         userId,                                                 │
│         token: hashedToken,                                     │
│         expiresAt: now() + 15 minutes                          │
│       }                                                         │
│     })                                                          │
│                                                                 │
│  5. Return rawToken (ONLY TIME PLAINTEXT EXISTS)               │
│     - In production: send via email                            │
│     - In dev: returned in response for testing                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Token Validation (`validateResetToken`)

```
Input: rawToken (from URL)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Find recent unused tokens:                                  │
│     db.passwordResetToken.findMany({                            │
│       where: { usedAt: null, expiresAt: { gte: now() } },       │
│       orderBy: { createdAt: "desc" },                           │
│       take: 50,  // Limit scan                                  │
│       select: { id, token, userId }                             │
│     })                                                          │
│                                                                 │
│  2. Compare against each (bcrypt.compare):                      │
│     for (entry of recentTokens) {                               │
│       if (await bcrypt.compare(rawToken, entry.token)) {        │
│         return { valid: true, userId: entry.userId }            │
│       }                                                         │
│     }                                                           │
│                                                                 │
│  3. Return { valid: false }                                     │
│                                                                 │
│  Note: Can't index by token (bcrypt is one-way)                │
│        Linear scan of recent tokens (max 50) is acceptable     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Complete Reset (`resetPassword` action)

```
Input: token, newPassword, confirmPassword
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Validate token → { valid, userId }                         │
│     Invalid → "Invalid or expired reset token"                 │
│                                                                 │
│  2. Passwords match?                                            │
│     No → "Passwords do not match"                              │
│                                                                 │
│  3. Get SecuritySettings                                        │
│                                                                 │
│  4. Check password history:                                     │
│     isPasswordReused(userId, newPassword, settings)            │
│     - Fetches last N hashes from password_history              │
│     - bcrypt.compare(newPassword, storedHash)                  │
│     - Reused → "Cannot reuse last N passwords"                 │
│                                                                 │
│  5. Hash new password: hashPassword(newPassword)               │
│                                                                 │
│  6. Atomic user update:                                         │
│     db.user.update({                                            │
│       where: { id: userId },                                    │
│       data: {                                                   │
│         passwordHash: newHash,                                  │
│         passwordChangedAt: now(),                               │
│         sessionVersion: { increment: 1 },  // Invalidate sess  │
│         forcePasswordChange: false                              │
│       }                                                         │
│     })                                                          │
│                                                                 │
│  7. Record in history: recordPasswordHistory()                 │
│                                                                 │
│  8. Mark token used: markResetTokenUsed(token)                 │
│     - Finds matching token, sets usedAt = now()                │
│                                                                 │
│  9. logAudit(PASSWORD_RESET_COMPLETE)                          │
│                                                                 │
│  10. Return success                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 6: Progressive Delay & Account Lockout

### 6.1 Delay Tiers (`getProgressiveDelay` in `lib/progressive-delay.ts`)

```
┌─────────────────────────────────────────────────────────────────┐
│  DELAY_TIERS = [                                                │
│    { maxAttempts: 4,     delayMs: 0 },         // 1-4: no delay │
│    { maxAttempts: 9,     delayMs: 5_000 },     // 5-9: 5 sec   │
│    { maxAttempts: 14,    delayMs: 30_000 },    // 10-14: 30 sec │
│    { maxAttempts: ∞,     delayMs: 300_000 }    // 15+: 5 min   │
│  ]                                                              │
│                                                                 │
│  getProgressiveDelay(attemptCount):                             │
│    Returns delayMs for first tier where attemptCount <= max    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Failed Attempt Recording (`recordFailedAttempt`)

```
Input: email, userId (nullable), ipAddress, userAgent
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Create FailedLoginAttempt row:                              │
│     db.failedLoginAttempt.create({ email, userId, ip, ua })    │
│                                                                 │
│  2. Count recent attempts (15 min window):                      │
│     const since = now() - 15*60*1000                            │
│     count = db.failedLoginAttempt.count({                       │
│       where: { email, attemptedAt: { gte: since } }            │
│     })                                                          │
│                                                                 │
│  3. Get delay: getProgressiveDelay(count)                       │
│                                                                 │
│  4. Return { attemptCount: count, delayMs }                    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Account Lock (`lockAccount` / `checkAccountLock`)

```
lockAccount(userId, durationMinutes):
  lockedUntil = now() + durationMinutes * 60 * 1000
  db.user.update({ where: { id }, data: { lockedUntil } })
  Returns lockedUntil Date

checkAccountLock(userId):
  user = db.user.findUnique({ where: { id }, select: { lockedUntil } })
  
  if (!lockedUntil) → { locked: false }
  if (now() < lockedUntil) → { locked: true, lockedUntil }
  if (now() >= lockedUntil) → 
    db.user.update({ where: { id }, data: { lockedUntil: null } })
    → { locked: false }
```

---

## Flow 7: Password History & Reuse Prevention

### 7.1 Check Reuse (`isPasswordReused` in `lib/password-history.ts`)

```
Input: userId, newPassword (plaintext), settings
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  if (settings.passwordHistory <= 0) return { reused: false }   │
│                                                                 │
│  history = db.passwordHistory.findMany({                        │
│    where: { userId },                                           │
│    orderBy: { createdAt: "desc" },                              │
│    take: settings.passwordHistory,                              │
│    select: { passwordHash: true }                               │
│  })                                                             │
│                                                                 │
│  for (entry of history) {                                       │
│    if (await bcrypt.compare(newPassword, entry.passwordHash)) { │
│      return { reused: true, message: "Cannot reuse last N..." } │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  return { reused: false }                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Record History (`recordPasswordHistory`)

```
Input: userId, passwordHash (bcrypt), settings
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Create new history entry:                                   │
│     db.passwordHistory.create({ userId, passwordHash })        │
│                                                                 │
│  2. Prune old entries (keep only last N):                       │
│     if (settings.passwordHistory > 0) {                         │
│       excess = db.passwordHistory.findMany({                    │
│         where: { userId },                                      │
│         orderBy: { createdAt: "desc" },                         │
│         skip: settings.passwordHistory,                         │
│         select: { id: true }                                    │
│       })                                                        │
│       if (excess.length > 0) {                                  │
│         db.passwordHistory.deleteMany({                         │
│           where: { id: { in: excess.map(e => e.id) } }         │
│         })                                                      │
│       }                                                         │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 8: Audit Logging (`logAudit` in `lib/audit.ts`)

```
Input: { userId, action, targetId?, details?, ipAddress?, userAgent? }
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  try {                                                          │
│    await db.auditLog.create({                                   │
│      data: {                                                    │
│        userId,          // nullable (failed login = null)       │
│        action,          // AuditAction enum                     │
│        targetId,        // nullable (credential/user id)        │
│        details,         // nullable description                 │
│        ipAddress,       // nullable                             │
│        userAgent,       // nullable                             │
│        // timestamp: auto now()                                 │
│      }                                                          │
│    })                                                           │
│  } catch (error) {                                              │
│    console.error("[AUDIT ERROR]", error)  // NEVER THROWS       │
│    // Silent failure - app continues                            │
│  }                                                              │
│                                                                 │
│  Design: Append-only, no UPDATE/DELETE exposed                 │
│  Indexes: userId, action, timestamp for queries                │
└─────────────────────────────────────────────────────────────────┘
```

### Audit Actions Triggered

| Action | Trigger Location |
|--------|-----------------|
| `LOGIN` | `auth.ts` login success |
| `LOGOUT` | `auth.ts` logout |
| `LOGIN_FAILED` | `auth.ts` login failure |
| `VIEW_PASSWORD` | `/api/credentials/reveal` |
| `CREATE_CREDENTIAL` | `credentials.ts` create |
| `UPDATE_CREDENTIAL` | `credentials.ts` update |
| `DELETE_CREDENTIAL` | `credentials.ts` delete |
| `CREATE_USER` | `users.ts` createUser |
| `UPDATE_USER` | `users.ts` updateUser + security settings |
| `DELETE_USER` | `users.ts` deleteUser |
| `CHANGE_PASSWORD` | `users.ts` changePassword/forceChange |
| `EXPORT_CREDENTIALS` | `/api/credentials/export` |
| `PASSWORD_RESET_REQUEST` | `password-reset.ts` request |
| `PASSWORD_RESET_COMPLETE` | `password-reset.ts` complete |

---

## Flow 9: Credential Reveal API (`/api/credentials/reveal`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      POST /api/credentials/reveal                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. AUTHENTICATION                                                          │
│     session = await getSession()                                            │
│     if (!session) → 401 Unauthorized                                        │
│                                                                              │
│  2. CSRF PROTECTION                                                         │
│     origin = headers.get("origin") || headers.get("referer")               │
│     host = headers.get("host")                                              │
│     if (origin && new URL(origin).host !== host) → 403 Forbidden           │
│                                                                              │
│  3. RATE LIMIT                                                              │
│     checkRateLimit(`reveal:${session.userId}`, REVEAL_RATE_LIMIT)          │
│     - 20 requests / 1 minute                                                │
│     - If exceeded → 429 with resetAt                                        │
│                                                                              │
│  4. VALIDATE REQUEST                                                        │
│     body = await request.json()                                             │
│     revealCredentialSchema.parse(body)  // { credentialId: uuid }          │
│                                                                              │
│  5. FETCH CREDENTIAL                                                        │
│     credential = db.credential.findUnique({                                 │
│       where: { id: credentialId },                                          │
│       select: { id, title, encryptedPassword, iv, authTag }                │
│     })                                                                      │
│     if (!credential) → 404 Not Found                                        │
│                                                                              │
│  6. DECRYPT                                                                 │
│     try {                                                                   │
│       plaintext = decrypt(encryptedPassword, iv, authTag)                  │
│     } catch { → 500 "Failed to decrypt" }                                   │
│                                                                              │
│  7. AUDIT LOG                                                               │
│     logAudit({                                                              │
│       userId: session.userId,                                               │
│       action: "VIEW_PASSWORD",                                              │
│       targetId: credential.id,                                              │
│       details: `Revealed password for: ${credential.title}`,               │
│       ipAddress, userAgent                                                  │
│     })                                                                      │
│                                                                              │
│  8. RESPONSE                                                                │
│     return Response.json({ password: plaintext })                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 10: Security Settings Management

### 10.1 Settings Retrieval (`getSecuritySettings` in `lib/security-settings.ts`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Cached singleton pattern:                                      │
│                                                                 │
│  let cachedSettings = null                                      │
│                                                                 │
│  getSecuritySettings():                                         │
│    if (cachedSettings) return cachedSettings                    │
│                                                                 │
│    row = db.securitySettings.findFirst()                        │
│                                                                 │
│    if (!row):                                                   │
│      row = db.securitySettings.create({ data: DEFAULT_SETTINGS })│
│                                                                 │
│    cachedSettings = row                                         │
│    return row                                                   │
│                                                                 │
│  clearSettingsCache(): cachedSettings = null                   │
│    // Called after updateSecuritySettings                       │
│                                                                 │
│  DEFAULT_SETTINGS = {                                           │
│    minimumPasswordLength: 12,                                   │
│    passwordHistory: 5,                                          │
│    lockDuration: 15,                                            │
│    expirationDays: 90,                                          │
│    mfaRequired: false,                                          │
│    maxFailedAttempts: 5,                                        │
│    requireSpecialChar: true,                                    │
│    requireUppercase: true,                                      │
│    requireNumber: true,                                         │
│    requireLowercase: true                                       │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Dynamic Validation (`validatePasswordAgainstPolicy`)

```
Input: password, settings
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  errors = []                                                    │
│                                                                 │
│  if (password.length < settings.minimumPasswordLength)         │
│    errors.push(`Min ${settings.minimumPasswordLength} chars`)  │
│                                                                 │
│  if (settings.requireUppercase && !/[A-Z]/.test(password))     │
│    errors.push("Uppercase required")                           │
│                                                                 │
│  if (settings.requireLowercase && !/[a-z]/.test(password))     │
│    errors.push("Lowercase required")                           │
│                                                                 │
│  if (settings.requireNumber && !/[0-9]/.test(password))        │
│    errors.push("Number required")                              │
│                                                                 │
│  if (settings.requireSpecialChar && !/[^a-zA-Z0-9]/.test(pwd)) │
│    errors.push("Special char required")                        │
│                                                                 │
│  return { valid: errors.length === 0, errors }                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 11: Database Transaction Patterns

### 11.1 User Creation (Atomic)

```typescript
// createUser action
const passwordHash = await hashPassword(password);

const user = await db.user.create({
  data: { name, email, passwordHash, role, passwordChangedAt: now() }
});

// Record initial password in history
await recordPasswordHistory(user.id, passwordHash, settings);

// Audit log
await logAudit({ action: "CREATE_USER", ... });
```

### 11.2 Password Change (Atomic Session Invalidation)

```typescript
// changePassword action
const newHash = await hashPassword(newPassword);

await db.user.update({
  where: { id: session.userId },
  data: {
    passwordHash: newHash,
    sessionVersion: { increment: 1 },  // Atomic increment
    passwordChangedAt: now(),
    forcePasswordChange: false,
  }
});

await recordPasswordHistory(session.userId, newHash, settings);
await logAudit({ action: "CHANGE_PASSWORD", ... });
await deleteSession();  // Force re-login
```

### 11.3 Credential Export (Read-Only)

```typescript
// /api/credentials/export GET
const credentials = await db.credential.findMany({
  orderBy: { updatedAt: "desc" }
  // Returns encryptedPassword, iv, authTag (NOT decrypted)
});

await logAudit({ action: "EXPORT_CREDENTIALS", ... });

return Response.json(credentials);  // Encrypted backup
```

---

## Flow 12: Rate Limiting Implementation

### 12.1 In-Memory Store (`lib/rate-limit.ts`)

```
┌─────────────────────────────────────────────────────────────────┐
│  const store = new Map<string, RateLimitEntry>()               │
│                                                                 │
│  RateLimitEntry = { timestamps: number[] }  // Unix ms         │
│                                                                 │
│  // Periodic cleanup every 5 minutes                           │
│  setInterval(() => {                                            │
│    const now = Date.now()                                       │
│    for (const [key, entry] of store.entries()) {               │
│      entry.timestamps = entry.timestamps.filter(               │
│        t => now - t < 900_000  // 15 min window                │
│      )                                                          │
│      if (entry.timestamps.length === 0) store.delete(key)      │
│    }                                                            │
│  }, 5 * 60 * 1000)                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Check Function

```
checkRateLimit(identifier, { maxAttempts, windowMs }):
  now = Date.now()
  entry = store.get(identifier) || { timestamps: [] }
  
  // Sliding window: remove old timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)
  
  if (entry.timestamps.length >= maxAttempts):
    oldest = entry.timestamps[0]
    return { success: false, remaining: 0, resetAt: oldest + windowMs }
  
  entry.timestamps.push(now)
  store.set(identifier, entry)
  
  return { 
    success: true, 
    remaining: maxAttempts - entry.timestamps.length,
    resetAt: now + windowMs 
  }
```

---

## Flow 13: Client-Side Password Generator

```
┌─────────────────────────────────────────────────────────────────┐
│  PasswordGenerator Component (client-side only)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Config:                                                        │
│    length: 8-64                                                 │
│    uppercase: boolean                                           │
│    lowercase: boolean                                           │
│    numbers: boolean                                             │
│    symbols: boolean                                             │
│    excludeSimilar: boolean                                      │
│    excludeAmbiguous: boolean                                    │
│                                                                 │
│  Generation:                                                    │
│    1. Build charset from config                                 │
│    2. crypto.getRandomValues(Uint32Array) for CSPRNG           │
│    3. Map random bytes to charset indices                       │
│    4. Fisher-Yates shuffle result                               │
│    5. Return password string                                    │
│                                                                 │
│  Strength: zxcvbn estimation (entropy, crack time)             │
│                                                                 │
│  No server interaction - fully client-side                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 14: Frontend Data Fetching (Server Components)

### 14.1 Vault Page (`app/dashboard/vault/page.tsx`)

```
┌─────────────────────────────────────────────────────────────────┐
│  export default async function VaultPage() {                   │
│    const session = await verifySession()  // Redirects if none │
│                                                                 │
│    // Parallel data fetch                                      │
│    const [credentials, categories] = await Promise.all([       │
│      db.credential.findMany({                                   │
│        orderBy: { updatedAt: "desc" },                          │
│        select: { id, title, username, url, notes,              │
│                  category, updatedAt }  // NO encrypted fields │
│      }),                                                        │
│      db.credential.groupBy({                                    │
│        by: ["category"],                                        │
│        where: { category: { not: null } }                      │
│      })                                                         │
│    ])                                                           │
│                                                                 │
│    return <VaultClient                                         │
│      initialCredentials={credentials}                          │
│      categories={categories.map(c => c.category).filter(Boolean)}│
│      userRole={session.role}                                   │
│    />                                                           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 14.2 Security Page (Audit Log)

```
┌─────────────────────────────────────────────────────────────────┐
│  Audit log with pagination:                                     │
│                                                                 │
│  const [logs, total] = await Promise.all([                     │
│    db.auditLog.findMany({                                       │
│      take: 50,                                                  │
│      skip: (page - 1) * 50,                                     │
│      orderBy: { timestamp: "desc" },                            │
│      include: { user: { select: { email: true } } }            │
│    }),                                                          │
│    db.auditLog.count()                                          │
│  ])                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIRECTIONS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER INPUT → VALIDATION (Zod) → SERVER ACTION → SERVICE (lib/*)           │
│       │                                                                     │
│       ▼                                                                     │
│  DATABASE (Prisma) ← AUDIT LOG (append-only)                               │
│       │                                                                     │
│       ▼                                                                     │
│  RESPONSE → REVALIDATE PATHS → UI UPDATE                                    │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────     │
│                                                                              │
│  SENSITIVE DATA FLOWS:                                                      │
│                                                                              │
│  1. PASSWORD (user)                                                         │
│     plaintext → bcrypt.hash() → hash → DB (passwordHash)                   │
│     plaintext → bcrypt.compare() → boolean                                 │
│                                                                              │
│  2. CREDENTIAL PASSWORD                                                     │
│     plaintext → AES-256-GCM.encrypt() → {enc, iv, tag} → DB               │
│     {enc, iv, tag} → AES-256-GCM.decrypt() → plaintext → Client (10s)     │
│                                                                              │
│  3. RESET TOKEN                                                             │
│     randomBytes(32) → rawToken → bcrypt.hash() → hash → DB                │
│     rawToken (email) → User → URL → bcrypt.compare() → valid              │
│                                                                              │
│  4. SESSION                                                                 │
│     {userId, role, version} → JWT.sign() → cookie → Client                 │
│     cookie → JWT.verify() → payload → DB check version → SessionPayload   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Propagation Patterns

| Layer | Error Handling |
|-------|----------------|
| **Validation (Zod)** | Returns `{ errors: fieldErrors }` to form |
| **Server Action** | Returns `{ message, errors, success }` state object |
| **API Route** | Returns `Response.json({ error }, { status })` |
| **Database (Prisma)** | Throws `PrismaClientKnownRequestError` (caught in action) |
| **Crypto** | `decrypt` throws on auth tag mismatch → 500 |
| **Audit** | Try/catch + console.error, never throws |
| **Session** | `verifySession` returns null → redirect to login |
| **Rate Limit** | Returns `{ success: false, resetAt }` → 429 |

---

## Concurrency & Race Conditions

| Scenario | Protection |
|----------|------------|
| **Concurrent login attempts** | DB row-level lock on User (implicit in update) |
| **Password change + active sessions** | Atomic `sessionVersion` increment |
| **Reset token reuse** | `usedAt` timestamp + bcrypt comparison |
| **Credential reveal race** | Read-only decrypt, no DB write |
| **Settings update + active requests** | Cache invalidation (`clearSettingsCache()`) |
| **Failed attempt counting** | Separate table, append-only |

---

*Document Version: 1.0*
*Last Updated: 2026-07-28*
*Generated from SecureVault source code analysis*