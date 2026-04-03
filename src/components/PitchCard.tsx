import { formatUSD, timeAgo } from "@/lib/format";
import { PitchVoteButton } from "./PitchVoteButton";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";

type Props = {
  pitch: {
    pitch_id: string;
    title: string;
    one_liner: string;
    kind: "film" | "concept";
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
};

export function PitchCard({
  pitch,
  authorName,
  hasVoted,
  isLoggedIn,
  userBalance,
  isOwner,
}: Props) {
  const progress = Math.min(100, (pitch.potential_usd / 1_000_000) * 100);

  return (
    <article className="group rounded-2xl border border-zinc-200 bg-card p-5 transition hover:shadow-lg dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
              pitch.kind === "film"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
            }`}
          >
            {pitch.kind}
          </span>
          {pitch.status !== "open" && <StatusBadge status={pitch.status} />}
          {pitch.poc_url && (
            <a
              href={pitch.poc_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Livrable"
              className="text-base leading-none transition hover:scale-110"
            >
              📄
            </a>
          )}
          {pitch.deck_url && (
            <a
              href={pitch.deck_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Deck"
              className="text-base leading-none transition hover:scale-110"
            >
              📊
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              href={`/pitch/${pitch.pitch_id}/edit`}
              className="text-xs text-muted transition hover:text-foreground"
            >
              ✎
            </Link>
          )}
          <time className="text-xs text-muted">{timeAgo(pitch.created_at)}</time>
        </div>
      </div>

      <Link href={`/pitch/${pitch.pitch_id}`} className="block">
        <h2 className="mb-1 text-lg font-bold leading-snug group-hover:text-accent transition">
          {pitch.title}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          {pitch.one_liner}
        </p>
      </Link>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-mono font-semibold text-accent">
            {formatUSD(pitch.potential_usd)}
          </span>
          <span className="text-muted">/ $1,000,000</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{pitch.vote_count}</span>
          {authorName && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
              <span>{authorName}</span>
            </>
          )}
        </div>
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
    </article>
  );
}
