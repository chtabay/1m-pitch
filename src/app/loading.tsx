export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-12 text-center">
        <div className="mx-auto h-12 w-80 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </section>

      <div className="mb-4 flex justify-center">
        <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border-2 border-ink/20 bg-card p-5 shadow-[4px_4px_0_0_theme(colors.ink/0.1)]"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mb-4 h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mb-3 h-2 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
