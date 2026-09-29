"use client";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  KeyRound,
  Lock,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import type { Role } from "@/generated/prisma/client";

interface SidebarProps {
  role: Role;
  forcePasswordChange?: boolean;
}

const navItems = [
  {
    href: "/dashboard",
    labelKey: "dashboard",
    icon: Shield,
    exact: true,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"] as Role[],
  },
  {
    href: "/dashboard/vault",
    labelKey: "vault",
    icon: KeyRound,
    exact: false,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"] as Role[],
  },
  {
    href: "/dashboard/users",
    labelKey: "users",
    icon: Users,
    exact: false,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    href: "/dashboard/security",
    labelKey: "security",
    icon: ShieldCheck,
    exact: false,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    href: "/dashboard/audit",
    labelKey: "auditLogs",
    icon: ClipboardList,
    exact: false,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    href: "/dashboard/settings",
    labelKey: "settings",
    icon: Settings,
    exact: false,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"] as Role[],
  },
];

export function Sidebar({ role, forcePasswordChange }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`flex flex-col bg-card border-e border-border/80 transition-all duration-300 relative z-10 h-screen shrink-0 shadow-xs ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo Header */}
      <div className="h-[70px] flex items-center justify-between px-4 border-b border-border/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 bg-primary/10 rounded-xl border border-primary/20 shrink-0">
            <Logo className="h-5 w-5 text-primary shrink-0" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-base text-foreground font-heading tracking-tight whitespace-nowrap">
              SecureVault
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-all"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
          )}
        </button>
      </div>

      {/* Force password change notice */}
      {forcePasswordChange && !collapsed && (
        <div className="mx-3 mt-3 p-3 bg-gold/15 border border-gold/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#8F7000] dark:text-gold-light shrink-0" />
            <p className="text-[11px] text-[#8F7000] dark:text-gold-light font-bold leading-tight">
              {t("passwordChangeRequired")}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm transition-all duration-150 active:scale-95 ${
                isActive
                  ? "text-primary-foreground bg-primary shadow-teal-glow/30 font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary font-medium"
              }`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer with playful dashed divider */}
      <div className="p-4 border-t border-dashed border-border/80 text-center">
        {!collapsed && (
          <p
            className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap tracking-wide"
            dir="ltr"
          >
            v1.0.0 • AES-256-GCM
          </p>
        )}
      </div>
    </aside>
  );
}
