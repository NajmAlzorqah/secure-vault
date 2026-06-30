import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { checkRateLimit, REVEAL_RATE_LIMIT } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { revealCredentialSchema } from "@/lib/validations";

export async function POST(request: Request) {
  // Verify authentication
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CSRF protection: validate origin/referer header
  const csrfHeaders = await headers();
  const origin = csrfHeaders.get("origin");
  const referer = csrfHeaders.get("referer");
  const host = csrfHeaders.get("host");
  const allowedOrigin = origin ?? referer;
  if (allowedOrigin) {
    try {
      const url = new URL(allowedOrigin);
      if (url.host !== host) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Rate limit by user ID
  const rateLimitResult = checkRateLimit(
    `reveal:${session.userId}`,
    REVEAL_RATE_LIMIT,
  );
  if (!rateLimitResult.success) {
    return Response.json(
      {
        error: "Too many reveal requests. Please wait a moment.",
        resetAt: rateLimitResult.resetAt.toISOString(),
      },
      { status: 429 },
    );
  }

  // Parse and validate request body with Zod
  let body: { credentialId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = revealCredentialSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid credential ID format." },
      { status: 400 },
    );
  }

  // Fetch the credential
  const credential = await db.credential.findUnique({
    where: { id: parsed.data.credentialId },
    select: {
      id: true,
      title: true,
      encryptedPassword: true,
      iv: true,
      authTag: true,
    },
  });

  if (!credential) {
    return Response.json({ error: "Credential not found" }, { status: 404 });
  }

  // Decrypt the password
  let plaintext: string;
  try {
    plaintext = decrypt(
      credential.encryptedPassword,
      credential.iv,
      credential.authTag,
    );
  } catch {
    return Response.json(
      { error: "Failed to decrypt credential. Data may be corrupted." },
      { status: 500 },
    );
  }

  // Audit log the reveal action
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? "unknown";

  await logAudit({
    userId: session.userId,
    action: "VIEW_PASSWORD",
    targetId: credential.id,
    details: `Revealed password for: ${credential.title}`,
    ipAddress,
    userAgent,
  });

  return Response.json({ password: plaintext });
}
