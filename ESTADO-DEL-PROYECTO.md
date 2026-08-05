# Estado del proyecto — Tienda Aberturas Aluminio Concordia

> Documento de traspaso. Escrito el **5 de agosto de 2026** para retomar el
> trabajo en otra sesión sin tener que reconstruir el contexto.

---

## 1. De qué se trata

Tienda online para **Aberturas Aluminio Concordia** (Concordia, Entre Ríos).
Venden ventanas, puertas, rejas, portones y mamparas: medidas estándar con
precio publicado y también fabricación a medida.

**No hay pasarela de pago.** Toda la venta se cierra por WhatsApp: el visitante
arma el pedido, deja sus datos, y llega un mensaje con todo listo para que el
negocio solo confirme.

### Cómo llegó acá

El dueño del negocio venía armando la web con Codex. Ian (Sistemas Umbral) tomó
el proyecto, lo rediseñó por completo y le construyó el panel de administración.
El material original del cliente se conserva en `site/` y `diseño-extraido/`
como referencia — **no forma parte de lo que se publica**.

---

## 2. Links

| Qué | Dónde |
| --- | --- |
| Tienda en producción | https://aberturas-aluminio-concordia.vercel.app |
| Panel de administración | https://aberturas-aluminio-concordia.vercel.app/admin.html |
| Repo actual (el que se usa) | https://github.com/ShadoxIA/tienda-aberturas-concordia |
| Repo del material del cliente | https://github.com/ShadoxIA/demo-de-aberturas-concordia |
| Proyecto en Vercel | https://vercel.com/nunezlucas932-8998s-projects/aberturas-aluminio-concordia |

**Git:** el repo local tiene dos remotos. `umbral` es el que se usa; `origin`
apunta al repo viejo y quedó congelado.

```bash
git push umbral main
```

**Deploy:** desde `tienda-virtual/`, ya vinculada al proyecto de Vercel.

```bash
vercel deploy --prod --yes
```

---

## 3. Correr en local

```bash
python serve.py
```

- Tienda: http://localhost:8090
- Panel: http://localhost:8090/admin.html

`serve.py` no es `http.server` común: manda `Cache-Control: no-store` y le
agrega `?v=<mtime>` a los CSS y JS. Sin eso el navegador sirve versiones viejas
y se pierde mucho tiempo persiguiendo cambios que sí estaban aplicados.

---

## 4. Cómo está armado

Sitio estático: HTML, CSS y JavaScript sin dependencias ni compilación.

```
tienda-virtual/
├── index.html              tienda
├── admin.html              panel
├── styles.css              sistema de diseño de la tienda
├── admin.css               estilos del panel
├── app.js                  catálogo, carrito, checkout, zonas
├── admin.js                productos, precios, Excel, pedidos, textos
├── store.js                CAPA DE DATOS — todo pasa por acá
├── delivery-zones-data.js  las 145 localidades de reparto
├── xlsx-utils.js           lectura y escritura de planillas
└── assets/                 logos, foto del banner, imágenes de categorías
```

### `store.js` es la pieza clave

Toda lectura y escritura pasa por el objeto `Store`. **Migrar a base de datos
es reescribir este archivo y nada más** — el resto de la aplicación no sabe
dónde viven los datos.

Qué expone: `getProducts / saveProducts`, `getDeliveryZones / saveDeliveryZones`,
`getCommerceContent / saveCommerceContent`, `getSettings / saveSettings`,
`getCart / saveCart`, `getBuyer / saveBuyer`, `getOrders / addOrder /
updateOrderState / deleteOrder`, `exportBackup / importBackup`.

### Claves de `localStorage`

```
aac-store-products-v2            catálogo
aac-store-delivery-zones-v1      localidades
aac-store-commerce-content-v3    los 80 textos editables
aac-store-settings-v2            nombre, WhatsApp, dirección, dominio
aac-store-cart-v2                carrito del visitante
aac-store-buyer-v1               datos de quien compra (para no reescribirlos)
aac-store-orders-v1              pedidos registrados
aac-store-catalog-revision       versión del catálogo (migraciones)
aac-store-delivery-revision      versión de las zonas
```

