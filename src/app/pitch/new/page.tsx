import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createPitch } from "@/app/actions/pitches";

export default async function NewPitchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">
        Nouveau pitch
      </h1>

      <form action={createPitch} className="space-y-6">
        <div>
          <label
            htmlFor="kind"
            className="mb-1 block text-sm font-medium"
          >
            Type
          </label>
          <select
            name="kind"
            id="kind"
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
          >
            <option value="film">Film</option>
            <option value="concept">Concept</option>
            <option value="jeu">Jeu</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium"
          >
            Titre du pitch
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            maxLength={200}
            placeholder="Ex : Les Dents de la Terre"
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
          />
        </div>

        <div>
          <label
            htmlFor="one_liner"
            className="mb-1 block text-sm font-medium"
          >
            Le pitch en une ligne
          </label>
          <textarea
            name="one_liner"
            id="one_liner"
            required
            maxLength={500}
            rows={3}
            placeholder="Ex : Un tremblement de terre géant traque un village côtier et dévore ses habitants un par un."
            className="w-full resize-none rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-zinc-900 transition hover:bg-accent-dark"
        >
          Publier le pitch
        </button>
      </form>
    </div>
  );
}
