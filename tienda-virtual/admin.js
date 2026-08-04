const adminState = {
  products: Store.getProducts(),
  editingImage: "",
  editingImages: [],
  deliveryZones: Store.getDeliveryZones(),
  commerceContent: Store.getCommerceContent(),
  preview: null,
};

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const headers = ["Código", "Categoría", "Nombre", "Detalle", "Medida", "Mano", "Color", "Precio", "Imagen"];

function typeFor(product) {
  const category = product.category.toLowerCase();
  if (category.includes("puerta") || category.includes("port")) return "door";
  if (category.includes("reja")) return "reja";
  if (category.includes("mampara")) return "mampara";
  if (category.includes("accesorio")) return "accessory";
  return "window";
}

function visual(product) {
  return product.image ? `<img src="${esc(product.image)}" alt="">` : `<div class="product-placeholder ${typeFor(product)}"></div>`;
}

function persist() {
  Store.saveProducts(adminState.products);
  renderAll();
}

function renderAll() {
  const active = adminState.products.filter((product) => product.active).length;
  $("#admin-stats").innerHTML = `
    <article class="stat-card"><small>Productos</small><strong>${adminState.products.length}</strong></article>
    <article class="stat-card"><small>Publicados</small><strong>${active}</strong></article>
    <article class="stat-card"><small>Categorías con productos</small><strong>${new Set(adminState.products.map((product) => product.category)).size}</strong></article>
    <article class="stat-card"><small>Sin imagen propia</small><strong>${adminState.products.filter((product) => !product.image).length}</strong></article>`;
  renderTable();
  renderDeliveryZones();
}

function renderDeliveryZones() {
  const query = normalizeHeader($("#delivery-zone-search")?.value || "");
  const numeric = query.replace(/\D/g, "");
  const visible = adminState.deliveryZones.filter((zone) => {
    if (!query) return true;
    if (numeric) return String(zone.postalCode || "").includes(numeric);
    return normalizeHeader(`${zone.locality} ${zone.department} ${zone.province}`).includes(query);
  });
  $("#admin-delivery-count").textContent = `${visible.length} localidades`;
  $("#delivery-zone-table").innerHTML = visible.map((zone) => `
    <tr>
      <td>${esc(zone.province)}</td>
      <td>${esc(zone.department)}</td>
      <td><strong>${esc(zone.locality)}</strong></td>
      <td class="code-cell">${esc(zone.postalCode)}</td>
      <td><span class="status ${zone.available ? "active" : "inactive"}">${zone.available ? "Sí" : "No"}</span></td>
      <td>${esc(zone.deliveryDays || "A confirmar")}</td>
      <td><small>${esc(zone.paymentCondition || "A confirmar")}</small></td>
      <td><div class="table-actions"><button data-edit-zone="${esc(zone.id)}" type="button">Editar</button><button class="delete" data-delete-zone="${esc(zone.id)}" type="button">Eliminar</button></div></td>
    </tr>`).join("");
}

function renderTable() {
  const search = $("#admin-search").value.trim().toLowerCase();
  const category = $("#admin-category").value;
  const visible = adminState.products.filter((product) => {
    const text = `${product.code} ${product.name} ${product.category}`.toLowerCase();
    return text.includes(search) && (!category || product.category === category);
  });
  $("#product-table").innerHTML = visible.map((product) => `
    <tr>
      <td><div class="admin-thumb">${visual(product)}</div></td>
      <td class="code-cell">${esc(product.code)}</td>
      <td><strong>${esc(product.name)}</strong><br><small>${esc(product.detail)}</small></td>
      <td>${esc(product.category)}</td>
      <td><small>${product.measures.length} medidas · ${product.hands.length} manos · ${product.colors.length} colores</small></td>
      <td class="price-cell">${money.format(product.price)}</td>
      <td><span class="status ${product.active ? "active" : "inactive"}">${product.active ? "Publicado" : "Oculto"}</span></td>
      <td><div class="table-actions"><button data-edit="${esc(product.code)}" type="button">Editar</button><button data-toggle="${esc(product.code)}" type="button">${product.active ? "Ocultar" : "Publicar"}</button><button class="delete" data-delete="${esc(product.code)}" type="button">Eliminar</button></div></td>
    </tr>`).join("");
}

