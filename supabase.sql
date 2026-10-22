-- Execute este script no SQL Editor do seu projeto Supabase.
-- MVP para um único estabelecimento e um usuário administrador.
-- As tabelas só aceitam operações de usuários autenticados.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  category text,
  price numeric(10,2) not null check (price > 0),
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_label text not null check (char_length(trim(customer_label)) between 1 and 80),
  notes text,
  status text not null default 'open' check (status in ('open', 'closed')),
  total numeric(10,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Para este MVP, qualquer usuário autenticado no projeto pode operar os dados.
-- Crie somente a conta do dono e não habilite cadastro público.
drop policy if exists "Authenticated users can manage products" on public.products;
create policy "Authenticated users can manage products"
on public.products for all to authenticated
using (true) with check (true);

drop policy if exists "Authenticated users can manage orders" on public.orders;
create policy "Authenticated users can manage orders"
on public.orders for all to authenticated
using (true) with check (true);

drop policy if exists "Authenticated users can manage order items" on public.order_items;
create policy "Authenticated users can manage order items"
on public.order_items for all to authenticated
using (true) with check (true);

-- Não há cadastro público via interface. Crie a conta em Authentication > Users
-- no painel Supabase e mantenha habilitado o login por e-mail/senha.
