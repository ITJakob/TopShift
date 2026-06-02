-- TopShift Supabase live smoke test.
-- Run in Supabase SQL editor after applying migrations.

with required_relations(name) as (
  values
    ('public.profiles'),
    ('public.companies'),
    ('public.company_members'),
    ('public.employees'),
    ('public.employee_invitations'),
    ('public.shifts'),
    ('public.swap_requests'),
    ('public.absence_requests'),
    ('public.delay_reports'),
    ('public.availability_entries'),
    ('public.open_shift_applications'),
    ('public.time_entries'),
    ('public.notifications'),
    ('public.subscriptions')
)
select
  name,
  case when to_regclass(name) is null then 'missing' else 'ok' end as status
from required_relations;

with required_functions(name) as (
  values
    ('is_company_member'),
    ('is_company_admin'),
    ('get_invitation_by_token'),
    ('accept_invitation'),
    ('enforce_employee_plan_limit')
)
select
  required_functions.name as rpc,
  case when pg_proc.proname is null then 'missing' else 'ok' end as status
from required_functions
left join pg_proc on pg_proc.proname = required_functions.name
order by required_functions.name;

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'companies',
    'employees',
    'employee_invitations',
    'shifts',
    'swap_requests',
    'absence_requests',
    'time_entries'
  )
order by tablename;
