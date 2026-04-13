import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { AuthButton } from "./AuthButton";
import { formatUSD } from "@/lib/format";

export async function Header() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

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
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-lg">
          <span className="inline-block text-accent text-3xl -rotate-6 transition-transform hover:rotate-0">$</span>
          <span>1M&nbsp;Pitch</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-card px-2 py-1.5 text-xs sm:px-3 sm:text-sm shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.ink)]"
              >
                <span className="font-mono font-semibold text-accent">
                  {formatUSD(balance)}
                </span>
                <span className="text-muted">▸</span>
              </Link>
              <Link
                href="/pitch/new"
                className="whitespace-nowrap rounded-lg border-2 border-ink bg-accent px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold text-zinc-900 shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-[0_0px_0_0_theme(colors.ink)]"
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
