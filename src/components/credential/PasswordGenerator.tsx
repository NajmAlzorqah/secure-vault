"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const t = useTranslations("generator");
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let charset = "";
    if (uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) charset += "0123456789";
    if (symbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset.length === 0) {
      charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    }

    // Use window.crypto.getRandomValues() — NOT Math.random()
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    setGenerated(password);
    onGenerate(password);
  }, [length, uppercase, lowercase, numbers, symbols, onGenerate]);

  const copyToClipboard = useCallback(async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Auto-clear clipboard after 30 seconds
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === generated) {
          await navigator.clipboard.writeText("");
        }
      } catch {
        /* ignore */
      }
    }, 30_000);
  }, [generated]);

  return (
    <div className="border border-border/80 rounded-2xl p-4 bg-muted/25 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("title")}
        </h4>
      </div>

      {/* Generated password display */}
      {generated && (
        <div className="flex items-center justify-between bg-card border border-border/80 rounded-xl p-3 gap-2 shadow-xs">
          <code
            className="text-xs font-mono font-bold text-primary break-all select-all flex-1"
            dir="ltr"
          >
            {generated}
          </code>
          <Button
            type="button"
            variant="gold"
            size="icon-xs"
            onClick={copyToClipboard}
            className="shrink-0"
            title={t("copy")}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>{t("length")}</span>
            <span className="font-extrabold text-foreground">{length}</span>
          </div>
          <input
            type="range"
            min={12}
            max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            dir="ltr"
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded-md border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <span>ABC</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              className="rounded-md border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <span>abc</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="rounded-md border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <span>123</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              className="rounded-md border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <span>#$&</span>
          </label>
        </div>
      </div>

      <Button
        type="button"
        onClick={generate}
        variant="default"
        size="sm"
        className="w-full font-bold py-2 gap-2 shadow-teal-glow cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {t("generate")}
      </Button>
    </div>
  );
}
