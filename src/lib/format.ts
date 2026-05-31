export function formatUSD(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}$${formatted}`;
}

/** Compact money for chips/cards: $642k, $1.2M, $980. */
export function formatUSDCompact(value: number): string {
  const v = Math.round(value);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}$${(abs % 1_000_000 === 0 ? m.toFixed(0) : m.toFixed(2))}M`;
  }
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}k`;
  return `${sign}$${abs}`;
}

/** Signed percentage: +44.5% / -12.0%. */
export function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/** Hours elapsed since an ISO timestamp (kept out of render to stay lint-pure). */
export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3.6e6;
}

export function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );

  const intervals: [number, string][] = [
    [31536000, "an"],
    [2592000, "mois"],
    [86400, "j"],
    [3600, "h"],
    [60, "min"],
  ];

  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `il y a ${count}${label}`;
  }

  return "à l'instant";
}
