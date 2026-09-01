"use client";

import {
  Edit,
  ExternalLink,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteCredential } from "@/app/actions/credentials";
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
import { CredentialForm } from "./CredentialForm";
import { RevealPassword } from "./RevealPassword";

interface CredentialItem {
  id: string;
  title: string;
  username: string;
  url: string | null;
  notes: string | null;
  category: string | null;
  updatedAt: string;
}

interface VaultClientProps {
  initialCredentials: CredentialItem[];
  categories: string[];
  userRole: Role;
}

export function VaultClient({
  initialCredentials,
  categories,
  userRole,
}: VaultClientProps) {
  const t = useTranslations("vault");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCredential, setEditCredential] = useState<CredentialItem | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isWriteAuthorized = userRole === "SUPER_ADMIN" || userRole === "EDITOR";

  // Filter credentials based on search query and category
  const filteredCredentials = initialCredentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cred.url && cred.url.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      !selectedCategory || cred.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const res = await deleteCredential(deleteId);
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
        {isWriteAuthorized && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addCredential")}
          </Button>
        )}
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("cardTitle")}</CardTitle>
          <CardDescription>{t("encryptedNote")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 start-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 bg-background/50 border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={
                  selectedCategory === null
                    ? "bg-emerald-600 text-white"
                    : "border-border/40 text-gray-300 hover:bg-background/80"
                }
              >
                {tc("all")}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white"
                      : "border-border/40 text-gray-300 hover:bg-background/80"
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Vault Table */}
          <div className="rounded-md border border-border/40 overflow-hidden bg-background/25">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-gray-300 font-medium">
                    {t("colTitle")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colCategory")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colUsername")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colPassword")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colUrl")}
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    {t("colLastUpdated")}
                  </TableHead>
                  <TableHead className="text-end text-gray-300 font-medium">
                    {tc("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredentials.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredentials.map((cred) => (
                    <TableRow
                      key={cred.id}
                      className="hover:bg-muted/20 border-border/20"
                    >
                      <TableCell className="font-semibold text-white max-w-[240px]">
                        <div className="truncate" title={cred.title}>
                          {cred.title}
                        </div>
                        {cred.notes && (
                          <p className="text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5">
                            {cred.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {cred.category ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            {cred.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs text-gray-300"
                        dir="ltr"
                      >
                        {cred.username}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <RevealPassword credentialId={cred.id} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" dir="ltr">
                        {cred.url ? (
                          <a
                            href={cred.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 hover:underline text-xs"
                          >
                            {cred.url.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(cred.updatedAt).toLocaleString(
                          intlLocaleFor(locale),
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          {isWriteAuthorized && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditCredential(cred)}
                                className="h-8 w-8 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(cred.id)}
                                className="h-8 w-8 text-gray-300 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Create Modal */}
      {isCreateOpen && (
        <CredentialForm mode="create" onClose={() => setIsCreateOpen(false)} />
      )}

      {/* Edit Modal */}
      {editCredential && (
        <CredentialForm
          mode="edit"
          credential={editCredential}
          onClose={() => setEditCredential(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
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
              {isPending ? t("deleting") : t("permanentlyDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