**Cuidado con las migraciones por revisión.** Al subir `CATALOG_REVISION` se
ejecuta el bloque de migración en `getProducts()`. Está escrito para no pisar
decisiones del negocio: mira lo guardado *antes* de tocar nada. Si se toca ese
bloque, probar los cuatro casos: catálogo viejo sin el campo, catálogo con
elección propia, elección que excluye la ficha que se repone, y navegador
limpio.

---

## 5. Cómo funciona la tienda

### Flujo de compra

1. Las tarjetas del catálogo tienen **un solo botón: Comprar**. No hay botones
   de WhatsApp sueltos en las grillas (se sacaron a pedido del cliente).
2. Se abre la ficha: medida, mano y color según lo que ofrezca el producto.
   Hay una opción **"Necesito una medida a pedido"** que despliega un campo de
   texto; ese ítem queda con precio `null` y no suma al total.
3. Dos caminos:
   - **Agregar al carrito** para juntar varios productos.
   - **Iniciar compra** salta directo al formulario de datos.
4. **Carrito:** ítems, subtotal, consulta de zona por CP o localidad contra las
   145 localidades, y total.
5. **Datos:** nombre, teléfono, envío o retiro, localidad, dirección,
   comentarios. Con retiro, los campos de dirección se ocultan y dejan de ser
   obligatorios.
6. Se abre WhatsApp con el pedido armado **y** el pedido queda registrado en el
   panel.

Si ya había productos en el carrito y se usa "Iniciar compra" desde una ficha,
el pedido sale con **todo junto**. Está decidido así para no dejar ítems
huérfanos; el resumen arriba del formulario lo muestra antes de enviar.

### Los textos

Los 80 textos de la web se editan desde el panel. El binding es genérico: cada
nodo lleva `data-content="clave"` en el HTML y `applyCommerceContent()` los
recorre. **Para sumar un texto editable alcanza con marcarlo en el HTML, darle
su valor por defecto en `store.js` y agregar el campo en `admin.html`** — no hay
que tocar `app.js`.

La dirección y el teléfono son la excepción: salen de Configuración, con
`data-store-address` y `data-store-phone`.

### Los destacados

Cada producto tiene `featured`. Se marca con la estrella en la tabla del panel o
con la casilla del editor. Si no hay ninguno elegido, la home muestra los
primeros publicados para que la sección nunca quede vacía.

---

## 6. El panel

Ocho pestañas: **Productos**, **Pedidos**, **Actualización de precios**,
**Importar / Exportar Excel**, **Localidades y entregas**, **Textos
comerciales**, **Copia de seguridad**, **Configuración**.

Lo que conviene saber:

- **Pedidos**: número, fecha, cliente, contacto, entrega, total y estado
  (Nuevo / Confirmado / Entregado / Cancelado). Buscador, detalle, botón para
  escribirle a esa persona, exportación a Excel y borrado.
- **Textos**: 80 campos en 15 bloques plegables que siguen el orden de la
  página. Hay un "Restaurar textos originales".
- **Copia de seguridad**: exporta e importa productos, zonas, textos,
  configuración y pedidos en un JSON. **Es la única forma de llevar una demo
  configurada a otra computadora** mientras los datos vivan en el navegador.
- **Restaurar catálogo de ejemplo**: deja productos y destacados de fábrica sin
  tocar zonas ni textos. Sirve para dejar la demo prolija después de probar.

---

## 7. Diseño

Paleta muestreada del logo del cliente:

| | |
| --- | --- |
| Azul | `#003098` |
| Naranja de marca | `#F45F11` |
| Verde WhatsApp | `#128C4A` |
| Tinta | `#1B1E24` |

Tipografía **Inter**. Radios `--r-sm: 5px` / `--r: 9px` / `--r-lg: 14px`.

La referencia visual la eligió el cliente: **tiendacrgroup.com.ar**, un
competidor del mismo rubro. Se replicó la estructura (header de dos filas con
buscador, franja de beneficios, grillas de producto, footer de columnas) con la
marca de Aberturas, no sus colores.

El logo blanco (`assets/logo-blanco.png`) se generó a partir del color para el
pie: la versión azul sobre fondo oscuro necesitaba una caja blanca que se veía
mal.

---

## 8. Qué falta — en orden de importancia

### 8.1 Base de datos (bloqueante para producción real)

Hoy **todo vive en el `localStorage` del navegador**. Las consecuencias:

