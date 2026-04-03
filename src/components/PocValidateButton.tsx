"use client";

import { validatePoc } from "@/app/actions/pitches";
import { useTransition } from "react";

type Props = {
  pitchId: string;
  currentVote: boolean | null;
};

export function PocValidateButton({ pitchId, currentVote }: Props) {
  const [pending, startTransition] = useTransition();

  const vote = (approved: boolean) => {
    startTransition(() => validatePoc(pitchId, approved));
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => vote(true)}
        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition disabled:opacity-50 ${
          currentVote === true
            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
            : "border border-zinc-300 text-muted hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        }`}
      >
        ✓ Valider
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => vote(false)}
        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition disabled:opacity-50 ${
          currentVote === false
            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            : "border border-zinc-300 text-muted hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        }`}
      >
        ✗ Rejeter
      </button>
    </div>
  );
}
