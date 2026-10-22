-- Casa D'Or · datos iniciales (opcional)
-- Crea las colecciones y las manillas con las fotos de public/fotos. Precios en 0 ("Consultar precio"):
-- complételos desde el panel admin. Puede correrlo varias veces: no duplica.

insert into public.collections (slug, name, description, position) values
  ('mas-vendidas', 'Más vendidas', 'Las manillas que más nos piden.', 1),
  ('para-hombre', 'Para hombre', 'Balines de oro 18K con presencia, en cordón negro tejido a mano.', 2),
  ('personalizadas', 'Personalizadas', 'Elige el tamaño del balín, el color del cordón y la medida, y la tejemos para ti.', 3),
  ('regalos', 'Regalos', 'Piezas que llegan listas para regalar, con empaque y certificado.', 4)
on conflict (slug) do nothing;

do $$
declare pid uuid;
begin
  if not exists (select 1 from public.products where slug = 'manilla-trebol') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-trebol', 'Manilla Trébol', 'Trébol central y balines tallados de oro 18K sobre cordón negro tejido a mano.', '', 0, 'Más vendida', true, 1,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 1);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rosado', '#E8B4B8', 5, 2);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rojo', '#A3262A', 5, 3);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Azul', '#1F3A68', 5, 4);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/trebol-tela.jpg', 'Manilla Trébol con balines de oro 18K sobre tela beige', 0);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/trebol-puesta.jpg', 'Manilla Trébol puesta en la muñeca', 1);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'mas-vendidas';
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'regalos';
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-doble-hilera') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-doble-hilera', 'Manilla Doble Hilera', 'Dos hileras de balines tallados de oro 18K tejidas en cordón.', '', 0, '', true, 2,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 1);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rosado', '#E8B4B8', 5, 2);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rojo', '#A3262A', 5, 3);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Azul', '#1F3A68', 5, 4);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/doble-hilera-marmol.jpg', 'Manilla Doble Hilera sobre mármol', 0);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/doble-hilera-puesta.jpg', 'Manilla Doble Hilera puesta en la muñeca', 1);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'mas-vendidas';
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-tres-hileras') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-tres-hileras', 'Manilla Tres Hileras', 'Tres hileras de balines de oro 18K: la más llamativa de la colección.', '', 0, '', true, 3,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 1);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rosado', '#E8B4B8', 5, 2);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rojo', '#A3262A', 5, 3);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Azul', '#1F3A68', 5, 4);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/tres-hileras-detalle.jpg', 'Detalle de la Manilla Tres Hileras', 0);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/tres-hileras-hombre.jpg', 'Manilla Tres Hileras puesta en muñeca de hombre', 1);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/tres-hileras-hombre-2.jpg', 'Manilla Tres Hileras con jean', 2);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'mas-vendidas';
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'para-hombre';
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-cinco-balines') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-cinco-balines', 'Manilla Cinco Balines', 'Cinco balines de oro 18K al centro, sencilla para usar todos los días.', '', 0, '', true, 4,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 1);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rosado', '#E8B4B8', 5, 2);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rojo', '#A3262A', 5, 3);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Azul', '#1F3A68', 5, 4);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/cinco-balines-puesta.jpg', 'Manilla Cinco Balines puesta en la muñeca', 0);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'regalos';
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-linea-de-oro') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-linea-de-oro', 'Manilla Línea de Oro', 'Una línea continua de balines de oro 18K, delgada y elegante.', '', 0, '', false, 5,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/linea-de-oro-puesta.jpg', 'Manilla Línea de Oro puesta en la muñeca', 0);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'regalos';
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-balines-espaciados') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-balines-espaciados', 'Manilla Balines Espaciados', 'Balines de oro 18K repartidos a lo largo del tejido.', '', 0, '', false, 6,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 1);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rosado', '#E8B4B8', 5, 2);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rojo', '#A3262A', 5, 3);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Azul', '#1F3A68', 5, 4);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/balines-espaciados-hombre.jpg', 'Manilla Balines Espaciados puesta en muñeca de hombre', 0);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/balines-espaciados-caja.jpg', 'Manilla Balines Espaciados en su caja de regalo', 1);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'para-hombre';
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'regalos';
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-cordon-dorado') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-cordon-dorado', 'Manilla Cordón Dorado', 'Balines tallados de oro 18K tejidos en cordón dorado.', '', 0, '', false, 7,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 0);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/cordon-dorado.jpg', 'Manilla Cordón Dorado', 0);
  end if;
  if not exists (select 1 from public.products where slug = 'manilla-personalizada') then
    insert into public.products (slug, name, short_description, description, price, badge, featured, position, sizes)
    values ('manilla-personalizada', 'Manilla Personalizada', 'Elige el tamaño del balín (del #3 al #8), el color del cordón y la medida. Te enviamos el precio por WhatsApp.', '', 0, '', false, 8,
            '[{"label": "S", "range": ""}, {"label": "M", "range": ""}, {"label": "L", "range": ""}]'::jsonb)
    returning id into pid;
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Negro', '#1C1A17', 5, 0);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Dorado', '#C9A54C', 5, 1);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rosado', '#E8B4B8', 5, 2);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Rojo', '#A3262A', 5, 3);
    insert into public.product_variants (product_id, color_name, color_hex, stock, position) values (pid, 'Azul', '#1F3A68', 5, 4);
    insert into public.product_images (product_id, url, alt, position) values (pid, '/fotos/tamanos-de-balin.jpg', 'Balines de oro 18K del #3 al #8', 0);
    insert into public.product_collections (product_id, collection_id) select pid, id from public.collections where slug = 'personalizadas';
  end if;
end $$;

-- Para hacerse admin: cree su usuario en Authentication > Users y luego ejecute
-- (cambie el correo):
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'su-correo@ejemplo.com';
