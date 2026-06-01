-- TopShift production schema for Supabase.
-- Apply with: supabase db push

create extension if not exists pgcrypto;

create type public.company_country as enum ('at', 'de', 'ch');
create type public.company_industry as enum ('general', 'hospitality', 'retail', 'healthcare', 'production');
create type public.company_plan as enum ('free', 'small', 'business', 'enterprise');
create type public.member_role as enum ('admin', 'employee');
create type public.contract_type as enum ('fullTime', 'partTime', 'mini');
create type public.shift_status as enum ('draft', 'published', 'unassigned');
create type public.shift_type as enum ('early', 'mid', 'late', 'night', 'onCall');
create type public.swap_status as enum ('pending', 'approved', 'rejected');
create type public.absence_type as enum ('vacation', 'timeOff', 'care', 'training', 'unpaid', 'other');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.availability_kind as enum ('available', 'preferred', 'unavailable');
create type public.time_entry_type as enum ('start', 'pause_start', 'pause_end', 'end');
create type public.notification_type as enum ('published', 'shift', 'swap', 'sick', 'legal');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  preferred_language text not null default 'de' check (preferred_language in ('de', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  country public.company_country not null default 'at',
  industry public.company_industry not null default 'general',
  region text not null default 'at-wien',
  plan public.company_plan not null default 'free',
  onboarding_completed boolean not null default false,
  stripe_customer_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'employee',
  created_at timestamptz not null default now(),
  unique (company_id, profile_id)
);


create table public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  role public.member_role not null default 'employee',
  contract public.contract_type not null default 'fullTime',
  weekly_target numeric(5,2) not null default 40,
  is_minor boolean not null default false,
  preferences text not null default '',
  preferred_times text not null default '',
  avoid_days text not null default '',
  max_night_shifts int not null default 0,
  other_notes text not null default '',
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.employee_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  email text not null,
  role public.member_role not null default 'employee',
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, email, status)
);


create table public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes int not null default 0,
  type public.shift_type not null default 'early',
  created_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes int not null default 0,
  type public.shift_type not null default 'early',
  status public.shift_status not null default 'draft',
  notes text not null default '',
  override_log jsonb,
  actual boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sick_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  report_date date not null default current_date,
  duration text not null default '',
  created_at timestamptz not null default now()
);


create table public.absence_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  type public.absence_type not null default 'vacation',
  start_date date not null,
  end_date date not null,
  reason text not null default '',
  status public.request_status not null default 'pending',
  admin_reason text not null default '',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.delay_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  delay_minutes int not null check (delay_minutes > 0),
  message text not null default '',
  report_date date not null default current_date,
  created_at timestamptz not null default now()
);


create table public.availability_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  entry_date date not null,
  kind public.availability_kind not null default 'available',
  start_time time,
  end_time time,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, entry_date, kind, start_time, end_time)
);

create table public.open_shift_applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  status public.request_status not null default 'pending',
  message text not null default '',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, employee_id)
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  type public.time_entry_type not null,
  occurred_at timestamptz not null default now(),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requester_id uuid not null references public.employees(id) on delete cascade,
  own_shift_id uuid not null references public.shifts(id) on delete cascade,
  target_shift_id uuid references public.shifts(id) on delete cascade,
  target_employee_id uuid references public.employees(id) on delete cascade,
  peer_status public.request_status not null default 'pending',
  status public.swap_status not null default 'pending',
  message text not null default '',
  reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hour_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  allowances text not null default '',
  corrected_planned numeric(8,2),
  corrected_actual numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, month)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_profile_id uuid references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  text_key text not null,
  payload jsonb not null default '{}'::jsonb,
  delivered_email_at timestamptz,
  delivered_push_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  stripe_subscription_id text unique,
  status public.subscription_status,
  plan public.company_plan not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create or replace function public.enforce_employee_plan_limit()
returns trigger
language plpgsql
as $$
declare
  current_plan public.company_plan;
  employee_count int;
  employee_limit int;
begin
  select plan into current_plan from public.companies where id = new.company_id;
  select count(*) into employee_count from public.employees where company_id = new.company_id;

  employee_limit := case current_plan
    when 'free' then 5
    when 'small' then 20
    when 'business' then 60
    else null
  end;

  if employee_limit is not null and employee_count >= employee_limit then
    raise exception 'TopShift plan % allows a maximum of % employees', current_plan, employee_limit;
  end if;

  return new;
end;
$$;


create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger companies_updated_at before update on public.companies
  for each row execute function public.touch_updated_at();
create trigger employees_updated_at before update on public.employees
  for each row execute function public.touch_updated_at();
