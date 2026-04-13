import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "1M Pitch";
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
          <div
            style={{
              fontSize: "40px",
              fontWeight: 900,
              color: "#f59e0b",
            }}
          >
            $
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#1c1917",
            }}
          >
            1M Pitch
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
