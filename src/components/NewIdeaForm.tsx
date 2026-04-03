"use client";

import { createIdea } from "@/app/actions/pitches";
import { useTransition, useState } from "react";

type Props = {
  parentId: string;
  depthLabel: string;
};

export function NewIdeaForm({ parentId, depthLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent dark:border-zinc-700"
      >
        + {depthLabel}
      </button>
    );
  }

  const handleSubmit = (formData: FormData) => {
    startTransition(() => createIdea(parentId, formData));
  };

  return (
    <form action={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <input
        type="text"
        name="title"
        required
        maxLength={200}
        placeholder="Titre"
        className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
      />
      <textarea
        name="one_liner"
        required
        maxLength={500}
        rows={2}
        placeholder="Décris l'idée en une ligne"
        className="w-full resize-none rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-accent-dark disabled:opacity-50"
        >
          {pending ? "…" : "Publier"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-muted transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
