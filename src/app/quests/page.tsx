import { getUser, getQuestsState } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatUSDCompact } from "@/lib/format";
import { Icon } from "@/components/ui";
import { ClaimButton, DailyBonusButton } from "@/components/QuestActions";
import { QUESTS, resolveQuest, computeLevel, nextDailyBonus, type QuestsState } from "@/lib/game";

export const revalidate = 0;

type ResolvedQuest = ReturnType<typeof resolveQuest>;

function QuestRow({ q }: { q: ResolvedQuest }) {
  const pct = Math.min(100, (q.progress / q.goal) * 100);
  return (
    <div className="card-flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ fontSize: 26, width: 40, textAlign: "center" }}>{q.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{q.title}</span>
          <span className="mono" style={{ fontWeight: 800, color: "var(--accent-dark)", fontSize: 13, whiteSpace: "nowrap" }}>
            +{formatUSDCompact(q.reward)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="bar" style={{ flex: 1 }}>
            <div className="bar-fill" style={{ width: pct + "%" }} />
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)", minWidth: 30, textAlign: "right" }}>
            {q.progress}/{q.goal}
          </span>
        </div>
      </div>
      {q.done &&
        (q.claimed ? (
          <span className="btn btn-sm btn-ghost" style={{ pointerEvents: "none" }}>✓</span>
        ) : (
          <ClaimButton questKey={q.key} label={q.title} />
        ))}
    </div>
  );
}

export default async function QuestsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const st = (await getQuestsState()) as QuestsState | null;
  if (!st) {
    return (
      <div className="view-in app-shell" style={{ paddingTop: 40, maxWidth: 680, textAlign: "center" }}>
        <p className="serif italic" style={{ color: "var(--muted)" }}>Quêtes indisponibles pour le moment.</p>
      </div>
    );
  }

  const level = computeLevel({
    votesTotal: st.metrics.votes_total,
    pitchesTotal: st.metrics.pitches_total,
    sharesTotal: st.metrics.shares_total,
  });
  const daily = QUESTS.filter((d) => d.period === "daily").map((d) => resolveQuest(d, st));
  const weekly = QUESTS.filter((d) => d.period === "weekly").map((d) => resolveQuest(d, st));
  const bonusAmount = nextDailyBonus(st.streak);

  return (
    <div className="view-in app-shell" style={{ paddingTop: 22, paddingBottom: 40, maxWidth: 680 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 4 }}>
          Progression
        </div>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 900 }}>Quêtes &amp; bonus</h1>
      </div>

      {/* level + streak banner */}
      <div className="card" style={{ padding: 18, marginBottom: 24, background: "linear-gradient(135deg, var(--card), var(--accent-soft))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--ink)", color: "var(--card)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 20 }}>
            {level.level}
          </div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontWeight: 800, fontSize: 16 }}>Niveau {level.level} · {level.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }} className="mono">
              {level.xp} XP{level.next ? ` / ${level.next}` : " · max"}
            </div>
          </div>
          <span className="flame live" style={{ fontSize: 14, padding: "5px 10px", border: "1px solid var(--ink)", borderRadius: 999, background: "var(--card)" }}>
            <Icon name="flame" size={15} /> {st.streak}j
          </span>
        </div>
        <div className="bar">
          <div className="bar-fill shine" style={{ width: level.progress + "%" }} />
        </div>
      </div>

      {/* daily bonus */}
      <section style={{ marginBottom: 26 }}>
        <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Bonus quotidien</h3>
        {st.daily_bonus_claimed ? (
          <div className="card-flat" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, opacity: 0.7 }}>
            <div style={{ fontSize: 26 }}>📅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Bonus encaissé</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Reviens demain pour prolonger ta série.</div>
            </div>
            <span className="btn btn-sm btn-ghost" style={{ pointerEvents: "none" }}>✓</span>
          </div>
        ) : (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 30 }}>📅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Connexion du jour</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Série de {st.streak} jour{st.streak > 1 ? "s" : ""} — encaisse pour la prolonger.
                </div>
              </div>
              <span className="mono" style={{ fontWeight: 900, color: "var(--accent-dark)", fontSize: 20 }}>+{formatUSDCompact(bonusAmount)}</span>
            </div>
            <DailyBonusButton />
          </div>
        )}
      </section>

      <section style={{ marginBottom: 26 }}>
        <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Aujourd&apos;hui</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {daily.map((q) => <QuestRow key={q.key} q={q} />)}
        </div>
      </section>

      <section>
        <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Cette semaine</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {weekly.map((q) => <QuestRow key={q.key} q={q} />)}
        </div>
      </section>
    </div>
  );
}
