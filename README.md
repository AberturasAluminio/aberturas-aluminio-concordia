# Tienda online + panel de ventas — Aberturas Aluminio Concordia

Tienda de aberturas de aluminio para Concordia, Entre Ríos, con panel de
administración y CRM de cobros. Catálogo con carrito y **sin pasarela de pago**:
el pedido se cierra por WhatsApp.

Sitio estático — HTML, CSS y JavaScript sin dependencias ni compilación — contra
una base de datos Supabase.

## Correr en local

```bash
python serve.py
```

- Tienda: http://localhost:8090
- Panel: http://localhost:8090/admin.html

`serve.py` es un servidor de desarrollo: manda `Cache-Control: no-store` y le
agrega `?v=<fecha>` a los CSS y JS, para que el navegador no sirva versiones
viejas mientras se edita. Al verificar un cambio conviene navegar con un query
distinto (`?v=2`): el caché del navegador miente.

## Cómo está armado

Se publica únicamente la carpeta [`tienda-virtual/`](tienda-virtual).

```
tienda-virtual/
├── index.html              tienda (portada)
├── productos.html          catálogo
├── admin.html              panel de administración
├── ...                     6 páginas más (contacto, FAQ, reseñas, legales)
├── styles.css              sistema de diseño (azul #003098 · naranja #F45F11)
├── admin.css               estilos del panel
├── store.js                capa de datos — TODO pasa por acá
├── app.js                  catálogo, carrito, zonas de entrega
├── layout.js               encabezado, pie y capas flotantes de las 9 páginas
├── admin.js                panel: productos, pedidos, cobros, importaciones
├── xlsx-utils.js           lectura y escritura de planillas
├── delivery-zones-data.js  145 localidades de reparto (carga inicial)
├── robots.txt · sitemap.xml
└── assets/                 logos, banner, imágenes de categorías y de compartir
```

### La capa de datos

`store.js` es la única puerta a la base. `Store.init()` trae todo una vez al
arrancar y las `get*` siguen siendo **síncronas**, leyendo de memoria; las
`save*` son asíncronas. Por eso `app.js`, `layout.js` y `admin.js` no saben que
hay una base atrás: solo hay que esperar a `Store.init()` antes de dibujar.

### Dónde viven los datos

Supabase (PostgreSQL). Lo que protege los datos son las políticas RLS, no
esconder la clave pública que está en `store.js` — esa clave está pensada para
viajar al navegador.

- **Público:** productos activos y sus medidas, zonas de entrega, textos del
  sitio, preguntas frecuentes, reseñas publicadas, configuración.
- **Solo con sesión de administrador:** pedidos, líneas de pedido, cobros,
  medios de pago, **costos** y valores de fábrica.
- Los pedidos de la tienda entran por la función `create_order(jsonb)`, que
  **toma los precios del catálogo del lado del servidor**: el navegador no puede
  mandar un precio inventado.
- El costo vive en la tabla aparte `variant_costs` y nunca llega al navegador de
  un visitante.

## Publicar

El sitio se despliega desde `tienda-virtual/`. Con el repositorio conectado a
Vercel, cada push a `main` publica solo.

## SEO

Las 9 páginas públicas tienen `title`, `description`, `canonical`, Open Graph y
Twitter Card. La home lleva `HomeAndConstructionBusiness` (JSON-LD) y las
internas `BreadcrumbList`; el `FAQPage` se genera desde la base en `app.js`.
`admin.html` va con `noindex`.

Dos cosas que parecen mejoras y **rompen** algo:

- **No agregar `Disallow: /admin.html` al `robots.txt`.** Si Google no puede
  abrir la página, nunca lee el `noindex` de adentro y la dirección puede
  terminar igual en el buscador. Se elige una de las dos, y es el `noindex`.
- **No mover los meta de Open Graph a `layout.js`.** Se ven repetidos en las 9
  páginas y da ganas de unificarlos, pero los robots de WhatsApp y Facebook no
  ejecutan JavaScript: el link dejaría de mostrar imagen al compartirse.

Los `canonical` apuntan al dominio definitivo `aberturasaluminioconcordia.com.ar`.

## Créditos de las imágenes

La foto del banner y las de categorías son de
[Unsplash](https://unsplash.com) (licencia libre para uso comercial) y están
puestas como muestra: se reemplazan por fotos reales de los trabajos.
