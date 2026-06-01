-- Optional local/demo seed. Replace auth user ids with real profile ids when using locally.

insert into public.profiles (id, email, full_name, preferred_language)
values ('00000000-0000-0000-0000-000000000001', 'admin@topshift.local', 'Demo Admin', 'de')
on conflict (id) do nothing;

insert into public.companies (id, name, country, industry, plan, created_by)
values (
  '10000000-0000-0000-0000-000000000001',
  'TopShift Demo GmbH',
  'at',
  'general',
  'free',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

insert into public.company_members (company_id, profile_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin')
on conflict (company_id, profile_id) do nothing;

insert into public.locations (id, company_id, name)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Wien Zentrale')
on conflict (company_id, name) do nothing;

insert into public.employees (
  id,
  company_id,
  name,
  email,
  role,
  contract,
  weekly_target,
  is_minor,
  preferences,
  preferred_times,
  avoid_days,
  max_night_shifts,
  other_notes
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Anna Berger',
    'anna.berger@example.com',
    'employee',
    'fullTime',
    40,
    false,
    'Keine Nachtschicht am Sonntag. Max. 3 Nachtschichten pro Monat.',
    'Früh oder Mittel',
    'Sonntag wegen Betreuungspflichten',
    3,
    'Kann kurzfristig einspringen.'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Lukas Steiner',
    'lukas.steiner@example.com',
    'employee',
    'partTime',
    24,
    false,
    'Montag früh vermeiden.',
    'Spät',
    'Montag früh',
    2,
    ''
  )
on conflict (company_id, email) do nothing;

insert into public.shift_templates (company_id, name, start_time, end_time, break_minutes, type)
values
  ('10000000-0000-0000-0000-000000000001', 'Früh 08-16:30', '08:00', '16:30', 30, 'early'),
  ('10000000-0000-0000-0000-000000000001', 'Nacht 22-06', '22:00', '06:00', 45, 'night');
