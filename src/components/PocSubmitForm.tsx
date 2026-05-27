"use client";

import { submitPoc } from "@/app/actions/pitches";
import { useTransition, useRef, useState } from "react";

const MAX_FILE_SIZE = 5_000_000;

type Props = {
  pitchId: string;
};

export function PocSubmitForm({ pitchId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    const files = formData.getAll("images") as File[];
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`"${oversized.name}" dépasse 5 Mo. Compresse-la avant l'envoi.`);
      return;
    }
    setError(null);
    startTransition(() => submitPoc(pitchId, formData));
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="poc_url" className="mb-1 block text-sm font-semibold">
          📄 Livrable <span className="font-normal text-muted">(maquette, page, vidéo, démo…)</span>
        </label>
        <input
          type="url"
          name="poc_url"
          id="poc_url"
          placeholder="https://..."
          className="w-full rounded-lg border-2 border-ink bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="deck_url" className="mb-1 block text-sm font-semibold">
          📊 Deck <span className="font-normal text-muted">(présentation, slides…)</span>
        </label>
        <input
          type="url"
          name="deck_url"
          id="deck_url"
          placeholder="https://..."
          className="w-full rounded-lg border-2 border-ink bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="poc_description" className="mb-1 block text-sm font-semibold">
          Description
        </label>
        <textarea
          name="poc_description"
          id="poc_description"
          rows={3}
          maxLength={1000}
          placeholder="Raconte ton livrable en quelques lignes…"
          className="w-full resize-none rounded-lg border-2 border-ink bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="images" className="mb-1 block text-sm font-semibold">
          Images <span className="font-normal text-muted">(max 5 Mo chacune)</span>
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

      {error && (
        <p className="rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border-2 border-ink bg-accent py-3 text-sm font-bold text-zinc-900 shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Soumettre le livrable"}
      </button>
    </form>
  );
}
