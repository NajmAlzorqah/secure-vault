"use client";

import { useMemo } from "react";
import zxcvbn from "zxcvbn";

interface PasswordStrengthProps {
	password: string;
}

const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const strengthColors = [
	"bg-red-500",
	"bg-orange-500",
	"bg-amber-500",
	"bg-emerald-400",
	"bg-emerald-500",
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
	const result = useMemo(() => {
		if (!password) return null;
		return zxcvbn(password);
	}, [password]);

	if (!result || !password) return null;

	const { score } = result;
	const crackTime =
		result.crack_times_display.offline_slow_hashing_1e4_per_second;

	return (
		<div className="flex flex-col gap-1.5 mt-1 bg-zinc-950/20 p-2.5 border border-zinc-900 rounded-lg">
			{/* Strength bar */}
			<div className="flex gap-1 h-1.5">
				{[0, 1, 2, 3].map((i) => (
					<div
						key={i}
						className={`flex-1 rounded-sm transition-colors duration-300 ${
							i <= score - 1 ? strengthColors[score] : "bg-zinc-800"
						}`}
					/>
				))}
			</div>

			{/* Labels */}
			<div className="flex justify-between items-center text-[10px]">
				<span
					className={`font-semibold ${
						score <= 1
							? "text-red-400"
							: score === 2
								? "text-amber-400"
								: "text-emerald-400"
					}`}
				>
					{strengthLabels[score]}
				</span>
				<span className="text-zinc-500">
					Crack time: ~{crackTime}
				</span>
			</div>

			{/* Feedback */}
			{result.feedback.warning && (
				<p className="text-[10px] text-amber-500 leading-tight">
					⚠ {result.feedback.warning}
				</p>
			)}
			{result.feedback.suggestions.length > 0 && (
				<p className="text-[10px] text-zinc-400 leading-tight">
					💡 {result.feedback.suggestions[0]}
				</p>
			)}
		</div>
	);
}
