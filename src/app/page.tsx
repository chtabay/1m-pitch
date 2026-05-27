import { createClient, getUser, getUserBalance } from "@/lib/supabase/server";
import { PitchCard } from "@/components/PitchCard";
import { SearchBar } from "@/components/SearchBar";
import { InfoButton } from "@/components/InfoButton";
import { FeaturedCard } from "@/components/FeaturedCard";
import Link from "next/link";
import { Suspense } from "react";

export const revalidate = 30;

const PAGE_SIZE = 12;

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
  searchParams: Promise<{ kind?: string; sort?: string; q?: string; page?: string }>;
}) {
  const { kind, sort, q, page } = await searchParams;
  const [supabase, user] = await Promise.all([createClient(), getUser()]);

  const activeSort: SortKey =
    sort === "funded" || sort === "trending" ? sort : "recent";
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const totalLimit = currentPage * PAGE_SIZE;

  let query = supabase
    .from("pitch_stats")
    .select("*")
    .eq("depth", 0)
    .is("archived_at", null)
    .limit(totalLimit);

  if (kind === "film" || kind === "concept" || kind === "jeu" || kind === "logiciel") {
    query = query.eq("kind", kind);
  }

  const searchTerm = typeof q === "string" ? q.trim() : "";
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,one_liner.ilike.%${searchTerm}%`,
    );
  }

  if (activeSort === "funded") {
    query = query.order("potential_usd", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: pitches } = await query;

  const pitchIds = (pitches ?? []).map((p) => p.pitch_id);
  const authorIds = [...new Set((pitches ?? []).map((p) => p.author_id))];

  const [profilesResult, votesResult, userBalance, imagesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds.length > 0 ? authorIds : ["__none__"]),
    user
      ? supabase.from("votes").select("pitch_id").eq("voter_id", user.id)
      : null,
    user ? getUserBalance(user.id) : 0,
    pitchIds.length > 0
      ? supabase
          .from("poc_images")
          .select("pitch_id, storage_path")
          .in("pitch_id", pitchIds)
      : null,
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.display_name]),
  );

  const userVotes = new Set(
    (votesResult?.data ?? []).map((v) => v.pitch_id),
  );

  const thumbnailMap = new Map<string, string>();
  for (const img of imagesResult?.data ?? []) {
    if (thumbnailMap.has(img.pitch_id)) continue;
    const { data } = supabase.storage.from("poc-images").getPublicUrl(img.storage_path);
    thumbnailMap.set(img.pitch_id, data.publicUrl);
  }

  const activeKind = kind ?? "all";
  const isFiltered = activeKind !== "all" || activeSort !== "recent" || !!searchTerm;
  const allPitches = (pitches ?? []) as PitchStat[];
  const hasMore = allPitches.length === totalLimit;

  const featured = !isFiltered && currentPage === 1 ? allPitches[0] : null;
  const gridPitches = featured ? allPitches.slice(1) : allPitches;

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const k = params.kind ?? kind;
    const s = params.sort ?? sort;
    if (k && k !== "all") p.set("kind", k);
    if (s && s !== "recent") p.set("sort", s);
    if (searchTerm) p.set("q", searchTerm);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };

  const nextPageHref = (() => {
    const p = new URLSearchParams();
    if (activeKind !== "all") p.set("kind", activeKind);
    if (activeSort !== "recent") p.set("sort", activeSort);
    if (searchTerm) p.set("q", searchTerm);
    p.set("page", String(currentPage + 1));
    return `/?${p.toString()}`;
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12">
      <section className="pt-10 pb-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-serif text-4xl font-black tracking-tight sm:text-5xl">
            Un pitch.{" "}
            <span className="animate-float inline-block text-accent text-5xl sm:text-6xl">$</span>
            <span className="text-accent">1&nbsp;000&nbsp;000.</span>
          </h1>
          <InfoButton />
        </div>
        <p className="mt-4 font-serif italic text-muted">
          Au commencement, une ligne.
        </p>
        <hr className="mx-auto mt-6 w-24 border-t-2 border-ink" />
      </section>

      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b-2 border-ink bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center">
          <Suspense fallback={<div className="h-9 w-full max-w-sm animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />}>
            <SearchBar defaultValue={searchTerm} />
          </Suspense>

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            {(["all", "film", "concept", "jeu", "logiciel"] as const).map((k) => (
              <Link
                key={k}
                href={buildHref({ kind: k })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeKind === k
                    ? "border-2 border-ink bg-foreground text-background shadow-[2px_2px_0_0_theme(colors.ink)]"
                    : "border border-ink/30 text-muted hover:border-ink hover:bg-card"
                }`}
              >
                {k === "all" ? "Tous" : k === "film" ? "Films" : k === "concept" ? "Concepts" : k === "jeu" ? "Jeux" : "Logiciels"}
              </Link>
            ))}

            <span className="mx-1 hidden text-zinc-300 sm:inline dark:text-zinc-600">·</span>

            <div className="flex items-center gap-1 rounded-full border border-ink/30 p-0.5">
              {(
                [
                  ["recent", "⏱", "Récents"],
                  ["funded", "$", "Financés"],
                ] as const
              ).map(([s, icon, label]) => (
                <Link
                  key={s}
                  href={buildHref({ sort: s })}
                  title={label}
                  aria-label={label}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                    activeSort === s
                      ? "bg-ink text-background"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {featured && (
        <section className="mb-8">
          <FeaturedCard
            pitch={featured}
            authorName={profileMap.get(featured.author_id) ?? null}
            hasVoted={userVotes.has(featured.pitch_id)}
            isLoggedIn={!!user}
            userBalance={userBalance}
            isOwner={user?.id === featured.author_id}
            thumbnailUrl={thumbnailMap.get(featured.pitch_id) ?? null}
          />

          {gridPitches.length > 0 && (
            <div className="my-10 flex items-center gap-4">
              <hr className="flex-1 border-t-2 border-ink/20" />
              <span className="font-serif text-xs uppercase tracking-[0.2em] text-muted">
                Le flux
              </span>
              <hr className="flex-1 border-t-2 border-ink/20" />
            </div>
          )}
        </section>
      )}

      {!allPitches.length ? (
        <EmptyState
          searchTerm={searchTerm}
          activeKind={activeKind}
          isLoggedIn={!!user}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gridPitches.map((pitch) => (
              <PitchCard
                key={pitch.pitch_id}
                pitch={pitch}
                authorName={profileMap.get(pitch.author_id) ?? null}
                hasVoted={userVotes.has(pitch.pitch_id)}
                isLoggedIn={!!user}
                userBalance={userBalance}
                isOwner={user?.id === pitch.author_id}
                thumbnailUrl={thumbnailMap.get(pitch.pitch_id) ?? null}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Link
                href={nextPageHref}
                scroll={false}
                className="rounded-lg border-2 border-ink bg-card px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
              >
                Charger plus →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  searchTerm,
  activeKind,
  isLoggedIn,
}: {
  searchTerm: string;
  activeKind: string;
  isLoggedIn: boolean;
}) {
  const isSearchOrFilter = !!searchTerm || activeKind !== "all";

  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card/50 px-6 py-16 text-center">
      <p className="mb-2 font-serif text-2xl italic text-muted">
        {isSearchOrFilter ? "Rien dans ce silence." : "La page est blanche."}
      </p>
      <p className="mb-6 text-sm text-muted">
        {isSearchOrFilter
          ? "Aucun pitch ne correspond — soyez le premier."
          : "Aucun pitch encore. Tout est à écrire."}
      </p>
      {isLoggedIn ? (
        <Link
          href="/pitch/new"
          className="inline-block rounded-lg border-2 border-ink bg-accent px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-[3px_3px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
        >
          + Proposer le premier
        </Link>
      ) : (
        <p className="text-xs text-muted italic">Connectez-vous pour proposer.</p>
      )}
    </div>
  );
}
