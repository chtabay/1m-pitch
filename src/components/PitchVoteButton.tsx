"use client";

import { invest, withdrawVote } from "@/app/actions/pitches";
import { useState, useTransition } from "react";
import { formatUSD } from "@/lib/format";

type Props = {
  pitchId: string;
  hasVoted: boolean;
  userBalance: number;
  disabled?: boolean;
};

const STEP = 10000;
const MIN = 10000;

export function PitchVoteButton({
  pitchId,
  hasVoted,
  userBalance,
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const maxAmount = Math.floor(userBalance / STEP) * STEP;
  const [amount, setAmount] = useState(Math.max(MIN, Math.min(MIN, maxAmount)));
  const [error, setError] = useState<string | null>(null);

  if (hasVoted) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => withdrawVote(pitchId))}
        className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 disabled:opacity-50"
      >
        {pending ? "…" : "★ Investi"}
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled || userBalance < MIN}
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        ☆ Investir
      </button>
    );
  }

  const handleInvest = () => {
    setError(null);
    startTransition(async () => {
      const result = await invest(pitchId, amount);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={MIN}
        max={Math.max(MIN, maxAmount)}
        step={STEP}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="h-1.5 w-20 cursor-pointer accent-amber-500"
      />
      <span className="min-w-[70px] text-xs font-mono font-semibold text-accent">
        {formatUSD(amount)}
      </span>
      <button
        type="button"
        disabled={pending || amount > userBalance}
        onClick={handleInvest}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-zinc-900 transition hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "…" : "Go"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-muted hover:text-foreground"
      >
        ✕
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
