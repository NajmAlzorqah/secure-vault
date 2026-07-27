import { SecuritySettingsClient } from "@/components/dashboard/SecuritySettingsClient";
import { requireRole } from "@/lib/auth";
import { getSecuritySettings } from "@/lib/security-settings";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  await requireRole(["SUPER_ADMIN"]);

  const settings = await getSecuritySettings();

  return <SecuritySettingsClient settings={settings} />;
}
