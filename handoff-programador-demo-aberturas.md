# Handoff para el programador — DEMO web "Aberturas Aluminio Concordia"

> **Contexto (leer primero):** esto es una **demo de venta**, no la versión de producción. El objetivo es tener una **URL pública viva** para mostrarle al cliente y cerrar el proyecto. No hay que hacer backend, ni CMS, ni cargar todo el catálogo real. Simple, rápido, que se vea impecable.

---

## 1. Qué te entrego (el paquete)

1. **`diseño.zip`** → el diseño ya maquetado en **HTML / CSS / JS**. Es la base: no hay que rediseñar, solo integrarlo y dejarlo funcionando.
2. **Este documento** → especificación de qué hacer.
3. **Instagram del negocio** (fuente de imágenes de muestra): https://www.instagram.com/aberturasaluminioconcordia/
4. **Número de WhatsApp** para los botones: `⚠️ COMPLETAR` *(si no lo tengo aún, usar un placeholder y dejarlo fácil de cambiar en un solo lugar).*

---

## 2. Qué tenés que hacer (tareas, en orden)

1. **Levantar el sitio del zip** y verificar que funcione tal cual (todas las secciones, fuentes, estilos).
2. **Chequear responsive mobile-first**: la mayoría lo va a ver desde el celular. Que se vea perfecto en mobile primero, después desktop.
3. **Cargar imágenes de muestra** desde el Instagram del negocio (ver sección 4): pocas, solo para que la demo no se vea vacía — hero, algunas fichas del catálogo y la galería.
4. **Cablear los botones de WhatsApp** (ver sección 5): botón general + botón por producto, cada uno con su mensaje pre-armado.
5. **Botón flotante de WhatsApp en mobile** (fijo abajo a la derecha), siempre visible.
6. **SEO básico de demostración** (ver sección 6): title, meta description y Open Graph con keywords de Concordia. *(Es una demo, pero mostrarle que ya viene pensada para Google suma en la venta.)*
7. **Deploy en Vercel** → entregar la **URL pública**.

---

## 3. Especificaciones técnicas

- **Stack:** sitio **estático** (el HTML/CSS/JS del zip). **Sin** backend, **sin** base de datos, **sin** CMS.
- **Hosting/deploy:** **Vercel** (import del proyecto estático o drag & drop de la carpeta `dist`/`public`). Entregar la URL `*.vercel.app`.
- **Nota para producción (no ahora):** al ser estático, migra a Cloudflare Pages sin cambiar código cuando el proyecto se cierre.
- **Performance:** optimizar imágenes a **WebP**, comprimirlas. Que cargue rápido.
- **Un solo lugar para el número de WhatsApp:** definirlo en una variable/constante al inicio del JS o como `data-attribute`, para cambiarlo una vez y que aplique a todos los botones.

---

## 4. Imágenes (de muestra, para la demo)

- **Fuente:** el Instagram público del negocio → https://www.instagram.com/aberturasaluminioconcordia/
- Bajar **solo algunas** (5–8) que se vean bien: 1 para el hero, unas pocas para las fichas de catálogo y 2–3 para la galería de trabajos.
- Son **temporales / de muestra**: en producción se reemplazan por las fotos oficiales que entregue el cliente. Dejar los `<img>` fáciles de intercambiar (nombres claros, misma proporción).
- Donde falte imagen, usar un **placeholder prolijo** (no dejar rota la maqueta).

---

## 5. Botones de WhatsApp

Formato del link:
```
https://wa.me/54XXXXXXXXXX?text=<mensaje-url-encoded>
```
*(54 + 9 + número de celular, sin 0 ni 15. Reemplazar por el número real.)*

- **Botón principal** (hero, header sticky, banda de cierre, botón flotante mobile) →
  mensaje: `Hola, quiero cotizar una abertura a medida.`
- **Botón de cada producto del catálogo** →
  mensaje: `Hola, quiero cotizar: [NOMBRE DEL PRODUCTO]. ¿Me pasan información?`
  *(que el `[NOMBRE DEL PRODUCTO]` corresponda a la ficha donde está el botón.)*

