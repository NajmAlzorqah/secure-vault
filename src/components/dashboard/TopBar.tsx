"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { logout } from "@/app/actions/auth";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/client";

interface TopBarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

const roleBadgeVariants: Record<
  Role,
  "gold" | "default" | "sky"
> = {
  SUPER_ADMIN: "gold",
  EDITOR: "default",
  VIEWER: "sky",
};

export function TopBar({ user }: TopBarProps) {
  const t = useTranslations("topbar");
  const tr = useTranslations("roles");

  return (
    <header className="flex items-center justify-between h-[70px] bg-card/80 backdrop-blur-md border-b border-border/80 px-6 shrink-0 shadow-xs">
      <div className="flex items-center">
        <h2 className="text-sm text-muted-foreground font-medium">
          {t("welcomeBack")}{" "}
          <span className="text-foreground font-extrabold font-heading">
            {user.name}
          </span>
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <LocaleSwitcher />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-teal-glow/20">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-foreground leading-none mb-1">
              {user.name}
            </p>
            <Badge variant={roleBadgeVariants[user.role]} className="h-5 text-[10px]">
              {tr(user.role)}
            </Badge>
          </div>
        </div>

        <form action={logout}>
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="gap-2 cursor-pointer font-semibold"
            title={t("signOut")}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t("logout")}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
