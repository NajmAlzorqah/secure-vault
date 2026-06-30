"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import { requireRole, verifySession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import {
  createCredentialSchema,
  idSchema,
  updateCredentialSchema,
} from "@/lib/validations";

export interface CredentialState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
}

async function getClientInfo() {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}

export async function createCredential(
  prevState: CredentialState | undefined,
  formData: FormData,
): Promise<CredentialState> {
  const session = await requireRole(["SUPER_ADMIN", "EDITOR"]);
  const { ipAddress, userAgent } = await getClientInfo();

  const parsed = createCredentialSchema.safeParse({
    title: formData.get("title"),
    username: formData.get("username"),
    password: formData.get("password"),
    url: formData.get("url"),
    notes: formData.get("notes"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, username, password, url, notes, category } = parsed.data;

  // Encrypt the credential password using AES-256-GCM
  const encrypted = encrypt(password);

  const credential = await db.credential.create({
    data: {
      title,
      username,
      encryptedPassword: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      url: url || null,
      notes: notes || null,
      category: category || null,
      createdBy: session.userId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "CREATE_CREDENTIAL",
    targetId: credential.id,
    details: `Created credential: ${title}`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/vault");
  revalidatePath("/dashboard");

  return { success: true, message: "Credential created successfully." };
}

export async function updateCredential(
  prevState: CredentialState | undefined,
  formData: FormData,
): Promise<CredentialState> {
  const session = await requireRole(["SUPER_ADMIN", "EDITOR"]);
  const { ipAddress, userAgent } = await getClientInfo();

  const id = formData.get("id") as string;
  if (!id) {
    return { message: "Credential ID is required." };
  }

  // Verify credential exists
  const existing = await db.credential.findUnique({ where: { id } });
  if (!existing) {
    return { message: "Credential not found." };
  }

  const parsed = updateCredentialSchema.safeParse({
    title: formData.get("title"),
    username: formData.get("username"),
    password: formData.get("password"),
    url: formData.get("url"),
    notes: formData.get("notes"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, username, password, url, notes, category } = parsed.data;

  const updateData: Record<string, any> = {
    title,
    username,
    url: url || null,
    notes: notes || null,
    category: category || null,
  };

  if (password && password.length > 0) {
    const encrypted = encrypt(password);
    updateData.encryptedPassword = encrypted.encryptedData;
    updateData.iv = encrypted.iv;
    updateData.authTag = encrypted.authTag;
  }

  await db.credential.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATE_CREDENTIAL",
    targetId: id,
    details: `Updated credential: ${title}`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/vault");
  revalidatePath("/dashboard");

  return { success: true, message: "Credential updated successfully." };
}

export async function deleteCredential(id: string): Promise<CredentialState> {
  const session = await requireRole(["SUPER_ADMIN", "EDITOR"]);
  const { ipAddress, userAgent } = await getClientInfo();

  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) {
    return { message: "Invalid credential ID format." };
  }

  const credential = await db.credential.findUnique({ where: { id } });
  if (!credential) {
    return { message: "Credential not found." };
  }

  await db.credential.delete({ where: { id } });

  await logAudit({
    userId: session.userId,
    action: "DELETE_CREDENTIAL",
    targetId: id,
    details: `Deleted credential: ${credential.title}`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/vault");
  revalidatePath("/dashboard");

  return { success: true, message: "Credential deleted successfully." };
}
