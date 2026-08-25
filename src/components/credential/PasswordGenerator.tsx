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
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {t("title")}
        </h4>
      </div>

      {/* Generated password display */}
      {generated && (
        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 gap-2">
          <code
            className="text-xs font-mono text-emerald-400 break-all select-all flex-1"
            dir="ltr"
          >
            {generated}
          </code>
          <button
            type="button"
            onClick={copyToClipboard}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer ms-2 transition-all shrink-0"
            title={t("copy")}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{t("length")}</span>
            <span className="font-semibold text-white">{length}</span>
          </div>
          <input
            type="range"
            min={12}
            max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            dir="ltr"
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded border-zinc-800 text-emerald-600 focus:ring-emerald-500/20 bg-zinc-950 accent-emerald-500"
            />
            <span>ABC</span>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              className="rounded border-zinc-800 text-emerald-600 focus:ring-emerald-500/20 bg-zinc-950 accent-emerald-500"
            />
            <span>abc</span>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="rounded border-zinc-800 text-emerald-600 focus:ring-emerald-500/20 bg-zinc-950 accent-emerald-500"
            />
            <span>123</span>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              className="rounded border-zinc-800 text-emerald-600 focus:ring-emerald-500/20 bg-zinc-950 accent-emerald-500"
            />
            <span>#$&</span>
          </label>
        </div>
      </div>

      <Button
        type="button"
        onClick={generate}
        variant="outline"
        className="w-full text-xs font-semibold py-1.5 gap-2 border-zinc-800 text-white bg-zinc-900 hover:bg-zinc-800"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {t("generate")}
      </Button>
    </div>
  );
}
