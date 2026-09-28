# Contributing to SecureVault

Thanks for taking the time to contribute. This document covers how to get a
change merged.

## Getting set up

```bash
git clone git@github.com:NajmAlzorqah/secure-vault.git
cd secure-vault
pnpm install
cp .env.example .env.local
```

Then fill in `ENCRYPTION_KEY` and `SESSION_SECRET`, start the database with
`docker compose up -d`, and run `pnpm db:push && pnpm db:seed`. The
[README](README.md) quickstart has the full walkthrough.

## Reporting bugs

Open an issue with:

- What you did, what you expected, and what happened instead
- Your Node, pnpm, and PostgreSQL versions
- Relevant application or browser console output
- Whether the issue reproduces on a fresh `pnpm db:push && pnpm db:seed`

**Never include a real `ENCRYPTION_KEY`, `SESSION_SECRET`, `.env.local`, or a
decrypted credential in an issue, log, or screenshot.**

## Do not report vulnerabilities publicly

Use the private disclosure process in [SECURITY.md](SECURITY.md).

## Workflow

1. Open an issue first for anything beyond a trivial fix, so we can agree on
   scope before you write code.
2. Branch from `main` with a descriptive name:
   - `feat/credential-favourites`
   - `fix/lockout-off-by-one`
   - `docs/setup-troubleshooting`
   - `chore/biome-config`
3. Keep commits focused. One logical change per commit.
4. Make sure the checks below pass before opening a pull request.
5. Open a PR describing the change and why it is needed.

## Before you push

```bash
pnpm lint        # Biome check with auto-fix
pnpm typecheck   # tsc --noEmit
pnpm build       # next build
```

Biome will reformat files in place when you run `pnpm lint`. Commit the result.

## Commit messages

Use the Conventional Commits style:

```
feat: add credential category filter
fix: off-by-one in progressive delay backoff
docs: clarify ENCRYPTION_KEY rotation limits
refactor: extract audit writer from server actions
chore: bump biome to 2.3
```

A `!` after the type plus a `BREAKING CHANGE:` footer marks a breaking change.

## Code style

The project uses [Biome](https://biomejs.dev) and follows the conventions
already in the tree:

- 2-space indentation, double quotes, semicolons
- `@/` path alias for `src/`
- Server-only logic lives in `src/lib/` with `import "server-only"`
- Anything touching secrets must be a server module — never import
  `src/lib/crypto.ts` or `src/lib/session.ts` from a client component
- Security-relevant changes should come with a test or a clear manual
  verification step in the PR description

## Adding a dependency

Before proposing a new dependency, weigh whether the standard library, an
existing dependency, or a few lines of local code would do. Every dependency
also enters the credential-handling trust boundary.

---

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
