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
import { useState } from "react";
import type { Role } from "@/generated/prisma/client";

interface SidebarProps {
  role: Role;
  forcePasswordChange?: boolean;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Shield,
    exact: true,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"] as Role[],
  },
  {
    href: "/dashboard/vault",
    label: "Vault",
    icon: KeyRound,
    exact: false,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"] as Role[],
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: Users,
    exact: false,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    href: "/dashboard/security",
    label: "Security",
    icon: ShieldCheck,
    exact: false,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    href: "/dashboard/audit",
    label: "Audit Logs",
    icon: ClipboardList,
    exact: false,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    exact: false,
    roles: ["SUPER_ADMIN", "EDITOR", "VIEWER"] as Role[],
  },
];

export function Sidebar({ role, forcePasswordChange }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 relative z-10 h-screen shrink-0 ${collapsed ? "w-[70px]" : "w-[260px]"}`}
    >
      {/* Logo Header */}
      <div className="h-[70px] flex items-center justify-between px-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <Shield className="h-6 w-6 text-emerald-400 shrink-0" />
          {!collapsed && (
            <span className="font-bold text-base text-white tracking-tight whitespace-nowrap">
              SecureVault
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-all"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Force password change notice */}
      {forcePasswordChange && !collapsed && (
        <div className="mx-3 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-300 font-medium leading-tight">
              Password change required
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-white bg-emerald-500/10 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800/50 text-center">
        {!collapsed && (
          <p className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
            v1.0.0 • AES-256-GCM
          </p>
        )}
      </div>
    </aside>
  );
}
