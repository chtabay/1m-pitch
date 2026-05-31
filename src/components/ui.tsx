// ============================================================
// Presentational UI primitives for the 1M Pitch redesign.
// Server components (no hooks) — safe to use anywhere.
// ============================================================
import { formatUSD, formatPct } from "@/lib/format";
import { kindMeta, HOT_THRESHOLD } from "@/lib/game";

// ---------- icon set (stroke, currentColor) ----------
const ICON_PATHS: Record<string, React.ReactNode> = {
  flux: <path d="M3 12h4l2 6 4-14 2 8h6" />,
  quests: (
    <>
      <path d="M9 11l2 2 4-4" />
      <path d="M5 4h14a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1Z" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M16 12h2" />
      <path d="M3 9h14a1 1 0 0 1 1 1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  flame: <path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1.5.6-2.4 1.2-3.2C10 9 11 7.5 12 3Z" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  back: <path d="M15 18l-6-6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M3 12h18M12 8v13M12 8S10 3 7.5 4 9 8 12 8Zm0 0s2-5 4.5-4S15 8 12 8Z" />
    </>
  ),
};

export function Icon({ name, size = 22 }: { name: keyof typeof ICON_PATHS | string; size?: number }) {
  return (
    <svg
      className="tab-ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICON_PATHS[name] ?? null}
    </svg>
  );
}

// ---------- sparkline (deterministic pseudo-series from a seed) ----------
export function sparkData(seed: number, trend: number): number[] {
  const pts: number[] = [];
  let v = 18 + (seed % 9);
  for (let i = 0; i < 12; i++) {
    v += Math.sin(seed + i * 1.3) * 6 + trend * i * 0.9 + (i % 3 === 0 ? 3 : -1);
    pts.push(Math.max(4, v));
  }
  return pts;
}

export function seedFrom(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h;
}

export function Sparkline({
  data,
  w = 64,
  h = 22,
  color = "var(--hot)",
  fill = true,
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / rng) * (h - 3) - 1.5]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const id = "sg" + Math.round(data[0] * 100 + w + h);
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.28" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- flame / momentum badge ----------
export function Flame({ velocity, live }: { velocity: number; live?: boolean }) {
  return (
    <span className={"flame" + (live && velocity >= HOT_THRESHOLD ? " live" : "")} title={`Momentum ${velocity}/100`}>
      <Icon name="flame" size={14} />
      {velocity}
    </span>
  );
}

// ---------- kind chip ----------
export function KindChip({ kind }: { kind: string }) {
  const m = kindMeta(kind);
  return (
    <span className={"chip " + m.chip}>
      {m.emoji} {m.label}
    </span>
  );
}

// ---------- ROI delta ----------
export function Delta({ pct, small }: { pct: number; small?: boolean }) {
  const up = pct >= 0;
  return (
    <span className={"delta " + (up ? "tag-gain" : "tag-loss")} style={small ? { fontSize: 11 } : undefined}>
      <Icon name={up ? "arrowUp" : "arrowDown"} size={small ? 11 : 13} />
      {formatPct(pct)}
    </span>
  );
}

// ---------- funding progress toward $1M ----------
export function FundBar({ funded, shine }: { funded: number; shine?: boolean }) {
  const pct = Math.min(100, (funded / 1_000_000) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="mono" style={{ fontWeight: 800, color: "var(--accent-dark)", fontSize: 15 }}>
          {formatUSD(funded)}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{pct.toFixed(0)}% · /$1M</span>
      </div>
      <div className="bar">
        <div className={"bar-fill" + (shine ? " shine" : "")} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

// ---------- placeholder thumbnail ----------
export function Thumb({ kind }: { kind: string }) {
  return <div className="thumb-ph">{kindMeta(kind).emoji}</div>;
}
