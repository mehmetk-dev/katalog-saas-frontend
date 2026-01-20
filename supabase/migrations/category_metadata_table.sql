create table if not exists public.category_metadata (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_name text not null,
  color text,
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, category_name)
);

-- RLS Policies
alter table public.category_metadata enable row level security;

create policy "Users can view their own category metadata"
  on public.category_metadata for select
  using (auth.uid() = user_id);

create policy "Users can insert their own category metadata"
  on public.category_metadata for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own category metadata"
  on public.category_metadata for update
  using (auth.uid() = user_id);

create policy "Users can delete their own category metadata"
  on public.category_metadata for delete
  using (auth.uid() = user_id);
