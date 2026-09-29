# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

System administrators, security engineers, DevOps teams, and organizational staff who require self-hosted, sovereign credential administration with strict access control and auditability.

## Product Purpose

Secure Vault provides an enterprise-grade, self-hosted password and credential management platform. It exists to guarantee absolute cryptographic data sovereignty, elimination of third-party cloud trust dependencies, and compliance-ready immutable auditing. Success means zero trust leakage, seamless daily credential access, and rapid administrative control.

## Positioning

Unlike proprietary SaaS vaults, Secure Vault guarantees self-hosted cryptographic autonomy with AES-256-GCM authenticated encryption at rest, database-level tamper-proof append-only audit logging, zero-telemetry architecture, and strict role-based access control.

## Operating Context

- **Environment**: Modern web browsers (desktop and mobile responsive) deployed on internal company networks or secure domains.
- **Workflows**: Daily credential lookups and generation, secret sharing among authorized roles, administrative user provisioning, and compliance audit trail reviews.
- **Security Posture**: End-to-end server encryption, ephemeral session handling via JOSE/JWT, and configurable organizational password complexity policies.

## Capabilities and Constraints

- **Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Base UI, Prisma ORM, PostgreSQL.
- **Cryptography**: AES-256-GCM symmetric encryption with unique initialization vectors (IV) and authentication tags per secret record.
- **Audit Logging**: PostgreSQL trigger-enforced append-only audit log table preventing retroactive record tampering or deletion.
- **Access Control**: Role-Based Access Control (`ADMIN`, `USER`) guarding administrative routes and credential scopes.
- **Constraints**: No unauthorized client exposure of raw encryption keys or decryption master keys.

## Brand Commitments

- **Name**: Secure Vault
- **Aesthetic Direction**: Flip7 Design System — A retro-playful, tactile teal-coral-gold visual language with pill geometries, cream input surfaces, and colored glow elevations that make complex security software feel approachable, delightful, and crisp.

## Product Principles

1. **Sovereignty First**: Cryptographic integrity and zero external dependencies outrank convenience.
2. **Tactile Clarity**: Critical actions (copy secret, reveal password, rotate credentials) must have unmistakable, joyful, and confident feedback.
3. **Audit Immutability**: Every privileged action leaves an indelible, verifiable trace.
4. **Accessible Ergonomics**: High contrast, legible typography, and clear spatial hierarchy ensure error-free administrative workflows.
