-- Preserve provider identity while keeping Supabase Auth as session authority.
alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
create index if not exists users_auth_user_id_idx on public.users(auth_user_id);

alter table public.users drop constraint if exists users_social_provider_check;
alter table public.users
  add constraint users_social_provider_check
  check (social_provider in ('GOOGLE', 'KAKAO', 'NAVER', 'EMAIL'));

update public.users u
set auth_user_id = a.id
from auth.users a
where u.auth_user_id is null
  and u.email is not null
  and lower(u.email) = lower(a.email)
  and not exists (
    select 1
    from public.users other
    where other.auth_user_id = a.id
  );

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text := upper(coalesce(new.raw_app_meta_data->>'provider', 'EMAIL'));
  profile_name text;
  avatar_url text;
begin
  if provider_name not in ('EMAIL', 'GOOGLE', 'KAKAO') then
    provider_name := 'EMAIL';
  end if;

  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  insert into public.users (
    id, auth_user_id, name, role, point, avatar, email,
    social_provider, social_id, profile_image, created_at
  ) values (
    new.id::text, new.id, profile_name, 'TEACHER', 0,
    left(profile_name, 1), new.email, provider_name, new.id::text,
    avatar_url, now()
  )
  on conflict (id) do update set
    auth_user_id = excluded.auth_user_id,
    email = coalesce(excluded.email, public.users.email),
    social_provider = excluded.social_provider,
    profile_image = coalesce(excluded.profile_image, public.users.profile_image);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
