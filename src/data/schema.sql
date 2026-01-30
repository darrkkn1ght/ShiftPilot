-- Enable UUID extension (if not already enabled)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type app_role as enum ('admin', 'staff');
create type shift_status as enum ('draft', 'published', 'canceled');
create type request_type as enum ('time_off', 'swap');
create type request_status as enum ('pending', 'approved', 'declined');

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- Businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  late_threshold_minutes integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Business Members (Links Auth Users to Businesses)
create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  role app_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, business_id)
);

-- Staff (The "Employee" entity - Schedule & Payroll)
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null, -- Optional link to auth user for "My Shifts"
  name text not null,
  role app_role not null default 'staff', -- Role for schedule display
  hourly_rate numeric(10, 2) not null default 0.00,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Shifts
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status shift_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Time Entries
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete cascade not null,
  clock_in timestamptz not null,
  clock_out timestamptz, -- Null if currently clocked in
  minutes_late integer default 0,
  total_minutes integer default 0,
  source text default 'mobile',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Requests (Time Off / Swaps)
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete cascade not null,
  type request_type not null default 'time_off',
  start_date date not null,
  end_date date not null,
  reason text,
  status request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------
create index idx_business_members_user on public.business_members(user_id);
create index idx_business_members_business on public.business_members(business_id);
create index idx_staff_business on public.staff(business_id);
create index idx_staff_user on public.staff(user_id);
create index idx_shifts_business_date on public.shifts(business_id, date);
create index idx_shifts_staff on public.shifts(staff_id);
create index idx_time_entries_shift on public.time_entries(shift_id);
create index idx_time_entries_staff on public.time_entries(staff_id);
create index idx_requests_business_status on public.requests(business_id, status);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security (RLS) & Policies
-- -----------------------------------------------------------------------------

-- Helper: Check if current user is a member of the business
create or replace function public.is_business_member(business_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.business_members
    where business_id = business_uuid
    and user_id = auth.uid()
  );
$$ language sql security definer;

-- Helper: Check if current user is an admin of the business
create or replace function public.is_business_admin(business_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.business_members
    where business_id = business_uuid
    and user_id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer;

-- Enable RLS
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.staff enable row level security;
alter table public.shifts enable row level security;
alter table public.time_entries enable row level security;
alter table public.requests enable row level security;

-- Policies: Businesses
create policy "Members can view their business" on public.businesses
  for select using (is_business_member(id));

create policy "Users can create business" on public.businesses
  for insert with check (true); 

create policy "Admins can update business" on public.businesses
  for update using (is_business_admin(id));

-- Policies: Business Members
create policy "Members can view colleagues" on public.business_members
  for select using (is_business_member(business_id));

create policy "Admins can manage members" on public.business_members
  for all using (is_business_admin(business_id));

-- Policies: Staff
create policy "Members can view staff profiles" on public.staff
  for select using (is_business_member(business_id));

create policy "Admins can manage staff profiles" on public.staff
  for all using (is_business_admin(business_id));

-- Policies: Shifts
create policy "Admins can manage shifts" on public.shifts
  for all using (is_business_admin(business_id));

create policy "Staff can view their own shifts" on public.shifts
  for select using (
    auth.uid() = (select user_id from public.staff where id = staff_id)
  );
-- NOTE: If Staff need to see the full schedule in the future, change the SELECT policy to is_business_member(business_id)

-- Policies: Time Entries
create policy "Admins can view all time entries" on public.time_entries
  for select using (
     exists (
       select 1 from public.staff s
       where s.id = time_entries.staff_id
       and is_business_admin(s.business_id)
     )
  );

create policy "Staff can manage their own time entries" on public.time_entries
  for all using (
    auth.uid() = (select user_id from public.staff where id = staff_id)
  );

-- Policies: Requests
create policy "Admins can manage requests" on public.requests
  for all using (is_business_admin(business_id));

create policy "Staff can manage their own requests" on public.requests
  for all using (
    auth.uid() = (select user_id from public.staff where id = staff_id)
  );

-- -----------------------------------------------------------------------------
-- 5. Triggers for updated_at
-- -----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_businesses_modtime before update on public.businesses for each row execute procedure update_updated_at_column();
create trigger update_members_modtime before update on public.business_members for each row execute procedure update_updated_at_column();
create trigger update_staff_modtime before update on public.staff for each row execute procedure update_updated_at_column();
create trigger update_shifts_modtime before update on public.shifts for each row execute procedure update_updated_at_column();
create trigger update_time_entries_modtime before update on public.time_entries for each row execute procedure update_updated_at_column();
create trigger update_requests_modtime before update on public.requests for each row execute procedure update_updated_at_column();

