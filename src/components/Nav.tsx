"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui";

type NavProps = {
  userId: string | null;
  hasQuests?: boolean;
};

function useActive() {
  const path = usePathname() ?? "/";
  return (key: string) => {
    if (key === "flux") return path === "/";
    if (key === "quests") return path.startsWith("/quests");
    if (key === "portfolio") return path.startsWith("/portfolio");
    if (key === "profile") return path.startsWith("/profile");
    return false;
  };
}

// ---------- desktop top nav ----------
export function DesktopNav({ userId, hasQuests }: NavProps) {
  const isActive = useActive();
  const links: [string, string, string][] = [
    ["flux", "Flux", "/"],
    ["quests", "Quêtes", "/quests"],
    ["portfolio", "Portfolio", "/portfolio"],
  ];
  if (userId) links.push(["profile", "Profil", `/profile/${userId}`]);

  return (
    <nav className="hdr-nav">
      {links.map(([key, label, href]) => (
        <Link key={key} href={href} className={isActive(key) ? "on" : ""}>
          {label}
          {key === "quests" && hasQuests && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: 99,
                background: "var(--hot)",
              }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}

// ---------- mobile bottom tab bar ----------
function TabItem({
  active,
  label,
  icon,
  href,
  badge,
}: {
  active: boolean;
  label: string;
  icon: string;
  href: string;
  badge?: boolean;
}) {
  return (
    <Link href={href} className={"tab" + (active ? " on" : "")}>
      <Icon name={icon} size={22} />
      {badge && <span className="badge-dot" />}
      <span>{label}</span>
    </Link>
  );
}

export function TabBar({ userId, hasQuests }: NavProps) {
  const isActive = useActive();
  return (
    <nav className="tabbar">
      <TabItem active={isActive("flux")} label="Flux" icon="flux" href="/" />
      <TabItem active={isActive("quests")} label="Quêtes" icon="quests" href="/quests" badge={hasQuests} />
      <Link href="/pitch/new" className="tab tab-fab" aria-label="Nouveau pitch">
        <span className="fab">+</span>
      </Link>
      <TabItem active={isActive("portfolio")} label="Portfolio" icon="wallet" href="/portfolio" />
      <TabItem active={isActive("profile")} label="Profil" icon="user" href={userId ? `/profile/${userId}` : "/"} />
    </nav>
  );
}
