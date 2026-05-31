import { createClient, getUser, getUserBalance } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatUSD, formatUSDCompact } from "@/lib/format";
import { Delta, Sparkline, sparkData, seedFrom } from "@/components/ui";
import { kindMeta, roiPct, summarizePortfolio, type Position } from "@/lib/game";

export const revalidate = 0;

export default async function PortfolioPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const [{ data: portfolioData }, balance] = await Promise.all([
    supabase.rpc("get_portfolio", { p_user: user.id }),
    getUserBalance(user.id),
  ]);

  const positions = ((portfolioData as Position[]) ?? []).filter((p) => p.amount > 0);
  const { invested, value, gain, pct, shares } = summarizePortfolio(positions);
  const netWorth = balance + value;

  return (
    <div className="view-in app-shell" style={{ paddingTop: 22, paddingBottom: 40, maxWidth: 720 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 4 }}>
          Tes positions
        </div>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 900 }}>Portfolio</h1>
      </div>

      {/* net worth hero */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Valeur nette (capital + positions)</div>
        <div className="mono" style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-.02em" }}>{formatUSD(netWorth)}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Capital dispo</div>
            <div className="mono" style={{ fontWeight: 700 }}>{formatUSD(balance)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Investi</div>
            <div className="mono" style={{ fontWeight: 700 }}>{formatUSD(invested)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Plus / moins-value</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="mono" style={{ fontWeight: 800, color: gain >= 0 ? "var(--gain)" : "var(--loss)" }}>
                {gain >= 0 ? "+" : ""}{formatUSD(gain)}
              </span>
              {invested > 0 && <Delta pct={pct} small />}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Parts</div>
            <div className="mono" style={{ fontWeight: 700 }}>{shares}</div>
          </div>
        </div>
      </div>

      <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Positions ouvertes</h3>

      {positions.length === 0 ? (
        <div className="card-flat" style={{ borderStyle: "dashed", padding: "48px 24px", textAlign: "center" }}>
          <p className="serif italic" style={{ fontSize: 20, color: "var(--muted)", marginBottom: 16 }}>Aucune position.</p>
          <Link href="/" className="btn btn-accent">Découvrir des idées</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {positions.map((p) => {
            const pr = roiPct(p);
            const up = pr >= 0;
            const sharePct = p.current_total > 0 ? (p.amount / p.current_total) * 100 : 0;
            const sp = sparkData(seedFrom(p.pitch_id), pr / 40);
            return (
              <Link
                key={p.pitch_id}
                href={`/pitch/${p.pitch_id}`}
                className="card-flat"
                style={{ padding: 14, display: "flex", alignItems: "center", gap: 14 }}
              >
                <div style={{ fontSize: 22, width: 30, textAlign: "center" }}>{kindMeta(p.kind).emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </span>
                    {p.status === "validated" && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--gain)", background: "var(--gain-bg)", padding: "1px 6px", borderRadius: 6 }}>
                        ACTIONNAIRE
                      </span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {formatUSDCompact(p.amount)} → {formatUSDCompact(p.value)}
                  </div>
                </div>
                <Sparkline data={sp} w={56} h={26} color={up ? "var(--gain)" : "var(--loss)"} />
                <div style={{ textAlign: "right", minWidth: 74 }}>
                  <Delta pct={pr} />
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{sharePct.toFixed(1)}% part</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
