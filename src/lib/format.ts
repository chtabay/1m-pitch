export function formatUSD(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}$${formatted}`;
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
