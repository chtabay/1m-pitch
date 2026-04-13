export default function PitchDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="mb-4 flex items-center gap-3">
        <div className="h-5 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mb-2 h-9 w-3/4 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-6 h-6 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-6 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-3 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="mb-8 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}