function fillCategorySelects() {
  const options = Store.categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
  $("#admin-category").insertAdjacentHTML("beforeend", options);
  $("#price-category").innerHTML = options;
  $("#product-form [name=category]").innerHTML = `<option value="">Seleccionar</option>${options}`;
}

function openEditor(code = "") {
  const product = adminState.products.find((item) => item.code === code);
  const form = $("#product-form");
  form.reset();
  adminState.editingImage = "";
  adminState.editingImages = product?.images || (product?.image ? [product.image] : []);
  $("#editor-title").textContent = product ? "Editar producto" : "Nuevo producto";
  form.elements.originalCode.value = product?.code || "";
  form.elements.code.value = product?.code || "";
  form.elements.category.value = product?.category || "";
  form.elements.name.value = product?.name || "";
  form.elements.detail.value = product?.detail || "";
  form.elements.hands.value = product?.hands.join(" / ") || "";
  form.elements.colors.value = product?.colors.join(" / ") || "";
  form.elements.image.value = product?.image?.startsWith("http") ? product.image : "";
  form.elements.active.checked = product?.active !== false;
  renderVariantRows(product?.variants || [{ measure: "", price: "" }]);
  openModal("#product-editor");
}

function openDeliveryEditor(id = "") {
  const zone = adminState.deliveryZones.find((item) => item.id === id);
  const form = $("#delivery-zone-form");
  form.reset();
  $("#delivery-editor-title").textContent = zone ? "Editar localidad" : "Nueva localidad";
  form.elements.originalId.value = zone?.id || "";
  form.elements.province.value = zone?.province || "";
  form.elements.department.value = zone?.department || "";
  form.elements.locality.value = zone?.locality || "";
  form.elements.postalCode.value = zone?.postalCode || "";
  form.elements.deliveryDays.value = zone?.deliveryDays || "";
  form.elements.nextDelivery.value = zone?.nextDelivery || "";
  form.elements.available.checked = zone?.available !== false;
  form.elements.cashOnDelivery.checked = zone?.cashOnDelivery === true;
  form.elements.paymentCondition.value = zone?.paymentCondition || "";
  form.elements.observations.value = zone?.observations || "";
  openModal("#delivery-zone-editor");
}

function renderVariantRows(variants) {
  $("#variant-rows").innerHTML = variants.map((variant) => `
    <div class="variant-row">
      <input data-variant-measure value="${esc(variant.measure)}" placeholder="Medida, ej. 80x200" required>
      <input data-variant-price value="${variant.price ?? ""}" type="number" min="0" step="0.01" placeholder="Precio" required>
      <button data-remove-variant type="button" aria-label="Quitar medida">×</button>
    </div>`).join("");
}

function addVariantRow(measure = "", price = "") {
  $("#variant-rows").insertAdjacentHTML("beforeend", `
    <div class="variant-row">
      <input data-variant-measure value="${esc(measure)}" placeholder="Medida, ej. 80x200" required>
      <input data-variant-price value="${price}" type="number" min="0" step="0.01" placeholder="Precio" required>
      <button data-remove-variant type="button" aria-label="Quitar medida">×</button>
    </div>`);
}

function openModal(selector) {
  $("#admin-backdrop").hidden = false;
  $(selector).classList.add("open");
  $(selector).setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}

function closeModals() {
  document.querySelectorAll(".admin-modal.open").forEach((modal) => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); });
  $("#admin-backdrop").hidden = true;
  document.body.classList.remove("locked");
}

async function optimizeImage(file) {
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });
  const max = 1000;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .82);
}

function productRows(products = adminState.products) {
  return [headers, ...products.flatMap((product) => product.variants.map((variant) => [
    product.code, product.category, product.name, product.detail, variant.measure,
    product.hands.join(" / "), product.colors.join(" / "), variant.price, product.image,
  ]))];
}

