import { createClient, getUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatUSD, formatUSDCompact, timeAgo } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/StatusBadge";
import {
  computeLevel,
  computeBadges,
  summarizePortfolio,
  roiPct,
  kindMeta,
  type Position,
} from "@/lib/game";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, user, { data: pitches }, { data: investments }, { data: portfolioData }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url, balance, created_at").eq("id", id).single(),
      getUser(),
      supabase.from("pitch_stats").select("*").eq("author_id", id).order("created_at", { ascending: false }),
      supabase.from("votes").select("id, amount, created_at, pitch_id").eq("voter_id", id).order("created_at", { ascending: false }),
      supabase.rpc("get_portfolio", { p_user: id }),
    ]);

  if (!profile) notFound();

  const isOwner = user?.id === profile.id;
  const positions = ((portfolioData as Position[]) ?? []).filter((p) => p.amount > 0);

  const investedPitchIds = (investments ?? []).map((v) => v.pitch_id);
  const { data: investedPitches } = await supabase
    .from("pitches")
    .select("id, title, status")
    .in("id", investedPitchIds.length > 0 ? investedPitchIds : ["__none__"]);
  const investedPitchMap = new Map((investedPitches ?? []).map((p) => [p.id, p]));

  const allPitches = pitches ?? [];
  const depth0 = allPitches.filter((p) => p.depth === 0);
  const activePitches = allPitches.filter((p) => !p.archived_at);
  const archivedPitches = allPitches.filter((p) => p.archived_at);
  const fundedPitches = activePitches.filter((p) => p.potential_usd > 0);

  const summary = summarizePortfolio(positions);
  const level = computeLevel({
    votesTotal: (investments ?? []).length,
    pitchesTotal: depth0.length,
    sharesTotal: summary.shares,
  });
  const badges = computeBadges({
    votesTotal: (investments ?? []).length,
    pitchesTotal: depth0.length,
    sharesTotal: summary.shares,
    bestRoiPct: positions.reduce((m, p) => Math.max(m, roiPct(p)), 0),
    filmInvest: positions.filter((p) => p.kind === "film").length,
  });

  const initial = (profile.display_name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="view-in app-shell" style={{ paddingTop: 22, paddingBottom: 40, maxWidth: 720 }}>
      {/* identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={64} height={64} style={{ width: 64, height: 64, borderRadius: 18, border: "1.5px solid var(--ink)" }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--accent)", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, color: "#2a1c05", boxShadow: "var(--shadow-sm)" }}>
            {initial}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 900 }}>{profile.display_name ?? "Anonyme"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span className="pill" style={{ borderColor: "var(--ink)", color: "var(--foreground)", fontWeight: 700 }}>
              Niv. {level.level} · {level.name}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(profile.created_at)}</span>
          </div>
        </div>
        {isOwner && (
          <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-dark)" }}>{formatUSD(profile.balance)}</span>
        )}
      </div>

      {/* stat grid */}
      <div className="stat-grid" style={{ marginBottom: 14 }}>
        {[
          [depth0.length, "pitchs"],
          [(investments ?? []).length, "positions"],
          [formatUSDCompact(summary.invested), "investi"],
          [summary.shares, "parts"],
        ].map(([value, label], i) => (
          <div key={i} className="card-flat" style={{ padding: "14px 12px", textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ROI strip */}
      {positions.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 26, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Rendement global</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="mono" style={{ fontSize: 24, fontWeight: 900, color: summary.pct >= 0 ? "var(--gain)" : "var(--loss)" }}>
                {summary.pct >= 0 ? "+" : ""}{summary.pct.toFixed(1)}%
              </span>
              <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                {summary.gain >= 0 ? "+" : ""}{formatUSDCompact(summary.gain)}
              </span>
            </div>
          </div>
          {isOwner && <Link href="/portfolio" className="btn btn-sm btn-ghost">Voir le portfolio →</Link>}
        </div>
      )}

      {/* badges */}
      <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Distinctions</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 28 }}>
        {badges.map((b) => (
          <div key={b.id} className="card-flat" style={{ padding: 13, display: "flex", gap: 11, alignItems: "center", opacity: b.earned ? 1 : 0.45, filter: b.earned ? "none" : "grayscale(1)" }}>
            <div style={{ fontSize: 26 }}>{b.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{b.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.3 }}>{b.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* my pitches */}
      {fundedPitches.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Pitchs financés</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {fundedPitches.map((p) => (
              <Link key={p.pitch_id} href={`/pitch/${p.pitch_id}`} className="card-flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 20 }}>{kindMeta(p.kind).emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.vote_count} investisseurs</div>
                </div>
                <span className="mono" style={{ fontWeight: 800, color: "var(--accent-dark)" }}>{formatUSDCompact(p.potential_usd)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* portfolio shares */}
      {positions.filter((p) => p.status === "validated").length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Parts d&apos;actionnaire</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {positions
              .filter((p) => p.status === "validated")
              .map((p) => (
                <Link key={p.pitch_id} href={`/pitch/${p.pitch_id}`} className="card-flat" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{formatUSDCompact(p.amount)} sur {formatUSDCompact(p.current_total)}</div>
                  </div>
                  <span className="mono" style={{ fontWeight: 800, color: "var(--gain)" }}>
                    {p.current_total > 0 ? ((p.amount / p.current_total) * 100).toFixed(1) : "0"}%
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* recent investments */}
      {(investments ?? []).length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Investissements récents</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {(investments ?? []).slice(0, 12).map((v) => {
              const pitch = investedPitchMap.get(v.pitch_id);
              return (
                <Link key={v.id} href={`/pitch/${v.pitch_id}`} className="card-flat" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pitch?.title ?? "—"}</span>
                      {pitch?.status && pitch.status !== "open" && (
                        <StatusBadge status={pitch.status as "open" | "poc_submitted" | "validated" | "rejected"} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(v.created_at)}</div>
                  </div>
                  <span className="mono" style={{ fontWeight: 800, color: "var(--accent-dark)" }}>{formatUSDCompact(v.amount)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* archives (owner) */}
      {isOwner && archivedPitches.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            🗄 Archives ({archivedPitches.length})
          </summary>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {archivedPitches.map((p) => (
              <Link key={p.pitch_id} href={`/pitch/${p.pitch_id}`} className="card-flat" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, opacity: 0.6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                {p.potential_usd > 0 && <span className="mono" style={{ color: "var(--accent-dark)", fontWeight: 700 }}>{formatUSDCompact(p.potential_usd)}</span>}
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
