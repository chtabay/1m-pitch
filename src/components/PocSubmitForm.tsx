"use client";

import { submitPoc } from "@/app/actions/pitches";
import { useTransition, useRef } from "react";

type Props = {
  pitchId: string;
};

export function PocSubmitForm({ pitchId }: Props) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => submitPoc(pitchId, formData));
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="poc_url" className="mb-1 block text-sm font-medium">
          Livrable (maquette, page, vidéo, démo...)
        </label>
        <input
          type="url"
          name="poc_url"
          id="poc_url"
          placeholder="https://..."
          className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
        />
      </div>

      <div>
        <label htmlFor="deck_url" className="mb-1 block text-sm font-medium">
          Deck (présentation, slides...)
        </label>
        <input
          type="url"
          name="deck_url"
          id="deck_url"
          placeholder="https://..."
          className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
        />
      </div>

      <div>
        <label
          htmlFor="poc_description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          name="poc_description"
          id="poc_description"
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
        />
      </div>

      <div>
        <label htmlFor="images" className="mb-1 block text-sm font-medium">
          Images (max 5 Mo chacune)
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

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-zinc-900 transition hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Soumettre le livrable"}
      </button>
    </form>
  );
}
