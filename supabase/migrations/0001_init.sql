-- MONO store — initial schema
-- All writes happen server-side with the service_role key after the app
-- verifies the admin session. The anon key can only read published catalogue
-- data; customers, orders and admin users are never exposed to it.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admin users (not Supabase Auth: the panel uses its own signed session)
-- ---------------------------------------------------------------------------
create table public.users (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  name text not null default '',
  role text not null default 'admin' check (role in ('owner', 'admin', 'editor')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_url text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  brand text not null default '',
  short_description text not null default '',
  description text not null default '',
  price_cents bigint not null check (price_cents >= 0),
  compare_at_cents bigint check (compare_at_cents is null or compare_at_cents >= 0),
  sku text not null unique,
  category_id text references public.categories (id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  variant_label text not null default '',
  specs jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('published', 'draft')),
  animation text not null default 'none' check (animation in ('none', 'float', 'airpods-3d')),
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);

create table public.product_images (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0
);
create index product_images_product_idx on public.product_images (product_id);

create table public.product_variants (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null,
  price_cents bigint check (price_cents is null or price_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  swatch text,
  sort_order integer not null default 0
);
create index product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Customers & orders
-- ---------------------------------------------------------------------------
create table public.customers (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

-- Starts above the demo orders (MONO-10001…) loaded on first boot
create sequence public.order_number_seq start 10101;

create table public.orders (
  id text primary key default gen_random_uuid()::text,
  number text not null unique,
  customer_id text not null references public.customers (id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  document_id text not null default '',
  shipping_address jsonb,
  shipping_method_id text not null,
  shipping_method_name text not null,
  shipping_cents bigint not null default 0,
  payment_method_id text not null,
  payment_method_name text not null,
  payment_provider text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_reference text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents bigint not null,
  total_cents bigint not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on public.orders (customer_id);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders (id) on delete cascade,
  -- Snapshot columns: the order must stay readable even if the product is deleted
  product_id text references public.products (id) on delete set null,
  variant_id text,
  name text not null,
  variant_name text,
  sku text not null,
  image_url text,
  unit_price_cents bigint not null,
  quantity integer not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.newsletter_subscribers (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content & configuration (single-row tables)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.homepage_settings (
  id smallint primary key default 1 check (id = 1),
  hero jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.homepage_sections (
  id text primary key default gen_random_uuid()::text,
  type text not null check (type in ('hero', 'featured_products', 'categories', 'story', 'benefits', 'newsletter')),
  enabled boolean not null default true,
  sort_order integer not null default 0,
  title text not null default '',
  subtitle text not null default '',
  config jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Row Level Security: on everywhere, public read only for storefront data
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_settings enable row level security;
alter table public.homepage_settings enable row level security;
alter table public.homepage_sections enable row level security;

create policy "public reads visible categories" on public.categories
  for select to anon, authenticated using (is_visible);

create policy "public reads published products" on public.products
  for select to anon, authenticated using (status = 'published');

create policy "public reads images of published products" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "public reads variants of published products" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);

create policy "public reads homepage settings" on public.homepage_settings
  for select to anon, authenticated using (true);

create policy "public reads enabled sections" on public.homepage_sections
  for select to anon, authenticated using (enabled);

-- users, customers, orders, order_items, newsletter_subscribers: no policies →
-- only the service_role (server) can touch them.

-- ---------------------------------------------------------------------------
-- Atomic order creation: validates stock with row locks, decrements it,
-- upserts the customer and inserts order + items in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_available integer;
  v_customer_id text;
  v_order_id text := gen_random_uuid()::text;
  v_number text := 'MONO-' || nextval('public.order_number_seq');
begin
  for v_item in select * from jsonb_array_elements(p_items) loop
    if v_item->>'variant_id' is not null then
      select stock into v_available from public.product_variants
        where id = v_item->>'variant_id' and product_id = v_item->>'product_id' for update;
    else
      select stock into v_available from public.products
        where id = v_item->>'product_id' and status = 'published' for update;
    end if;

    if v_available is null or v_available < (v_item->>'quantity')::integer then
      return jsonb_build_object(
        'ok', false,
        'reason', 'out_of_stock',
        'product_id', v_item->>'product_id',
        'variant_id', v_item->>'variant_id'
      );
    end if;

    if v_item->>'variant_id' is not null then
      update public.product_variants set stock = stock - (v_item->>'quantity')::integer
        where id = v_item->>'variant_id';
      update public.products set
        stock = (select coalesce(sum(stock), 0) from public.product_variants where product_id = v_item->>'product_id'),
        updated_at = now()
        where id = v_item->>'product_id';
    else
      update public.products set stock = stock - (v_item->>'quantity')::integer, updated_at = now()
        where id = v_item->>'product_id';
    end if;
  end loop;

  insert into public.customers (email, name, phone)
    values (lower(p_order->>'customer_email'), p_order->>'customer_name', coalesce(p_order->>'customer_phone', ''))
    on conflict (email) do update set name = excluded.name, phone = excluded.phone
    returning id into v_customer_id;

  insert into public.orders (
    id, number, customer_id, customer_name, customer_email, customer_phone, document_id,
    shipping_address, shipping_method_id, shipping_method_name, shipping_cents,
    payment_method_id, payment_method_name, payment_provider, payment_status, payment_reference,
    status, subtotal_cents, total_cents, notes
  ) values (
    v_order_id, v_number, v_customer_id, p_order->>'customer_name', lower(p_order->>'customer_email'),
    coalesce(p_order->>'customer_phone', ''), coalesce(p_order->>'document_id', ''),
    p_order->'shipping_address', p_order->>'shipping_method_id', p_order->>'shipping_method_name',
    (p_order->>'shipping_cents')::bigint, p_order->>'payment_method_id', p_order->>'payment_method_name',
    p_order->>'payment_provider', p_order->>'payment_status', p_order->>'payment_reference',
    p_order->>'status', (p_order->>'subtotal_cents')::bigint, (p_order->>'total_cents')::bigint,
    coalesce(p_order->>'notes', '')
  );

  insert into public.order_items (order_id, product_id, variant_id, name, variant_name, sku, image_url, unit_price_cents, quantity)
  select v_order_id, i->>'product_id', i->>'variant_id', i->>'name', i->>'variant_name', i->>'sku',
         i->>'image_url', (i->>'unit_price_cents')::bigint, (i->>'quantity')::integer
  from jsonb_array_elements(p_items) as i;

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded media (public read, server-side writes)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
