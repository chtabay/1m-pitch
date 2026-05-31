import Link from "next/link";
import { formatUSDCompact } from "@/lib/format";
import { KindChip, Flame, Sparkline, Icon, sparkData, seedFrom } from "./ui";

type Props = {
  pitchId: string;
  kind: string;
  title: string;
  funded: number;
  invested24h: number;
  velocity: number;
  rank: number;
};

export function MomentumCard({ pitchId, kind, title, funded, invested24h, velocity, rank }: Props) {
  const sp = sparkData(seedFrom(pitchId), Math.max(0.3, velocity / 40));
  return (
    <Link
      href={`/pitch/${pitchId}`}
      className="card"
      style={{ minWidth: 248, maxWidth: 248, flex: "0 0 auto", padding: 15, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="serif" style={{ fontWeight: 900, fontSize: 18, color: "var(--muted-2)" }}>#{rank}</span>
        <Flame velocity={velocity} live />
      </div>
      <div>
        <KindChip kind={kind} />
        <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15, margin: "8px 0 0" }}>{title}</h3>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
        <div>
          <div className="mono" style={{ fontWeight: 800, color: "var(--accent-dark)", fontSize: 15 }}>{formatUSDCompact(funded)}</div>
          {invested24h > 0 && (
            <div className="delta tag-gain" style={{ marginTop: 4, fontSize: 11 }}>
              <Icon name="arrowUp" size={11} />+{formatUSDCompact(invested24h)} / 24h
            </div>
          )}
        </div>
        <Sparkline data={sp} w={70} h={30} color="var(--hot)" />
      </div>
    </Link>
  );
}
