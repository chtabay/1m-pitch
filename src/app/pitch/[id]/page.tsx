import { createClient, getUser, getUserBalance } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatUSD, timeAgo, hoursSince } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { KindChip, FundBar, Sparkline, Flame, Icon, sparkData, seedFrom } from "@/components/ui";
import { InvestButton } from "@/components/InvestButton";
import { computeVelocity, HOT_THRESHOLD } from "@/lib/game";
import { PocSubmitForm } from "@/components/PocSubmitForm";
import { PocValidateButton } from "@/components/PocValidateButton";
import { ResourceForm } from "@/components/ResourceForm";
import { StatusBadge } from "@/components/StatusBadge";
import { NewIdeaForm } from "@/components/NewIdeaForm";
import { MessageForm } from "@/components/MessageForm";
import { ShareButtons } from "@/components/ShareButtons";
import { ArchiveButton } from "@/components/ArchiveButton";
import { PocEditForm } from "@/components/PocEditForm";
import { PocImageDeleteButton } from "@/components/PocImageDeleteButton";
import type { Metadata } from "next";
import { cache } from "react";

const DEPTH_LABELS = ["Pitch", "Idée", "Limbe"] as const;

const getPitch = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pitches")
    .select("id, title, one_liner, kind, status, poc_url, deck_url, poc_description, author_id, parent_id, depth, created_at, archived_at")
    .eq("id", id)
    .single();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pitch = await getPitch(id);

  if (!pitch) return { title: "Pitch introuvable" };

  const title = `${pitch.title} — 1M Pitch`;
  const description = pitch.one_liner;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "1M Pitch",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PitchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const pitch = await getPitch(id);

  if (!pitch) notFound();

  const depthLabel = DEPTH_LABELS[pitch.depth] ?? "Pitch";
  const childLabel = DEPTH_LABELS[pitch.depth + 1] ?? null;
  const hasValidations = pitch.status === "poc_submitted" || pitch.status === "validated" || pitch.status === "rejected";

  const [
    { data: votes },
    { data: images },
    { data: author },
    validationsResult,
    { data: children },
    { data: archivedChildren },
    messagesResult,
    momentumResult,
    user,
  ] = await Promise.all([
    supabase.from("votes").select("id, amount, voter_id").eq("pitch_id", id),
    supabase.from("poc_images").select("id, storage_path").eq("pitch_id", id),
    supabase.from("profiles").select("display_name").eq("id", pitch.author_id).single(),
    hasValidations
      ? supabase.from("poc_validations").select("voter_id, approved").eq("pitch_id", id)
      : Promise.resolve({ data: null }),
    supabase.from("pitch_stats").select("*").eq("parent_id", id).neq("status", "rejected").is("archived_at", null).order("potential_usd", { ascending: false }),
    supabase.from("pitch_stats").select("*").eq("parent_id", id).or("status.eq.rejected,archived_at.not.is.null").order("created_at", { ascending: false }),
    pitch.depth === 2
      ? supabase.from("messages").select("id, content, created_at, author_id").eq("pitch_id", id).order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
    supabase.from("pitch_momentum").select("invested_24h, votes_24h").eq("pitch_id", id).maybeSingle(),
    getUser(),
  ]);

  const isAuthor = user?.id === pitch.author_id;
  const balance = user ? await getUserBalance(user.id) : 0;
  const momentum = (momentumResult.data as { invested_24h: number; votes_24h: number } | null) ?? { invested_24h: 0, votes_24h: 0 };

  const totalFunded = (votes ?? []).reduce((s, v) => s + v.amount, 0);
  const investorCount = (votes ?? []).length;
  const isInvestor = user ? (votes ?? []).some((v) => v.voter_id === user.id) : false;

  const voterIds = [...new Set((votes ?? []).map((v) => v.voter_id))];

  const messages = messagesResult.data ?? [];
  const messageAuthorIds = messages.length > 0
    ? [...new Set(messages.map((m) => m.author_id))]
    : [];

  const allProfileIds = [...new Set([...voterIds, ...messageAuthorIds])];
  const { data: allProfiles } = allProfileIds.length > 0
    ? await supabase.from("profiles").select("id, display_name").in("id", allProfileIds)
    : { data: [] as { id: string; display_name: string | null }[] };

  const profileNameMap = new Map(
    (allProfiles ?? []).map((p) => [p.id, p.display_name ?? "Anonyme"]),
  );

  const investors = (votes ?? []).map((v) => ({
    id: v.voter_id,
    name: profileNameMap.get(v.voter_id) ?? "Anonyme",
    amount: v.amount,
  })).sort((a, b) => b.amount - a.amount);

  const pocImages = (images ?? []).map((img) => {
    const { data } = supabase.storage.from("poc-images").getPublicUrl(img.storage_path);
    return { id: img.id, url: data.publicUrl };
  });
  const canEditDeliverable = isAuthor && pitch.status === "poc_submitted";

  let userValidation: boolean | null = null;
  let approvalCount = 0;
  let rejectionCount = 0;
  const validations = validationsResult.data ?? [];
  if (hasValidations) {
    approvalCount = validations.filter((v) => v.approved).length;
    rejectionCount = validations.filter((v) => !v.approved).length;
    if (user) {
      const mine = validations.find((v) => v.voter_id === user.id);
      userValidation = mine?.approved ?? null;
    }
  }

  const messageAuthors = profileNameMap;

  let shareholders: { name: string; profileId: string; amount: number; share: number }[] = [];
  if (pitch.status === "validated" && totalFunded > 0) {
    shareholders = (votes ?? [])
      .map((v) => ({
        name: profileNameMap.get(v.voter_id) ?? "Anonyme",
        profileId: v.voter_id,
        amount: v.amount,
        share: (v.amount / totalFunded) * 100,
      }))
      .sort((a, b) => b.share - a.share);
  }

  const velocity = computeVelocity({
    invested24h: Number(momentum.invested_24h),
    votes24h: Number(momentum.votes_24h),
    hoursAgo: hoursSince(pitch.created_at),
    funded: totalFunded,
  });
  const canInvest = pitch.status === "open" || pitch.status === "poc_submitted";

  const backHref = pitch.parent_id ? `/pitch/${pitch.parent_id}` : "/";
  const backLabel = pitch.parent_id ? `← ${DEPTH_LABELS[pitch.depth - 1] ?? "Retour"}` : "← Accueil";

  return (
    <div className="view-in app-shell" style={{ paddingTop: 16, paddingBottom: 48, maxWidth: 680 }}>
      <Link
        href={backHref}
        className="mb-6 inline-block text-sm text-muted transition hover:text-foreground"
      >
        {backLabel}
      </Link>

      {pitch.archived_at && (
        <div className="mb-6 flex items-center justify-between rounded-xl border-2 border-ink bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
          <span className="text-sm font-semibold">
            🗄 Archivée — masquée de l&apos;accueil
          </span>
          {isAuthor && <ArchiveButton pitchId={pitch.id} archived={true} />}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {pitch.depth > 0 && <span className="pill">{depthLabel}</span>}
        <KindChip kind={pitch.kind} />
        {pitch.status === "open" && velocity >= HOT_THRESHOLD && (
          <span className="pill" style={{ borderColor: "var(--hot)", color: "var(--hot)" }}>
            <Flame velocity={velocity} live />
          </span>
        )}
        {pitch.status !== "open" && <StatusBadge status={pitch.status} />}
        <time className="ml-auto text-xs text-muted">{timeAgo(pitch.created_at)}</time>
      </div>

      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
        {pitch.title}
      </h1>
      <p className="mb-4 text-lg text-muted leading-relaxed">
        {pitch.one_liner}
      </p>

      {isAuthor && !pitch.archived_at && (
        <div className="mb-6 flex flex-wrap gap-2">
          {pitch.depth === 0 && pitch.status === "open" && (
            <Link
              href={`/pitch/${pitch.id}/edit`}
              className="rounded-lg border-2 border-ink bg-card px-3 py-1.5 text-xs font-semibold shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
            >
              ✎ Éditer
            </Link>
          )}
          <ArchiveButton pitchId={pitch.id} archived={false} />
        </div>
      )}

      <div className="card" style={{ padding: 18, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Financement</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 900, color: "var(--accent-dark)" }}>{formatUSD(totalFunded)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {investorCount} investisseur{investorCount !== 1 ? "s" : ""} · /$1M
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Sparkline data={sparkData(seedFrom(pitch.id), Math.max(0.3, velocity / 40))} w={92} h={38} color="var(--hot)" />
            {Number(momentum.invested_24h) > 0 && (
              <div className="delta tag-gain" style={{ marginTop: 6, fontSize: 11, justifyContent: "flex-end" }}>
                <Icon name="arrowUp" size={11} />+{formatUSD(Number(momentum.invested_24h))} / 24h
              </div>
            )}
          </div>
        </div>
        <FundBar funded={totalFunded} shine={velocity >= HOT_THRESHOLD} />

        {canInvest && !isAuthor && (
          <InvestButton
            pitchId={pitch.id}
            title={pitch.title}
            kind={pitch.kind}
            funded={totalFunded}
            balance={balance}
            hasVoted={isInvestor}
            disabled={!user}
            block
          />
        )}
        {isAuthor && (
          <div className="card-flat" style={{ marginTop: 16, padding: 12, fontSize: 12.5, color: "var(--muted)", background: "var(--card-2)" }}>
            ✎ C&apos;est ton pitch —{" "}
            {pitch.status === "poc_submitted"
              ? `${approvalCount} ✓ / ${rejectionCount} ✗ sur la validation du livrable.`
              : "soumets un livrable quand tu es prêt."}
          </div>
        )}
      </div>

      {author && (
        <p className="mb-4 text-sm text-muted">
          par{" "}
          <Link
            href={`/profile/${pitch.author_id}`}
            className="font-medium text-foreground hover:underline"
          >
            {author.display_name}
          </Link>
        </p>
      )}

      {investors.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {investors.map((inv) => (
            <Link
              key={inv.id}
              href={`/profile/${inv.id}`}
              title={`${inv.name} — ${formatUSD(inv.amount)}`}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {inv.name}
            </Link>
          ))}
        </div>
      )}

      <ShareButtons title={pitch.title} oneLiner={pitch.one_liner} pitchId={pitch.id} />

      {/* === Depth 0: formal deliverable workflow === */}
      {pitch.depth === 0 && (pitch.status === "open" || pitch.status === "rejected") && isAuthor && (
        <section className="mb-10 rounded-2xl border-2 border-ink bg-card p-6 shadow-[6px_6px_0_0_theme(colors.ink)]">
          <div className="-mx-6 -mt-6 mb-6 rounded-t-2xl bg-accent px-6 py-3 border-b-2 border-ink">
            <h2 className="font-serif text-xl font-black text-zinc-900">
              {pitch.status === "rejected" ? "↻ Resoumettre le livrable" : "✦ Soumettre le livrable"}
            </h2>
          </div>
          <PocSubmitForm pitchId={pitch.id} />
        </section>
      )}

      {pitch.depth === 0 && pitch.status !== "open" && (
        <section className="mb-10 rounded-2xl border-2 border-ink bg-card shadow-[6px_6px_0_0_theme(colors.ink)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 bg-accent px-6 py-3 border-b-2 border-ink">
            <h2 className="font-serif text-xl font-black text-zinc-900">
              📦 Livrables
            </h2>
            <div className="flex items-center gap-3">
              {pitch.status === "poc_submitted" && (
                <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
                  {approvalCount} ✓ · {rejectionCount} ✗ / {investorCount}
                </span>
              )}
              {canEditDeliverable && (
                <PocEditForm
                  pitchId={pitch.id}
                  currentUrl={pitch.poc_url}
                  currentDeckUrl={pitch.deck_url}
                  currentDescription={pitch.poc_description}
                />
              )}
            </div>
          </div>

          <div className="p-6">
            {(pitch.poc_url || pitch.deck_url) && (
              <div className="mb-5 flex flex-wrap gap-3">
                {pitch.poc_url && (
                  <a
                    href={pitch.poc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_0_theme(colors.emerald.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_theme(colors.emerald.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.emerald.800)] dark:bg-emerald-700 dark:shadow-[0_3px_0_0_theme(colors.emerald.950)]"
                  >
                    📄 Livrable
                    <span className="text-emerald-200">↗</span>
                  </a>
                )}

                {pitch.deck_url && (
                  <a
                    href={pitch.deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_0_theme(colors.indigo.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_theme(colors.indigo.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.indigo.800)] dark:bg-indigo-700 dark:shadow-[0_3px_0_0_theme(colors.indigo.950)]"
                  >
                    📊 Deck
                    <span className="text-indigo-200">↗</span>
                  </a>
                )}
              </div>
            )}

            {pitch.poc_description && (
              <p className="mb-5 text-base leading-relaxed border-l-4 border-ink/20 pl-4 italic">
                {pitch.poc_description}
              </p>
            )}

            {pocImages.length > 0 && (
              <div className="mb-5 grid grid-cols-2 gap-3">
                {pocImages.map((img, i) => (
                  <div key={img.id} className="relative">
                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={img.url}
                        alt={`Image ${i + 1}`}
                        width={400}
                        height={300}
                        className="rounded-xl border-2 border-ink object-cover"
                      />
                    </a>
                    {canEditDeliverable && (
                      <PocImageDeleteButton imageId={img.id} pitchId={pitch.id} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {pitch.status === "poc_submitted" && isInvestor && (
              <div className="mt-4 rounded-xl border-2 border-ink bg-background p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Votre validation
                </p>
                <PocValidateButton
                  pitchId={pitch.id}
                  currentVote={userValidation}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* === Actionnariat (validated pitches only) === */}
      {pitch.status === "validated" && shareholders.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">Actionnariat</h2>
          <div className="space-y-2">
            {shareholders.map((s) => (
              <Link
                key={s.profileId}
                href={`/profile/${s.profileId}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 transition hover:shadow dark:border-zinc-800"
              >
                <span className="text-sm font-medium">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{formatUSD(s.amount)}</span>
                  <span className="min-w-[52px] rounded-full bg-amber-100 px-2.5 py-0.5 text-right text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {s.share.toFixed(1)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* === Depth > 0: optional resources (no status change) === */}
      {pitch.depth > 0 && (
        <section className="mb-10 rounded-2xl border-2 border-ink bg-card shadow-[6px_6px_0_0_theme(colors.ink)] overflow-hidden">
          <div className="flex items-center justify-between bg-accent px-6 py-3 border-b-2 border-ink">
            <h2 className="font-serif text-xl font-black text-zinc-900">
              📦 Ressources
            </h2>
            {isAuthor && (
              <ResourceForm
                pitchId={pitch.id}
                currentUrl={pitch.poc_url}
                currentDescription={pitch.poc_description}
              />
            )}
          </div>

          <div className="p-6">
            {(pitch.poc_url || pitch.poc_description || pocImages.length > 0) ? (
              <>
                {pitch.poc_url && (
                  <a
                    href={pitch.poc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_0_theme(colors.emerald.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_theme(colors.emerald.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.emerald.800)] dark:bg-emerald-700 dark:shadow-[0_3px_0_0_theme(colors.emerald.950)]"
                  >
                    📄 Voir la ressource
                    <span className="text-emerald-200">↗</span>
                  </a>
                )}

                {pitch.poc_description && (
                  <p className="mb-5 text-base leading-relaxed border-l-4 border-ink/20 pl-4 italic">
                    {pitch.poc_description}
                  </p>
                )}

                {pocImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {pocImages.map((img, i) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                        <Image
                          src={img.url}
                          alt={`Image ${i + 1}`}
                          width={400}
                          height={300}
                          className="rounded-xl border-2 border-ink object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted italic">Aucune ressource.</p>
            )}
          </div>
        </section>
      )}

      {/* Sub-ideas (Idées or Limbes) */}
      {childLabel && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {childLabel === "Idée" ? "Idées" : "Limbes"}
              </h2>
              <p className="text-xs text-muted">
                {pitch.depth === 0
                  ? "Les investisseurs et l'auteur peuvent proposer des sous-idées."
                  : "Proposez un axe de réflexion dans les limbes."}
              </p>
            </div>
            {(isInvestor || isAuthor) && pitch.depth < 2 && (
              <NewIdeaForm parentId={pitch.id} depthLabel={childLabel} />
            )}
          </div>

          {(children ?? []).length > 0 ? (
            <div className="space-y-3">
              {(children ?? []).map((child) => (
                <Link
                  key={child.pitch_id}
                  href={`/pitch/${child.pitch_id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 transition hover:shadow dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={child.status} />
                      <p className="font-semibold truncate">{child.title}</p>
                    </div>
                    <p className="text-xs text-muted truncate">{child.one_liner}</p>
                  </div>
                  {child.potential_usd > 0 && (
                    <span className="ml-3 font-mono text-sm font-semibold text-accent">
                      {formatUSD(child.potential_usd)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted italic">
              {pitch.depth === 0 ? "Aucune idée." : "Aucun limbe."}
            </p>
          )}
        </section>
      )}

      {/* Forum (Limbes only, depth === 2) */}
      {pitch.depth === 2 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">Discussion</h2>

          {messages.length > 0 ? (
            <div className="mb-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                    <span className="font-medium text-foreground">
                      {messageAuthors.get(msg.author_id) ?? "Anonyme"}
                    </span>
                    <span>{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted italic">Silence dans les limbes.</p>
          )}

          {user && <MessageForm pitchId={pitch.id} />}
        </section>
      )}

      {/* Archives (rejected children) */}
      {(archivedChildren ?? []).length > 0 && (
        <section className="mb-10">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">
              Archives ({(archivedChildren ?? []).length})
            </summary>
            <div className="mt-3 space-y-3">
              {(archivedChildren ?? []).map((child) => (
                <Link
                  key={child.pitch_id}
                  href={`/pitch/${child.pitch_id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 opacity-60 transition hover:opacity-100 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={child.status} />
                      <p className="font-semibold truncate">{child.title}</p>
                    </div>
                    <p className="text-xs text-muted truncate">{child.one_liner}</p>
                  </div>
                </Link>
              ))}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
