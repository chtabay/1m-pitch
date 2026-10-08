import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AuthButton } from "./AuthButton";
import { DesktopNav } from "./Nav";
import { Icon } from "./ui";
import { formatUSD } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { BrandMark } from "./BrandMark";

type Props = {
  user: User | null;
  balance: number;
  level: number;
  hasQuests: boolean;
};

export function Header({ user, balance, level, hasQuests }: Props) {
  return (
    <header className="hdr">
      <div className="app-shell hdr-in">
        <Link href="/" className="brand">
          <span className="mark"><BrandMark size={30} /></span>
          <span className="name">{SITE_NAME}</span>
        </Link>

        <DesktopNav userId={user?.id ?? null} hasQuests={hasQuests} />

        <div className="hdr-right">
          {user && (
            <Link href="/portfolio" className="wallet-chip" aria-label="Portfolio">
              <span className="lvl">{level}</span>
              <span className="amt">{formatUSD(balance)}</span>
            </Link>
          )}
          {user && (
            <Link href="/pitch/new" className="btn-pitch">
              <Icon name="plus" size={15} />
              Pitch
            </Link>
          )}
          <AuthButton user={user} />
        </div>
      </div>
    </header>
  );
}
