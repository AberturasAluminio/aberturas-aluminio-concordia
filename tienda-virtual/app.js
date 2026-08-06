const state = {
  products: Store.getProducts(),
  category: "Todas",
  search: "",
  sort: "featured",
  cart: Store.getCart(),
  deliveryZones: Store.getDeliveryZones(),
  commerceContent: Store.getCommerceContent(),
  selectedDeliveryZone: null,
  cartZone: null,
  currentProduct: null,
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/* Un mismo app.js corre en las nueve páginas y cada una trae solo una parte
   del HTML: el catálogo vive en productos.html, las zonas en la home. Por eso
   todo lo que apunta a un nodo puntual se ata con `on` y se dibuja solo si el
   contenedor existe. */
const on = (selector, event, handler) => {
  const element = $(selector);
  if (element) element.addEventListener(event, handler);
};

// Iconos de línea, 24x24, trazo uniforme. Geometría recta para acompañar el
// isotipo del logo. Se inyectan con innerHTML: son constantes, no datos.
const svg = window.svgIcon;

// Iconos de acción reutilizados en los botones que se generan por JS.
const ICON_WA = window.ICON_WA;   // definido en layout.js, que corre antes
const ICON_CART = '<svg class="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H7a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M9 10V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V10"/></svg>';

// Iconos de los grupos de preguntas frecuentes. La clave es el `icon` del grupo.
const faqIcons = {
  producto: svg('<rect x="3" y="4" width="18" height="16"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="11" x2="8" y2="13"/><line x1="16" y1="11" x2="16" y2="13"/>'),
  envio: svg('<rect x="1" y="7" width="13" height="9"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/>'),
  pago: svg('<rect x="2" y="5" width="20" height="14"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="11" y2="15"/>'),
  medida: svg('<rect x="2" y="8" width="20" height="8"/><line x1="7" y1="8" x2="7" y2="12"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="17" y1="8" x2="17" y2="12"/>'),
};

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

function applyCommerceContent() {
  const content = state.commerceContent;
  // Cada nodo con data-content toma su texto del panel. Para sumar un texto
  // editable alcanza con marcarlo en el HTML y darle su valor por defecto.
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = content[element.dataset.content];
    if (value !== undefined) element.textContent = value;
  });
  // Los pasos salen del texto editable del panel, separados por "|".
  if ($("#purchase-flow")) {
    const flow = String(content.purchaseFlow || "").split("|").map((item) => item.trim()).filter(Boolean);
    $("#purchase-flow").innerHTML = flow
      .map((item, index) => `<li><span class="step-n">${index + 1}</span><span class="step-text">${esc(item)}</span></li>`)
      .join("");
  }
  const settings = Store.getSettings();
  const phone = settings.whatsapp;
  const formattedPhone = phone === "5493454938829" ? "+54 9 345 493 8829" : `+${phone}`;
  document.querySelectorAll("[data-store-phone]").forEach((element) => {
    element.textContent = formattedPhone;
  });
  // El nombre, la dirección y el correo se editan en Configuración, no en los textos.
  document.querySelectorAll("[data-store-name]").forEach((element) => {
    element.textContent = settings.name || "";
  });
  document.querySelectorAll("[data-store-address]").forEach((element) => {
    element.textContent = settings.address || "";
  });
  document.querySelectorAll("[data-store-email]").forEach((element) => {
    element.textContent = settings.email || "";
    if (element.tagName === "A") element.href = settings.email ? `mailto:${settings.email}` : "#";
  });
  if ($("#locality-suggestions")) {
    $("#locality-suggestions").innerHTML = state.deliveryZones.filter((zone) => zone.available).slice(0, 5)
      .map((zone) => `<button data-locality="${esc(zone.locality)}" type="button">${esc(zone.locality)}</button>`).join("");
  }
  renderDeliveryZoneList();
}

