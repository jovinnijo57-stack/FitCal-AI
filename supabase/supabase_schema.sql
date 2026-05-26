-- SQL Setup Schema for Supabase Database (PulsePeak)
-- Run this script in the Supabase SQL Editor to set up all tables, relations, triggers, and RLS policies.

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  phone text,
  goal text default 'lose',
  calorie_goal integer default 2000,
  water_goal_ml integer default 2500,
  protein_goal integer default 150,
  carbs_goal integer default 220,
  fats_goal integer default 70,
  weight_kg numeric default 70,
  height_cm numeric default 178,
  ai_plan jsonb,
  age integer default 28,
  gender text default 'male',
  activity numeric default 1.55,
  diet text default 'Omnivore',
  workout_type text default 'Strength training',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies if they exist to avoid creation errors
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can upsert own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Note: upsert requires both insert + update policies above to work correctly.
-- The service_role key bypasses RLS entirely (used in server-side triggers).


-- 2. Meal Logs Table
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  meal_type text not null,
  food_name text not null,
  brand text,
  serving text,
  servings numeric not null,
  kcal integer not null,
  protein numeric default 0,
  carbs numeric default 0,
  fats numeric default 0,
  logged_date date not null default current_date,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.meal_logs enable row level security;

-- Drop existing policies if they exist to avoid creation errors
drop policy if exists "Users can view own meals" on public.meal_logs;
drop policy if exists "Users can insert own meals" on public.meal_logs;
drop policy if exists "Users can delete own meals" on public.meal_logs;

create policy "Users can view own meals" on public.meal_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own meals" on public.meal_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own meals" on public.meal_logs
  for delete using (auth.uid() = user_id);


-- 3. Exercise Logs Table
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  exercise_name text not null,
  duration_minutes integer not null,
  calories_burned integer not null,
  logged_date date not null default current_date,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.exercise_logs enable row level security;

-- Drop existing policies if they exist to avoid creation errors
drop policy if exists "Users can view own exercises" on public.exercise_logs;
drop policy if exists "Users can insert own exercises" on public.exercise_logs;
drop policy if exists "Users can delete own exercises" on public.exercise_logs;

create policy "Users can view own exercises" on public.exercise_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own exercises" on public.exercise_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own exercises" on public.exercise_logs
  for delete using (auth.uid() = user_id);


-- 4. Water Logs Table
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  amount_ml integer not null,
  logged_date date not null default current_date,
  created_at timestamp with time zone default now(),
  constraint unique_user_water_date unique (user_id, logged_date)
);

-- Enable RLS
alter table public.water_logs enable row level security;

-- Drop existing policies if they exist to avoid creation errors
drop policy if exists "Users can view own water" on public.water_logs;
drop policy if exists "Users can insert or update own water" on public.water_logs;

create policy "Users can view own water" on public.water_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert or update own water" on public.water_logs
  for all using (auth.uid() = user_id);


-- 5. Weight Logs Table
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  weight_kg numeric not null,
  logged_date date not null default current_date,
  created_at timestamp with time zone default now(),
  constraint unique_user_weight_date unique (user_id, logged_date)
);

-- Enable RLS
alter table public.weight_logs enable row level security;

-- Drop existing policies if they exist to avoid creation errors
drop policy if exists "Users can view own weights" on public.weight_logs;
drop policy if exists "Users can insert or update own weights" on public.weight_logs;

create policy "Users can view own weights" on public.weight_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert or update own weights" on public.weight_logs
  for all using (auth.uid() = user_id);


-- 6. Trigger to automatically create a profile when a new user registers in Supabase auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    email, 
    name, 
    phone, 
    goal, 
    calorie_goal, 
    water_goal_ml, 
    protein_goal, 
    carbs_goal, 
    fats_goal, 
    weight_kg, 
    height_cm,
    age,
    gender,
    activity,
    diet,
    workout_type
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'PulsePeak User'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'lose',
    2000,
    2500,
    150,
    220,
    70,
    70,
    178,
    28,
    'male',
    1.55,
    'Omnivore',
    'Strength training'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 7. Recipes & Meal Plans Tables
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    time TEXT,
    serves INTEGER DEFAULT 2,
    calories TEXT,
    protein TEXT,
    fat TEXT,
    carbs TEXT,
    image TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions TEXT[] NOT NULL DEFAULT '{}'::text[],
    is_custom BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    planned_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of global and owner's recipes" ON public.recipes;
CREATE POLICY "Allow public read of global and owner's recipes" 
ON public.recipes FOR SELECT 
USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.recipes;
CREATE POLICY "Allow authenticated inserts" 
ON public.recipes FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

DROP POLICY IF EXISTS "Allow owners to update their recipes" ON public.recipes;
CREATE POLICY "Allow owners to update their recipes" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owners to delete their recipes" ON public.recipes;
CREATE POLICY "Allow owners to delete their recipes" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owners to manage their meal plans" ON public.meal_plans;
CREATE POLICY "Allow owners to manage their meal plans" 
ON public.meal_plans FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 8. Secure RPC Function to check if a phone number exists across all profiles
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.profiles WHERE phone = phone_to_check);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
