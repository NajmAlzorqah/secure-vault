"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createCredential, updateCredential, type CredentialState } from "@/app/actions/credentials";
import { PasswordGenerator } from "./PasswordGenerator";
import { PasswordStrength } from "./PasswordStrength";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CredentialFormProps {
	mode: "create" | "edit";
	credential?: {
		id: string;
		title: string;
		username: string;
		url: string | null;
		notes: string | null;
		category: string | null;
	};
	onClose: () => void;
	onSuccess?: () => void;
}

export function CredentialForm({
	mode,
	credential,
	onClose,
	onSuccess,
}: CredentialFormProps) {
	const action = mode === "create" ? createCredential : updateCredential;
	const [state, formAction, pending] = useActionState<CredentialState | undefined, FormData>(action, undefined);
	const [passwordValue, setPasswordValue] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

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
			<div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
					<h3 className="text-lg font-semibold text-white">
						{mode === "create" ? "Add Credential" : "Edit Credential"}
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

				<form ref={formRef} action={formAction} className="overflow-y-auto p-6 space-y-4">
					{mode === "edit" && (
						<input type="hidden" name="id" value={credential?.id} />
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label htmlFor="cred-title" className="text-xs font-medium text-zinc-400">Title *</label>
							<input
								id="cred-title"
								name="title"
								type="text"
								required
								defaultValue={credential?.title ?? ""}
								placeholder="e.g. Production Database"
								className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
								disabled={pending}
							/>
							{state?.errors?.title && (
								<p className="text-xs text-red-400 mt-1">{state.errors.title[0]}</p>
							)}
						</div>

						<div className="space-y-1.5">
							<label htmlFor="cred-category" className="text-xs font-medium text-zinc-400">Category</label>
							<input
								id="cred-category"
								name="category"
								type="text"
								defaultValue={credential?.category ?? ""}
								placeholder="e.g. Databases, Cloud"
								className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
								disabled={pending}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label htmlFor="cred-username" className="text-xs font-medium text-zinc-400">Username *</label>
						<input
							id="cred-username"
							name="username"
							type="text"
							required
							defaultValue={credential?.username ?? ""}
							placeholder="e.g. admin@example.com"
							className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
							disabled={pending}
						/>
						{state?.errors?.username && (
							<p className="text-xs text-red-400 mt-1">{state.errors.username[0]}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label htmlFor="cred-password" className="text-xs font-medium text-zinc-400">Password *</label>
						<div className="relative">
							<input
								id="cred-password"
								name="password"
								type={showPassword ? "text" : "password"}
								required
								value={passwordValue}
								onChange={(e) => setPasswordValue(e.target.value)}
								placeholder={mode === "edit" ? "Enter new password" : "Enter password"}
								className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
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
							<p className="text-xs text-red-400 mt-1">{state.errors.password[0]}</p>
						)}

						<PasswordStrength password={passwordValue} />
					</div>

					{/* Password Generator */}
					<PasswordGenerator
						onGenerate={(pw) => setPasswordValue(pw)}
					/>

					<div className="space-y-1.5">
						<label htmlFor="cred-url" className="text-xs font-medium text-zinc-400">URL</label>
						<input
							id="cred-url"
							name="url"
							type="text"
							defaultValue={credential?.url ?? ""}
							placeholder="https://example.com"
							className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
							disabled={pending}
						/>
						{state?.errors?.url && (
							<p className="text-xs text-red-400 mt-1">{state.errors.url[0]}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label htmlFor="cred-notes" className="text-xs font-medium text-zinc-400">Notes</label>
						<textarea
							id="cred-notes"
							name="notes"
							rows={3}
							defaultValue={credential?.notes ?? ""}
							placeholder="Additional notes..."
							className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 resize-y min-h-[80px]"
							disabled={pending}
						/>
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
									? "Add Credential"
									: "Update Credential"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
