-- =============================================================================
-- FEATURE MIGRATION: Daily Attendance
-- Run this in your Supabase SQL Editor to enable attendance tracking.
-- =============================================================================

-- 1. Create Attendance Table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  child_id uuid references public.children(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('Present', 'Absent', 'Excused')),
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  recorded_by text, -- Storing email or name of the staff member
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add Unique Constraint
-- A child should only have one attendance record per day
alter table public.attendance add constraint unique_child_date unique (child_id, date);

-- 3. Enable RLS (Optional, but good practice if you implement multi-tenancy later)
alter table public.attendance enable row level security;

-- For single-tenant legacy setup, open read/write access (replace with proper auth later)
create policy "Enable all access for now" on public.attendance for all using (true) with check (true);
