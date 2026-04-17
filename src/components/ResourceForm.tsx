"use client";

import { updateResources } from "@/app/actions/pitches";
import { useState, useTransition } from "react";

type Props = {
  pitchId: string;
  currentUrl?: string | null;
  currentDescription?: string | null;
};

const BTN_3D =
  "rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-semibold shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none";

export function ResourceForm({ pitchId, currentUrl, currentDescription }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      updateResources(pitchId, formData);
      setOpen(false);
    });
  };

  const hasExisting = currentUrl || currentDescription;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${BTN_3D} bg-card text-zinc-900`}
      >
        {hasExisting ? "✎ Modifier" : "+ Ajouter"}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <form
        action={handleSubmit}
        className="w-full max-w-lg space-y-5 rounded-2xl border-2 border-ink bg-card p-6 shadow-[8px_8px_0_0_theme(colors.ink)]"
      >
        <div className="-mx-6 -mt-6 mb-2 flex items-center justify-between rounded-t-2xl bg-accent px-6 py-3 border-b-2 border-ink">
          <h3 className="font-serif text-lg font-black text-zinc-900">
            📦 Ressources
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xl leading-none text-zinc-900 hover:text-zinc-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div>
          <label htmlFor="poc_url" className="mb-1 block text-sm font-semibold">
            Lien <span className="font-normal text-muted">(optionnel)</span>
          </label>
          <input
            type="url"
            name="poc_url"
            id="poc_url"
            defaultValue={currentUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-lg border-2 border-ink bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="poc_description" className="mb-1 block text-sm font-semibold">
            Description <span className="font-normal text-muted">(optionnel)</span>
          </label>
          <textarea
            name="poc_description"
            id="poc_description"
            rows={3}
            maxLength={1000}
            defaultValue={currentDescription ?? ""}
            placeholder="Explique en quelques mots…"
            className="w-full resize-none rounded-lg border-2 border-ink bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="images" className="mb-1 block text-sm font-semibold">
            Fichiers <span className="font-normal text-muted">(optionnel, max 5 Mo)</span>
          </label>
          <input
            type="file"
            name="images"
            id="images"
            multiple
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-2 file:border-ink file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-semibold"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className={`${BTN_3D} flex-1 bg-accent text-zinc-900 disabled:opacity-50`}
          >
            {pending ? "Envoi…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`${BTN_3D} bg-card text-zinc-900`}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
