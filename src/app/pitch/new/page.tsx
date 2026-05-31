import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPitch } from "@/app/actions/pitches";

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1.5px solid var(--ink)",
  background: "var(--card)",
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--foreground)",
  boxShadow: "var(--shadow-sm)",
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".08em",
};

export default async function NewPitchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="view-in app-shell" style={{ paddingTop: 16, paddingBottom: 48, maxWidth: 600 }}>
      <Link href="/" className="btn btn-sm btn-ghost" style={{ marginBottom: 18 }}>
        ← Retour
      </Link>
      <h1 className="serif" style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>Une ligne. Un million.</h1>
      <p className="serif italic" style={{ color: "var(--muted)", marginBottom: 24 }}>
        Pitche une idée. La foule décide de sa valeur.
      </p>

      <form action={createPitch} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="kind" style={labelStyle}>Type</label>
          <select name="kind" id="kind" defaultValue="film" style={inputStyle}>
            <option value="film">🎬 Film</option>
            <option value="concept">✦ Concept</option>
            <option value="jeu">🎮 Jeu</option>
            <option value="logiciel">💻 Logiciel</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" style={labelStyle}>Titre</label>
          <input type="text" name="title" id="title" required maxLength={200} placeholder="Le nom de ton idée" style={inputStyle} />
        </div>

        <div>
          <label htmlFor="one_liner" style={labelStyle}>La ligne</label>
          <textarea
            name="one_liner"
            id="one_liner"
            required
            maxLength={500}
            rows={3}
            placeholder="Décris l'idée en une phrase qui donne envie d'investir…"
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        <button type="submit" className="btn btn-accent btn-block" style={{ marginTop: 4 }}>
          Publier le pitch
        </button>
      </form>
    </div>
  );
}