function normalizeHeader(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function parseImport(rows) {
  if (!rows.length) throw new Error("El archivo está vacío.");
  const normalizedHeaders = rows[0].map(normalizeHeader);
  const column = (...names) => normalizedHeaders.findIndex((header) => names.includes(header));
  const indexes = {
    code: column("codigo", "código"),
    category: column("categoria", "categoría"),
    name: column("nombre", "producto"),
    detail: column("detalle", "descripcion", "descripción"),
    measure: column("medida", "medidas"),
    hand: column("mano", "manos"),
    color: column("color", "colores"),
    combined: column("mano / color", "mano/color"),
    price: column("precio"),
    image: column("imagen", "url imagen", "imagen url"),
  };
  if (indexes.code < 0 || indexes.category < 0 || indexes.name < 0 || indexes.price < 0) throw new Error("Faltan columnas obligatorias: Código, Categoría, Nombre y Precio.");

  const parsedRows = rows.slice(1).filter((row) => row.some((value) => String(value || "").trim())).map((row, index) => {
    const code = String(row[indexes.code] || "").trim().toUpperCase();
    const current = adminState.products.find((product) => product.code === code);
    let hands = indexes.hand >= 0 ? Store.splitOptions(row[indexes.hand]) : [];
    let colors = indexes.color >= 0 ? Store.splitOptions(row[indexes.color]) : [];
    if (indexes.combined >= 0 && !hands.length && !colors.length) {
      Store.splitOptions(row[indexes.combined]).forEach((value) => {
        if (/derecha|izquierda|reversible|ambidiestr/i.test(value)) hands.push(value);
        else colors.push(value);
      });
    }
    const product = Store.normalizeProduct({
      code,
      category: row[indexes.category],
      name: row[indexes.name],
      detail: indexes.detail >= 0 ? row[indexes.detail] : current?.detail || "",
      variants: [{ measure: indexes.measure >= 0 ? row[indexes.measure] : "", price: row[indexes.price] }],
      hands: hands.length ? hands : current?.hands || [],
      colors: colors.length ? colors : current?.colors || [],
      images: indexes.image >= 0 && row[indexes.image] ? [row[indexes.image]] : current?.images || [],
      active: current?.active !== false,
    });
    const errors = [];
    if (!product.code) errors.push("Falta código");
    if (!product.category) errors.push("Falta categoría");
    if (!product.name) errors.push("Falta nombre");
    if (!product.variants[0]?.measure) errors.push("Falta medida");
    if (!(Number(row[indexes.price]) >= 0)) errors.push("Precio inválido");
    return { line: index + 2, product, current, errors };
  });
  const grouped = new Map();
  parsedRows.forEach((item) => {
    const key = item.product.code || `ERROR-${item.line}`;
    if (!grouped.has(key)) grouped.set(key, { ...item, variants: [], lines: [], errors: [] });
    const group = grouped.get(key);
    group.lines.push(item.line);
    if (item.product.variants[0]?.measure) group.variants.push(item.product.variants[0]);
    group.errors.push(...item.errors);
  });
  return [...grouped.values()].map((group) => {
    const variantsByMeasure = new Map((group.current?.variants || []).map((variant) => [variant.measure.toLowerCase(), variant]));
    group.variants.forEach((variant) => variantsByMeasure.set(variant.measure.toLowerCase(), variant));
    const product = Store.normalizeProduct({ ...group.product, variants: [...variantsByMeasure.values()] });
    const errors = [...new Set(group.errors)];
    return { line: group.lines.join(", "), product, action: errors.length ? "error" : group.current ? "update" : "create", errors };
  });
}

function showPreview(items, title, onConfirm) {
  adminState.preview = { items, onConfirm };
  const create = items.filter((item) => item.action === "create").length;
  const update = items.filter((item) => item.action === "update").length;
  const error = items.filter((item) => item.action === "error").length;
  $("#preview-title").textContent = title;
  $("#preview-summary").innerHTML = `<span class="create">${create} nuevos</span><span class="update">${update} actualizaciones</span><span class="error">${error} con errores</span><span>${adminState.products.length - update} productos existentes quedan sin cambios</span>`;
  $("#preview-head").innerHTML = "<tr><th>Acción</th><th>Código</th><th>Producto</th><th>Categoría</th><th>Medida</th><th>Mano</th><th>Color</th><th>Precio</th><th>Observación</th></tr>";
  $("#preview-body").innerHTML = items.map((item) => `<tr class="preview-row-${item.action}">
    <td>${item.action === "create" ? "Crear" : item.action === "update" ? "Actualizar" : "Error"}</td>
    <td>${esc(item.product.code)}</td><td>${esc(item.product.name)}</td><td>${esc(item.product.category)}</td>
    <td>${esc(item.product.variants.map((variant) => `${variant.measure}: ${money.format(variant.price)}`).join(" / "))}</td><td>${esc(item.product.hands.join(" / "))}</td><td>${esc(item.product.colors.join(" / "))}</td>
    <td>Desde ${money.format(item.product.price)}</td><td>${esc(item.errors.join(", ") || (item.previousPrice != null ? `Antes desde: ${money.format(item.previousPrice)}` : "Listo para aplicar"))}</td></tr>`).join("");
  $("#confirm-preview").disabled = error > 0 || !items.length;
  openModal("#preview-modal");
}

function percentagePreview(percent, category = "") {
  const candidates = adminState.products.filter((product) => !category || product.category === category);
  return candidates.map((product) => ({
    action: "update",
    errors: [],
    product: Store.normalizeProduct({ ...product, variants: product.variants.map((variant) => ({ ...variant, price: Math.round(variant.price * (1 + percent / 100)) })) }),
    previousPrice: product.price,
  }));
}

function showPercentagePreview(percent, category = "") {
  if (!Number.isFinite(percent) || percent === 0) return showToast("Ingresá un porcentaje distinto de cero");
  const items = percentagePreview(percent, category);
  showPreview(items, `Vista previa: ${percent > 0 ? "+" : ""}${percent}%${category ? ` en ${category}` : ""}`, () => {
    const changes = new Map(items.map((item) => [item.product.code, item.product]));
    adminState.products = adminState.products.map((product) => changes.get(product.code) || product);
    persist();
  });
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("#toast").classList.remove("show"), 2400);
}

