# Security Policy

SecureVault stores encrypted credentials. Please report vulnerabilities
responsibly.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security problem.**

Use GitHub's private advisory form:

<https://github.com/NajmAlzorqah/secure-vault/security/advisories/new>

Please include:

- The affected file or route
- Steps to reproduce, ideally a minimal proof of concept
- The impact you believe it has
- Any suggested remediation

You can expect an acknowledgement within 7 days. Once a fix is ready, you will
be credited in the advisory unless you prefer otherwise.

## Supported versions

| Version | Supported |
|---|---|
| `main` | Yes |
| Any tagged release older than the latest | No — upgrade to the latest tag |

## Threat model

SecureVault is designed for **self-hosted, single-tenant** use: one
organization operating its own instance for its own administrators.

**In scope:**

- Unauthorized access to stored credentials
- Bypassing authentication, authorization, or RBAC
- Weaknesses in the AES-256-GCM encryption or bcrypt password handling
- Injection in server actions or API routes
- Audit-log tampering or suppression
- Exfiltration via the reveal or export endpoints

**Out of scope:**

- Compromised host, container, or hosting infrastructure
- Social engineering of an administrator
- Denial of service through volumetric attack
- Weaknesses in upstream dependencies with no demonstrated impact here
- Reports from an automated scanner with no working proof of concept
- Physical access to the machine running the instance

## Operational caveats

Known properties you should account for before deploying to production:

- **No key rotation.** `ENCRYPTION_KEY` is static. Changing it makes every
  stored credential unrecoverable. There is no re-encryption migration; adding
  one would be a welcome contribution. Back the key up somewhere separate from
  the database.
- **Rate limiting is in-process.** `src/lib/rate-limit.ts` uses in-memory state,
  so it only limits a single Node process. Behind multiple instances, or behind
  a proxy that fans out requests, the effective limit is the per-instance limit.
  Use a shared store (Redis) or an upstream limiter for multi-instance setups.
- **MFA is modeled, not enforced.** `SecuritySettings.mfaRequired` exists in the
  schema, but no second factor is implemented or checked during login. Do not
  rely on it as a control.
- **Password reset returns the token in the HTTP response.** There is no mail
  transport wired up, so `requestPasswordReset` hands the raw token back to the
  caller. That makes the forgot-password flow an account-takeover vector: anyone
  who knows a registered email can mint a token and reset that account's
  password. Wire up email delivery and stop returning the token before this is
  reachable by untrusted users.
- **Session cookies** set `Secure` only when `NODE_ENV === "production"`. Run
  production behind TLS, or an attacker can read the cookie in transit.
- **Seed data is not a secret.** `prisma/seed.ts` ships a demo team with
  well-known passwords and truncates your tables on every run. Do not run
  `pnpm db:seed` against a database holding real data.

## Deployment checklist

- [ ] Set a unique, randomly generated `ENCRYPTION_KEY` and `SESSION_SECRET`
- [ ] Terminate TLS in front of the app
- [ ] Change `DB_PASSWORD` from the `docker-compose.yml` default
- [ ] Restrict database access to the application only
- [ ] Back up `ENCRYPTION_KEY` separately from the database
- [ ] Set an explicit backup retention policy for the volume
