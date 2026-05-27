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

const KIND_EMOJI: Record<string, string> = {
  film: "🎬",
  jeu: "🎮",
  logiciel: "💻",
  concept: "✦",
};

export function FeaturedCard({
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
    <article className="group relative overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-[6px_6px_0_0_theme(colors.ink)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_theme(colors.ink)]">
      <div className="absolute -right-12 top-6 z-20 rotate-45 bg-accent px-12 py-1 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[0_2px_0_0_theme(colors.ink)] border-y border-ink">
        ★ À la une
      </div>

      <div className="grid md:grid-cols-2">
        <Link href={`/pitch/${pitch.pitch_id}`} className="block">
          <div className="relative aspect-[16/9] w-full overflow-hidden border-b-2 border-ink bg-background md:aspect-auto md:h-full md:border-b-0 md:border-r-2">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-8xl opacity-15">
                {KIND_EMOJI[pitch.kind]}
              </div>
            )}
            <span className={`absolute left-4 top-4 rounded-full border border-ink px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${kindClass}`}>
              {pitch.kind}
            </span>
            {pitch.status !== "open" && (
              <div className="absolute left-4 top-12">
                <StatusBadge status={pitch.status} />
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-col p-6 md:p-8">
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
            <h2 className="mb-2 font-serif text-2xl font-black leading-tight transition group-hover:text-accent sm:text-3xl">
              {pitch.title}
            </h2>
            <p className="mb-5 text-base leading-relaxed text-muted">
              {pitch.one_liner}
            </p>
          </Link>

          {(pitch.poc_url || pitch.deck_url) && (
            <div className="mb-5 flex flex-wrap gap-2">
              {pitch.poc_url && (
                <a
                  href={pitch.poc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_2px_0_0_theme(colors.emerald.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_theme(colors.emerald.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.emerald.800)]"
                >
                  📄 Livrable
                </a>
              )}
              {pitch.deck_url && (
                <a
                  href={pitch.deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_2px_0_0_theme(colors.indigo.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_theme(colors.indigo.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.indigo.800)]"
                >
                  📊 Deck
                </a>
              )}
            </div>
          )}

          <div className="mt-auto">
            <div className="mb-4">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold text-accent">
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
      </div>
    </article>
  );
}
