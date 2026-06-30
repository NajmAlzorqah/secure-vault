"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
	const [state, action, pending] = useActionState<AuthState | undefined, FormData>(login, undefined);
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 overflow-hidden">
			{/* Radial background gradient */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />

			<div className="relative z-10 w-full max-w-md">
				<div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
							<Shield className="h-8 w-8 text-emerald-400" />
						</div>
						<h1 className="text-2xl font-bold tracking-tight text-white">SecureVault</h1>
						<p className="text-sm text-zinc-400">
							Password Administration System
						</p>
					</div>

					{/* Error alert */}
					{state?.message && (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm" role="alert">
							{state.message}
						</div>
					)}

					{/* Login Form */}
					<form action={action} className="space-y-4">
						<div className="space-y-1.5">
							<label htmlFor="email" className="text-xs font-medium text-zinc-400">
								Email Address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								placeholder="admin@vault.local"
								className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={pending}
							/>
							{state?.errors?.email && (
								<p className="text-xs text-red-400 mt-1">{state.errors.email[0]}</p>
							)}
						</div>

						<div className="space-y-1.5">
							<label htmlFor="password" className="text-xs font-medium text-zinc-400">
								Password
							</label>
							<div className="relative">
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									required
									placeholder="••••••••"
									className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={pending}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{state?.errors?.password && (
								<p className="text-xs text-red-400 mt-1">{state.errors.password[0]}</p>
							)}
						</div>

						<button
							type="submit"
							disabled={pending}
							className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{pending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Authenticating...
								</>
							) : (
								"Sign In"
							)}
						</button>
					</form>

					{/* Footer */}
					<div className="text-center text-[10px] text-zinc-500 space-y-1 pt-2">
						<p>🔒 Secured with AES-256-GCM encryption</p>
						<p>All login attempts are monitored and logged</p>
					</div>
				</div>
			</div>
		</div>
	);
}
