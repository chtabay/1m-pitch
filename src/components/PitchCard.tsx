import { formatUSD, timeAgo } from "@/lib/format";
import { PitchVoteButton } from "./PitchVoteButton";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";
import Image from "next/image";

type Props = {
  pitch: {
    pitch_id: string;
    title: string;
    one_liner: string;
    kind: "film" | "concept" | "jeu" | "logiciel";
    status: "open" | "poc_submitted" | "validated" | "rejected";
    poc_url: string | null;
    deck_url: string | null;
    created_at: string;
    vote_count: number;
    potential_usd: number;
    author_id: string;
  };
  authorName: string | null;
  hasVoted: boolean;
  isLoggedIn: boolean;
  userBalance: number;
  isOwner: boolean;
  thumbnailUrl: string | null;
};

const KIND_COLORS: Record<string, string> = {
  film: "bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
  jeu: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  logiciel: "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  concept: "bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200",
};

export function PitchCard({
  pitch,
  authorName,
  hasVoted,
  isLoggedIn,
  userBalance,
  isOwner,
  thumbnailUrl,
}: Props) {
  const progress = Math.min(100, (pitch.potential_usd / 1_000_000) * 100);
  const kindClass = KIND_COLORS[pitch.kind] ?? KIND_COLORS.concept;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-[4px_4px_0_0_theme(colors.ink)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_theme(colors.ink)]">
      <Link href={`/pitch/${pitch.pitch_id}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b-2 border-ink bg-background">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl opacity-20">
              {pitch.kind === "film" ? "🎬" : pitch.kind === "jeu" ? "🎮" : pitch.kind === "logiciel" ? "💻" : "✦"}
            </div>
          )}
          <span className={`absolute left-3 top-3 rounded-full border border-ink px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${kindClass}`}>
            {pitch.kind}
          </span>
          {pitch.status !== "open" && (
            <div className="absolute right-3 top-3">
              <StatusBadge status={pitch.status} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <time>{timeAgo(pitch.created_at)}</time>
          {isOwner && (
            <Link
              href={`/pitch/${pitch.pitch_id}/edit`}
              className="transition hover:text-foreground"
            >
              ✎ Éditer
            </Link>
          )}
        </div>

        <Link href={`/pitch/${pitch.pitch_id}`} className="block">
          <h2 className="mb-1 font-serif text-xl font-bold leading-snug group-hover:text-accent transition">
            {pitch.title}
          </h2>
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted">
            {pitch.one_liner}
          </p>
        </Link>

        {(pitch.poc_url || pitch.deck_url) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {pitch.poc_url && (
              <a
                href={pitch.poc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-[0_2px_0_0_theme(colors.emerald.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_theme(colors.emerald.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.emerald.800)] dark:bg-emerald-700 dark:shadow-[0_2px_0_0_theme(colors.emerald.950)] dark:hover:shadow-[0_4px_0_0_theme(colors.emerald.950)]"
              >
                📄 Livrable
              </a>
            )}
            {pitch.deck_url && (
              <a
                href={pitch.deck_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-[0_2px_0_0_theme(colors.indigo.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_theme(colors.indigo.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.indigo.800)] dark:bg-indigo-700 dark:shadow-[0_2px_0_0_theme(colors.indigo.950)] dark:hover:shadow-[0_4px_0_0_theme(colors.indigo.950)]"
              >
                📊 Deck
              </a>
            )}
          </div>
        )}

        <div className="mt-auto">
          <div className="mb-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-mono text-base font-bold text-accent">
                {formatUSD(pitch.potential_usd)}
              </span>
              <span className="text-xs text-muted">
                {pitch.vote_count} {pitch.vote_count === 1 ? "vote" : "votes"}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink bg-zinc-200 dark:bg-zinc-700">
              <div
                className="progress-shine h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs text-muted">
              {authorName ?? "Anonyme"}
            </span>
            {pitch.status !== "validated" && pitch.status !== "rejected" ? (
              <PitchVoteButton
                pitchId={pitch.pitch_id}
                hasVoted={hasVoted}
                userBalance={userBalance}
                disabled={!isLoggedIn}
              />
            ) : hasVoted ? (
              <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                ★ Investi
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
