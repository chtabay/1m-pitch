import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "./AuthButton";
import { formatUSD } from "@/lib/format";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
    balance = profile?.balance ?? 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-card/80 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-accent text-2xl">$</span>
          <span>1M&nbsp;Pitch</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user && (
            <>
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <span className="font-mono text-sm font-semibold text-accent">
                  {formatUSD(balance)}
                </span>
                <span className="text-xs text-muted">▸</span>
              </Link>
              <Link
                href="/pitch/new"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-accent-dark"
              >
                + Pitch
              </Link>
            </>
          )}
          <AuthButton user={user} />
        </nav>
      </div>
    </header>
  );
}
