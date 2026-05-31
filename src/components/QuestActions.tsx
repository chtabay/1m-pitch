"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimQuest, claimDailyBonus } from "@/app/actions/quests";
import { fireConfetti, showToast } from "@/lib/celebrate";
import { formatUSD } from "@/lib/format";

export function ClaimButton({ questKey, label }: { questKey: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-sm btn-accent"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await claimQuest(questKey);
          if (r.ok) {
            fireConfetti();
            showToast(label, { icon: "✓", amount: r.amount ? `+${formatUSD(r.amount)}` : undefined });
            router.refresh();
          } else {
            showToast(r.message ?? "Impossible d'encaisser", { icon: "⚠" });
            router.refresh();
          }
        })
      }
    >
      {pending ? "…" : "Encaisser"}
    </button>
  );
}

export function DailyBonusButton({ icon = "📅" }: { icon?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-accent btn-block"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await claimDailyBonus();
          if (r.ok) {
            fireConfetti(60);
            showToast(`Série de ${r.streak} jour${(r.streak ?? 1) > 1 ? "s" : ""}`, {
              icon,
              amount: r.amount ? `+${formatUSD(r.amount)}` : undefined,
            });
            router.refresh();
          } else {
            showToast(r.message ?? "Déjà encaissé", { icon: "⚠" });
            router.refresh();
          }
        })
      }
    >
      🎁 Encaisser le bonus du jour
    </button>
  );
}
