export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="mb-10 flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex-1">
          <div className="mb-2 h-7 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="mx-auto mb-2 h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mx-auto h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex-1">
              <div className="mb-1 h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
