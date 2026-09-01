# Graph Report - administration-system-for-managing-passwords  (2026-08-25)

## Corpus Check
- 85 files · ~55,200 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 628 nodes · 1212 edges · 55 communities (28 shown, 27 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 84 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91e313bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- users.ts
- cn
- validations.ts
- devDependencies
- biome.json
- User Model
- compilerOptions
- components.json
- SecureVault Password Administration System
- actions/auth.ts
- reveal/route.ts
- AES-256-GCM Credential Encryption
- Advanced Password Security Implementation Plan
- Append-Only Tamper-Evident Audit Logging
- Login Server Action Flow
- Threat Model & Mitigations Matrix
- @base-ui/react
- bcrypt Password Hashing (Cost Factor 12)
- Feature: Security Settings Configuration
- next-intl
- dropdown-menu.tsx
- Role-Based Access Control (SUPER_ADMIN / EDITOR / VIEWER)
- proxy.ts
- Globe Icon (SVG)
- Window Icon (Browser Window SVG with Control Dots)
- Vercel Logo (White Triangle SVG)
- class-variance-authority
- dependencies
- dotenv
- @fontsource/geist-mono
- @fontsource/geist-sans
- @fontsource/inter
- @hookform/resolvers
- bcrypt
- lucide-react
- next
- pg
- prisma
- @prisma/client
- react
- react-dom
- react-hook-form
- server-only
- shadcn
- tailwind-merge
- tw-animate-css
- zod
- zxcvbn
- postcss.config.mjs
- Generic Document Representation
- Next.js Logo SVG
- @prisma/adapter-pg

## God Nodes (most connected - your core abstractions)
1. `cn()` - 47 edges
2. `SecureVault Password Administration System` - 33 edges
3. `logAudit()` - 23 edges
4. `requireRole()` - 22 edges
5. `getSecuritySettings()` - 22 edges
6. `db` - 21 edges
7. `compilerOptions` - 16 edges
8. `intlLocaleFor()` - 14 edges
9. `verifySession()` - 14 edges
10. `login()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Defense-in-Depth Strength Assessment` --semantically_similar_to--> `Threat Model & Mitigations Matrix`  [INFERRED] [semantically similar]
  docs/project_security_and_architecture_report.md → README.md
- `Feature: Failed Login Tracking & Progressive Delay` --semantically_similar_to--> `Failed Login Tracking & Progressive Delay`  [INFERRED] [semantically similar]
  docs/SECURITY_FEATURES.md → README.md
- `Planned Security Schema Models (SecuritySettings, PasswordHistory, FailedLoginAttempt, PasswordResetToken)` --semantically_similar_to--> `SecuritySettings Model (Singleton)`  [INFERRED] [semantically similar]
  .opencode/plans/advanced-password-security.md → docs/PROJECT_DOCUMENTATION.md
- `Bitwarden / Vaultwarden (Client-Side Decryption Paradigm)` --semantically_similar_to--> `SecureVault Password Administration System`  [INFERRED] [semantically similar]
  docs/project_documentation_report.md → README.md
- `HashiCorp Vault (Enterprise API Paradigm)` --semantically_similar_to--> `SecureVault Password Administration System`  [INFERRED] [semantically similar]
  docs/project_documentation_report.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Credential Encryption & On-Demand Reveal Path** — docs_project_documentation_encrypt, docs_project_documentation_decrypt, docs_project_documentation_credential_model, docs_system_flows_reveal_api_flow, docs_project_documentation_csrf_origin_check, docs_developer_cryptography_guide_gcm_aead, docs_project_documentation_report_plaintext_lifespan [EXTRACTED 1.00]
- **Ten Advanced Security Features** — docs_security_features_configurable_policy, docs_security_features_password_history, docs_security_features_progressive_delay, docs_security_features_password_expiration, docs_security_features_force_dialog, docs_security_features_reset_tokens, docs_security_features_settings_config, docs_security_features_security_dashboard, docs_security_features_age_display, docs_security_features_admin_force_change [EXTRACTED 1.00]
- **Brute-Force Defense Pipeline (Rate Limit, Progressive Delay, Lockout)** — docs_project_documentation_rate_limiting, docs_system_flows_rate_limit_impl, docs_system_flows_progressive_delay_flow, docs_project_documentation_record_failed_attempt, docs_project_documentation_failed_login_attempt_model, docs_system_flows_login_flow [INFERRED 0.85]

## Communities (55 total, 27 thin omitted)

### Community 0 - "users.ts"
Cohesion: 0.07
Nodes (61): logout(), PasswordResetState, requestPasswordReset(), resetPassword(), createUpdateSchema(), updateSecuritySettings(), changePassword(), createUser() (+53 more)

### Community 1 - "cn"
Cohesion: 0.09
Nodes (45): SecuritySettingsState, actionColors, dynamic, RevealPassword(), RevealPasswordProps, CredentialItem, VaultClientProps, SecuritySettingsClientProps (+37 more)

### Community 2 - "validations.ts"
Cohesion: 0.06
Nodes (44): createCredential(), CredentialState, deleteCredential(), getClientInfo(), updateCredential(), ResetPasswordForm(), CredentialForm(), CredentialFormProps (+36 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): babel-plugin-react-compiler, @biomejs/biome, devDependencies, babel-plugin-react-compiler, @biomejs/biome, tailwindcss, @tailwindcss/postcss, tsx (+31 more)

### Community 4 - "biome.json"
Cohesion: 0.06
Nodes (32): source, assist, actions, next, react, files, ignoreUnknown, includes (+24 more)

### Community 5 - "User Model"
Cohesion: 0.15
Nodes (20): Planned Security Schema Models (SecuritySettings, PasswordHistory, FailedLoginAttempt, PasswordResetToken), Troubleshooting: UUID Argument Order in recordFailedAttempt, completePasswordReset(), FailedLoginAttempt Model, generateResetToken(), hashPassword(), isPasswordReused(), PasswordHistory Model (+12 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, **/*.ts (+20 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "SecureVault Password Administration System"
Cohesion: 0.09
Nodes (29): Next.js Breaking Changes Agent Notice, CLAUDE.md Agent Rules Pointer (@AGENTS.md), pgdata Persistent Volume, PostgreSQL 16 Docker Service (password_vault_db), Developer Cryptography & Security Guide, Hybrid JWT Revocation via sessionVersion DB Sync, SecureVault Developer Guide, Server Action Convention ((prevState, formData) + useActionState) (+21 more)

### Community 9 - "actions/auth.ts"
Cohesion: 0.18
Nodes (17): AuthState, login(), LoginForm(), dynamic, LoginPage(), Home(), checkAccountLock(), clearFailedAttempts() (+9 more)

### Community 10 - "reveal/route.ts"
Cohesion: 0.15
Nodes (15): adapter, main(), pool, prisma, POST(), decrypt(), getEncryptionKey(), checkRateLimit() (+7 more)

### Community 11 - "AES-256-GCM Credential Encryption"
Cohesion: 0.18
Nodes (15): Why GCM/AEAD over CBC (Integrity + Authenticity), IV/Nonce Reuse Vulnerability Warning, Cryptographic Verification Plan (Salt Uniqueness + Tamper Test), Credential Model, CSRF Origin/Referer Verification (Reveal Endpoint), decrypt() - GCM Decryption with Auth Tag Verification, encrypt() - AES-256-GCM Encryption Function, Cryptographic Key Separation Architecture (+7 more)

### Community 12 - "Advanced Password Security Implementation Plan"
Cohesion: 0.20
Nodes (11): Advanced Password Security Implementation Plan, Design Decision: Dialog Overlay Instead of Layout Redirect, Feature: Admin Force Password Change, Feature: Password Age Display, Feature: Forced Password Change Dialog, Feature: Password Expiration, Force Password Change Dialog User Flow, User Management Flow (/dashboard/users, SUPER_ADMIN) (+3 more)

### Community 13 - "Append-Only Tamper-Evident Audit Logging"
Cohesion: 0.18
Nodes (11): Audit Logging Helper (logAudit) Convention, Append-Only Tamper-Evident Audit Logging, Known Limitations & Future Improvements (Redis, MFA, Key Rotation), Sliding Window Rate Limiting (In-Memory Map), DB-Enforced Audit Immutability Triggers (application_name=vault_app), Cross-Cutting Concern: Audit Action Mapping, logAudit Flow (Never Throws), Error Propagation Patterns by Layer (+3 more)

### Community 14 - "Login Server Action Flow"
Cohesion: 0.29
Nodes (8): Authentication Flow (login, createSession, verifySession), Login Processing Flow (Rate Limit, Lock Check, bcrypt, Session), Session Versioning (Cross-Device Invalidation), Session Invalidation Semantics (Voluntary vs Forced Change), Login Server Action Flow, Session Creation / Verification / Invalidation Flows, Change Password Flow (/dashboard/settings), Logout Flow

### Community 15 - "Threat Model & Mitigations Matrix"
Cohesion: 0.33
Nodes (7): Compliance Alignment (NIST 800-63B, OWASP ASVS 4.0, GDPR Art.32, SOC 2), Defense-in-Depth Strength Assessment, Feature: Password History, User Login Flow (/login), Password History Reuse Prevention, Failed Login Tracking & Progressive Delay, Threat Model & Mitigations Matrix

### Community 17 - "bcrypt Password Hashing (Cost Factor 12)"
Cohesion: 0.29
Nodes (6): Constant-Time Comparison (Timing Attack Defense), Dual Cryptography Strategy (Irreversible Hash vs Reversible AEAD), Prisma 7 Connection Pattern (PrismaPg Adapter), pnpm allowBuilds Native Build Permissions, bcrypt Password Hashing (Cost Factor 12), Prisma 7 ORM (Parameterized Queries)

### Community 18 - "Feature: Security Settings Configuration"
Cohesion: 0.27
Nodes (10): Dynamic Zod Schemas from SecuritySettings, SecuritySettings Caching Pattern (Module Cache + clearSettingsCache), getPasswordValidationString(), getSecuritySettings(), SecuritySettings Model (Singleton), Feature: Configurable Password Policy, Feature: Security Settings Configuration, Security Settings Retrieval & Cache Flow (+2 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.06
Nodes (31): AuditPage(), RootLayout(), LocaleSwitcher(), actionColors, calculateSecurityScore(), SecurityDashboardClient(), SecurityDashboardClientProps, roleColors (+23 more)

### Community 21 - "Role-Based Access Control (SUPER_ADMIN / EDITOR / VIEWER)"
Cohesion: 0.40
Nodes (5): RBAC Enforcement Helpers (verifySession / requireRole), Feature: Security Dashboard (Score 0-100), Roles & Permissions Matrix, Role-Based Access Control (SUPER_ADMIN / EDITOR / VIEWER), Security Dashboard (/dashboard/security)

### Community 22 - "proxy.ts"
Cohesion: 0.40
Nodes (5): config, getSecretKey(), proxy(), publicRoutes, NOTE: Do NOT redirect authenticated-looking users away from public routes

### Community 23 - "Globe Icon (SVG)"
Cohesion: 0.50
Nodes (4): Globe / Global Web Symbolism, Globe Icon (SVG), Next.js Default Template Asset (create-next-app), SVG Vector Graphics Format

### Community 24 - "Window Icon (Browser Window SVG with Control Dots)"
Cohesion: 0.50
Nodes (4): Browser/Application Window UI Metaphor, Window Icon (Browser Window SVG with Control Dots), Next.js Starter Template Default Asset Set, Static Asset Serving via /public Directory

### Community 25 - "Vercel Logo (White Triangle SVG)"
Cohesion: 1.00
Nodes (3): Vercel Logo (White Triangle SVG), Vercel Deployment Platform, Next.js Scaffold Boilerplate Asset

### Community 27 - "dependencies"
Cohesion: 0.29
Nodes (7): clsx, @fontsource/ibm-plex-sans-arabic, jose, dependencies, clsx, @fontsource/ibm-plex-sans-arabic, jose

## Ambiguous Edges - Review These
- `Known Limitations & Future Improvements (Redis, MFA, Key Rotation)` → `Client-Side Password Generator (CSPRNG + Fisher-Yates + zxcvbn)`  [AMBIGUOUS]
  docs/SYSTEM_FLOWS.md · relation: conceptually_related_to
- `Globe Icon (SVG)` → `Next.js Default Template Asset (create-next-app)`  [AMBIGUOUS]
  public/globe.svg · relation: conceptually_related_to
- `Next.js Starter Template Default Asset Set` → `Window Icon (Browser Window SVG with Control Dots)`  [AMBIGUOUS]
  public/window.svg · relation: conceptually_related_to
- `Vercel Deployment Platform` → `Vercel Logo (White Triangle SVG)`  [AMBIGUOUS]
  public/vercel.svg · relation: rationale_for
- `generateResetToken()` → `Password Reset Tokens`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **212 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+207 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Known Limitations & Future Improvements (Redis, MFA, Key Rotation)` and `Client-Side Password Generator (CSPRNG + Fisher-Yates + zxcvbn)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Globe Icon (SVG)` and `Next.js Default Template Asset (create-next-app)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Next.js Starter Template Default Asset Set` and `Window Icon (Browser Window SVG with Control Dots)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Vercel Deployment Platform` and `Vercel Logo (White Triangle SVG)`?**
  _Edge tagged AMBIGUOUS (relation: rationale_for) - confidence is low._
- **What is the exact relationship between `generateResetToken()` and `Password Reset Tokens`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `!.next` connect `biome.json` to `dropdown-menu.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `SecureVault Password Administration System` (e.g. with `Next.js Breaking Changes Agent Notice` and `PostgreSQL 16 Docker Service (password_vault_db)`) actually correct?**
  _`SecureVault Password Administration System` has 14 INFERRED edges - model-reasoned connections that need verification._