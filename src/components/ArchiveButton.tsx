"use client";

import { archivePitch, unarchivePitch } from "@/app/actions/pitches";
import { useTransition } from "react";

type Props = {
  pitchId: string;
  archived: boolean;
};

export function ArchiveButton({ pitchId, archived }: Props) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (archived) {
      startTransition(() => unarchivePitch(pitchId));
      return;
    }
    if (!confirm("Archiver cette carte ? Elle sera masquée de l'accueil.")) return;
    startTransition(() => archivePitch(pitchId));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border-2 border-ink bg-card px-3 py-1.5 text-xs font-semibold shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none disabled:opacity-50"
    >
      {pending ? "…" : archived ? "↻ Désarchiver" : "🗄 Archiver"}
    </button>
  );
}
