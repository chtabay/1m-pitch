"use client";

import { postMessage } from "@/app/actions/pitches";
import { useTransition, useRef } from "react";

type Props = {
  pitchId: string;
};

export function MessageForm({ pitchId }: Props) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await postMessage(pitchId, formData);
      formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="content"
        required
        maxLength={2000}
        placeholder="Message…"
        className="flex-1 rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "…" : "→"}
      </button>
    </form>
  );
}
