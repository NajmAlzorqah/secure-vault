"use client";

import { useActionState, useState, useEffect } from "react";
import { changePassword, type UserState } from "@/app/actions/users";
import { KeyRound, Eye, EyeOff, Loader2, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/generated/prisma/client";

interface SettingsClientProps {
	user: {
		name: string;
		email: string;
		role: Role;
	};
}

const roleLabels: Record<Role, string> = {
	SUPER_ADMIN: "Super Administrator (Full System Control)",
	EDITOR: "Editor (Secret Reader/Writer)",
	VIEWER: "Viewer (Secret Reader Only)",
};

export function SettingsClient({ user }: SettingsClientProps) {
	const [state, formAction, pending] = useActionState<UserState | undefined, FormData>(changePassword, undefined);
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const isSuperAdmin = user.role === "SUPER_ADMIN";

	const handleExport = async () => {
		try {
			window.location.href = "/api/credentials/export";
		} catch (error) {
			alert("Failed to export credentials: " + error);
		}
	};

	return (
		<div className="space-y-6 max-w-4xl">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
				<p className="text-muted-foreground">
					Manage administrative credentials and security settings.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Profile Info */}
				<div className="space-y-6">
					<Card className="border-border/40 bg-card/60 backdrop-blur-xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldCheck className="h-5 w-5 text-emerald-400" />
								Profile Information
							</CardTitle>
							<CardDescription>Your current administrative profile.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-xs text-muted-foreground">Name</p>
								<p className="text-sm font-semibold text-white">{user.name}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Email Address</p>
								<p className="text-sm font-semibold text-white">{user.email}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Privilege Level</p>
								<p className="text-sm font-semibold text-emerald-400">{roleLabels[user.role]}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Session Expiration</p>
								<p className="text-sm text-gray-300">24 Hours (HttpOnly, SameSite=Strict)</p>
							</div>
						</CardContent>
					</Card>

					{/* Export backup (SUPER_ADMIN only) */}
					{isSuperAdmin && (
						<Card className="border-border/40 bg-card/60 backdrop-blur-xl">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Download className="h-5 w-5 text-emerald-400" />
									Backup & Recovery
								</CardTitle>
								<CardDescription>
									Export encrypted credentials database backup.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-xs text-muted-foreground leading-relaxed">
									Download the entire credentials vault as a JSON file. The passwords will remain AES-256-GCM encrypted. This backup can be decrypted only with the master server key.
								</p>
								<Button
									onClick={handleExport}
									className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
								>
									<Download className="h-4 w-4" />
									Export Vault Backup
								</Button>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Change Password */}
				<Card className="border-border/40 bg-card/60 backdrop-blur-xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<KeyRound className="h-5 w-5 text-emerald-400" />
							Change Password
						</CardTitle>
						<CardDescription>
							Update your password. You will be logged out upon success.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{state?.message && (
							<div className={`p-3 rounded text-xs mb-4 ${state.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
								{state.message}
							</div>
						)}

						<form action={formAction} className="space-y-4">
							<div className="space-y-2">
								<label className="text-xs font-medium text-gray-300">Current Password</label>
								<div className="relative">
									<Input
										name="currentPassword"
										type={showCurrent ? "text" : "password"}
										required
										className="pr-10 bg-background/50 border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
									/>
									<button
										type="button"
										onClick={() => setShowCurrent(!showCurrent)}
										className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
									>
										{showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								{state?.errors?.currentPassword && (
									<p className="text-xs text-red-400">{state.errors.currentPassword[0]}</p>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-xs font-medium text-gray-300">New Password</label>
								<div className="relative">
									<Input
										name="newPassword"
										type={showNew ? "text" : "password"}
										required
										className="pr-10 bg-background/50 border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
									/>
									<button
										type="button"
										onClick={() => setShowNew(!showNew)}
										className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
									>
										{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								{state?.errors?.newPassword && (
									<div className="text-xs text-red-400 space-y-1">
										{state.errors.newPassword.map((err, idx) => <p key={idx}>{err}</p>)}
									</div>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-xs font-medium text-gray-300">Confirm New Password</label>
								<div className="relative">
									<Input
										name="confirmPassword"
										type={showConfirm ? "text" : "password"}
										required
										className="pr-10 bg-background/50 border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
									/>
									<button
										type="button"
										onClick={() => setShowConfirm(!showConfirm)}
										className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
									>
										{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								{state?.errors?.confirmPassword && (
									<p className="text-xs text-red-400">{state.errors.confirmPassword[0]}</p>
								)}
							</div>

							<Button
								type="submit"
								disabled={pending}
								className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
							>
								{pending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
										Updating Password...
									</>
								) : (
									"Update Password"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
