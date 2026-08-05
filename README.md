# Tienda online — Aberturas Aluminio Concordia

Tienda online de aberturas de aluminio para Concordia, Entre Ríos. Catálogo con
carrito, **sin pasarela de pago**: el pedido se cierra por WhatsApp.

> Este repositorio contiene el **rediseño** de Sistemas Umbral. El material
> original que trajo el cliente está en `site/` y `diseño-extraido/`, y se
> conserva solo como referencia — no forma parte del sitio que se publica.

## Qué se publica

Se despliega únicamente la carpeta [`tienda-virtual/`](tienda-virtual).

| Página | Archivo |
| --- | --- |
| Tienda | `index.html` |
| Panel de administración | `admin.html` |

## Correr en local

```bash
python serve.py
```

- Tienda: http://localhost:8090
- Panel: http://localhost:8090/admin.html

`serve.py` es un servidor de desarrollo: manda `Cache-Control: no-store` y le
agrega `?v=<fecha>` a los CSS y JS, para que el navegador no sirva versiones
viejas mientras se edita.

## Cómo está armado

Sitio estático: HTML, CSS y JavaScript sin dependencias ni compilación.

```
tienda-virtual/
├── index.html              tienda
├── admin.html              panel de administración
├── styles.css              sistema de diseño (azul #003098 · naranja #F45F11)
├── admin.css               estilos del panel
├── app.js                  catálogo, carrito, zonas de entrega
├── admin.js                alta y edición de productos, import/export Excel
├── store.js                capa de datos y datos por defecto
├── delivery-zones-data.js  145 localidades de reparto
├── xlsx-utils.js           lectura y escritura de planillas
└── assets/                 logos, foto del banner e imágenes de categorías
```

## Estado actual

Los datos (productos, precios, zonas, número de WhatsApp) se guardan en el
`localStorage` del navegador. Sirve para configurar y presentar la tienda en una
computadora, pero **los cambios del panel no se ven en la web publicada**: cada
visitante recibe el catálogo por defecto de `store.js`.

Para que el panel funcione de verdad —que el dueño cargue precios desde el
celular y todos los vean— falta conectar `store.js` a una base de datos y poner
acceso protegido en `/admin.html`.

## Créditos de las imágenes

Las fotos del banner y de las categorías son de [Unsplash](https://unsplash.com)
(licencia libre para uso comercial) y están puestas como muestra: se reemplazan
por fotos reales de los trabajos del cliente.
