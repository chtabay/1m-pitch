import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatUSD, timeAgo } from "@/lib/format";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, balance, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === profile.id;

  const { data: pitches } = await supabase
    .from("pitch_stats")
    .select("*")
    .eq("author_id", id)
    .order("created_at", { ascending: false });

  const { data: investments } = await supabase
    .from("votes")
    .select("id, amount, created_at, pitch_id")
    .eq("voter_id", id)
    .order("created_at", { ascending: false });

  const pitchIds = (investments ?? []).map((v) => v.pitch_id);
  const { data: investedPitches } = await supabase
    .from("pitches")
    .select("id, title, status")
    .in("id", pitchIds.length > 0 ? pitchIds : ["__none__"]);

  const investedPitchMap = new Map(
    (investedPitches ?? []).map((p) => [p.id, p]),
  );

  const totalInvested = (investments ?? []).reduce(
    (sum, v) => sum + v.amount,
    0,
  );

  const fundedPitches = (pitches ?? []).filter((p) => p.potential_usd > 0);

  const validatedPitchIds = (investedPitches ?? [])
    .filter((p) => p.status === "validated")
    .map((p) => p.id);

  let portfolio: { pitchId: string; title: string; amount: number; totalFunded: number; share: number }[] = [];

  if (validatedPitchIds.length > 0) {
    const { data: allVotesForValidated } = await supabase
      .from("votes")
      .select("pitch_id, amount")
      .in("pitch_id", validatedPitchIds);

    const totalByPitch = new Map<string, number>();
    for (const v of allVotesForValidated ?? []) {
      totalByPitch.set(v.pitch_id, (totalByPitch.get(v.pitch_id) ?? 0) + v.amount);
    }

    portfolio = (investments ?? [])
      .filter((v) => validatedPitchIds.includes(v.pitch_id))
      .map((v) => {
        const total = totalByPitch.get(v.pitch_id) ?? v.amount;
        return {
          pitchId: v.pitch_id,
          title: investedPitchMap.get(v.pitch_id)?.title ?? "—",
          amount: v.amount,
          totalFunded: total,
          share: (v.amount / total) * 100,
        };
      })
      .sort((a, b) => b.share - a.share);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted transition hover:text-foreground"
      >
        ← Accueil
      </Link>

      <div className="mb-10 flex items-center gap-4">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-14 w-14 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-extrabold">
            {profile.display_name ?? "Anonyme"}
          </h1>
          <p className="text-sm text-muted">
            {timeAgo(profile.created_at)}
          </p>
        </div>
        {isOwner && (
          <span className="ml-auto font-mono text-xl font-bold text-accent">
            {formatUSD(profile.balance)}
          </span>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{(pitches ?? []).length}</p>
          <p className="text-xs text-muted">pitchs</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{(investments ?? []).length}</p>
          <p className="text-xs text-muted">investissements</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold font-mono text-accent">
            {formatUSD(totalInvested)}
          </p>
          <p className="text-xs text-muted">investi</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{portfolio.length}</p>
          <p className="text-xs text-muted">parts</p>
        </div>
      </div>

      {fundedPitches.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">Pitchs financés</h2>
          <div className="space-y-3">
            {fundedPitches.map((p) => (
              <Link
                key={p.pitch_id}
                href={`/pitch/${p.pitch_id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 transition hover:shadow dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-xs text-muted truncate">{p.one_liner}</p>
                </div>
                <span className="ml-3 font-mono text-sm font-semibold text-accent">
                  {formatUSD(p.potential_usd)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">Portfolio</h2>
          <div className="space-y-3">
            {portfolio.map((p) => (
              <Link
                key={p.pitchId}
                href={`/pitch/${p.pitchId}`}
                className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/50 p-4 transition hover:shadow dark:border-green-900/40 dark:bg-green-900/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-xs text-muted">
                    {formatUSD(p.amount)} sur {formatUSD(p.totalFunded)}
                  </p>
                </div>
                <span className="ml-3 min-w-[52px] rounded-full bg-amber-100 px-2.5 py-0.5 text-center text-sm font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                  {p.share.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(investments ?? []).length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Investissements</h2>
          <div className="space-y-3">
            {(investments ?? []).map((v) => {
              const pitch = investedPitchMap.get(v.pitch_id);
              return (
                <Link
                  key={v.id}
                  href={`/pitch/${v.pitch_id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 transition hover:shadow dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold truncate">
                        {pitch?.title ?? "—"}
                      </p>
                      {pitch?.status && pitch.status !== "open" && (
                        <StatusBadge status={pitch.status as "open" | "poc_submitted" | "validated" | "rejected"} />
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {timeAgo(v.created_at)}
                    </p>
                  </div>
                  <span className="ml-3 font-mono text-sm font-semibold text-accent">
                    {formatUSD(v.amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
