// ============================================================
// 1M Pitch — game model (pure helpers, no React/DB).
// Drives the gamification UI from real data: XP/level, momentum
// (velocity), ROI, badges, and the quest/bonus catalog.
//
// Quest reward/goal constants MUST mirror supabase claim_quest().
// ============================================================

export type Kind = "film" | "concept" | "jeu" | "logiciel";

export const KIND_META: Record<Kind, { label: string; emoji: string; chip: string }> = {
  film: { label: "Film", emoji: "🎬", chip: "chip-film" },
  jeu: { label: "Jeu", emoji: "🎮", chip: "chip-jeu" },
  logiciel: { label: "Logiciel", emoji: "💻", chip: "chip-logiciel" },
  concept: { label: "Concept", emoji: "✦", chip: "chip-concept" },
};

export function kindMeta(kind: string) {
  return KIND_META[(kind as Kind)] ?? KIND_META.concept;
}

// ---------- XP / levels ----------
const LEVEL_NAMES = [
  "Apprenti",
  "Parieur",
  "Investisseur",
  "Spéculateur",
  "Magnat",
  "Oracle",
  "Légende",
];
// cumulative XP required to *reach* each level (index = level-1)
const LEVEL_THRESHOLDS = [0, 500, 1300, 2600, 4500, 7200, 11000];

export type PlayerStats = {
  votesTotal: number;
  pitchesTotal: number;
  sharesTotal: number;
};

export function computeXp(s: PlayerStats): number {
  return s.votesTotal * 120 + s.pitchesTotal * 300 + s.sharesTotal * 600;
}

export function computeLevel(s: PlayerStats) {
  const xp = computeXp(s);
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const idx = level - 1;
  const base = LEVEL_THRESHOLDS[idx] ?? 0;
  const next = LEVEL_THRESHOLDS[idx + 1] ?? null;
  const name = LEVEL_NAMES[idx] ?? LEVEL_NAMES[LEVEL_NAMES.length - 1];
  const progress = next ? Math.min(100, ((xp - base) / (next - base)) * 100) : 100;
  return { level, name, xp, base, next, progress };
}

// ---------- momentum / velocity ----------
// A 0–100 "heat" score. Primary signal: capital invested in the last 24h.
// Falls back to recency when there's no fresh activity, so a pitch is never
// flat-zero just because the demo data is old.
export function computeVelocity(opts: {
  invested24h: number;
  votes24h: number;
  hoursAgo: number;
  funded: number;
}): number {
  const fresh = opts.votes24h * 16 + opts.invested24h / 12000;
  if (fresh > 0) return Math.max(1, Math.min(99, Math.round(fresh)));
  // fallback: younger + better-funded pitches stay warm
  const recency = Math.max(0, 60 - opts.hoursAgo / 3);
  const funding = Math.min(30, opts.funded / 40000);
  return Math.max(1, Math.min(54, Math.round(recency + funding)));
}

export const HOT_THRESHOLD = 55;

// ---------- ROI ----------
export type Position = {
  pitch_id: string;
  title: string;
  kind: Kind;
  status: string;
  amount: number;
  created_at: string;
  entry_total: number;
  current_total: number;
  value: number;
};

export function roiPct(p: { amount: number; value: number }): number {
  if (p.amount <= 0) return 0;
  return ((p.value - p.amount) / p.amount) * 100;
}

export function summarizePortfolio(positions: Position[]) {
  const invested = positions.reduce((s, p) => s + p.amount, 0);
  const value = positions.reduce((s, p) => s + p.value, 0);
  const gain = value - invested;
  const pct = invested > 0 ? (gain / invested) * 100 : 0;
  const shares = positions.filter((p) => p.status === "validated").length;
  return { invested, value, gain, pct, shares };
}

// ---------- badges (derived) ----------
export type BadgeInput = PlayerStats & { bestRoiPct: number; filmInvest: number };

export function computeBadges(b: BadgeInput) {
  return [
    { id: "starter", icon: "🌱", label: "Premier pari", sub: "Investi dans une idée", earned: b.votesTotal >= 1 },
    { id: "flair", icon: "📈", label: "Flair", sub: "ROI > +25% sur une idée", earned: b.bestRoiPct >= 25 },
    { id: "cinephile", icon: "🎬", label: "Cinéphile", sub: "3 films financés", earned: b.filmInvest >= 3 },
    { id: "builder", icon: "✦", label: "Bâtisseur", sub: "Publie 3 pitchs", earned: b.pitchesTotal >= 3 },
    { id: "shareholder", icon: "👑", label: "Actionnaire", sub: "Part dans une idée validée", earned: b.sharesTotal >= 1 },
    { id: "whale", icon: "💎", label: "Baleine", sub: "10 investissements", earned: b.votesTotal >= 10 },
  ];
}

// ---------- quest catalog (display; rewards mirror SQL) ----------
export type QuestDef = {
  key: string;
  icon: string;
  title: string;
  reward: number;
  goal: number;
  period: "daily" | "weekly";
  metric: keyof QuestMetrics;
};

export type QuestMetrics = {
  votes_today: number;
  jeu_week: number;
  early_week: number;
  pitch_week: number;
  votes_total: number;
  pitches_total: number;
  shares_total: number;
};

export const QUESTS: QuestDef[] = [
  { key: "daily_invest1", icon: "🎯", title: "Premier investissement du jour", reward: 2000, goal: 1, period: "daily", metric: "votes_today" },
  { key: "daily_invest2", icon: "🔥", title: "Investis dans 2 idées aujourd'hui", reward: 5000, goal: 2, period: "daily", metric: "votes_today" },
  { key: "weekly_jeu3", icon: "🎮", title: "Investis dans 3 jeux", reward: 20000, goal: 3, period: "weekly", metric: "jeu_week" },
  { key: "weekly_early2", icon: "🌱", title: "Sois early sur 2 idées (< $300k)", reward: 25000, goal: 2, period: "weekly", metric: "early_week" },
  { key: "weekly_pitch1", icon: "✦", title: "Publie un pitch cette semaine", reward: 15000, goal: 1, period: "weekly", metric: "pitch_week" },
];

export type QuestsState = {
  ok: boolean;
  today: string;
  week_start: string;
  streak: number;
  daily_bonus_claimed: boolean;
  metrics: QuestMetrics;
  claimed_keys: string[];
};

/** Resolve a quest's runtime state (progress / done / claimed) from server state. */
export function resolveQuest(def: QuestDef, st: QuestsState) {
  const progress = Math.min(def.goal, st.metrics[def.metric] ?? 0);
  const done = progress >= def.goal;
  const period = def.period === "daily" ? st.today : st.week_start;
  const claimed = st.claimed_keys.includes(`${def.key}:${period}`);
  return { ...def, progress, done, claimed };
}

/** True when the user has a daily bonus or a finished-but-unclaimed quest waiting. */
export function hasClaimable(st: QuestsState | null): boolean {
  if (!st) return false;
  if (!st.daily_bonus_claimed) return true;
  return QUESTS.some((def) => {
    const r = resolveQuest(def, st);
    return r.done && !r.claimed;
  });
}

/** Amount the *next* daily-bonus claim will grant, given the current live streak. */
export function nextDailyBonus(streak: number): number {
  // claiming today extends the run to (streak + 1): 2000 + min((streak+1)-1, 6) * 1000
  return 2000 + Math.min(streak, 6) * 1000;
}
