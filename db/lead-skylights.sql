-- Adds skylight tracking to the leads table.
-- Idempotent and safe to re-run. Run in the Supabase SQL editor.
--
-- The website quote form now offers skylights as an add-on (+$15 each).
-- Without this column the form still emails the lead through Web3Forms,
-- but the Supabase insert would fail and the lead would not reach the CRM.

alter table public.leads
  add column if not exists skylights integer not null default 0;
