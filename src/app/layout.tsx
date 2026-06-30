import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

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
		<html lang="en" className={cn("dark", "font-sans", geist.variable)}>
			<body className={`${inter.variable} font-sans antialiased`}>
				{children}
			</body>
		</html>
	);
}
