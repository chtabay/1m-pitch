const STATUS_CONFIG = {
  open: { label: "Ouvert", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  poc_submitted: { label: "Livrable soumis", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  validated: { label: "Validé", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  rejected: { label: "Rejeté", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
} as const;

type Props = {
  status: keyof typeof STATUS_CONFIG;
};

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`rounded-full border border-ink px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
