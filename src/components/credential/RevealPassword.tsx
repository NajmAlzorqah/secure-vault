"use client";

import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface RevealPasswordProps {
  credentialId: string;
}

export function RevealPassword({ credentialId }: RevealPasswordProps) {
  const t = useTranslations("reveal");
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
        throw new Error(data.error ?? t("revealFailed"));
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
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  }, [credentialId, password, visible, t]);

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
      setError(t("copyFailed"));
    }
  }, [password, t]);

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5">
        {/* Reveal/Hide button */}
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={reveal}
          disabled={loading}
          className="rounded-full cursor-pointer"
          title={visible ? t("hideTitle") : t("showTitle")}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          ) : visible ? (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Eye className="h-3 w-3 text-primary" />
          )}
        </Button>

        {/* Copy button in Gold CTA */}
        {password && (
          <Button
            type="button"
            variant="gold"
            size="icon-xs"
            onClick={copyToClipboard}
            className="rounded-full cursor-pointer shadow-accent-glow/20"
            title={t("copyTitle")}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Masked or revealed password */}
      <span className="font-mono text-xs font-bold text-foreground" dir="ltr">
        {visible && password ? password : "••••••••"}
      </span>

      {error && <span className="text-coral text-[10px] font-medium ms-1">{error}</span>}
    </div>
  );
}
