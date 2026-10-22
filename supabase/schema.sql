-- Casa D'Or · esquema de base de datos
-- Péguelo completo en Supabase > SQL Editor y ejecútelo una vez.


-- ───────────── Admins ─────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───────────── Catálogo ─────────────
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  position int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  ball_size_mm numeric(4,1),
  ball_count int,
  gold_weight_g numeric(6,2),
  length_min_cm numeric(4,1),
  length_max_cm numeric(4,1),
  closure text not null default '',
  cord_material text not null default '',
  price int not null default 0 check (price >= 0),          -- en pesos, sin decimales
  badge text not null default '',
  active boolean not null default true,
  featured boolean not null default false,
  position int not null default 0,
  sizes jsonb not null default '[]'::jsonb,                 -- [{"label":"M","range":"16–18 cm"}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_name text not null,
  color_hex text not null default '#1C1A17',
  stock int not null default 0 check (stock >= 0),
  position int not null default 0
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  alt text not null default '',
  position int not null default 0
);

create table if not exists public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  primary key (product_id, collection_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  city text not null default '',
  body text not null,
  rating int not null default 5 check (rating between 1 and 5),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────── Pedidos ─────────────
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.order_number_seq'),
  status text not null default 'pendiente_pago'
    check (status in ('pendiente_pago','pagado','rechazado','pedido_whatsapp','enviado','entregado','cancelado')),
  channel text not null check (channel in ('mercadopago','whatsapp')),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  document text not null default '',
  address text not null,
  city text not null,
  department text not null,
  notes text not null default '',
  subtotal int not null,
  shipping int not null default 0,
  total int not null,
  mp_preference_id text,
  mp_payment_id text,
  mp_status text,
  data_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  color_name text not null,
  size text not null default '',
  qty int not null check (qty > 0),
  unit_price int not null
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists variants_product_idx on public.product_variants (product_id);
create index if not exists images_product_idx on public.product_images (product_id);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ───────────── Seguridad (RLS) ─────────────
alter table public.admins enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_collections enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- admins: cada usuario solo ve su propia fila
drop policy if exists "admin ve su fila" on public.admins;
create policy "admin ve su fila" on public.admins for select using (user_id = auth.uid());

-- catálogo: lectura pública de lo activo, escritura solo admin
drop policy if exists "leer colecciones" on public.collections;
create policy "leer colecciones" on public.collections for select using (true);
drop policy if exists "admin colecciones" on public.collections;
create policy "admin colecciones" on public.collections for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer productos activos" on public.products;
create policy "leer productos activos" on public.products for select using (active or public.is_admin());
drop policy if exists "admin productos" on public.products;
create policy "admin productos" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer variantes" on public.product_variants;
create policy "leer variantes" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.active or public.is_admin())));
drop policy if exists "admin variantes" on public.product_variants;
create policy "admin variantes" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer imagenes" on public.product_images;
create policy "leer imagenes" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.active or public.is_admin())));
drop policy if exists "admin imagenes" on public.product_images;
create policy "admin imagenes" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer producto-coleccion" on public.product_collections;
create policy "leer producto-coleccion" on public.product_collections for select using (true);
drop policy if exists "admin producto-coleccion" on public.product_collections;
create policy "admin producto-coleccion" on public.product_collections for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer resenas aprobadas" on public.reviews;
create policy "leer resenas aprobadas" on public.reviews for select using (approved or public.is_admin());
drop policy if exists "admin resenas" on public.reviews;
create policy "admin resenas" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- pedidos: nadie del público los lee. Los crea el servidor con la llave de servicio.
drop policy if exists "admin pedidos" on public.orders;
create policy "admin pedidos" on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin items" on public.order_items;
create policy "admin items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── Fotos (Storage) ─────────────
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects for select using (bucket_id = 'productos');
drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects for insert with check (bucket_id = 'productos' and public.is_admin());
drop policy if exists "admin edita fotos" on storage.objects;
create policy "admin edita fotos" on storage.objects for update using (bucket_id = 'productos' and public.is_admin());
drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects for delete using (bucket_id = 'productos' and public.is_admin());
