const state = {
  products: Store.getProducts(),
  category: "Todas",
  search: "",
  sort: "featured",
  cart: Store.getCart(),
  deliveryZones: Store.getDeliveryZones(),
  commerceContent: Store.getCommerceContent(),
  selectedDeliveryZone: null,
  currentProduct: null,
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// Iconos de línea, 24x24, trazo uniforme. Geometría recta para acompañar el
// isotipo del logo. Se inyectan con innerHTML: son constantes, no datos.
const svg = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true">${paths}</svg>`;

const categoryIcons = {
  "Ventanas de aluminio": svg('<rect x="3" y="4" width="18" height="16"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="11" x2="8" y2="13"/><line x1="16" y1="11" x2="16" y2="13"/>'),
  "Ventanas aluminio con rejas": svg('<rect x="3" y="4" width="18" height="16"/><line x1="8" y1="4" x2="8" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="16" y1="4" x2="16" y2="20"/>'),
  "Puertas de chapa": svg('<rect x="6" y="3" width="12" height="18"/><line x1="9" y1="12" x2="10" y2="12"/><line x1="6" y1="7" x2="18" y2="7"/><line x1="6" y1="17" x2="18" y2="17"/>'),
  "Puertas placa": svg('<rect x="6" y="3" width="12" height="18"/><rect x="9" y="6" width="6" height="5"/><rect x="9" y="14" width="6" height="4"/>'),
  "Puertas de aluminio": svg('<rect x="6" y="3" width="12" height="18"/><rect x="8.5" y="5.5" width="7" height="7"/><line x1="9" y1="16" x2="10" y2="16"/>'),
  "Rejas": svg('<rect x="3" y="5" width="18" height="14"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="13" y1="5" x2="13" y2="19"/><line x1="18" y1="5" x2="18" y2="19"/><line x1="3" y1="12" x2="21" y2="12"/>'),
  "Portones": svg('<rect x="2" y="6" width="20" height="12"/><line x1="7" y1="6" x2="7" y2="18"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="17" y1="6" x2="17" y2="18"/><line x1="2" y1="21" x2="22" y2="21"/>'),
  "Mamparas": svg('<rect x="3" y="3" width="9" height="18"/><rect x="12" y="3" width="9" height="18"/><line x1="6" y1="11" x2="6" y2="14"/>'),
  "Accesorios": svg('<rect x="3" y="4" width="18" height="16"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/>'),
};
const fallbackIcon = svg('<rect x="4" y="4" width="16" height="16"/>');

// Iconos de acción reutilizados en los botones que se generan por JS.
const ICON_WA = '<svg class="icon-wa" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2.02c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22.06l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01a9.86 9.86 0 0 0-7.01-2.94z"/><path fill="var(--wa-ink, #fff)" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>';
const ICON_CART = '<svg class="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H7a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M9 10V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V10"/></svg>';

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

function applyCommerceContent() {
  const content = state.commerceContent;
  const bindings = {
    "#commerce-section-title": content.sectionTitle,
    "#commerce-section-intro": content.sectionIntro,
    "#prices-info-title": content.pricesTitle,
    "#prices-info-text": content.pricesText,
    "#prices-info-note": content.pricesNote,
    "#delivery-info-title": content.deliveryTitle,
    "#delivery-info-text": content.deliveryText,
  };
  Object.entries(bindings).forEach(([selector, value]) => {
    const element = $(selector);
    if (element) element.textContent = value;
  });
  // Los pasos salen del texto editable del panel, separados por "|".
  const flow = String(content.purchaseFlow || "").split("|").map((item) => item.trim()).filter(Boolean);
  $("#purchase-flow").innerHTML = flow
    .map((item, index) => `<li><span class="step-n">${index + 1}</span><span class="step-text">${esc(item)}</span></li>`)
    .join("");
  const phone = Store.getSettings().whatsapp;
  const formattedPhone = phone === "5493454938829" ? "+54 9 345 493 8829" : `+${phone}`;
  document.querySelectorAll("[data-store-phone]").forEach((element) => {
    element.textContent = element.tagName === "BUTTON" ? `WhatsApp: ${formattedPhone}` : formattedPhone;
  });
  $("#locality-suggestions").innerHTML = state.deliveryZones.filter((zone) => zone.available).slice(0, 5)
    .map((zone) => `<button data-locality="${esc(zone.locality)}" type="button">${esc(zone.locality)}</button>`).join("");
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
  const zone = zones[0];
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

function productVisual(product, compact = false) {
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
  const counts = Object.fromEntries(Store.categories.map((category) => [category, state.products.filter((product) => product.active && product.category === category).length]));
  $("#category-strip").innerHTML = Store.categories.map((category) => `
    <button class="nav-category ${state.category === category ? "active" : ""}" data-category="${esc(category)}" type="button">
      <b>${categoryIcons[category] || fallbackIcon}</b><span>${esc(category)}</span>
    </button>
  `).join("");
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

/* Ficha compacta: la imagen manda, el detalle completo vive en el modal.
   El precio se muestra "desde" porque cada medida tiene el suyo. */
function productCard(product) {
  const medidas = product.variants.length;
  return `
    <article class="product-card">
      <button class="product-media" data-view="${esc(product.code)}" type="button" aria-label="Ver ${esc(product.name)}">
        ${productVisual(product)}
        <span class="product-code">${esc(product.code)}</span>
      </button>
      <div class="product-body">
        <span class="product-category">${esc(product.category)}</span>
        <h3>${esc(product.name)}</h3>
        <p class="product-measures">${medidas} medida${medidas === 1 ? "" : "s"} disponible${medidas === 1 ? "" : "s"}${product.colors.length ? ` · ${esc(product.colors.join(" / "))}` : ""}</p>
        <div class="product-price">
          <small>Desde</small>
          <strong>${money.format(product.price)}</strong>
        </div>
        <button class="button button-buy full" data-quick-buy="${esc(product.code)}" type="button">${ICON_CART}Comprar</button>
        <button class="whatsapp-link" data-product-whatsapp="${esc(product.code)}" type="button">${ICON_WA}Consultar por WhatsApp</button>
      </div>
    </article>`;
}

function renderProducts() {
  const visible = filteredProducts();
  $("#result-count").textContent = `${visible.length} producto${visible.length === 1 ? "" : "s"}`;
  $("#product-grid").innerHTML = visible.map(productCard).join("");
  $("#empty-state").hidden = visible.length > 0;
}

function renderFeatured() {
  const grid = $("#featured-grid");
  if (!grid) return;
  const featured = state.products.filter((product) => product.active).slice(0, 4);
  grid.innerHTML = featured.map(productCard).join("");
}

function selectOptions(label, name, values) {
  if (!values.length) return "";
  return `<label><span>${label}</span><select name="${name}" required><option value="">Seleccionar</option>${values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("")}</select></label>`;
}

function measureOptions(product) {
  if (!product.variants.length) return "";
  return `<label><span>Medida y precio</span><select name="measure" required><option value="">Seleccionar</option>${product.variants.map((variant) => `<option value="${esc(variant.measure)}">${esc(variant.measure)} — ${money.format(variant.price)}</option>`).join("")}</select></label>`;
}

function openProduct(code, intent = "view") {
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
        <div class="detail-price">${money.format(product.price)}</div>
        <form id="variant-form">
          <div class="variant-grid">
            ${measureOptions(product)}
            ${selectOptions("Mano", "hand", product.hands)}
            ${selectOptions("Color", "color", product.colors)}
          </div>
          <p class="validation-message" id="variant-error" hidden>Seleccioná todas las opciones disponibles.</p>
          <div class="detail-actions">
            <button class="button button-outline" data-detail-add type="button">Agregar al carrito</button>
            <button class="button button-buy" data-detail-buy type="button">${ICON_CART}Comprar</button>
            <button class="button button-whatsapp" data-detail-whatsapp type="button">${ICON_WA}Consultar por WhatsApp</button>
          </div>
        </form>
      </div>
    </div>`;
  $("#product-backdrop").hidden = false;
  $("#product-modal").classList.add("open");
  $("#product-modal").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  if (intent === "add" && !product.measures.length && !product.hands.length && !product.colors.length) addConfiguredProduct(false);
}

function closeProduct() {
  $("#product-modal").classList.remove("open");
  $("#product-modal").setAttribute("aria-hidden", "true");
  $("#product-backdrop").hidden = true;
  state.currentProduct = null;
  unlockBody();
}

function selectedVariant() {
  const form = $("#variant-form");
  if (!form || !state.currentProduct) return null;
  const values = Object.fromEntries(new FormData(form));
  const required = [
    state.currentProduct.measures.length && values.measure,
    state.currentProduct.hands.length && values.hand,
    state.currentProduct.colors.length && values.color,
  ].filter((value) => value !== false);
  if (required.some((value) => !value)) {
    $("#variant-error").hidden = false;
    return null;
  }
  const selected = state.currentProduct.variants.find((variant) => variant.measure === values.measure);
  return { measure: values.measure || "", hand: values.hand || "", color: values.color || "", price: selected?.price ?? state.currentProduct.price };
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

function renderCart() {
  state.cart = state.cart.filter((item) => state.products.some((product) => product.code === item.code));
  const units = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    return sum + (Number(item.price) || product?.price || 0) * item.quantity;
  }, 0);
  $("#cart-count").textContent = units;
  $("#cart-items").innerHTML = state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    const options = [item.measure, item.hand, item.color].filter(Boolean).join(" · ");
    return `<article class="cart-item">
      <div class="cart-thumb">${productVisual(product, true)}</div>
      <div><h4>${esc(product.name)}</h4><p>${esc(options || product.code)}</p>
        <div class="quantity"><button data-cart-change="${esc(item.key)}" data-delta="-1" type="button">−</button><span>${item.quantity}</span><button data-cart-change="${esc(item.key)}" data-delta="1" type="button">+</button></div>
      </div>
      <div class="cart-item-side"><strong>${money.format((Number(item.price) || product.price) * item.quantity)}</strong><button data-cart-remove="${esc(item.key)}" type="button">Quitar</button></div>
    </article>`;
  }).join("");
  $("#cart-empty").hidden = state.cart.length > 0;
  $("#cart-summary").hidden = state.cart.length === 0;
  $("#cart-total").textContent = money.format(total);
}

function openCart() {
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

function productMessage(product, variant = null) {
  const options = variant ? [variant.measure, variant.hand, variant.color].filter(Boolean).join(", ") : "Quiero conocer las opciones disponibles";
  return `Hola, quiero consultar por ${product.name} (${product.code}).\nOpciones: ${options}\nPrecio publicado: ${money.format(variant?.price ?? product.price)}.`;
}

function buyCart() {
  if (!state.cart.length) return;
  const lines = state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    const options = [item.measure, item.hand, item.color].filter(Boolean).join(", ");
    return `- ${item.quantity} x ${product.name} [${product.code}]${options ? ` (${options})` : ""}: ${money.format((Number(item.price) || product.price) * item.quantity)}`;
  });
  const total = state.cart.reduce((sum, item) => {
    const product = state.products.find((candidate) => candidate.code === item.code);
    return sum + (Number(item.price) || product.price) * item.quantity;
  }, 0);
  openWhatsApp(`Hola, quiero comprar estos productos:\n\n${lines.join("\n")}\n\nSubtotal estimado: ${money.format(total)}\nQuiero confirmar stock, entrega y forma de pago.`);
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("#toast").classList.remove("show"), 2400);
}

function setCategory(category) {
  state.category = category;
  renderCategories();
  renderProducts();
  $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", (event) => {
  const category = event.target.closest("[data-category]");
  const view = event.target.closest("[data-view]");
  const quick = event.target.closest("[data-quick-add]");
  const quickBuy = event.target.closest("[data-quick-buy]");
  const productWhatsapp = event.target.closest("[data-product-whatsapp]");
  const galleryImage = event.target.closest("[data-gallery-image]");
  const locality = event.target.closest("[data-locality]");
  const zoneWhatsapp = event.target.closest("[data-zone-whatsapp]");
  if (category) setCategory(category.dataset.category);
  if (view) openProduct(view.dataset.view);
  if (quick) openProduct(quick.dataset.quickAdd, "add");
  if (quickBuy) openProduct(quickBuy.dataset.quickBuy, "buy");
  if (productWhatsapp) {
    const product = state.products.find((item) => item.code === productWhatsapp.dataset.productWhatsapp);
    if (product) openWhatsApp(productMessage(product));
  }
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
  if (event.target.closest("[data-detail-buy]")) addConfiguredProduct(true);
  if (event.target.closest("[data-detail-whatsapp]")) {
    const variant = selectedVariant();
    if (variant) openWhatsApp(productMessage(state.currentProduct, variant));
  }
  if (event.target.closest("[data-general-whatsapp]")) openWhatsApp("Hola, quisiera recibir asesoramiento sobre sus productos.");
});
document.addEventListener("change", (event) => {
  if (event.target.matches("#variant-form [name=measure]") && state.currentProduct) {
    const variant = state.currentProduct.variants.find((item) => item.measure === event.target.value);
    if (variant) $(".detail-price").textContent = money.format(variant.price);
  }
});

$("#product-search").addEventListener("input", (event) => { state.search = event.target.value; renderProducts(); });
$("#product-sort").addEventListener("change", (event) => { state.sort = event.target.value; renderProducts(); });
$("#clear-filters").addEventListener("click", () => setCategory("Todas"));
$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#continue-shopping").addEventListener("click", closeCart);
$("#drawer-backdrop").addEventListener("click", closeCart);
$("#product-backdrop").addEventListener("click", closeProduct);
$("#buy-cart").addEventListener("click", buyCart);
$("#clear-cart").addEventListener("click", () => { state.cart = []; Store.saveCart(state.cart); renderCart(); });
$("#locality-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  searchLocality($("#locality-search").value);
});
$("#locality-search").addEventListener("input", (event) => renderDeliveryZoneList(event.target.value));
$("#cart-items").addEventListener("click", (event) => {
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

// Flechas del menú de categorías: solo se muestran si hay contenido fuera de vista.
const navStrip = $("#category-strip");
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
$("#nav-prev").addEventListener("click", () => scrollNav(-1));
$("#nav-next").addEventListener("click", () => scrollNav(1));
navStrip.addEventListener("scroll", updateNavArrows, { passive: true });
window.addEventListener("resize", updateNavArrows);
$("#nav-all").addEventListener("click", () => setCategory("Todas"));

// El buscador del header alimenta el mismo filtro del catálogo y baja hasta él.
$("#head-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = $("#head-search").value;
  state.search = value;
  $("#product-search").value = value;
  renderProducts();
  $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#year").textContent = new Date().getFullYear();
applyCommerceContent();
renderCategories();
renderProducts();
renderFeatured();
renderCart();
updateNavArrows();
