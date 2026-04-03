"use client";

import { useState, useRef, useEffect } from "react";

export function InfoButton() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Comment ça marche"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-xs font-bold text-muted transition hover:bg-zinc-100 hover:text-foreground dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        i
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-[85vw] max-w-sm -translate-x-1/2 rounded-2xl border border-zinc-200 bg-card p-5 shadow-xl dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-bold">Comment ça marche</h3>
          <ol className="space-y-2 text-xs leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground">1.</span> Connectez-vous avec Google et recevez <span className="font-mono font-semibold text-accent">$100 000</span> fictifs.
            </li>
            <li>
              <span className="font-semibold text-foreground">2.</span> Proposez un pitch en une ligne — film, concept, jeu ou logiciel.
            </li>
            <li>
              <span className="font-semibold text-foreground">3.</span> Investissez sur les idées des autres (min. $10 000). Votre mise montre votre conviction.
            </li>
            <li>
              <span className="font-semibold text-foreground">4.</span> L'auteur livre une maquette, un prototype ou un deck. Les investisseurs votent pour valider.
            </li>
            <li>
              <span className="font-semibold text-foreground">5.</span> Projet validé → chaque investisseur détient des parts proportionnelles à sa mise.
            </li>
          </ol>
          <button
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-lg bg-zinc-100 py-1.5 text-xs font-medium text-muted transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Compris
          </button>
        </div>
      )}
    </div>
  );
}
