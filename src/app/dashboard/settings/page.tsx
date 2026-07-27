import { SettingsClient } from "@/components/dashboard/SettingsClient";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPasswordAgeInfo } from "@/lib/password-expiry";
import { getSecuritySettings } from "@/lib/security-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ forceChange?: string }>;
}) {
  const session = await verifySession();
  const params = await searchParams;
  const forceChange = params.forceChange === "1";

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      role: true,
      passwordChangedAt: true,
      forcePasswordChange: true,
    },
  });

  if (!user) {
    return null;
  }

  const settings = await getSecuritySettings();
  const passwordAgeInfo = getPasswordAgeInfo(
    user.passwordChangedAt,
    settings.expirationDays,
  );

  return (
    <SettingsClient
      user={user}
      passwordAgeInfo={passwordAgeInfo}
      forceChange={forceChange || user.forcePasswordChange}
    />
  );
}
