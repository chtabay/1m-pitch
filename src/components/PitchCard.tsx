import { timeAgo } from "@/lib/format";
import { HOT_THRESHOLD } from "@/lib/game";
import { KindChip, Flame, FundBar, Thumb } from "./ui";
import { InvestButton } from "./InvestButton";
import Link from "next/link";
import Image from "next/image";

type Props = {
  pitch: {
    pitch_id: string;
    title: string;
    one_liner: string;
    kind: string;
    status: "open" | "poc_submitted" | "validated" | "rejected";
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
  velocity?: number;
};

export function PitchCard({
  pitch,
  authorName,
  hasVoted,
  isLoggedIn,
  userBalance,
  isOwner,
  thumbnailUrl,
  velocity = 0,
}: Props) {
  const hot = velocity >= HOT_THRESHOLD;
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Link href={`/pitch/${pitch.pitch_id}`} style={{ display: "block" }}>
        <div style={{ borderBottom: "1.5px solid var(--ink)", position: "relative" }}>
          <div style={{ aspectRatio: "16 / 9", position: "relative", overflow: "hidden" }}>
            {thumbnailUrl ? (
              <Image src={thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
            ) : (
              <Thumb kind={pitch.kind} />
            )}
          </div>
          <span style={{ position: "absolute", left: 12, top: 12 }}>
            <KindChip kind={pitch.kind} />
          </span>
          {pitch.status === "open" && hot && (
            <span
              style={{ position: "absolute", right: 12, top: 12, background: "var(--card)", border: "1px solid var(--ink)", borderRadius: 999, padding: "2px 8px" }}
            >
              <Flame velocity={velocity} live />
            </span>
          )}
          {pitch.status === "validated" && (
            <span style={{ position: "absolute", right: 12, top: 12, background: "var(--gain)", color: "#fff", border: "1px solid var(--ink)", borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 800 }}>
              ✓ Validé
            </span>
          )}
          {pitch.status === "poc_submitted" && (
            <span style={{ position: "absolute", right: 12, top: 12, background: "var(--cool)", color: "#fff", border: "1px solid var(--ink)", borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 800 }}>
              ⚖ En revue
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
          <span>{timeAgo(pitch.created_at)}</span>
          <span>
            {pitch.vote_count} investisseur{pitch.vote_count !== 1 ? "s" : ""}
          </span>
        </div>
        <Link href={`/pitch/${pitch.pitch_id}`}>
          <h3 className="serif" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15, marginBottom: 6 }}>
            {pitch.title}
          </h3>
        </Link>
        <p
          style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)", margin: 0, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {pitch.one_liner}
        </p>

        <div style={{ marginTop: "auto" }}>
          <FundBar funded={pitch.potential_usd} shine={hot} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              par {authorName ?? "Anonyme"}
            </span>
            {pitch.status === "validated" ? (
              <span className="pill" style={{ borderColor: "var(--gain)", color: "var(--gain)" }}>Actionnaire</span>
            ) : pitch.status === "rejected" ? (
              <Link href={`/pitch/${pitch.pitch_id}`} className="btn btn-sm btn-ghost">Voir</Link>
            ) : isOwner ? (
              <Link href={`/pitch/${pitch.pitch_id}`} className="btn btn-sm btn-ghost">Mon pitch</Link>
            ) : (
              <InvestButton
                pitchId={pitch.pitch_id}
                title={pitch.title}
                kind={pitch.kind}
                funded={pitch.potential_usd}
                balance={userBalance}
                hasVoted={hasVoted}
                disabled={!isLoggedIn}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
