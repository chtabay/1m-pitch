-- ============================================================
-- 1M Pitch — gamification backend
-- Additive only. Scoped to the pitch domain (profiles / pitches / votes).
-- Safe to run on the shared project: introduces only new objects.
--
--   * capital_grants     idempotent capital payouts (quests + daily bonus)
--   * claim_quest()      verify a quest server-side, credit once
--   * claim_daily_bonus()streak-based daily login bonus, credit once / day
--   * get_quests_state() metrics + claim state + streak for the Quêtes page
--   * get_portfolio()    per-position ROI derived from real vote history
--   * pitch_momentum     24h funding velocity per pitch (the "idées en feu")
--
-- Quest reward/goal constants live in BOTH claim_quest() (authoritative) and
-- src/lib/game.ts (display). Keep them in sync.
-- ============================================================

-- ---------- capital_grants ----------
create table if not exists public.capital_grants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  grant_key   text not null,                 -- e.g. 'daily_invest2:2026-05-31'
  kind        text not null,                 -- 'quest' | 'daily_bonus'
  label       text not null,
  amount      bigint not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, grant_key)
);

alter table public.capital_grants enable row level security;

drop policy if exists "capital_grants_select_own" on public.capital_grants;
create policy "capital_grants_select_own" on public.capital_grants
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy: rows are written only by the SECURITY DEFINER
-- functions below, never directly by clients.

create index if not exists capital_grants_user_idx on public.capital_grants(user_id);