document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.tab));
}));
$("#new-product").addEventListener("click", () => openEditor());
$("#admin-search").addEventListener("input", renderTable);
$("#admin-category").addEventListener("change", renderTable);
$("#product-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  const toggle = event.target.closest("[data-toggle]");
  const remove = event.target.closest("[data-delete]");
  if (edit) openEditor(edit.dataset.edit);
  if (toggle) {
    const product = adminState.products.find((item) => item.code === toggle.dataset.toggle);
    if (product) { product.active = !product.active; persist(); }
  }
  if (remove && confirm(`¿Eliminar el producto ${remove.dataset.delete}? Esta acción no se puede deshacer.`)) {
    adminState.products = adminState.products.filter((item) => item.code !== remove.dataset.delete);
    persist();
  }
});
$("#new-delivery-zone").addEventListener("click", () => openDeliveryEditor());
$("#delivery-zone-search").addEventListener("input", renderDeliveryZones);
$("#delivery-zone-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-zone]");
  const remove = event.target.closest("[data-delete-zone]");
  if (edit) openDeliveryEditor(edit.dataset.editZone);
  if (remove) {
    const zone = adminState.deliveryZones.find((item) => item.id === remove.dataset.deleteZone);
    if (zone && confirm(`¿Eliminar la localidad ${zone.locality}?`)) {
      adminState.deliveryZones = adminState.deliveryZones.filter((item) => item.id !== zone.id);
      Store.saveDeliveryZones(adminState.deliveryZones);
      renderDeliveryZones();
      showToast("Localidad eliminada");
    }
  }
});
$("#image-file").addEventListener("change", async (event) => {
  if (!event.target.files[0]) return;
  adminState.editingImage = await optimizeImage(event.target.files[0]);
  adminState.editingImages = [adminState.editingImage];
  showToast("Imagen preparada para guardar");
});
$("#add-variant").addEventListener("click", () => addVariantRow());
$("#variant-rows").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-variant]");
  if (!remove) return;
  if ($("#variant-rows").children.length === 1) return showToast("El producto debe tener al menos una medida");
  remove.closest(".variant-row").remove();
});
$("#product-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const variants = [...$("#variant-rows").querySelectorAll(".variant-row")].map((row) => ({
    measure: row.querySelector("[data-variant-measure]").value.trim(),
    price: Number(row.querySelector("[data-variant-price]").value),
  })).filter((variant) => variant.measure);
  if (!variants.length || variants.some((variant) => !Number.isFinite(variant.price) || variant.price < 0)) return showToast("Completá correctamente las medidas y sus precios");
  const product = Store.normalizeProduct({
    ...data,
    variants,
    images: data.image ? [data.image] : adminState.editingImages,
    active: event.target.elements.active.checked,
  });
  const duplicate = adminState.products.find((item) => item.code === product.code && item.code !== data.originalCode);
  if (duplicate) return showToast("Ya existe otro producto con ese código");
  const index = adminState.products.findIndex((item) => item.code === data.originalCode);
  if (index >= 0) adminState.products[index] = product;
  else adminState.products.push(product);
  persist();
  closeModals();
  showToast("Producto guardado");
});
$("#delivery-zone-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const id = data.originalId || (globalThis.crypto?.randomUUID?.() || `zone-${Date.now()}`);
  const zone = Store.normalizeDeliveryZone({
    ...data,
    id,
    available: form.elements.available.checked,
    cashOnDelivery: form.elements.cashOnDelivery.checked,
  });
  const duplicate = adminState.deliveryZones.find((item) => item.id !== id && normalizeHeader(item.locality) === normalizeHeader(zone.locality) && normalizeHeader(item.province) === normalizeHeader(zone.province));
  if (duplicate) return showToast("Esa localidad ya está cargada");
  const index = adminState.deliveryZones.findIndex((item) => item.id === id);
  if (index >= 0) adminState.deliveryZones[index] = zone;
  else adminState.deliveryZones.push(zone);
  Store.saveDeliveryZones(adminState.deliveryZones);
  renderDeliveryZones();
  closeModals();
  showToast("Localidad guardada");
});
document.querySelectorAll("[data-close-modal],[data-close-preview]").forEach((button) => button.addEventListener("click", closeModals));
$("#admin-backdrop").addEventListener("click", closeModals);
$("#apply-general").addEventListener("click", () => showPercentagePreview(Number($("#general-percent").value)));
$("#apply-category").addEventListener("click", () => showPercentagePreview(Number($("#category-percent").value), $("#price-category").value));
$("#export-products").addEventListener("click", () => XlsxUtils.download("productos-tienda.xlsx", productRows()));
$("#download-template").addEventListener("click", () => XlsxUtils.download("plantilla-productos-tienda.xlsx", [
  headers,
  ["PAL-36-C", "Puertas de aluminio", "Puerta Aluminio 36 mm Ciega", "Puerta exterior de aluminio", "70x200", "Derecha / Izquierda", "Blanco / Negro", 335000, ""],
  ["PAL-36-C", "Puertas de aluminio", "Puerta Aluminio 36 mm Ciega", "Puerta exterior de aluminio", "80x200", "Derecha / Izquierda", "Blanco / Negro", 365000, ""],
  ["PAL-36-C", "Puertas de aluminio", "Puerta Aluminio 36 mm Ciega", "Puerta exterior de aluminio", "90x200", "Derecha / Izquierda", "Blanco / Negro", 405000, ""],
]));
$("#preview-import").addEventListener("click", async () => {
  const file = $("#excel-file").files[0];
  if (!file) return showToast("Seleccioná un archivo Excel");
  try {
    const items = parseImport(await XlsxUtils.read(file));
    showPreview(items, "Vista previa de importación", () => {
      const valid = items.filter((item) => item.action !== "error");
      const byCode = new Map(adminState.products.map((product) => [product.code, product]));
      valid.forEach((item) => byCode.set(item.product.code, item.product));
      adminState.products = [...byCode.values()];
      persist();
      $("#excel-file").value = "";
    });
  } catch (error) {
    showToast(error.message || "No se pudo leer el Excel");
  }
});
$("#confirm-preview").addEventListener("click", () => {
  if (!adminState.preview || $("#confirm-preview").disabled) return;
  adminState.preview.onConfirm();
  closeModals();
  showToast("Cambios guardados correctamente");
});
$("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const settings = Object.fromEntries(new FormData(event.target));
  settings.whatsapp = settings.whatsapp.replace(/\D/g, "");
  Store.saveSettings(settings);
  showToast("Configuración guardada");
});
$("#commerce-content-form").addEventListener("submit", (event) => {
  event.preventDefault();
  adminState.commerceContent = Object.fromEntries(new FormData(event.target));
  Store.saveCommerceContent(adminState.commerceContent);
  showToast("Textos comerciales guardados");
});

fillCategorySelects();
const settings = Store.getSettings();
Object.entries(settings).forEach(([key, value]) => { if ($("#settings-form").elements[key]) $("#settings-form").elements[key].value = value; });
Object.entries(adminState.commerceContent).forEach(([key, value]) => { if ($("#commerce-content-form").elements[key]) $("#commerce-content-form").elements[key].value = value; });
renderAll();