create trigger employees_plan_limit before insert on public.employees
  for each row execute function public.enforce_employee_plan_limit();
create trigger shifts_updated_at before update on public.shifts
  for each row execute function public.touch_updated_at();
create trigger absence_requests_updated_at before update on public.absence_requests
  for each row execute function public.touch_updated_at();
create trigger availability_entries_updated_at before update on public.availability_entries
  for each row execute function public.touch_updated_at();
create trigger open_shift_applications_updated_at before update on public.open_shift_applications
  for each row execute function public.touch_updated_at();
create trigger swap_requests_updated_at before update on public.swap_requests
  for each row execute function public.touch_updated_at();
create trigger hour_adjustments_updated_at before update on public.hour_adjustments
  for each row execute function public.touch_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.touch_updated_at();

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id
      and profile_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id
      and profile_id = auth.uid()
      and role = 'admin'
  );
$$;


create or replace function public.get_invitation_by_token(invite_token uuid)
returns table (
  id uuid,
  company_id uuid,
  company_name text,
  email text,
  role public.member_role,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invitations.id,
    invitations.company_id,
    companies.name as company_name,
    invitations.email,
    invitations.role,
    invitations.status,
    invitations.expires_at
  from public.employee_invitations invitations
  join public.companies companies on companies.id = invitations.company_id
  where invitations.token = invite_token
  limit 1;
$$;

create or replace function public.accept_invitation(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.employee_invitations%rowtype;
  auth_email text;
  employee_record public.employees%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  auth_email := lower(auth.jwt() ->> 'email');

  select * into invitation
  from public.employee_invitations
  where token = invite_token
    and status = 'pending'
    and expires_at > now();

  if not found then
    raise exception 'Invitation is invalid or expired';
  end if;

  if lower(invitation.email) <> auth_email then
    raise exception 'Invitation email does not match authenticated user';
  end if;

  insert into public.profiles (id, email, full_name)
  values (auth.uid(), auth_email, coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth_email))
  on conflict (id) do update set email = excluded.email;

  select * into employee_record
  from public.employees
  where id = invitation.employee_id;

  if not found then
    update public.employee_invitations
    set status = 'revoked'
    where id = invitation.id;
    raise exception 'Employee record no longer exists';
  end if;

  update public.employees
  set profile_id = auth.uid(), role = invitation.role
  where id = employee_record.id;

  insert into public.company_members (company_id, profile_id, role)
  values (invitation.company_id, auth.uid(), invitation.role)
  on conflict (company_id, profile_id) do update set role = excluded.role;

  update public.employee_invitations
  set status = 'accepted', accepted_at = now()
  where id = invitation.id;

  return invitation.company_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.employee_invitations enable row level security;
alter table public.locations enable row level security;
alter table public.employees enable row level security;
alter table public.shift_templates enable row level security;
alter table public.shifts enable row level security;
alter table public.sick_reports enable row level security;
alter table public.absence_requests enable row level security;
alter table public.delay_reports enable row level security;
alter table public.availability_entries enable row level security;
alter table public.open_shift_applications enable row level security;
alter table public.time_entries enable row level security;
alter table public.swap_requests enable row level security;
alter table public.hour_adjustments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles can read self" on public.profiles
  for select using (id = auth.uid());
create policy "profiles can insert self" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles can update self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "authenticated users can bootstrap companies" on public.companies
  for insert to authenticated with check (created_by = auth.uid());
create policy "members can read companies" on public.companies
  for select using (public.is_company_member(id));
create policy "admins can update companies" on public.companies
  for update using (public.is_company_admin(id)) with check (public.is_company_admin(id));

create policy "users can read their memberships" on public.company_members
  for select using (profile_id = auth.uid() or public.is_company_admin(company_id));
create policy "users can bootstrap own admin membership" on public.company_members
  for insert to authenticated with check (
    profile_id = auth.uid()
    and (
      public.is_company_admin(company_id)
      or exists (
        select 1 from public.companies
        where companies.id = company_id
          and companies.created_by = auth.uid()
      )
    )
  );
create policy "admins manage memberships" on public.company_members
  for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "admins delete memberships" on public.company_members
  for delete using (public.is_company_admin(company_id));


create policy "admins manage invitations" on public.employee_invitations
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "users can read own pending invitations" on public.employee_invitations
  for select using (lower(email) = lower((auth.jwt() ->> 'email')));

create policy "members read locations" on public.locations
  for select using (public.is_company_member(company_id));
create policy "admins manage locations" on public.locations
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members read employees" on public.employees
  for select using (public.is_company_member(company_id));
create policy "admins manage employees" on public.employees
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "employees update own preferences" on public.employees
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "members read templates" on public.shift_templates
  for select using (public.is_company_member(company_id));
create policy "admins manage templates" on public.shift_templates
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members read relevant shifts" on public.shifts
  for select using (
    public.is_company_admin(company_id)
    or (public.is_company_member(company_id) and status = 'published')
  );
create policy "admins manage shifts" on public.shifts
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members insert sick reports" on public.sick_reports
  for insert with check (public.is_company_member(company_id));
create policy "members read sick reports" on public.sick_reports
  for select using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = sick_reports.employee_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "admins manage sick reports" on public.sick_reports
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members create absence requests" on public.absence_requests
  for insert with check (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = absence_requests.employee_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "members read own absence requests" on public.absence_requests
  for select using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = absence_requests.employee_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "admins update absence requests" on public.absence_requests
  for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members create delay reports" on public.delay_reports
  for insert with check (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = delay_reports.employee_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "members read own delay reports" on public.delay_reports
  for select using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = delay_reports.employee_id
        and employees.profile_id = auth.uid()
    )
  );

create policy "members manage own availability" on public.availability_entries
  for all using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = availability_entries.employee_id
        and employees.profile_id = auth.uid()
    )
  ) with check (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = availability_entries.employee_id
        and employees.profile_id = auth.uid()
    )
  );

