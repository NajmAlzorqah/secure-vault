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
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const actionColors: Record<string, string> = {
  LOGIN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  LOGOUT: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  LOGIN_FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  VIEW_PASSWORD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CREATE_CREDENTIAL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  UPDATE_CREDENTIAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELETE_CREDENTIAL: "bg-red-500/10 text-red-400 border-red-500/20",
  CREATE_USER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  UPDATE_USER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELETE_USER: "bg-red-500/10 text-red-400 border-red-500/20",
  CHANGE_PASSWORD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EXPORT_CREDENTIALS: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default async function AuditPage() {
  // Only SUPER_ADMIN can view security audit logs
  await requireRole(["SUPER_ADMIN"]);

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
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Security Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Immutable security audit logs tracing all administrative activities.
        </p>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Audit Log Trail</CardTitle>
          <CardDescription>
            Displays the latest 100 events. Logs are append-only to satisfy
            InfoSec integrity requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/40 overflow-hidden bg-background/25">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-gray-300 font-medium">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    User
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Security Action
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Details
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    IP Address
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Browser / User Agent
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No security logs recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/20 border-border/20"
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        {log.user ? (
                          <div>
                            <p className="text-xs">{log.user.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {log.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            System / Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border text-[10px] ${actionColors[log.action] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-300 max-w-[250px]">
                        {log.details ||
                          (log.target
                            ? `Credential: ${log.target.title}`
                            : "—")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
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