Todos los links abren en pestaña nueva (`target="_blank"` + `rel="noopener"`).

---

## 6. SEO básico (nivel demo)

En el `<head>`:
- `<title>`: **Aberturas de Aluminio a Medida en Concordia | Envíos a Entre Ríos y Corrientes**
- `<meta name="description">`: *Fabricación de aberturas de aluminio a medida en Concordia. Puertas, ventanas, portones y más. Enviamos a todo Entre Ríos y centro-sur de Corrientes. Cotizá por WhatsApp.*
- **Open Graph** (`og:title`, `og:description`, `og:image`) para que se vea bien al compartir por WhatsApp.
- `lang="es"`, `<meta viewport>` correcto, y **un solo `<h1>`** con la keyword principal.
- *(El SEO local completo — Google Business + schema — va en la versión de producción, no en la demo.)*

---

## 7. Lo que NO hay que hacer (scope de la demo)

- ❌ CMS o panel de administración.
- ❌ Backend, base de datos, formularios con envío de mails.
- ❌ Pasarela de pago / carrito (no es ecommerce, todo es a medida).
- ❌ Cargar el catálogo real completo (van productos de muestra nomás).
- ❌ Rediseñar: respetar el diseño del zip tal cual.

---

## 8. Definition of Done (checklist de entrega)

- [ ] Sitio del zip integrado y andando.
- [ ] Se ve perfecto en mobile y en desktop.
- [ ] Imágenes de muestra del Instagram cargadas y optimizadas (WebP).
- [ ] Todos los botones de WhatsApp funcionan y abren el chat con el mensaje correcto.
- [ ] Botón flotante de WhatsApp visible en mobile.
- [ ] Title + meta description + Open Graph cargados.
- [ ] Deploy en Vercel hecho → **URL pública entregada**.
- [ ] Número de WhatsApp centralizado en un solo lugar (fácil de cambiar).

---

## 9. Prompt listo para pegar (si el programador usa una IA / Claude Code)

> Copiá este bloque tal cual si el programador trabaja con un asistente de IA:

```
Tenés una web ya maquetada en HTML/CSS/JS (te paso el zip). Es una DEMO de venta
para un negocio de aberturas de aluminio en Concordia, Argentina. NO hagas backend,
CMS ni base de datos. Tareas:

1. Integrá el sitio del zip y verificá que ande igual al diseño. No rediseñes.
2. Asegurá responsive mobile-first (prioridad celular).
3. Cargá 5–8 imágenes de muestra del Instagram público
   (instagram.com/aberturasaluminioconcordia): 1 hero, algunas para el catálogo,
   2–3 para la galería. Optimizalas a WebP. Dejá los <img> fáciles de reemplazar.
4. Cableá los botones de WhatsApp con este formato:
   https://wa.me/54XXXXXXXXXX?text=<mensaje-encodeado>
   - Botón general: "Hola, quiero cotizar una abertura a medida."
   - Botón por producto: "Hola, quiero cotizar: [PRODUCTO]. ¿Me pasan información?"
   Centralizá el número en UNA sola constante para cambiarlo en un lugar.
   target="_blank" rel="noopener".
5. Sumá un botón flotante de WhatsApp fijo en mobile (abajo a la derecha).
6. SEO básico en el <head>:
   - title: "Aberturas de Aluminio a Medida en Concordia | Envíos a Entre Ríos y Corrientes"
   - meta description con keywords de Concordia / aberturas a medida.
   - Open Graph (og:title, og:description, og:image).
   - lang="es", viewport correcto, un solo <h1>.
7. Deploy en Vercel y devolveme la URL pública.

Entregá: la URL de Vercel + el proyecto. Simple, rápido y que se vea impecable.
```

---

## 10. Lo que le pasás al programador (resumen)

1. `diseño.zip`
2. Este documento (`handoff-programador-demo-aberturas.md`)
3. Link del Instagram (para las imágenes)
4. Número de WhatsApp real *(cuando lo tengas; si no, va placeholder)*
