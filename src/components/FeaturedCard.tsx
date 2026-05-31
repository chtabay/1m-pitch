import { KindChip, FundBar, Thumb } from "./ui";
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
};

export function FeaturedCard({ pitch, authorName, hasVoted, isLoggedIn, userBalance, isOwner, thumbnailUrl }: Props) {
  return (
    <article className="card" style={{ overflow: "hidden" }}>
      <div className="feat-grid">
        <div style={{ borderBottom: "1.5px solid var(--ink)", position: "relative", minHeight: 180 }}>
          <Link href={`/pitch/${pitch.pitch_id}`} style={{ display: "block", height: "100%" }}>
            <div style={{ aspectRatio: "16 / 9", position: "relative", overflow: "hidden", height: "100%" }}>
              {thumbnailUrl ? (
                <Image src={thumbnailUrl} alt="" fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              ) : (
                <Thumb kind={pitch.kind} />
              )}
            </div>
          </Link>
          <span style={{ position: "absolute", left: 14, top: 14 }}>
            <KindChip kind={pitch.kind} />
          </span>
          <span
            style={{ position: "absolute", right: 14, top: 14, background: "var(--accent)", color: "#2a1c05", border: "1px solid var(--ink)", borderRadius: 999, padding: "3px 11px", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", whiteSpace: "nowrap" }}
          >
            ★ À la une
          </span>
        </div>

        <div style={{ padding: 22 }}>
          <Link href={`/pitch/${pitch.pitch_id}`}>
            <h2 className="serif" style={{ fontSize: 27, fontWeight: 900, lineHeight: 1.08, marginBottom: 8 }}>{pitch.title}</h2>
          </Link>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--muted)", marginTop: 0, marginBottom: 18 }}>{pitch.one_liner}</p>
          <FundBar funded={pitch.potential_usd} shine />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
              par {authorName ?? "Anonyme"} · {pitch.vote_count} investisseur{pitch.vote_count !== 1 ? "s" : ""}
            </span>
            {pitch.status === "validated" ? (
              <span className="pill" style={{ borderColor: "var(--gain)", color: "var(--gain)" }}>Actionnaire</span>
            ) : pitch.status === "rejected" || isOwner ? (
              <Link href={`/pitch/${pitch.pitch_id}`} className="btn btn-sm btn-ghost">Voir</Link>
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
