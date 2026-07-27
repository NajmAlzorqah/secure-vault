import type { Metadata } from "next";
import "@fontsource/geist-sans";
import "@fontsource/geist-mono";
import "@fontsource/inter";
import "./globals.css";

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SecureVault — Password Administration System",
  description:
    "Enterprise-grade password management with AES-256-GCM encryption, role-based access control, and comprehensive audit logging.",
  keywords: [
    "password manager",
    "credential management",
    "AES-256-GCM",
    "RBAC",
    "audit logging",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans")}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
