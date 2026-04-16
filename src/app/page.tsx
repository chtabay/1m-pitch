import { createClient, getUser, getUserBalance } from "@/lib/supabase/server";
import { PitchCard } from "@/components/PitchCard";
import { SearchBar } from "@/components/SearchBar";
import { InfoButton } from "@/components/InfoButton";
import Link from "next/link";
import { Suspense } from "react";

export const revalidate = 30;

type PitchStat = {
  pitch_id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  title: string;
  one_liner: string;
  kind: "film" | "concept" | "jeu" | "logiciel";
  status: "open" | "poc_submitted" | "validated" | "rejected";
  poc_url: string | null;
    deck_url: string | null;
    created_at: string;
  vote_count: number;
  potential_usd: number;
};

type SortKey = "funded" | "recent" | "trending";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; sort?: string; q?: string }>;
}) {
  const { kind, sort, q } = await searchParams;
  const [supabase, user] = await Promise.all([createClient(), getUser()]);

  const activeSort: SortKey =
    sort === "recent" || sort === "trending" ? sort : "funded";

  let query = supabase.from("pitch_stats").select("*").eq("depth", 0).limit(50);

  if (kind === "film" || kind === "concept" || kind === "jeu" || kind === "logiciel") {
    query = query.eq("kind", kind);
  }

  const searchTerm = typeof q === "string" ? q.trim() : "";
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,one_liner.ilike.%${searchTerm}%`,
    );
  }

  if (activeSort === "recent") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("potential_usd", { ascending: false });
  }

  const { data: pitches } = await query;

  const authorIds = [...new Set((pitches ?? []).map((p) => p.author_id))];

  const [profilesResult, votesResult, userBalance] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds.length > 0 ? authorIds : ["__none__"]),
    user
      ? supabase.from("votes").select("pitch_id").eq("voter_id", user.id)
      : null,
    user ? getUserBalance(user.id) : 0,
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.display_name]),
  );

  const userVotes = new Set(
    (votesResult?.data ?? []).map((v) => v.pitch_id),
  );

  const activeKind = kind ?? "all";

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const k = params.kind ?? kind;
    const s = params.sort ?? sort;
    if (k && k !== "all") p.set("kind", k);
    if (s && s !== "funded") p.set("sort", s);
    if (searchTerm) p.set("q", searchTerm);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-serif text-4xl font-black tracking-tight sm:text-5xl">
            Un pitch.{" "}
            <span className="animate-float inline-block text-accent text-5xl sm:text-6xl">$</span>
            <span className="text-accent">1&nbsp;000&nbsp;000.</span>
          </h1>
          <InfoButton />
        </div>
        <hr className="mx-auto mt-6 w-24 border-t-2 border-ink" />
      </section>

      <div className="mb-4 flex justify-center">
        <Suspense fallback={<div className="h-10 w-full max-w-md animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />}>
          <SearchBar defaultValue={searchTerm} />
        </Suspense>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {(["all", "film", "concept", "jeu", "logiciel"] as const).map((k) => (
          <Link
            key={k}
            href={buildHref({ kind: k })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeKind === k
                ? "border-2 border-ink bg-foreground text-background shadow-[2px_2px_0_0_theme(colors.ink)]"
                : "border border-ink/30 text-muted hover:border-ink hover:bg-card"
            }`}
          >
            {k === "all" ? "Tous" : k === "film" ? "Films" : k === "concept" ? "Concepts" : k === "jeu" ? "Jeux" : "Logiciels"}
          </Link>
        ))}

        <span className="mx-2 text-zinc-300 dark:text-zinc-600">|</span>

        {(
          [
            ["funded", "$"],
            ["recent", "⏱"],
          ] as const
        ).map(([s, icon]) => (
          <Link
            key={s}
            href={buildHref({ sort: s })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              activeSort === s
                ? "border-2 border-ink bg-foreground text-background shadow-[2px_2px_0_0_theme(colors.ink)]"
                : "border border-ink/30 text-muted hover:border-ink hover:bg-card"
            }`}
          >
            {icon}
          </Link>
        ))}
      </div>

      {!pitches?.length ? (
        <div className="py-20 text-center text-muted">
          <p className="text-lg italic">Silence.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(pitches as PitchStat[]).map((pitch) => (
            <PitchCard
              key={pitch.pitch_id}
              pitch={pitch}
              authorName={profileMap.get(pitch.author_id) ?? null}
              hasVoted={userVotes.has(pitch.pitch_id)}
              isLoggedIn={!!user}
              userBalance={userBalance}
              isOwner={user?.id === pitch.author_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
