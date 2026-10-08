// Le logo : une tuile ambre, penchée, qui porte les trois points de suspension du nom.
// Couleurs via les tokens du design system (accent / ink), rotation gérée en CSS par .brand .mark.
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="9" style={{ fill: "var(--accent)", stroke: "var(--ink)" }} strokeWidth="1.6" />
      <circle cx="9.4" cy="18.6" r="2.5" style={{ fill: "var(--ink)" }} />
      <circle cx="16" cy="18.6" r="2.5" style={{ fill: "var(--ink)" }} />
      <circle cx="22.6" cy="18.6" r="2.5" style={{ fill: "var(--ink)" }} />
    </svg>
  );
}
