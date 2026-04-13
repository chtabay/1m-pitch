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
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-accent text-sm font-extrabold text-zinc-900 shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
      >
        i
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-[85vw] max-w-md -translate-x-1/2 rounded-2xl border-2 border-ink bg-card p-6 shadow-[6px_6px_0_0_theme(colors.ink)]">
          <h3 className="mb-1 font-serif text-base font-bold">Comment ça marche</h3>
          <p className="mb-4 text-xs text-muted">Un marché fictif pour tester la valeur d'une idée avant qu'elle existe.</p>
          <ol className="space-y-2.5 text-xs leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground">1.</span> Connectez-vous et recevez <span className="font-mono font-semibold text-accent">$100 000</span> fictifs — votre capital de départ.
            </li>
            <li>
              <span className="font-semibold text-foreground">2.</span> Pitchez une idée en une ligne : film, concept, jeu ou logiciel. La foule décide de sa valeur.
            </li>
            <li>
              <span className="font-semibold text-foreground">3.</span> Investissez sur les idées des autres (min. $10 000). Plus une idée est financée, plus elle attire l'attention.
            </li>
            <li>
              <span className="font-semibold text-foreground">4.</span> Les investisseurs peuvent proposer des <span className="font-semibold text-foreground">sous-idées</span> pour raffiner le concept, et même des <span className="font-semibold text-foreground">limbes</span> — un espace de discussion en profondeur.
            </li>
            <li>
              <span className="font-semibold text-foreground">5.</span> L'auteur livre un prototype, une maquette ou un deck. Les investisseurs votent pour valider le livrable.
            </li>
            <li>
              <span className="font-semibold text-foreground">6.</span> Projet validé → chaque investisseur détient des parts proportionnelles à sa mise. Vous devenez actionnaire de l'idée.
            </li>
          </ol>
          <button
            onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-lg border border-ink bg-accent py-2 text-xs font-semibold text-zinc-900 shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
          >
            Compris
          </button>
        </div>
      )}
    </div>
  );
}
