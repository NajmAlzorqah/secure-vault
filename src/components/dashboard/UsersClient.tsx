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

const roleColors: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  EDITOR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  VIEWER: "bg-gray-500/10 text-gray-400 border-gray-500/20",
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
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("addUser")}
        </Button>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-2.5 start-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-background/50 border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          {/* Users Table */}
          <div className="rounded-md border border-border/40 overflow-hidden bg-background/25">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-gray-300 font-medium">
                    {t("colName")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colEmail")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colRole")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colCreated")}
                  </TableHead>
                  <TableHead className="text-end text-gray-300 font-medium">
                    {tc("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {t("noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/20 border-border/20"
                    >
                      <TableCell className="font-semibold text-white">
                        {user.name}
                        {user.id === currentUserId && (
                          <Badge className="ms-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1 py-0 font-normal">
                            {tc("you")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300" dir="ltr">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${roleColors[user.role]}`}>
                          {tr(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString(
                          intlLocaleFor(locale),
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditUser(user)}
                            className="h-8 w-8 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={user.id === currentUserId}
                            onClick={() => setDeleteId(user.id)}
                            className="h-8 w-8 text-gray-300 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none"
                            title={
                              user.id === currentUserId
                                ? t("cannotDeleteSelf")
                                : undefined
                            }
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

      {/* Create User Form Modal */}
      {isCreateOpen && (
        <UserForm
          mode="create"
          settings={settings}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {/* Edit User Form Modal */}
      {editUser && (
        <UserForm
          mode="edit"
          user={editUser}
          settings={settings}
          onClose={() => setEditUser(null)}
        />
      )}

      {/* Delete User Confirmation */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="border-border/40 bg-zinc-950/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="h-5 w-5" />
              {t("deleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("deleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteId(null)}
              disabled={isPending}
              className="text-gray-400 hover:text-white"
            >
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {isPending ? t("revoking") : t("revokeAccess")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
