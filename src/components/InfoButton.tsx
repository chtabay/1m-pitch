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
        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-zinc-900 shadow-sm transition hover:bg-accent-dark hover:scale-110"
      >
        ?
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-[85vw] max-w-sm -translate-x-1/2 rounded-2xl border border-zinc-200 bg-card p-5 shadow-xl dark:border-zinc-800">
          <h3 className="mb-1 text-sm font-bold">Comment ça marche</h3>
          <p className="mb-3 text-xs text-muted">Certains films mythiques sont nés d'une seule ligne. Et si votre idée valait un million ?</p>

          <ol className="space-y-2.5 text-xs leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-accent">1.</span> Connectez-vous et recevez <span className="font-mono font-semibold text-accent">$100 000</span> fictifs — votre capital de départ.
            </li>
            <li>
              <span className="font-semibold text-accent">2.</span> Pitchez une idée en une ligne : film, concept, jeu ou logiciel. La foule décide.
            </li>
            <li>
              <span className="font-semibold text-accent">3.</span> Investissez sur les projets qui vous parlent (min. $10 000). Plus vous misez, plus vous croyez.
            </li>
            <li>
              <span className="font-semibold text-accent">4.</span> L'auteur soumet un livrable — maquette, prototype, vidéo ou deck. Les investisseurs votent pour valider ou rejeter.
            </li>
            <li>
              <span className="font-semibold text-accent">5.</span> Projet validé → chaque investisseur détient des <span className="font-semibold text-foreground">parts proportionnelles</span> à sa mise.
            </li>
          </ol>

          <div className="mt-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
            <p className="mb-1 text-xs font-semibold text-foreground">Raffiner ensemble</p>
            <p className="text-xs text-muted">
              Les investisseurs et l'auteur peuvent proposer des <span className="font-semibold text-foreground">sous-idées</span> pour explorer des variantes. Chaque sous-idée peut elle-même engendrer des <span className="font-semibold text-foreground">limbes</span> — un espace de discussion libre pour affiner le concept en profondeur.
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-lg bg-accent py-2 text-xs font-semibold text-zinc-900 transition hover:bg-accent-dark"
          >
            Compris
          </button>
        </div>
      )}
    </div>
  );
}
