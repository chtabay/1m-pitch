"use client";

import { invest, withdrawVote } from "@/app/actions/pitches";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatUSD, formatUSDCompact, formatPct } from "@/lib/format";
import { fireConfetti, showToast } from "@/lib/celebrate";
import { KindChip } from "./ui";

type Props = {
  pitchId: string;
  title: string;
  kind: string;
  funded: number;
  balance: number;
  hasVoted: boolean;
  disabled?: boolean;
  block?: boolean;
};

const STEP = 10000;
const MIN = 10000;

export function InvestButton({ pitchId, title, kind, funded, balance, hasVoted, disabled, block }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const max = Math.max(MIN, Math.floor(balance / STEP) * STEP);
  const [amt, setAmt] = useState(Math.min(50000, max));
  const [error, setError] = useState<string | null>(null);

  if (hasVoted) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await withdrawVote(pitchId); router.refresh(); })}
        className={"btn btn-sm btn-accent" + (block ? " btn-block" : "")}
        style={block ? { marginTop: 16 } : undefined}
      >
        {pending ? "…" : "★ Investi"}
      </button>
    );
  }

  const tooPoor = balance < MIN;
  const newFunded = funded + amt;
  const sharePct = (amt / newFunded) * 100;
  const projValue = amt * (1_000_000 / newFunded);
  const projPct = ((projValue - amt) / amt) * 100;

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await invest(pitchId, amt);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        fireConfetti();
        showToast(`Investi dans ${title}`, { icon: "★" });
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled || tooPoor}
        onClick={() => setOpen(true)}
        className={"btn btn-sm" + (block ? " btn-accent btn-block" : "")}
        style={block ? { marginTop: 16 } : undefined}
        title={tooPoor ? "Capital insuffisant" : undefined}
      >
        ☆ Investir
      </button>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true">
            <div className="sheet-grab" />
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <KindChip kind={kind} />
                <h3 className="serif" style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.15, margin: "8px 0 0" }}>
                  {title}
                </h3>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="card-flat" style={{ padding: 14, marginBottom: 16, background: "var(--card-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Ta mise</span>
                <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--accent-dark)" }}>
                  {formatUSD(amt)}
                </span>
              </div>
              <input
                type="range"
                min={MIN}
                max={max}
                step={STEP}
                value={amt}
                onChange={(e) => setAmt(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent)", marginTop: 10 }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {[10000, 50000, 100000].filter((v) => v <= max).map((v) => (
                  <button
                    key={v}
                    className={"pill" + (amt === v ? " on" : "")}
                    onClick={() => setAmt(v)}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    {formatUSDCompact(v)}
                  </button>
                ))}
                <button
                  className={"pill" + (amt === max ? " on" : "")}
                  onClick={() => setAmt(max)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Max
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
              <div className="card-flat" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Ta part</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{sharePct.toFixed(1)}%</div>
              </div>
              <div className="card-flat" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Si l&apos;idée atteint $1M</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: "var(--gain)" }}>
                    {formatUSDCompact(projValue)}
                  </span>
                  <span className="delta tag-gain" style={{ fontSize: 11 }}>{formatPct(projPct)}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted-2)", margin: "4px 2px 16px", lineHeight: 1.4 }}>
              Plus tu mises tôt, plus ta part — et ton rendement potentiel — est grande. Min. {formatUSDCompact(MIN)}.
            </p>

            {error && <p style={{ color: "var(--loss)", fontSize: 13, marginBottom: 10 }}>{error}</p>}

            <button className="btn btn-accent btn-block" disabled={pending || amt > balance} onClick={confirm}>
              {pending ? "…" : `☆ Investir ${formatUSD(amt)}`}
            </button>
            <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
              Capital dispo : <span className="mono" style={{ fontWeight: 700, color: "var(--foreground)" }}>{formatUSD(balance)}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
