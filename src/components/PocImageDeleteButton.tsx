"use client";

import { deletePocImage } from "@/app/actions/pitches";
import { useTransition } from "react";

type Props = {
  imageId: string;
  pitchId: string;
};

export function PocImageDeleteButton({ imageId, pitchId }: Props) {
  const [pending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Supprimer cette image ?")) return;
    startTransition(() => deletePocImage(imageId, pitchId));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Supprimer cette image"
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-card text-sm font-bold shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none disabled:opacity-50"
    >
      {pending ? "…" : "✕"}
    </button>
  );
}