-- ---------- claim a quest ----------
create or replace function public.claim_quest(p_key text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  today      date := (now() at time zone 'Europe/Paris')::date;
  week_start date := (date_trunc('week', (now() at time zone 'Europe/Paris')))::date;
  reward     bigint;
  goal       int;
  metric     int;
  label      text;
  period     text;
  gkey       text;
  bal        bigint;
begin
  if uid is null then
    return json_build_object('ok', false, 'message', 'Non connecté');
  end if;

  if p_key = 'daily_invest2' then
    reward := 5000; goal := 2; label := 'Investis dans 2 idées'; period := today::text;
    select count(*) into metric from votes
      where voter_id = uid and (created_at at time zone 'Europe/Paris')::date = today;
  elsif p_key = 'daily_invest1' then
    reward := 2000; goal := 1; label := 'Premier investissement du jour'; period := today::text;
    select count(*) into metric from votes
      where voter_id = uid and (created_at at time zone 'Europe/Paris')::date = today;
  elsif p_key = 'weekly_jeu3' then
    reward := 20000; goal := 3; label := 'Investis dans 3 jeux'; period := week_start::text;
    select count(distinct v.pitch_id) into metric
      from votes v join pitches p on p.id = v.pitch_id
      where v.voter_id = uid and p.kind = 'jeu'
        and (v.created_at at time zone 'Europe/Paris')::date >= week_start;
  elsif p_key = 'weekly_early2' then
    reward := 25000; goal := 2; label := 'Sois early sur 2 idées (< $300k)'; period := week_start::text;
    select count(*) into metric from (
      select v.pitch_id from votes v
      where v.voter_id = uid
        and (v.created_at at time zone 'Europe/Paris')::date >= week_start
        and (select coalesce(sum(amount),0) from votes vv where vv.pitch_id = v.pitch_id) < 300000
      group by v.pitch_id
    ) s;
  elsif p_key = 'weekly_pitch1' then
    reward := 15000; goal := 1; label := 'Publie un pitch cette semaine'; period := week_start::text;
    select count(*) into metric from pitches
      where author_id = uid and depth = 0
        and (created_at at time zone 'Europe/Paris')::date >= week_start;
  else
    return json_build_object('ok', false, 'message', 'Quête inconnue');
  end if;

  if metric < goal then
    return json_build_object('ok', false, 'message', 'Quête non terminée');
  end if;

  gkey := p_key || ':' || period;

  insert into capital_grants(user_id, grant_key, kind, label, amount)
  values (uid, gkey, 'quest', label, reward)
  on conflict (user_id, grant_key) do nothing;

  if not found then
    return json_build_object('ok', false, 'message', 'Déjà encaissée');
  end if;

  update profiles set balance = balance + reward where id = uid returning balance into bal;
  return json_build_object('ok', true, 'amount', reward, 'balance', bal, 'label', label);
end;
$$;

-- ---------- claim the daily login bonus ----------
create or replace function public.claim_daily_bonus()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid    uuid := auth.uid();
  today  date := (now() at time zone 'Europe/Paris')::date;
  d      date;
  streak int := 0;
  reward bigint;
  bal    bigint;
begin
  if uid is null then
    return json_build_object('ok', false, 'message', 'Non connecté');
  end if;

  if exists (select 1 from capital_grants where user_id = uid and grant_key = 'daily_bonus:' || today) then
    return json_build_object('ok', false, 'message', 'Bonus déjà encaissé aujourd''hui');
  end if;

  -- consecutive prior days already claimed
  d := today - 1;
  loop
    if exists (select 1 from capital_grants where user_id = uid and grant_key = 'daily_bonus:' || d) then
      streak := streak + 1;
      d := d - 1;
    else
      exit;
    end if;
  end loop;
  streak := streak + 1; -- include today

  reward := 2000 + least(streak - 1, 6) * 1000;

  insert into capital_grants(user_id, grant_key, kind, label, amount)
  values (uid, 'daily_bonus:' || today, 'daily_bonus',
          'Série de ' || streak || ' jour' || (case when streak > 1 then 's' else '' end), reward);

  update profiles set balance = balance + reward where id = uid returning balance into bal;
  return json_build_object('ok', true, 'amount', reward, 'balance', bal, 'streak', streak);
end;
$$;

-- ---------- quest state for the Quêtes page ----------
create or replace function public.get_quests_state()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  today        date := (now() at time zone 'Europe/Paris')::date;
  week_start   date := (date_trunc('week', (now() at time zone 'Europe/Paris')))::date;
  votes_today  int; jeu_week int; early_week int; pitch_week int;
  votes_total  int; pitches_total int; shares_total int;
  daily_done   boolean;
  streak       int := 0;
  d            date;
  claimed_keys text[];
begin
  if uid is null then
    return json_build_object('ok', false);
  end if;

  select count(*) into votes_today from votes
    where voter_id = uid and (created_at at time zone 'Europe/Paris')::date = today;
  select count(distinct v.pitch_id) into jeu_week from votes v join pitches p on p.id = v.pitch_id
    where v.voter_id = uid and p.kind = 'jeu' and (v.created_at at time zone 'Europe/Paris')::date >= week_start;
  select count(*) into early_week from (
    select v.pitch_id from votes v where v.voter_id = uid
      and (v.created_at at time zone 'Europe/Paris')::date >= week_start
      and (select coalesce(sum(amount),0) from votes vv where vv.pitch_id = v.pitch_id) < 300000
    group by v.pitch_id) s;
  select count(*) into pitch_week from pitches
    where author_id = uid and depth = 0 and (created_at at time zone 'Europe/Paris')::date >= week_start;
  select count(*) into votes_total from votes where voter_id = uid;
  select count(*) into pitches_total from pitches where author_id = uid and depth = 0;
  select count(*) into shares_total from votes v join pitches p on p.id = v.pitch_id
    where v.voter_id = uid and p.status = 'validated';

  daily_done := exists (select 1 from capital_grants where user_id = uid and grant_key = 'daily_bonus:' || today);

  -- live streak: count back from today if already claimed today, else from yesterday
  d := case when daily_done then today else today - 1 end;
  loop
    if exists (select 1 from capital_grants where user_id = uid and grant_key = 'daily_bonus:' || d) then
      streak := streak + 1;
      d := d - 1;
    else
      exit;
    end if;
  end loop;

  select coalesce(array_agg(grant_key), '{}') into claimed_keys from capital_grants where user_id = uid;

  return json_build_object(
    'ok', true,
    'today', today::text,
    'week_start', week_start::text,
    'streak', streak,
    'daily_bonus_claimed', daily_done,
    'metrics', json_build_object(
      'votes_today', votes_today, 'jeu_week', jeu_week, 'early_week', early_week,
      'pitch_week', pitch_week, 'votes_total', votes_total,
      'pitches_total', pitches_total, 'shares_total', shares_total),
    'claimed_keys', to_json(claimed_keys)
  );
end;
$$;

-- ---------- portfolio with ROI ----------
-- value = amount * (current_total / entry_total), where entry_total is the
-- pitch's funding at the moment the user invested (derived from vote history).
create or replace function public.get_portfolio(p_user uuid)
returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(t) order by t.value desc), '[]'::json)
  from (
    select
      v.pitch_id,
      p.title,
      p.kind,
      p.status,
      v.amount,
      v.created_at,
      (select coalesce(sum(vv.amount),0) from votes vv
        where vv.pitch_id = v.pitch_id and vv.created_at <= v.created_at) as entry_total,
      (select coalesce(sum(vv.amount),0) from votes vv
        where vv.pitch_id = v.pitch_id) as current_total,
      round(
        v.amount * (
          (select coalesce(sum(vv.amount),0) from votes vv where vv.pitch_id = v.pitch_id)::numeric
          / nullif((select coalesce(sum(vv.amount),0) from votes vv
              where vv.pitch_id = v.pitch_id and vv.created_at <= v.created_at), 0)
        )
      )::bigint as value
    from votes v
    join pitches p on p.id = v.pitch_id
    where v.voter_id = p_user
  ) t;
$$;

-- ---------- momentum view ("idées en feu") ----------
create or replace view public.pitch_momentum
with (security_invoker = on) as
select
  p.id as pitch_id,
  coalesce(sum(v.amount) filter (where v.created_at > now() - interval '24 hours'), 0) as invested_24h,
  count(v.id) filter (where v.created_at > now() - interval '24 hours') as votes_24h
from pitches p
left join votes v on v.pitch_id = p.id
group by p.id;

-- ---------- grants ----------
grant execute on function public.claim_quest(text)      to authenticated;
grant execute on function public.claim_daily_bonus()    to authenticated;
grant execute on function public.get_quests_state()     to authenticated;
grant execute on function public.get_portfolio(uuid)    to anon, authenticated;
grant select  on public.pitch_momentum                  to anon, authenticated;
