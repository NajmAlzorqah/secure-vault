import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { intlLocaleFor } from "@/i18n/config";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const actionBadgeVariant: Record<
  string,
  "default" | "gold" | "coral" | "sky" | "secondary"
> = {
  LOGIN: "default",
  LOGOUT: "secondary",
  LOGIN_FAILED: "coral",
  VIEW_PASSWORD: "gold",
  CREATE_CREDENTIAL: "default",
  UPDATE_CREDENTIAL: "sky",
  DELETE_CREDENTIAL: "coral",
  CREATE_USER: "default",
  UPDATE_USER: "sky",
  DELETE_USER: "coral",
  CHANGE_PASSWORD: "gold",
  EXPORT_CREDENTIALS: "sky",
  PASSWORD_RESET_REQUEST: "gold",
  PASSWORD_RESET_COMPLETE: "default",
};

export default async function AuditPage() {
  // Only SUPER_ADMIN can view security audit logs
  await requireRole(["SUPER_ADMIN"]);

  const t = await getTranslations("audit");
  const ta = await getTranslations("auditActions");
  const locale = await getLocale();

  // Fetch latest 100 audit logs
  const logs = await db.auditLog.findMany({
    take: 100,
    orderBy: { timestamp: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      target: { select: { title: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <Card className="border-border/80 bg-card shadow-card">
        <CardHeader className="pb-3 border-b border-dashed border-border/80">
          <CardTitle className="text-lg">{t("trailTitle")}</CardTitle>
          <CardDescription>{t("trailDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="font-bold text-foreground">
                    {t("colTimestamp")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colUser")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colAction")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colDetails")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colIp")}
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    {t("colUserAgent")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground font-medium"
                    >
                      {t("noLogs")}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/30 border-border/40 transition-colors"
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {new Date(log.timestamp).toLocaleString(
                          intlLocaleFor(locale),
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        {log.user ? (
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {log.user.name}
                            </p>
                            <p
                              className="text-[11px] text-muted-foreground font-medium"
                              dir="ltr"
                            >
                              {log.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            {t("systemUnknown")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={actionBadgeVariant[log.action] ?? "secondary"}
                          className="text-[10px]"
                        >
                          {ta(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/80 font-medium max-w-[250px]">
                        {log.details ||
                          (log.target
                            ? t("credentialPrefix", {
                                title: log.target.title,
                              })
                            : "—")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground font-medium">
                        {log.ipAddress || "—"}
                      </TableCell>
                      <TableCell
                        className="text-[10px] text-muted-foreground max-w-[200px] truncate"
                        title={log.userAgent ?? undefined}
                      >
                        {log.userAgent || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
