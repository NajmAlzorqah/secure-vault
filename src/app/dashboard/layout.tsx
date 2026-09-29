import { ForcePasswordChangeDialog } from "@/components/dashboard/ForcePasswordChangeDialog";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPasswordExpired } from "@/lib/password-expiry";
import { getSecuritySettings } from "@/lib/security-settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  const settings = await getSecuritySettings();

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      forcePasswordChange: true,
      passwordChangedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  // Check password expiration and set forcePasswordChange if expired
  if (!user.forcePasswordChange) {
    if (isPasswordExpired(user.passwordChangedAt, settings.expirationDays)) {
      await db.user.update({
        where: { id: user.id },
        data: { forcePasswordChange: true },
      });
      user.forcePasswordChange = true;
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        role={user.role}
        forcePasswordChange={user.forcePasswordChange}
      />
      <div className="flex-grow flex flex-col min-w-0">
        <TopBar user={user} />
        <main className="flex-grow p-8 overflow-y-auto">{children}</main>
      </div>
      {user.forcePasswordChange && (
        <ForcePasswordChangeDialog settings={settings} />
      )}
    </div>
  );
}
