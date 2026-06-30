import "server-only";

import type { AuditAction } from "@/generated/prisma/client";
import { db } from "./db";

interface AuditLogParams {
  userId: string | null;
  action: AuditAction;
  targetId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates an immutable audit log entry.
 *
 * Audit logs are append-only by design — there is no update or delete
 * API exposed anywhere in the application. This ensures tamper evidence
 * for security compliance.
 *
 * Every security-relevant action is logged:
 * - Authentication events (login, logout, failed attempts)
 * - Credential operations (create, view, update, delete)
 * - User management (create, update, delete)
 * - Administrative actions (export, password changes)
 */
export async function logAudit({
  userId,
  action,
  targetId,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        targetId: targetId ?? null,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never crash the application.
    // Log to stderr for monitoring, but don't throw.
    console.error("[AUDIT ERROR] Failed to write audit log:", error);
  }
}
