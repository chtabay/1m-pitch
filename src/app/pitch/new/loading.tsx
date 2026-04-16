export default function NewPitchLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-8 h-9 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
        <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
