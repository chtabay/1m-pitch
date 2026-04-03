"use client";

import { updateResources } from "@/app/actions/pitches";
import { useState, useTransition } from "react";

type Props = {
  pitchId: string;
  currentUrl?: string | null;
  currentDescription?: string | null;
};

export function ResourceForm({ pitchId, currentUrl, currentDescription }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => updateResources(pitchId, formData));
  };

  const hasExisting = currentUrl || currentDescription;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-accent hover:underline"
      >
        {hasExisting ? "✎ Modifier" : "+ Ressource"}
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-2xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
      <div>
        <label htmlFor="poc_url" className="mb-1 block text-sm font-medium">
          Lien (optionnel)
        </label>
        <input
          type="url"
          name="poc_url"
          id="poc_url"
          defaultValue={currentUrl ?? ""}
          placeholder="https://..."
          className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
        />
      </div>

      <div>
        <label htmlFor="poc_description" className="mb-1 block text-sm font-medium">
          Description (optionnel)
        </label>
        <textarea
          name="poc_description"
          id="poc_description"
          rows={2}
          maxLength={1000}
          defaultValue={currentDescription ?? ""}
          className="w-full resize-none rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
        />
      </div>

      <div>
        <label htmlFor="images" className="mb-1 block text-sm font-medium">
          Fichiers (optionnel, max 5 Mo)
        </label>
        <input
          type="file"
          name="images"
          id="images"
          multiple
          accept="image/*"
          className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:bg-zinc-800"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-accent-dark disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Enregistrer"}
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
