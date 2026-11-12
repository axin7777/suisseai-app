-- SuisseAI şeması: Supabase > SQL Editor'e yapıştırıp çalıştır.

create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','plus','pro')),
  status text not null default 'active' check (status in ('active','past_due','canceled')),
  source text,
  revenuecat_app_user_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.messages (conversation_id, created_at);
create index on public.messages (user_id, created_at);

create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  conversation_id uuid references public.conversations on delete set null,
  content text not null,
  resolved boolean not null default false,
  resurface_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.capsules (user_id, resurface_at);

-- Takvim / Randevular
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  notes text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.calendar_events (user_id, starts_at);

alter table public.subscriptions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.capsules enable row level security;
alter table public.calendar_events enable row level security;

-- Abonelik: kullanıcı sadece okur; yazma yalnızca sunucu (service role / webhook).
create policy "own subscription read" on public.subscriptions for select using (auth.uid() = user_id);
create policy "own conversations" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own capsules" on public.capsules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own events" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Yeni kullanıcıya otomatik deneme aboneliği
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
