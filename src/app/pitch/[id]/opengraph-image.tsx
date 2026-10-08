import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const KIND_COLORS: Record<string, string> = {
  film: "#3b82f6",
  concept: "#a855f7",
  jeu: "#10b981",
  logiciel: "#f59e0b",
};

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pitch } = await supabase
    .from("pitches")
    .select("title, one_liner, kind")
    .eq("id", id)
    .single();

  const title = pitch?.title ?? "Pitch";
  const oneLiner = pitch?.one_liner ?? "";
  const kind = pitch?.kind ?? "concept";
  const kindColor = KIND_COLORS[kind] ?? "#a855f7";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          backgroundColor: "#f5f0e8",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: "4px solid #1c1917",
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* Kind badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: kindColor,
              color: "white",
              padding: "8px 20px",
              borderRadius: "9999px",
              fontSize: "24px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              border: "2px solid #1c1917",
            }}
          >
            {kind}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#1c1917",
            lineHeight: 1.15,
            marginBottom: "20px",
            maxWidth: "900px",
          }}
        >
          {title.length > 60 ? `${title.slice(0, 57)}...` : title}
        </div>

        {/* One-liner */}
        <div
          style={{
            fontSize: "28px",
            color: "#78716c",
            lineHeight: 1.4,
            maxWidth: "900px",
          }}
        >
          {oneLiner.length > 120 ? `${oneLiner.slice(0, 117)}...` : oneLiner}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 32 32" style={{ transform: "rotate(-6deg)" }}>
            <rect x="2" y="2" width="28" height="28" rx="8.5" fill="#f59e0b" stroke="#1c1917" strokeWidth="1.8" />
            <circle cx="9.5" cy="18.6" r="2.5" fill="#1c1917" />
            <circle cx="16" cy="18.6" r="2.5" fill="#1c1917" />
            <circle cx="22.5" cy="18.6" r="2.5" fill="#1c1917" />
          </svg>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#1c1917",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
