"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { Role } from "@/generated/prisma/client";

interface TopBarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const roleColors: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border border-red-500/20",
  EDITOR: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  VIEWER: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="flex items-center justify-between h-[70px] bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800 px-6 shrink-0">
      <div className="flex items-center">
        <h2 className="text-sm text-zinc-400">
          Welcome back,{" "}
          <span className="text-white font-semibold">{user.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-white leading-none mb-1">
              {user.name}
            </p>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${roleColors[user.role]}`}
            >
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 bg-transparent border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 hover:bg-zinc-800 transition-all"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
