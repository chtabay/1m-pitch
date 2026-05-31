import { createClient, getUser, getUserBalance } from "@/lib/supabase/server";
import { PitchCard } from "@/components/PitchCard";
import { SearchBar } from "@/components/SearchBar";
import { InfoButton } from "@/components/InfoButton";
import { FeaturedCard } from "@/components/FeaturedCard";
import { MomentumCard } from "@/components/MomentumCard";
import { Icon } from "@/components/ui";
import { computeVelocity } from "@/lib/game";
import { hoursSince } from "@/lib/format";
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
  archived_at: string | null;
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

  const activeSort: SortKey = sort === "funded" || sort === "trending" ? sort : "recent";
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
    query = query.or(`title.ilike.%${searchTerm}%,one_liner.ilike.%${searchTerm}%`);
  }

  if (activeSort === "funded") {
    query = query.order("potential_usd", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // hottest open pitches for the momentum rail (independent of the active filter)
  // still-raising pitches (open or with a deliverable in review) drive the rail
  const hotQuery = supabase
    .from("pitch_stats")
    .select("*")
    .eq("depth", 0)
    .in("status", ["open", "poc_submitted"])
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(24);

  const [{ data: pitches }, { data: hotCandidates }] = await Promise.all([query, hotQuery]);

  const allPitches = (pitches ?? []) as PitchStat[];
  const hotPitches = (hotCandidates ?? []) as PitchStat[];

  const pitchIds = [...new Set([...allPitches, ...hotPitches].map((p) => p.pitch_id))];
  const authorIds = [...new Set(allPitches.map((p) => p.author_id))];

  const [profilesResult, votesResult, userBalance, imagesResult, momentumResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", authorIds.length > 0 ? authorIds : ["__none__"]),
    user ? supabase.from("votes").select("pitch_id").eq("voter_id", user.id) : null,
    user ? getUserBalance(user.id) : 0,
    pitchIds.length > 0 ? supabase.from("poc_images").select("pitch_id, storage_path").in("pitch_id", pitchIds) : null,
    pitchIds.length > 0 ? supabase.from("pitch_momentum").select("pitch_id, invested_24h, votes_24h").in("pitch_id", pitchIds) : null,
  ]);

  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p.display_name]));
  const userVotes = new Set((votesResult?.data ?? []).map((v) => v.pitch_id));

  const momentumMap = new Map<string, { invested_24h: number; votes_24h: number }>();
  for (const m of momentumResult?.data ?? []) {
    momentumMap.set(m.pitch_id, { invested_24h: Number(m.invested_24h), votes_24h: Number(m.votes_24h) });
  }
  const velocityOf = (p: PitchStat) => {
    const m = momentumMap.get(p.pitch_id) ?? { invested_24h: 0, votes_24h: 0 };
    return computeVelocity({
      invested24h: m.invested_24h,
      votes24h: m.votes_24h,
      hoursAgo: hoursSince(p.created_at),
      funded: p.potential_usd,
    });
  };

  const thumbnailMap = new Map<string, string>();
  for (const img of imagesResult?.data ?? []) {
    if (thumbnailMap.has(img.pitch_id)) continue;
    const { data } = supabase.storage.from("poc-images").getPublicUrl(img.storage_path);
    thumbnailMap.set(img.pitch_id, data.publicUrl);
  }

  const activeKind = kind ?? "all";
  const isFiltered = activeKind !== "all" || activeSort !== "recent" || !!searchTerm;
  const hasMore = allPitches.length === totalLimit;

  const featured = !isFiltered && currentPage === 1 ? allPitches[0] : null;
  const gridPitches = featured ? allPitches.slice(1) : allPitches;

  const hotRail = hotPitches
    .map((p) => ({ p, v: velocityOf(p) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 6);

  const buildHref = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const k = params.kind ?? kind;
    const s = params.sort ?? sort;
    if (k && k !== "all") sp.set("kind", k);
    if (s && s !== "recent") sp.set("sort", s);
    if (searchTerm) sp.set("q", searchTerm);
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  };

  const nextPageHref = (() => {
    const sp = new URLSearchParams();
    if (activeKind !== "all") sp.set("kind", activeKind);
    if (activeSort !== "recent") sp.set("sort", activeSort);
    if (searchTerm) sp.set("q", searchTerm);
    sp.set("page", String(currentPage + 1));
    return `/?${sp.toString()}`;
  })();

  return (
    <div className="view-in app-shell" style={{ paddingTop: 22, paddingBottom: 40 }}>
      {/* hero */}
      <section style={{ textAlign: "center", padding: "6px 0 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <h1 className="serif" style={{ fontSize: "clamp(30px,7vw,46px)", fontWeight: 900, letterSpacing: "-.02em", lineHeight: 1.02 }}>
            Un pitch. <span className="float-anim" style={{ display: "inline-block", color: "var(--accent)" }}>$</span>
            <span style={{ color: "var(--accent)" }}>1&nbsp;000&nbsp;000.</span>
          </h1>
          <InfoButton />
        </div>
        <p className="serif italic" style={{ color: "var(--muted)", marginTop: 10, fontSize: 15 }}>
          Au commencement, une ligne.
        </p>
      </section>

      {/* 🔥 momentum rail */}
      {hotRail.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span className="flame live" style={{ fontSize: 14 }}>
              <Icon name="flame" size={16} />
            </span>
            <h2 className="serif" style={{ fontSize: 19, fontWeight: 800, whiteSpace: "nowrap" }}>Idées en feu</h2>
            <span style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 600, whiteSpace: "nowrap" }}>· en temps réel</span>
          </div>
          <div className="scroll-x" style={{ display: "flex", gap: 12, margin: "0 -18px", padding: "0 18px 6px" }}>
            {hotRail.map(({ p, v }, i) => (
              <MomentumCard
                key={p.pitch_id}
                pitchId={p.pitch_id}
                kind={p.kind}
                title={p.title}
                funded={p.potential_usd}
                invested24h={momentumMap.get(p.pitch_id)?.invested_24h ?? 0}
                velocity={v}
                rank={i + 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* filters */}
      <div className="sticky top-[60px] z-30 -mx-[18px] mb-6 border-y border-line-strong bg-card/90 px-[18px] py-3 backdrop-blur">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Suspense fallback={<div className="h-9 w-full max-w-sm animate-pulse rounded-full bg-line" />}>
            <SearchBar defaultValue={searchTerm} />
          </Suspense>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }} className="no-scrollbar">
            {([["all", "Tous"], ["film", "Films"], ["concept", "Concepts"], ["jeu", "Jeux"], ["logiciel", "Logiciels"]] as const).map(
              ([k, label]) => (
                <Link key={k} href={buildHref({ kind: k })} className={"pill" + (activeKind === k ? " on" : "")}>
                  {label}
                </Link>
              ),
            )}
            <span style={{ flex: 1 }} />
            {([["recent", "⏱ Récents"], ["funded", "$ Financés"]] as const).map(([s, label]) => (
              <Link key={s} href={buildHref({ sort: s })} className={"pill" + (activeSort === s ? " on" : "")}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* featured */}
      {featured && (
        <section style={{ marginBottom: 26 }}>
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
            <div className="rule" style={{ margin: "26px 0 22px" }}>
              <span>Le flux</span>
            </div>
          )}
        </section>
      )}

      {!allPitches.length ? (
        <EmptyState searchTerm={searchTerm} activeKind={activeKind} isLoggedIn={!!user} />
      ) : (
        <>
          <div className="pitch-grid">
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
                velocity={velocityOf(pitch)}
              />
            ))}
          </div>

          {hasMore && (
            <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
              <Link href={nextPageHref} scroll={false} className="btn">
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
    <div className="card-flat" style={{ borderStyle: "dashed", padding: "64px 24px", textAlign: "center" }}>
      <p className="serif italic" style={{ fontSize: 24, color: "var(--muted)", marginBottom: 8 }}>
        {isSearchOrFilter ? "Rien dans ce silence." : "La page est blanche."}
      </p>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        {isSearchOrFilter ? "Aucun pitch ne correspond — soyez le premier." : "Aucun pitch encore. Tout est à écrire."}
      </p>
      {isLoggedIn ? (
        <Link href="/pitch/new" className="btn btn-accent">+ Proposer le premier</Link>
      ) : (
        <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Connectez-vous pour proposer.</p>
      )}
    </div>
  );
}
