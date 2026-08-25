import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Full session validation (signature + user existence + session version).
  // Uses the exact same logic as the dashboard auth gate, so a stale cookie
  // renders the login form instead of bouncing back to /dashboard forever.
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