create policy "members read open shift applications" on public.open_shift_applications
  for select using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = open_shift_applications.employee_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "employees create own open shift applications" on public.open_shift_applications
  for insert with check (
    exists (
      select 1 from public.employees
      where employees.id = open_shift_applications.employee_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "admins update open shift applications" on public.open_shift_applications
  for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members manage own time entries" on public.time_entries
  for all using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = time_entries.employee_id
        and employees.profile_id = auth.uid()
    )
  ) with check (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id = time_entries.employee_id
        and employees.profile_id = auth.uid()
    )
  );

create policy "members read swaps" on public.swap_requests
  for select using (
    public.is_company_admin(company_id)
    or exists (
      select 1 from public.employees
      where employees.id in (swap_requests.requester_id, swap_requests.target_employee_id)
        and employees.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.shifts
      join public.employees on employees.id = shifts.employee_id
      where shifts.id = swap_requests.target_shift_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "members create swaps" on public.swap_requests
  for insert with check (public.is_company_member(company_id));
create policy "target employees update peer swap status" on public.swap_requests
  for update using (
    exists (
      select 1 from public.employees
      where employees.id = swap_requests.target_employee_id
        and employees.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.shifts
      join public.employees on employees.id = shifts.employee_id
      where shifts.id = swap_requests.target_shift_id
        and employees.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.employees
      where employees.id = swap_requests.target_employee_id
        and employees.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.shifts
      join public.employees on employees.id = shifts.employee_id
      where shifts.id = swap_requests.target_shift_id
        and employees.profile_id = auth.uid()
    )
  );
create policy "admins update swaps" on public.swap_requests
  for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members read hour adjustments" on public.hour_adjustments
  for select using (public.is_company_member(company_id));
create policy "admins manage hour adjustments" on public.hour_adjustments
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create policy "members read notifications" on public.notifications
  for select using (
    public.is_company_member(company_id)
    and (recipient_profile_id is null or recipient_profile_id = auth.uid() or public.is_company_admin(company_id))
  );
create policy "admins create notifications" on public.notifications
  for insert with check (public.is_company_admin(company_id));

create policy "admins read audit logs" on public.audit_logs
  for select using (public.is_company_admin(company_id));
create policy "admins create audit logs" on public.audit_logs
  for insert with check (public.is_company_admin(company_id));

create policy "admins read subscriptions" on public.subscriptions
  for select using (public.is_company_admin(company_id));
create policy "admins update subscriptions" on public.subscriptions
  for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create index employees_company_idx on public.employees(company_id);
create index employee_invitations_company_idx on public.employee_invitations(company_id, status);
create index shifts_company_date_idx on public.shifts(company_id, shift_date);
create index sick_reports_company_date_idx on public.sick_reports(company_id, report_date);
create index absence_requests_company_status_idx on public.absence_requests(company_id, status, start_date);
create index delay_reports_company_date_idx on public.delay_reports(company_id, report_date);
create index availability_entries_company_date_idx on public.availability_entries(company_id, entry_date);
create index open_shift_applications_company_shift_idx on public.open_shift_applications(company_id, shift_id, status);
create index time_entries_company_employee_idx on public.time_entries(company_id, employee_id, occurred_at desc);


create index swap_requests_company_status_idx on public.swap_requests(company_id, status);
create index notifications_recipient_idx on public.notifications(recipient_profile_id, created_at desc);
