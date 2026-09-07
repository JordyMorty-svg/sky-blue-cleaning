-- Adds per-service tracking to the leads table, and lets the website's
-- request-a-quote forms (gutters, screens, pressure washing, solar) write a
-- lead without the window-only fields.
--
-- Idempotent and safe to re-run. Run in the Supabase SQL editor.
-- Run AFTER db/lead-skylights.sql.

-- 1. Which service the lead is asking about (free text, like leads.source).
alter table public.leads
  add column if not exists service text;

-- 2. The window-only columns don't apply to a gutter or solar request, so the
--    request forms send them as null. Drop NOT NULL on any of them that has it.
--    (In Postgres a CHECK such as stories in ('one','two') passes on NULL, so
--    no CHECK needs touching.)
do $$
declare
  col text;
begin
  foreach col in array array['stories', 'windows', 'skylights', 'interior', 'estimate']
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'leads'
        and column_name = col
    ) then
      execute format('alter table public.leads alter column %I drop not null', col);
    end if;
  end loop;
end $$;
