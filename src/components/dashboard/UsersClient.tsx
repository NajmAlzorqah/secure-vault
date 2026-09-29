"use client";

import { Edit, Plus, Search, ShieldAlert, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteUser } from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Role } from "@/generated/prisma/client";
import { intlLocaleFor } from "@/i18n/config";
import type { SecuritySettingsData } from "@/lib/security-settings";
import { UserForm } from "./UserForm";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
  settings: SecuritySettingsData;
}

const roleBadgeVariants: Record<
  Role,
  "gold" | "default" | "sky"
> = {
  SUPER_ADMIN: "gold",
  EDITOR: "default",
  VIEWER: "sky",
};

export function UsersClient({
  initialUsers,
  currentUserId,
  settings,
}: UsersClientProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const res = await deleteUser(deleteId);
      if (res.success) {
        setDeleteId(null);
      } else {
        alert(res.message || t("deleteFailed"));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 font-bold shadow-teal-glow cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("addUser")}
        </Button>
      </div>

      <Card className="border-border/80 bg-card shadow-card">
        <CardHeader className="pb-3 border-b border-dashed border-border/80">
          <CardTitle className="text-lg">{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-3 start-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="font-bold text-foreground">
                    {t("colName")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colEmail")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colRole")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colCreated")}
                  </TableHead>
                  <TableHead className="text-end font-bold text-foreground">
                    {tc("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground font-medium"
                    >
                      {t("noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/30 border-border/40 transition-colors"
                    >
                      <TableCell className="font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.id === currentUserId && (
                            <Badge variant="default" className="text-[10px] h-4.5 px-2">
                              {tc("you")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium" dir="ltr">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariants[user.role]}>
                          {tr(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Date(user.createdAt).toLocaleDateString(
                          intlLocaleFor(locale),
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditUser(user)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                            title={tc("edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={user.id === currentUserId}
                            onClick={() => setDeleteId(user.id)}
                            className="text-muted-foreground hover:text-coral hover:bg-coral/10 rounded-full disabled:opacity-30"
                            title={tc("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {isCreateOpen && (
        <UserForm
          mode="create"
          settings={settings}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <UserForm
          mode="edit"
          user={editUser}
          settings={settings}
          onClose={() => setEditUser(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-coral">
              <ShieldAlert className="h-5 w-5" />
              {t("deleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isPending}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? t("revoking") : t("revokeAccess")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
