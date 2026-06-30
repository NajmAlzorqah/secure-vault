import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { checkRateLimit, REVEAL_RATE_LIMIT } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  // Verify authentication
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  // Parse request body
  let body: { credentialId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.credentialId) {
    return Response.json(
      { error: "credentialId is required" },
      { status: 400 },
    );
  }

  // Fetch the credential
  const credential = await db.credential.findUnique({
    where: { id: body.credentialId },
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
