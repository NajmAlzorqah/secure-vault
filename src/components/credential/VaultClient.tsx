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
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground font-heading tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("subtitle")}
          </p>
        </div>
        {isWriteAuthorized && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 font-bold shadow-teal-glow cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {t("addCredential")}
          </Button>
        )}
      </div>

      <Card className="border-border/80 bg-card shadow-card">
        <CardHeader className="pb-3 border-b border-dashed border-border/80">
          <CardTitle className="text-lg">{t("cardTitle")}</CardTitle>
          <CardDescription>{t("encryptedNote")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-3 start-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="font-bold cursor-pointer"
              >
                {tc("all")}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="font-bold cursor-pointer"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Vault Table */}
          <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="font-bold text-foreground">
                    {t("colTitle")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colCategory")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colUsername")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colPassword")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colUrl")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colLastUpdated")}
                  </TableHead>
                  <TableHead className="text-end font-bold text-foreground">
                    {tc("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredentials.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground font-medium"
                    >
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredentials.map((cred) => (
                    <TableRow
                      key={cred.id}
                      className="hover:bg-muted/30 border-border/40 transition-colors"
                    >
                      <TableCell className="font-bold text-foreground max-w-[240px]">
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
                          <Badge variant="sky">
                            {cred.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs text-foreground/80 font-medium"
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
                            className="text-primary hover:brightness-110 inline-flex items-center gap-1 hover:underline text-xs font-medium"
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
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {new Date(cred.updatedAt).toLocaleString(
                          intlLocaleFor(locale),
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {isWriteAuthorized && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditCredential(cred)}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                                title={tc("edit")}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteId(cred.id)}
                                className="text-muted-foreground hover:text-coral hover:bg-coral/10 rounded-full"
                                title={tc("delete")}
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
              {isPending ? t("deleting") : t("permanentlyDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
