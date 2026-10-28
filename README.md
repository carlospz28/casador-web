# Casa D'Or · tienda online

Tienda de manillas con balines de oro 18K. Next.js 16 + Tailwind 4 + Supabase + Mercado Pago + WhatsApp.

Sin configurar nada funciona con **productos de ejemplo** y pedidos solo por WhatsApp. Al conectar Supabase y Mercado Pago queda la tienda completa.

## 1. Correrla en su computador

Necesita Node.js 20.9 o más nuevo.

```bash
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
npm run dev
```

Abra http://localhost:3000. El panel está en http://localhost:3000/admin.

## 2. Lo que debe cambiar antes de publicar

| Archivo | Qué cambiar |
| --- | --- |
| `src/lib/site.ts` | Nombre o razón social, NIT o C.C., correo, costo de envío, envío gratis desde, texto de garantía |
| `src/lib/help-content.ts` | Corchetes de envíos, cambios, garantía, tallas, términos y tratamiento de datos. Hágalos revisar por un abogado |
| `src/app/(tienda)/nosotros/page.tsx` | La historia de Casa D'Or |
| `src/app/(tienda)/page.tsx` | Los textos del inicio, si quiere otros |
| `src/app/globals.css` | Colores de la marca (bloque `@theme`) |
| `src/lib/balines.ts` | Diámetro (mm) y peso (g) de cada balín del simulador. Falta el peso del #7 y del #8 |

Las fotos del inicio y de las colecciones salen de las fotos de los productos: la primera foto de cada producto es la principal.

## 3. Supabase (productos, fotos, pedidos, admin)

1. Cree un proyecto en https://supabase.com (región São Paulo queda más cerca).
2. En **SQL Editor** pegue y ejecute `supabase/schema.sql`. Después ejecute `supabase/seed.sql` (crea las colecciones y una manilla de prueba).
3. En **Project Settings › API** copie a `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon / publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role / secret key (nunca la suba a GitHub)
4. Cree su usuario admin: **Authentication › Users › Add user** (correo y contraseña, marque *Auto confirm*). Luego en SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'su-correo@ejemplo.com';
   ```
5. Reinicie `npm run dev`, entre a `/admin`, borre la manilla de prueba y cree las suyas con fotos.

Seguridad: la base de datos tiene RLS. El público solo lee productos visibles y reseñas aprobadas. Solo los usuarios de la tabla `admins` pueden crear, editar o subir fotos. Los pedidos los crea el servidor con la llave de servicio y nadie del público puede leerlos.

## 4. Mercado Pago

1. En https://www.mercadopago.com.co/developers cree una aplicación (Checkout Pro).
2. Use primero las **credenciales de prueba**: ponga el Access Token en `MERCADOPAGO_ACCESS_TOKEN`.
3. Haga una compra de prueba con un usuario comprador de prueba. Al volver, la página `/pedido/...` muestra el estado.
4. Cuando todo funcione, cambie al Access Token de producción.

**Webhook (aviso de pago):** en la app de Mercado Pago, sección Webhooks, ponga la URL `https://su-dominio.com/api/mercadopago/webhook` con el evento *Pagos*. La tienda también la envía en cada pago. Al recibir el aviso, la tienda consulta el pago directamente a Mercado Pago y revisa que el monto coincida antes de marcar el pedido como pagado.

Si copia la **clave secreta** del webhook en `MERCADOPAGO_WEBHOOK_SECRET`, la tienda además valida la firma. Pruébelo con la herramienta *Simular notificación* de Mercado Pago: si el pedido no se actualiza, deje esa variable vacía y avíseme para ajustar la validación.

> Mercado Pago solo devuelve al cliente automáticamente y envía avisos a direcciones `https`. En local (`http://localhost`) el pago funciona pero hay que volver a mano y el estado se cambia desde el admin.

## 5. Publicar en Vercel

1. Suba el proyecto a GitHub (repositorio privado).
2. En https://vercel.com › Add New › Project, importe el repositorio.
3. En **Environment Variables** ponga las mismas de `.env.local`, con `NEXT_PUBLIC_SITE_URL` = su dominio con `https://`.
4. Deploy. Luego en **Settings › Domains** conecte su dominio.

## Cómo está armada

```
src/app/(tienda)/          páginas públicas
  page.tsx                 inicio
  manillas/                catálogo y ficha de producto (/manillas/[slug])
  coleccion/[slug]/        colecciones (sets, personalizadas, regalos…)
  checkout/                datos de envío + pago (actions.ts calcula precios en el servidor)
  pedido/[id]/             confirmación al volver de Mercado Pago
  ayuda/[slug]/            envíos, retracto, garantía, cuidado, tallas, FAQ, legales
src/app/admin/             panel: productos (con fotos y colores), pedidos, reseñas
src/app/api/mercadopago/   webhook de pagos
src/lib/catalog.ts         lectura del catálogo con caché (se refresca al guardar en el admin)
src/lib/sample-data.ts     productos de ejemplo mientras no haya Supabase
supabase/schema.sql        tablas, seguridad y bucket de fotos
```

Notas:
- Los precios del carrito nunca se usan para cobrar: el servidor los vuelve a leer de la base de datos.
- Un producto con precio 0 se muestra como "Consultar precio" y solo se pide por WhatsApp.
- El stock no se descuenta solo: actualícelo en el admin cuando venda.
- Después de guardar algo en el admin, la primera visita a una página de la tienda puede mostrar todavía la versión anterior mientras se regenera; al recargar ya sale lo nuevo.
- La bolsa se revisa sola contra la base de datos cada vez que se abre y al entrar al checkout: corrige precio, nombre y foto, baja la cantidad si no hay stock y quita lo que ya no existe, con un aviso para el cliente. El cobro siempre usa el precio actual.
- Las fuentes (Playfair Display y Jost, licencia OFL) están en `src/fonts`.