- Los cambios del panel **no llegan a los visitantes**: cada uno recibe el
  catálogo por defecto de `store.js`.
- Los pedidos hechos desde el celular de un cliente **quedan en ese celular**;
  no aparecen en el panel del dueño.
- Limpiar el navegador borra todo.

Sirve para presentar y configurar, no para operar. La migración es reescribir
`store.js` contra Supabase (Postgres + Storage para las imágenes). El resto de
la aplicación no cambia.

### 8.2 Acceso al panel

`/admin.html` está **público y sin contraseña**. Hoy el daño es local, pero en
cuanto haya base de datos es la puerta abierta. Va junto con 8.1.

Al mismo tiempo hay que definir dónde quedan los datos personales de los
compradores y quién puede verlos.

### 8.3 Fotos reales

8 de los 9 productos usan un placeholder gris. Las imágenes del banner y de las
categorías son de **Unsplash** (licencia libre comercial) puestas como muestra.
Reemplazarlas por fotos de trabajos del cliente es probablemente lo que más
sube la calidad percibida, más que cualquier ajuste de CSS.

### 8.4 SEO

La tienda tiene `title` y `description` pero le falta Open Graph, schema.org
(`Product`, `LocalBusiness`) y sitemap. Para un negocio local que quiere
aparecer en "ventanas de aluminio Concordia", es plata en la mesa.

### 8.5 Menores

- Los testimonios no se hicieron: no hay reseñas reales del cliente y no
  corresponde inventarlas. Cuando pase capturas de WhatsApp o Google, se arma.
- El precio del ítem en el carrito queda congelado al momento de agregarlo. Si
  el negocio actualiza precios, quien tenga el carrito abierto ve el viejo.
- `site/` y `diseño-extraido/` son material del cliente que quedó en el repo
  como referencia. Si molesta, se puede sacar.

---

## 9. Bugs ya corregidos — no reintroducir

**Validación de variantes.** La comprobación armaba una lista con
`cantidad && valor`. Cuando el producto no tenía manos, ese `0` quedaba en la
lista y se leía como campo sin completar: **5 de los 9 productos no se podían
comprar**. Ahora se pregunta solo por lo que el producto ofrece.

**Desborde horizontal en móvil.** `.filters` medía 885px dentro de un
contenedor de 288px: el carril de categorías imponía su ancho al grid. Se
resolvió con `min-width: 0` en los items de `.catalog-layout`. Si se toca ese
grid, verificar que ningún elemento sea más ancho que su contenedor.

**Padding de la grilla de pasos.** `.buy-steps` es un `<ol>` y el reset solo
cubría `<ul>`, así que arrastraba el padding de los marcadores y quedaba
corrida. El reset ahora incluye `ol`.

**Dirección desconectada.** Se editaba en Configuración pero estaba fija en el
HTML y nunca llegaba a la web.

**Migración de destacados.** La comprobación corría después de reponer una
ficha, así que veía un destacado y no aplicaba el resto.

---

## 10. Trampas del entorno de trabajo

Cosas que hicieron perder tiempo y conviene saber de antemano:

- **El caché del navegador miente.** Usar `serve.py`, y al verificar, navegar
  con un query distinto (`?v=2`). Si algo "no se aplicó", casi siempre está
  aplicado y lo que se ve es caché.
- **`.click()` programático no dispara `change` en radios.** Para probar radios
  hay que despachar el evento a mano.
- **El navegador de pruebas tiene `prefers-reduced-motion` activo**, así que
  las animaciones no se ven ahí. No significa que estén rotas.
- **Medir posiciones con el viewport simulado da valores inconsistentes.** Para
  detectar desbordes reales conviene comparar cada elemento con su contenedor,
  no con el ancho de la ventana.

---

## 11. Cómo trabaja Ian

Está en `Freelancer/CLAUDE.md`. Lo esencial: español rioplatense, directo y sin
relleno; leer antes de escribir; cambios quirúrgicos; verificar de verdad en vez
de suponer; y decir las dudas aunque se haya hecho lo pedido.

El proyecto es una **demo de venta**: el objetivo es cerrar el contrato con el
dueño del negocio. El argumento comercial es el panel — mostrarle que puede
cargar precios él mismo, y que conectar eso de verdad (8.1) es el trabajo que se
está cotizando.
