import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/Nav";
import { getUser, getUserBalance, getQuestsState } from "@/lib/supabase/server";
import { computeLevel, hasClaimable } from "@/lib/game";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "1M Pitch",
  description: "One line. One million.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const [balance, questsState] = user
    ? await Promise.all([getUserBalance(user.id), getQuestsState()])
    : [0, null];

  const level = questsState
    ? computeLevel({
        votesTotal: questsState.metrics.votes_total,
        pitchesTotal: questsState.metrics.pitches_total,
        sharesTotal: questsState.metrics.shares_total,
      }).level
    : 1;
  const hasQuests = hasClaimable(questsState);

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground font-sans">
        <Header user={user} balance={balance} level={level} hasQuests={hasQuests} />
        <main className="flex-1">{children}</main>
        <footer className="has-tabbar border-t border-line-strong py-6 text-center text-sm text-muted font-serif italic">
          1M Pitch — au commencement, une ligne.
        </footer>
        {user && <TabBar userId={user.id} hasQuests={hasQuests} />}
      </body>
    </html>
  );
}