function formatDeliveryDate(zone) {
  if (zone.nextDelivery) {
    const explicit = new Date(`${zone.nextDelivery}T12:00:00`);
    if (!Number.isNaN(explicit.getTime()) && explicit >= new Date().setHours(0, 0, 0, 0)) {
      return explicit.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    }
  }
  const schedule = normalizeText(zone.deliveryDays);
  const weekdays = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
  const today = new Date();
  const namedDay = Object.keys(weekdays).find((day) => schedule.includes(day));
  if (namedDay) {
    const delta = (weekdays[namedDay] - today.getDay() + 7) % 7 || 7;
    today.setDate(today.getDate() + delta);
  } else if (schedule.includes("diario")) {
    today.setDate(today.getDate() + (today.getDay() === 6 ? 2 : 1));
  } else if (schedule.includes("semanal")) {
    today.setDate(today.getDate() + 7);
  } else {
    return "A confirmar según recorrido";
  }
  return today.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

function deliveryZoneCard(zone) {
  return `
    <article class="delivery-match">
      <h4>${esc(zone.locality)} <small>CP ${esc(zone.postalCode || "s/d")}</small></h4>
      <dl>
        <dt>Frecuencia</dt><dd>${esc(zone.deliveryDays || "A confirmar")}</dd>
        <dt>Condición de pago</dt><dd>${esc(zone.paymentCondition || (zone.cashOnDelivery ? "Pago al recibir disponible" : "A confirmar"))}</dd>
      </dl>
      <button class="button button-whatsapp button-small" data-zone-whatsapp="${esc(zone.locality)}" type="button">${ICON_WA}Consultar esta entrega</button>
    </article>`;
}

function renderDeliveryResult(zones, searchValue = "") {
  const container = $("#delivery-result");
  container.hidden = false;
  state.selectedDeliveryZone = zones[0] || null;
  if (!zones.length) {
    container.className = "delivery-result unavailable";
    container.innerHTML = `<h4>Consultanos por ${esc(searchValue)}</h4><p>No encontramos una localidad o CP coincidente. Escribinos para verificar recorrido y condición de pago.</p><button class="button button-whatsapp button-small" data-zone-whatsapp="${esc(searchValue)}" type="button">${ICON_WA}Consultar por WhatsApp</button>`;
    return;
  }
  container.className = "delivery-result";
  container.innerHTML = `${zones.length > 1 ? `<p class="match-count">${zones.length} localidades coinciden con la búsqueda.</p>` : ""}${zones.map(deliveryZoneCard).join("")}`;
}

function searchLocality(value) {
  const query = normalizeText(value);
  if (!query) return showToast("Escribí una localidad");
  const numeric = query.replace(/\D/g, "");
  const matches = state.deliveryZones.filter((zone) => {
    if (numeric && numeric.length >= 3) return String(zone.postalCode || "").replace(/\D/g, "") === numeric;
    const locality = normalizeText(zone.locality);
    return locality === query || locality.includes(query) || query.includes(locality);
  });
  renderDeliveryResult(matches, value.trim());
  renderDeliveryZoneList(value);
}

function renderDeliveryZoneList(value = "") {
  if (!$("#delivery-zone-rows")) return;
  const query = normalizeText(value);
  const numeric = query.replace(/\D/g, "");
  const visible = state.deliveryZones.filter((zone) => {
    if (!query) return true;
    if (numeric && numeric.length >= 2) return String(zone.postalCode || "").includes(numeric);
    return normalizeText(`${zone.locality} ${zone.province} ${zone.department}`).includes(query);
  });
  $("#delivery-zone-count").textContent = `${visible.length} zona${visible.length === 1 ? "" : "s"}`;
  $("#delivery-zone-rows").innerHTML = visible.map((zone) => `
    <div class="delivery-zone-row">
      <strong>${esc(zone.locality)} <small>${esc(zone.province)} · CP ${esc(zone.postalCode || "s/d")}</small></strong>
      <span><b>Frecuencia</b>${esc(zone.deliveryDays || "A confirmar")}</span>
      <span><b>Condición de pago</b>${esc(zone.paymentCondition || "A confirmar")}</span>
    </div>`).join("");
}

function productType(product) {
  const category = product.category.toLowerCase();
  if (category.includes("puerta") || category.includes("porton") || category.includes("portón")) return "door";
  if (category.includes("reja")) return "reja";
  if (category.includes("mampara")) return "mampara";
  if (category.includes("accesorio")) return "accessory";
  return "window";
}

function productVisual(product) {
  const image = product.images?.[0] || product.image;
  if (image) return `<img src="${esc(image)}" alt="${esc(product.name)}">`;
  return `<div class="product-placeholder ${productType(product)}" aria-label="Imagen ilustrativa de ${esc(product.name)}"></div>`;
}

function productGallery(product) {
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  if (!images.length) return productVisual(product);
  return `
    <div class="gallery-main"><img id="gallery-main-image" src="${esc(images[0])}" alt="${esc(product.name)}"></div>
    ${images.length > 1 ? `<div class="gallery-thumbs">${images.map((image, index) => `<button class="${index === 0 ? "active" : ""}" data-gallery-image="${esc(image)}" type="button" aria-label="Ver imagen ${index + 1}"><img src="${esc(image)}" alt=""></button>`).join("")}</div>` : ""}
  `;
}

function renderCategories() {
  if (!$("#category-filters")) return;
  const counts = Object.fromEntries(Store.categories.map((category) => [category, state.products.filter((product) => product.active && product.category === category).length]));
  $("#category-filters").innerHTML = `
    <button class="filter-option ${state.category === "Todas" ? "active" : ""}" data-category="Todas" type="button"><span>Todas</span><b>${state.products.filter((product) => product.active).length}</b></button>
    ${Store.categories.map((category) => `<button class="filter-option ${state.category === category ? "active" : ""}" data-category="${esc(category)}" type="button"><span>${esc(category)}</span><b>${counts[category]}</b></button>`).join("")}
  `;
}

function filteredProducts() {
  const query = state.search.trim().toLocaleLowerCase("es");
  const visible = state.products.filter((product) => {
    if (!product.active) return false;
    const categoryMatch = state.category === "Todas" || product.category === state.category;
    const text = `${product.code} ${product.category} ${product.name} ${product.detail} ${product.measures.join(" ")} ${product.colors.join(" ")}`.toLocaleLowerCase("es");
    return categoryMatch && text.includes(query);
  });
  if (state.sort === "price-asc") visible.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") visible.sort((a, b) => b.price - a.price);
  if (state.sort === "name") visible.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return visible;
}

/* La medida que marca el "desde": la más barata según lo que se cobra, que
   con oferta no es la de menor precio de lista. */
function varianteMasBarata(product) {
  if (!product.variants.length) return null;
  return product.variants.reduce((menor, variante) =>
    Store.precioEfectivo(variante) < Store.precioEfectivo(menor) ? variante : menor);
}

/* Con oferta se muestra lo que se paga y al lado el precio anterior tachado.
   Sin oferta, el precio y nada más. */
function precioHTML(variant) {
  if (!variant) return "";
  if (!Store.enOferta(variant)) return money.format(variant.price);
  return `${money.format(variant.promoPrice)} <s class="precio-anterior">${money.format(variant.price)}</s>`;
}

/* Ficha compacta: la imagen manda, el detalle completo vive en el modal.
   El precio se muestra "desde" porque cada medida tiene el suyo. */
function productCard(product) {
  const medidas = product.variants.length;
  const barata = varianteMasBarata(product);
  const hayOferta = product.variants.some(Store.enOferta);
  return `
    <article class="product-card">
      <button class="product-media" data-view="${esc(product.code)}" type="button" aria-label="Ver ${esc(product.name)}">
        ${productVisual(product)}
        <span class="product-code">${esc(product.code)}</span>
        ${hayOferta ? '<span class="product-sale">Oferta</span>' : ""}
      </button>
      <div class="product-body">
        <span class="product-category">${esc(product.category)}</span>
        <h3>${esc(product.name)}</h3>
        <p class="product-measures">${medidas} medida${medidas === 1 ? "" : "s"} disponible${medidas === 1 ? "" : "s"}${product.colors.length ? ` · ${esc(product.colors.join(" / "))}` : ""}</p>
        <div class="product-price${hayOferta ? " on-sale" : ""}">
          <small>Desde</small>
          <strong>${precioHTML(barata)}</strong>
        </div>
        <button class="button button-buy full" data-quick-buy="${esc(product.code)}" type="button">${ICON_CART}Comprar</button>
      </div>
    </article>`;
}

function renderProducts() {
  if (!$("#product-grid")) return;
  const visible = filteredProducts();
  $("#result-count").textContent = `${visible.length} producto${visible.length === 1 ? "" : "s"}`;
  $("#product-grid").innerHTML = visible.map(productCard).join("");
  $("#empty-state").hidden = visible.length > 0;
}

/* Los destacados se eligen desde el panel. Si no hay ninguno marcado, se
   muestran los primeros publicados para que la sección nunca quede vacía. */
function renderFeatured() {
  const grid = $("#featured-grid");
  if (!grid) return;
  const publicados = state.products.filter((product) => product.active);
  const elegidos = publicados.filter((product) => product.featured);
  const featured = (elegidos.length ? elegidos : publicados).slice(0, 8);
  grid.innerHTML = featured.map(productCard).join("");
  const seccion = grid.closest("section");
  if (seccion) seccion.hidden = featured.length === 0;
}

/* ---------- Preguntas frecuentes ----------
   Cada pregunta es un <details>: el desplegable, el foco y el teclado los
   resuelve el navegador, así que acá no hace falta JavaScript. Se abre la
   primera para que se entienda de un vistazo que las demás también abren. */
function renderFaqs() {
  const container = $("#faq-groups");
  if (!container) return;
  const groups = Store.getFaqs().filter((group) => group.items.length);
  container.innerHTML = groups.map((group, groupIndex) => `
    <section class="faq-group">
      <h3 class="faq-group-title"><span class="faq-group-icon">${faqIcons[group.icon] || faqIcons.producto}</span>${esc(group.title)}</h3>
      <div class="faq-list">
        ${group.items.map((item, itemIndex) => `
          <details class="faq-item"${groupIndex === 0 && itemIndex === 0 ? " open" : ""}>
            <summary>${esc(item.q)}</summary>
            <div class="faq-answer"><p>${esc(item.a)}</p></div>
          </details>`).join("")}
      </div>
    </section>`).join("");
}

/* ---------- Reseñas ----------
   Son las de Google Maps, cargadas desde el panel. La tienda no recibe
   reseñas propias: Google no permite publicar en su ficha desde afuera, así
   que quien quiera dejar la suya va directo a Maps. */
function stars(rating) {
  return `<span class="stars" aria-label="${rating} de 5 estrellas">${
    Array.from({ length: 5 }, (_, index) => `<svg class="${index < rating ? "on" : ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>`).join("")
  }</span>`;
}

function renderReviews() {
  const grid = $("#reviews-grid");
  if (!grid) return;
  const published = Store.getReviews().filter((review) => review.published);
  const average = published.length
    ? published.reduce((sum, review) => sum + review.rating, 0) / published.length
    : 0;
  const maps = Store.getSettings().googleMaps;
  // "en Google" solo si todas vienen de ahí: el panel puede cargar reseñas propias.
  const soloGoogle = published.every((review) => review.source === "Google");

  $("#reviews-summary").innerHTML = `
    <div class="reviews-score">
      ${published.length ? `<strong>${average.toFixed(1).replace(".", ",")}</strong>${stars(Math.round(average))}<span>${published.length} reseña${published.length === 1 ? "" : "s"}${soloGoogle ? " en Google" : ""}</span>` : `<strong class="sin-datos">—</strong><span>Todavía sin reseñas publicadas</span>`}
    </div>
    ${maps ? `<a class="button button-outline" href="${esc(maps)}" target="_blank" rel="noopener noreferrer">Ver todas en Google</a>` : ""}`;

  grid.innerHTML = published.map((review) => {
    // La fecha solo se muestra si el panel la cargó; no se inventa. Se lee al
    // mediodía porque "2026-08-01" solo se parsea como UTC: a la medianoche,
    // en Argentina cae el día anterior y el mes sale corrido.
    const fecha = review.date ? new Date(`${review.date}T12:00:00`).toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "";
    const pie = [fecha, review.source === "Google" ? "Google" : ""].filter(Boolean).join(" · ");
    return `
    <article class="review-card">
      ${stars(review.rating)}
      <p>${esc(review.text)}</p>
      <footer>
        <strong>${esc(review.name)}</strong>
        ${pie ? `<span>${esc(pie)}</span>` : ""}
      </footer>
    </article>`;
  }).join("");

  $("#reviews-empty").hidden = published.length > 0;

  // El botón abre el formulario de reseña de Google. Si no está configurado,
  // cae a la ficha de Maps, desde donde igual se llega a "Escribir una reseña".
  const escribir = Store.getSettings().googleReview || maps;
  document.querySelectorAll("[data-google-review]").forEach((element) => {
    element.href = escribir || "#";
    element.hidden = !escribir;
  });
}

function selectOptions(label, name, values) {
  if (!values.length) return "";
  return `<label><span>${label}</span><select name="${name}" required><option value="">Seleccionar</option>${values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("")}</select></label>`;
}

const MEDIDA_PERSONALIZADA = "__a-medida__";

function measureOptions(product) {
  if (!product.variants.length) return "";
  return `<label><span>Medida y precio</span><select name="measure" required>
      <option value="">Seleccionar</option>
      ${product.variants.map((variant) => {
        // Dentro de un <option> no entra HTML: la oferta se dice con texto.
        const precio = Store.enOferta(variant)
          ? `${money.format(variant.promoPrice)} (antes ${money.format(variant.price)})`
          : money.format(variant.price);
        return `<option value="${esc(variant.measure)}">${esc(variant.measure)} — ${precio}</option>`;
      }).join("")}
      <option value="${MEDIDA_PERSONALIZADA}">Necesito una medida a pedido</option>
    </select></label>`;
}

function openProduct(code) {
  const product = state.products.find((item) => item.code === code);
  if (!product) return;
  state.currentProduct = product;
  $("#product-detail").innerHTML = `
    <div class="product-detail-layout">
      <div class="detail-image">${productGallery(product)}</div>
      <div class="detail-info">
        <span class="product-category">${esc(product.category)} · ${esc(product.code)}</span>
        <h2>${esc(product.name)}</h2>
        <p>${esc(product.detail)}</p>
        <div class="detail-price">${precioHTML(varianteMasBarata(product)) || money.format(product.price)}</div>
        <form id="variant-form">
          <div class="variant-grid">
            ${measureOptions(product)}
            ${selectOptions("Mano", "hand", product.hands)}
            ${selectOptions("Color", "color", product.colors)}
          </div>
          <label class="custom-measure" id="custom-measure" hidden>
            <span>¿Qué medidas necesitás?</span>
            <input name="customMeasure" type="text" placeholder="Ej. 145 x 95 cm" autocomplete="off">
            <small>El precio de una medida a pedido se confirma por WhatsApp.</small>
          </label>
          <p class="validation-message" id="variant-error" hidden></p>
          <div class="detail-actions">
            <button class="button button-outline" data-detail-add type="button">${ICON_CART}Agregar al carrito</button>
            <button class="button button-whatsapp" data-detail-whatsapp type="button">${ICON_WA}${esc(state.commerceContent.detailBuy || "Iniciar compra")}</button>
          </div>
        </form>
      </div>
    </div>`;
  $("#product-backdrop").hidden = false;
  $("#product-modal").classList.add("open");
  $("#product-modal").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}

function closeProduct() {
  $("#product-modal").classList.remove("open");
  $("#product-modal").setAttribute("aria-hidden", "true");
  $("#product-backdrop").hidden = true;
  state.currentProduct = null;
  unlockBody();
}

/* Solo se exige lo que el producto realmente ofrece. Antes se armaba una
   lista con `largo && valor`: cuando el largo era 0 quedaba un 0 en la lista
   y se leía como campo sin completar, así que los productos sin "mano" nunca
   se podían agregar. */
function selectedVariant() {
  const form = $("#variant-form");
  const product = state.currentProduct;
  if (!form || !product) return null;
  const values = Object.fromEntries(new FormData(form));

  const faltantes = [];
  if (product.measures.length && !values.measure) faltantes.push("la medida");
  if (product.hands.length && !values.hand) faltantes.push("la mano");
  if (product.colors.length && !values.color) faltantes.push("el color");

  const aMedida = values.measure === MEDIDA_PERSONALIZADA;
  if (aMedida && !String(values.customMeasure || "").trim()) faltantes.push("las medidas que necesitás");

  const error = $("#variant-error");
  if (faltantes.length) {
    error.textContent = `Falta elegir ${faltantes.join(", ").replace(/, ([^,]*)$/, " y $1")}.`;
    error.hidden = false;
    return null;
  }
  error.hidden = true;

  if (aMedida) {
    return { measure: `A medida: ${String(values.customMeasure).trim()}`, hand: values.hand || "", color: values.color || "", price: null };
  }
  const selected = product.variants.find((variant) => variant.measure === values.measure);
  return { measure: values.measure || "", hand: values.hand || "", color: values.color || "", price: selected?.price ?? product.price };
}

function cartKey(code, variant) {
  return `${code}|${variant.measure}|${variant.hand}|${variant.color}`;
}

function addConfiguredProduct(openDrawerAfter = false) {
  const variant = selectedVariant();
  if (!variant) return false;
  const key = cartKey(state.currentProduct.code, variant);
  const existing = state.cart.find((item) => item.key === key);
  if (existing) existing.quantity += 1;
  else state.cart.push({ key, code: state.currentProduct.code, ...variant, quantity: 1 });
  Store.saveCart(state.cart);
  renderCart();
  showToast("Producto agregado al carrito");
  closeProduct();
  if (openDrawerAfter) openCart();
  return true;
}

/* "Iniciar compra" desde la ficha: suma el producto y salta directo a los
   datos, sin detenerse en el carrito. El pedido se arma igual que si viniera
   de ahí, así que si ya había algo cargado también viaja. */
function iniciarCompraDirecta() {
  const variant = selectedVariant();
  if (!variant) return;
  const key = cartKey(state.currentProduct.code, variant);
  const existing = state.cart.find((item) => item.key === key);
  if (existing) existing.quantity += 1;
  else state.cart.push({ key, code: state.currentProduct.code, ...variant, quantity: 1 });
  Store.saveCart(state.cart);
  renderCart();
  closeProduct();
  $("#drawer-backdrop").hidden = false;
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  irADatos();
}

/* Un ítem a pedido no tiene precio hasta que el negocio lo cotiza: se muestra
   "A confirmar" y no se suma al subtotal. */
const esAPedido = (item) => item.price === null;

/* La medida del catálogo que corresponde a un ítem del carrito. Se busca por
   id, y por medida cuando el carrito viene de antes de que las medidas
   tuvieran uno propio. */
function varianteDe(item) {
  const product = state.products.find((candidate) => candidate.code === item.code);
  if (!product) return null;
  return product.variants.find((candidate) => candidate.id && candidate.id === item.id)
    || product.variants.find((candidate) => candidate.measure === item.measure)
    || null;
}

/* El precio se vuelve a leer del catálogo en cada render en vez de confiar en
   el que se guardó al agregar: si el negocio actualiza la lista, quien tenga
   el carrito abierto ve el valor nuevo y el pedido sale con ese. */
function precioActual(item) {
  if (esAPedido(item)) return null;
  const variant = varianteDe(item);
  // El precio que se cobra es el de oferta cuando la hay.
  if (variant) return Store.precioEfectivo(variant);
  // Si esa medida ya no está en el catálogo vale más lo guardado que el
  // "desde" del producto, que es el mínimo de las medidas que quedaron.
  const guardado = Number(item.price);
  return Number.isFinite(guardado) ? guardado : (product?.price ?? 0);
}

function renderCart() {
  state.cart = state.cart.filter((item) => state.products.some((product) => product.code === item.code));
  const units = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => {
    if (esAPedido(item)) return sum;
    return sum + precioActual(item) * item.quantity;
  }, 0);
  $("#cart-count").textContent = units;
  $("#cart-items").innerHTML = state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    const options = [item.measure, item.hand, item.color].filter(Boolean).join(" · ");
    const importe = esAPedido(item)
      ? '<em class="a-pedido">A confirmar</em>'
      : money.format(precioActual(item) * item.quantity);
    return `<article class="cart-item">
      <div class="cart-thumb">${productVisual(product)}</div>
      <div><h4>${esc(product.name)}</h4><p>${esc(options || product.code)}</p>
        <div class="quantity"><button data-cart-change="${esc(item.key)}" data-delta="-1" type="button">−</button><span>${item.quantity}</span><button data-cart-change="${esc(item.key)}" data-delta="1" type="button">+</button></div>
      </div>
      <div class="cart-item-side"><strong>${importe}</strong><button data-cart-remove="${esc(item.key)}" type="button">Quitar</button></div>
    </article>`;
  }).join("");
  const hayAPedido = state.cart.some(esAPedido);
  $("#cart-total").dataset.parcial = hayAPedido ? "1" : "";
  $("#cart-empty").hidden = state.cart.length > 0;
  $("#cart-summary").hidden = state.cart.length === 0;
  $("#cart-total").textContent = money.format(total);
  $("#cart-grand-total").textContent = money.format(total);
  $("#cart-grand-total").dataset.parcial = hayAPedido ? "1" : "";
}

/* Zona de entrega dentro del carrito: reutiliza las localidades cargadas en el
   panel. No calcula un costo (no lo hay publicado), informa si llegamos y en
   qué condiciones, y eso viaja en el mensaje de WhatsApp. */
function calcularEnvio(value) {
  const contenedor = $("#cart-shipping-result");
  const query = normalizeText(value);
  if (!query) {
    state.cartZone = null;
    contenedor.className = "cart-shipping-result";
    contenedor.innerHTML = `<span>${esc(state.commerceContent.cartShippingEmpty || "Calculalo para verlo")}</span>`;
    return;
  }
  const numeric = query.replace(/\D/g, "");
  const zone = state.deliveryZones.find((item) => {
    if (numeric.length >= 3) return String(item.postalCode || "").replace(/\D/g, "") === numeric;
    const locality = normalizeText(item.locality);
    return locality === query || locality.includes(query);
  });

  state.cartZone = zone || { locality: value.trim(), desconocida: true };
  if (!zone) {
    contenedor.className = "cart-shipping-result sin-zona";
    contenedor.innerHTML = `<strong>No encontramos esa zona</strong><span>Consultanos igual: te confirmamos el recorrido por WhatsApp.</span>`;
    return;
  }
  contenedor.className = "cart-shipping-result con-zona";
  contenedor.innerHTML = `
    <strong>${esc(zone.locality)}${zone.postalCode ? ` · CP ${esc(zone.postalCode)}` : ""}</strong>
    <span>${esc(zone.deliveryDays || "Frecuencia a confirmar")}</span>
    <span>${esc(zone.paymentCondition || (zone.cashOnDelivery ? "Pago al recibir disponible" : "A confirmar"))}</span>`;
}

function openCart() {
  mostrarPaso("cart");
  $("#drawer-backdrop").hidden = false;
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}

function closeCart() {
  $("#drawer-backdrop").hidden = true;
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  unlockBody();
}

function unlockBody() {
  if (!$("#product-modal").classList.contains("open") && !$("#cart-drawer").classList.contains("open")) document.body.classList.remove("locked");
}

function openWhatsApp(message) {
  const { whatsapp } = Store.getSettings();
  if (!whatsapp) return showToast("Configurá el número de WhatsApp desde Administrar");
  window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function cartLines() {
  return state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    const options = [item.measure, item.hand, item.color].filter(Boolean).join(", ");
    const importe = esAPedido(item)
      ? "a confirmar"
      : money.format(precioActual(item) * item.quantity);
    return `- ${item.quantity} x ${product.name} [${product.code}]${options ? ` (${options})` : ""}: ${importe}`;
  });
}

function cartTotal() {
  return state.cart.reduce((sum, item) => {
    if (esAPedido(item)) return sum;
    return sum + precioActual(item) * item.quantity;
  }, 0);
}

/* Queda registrado en el panel junto con los datos de quien compra, para que
   el negocio tenga el historial además del mensaje. */
function registrarPedido(datos, total) {
  const items = state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    const variant = varianteDe(item);
    return {
      // Con la medida identificada, el precio y el costo los pone la base
      // desde el catálogo: acá no se manda ningún importe.
      variantId: variant ? variant.id : null,
      code: item.code,
      name: product ? product.name : item.code,
      opciones: [item.measure, item.hand, item.color].filter(Boolean).join(", "),
      cantidad: item.quantity,
      precio: precioActual(item),
    };
  });
  return Store.addOrder({
    cliente: {
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      modo: datos.modo === "retiro" ? "Retiro en el local" : "Envío a domicilio",
      localidad: datos.modo === "retiro" ? "" : (datos.localidad || "").trim(),
      direccion: datos.modo === "retiro" ? "" : (datos.direccion || "").trim(),
      comentarios: (datos.comentarios || "").trim(),
    },
    items,
    total,
    aCotizar: state.cart.some(esAPedido),
  });
}

/* Paso 2: con los datos cargados, el mensaje sale con el pedido completo para
   que el negocio solo tenga que confirmarlo. */
function enviarPedido(datos) {
  const total = cartTotal();
  registrarPedido(datos, total);
  const subtotal = state.cart.some(esAPedido)
    ? `Subtotal de lo publicado: ${money.format(total)} (falta cotizar lo que va a medida)`
    : `Subtotal: ${money.format(total)}`;

  const entrega = datos.modo === "retiro"
    ? "Retiro en el local"
    : `Envío a domicilio\nLocalidad: ${datos.localidad}\nDirección: ${datos.direccion}`;

  const bloques = [
    "Hola, quiero hacer este pedido:",
    "",
    cartLines().join("\n"),
    "",
    subtotal,
    "",
    "MIS DATOS",
    `Nombre: ${datos.nombre}`,
    `Teléfono: ${datos.telefono}`,
    `Entrega: ${entrega}`,
  ];
  if (datos.comentarios) bloques.push(`Comentarios: ${datos.comentarios}`);
  bloques.push("", "Quedo a la espera de la confirmación.");

  openWhatsApp(bloques.join("\n"));
}

/* ---------- Navegación entre los dos pasos del carrito ---------- */
function mostrarPaso(paso) {
  const enDatos = paso === "datos";
  $("#step-cart").hidden = enDatos;
  $("#step-datos").hidden = !enDatos;
  $("#cart-back").hidden = !enDatos;
  $("#drawer-title").textContent = enDatos
    ? (state.commerceContent.checkoutTitle || "Tus datos")
    : (state.commerceContent.cartTitle || "Carrito de compras");
  $("#cart-drawer").scrollTop = 0;
  if (enDatos) renderResumenPedido();
}

function renderResumenPedido() {
  const total = cartTotal();
  const unidades = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#checkout-resumen").innerHTML = `
    <span>${unidades} ${unidades === 1 ? "producto" : "productos"}</span>
    <strong>${money.format(total)}${state.cart.some(esAPedido) ? " + a cotizar" : ""}</strong>`;
}

function irADatos() {
  if (!state.cart.length) return;
  const form = $("#step-datos");
  const guardados = Store.getBuyer();
  Object.entries(guardados).forEach(([key, value]) => {
    if (form.elements[key] && form.elements[key].type !== "radio") form.elements[key].value = value;
  });
  form.elements.comentarios.value = "";   // son de cada pedido, no se arrastran
  $("#checkout-error").hidden = true;
  if (guardados.modo) {
    const radio = [...form.elements.modo].find((r) => r.value === guardados.modo);
    if (radio) radio.checked = true;
  }
  // Si ya calculó la zona en el carrito, la localidad viene puesta.
  if (state.cartZone && !form.elements.localidad.value) form.elements.localidad.value = state.cartZone.locality;
  aplicarModoEntrega();
  mostrarPaso("datos");
}

function aplicarModoEntrega() {
  const form = $("#step-datos");
  const esRetiro = form.elements.modo.value === "retiro";
  $("#campos-envio").hidden = esRetiro;
  form.elements.localidad.required = !esRetiro;
  form.elements.direccion.required = !esRetiro;
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("#toast").classList.remove("show"), 2400);
}

/* El catálogo vive en productos.html. Si se elige una categoría desde otra
   página, se va hasta allá con el filtro puesto en la URL. */
function setCategory(category) {
  if (!$("#product-grid")) {
    window.location.href = `productos.html?categoria=${encodeURIComponent(category)}`;
    return;
  }
  state.category = category;
  renderCategories();
  renderProducts();
  $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", (event) => {
  const category = event.target.closest("[data-category]");
  const view = event.target.closest("[data-view]");
  const quickBuy = event.target.closest("[data-quick-buy]");
  const galleryImage = event.target.closest("[data-gallery-image]");
  const locality = event.target.closest("[data-locality]");
  const zoneWhatsapp = event.target.closest("[data-zone-whatsapp]");
  if (category) setCategory(category.dataset.category);
  if (view) openProduct(view.dataset.view);
  if (quickBuy) openProduct(quickBuy.dataset.quickBuy);
  if (galleryImage) {
    $("#gallery-main-image").src = galleryImage.dataset.galleryImage;
    document.querySelectorAll("[data-gallery-image]").forEach((button) => button.classList.toggle("active", button === galleryImage));
  }
  if (locality) {
    $("#locality-search").value = locality.dataset.locality;
    searchLocality(locality.dataset.locality);
  }
  if (zoneWhatsapp) openWhatsApp(`Hola, quiero consultar por entrega en ${zoneWhatsapp.dataset.zoneWhatsapp}. ¿Cuál es la próxima fecha, el costo y la forma de pago disponible?`);
  if (event.target.closest("[data-close-product]")) closeProduct();
  if (event.target.closest("[data-detail-add]")) addConfiguredProduct(false);
  if (event.target.closest("[data-detail-whatsapp]")) iniciarCompraDirecta();
  if (event.target.closest("[data-general-whatsapp]")) openWhatsApp("Hola, quisiera recibir asesoramiento sobre sus productos.");
});
document.addEventListener("change", (event) => {
  if (!event.target.matches("#variant-form [name=measure]") || !state.currentProduct) return;
  const aMedida = event.target.value === MEDIDA_PERSONALIZADA;
  $("#custom-measure").hidden = !aMedida;
  if (aMedida) {
    $(".detail-price").textContent = "A confirmar";
    $("#custom-measure input").focus();
    return;
  }
  const variant = state.currentProduct.variants.find((item) => item.measure === event.target.value);
  // innerHTML porque el precio anterior tachado va marcado, no como texto.
  $(".detail-price").innerHTML = variant
    ? precioHTML(variant)
    : money.format(state.currentProduct.price);
});

on("#product-search", "input", (event) => { state.search = event.target.value; renderProducts(); });
on("#product-sort", "change", (event) => { state.sort = event.target.value; renderProducts(); });
on("#clear-filters", "click", () => setCategory("Todas"));
on("#open-cart", "click", openCart);
on("#close-cart", "click", closeCart);
on("#continue-shopping", "click", () => { closeCart(); if (!$("#product-grid")) window.location.href = "productos.html"; });
on("#drawer-backdrop", "click", closeCart);
on("#product-backdrop", "click", closeProduct);
on("#go-checkout", "click", irADatos);
on("#cart-back", "click", () => mostrarPaso("cart"));
on("#back-to-cart", "click", () => mostrarPaso("cart"));
on("#step-datos", "change", (event) => {
  if (event.target.name === "modo") aplicarModoEntrega();
});
on("#step-datos", "submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const datos = Object.fromEntries(new FormData(form));
  const error = $("#checkout-error");

  const faltan = [];
  if (!datos.nombre?.trim()) faltan.push("tu nombre");
  if (!datos.telefono?.trim()) faltan.push("tu teléfono");
  if (datos.modo === "envio") {
    if (!datos.localidad?.trim()) faltan.push("la localidad");
    if (!datos.direccion?.trim()) faltan.push("la dirección");
  }
  if (faltan.length) {
    error.textContent = `Falta completar ${faltan.join(", ").replace(/, ([^,]*)$/, " y $1")}.`;
    error.hidden = false;
    return;
  }
  error.hidden = true;

  // Los comentarios son de cada pedido: no se recuerdan para el siguiente.
  const { comentarios, ...aRecordar } = datos;
  Store.saveBuyer(aRecordar);
  enviarPedido(datos);
});
on("#cart-shipping-form", "submit", (event) => {
  event.preventDefault();
  calcularEnvio($("#cart-postal").value);
});
on("#clear-cart", "click", () => { state.cart = []; Store.saveCart(state.cart); renderCart(); });
on("#locality-search-form", "submit", (event) => {
  event.preventDefault();
  searchLocality($("#locality-search").value);
});
on("#locality-search", "input", (event) => renderDeliveryZoneList(event.target.value));
on("#cart-items", "click", (event) => {
  const change = event.target.closest("[data-cart-change]");
  const remove = event.target.closest("[data-cart-remove]");
  if (change) {
    const item = state.cart.find((candidate) => candidate.key === change.dataset.cartChange);
    if (item) item.quantity = Math.max(0, item.quantity + Number(change.dataset.delta));
    state.cart = state.cart.filter((candidate) => candidate.quantity > 0);
  }
  if (remove) state.cart = state.cart.filter((candidate) => candidate.key !== remove.dataset.cartRemove);
  Store.saveCart(state.cart);
  renderCart();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeProduct(); closeCart(); } });

// Flechas del menú: solo se muestran si hay páginas fuera de vista.
const navStrip = $("#page-strip");
function updateNavArrows() {
  const resto = navStrip.scrollWidth - navStrip.clientWidth;
  $("#nav-prev").hidden = resto < 4 || navStrip.scrollLeft < 4;
  $("#nav-next").hidden = resto < 4 || navStrip.scrollLeft > resto - 4;
}
// No alcanza con escuchar "scroll": con desplazamiento suave el evento puede no
// llegar, así que refrescamos también cuando el movimiento ya terminó.
function scrollNav(dir) {
  navStrip.scrollBy({ left: dir * navStrip.clientWidth * .7, behavior: "smooth" });
  setTimeout(updateNavArrows, 420);
}
on("#nav-prev", "click", () => scrollNav(-1));
on("#nav-next", "click", () => scrollNav(1));
navStrip.addEventListener("scroll", updateNavArrows, { passive: true });
window.addEventListener("resize", updateNavArrows);

// El buscador del header alimenta el filtro del catálogo. Desde otra página
// no hay nada que filtrar, así que lleva a Productos con la búsqueda puesta.
on("#head-search-form", "submit", (event) => {
  event.preventDefault();
  const value = $("#head-search").value;
  if (!$("#product-grid")) {
    window.location.href = `productos.html?q=${encodeURIComponent(value)}`;
    return;
  }
  state.search = value;
  $("#product-search").value = value;
  renderProducts();
  $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* Productos abre filtrado por lo que traiga la URL: así funcionan el
   desplegable de categorías, los banners de la home y el buscador. */
function applyUrlFilters() {
  if (!$("#product-grid")) return;
  const params = new URLSearchParams(window.location.search);
  const category = params.get("categoria");
  const query = params.get("q");
  if (category && Store.categories.includes(category)) state.category = category;
  if (query) {
    state.search = query;
    $("#product-search").value = query;
    $("#head-search").value = query;
  }
}

$("#year").textContent = new Date().getFullYear();

/* Los datos ahora viven en la base, así que hay que esperarlos antes de
   dibujar. `state` se vuelve a llenar acá: cuando se declaró arriba, `init()`
   todavía no había traído nada. Los listeners no dependen de datos y ya
   quedaron atados durante la carga del archivo. */
Store.init().then(() => {
  state.products = Store.getProducts();
  state.deliveryZones = Store.getDeliveryZones();
  state.commerceContent = Store.getCommerceContent();
  applyUrlFilters();
  applyCommerceContent();
  renderCategories();
  renderProducts();
  renderFeatured();
  renderFaqs();
  renderReviews();
  renderCart();
  updateNavArrows();
});
