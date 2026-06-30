"use client";

import { useActionState, useState, useEffect } from "react";
import { createUser, updateUser, type UserState } from "@/app/actions/users";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/client";

interface UserFormProps {
	mode: "create" | "edit";
	user?: {
		id: string;
		name: string;
		email: string;
		role: Role;
	};
	onClose: () => void;
	onSuccess?: () => void;
}

export function UserForm({ mode, user, onClose, onSuccess }: UserFormProps) {
	const action = mode === "create" ? createUser : updateUser;
	const [state, formAction, pending] = useActionState<UserState | undefined, FormData>(action, undefined);
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (state?.success) {
			onSuccess?.();
			onClose();
		}
	}, [state?.success, onSuccess, onClose]);

	// Close on escape
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
					<h3 className="text-lg font-semibold text-white">
						{mode === "create" ? "Add System User" : "Edit Admin User"}
					</h3>
					<button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-900 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{state?.message && !state.success && (
					<div className="mx-6 mt-4 p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400">
						{state.message}
					</div>
				)}

				<form action={formAction} className="p-6 space-y-4 overflow-y-auto">
					{mode === "edit" && <input type="hidden" name="id" value={user?.id} />}

					<div className="space-y-1.5">
						<label htmlFor="user-name" className="text-xs font-medium text-zinc-400">Name *</label>
						<input
							id="user-name"
							name="name"
							type="text"
							required
							defaultValue={user?.name ?? ""}
							placeholder="e.g. John Doe"
							className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
							disabled={pending}
						/>
						{state?.errors?.name && (
							<p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label htmlFor="user-email" className="text-xs font-medium text-zinc-400">Email Address *</label>
						<input
							id="user-email"
							name="email"
							type="email"
							required
							defaultValue={user?.email ?? ""}
							placeholder="e.g. user@vault.local"
							className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
							disabled={pending}
						/>
						{state?.errors?.email && (
							<p className="text-xs text-red-400 mt-1">{state.errors.email[0]}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label htmlFor="user-role" className="text-xs font-medium text-zinc-400">System Role *</label>
						<select
							id="user-role"
							name="role"
							required
							defaultValue={user?.role ?? "VIEWER"}
							className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
							disabled={pending}
						>
							<option value="SUPER_ADMIN">Super Admin (Full Access)</option>
							<option value="EDITOR">Editor (Can Read/Write Secrets)</option>
							<option value="VIEWER">Viewer (Can Only View Secrets)</option>
						</select>
						{state?.errors?.role && (
							<p className="text-xs text-red-400 mt-1">{state.errors.role[0]}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label htmlFor="user-password" className="text-xs font-medium text-zinc-400">
							Password {mode === "create" ? "*" : "(leave blank to keep current)"}
						</label>
						<div className="relative">
							<input
								id="user-password"
								name="password"
								type={showPassword ? "text" : "password"}
								required={mode === "create"}
								placeholder="••••••••"
								className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
								disabled={pending}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
						{state?.errors?.password && (
							<div className="text-xs text-red-400 space-y-1 mt-1">
								{state.errors.password.map((err, idx) => (
									<p key={idx}>{err}</p>
								))}
							</div>
						)}
					</div>

					<div className="flex items-center justify-end gap-3 pt-2">
						<Button
							type="button"
							onClick={onClose}
							variant="outline"
							className="text-xs border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold"
							disabled={pending}
						>
							{pending
								? "Saving..."
								: mode === "create"
									? "Add User"
									: "Update User"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
