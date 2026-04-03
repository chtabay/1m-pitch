import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { updatePitch } from "@/app/actions/pitches";
import Link from "next/link";

export default async function EditPitchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: pitch } = await supabase
    .from("pitches")
    .select("id, title, one_liner, kind, author_id")
    .eq("id", id)
    .single();

  if (!pitch || pitch.author_id !== user.id) notFound();

  const updateWithId = updatePitch.bind(null, pitch.id);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted transition hover:text-foreground"
      >
        ← Accueil
      </Link>

      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">
        Éditer le pitch
      </h1>

      <form action={updateWithId} className="space-y-6">
        <div>
          <label htmlFor="kind" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            name="kind"
            id="kind"
            defaultValue={pitch.kind}
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
          >
            <option value="film">Film</option>
            <option value="concept">Concept</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Titre du pitch
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            maxLength={200}
            defaultValue={pitch.title}
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
          />
        </div>

        <div>
          <label htmlFor="one_liner" className="mb-1 block text-sm font-medium">
            Le pitch en une ligne
          </label>
          <textarea
            name="one_liner"
            id="one_liner"
            required
            maxLength={500}
            rows={3}
            defaultValue={pitch.one_liner}
            className="w-full resize-none rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-zinc-900 transition hover:bg-accent-dark"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
