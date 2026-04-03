import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatUSD, timeAgo } from "@/lib/format";
import Link from "next/link";
import { PocSubmitForm } from "@/components/PocSubmitForm";
import { PocValidateButton } from "@/components/PocValidateButton";
import { ResourceForm } from "@/components/ResourceForm";
import { StatusBadge } from "@/components/StatusBadge";
import { NewIdeaForm } from "@/components/NewIdeaForm";
import { MessageForm } from "@/components/MessageForm";

const DEPTH_LABELS = ["Pitch", "Idée", "Limbe"] as const;

export default async function PitchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pitch } = await supabase
    .from("pitches")
    .select("id, title, one_liner, kind, status, poc_url, deck_url, poc_description, author_id, parent_id, depth, created_at")
    .eq("id", id)
    .single();

  if (!pitch) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthor = user?.id === pitch.author_id;
  const depthLabel = DEPTH_LABELS[pitch.depth] ?? "Pitch";
  const childLabel = DEPTH_LABELS[pitch.depth + 1] ?? null;

  const { data: votes } = await supabase
    .from("votes")
    .select("id, amount, voter_id")
    .eq("pitch_id", id);

  const totalFunded = (votes ?? []).reduce((s, v) => s + v.amount, 0);
  const investorCount = (votes ?? []).length;

  const isInvestor = user
    ? (votes ?? []).some((v) => v.voter_id === user.id)
    : false;

  const voterIds = [...new Set((votes ?? []).map((v) => v.voter_id))];
  const { data: investorProfiles } = voterIds.length > 0
    ? await supabase.from("profiles").select("id, display_name").in("id", voterIds)
    : { data: [] };

  const investorNameMap = new Map(
    (investorProfiles ?? []).map((p) => [p.id, p.display_name ?? "Anonyme"]),
  );

  const investors = (votes ?? []).map((v) => ({
    id: v.voter_id,
    name: investorNameMap.get(v.voter_id) ?? "Anonyme",
    amount: v.amount,
  })).sort((a, b) => b.amount - a.amount);

  const { data: images } = await supabase
    .from("poc_images")
    .select("id, storage_path")
    .eq("pitch_id", id);

  const imageUrls = (images ?? []).map((img) => {
    const { data } = supabase.storage
      .from("poc-images")
      .getPublicUrl(img.storage_path);
    return data.publicUrl;
  });

  const { data: author } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", pitch.author_id)
    .single();

  let userValidation: boolean | null = null;
  let approvalCount = 0;
  let rejectionCount = 0;

  if (pitch.status === "poc_submitted" || pitch.status === "validated" || pitch.status === "rejected") {
    const { data: validations } = await supabase
      .from("poc_validations")
      .select("voter_id, approved")
      .eq("pitch_id", id);

    approvalCount = (validations ?? []).filter((v) => v.approved).length;
    rejectionCount = (validations ?? []).filter((v) => !v.approved).length;

    if (user) {
      const mine = (validations ?? []).find((v) => v.voter_id === user.id);
      userValidation = mine?.approved ?? null;
    }
  }

  const { data: children } = await supabase
    .from("pitch_stats")
    .select("*")
    .eq("parent_id", id)
    .neq("status", "rejected")
    .order("potential_usd", { ascending: false });

  const { data: archivedChildren } = await supabase
    .from("pitch_stats")
    .select("*")
    .eq("parent_id", id)
    .eq("status", "rejected")
    .order("created_at", { ascending: false });

  let messages: { id: string; content: string; created_at: string; author_id: string }[] = [];
  let messageAuthors = new Map<string, string>();

  if (pitch.depth === 2) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, content, created_at, author_id")
      .eq("pitch_id", id)
      .order("created_at", { ascending: true });

    messages = msgs ?? [];

    if (messages.length > 0) {
      const authorIds = [...new Set(messages.map((m) => m.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);

      messageAuthors = new Map(
        (profiles ?? []).map((p) => [p.id, p.display_name ?? "Anonyme"]),
      );
    }
  }

  let shareholders: { name: string; profileId: string; amount: number; share: number }[] = [];

  if (pitch.status === "validated" && totalFunded > 0) {
    const voterIds = [...new Set((votes ?? []).map((v) => v.voter_id))];
    const { data: voterProfiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", voterIds);

    const nameMap = new Map(
      (voterProfiles ?? []).map((p) => [p.id, p.display_name ?? "Anonyme"]),
    );

    shareholders = (votes ?? [])
      .map((v) => ({
        name: nameMap.get(v.voter_id) ?? "Anonyme",
        profileId: v.voter_id,
        amount: v.amount,
        share: (v.amount / totalFunded) * 100,
      }))
      .sort((a, b) => b.share - a.share);
  }

  const progress = Math.min(100, (totalFunded / 1_000_000) * 100);

  const backHref = pitch.parent_id ? `/pitch/${pitch.parent_id}` : "/";
  const backLabel = pitch.parent_id ? `← ${DEPTH_LABELS[pitch.depth - 1] ?? "Retour"}` : "← Accueil";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href={backHref}
        className="mb-6 inline-block text-sm text-muted transition hover:text-foreground"
      >
        {backLabel}
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {depthLabel}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
            pitch.kind === "film"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
              : pitch.kind === "jeu"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                : pitch.kind === "logiciel"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
          }`}
        >
          {pitch.kind}
        </span>
        <StatusBadge status={pitch.status} />
        <time className="text-xs text-muted">{timeAgo(pitch.created_at)}</time>
      </div>

      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
        {pitch.title}
      </h1>
      <p className="mb-6 text-lg text-muted leading-relaxed">
        {pitch.one_liner}
      </p>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-mono font-bold text-accent text-lg">
            {formatUSD(totalFunded)}
          </span>
          <span className="text-muted">
            {investorCount} investisseur{investorCount !== 1 && "s"} · / $1,000,000
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
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

      {/* === Depth 0: formal deliverable workflow === */}
      {pitch.depth === 0 && (pitch.status === "open" || pitch.status === "rejected") && isAuthor && (
        <section className="mb-10 rounded-2xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="mb-4 text-lg font-bold">
            {pitch.status === "rejected" ? "Resoumettre le livrable" : "Soumettre le livrable"}
          </h2>
          <PocSubmitForm pitchId={pitch.id} />
        </section>
      )}

      {pitch.depth === 0 && pitch.status !== "open" && (
        <section className="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-lg font-bold">Ressources</h2>

          <div className="mb-4 flex flex-wrap gap-3">
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

          {pitch.poc_description && (
            <p className="mb-4 text-sm text-muted">{pitch.poc_description}</p>
          )}

          {imageUrls.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Image ${i + 1}`}
                    className="rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
                  />
                </a>
              ))}
            </div>
          )}

          {pitch.status === "poc_submitted" && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted">
                  Validation : {approvalCount} ✓ · {rejectionCount} ✗ / {investorCount}
                </span>
              </div>
              {isInvestor && (
                <PocValidateButton
                  pitchId={pitch.id}
                  currentVote={userValidation}
                />
              )}
            </div>
          )}
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
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Ressources</h2>
            {isAuthor && (
              <ResourceForm
                pitchId={pitch.id}
                currentUrl={pitch.poc_url}
                currentDescription={pitch.poc_description}
              />
            )}
          </div>

          {(pitch.poc_url || pitch.poc_description || imageUrls.length > 0) ? (
            <div>
              {pitch.poc_url && (
                <a
                  href={pitch.poc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_0_theme(colors.emerald.800)] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_theme(colors.emerald.800)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.emerald.800)] dark:bg-emerald-700 dark:shadow-[0_3px_0_0_theme(colors.emerald.950)]"
                >
                  📄 Voir la ressource
                  <span className="text-emerald-200">↗</span>
                </a>
              )}

              {pitch.poc_description && (
                <p className="mb-4 text-sm text-muted">{pitch.poc_description}</p>
              )}

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Image ${i + 1}`}
                        className="rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted italic">Aucune ressource.</p>
          )}
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
