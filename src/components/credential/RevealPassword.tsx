"use client";

import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

interface RevealPasswordProps {
  credentialId: string;
}

export function RevealPassword({ credentialId }: RevealPasswordProps) {
  const [password, setPassword] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reveal = useCallback(async () => {
    if (password) {
      setVisible(!visible);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/credentials/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to reveal password");
      }

      const data = await res.json();
      setPassword(data.password);
      setVisible(true);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setVisible(false);
        setPassword(null);
      }, 10_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [credentialId, password, visible]);

  const copyToClipboard = useCallback(async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Auto-clear clipboard after 30 seconds for security
      setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === password) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // Clipboard access may be denied
        }
      }, 30_000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }, [password]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {/* Reveal/Hide button */}
        <button
          onClick={reveal}
          disabled={loading}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={visible ? "Hide password" : "Reveal password"}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : visible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Copy button */}
        {password && (
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer transition-all"
            title="Copy to clipboard (auto-clears in 30s)"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Masked or revealed password */}
      <span className="font-mono text-xs text-zinc-300">
        {visible && password ? password : "••••••••"}
      </span>

      {error && <span className="text-red-400 text-[10px] ml-1">{error}</span>}
    </div>
  );
}
