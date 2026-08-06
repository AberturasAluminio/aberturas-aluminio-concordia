const adminState = {
  products: Store.getProducts(),
  editingImage: "",
  editingImages: [],
  deliveryZones: Store.getDeliveryZones(),
  commerceContent: Store.getCommerceContent(),
  faqs: Store.getFaqs(),
  reviews: Store.getReviews(),
  preview: null,
  /* Solo el id: después de registrar un cobro la lista de pedidos se relee
     entera y el objeto que teníamos queda viejo. Guardar la referencia hacía
     que el detalle mostrara el saldo de antes del pago. */
  currentOrderId: null,
  paymentMethods: Store.getPaymentMethods(),
};

const currentOrder = () => Store.getOrders().find((order) => order.id === adminState.currentOrderId) || null;

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const headers = ["Código", "Categoría", "Nombre", "Detalle", "Medida", "Mano", "Color", "Costo", "Precio", "Oferta", "Stock", "Imagen"];

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
  /* Se relee el catálogo porque las operaciones de pedidos mueven el stock del
     lado del servidor: seguir con la copia vieja haría que la próxima edición
     de ese producto pisara el descuento. */
  adminState.products = Store.getProducts();
  const active = adminState.products.filter((product) => product.active).length;
  const pedidos = Store.getOrders();
  const deuda = pedidos.filter(conSaldo).reduce((sum, order) => sum + order.saldo, 0);
  $("#admin-stats").innerHTML = `
    <article class="stat-card"><small>Productos</small><strong>${adminState.products.length}</strong></article>
    <article class="stat-card"><small>Publicados</small><strong>${active}</strong></article>
    <article class="stat-card stat-orders"><small>Pedidos nuevos</small><strong>${pedidos.filter((order) => order.estado === "Nuevo").length}</strong></article>
    <article class="stat-card stat-debt"><small>Me deben</small><strong>${money.format(deuda)}</strong></article>`;
  renderTable();
  renderDeliveryZones();
  renderOrders();
  renderPaymentMethods();
  renderDashboard();
  renderFaqGroups();
  renderReviews();
}

/* ---------- Pedidos y cobros ---------- */
const fechaCorta = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/* Una fecha suelta (la del cobro) viene como "2026-08-06" y se parsea como UTC:
   a la medianoche argentina cae el día anterior. Se lee al mediodía, igual que
   las zonas de entrega y las reseñas. */
const fechaDia = (valor) => {
  if (!valor) return "—";
  const d = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

/* Un pedido cancelado no es una deuda: no se le cobra a nadie. */
const conSaldo = (order) => order.saldo > 0.009 && order.estado !== "Cancelado";

function renderOrders() {
  const query = normalizeHeader($("#orders-search")?.value || "");
  const soloDeuda = $("#orders-only-debt")?.checked;
  const estadoFiltro = $("#orders-filter-state")?.value || "";
  const todos = Store.getOrders();
  const visibles = todos.filter((order) => {
    if (soloDeuda && !conSaldo(order)) return false;
    if (estadoFiltro && order.estado !== estadoFiltro) return false;
    if (!query) return true;
    const texto = normalizeHeader(`${order.numero} ${order.cliente.nombre} ${order.cliente.telefono} ${order.cliente.localidad} ${order.estado} ${order.estadoPago}`);
    return texto.includes(query);
  });

  $("#orders-count").textContent = `${visibles.length} de ${todos.length} pedido${todos.length === 1 ? "" : "s"}`;
  $("#orders-empty").hidden = todos.length > 0;

  const deudores = todos.filter(conSaldo);
  const deuda = deudores.reduce((sum, order) => sum + order.saldo, 0);
  const abiertos = todos.filter((order) => order.estado !== "Entregado" && order.estado !== "Cancelado");
  $("#orders-summary").innerHTML = `
    <span class="orders-chip ${deuda > 0 ? "debt" : ""}"><small>Me deben</small><strong>${money.format(deuda)}</strong><em>${deudores.length} pedido${deudores.length === 1 ? "" : "s"}</em></span>
    <span class="orders-chip"><small>Pendientes de entrega</small><strong>${abiertos.length}</strong><em>${money.format(abiertos.reduce((sum, o) => sum + o.total, 0))}</em></span>`;

  $("#orders-table").innerHTML = visibles.map((order) => `<tr>
      <td class="code-cell">${esc(order.numero)}${order.canal === "local" ? '<br><small class="canal-local">Local</small>' : ""}</td>
      <td><small>${esc(fechaCorta(order.fecha))}</small></td>
      <td><strong>${esc(order.cliente.nombre)}</strong>${order.cliente.telefono ? `<br><small>${esc(order.cliente.telefono)}</small>` : ""}</td>
      <td class="price-cell">${money.format(order.total)}${order.aCotizar ? '<br><small class="a-cotizar">+ a cotizar</small>' : ""}</td>
      <td class="price-cell">${money.format(order.cobrado)}</td>
      <td class="price-cell ${conSaldo(order) ? "saldo-debe" : ""}">${money.format(order.saldo)}</td>
      <td><span class="pago-badge pago-${normalizeHeader(order.estadoPago).replace(/ /g, "-")}">${esc(order.estadoPago)}</span></td>
      <td>
        <select class="estado-select estado-${normalizeHeader(order.estado)}" data-order-state="${esc(order.id)}">
          ${Store.ORDER_STATES.map((estado) => `<option value="${esc(estado)}" ${estado === order.estado ? "selected" : ""}>${esc(estado)}</option>`).join("")}
        </select>
      </td>
      <td><div class="table-actions">
        <button data-order-view="${esc(order.id)}" type="button">Ver</button>
        ${conSaldo(order) ? `<button class="cobrar" data-order-collect="${esc(order.id)}" type="button">Cobrar</button>` : ""}
        <button class="delete" data-order-delete="${esc(order.id)}" type="button">Eliminar</button>
      </div></td>
    </tr>`).join("");
}

function openOrderDetail(id) {
  const order = Store.getOrders().find((item) => item.id === id);
  if (!order) return;
  adminState.currentOrderId = order.id;
  $("#order-detail-title").textContent = `Pedido ${order.numero}`;
  const c = order.cliente;
  const ganancia = order.mercaderia - order.costoTotal;
  $("#order-detail-body").innerHTML = `
    <div class="order-meta">
      <span>${esc(fechaCorta(order.fecha))}</span>
      <span class="status ${order.estado === "Cancelado" ? "inactive" : "active"}">${esc(order.estado)}</span>
      <span class="pago-badge pago-${normalizeHeader(order.estadoPago).replace(/ /g, "-")}">${esc(order.estadoPago)}</span>
      ${order.canal === "local" ? '<span class="canal-local">Venta del local</span>' : ""}
    </div>

    <div class="order-money">
      <span><small>Total</small><strong>${money.format(order.total)}</strong></span>
      <span><small>Cobrado</small><strong>${money.format(order.cobrado)}</strong></span>
      <span class="${conSaldo(order) ? "debt" : ""}"><small>Saldo</small><strong>${money.format(order.saldo)}</strong></span>
    </div>

    <h3 class="order-subtitle">Cliente</h3>
    <dl class="order-datos">
      <dt>Nombre</dt><dd>${esc(c.nombre)}</dd>
      <dt>Teléfono</dt><dd>${esc(c.telefono) || "—"}</dd>
      <dt>Entrega</dt><dd>${esc(c.modo)}</dd>
      ${c.localidad ? `<dt>Localidad</dt><dd>${esc(c.localidad)}</dd>` : ""}
      ${c.direccion ? `<dt>Dirección</dt><dd>${esc(c.direccion)}</dd>` : ""}
      ${c.comentarios ? `<dt>Comentarios</dt><dd>${esc(c.comentarios)}</dd>` : ""}
    </dl>

    <h3 class="order-subtitle">Productos</h3>
    <table class="order-items">
      <tbody>
        ${order.items.map((item) => `<tr>
          <td><strong>${esc(item.name)}</strong><br><small>${esc(item.code)}${item.opciones ? ` · ${esc(item.opciones)}` : ""}</small></td>
          <td>${item.cantidad}</td>
          <td class="price-cell">${item.precio === null ? '<em class="a-cotizar">A cotizar</em>' : money.format(item.precio * item.cantidad)}</td>
        </tr>`).join("")}
        <tr class="order-items-sum"><td>Mercadería</td><td></td><td class="price-cell">${money.format(order.mercaderia)}</td></tr>
        ${order.fleteTotal ? `<tr class="order-items-sum"><td>Flete${order.fletePorcentaje ? ` (${order.fletePorcentaje}%${order.flete ? " + monto fijo" : ""})` : ""}</td><td></td><td class="price-cell">${money.format(order.fleteTotal)}</td></tr>` : ""}
      </tbody>
    </table>
    <p class="order-total">Total: <strong>${money.format(order.total)}</strong>${order.aCotizar ? ' <em class="a-cotizar">+ lo que falta cotizar</em>' : ""}</p>
    ${order.costoTotal > 0 ? `<p class="order-margin">Costo ${money.format(order.costoTotal)} · Ganancia sobre mercadería <strong>${money.format(ganancia)}</strong>${order.mercaderia > 0 ? ` (${Math.round((ganancia / order.mercaderia) * 100)}%)` : ""}</p>` : '<p class="order-margin sin-costo">Este pedido no tiene costos cargados, así que no se puede calcular la ganancia.</p>'}

    <h3 class="order-subtitle">Flete</h3>
    <form class="order-flete" id="order-shipping-form">
      <label>Monto fijo<input name="flete" type="number" min="0" step="0.01" value="${order.flete || ""}" placeholder="0"></label>
      <label>% sobre la mercadería<input name="fletePorcentaje" type="number" min="0" max="100" step="0.01" value="${order.fletePorcentaje || ""}" placeholder="0"></label>
      <button class="button button-outline button-small" type="submit">Guardar flete</button>
    </form>

    <h3 class="order-subtitle">Cobros</h3>
    ${order.pagos.length ? `<table class="order-items order-pagos">
      <thead><tr><th>Fecha</th><th>Medio</th><th>Monto</th><th>Neto</th><th></th></tr></thead>
      <tbody>${order.pagos.map((pago) => `<tr>
        <td><small>${esc(fechaDia(pago.fecha))}</small>${pago.notas ? `<br><small>${esc(pago.notas)}</small>` : ""}</td>
        <td><small>${esc(pago.medio || "—")}</small></td>
        <td class="price-cell">${money.format(pago.monto)}</td>
        <td class="price-cell"><small>${money.format(pago.neto)}${pago.comision ? ` <em>(-${pago.comision}%)</em>` : ""}</small></td>
        <td><button class="delete" data-payment-delete="${esc(pago.id)}" type="button">Borrar</button></td>
      </tr>`).join("")}</tbody>
    </table>` : '<p class="order-margin">Todavía no se registró ningún cobro.</p>'}`;

  $("#order-pay-all").hidden = !conSaldo(order);
  $("#order-add-payment").hidden = order.estado === "Cancelado";
  openModal("#order-detail");
}

function ordersToRows() {
  const encabezado = ["Pedido", "Fecha", "Canal", "Cliente", "Teléfono", "Entrega", "Localidad", "Dirección", "Comentarios",
    "Productos", "Mercadería", "Flete", "Total", "Cobrado", "Saldo", "Estado de pago", "Estado de entrega", "Cobros"];
  return [encabezado, ...Store.getOrders().map((order) => [
    order.numero,
    fechaCorta(order.fecha),
    order.canal === "local" ? "Local" : "Web",
    order.cliente.nombre,
    order.cliente.telefono,
    order.cliente.modo,
    order.cliente.localidad,
    order.cliente.direccion,
    order.cliente.comentarios,
    order.items.map((item) => `${item.cantidad}x ${item.name}${item.opciones ? ` (${item.opciones})` : ""}`).join(" · "),
    order.mercaderia,
    order.fleteTotal,
    order.total,
    order.cobrado,
    order.saldo,
    order.estadoPago,
    order.estado,
    order.pagos.map((pago) => `${fechaDia(pago.fecha)} ${pago.medio || "sin medio"}: ${pago.monto}`).join(" · "),
  ])];
}

/* Registrar un cobro. `todo` es el caso de todos los días —"me pagó todo"— y
   deja el monto puesto con el saldo: lo único que hay que elegir es el medio. */
function openPaymentEditor(orderId, todo = false) {
  const order = Store.getOrders().find((item) => item.id === orderId);
  if (!order) return;
  adminState.currentOrderId = order.id;
  const form = $("#payment-form");
  form.reset();
  const activos = adminState.paymentMethods.filter((method) => method.active);
  if (!activos.length) return showToast("Primero cargá un medio de pago en la pestaña Medios de pago");
  $("#payment-method").innerHTML = activos.map((method) =>
    `<option value="${esc(method.id)}">${esc(method.name)}${method.commission ? ` · ${method.commission}% de comisión` : ""}</option>`).join("");
  $("#payment-editor-title").textContent = todo ? "Cobré todo" : "Registrar un pago";
  $("#payment-context").innerHTML = `Pedido <strong>${esc(order.numero)}</strong> de ${esc(order.cliente.nombre)} · Saldo <strong>${money.format(order.saldo)}</strong>`;
  form.elements.monto.value = todo ? Math.max(0, order.saldo).toFixed(2) : "";
  form.elements.fecha.value = hoyISO();
  actualizarNetoDelPago();
  openModal("#payment-editor");
}

/* Lo que de verdad le entra descontando la comisión. Se muestra al cargar el
   cobro para que la comisión no sea una sorpresa a fin de mes. */
function actualizarNetoDelPago() {
  const form = $("#payment-form");
  const monto = Number(form.elements.monto.value) || 0;
  const method = adminState.paymentMethods.find((item) => item.id === form.elements.methodId.value);
  const comision = method?.commission || 0;
  $("#payment-net").innerHTML = !monto || !comision
    ? ""
    : `Con ${comision}% de comisión te quedan <strong>${money.format(monto - (monto * comision) / 100)}</strong>`;
}

/* ---------- Medios de pago ---------- */

function renderPaymentMethods() {
  $("#payment-methods-table").innerHTML = adminState.paymentMethods.map((method, i) => `<tr>
    <td><input data-method-name value="${esc(method.name)}" data-index="${i}" placeholder="Ej. Mercado Pago"></td>
    <td><input data-method-commission value="${method.commission || 0}" data-index="${i}" type="number" min="0" max="100" step="0.01" class="input-small"></td>
    <td class="price-cell"><small>${money.format(100000 - (100000 * (method.commission || 0)) / 100)}</small></td>
    <td><label class="chip-check"><input data-method-active data-index="${i}" type="checkbox" ${method.active ? "checked" : ""}> Activo</label></td>
  </tr>`).join("");
}

/* ---------- Resumen ---------- */

/* Los pedidos que cuentan para el período. Se mira la fecha del pedido para lo
   vendido y la del cobro para lo entrado: son dos cosas distintas y meterlas
   en el mismo período fue justo lo que el cliente pidió poder separar. */
function rangoDelPeriodo(periodo) {
  const hoy = new Date();
  if (periodo === "todo") return { desde: new Date(0), hasta: new Date(8640000000000000), etiqueta: "Todo el historial" };
  if (periodo === "anio") return {
    desde: new Date(hoy.getFullYear(), 0, 1),
    hasta: new Date(hoy.getFullYear() + 1, 0, 1),
    etiqueta: `Año ${hoy.getFullYear()}`,
  };
  const desplazamiento = periodo === "anterior" ? -1 : 0;
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() + desplazamiento, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + desplazamiento + 1, 1);
  return { desde, hasta, etiqueta: desde.toLocaleDateString("es-AR", { month: "long", year: "numeric" }) };
}

const dentroDe = (fecha, rango) => {
  const d = new Date(fecha);
  return !Number.isNaN(d.getTime()) && d >= rango.desde && d < rango.hasta;
};

function renderDashboard() {
  const periodo = $("#dash-period")?.value || "mes";
  const rango = rangoDelPeriodo(periodo);
  const todos = Store.getOrders();
  const delPeriodo = todos.filter((order) => order.estado !== "Cancelado" && dentroDe(order.fecha, rango));

  const comprometido = delPeriodo.reduce((sum, order) => sum + order.total, 0);
  const entregado = delPeriodo.filter((order) => order.estado === "Entregado");
  const vendidoEntregado = entregado.reduce((sum, order) => sum + order.total, 0);
  const costo = delPeriodo.reduce((sum, order) => sum + order.costoTotal, 0);
  const mercaderia = delPeriodo.reduce((sum, order) => sum + order.mercaderia, 0);
  const flete = delPeriodo.reduce((sum, order) => sum + order.fleteTotal, 0);

  /* El margen se calcula SOLO sobre lo que tiene costo cargado. Restarle a
     toda la mercadería un costo que en la mitad de los productos es cero da un
     margen enorme y falso —81% en la prueba— y ese es justo el número que el
     dueño va a mirar para decidir precios. Lo que no tiene costo se deja
     afuera y se dice cuánto es. */
  const lineas = delPeriodo.flatMap((order) => order.items);
  const conCosto = lineas.filter((item) => item.costo > 0);
  const ventaConCosto = conCosto.reduce((sum, item) => sum + (item.precio || 0) * item.cantidad, 0);
  const ventaSinCosto = lineas.filter((item) => !(item.costo > 0))
    .reduce((sum, item) => sum + (item.precio || 0) * item.cantidad, 0);
  const margen = ventaConCosto - costo;

  // Los cobros se cuentan por su propia fecha: un pedido de julio cobrado en
  // agosto es plata que entró en agosto.
  const cobros = todos.flatMap((order) => order.pagos.map((pago) => ({ ...pago, order })))
    .filter((pago) => dentroDe(`${String(pago.fecha).slice(0, 10)}T12:00:00`, rango));
  const entrado = cobros.reduce((sum, pago) => sum + pago.monto, 0);
  const entradoNeto = cobros.reduce((sum, pago) => sum + pago.neto, 0);

  const deudores = todos.filter(conSaldo);
  const deuda = deudores.reduce((sum, order) => sum + order.saldo, 0);
  const ticket = delPeriodo.length ? comprometido / delPeriodo.length : 0;

  $("#dash-title").textContent = `Resumen · ${rango.etiqueta}`;

  const anterior = periodo === "mes" ? (() => {
    const previo = rangoDelPeriodo("anterior");
    const suma = todos.filter((order) => order.estado !== "Cancelado" && dentroDe(order.fecha, previo))
      .reduce((sum, order) => sum + order.total, 0);
    if (!suma) return "";
    const variacion = Math.round(((comprometido - suma) / suma) * 100);
    return `<em class="${variacion >= 0 ? "up" : "down"}">${variacion >= 0 ? "+" : ""}${variacion}% vs. mes anterior</em>`;
  })() : "";

  const tarjeta = (titulo, valor, pie = "") =>
    `<article class="dash-card"><small>${titulo}</small><strong>${valor}</strong>${pie}</article>`;

  $("#dash-cards").innerHTML = [
    tarjeta("Vendido (comprometido)", money.format(comprometido), anterior || `<em>${delPeriodo.length} pedido${delPeriodo.length === 1 ? "" : "s"}</em>`),
    tarjeta("Entregado", money.format(vendidoEntregado), `<em>${entregado.length} de ${delPeriodo.length}</em>`),
    tarjeta("Entró (cobrado)", money.format(entrado), entrado !== entradoNeto ? `<em>Neto de comisiones ${money.format(entradoNeto)}</em>` : `<em>${cobros.length} cobro${cobros.length === 1 ? "" : "s"}</em>`),
    tarjeta("Me deben", money.format(deuda), `<em>${deudores.length} pedido${deudores.length === 1 ? "" : "s"} · de todo el historial</em>`),
    tarjeta("Costo de la mercadería", money.format(costo)),
    tarjeta(
      "Ganancia", ventaConCosto > 0 ? money.format(margen) : "—",
      ventaConCosto > 0
        ? `<em>${Math.round((margen / ventaConCosto) * 100)}% sobre ${money.format(ventaConCosto)} con costo cargado${ventaSinCosto > 0 ? ` · ${money.format(ventaSinCosto)} sin costo quedan afuera` : ""}</em>`
        : "<em>Ningún producto vendido tiene el costo cargado</em>"
    ),
    tarjeta("Flete cobrado", money.format(flete)),
    tarjeta("Ticket promedio", money.format(ticket)),
  ].join("");

  // Sin costos cargados el margen que muestra el panel es el precio entero, y
  // eso es peor que no mostrar nada: hay que decirlo en la cara.
  const sinCosto = adminState.products.reduce((sum, product) =>
    sum + product.variants.filter((variant) => variant.cost === null || variant.cost === undefined).length, 0);
  const totalMedidas = adminState.products.reduce((sum, product) => sum + product.variants.length, 0);
  const alerta = $("#dash-cost-alert");
  alerta.hidden = sinCosto === 0;
  if (sinCosto) {
    alerta.innerHTML = `<strong>${sinCosto} de ${totalMedidas} medidas no tienen costo cargado.</strong>
      Hasta cargarlos, el margen y la ganancia que muestra este resumen están inflados: cuentan esos productos como si no costaran nada.
      Se cargan en <em>Productos → Editar → columna Costo</em>.`;
  }

  const porMedio = new Map();
  cobros.forEach((pago) => {
    const clave = pago.medio || "Sin medio";
    const fila = porMedio.get(clave) || { cobros: 0, bruto: 0, neto: 0 };
    fila.cobros += 1;
    fila.bruto += pago.monto;
    fila.neto += pago.neto;
    porMedio.set(clave, fila);
  });
  $("#dash-methods").innerHTML = porMedio.size
    ? [...porMedio.entries()].sort((a, b) => b[1].bruto - a[1].bruto).map(([nombre, fila]) => `<tr>
        <td>${esc(nombre)}</td><td>${fila.cobros}</td>
        <td class="price-cell">${money.format(fila.bruto)}</td>
        <td class="price-cell">${money.format(fila.bruto - fila.neto)}</td>
        <td class="price-cell">${money.format(fila.neto)}</td></tr>`).join("")
    : '<tr><td colspan="5"><small>No hay cobros registrados en este período.</small></td></tr>';

  /* Se ordena por lo vendido, no por la ganancia: con la mitad de los costos
     sin cargar, ordenar por ganancia pondría arriba justo a los productos de
     los que no sabemos nada. La ganancia se muestra donde se conoce y el resto
     queda en blanco, que es la verdad. */
  const porProducto = new Map();
  delPeriodo.forEach((order) => order.items.forEach((item) => {
    const clave = item.code || item.name;
    const fila = porProducto.get(clave) || { nombre: item.name, unidades: 0, vendido: 0, ganancia: 0, sabemos: false };
    fila.unidades += item.cantidad;
    fila.vendido += (item.precio || 0) * item.cantidad;
    if (item.costo > 0) {
      fila.ganancia += ((item.precio || 0) - item.costo) * item.cantidad;
      fila.sabemos = true;
    }
    porProducto.set(clave, fila);
  }));
  $("#dash-top").innerHTML = porProducto.size
    ? [...porProducto.values()].sort((a, b) => b.vendido - a.vendido).slice(0, 5).map((fila) => `<tr>
        <td>${esc(fila.nombre)}</td><td>${fila.unidades}</td>
        <td class="price-cell">${money.format(fila.vendido)}</td>
        <td class="price-cell">${fila.sabemos ? money.format(fila.ganancia) : '<small class="sin-dato">sin costo</small>'}</td></tr>`).join("")
    : '<tr><td colspan="4"><small>No hay ventas en este período.</small></td></tr>';
}

/* ---------- Venta del local ---------- */

/* Una fila de producto: el select de medidas se llena según el producto que se
   elija, y el precio se completa con el de la lista pero queda editable
   porque en el mostrador se regatea. */
function localItemRowHTML() {
  const opciones = adminState.products.map((product) =>
    `<option value="${esc(product.code)}">${esc(product.code)} · ${esc(product.name)}</option>`).join("");
  return `<div class="local-item-row">
    <label class="variant-field"><span>Producto</span>
      <select data-local-product required><option value="">Elegir…</option>${opciones}</select></label>
    <label class="variant-field"><span>Medida</span>
      <select data-local-measure required><option value="">—</option></select></label>
    <label class="variant-field"><span>Cantidad</span>
      <input data-local-qty type="number" min="1" step="1" value="1" required></label>
    <label class="variant-field"><span>Precio unitario</span>
      <input data-local-price type="number" min="0" step="0.01" required></label>
    <button data-remove-local-item type="button" aria-label="Quitar producto">×</button>
  </div>`;
}

function llenarMedidas(row) {
  const product = adminState.products.find((item) => item.code === row.querySelector("[data-local-product]").value);
  const select = row.querySelector("[data-local-measure]");
  select.innerHTML = product
    ? product.variants.map((variant) => `<option value="${esc(variant.measure)}">${esc(variant.measure)}</option>`).join("")
    : '<option value="">—</option>';
  ponerPrecioDeLista(row);
}

function ponerPrecioDeLista(row) {
  const product = adminState.products.find((item) => item.code === row.querySelector("[data-local-product]").value);
  const variant = product?.variants.find((item) => item.measure === row.querySelector("[data-local-measure]").value);
  row.querySelector("[data-local-price]").value = variant ? Store.precioEfectivo(variant) : "";
  actualizarTotalLocal();
}

function actualizarTotalLocal() {
  const form = $("#local-order-form");
  if (!form) return;
  const mercaderia = [...$("#local-item-rows").querySelectorAll(".local-item-row")].reduce((sum, row) =>
    sum + (Number(row.querySelector("[data-local-price]").value) || 0) * (Number(row.querySelector("[data-local-qty]").value) || 0), 0);
  const flete = Number(form.elements.flete.value) || 0;
  const porcentaje = Number(form.elements.fletePorcentaje.value) || 0;
  const total = mercaderia + flete + (mercaderia * porcentaje) / 100;
  $("#local-order-total").innerHTML = `Mercadería ${money.format(mercaderia)}${total !== mercaderia ? ` · Flete ${money.format(total - mercaderia)}` : ""} · Total <strong>${money.format(total)}</strong>`;
}

function openLocalOrderEditor() {
  if (!adminState.products.length) return showToast("Cargá primero al menos un producto");
  const form = $("#local-order-form");
  form.reset();
  $("#local-item-rows").innerHTML = localItemRowHTML();
  actualizarTotalLocal();
  openModal("#local-order-editor");
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
      <td>
        <button class="star ${product.featured ? "on" : ""}" data-featured="${esc(product.code)}" type="button"
          title="${product.featured ? "Quitar de destacados" : "Mostrar en destacados"}"
          aria-pressed="${product.featured}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"/></svg>
        </button>
      </td>
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
  form.elements.featured.checked = product?.featured === true;
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

/* Una sola plantilla para dibujar y para agregar: eran dos copias iguales y
   cada campo nuevo había que sumarlo en los dos lados. */
function variantRowHTML(variant = {}) {
  const valor = (v) => (v === null || v === undefined ? "" : v);
  /* Cada campo va dentro de su etiqueta. En pantalla grande la etiqueta se
     oculta (la cubre el encabezado de columnas) y el input queda como celda
     del grid; en el teléfono las columnas no entran, se apilan y ahí la
     etiqueta es lo único que dice cuál es cuál. */
  return `
    <div class="variant-row">
      <label class="variant-field"><span>Medida</span>
        <input data-variant-measure value="${esc(valor(variant.measure))}" placeholder="ej. 80x200" required></label>
      <label class="variant-field"><span>Costo</span>
        <input data-variant-cost value="${valor(variant.cost)}" type="number" min="0" step="0.01" placeholder="—"></label>
      <label class="variant-field"><span>Precio</span>
        <input data-variant-price value="${valor(variant.price)}" type="number" min="0" step="0.01" required></label>
      <label class="variant-field"><span>Oferta</span>
        <input data-variant-promo value="${valor(variant.promoPrice)}" type="number" min="0" step="0.01" placeholder="—"></label>
      <label class="variant-field"><span>Stock</span>
        <input data-variant-stock value="${valor(variant.stock ?? 0)}" type="number" min="0" step="1"></label>
      <button data-remove-variant type="button" aria-label="Quitar medida">×</button>
    </div>`;
}

function renderVariantRows(variants) {
  $("#variant-rows").innerHTML = variants.map(variantRowHTML).join("");
}

function addVariantRow() {
  $("#variant-rows").insertAdjacentHTML("beforeend", variantRowHTML());
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
    product.hands.join(" / "), product.colors.join(" / "),
    // Vacío, no cero: el que exporta tiene que poder ver de un vistazo a qué
    // medidas les falta el costo.
    variant.cost ?? "", variant.price, variant.promoPrice ?? "", variant.stock ?? 0,
    product.image,
  ]))];
}

function normalizeHeader(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/* La medida que sale de una fila del Excel.

   La distinción que importa: si la planilla NO trae la columna, el campo no se
   define y la capa de datos conserva lo que ya estaba cargado. Si la trae
   vacía, es un null explícito y se vacía. Así, reimportar una planilla vieja
   —sin las columnas de costo, oferta y stock— no borra nada. */
function construirVariante(row, indexes) {
  const opcional = (valor) => (String(valor ?? "").trim() === "" ? null : Number(valor));
  const variante = {
    measure: indexes.measure >= 0 ? row[indexes.measure] : "",
    price: row[indexes.price],
  };
  if (indexes.cost >= 0) variante.cost = opcional(row[indexes.cost]);
  if (indexes.promo >= 0) variante.promoPrice = opcional(row[indexes.promo]);
  if (indexes.stock >= 0) variante.stock = Number(row[indexes.stock]) || 0;
  return variante;
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
    cost: column("costo", "costos", "precio de costo"),
    price: column("precio", "precios", "precio de venta"),
    promo: column("oferta", "promo", "precio promocional", "precio de oferta"),
    stock: column("stock", "existencia", "existencias"),
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
      variants: [construirVariante(row, indexes)],
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

/* ---------- Importar pedidos viejos desde una planilla ----------
   Es para volcar de una vez lo que el negocio tiene acumulado en su Excel.
   Las filas se agrupan por la columna "Pedido": varias filas con el mismo
   número son un pedido con varios productos. Sin esa columna, cada fila es
   un pedido aparte. */
const ordersHeaders = ["Pedido", "Fecha", "Cliente", "Teléfono", "Localidad", "Dirección",
  "Código", "Medida", "Producto", "Cantidad", "Precio", "Flete", "Flete %",
  "Cobrado", "Medio de pago", "Recibo", "Estado", "Notas"];

/* Una fecha de Excel puede venir como texto ("12/03/2026"), como fecha ISO o
   como el número de serie del propio Excel. Las tres terminan en ISO al
   mediodía: a la medianoche, en Argentina, la fecha cae al día anterior. */
function fechaDesdeExcel(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  if (/^\d+(\.\d+)?$/.test(texto) && Number(texto) > 20000) {
    // Serie de Excel: días desde el 30/12/1899.
    const ms = (Number(texto) - 25569) * 86400000;
    return `${new Date(ms).toISOString().slice(0, 10)}T12:00:00`;
  }
  const dmy = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const anio = y.length === 2 ? `20${y}` : y;
    return `${anio}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00`;
  }
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[0]}T12:00:00`;
  return null;
}

function parseOrdersImport(rows) {
  if (!rows.length) throw new Error("El archivo está vacío.");
  const normalizedHeaders = rows[0].map(normalizeHeader);
  const column = (...names) => normalizedHeaders.findIndex((header) => names.includes(header));
  const idx = {
    pedido: column("pedido", "n pedido", "numero", "número", "nro", "venta"),
    fecha: column("fecha"),
    cliente: column("cliente", "nombre"),
    telefono: column("telefono", "teléfono", "celular"),
    localidad: column("localidad", "ciudad"),
    direccion: column("direccion", "dirección", "domicilio"),
    code: column("codigo", "código"),
    measure: column("medida", "medidas"),
    producto: column("producto", "detalle", "descripcion", "descripción"),
    cantidad: column("cantidad", "cant", "unidades"),
    precio: column("precio", "importe", "monto", "precio unitario"),
    flete: column("flete", "envio", "envío"),
    fletePct: column("flete %", "flete porcentaje", "% flete"),
    cobrado: column("cobrado", "pagado", "pago", "sena", "seña", "entrega"),
    medio: column("medio de pago", "medio", "forma de pago"),
    recibo: column("recibo", "n recibo", "comprobante"),
    estado: column("estado", "entrega"),
    notas: column("notas", "observaciones", "observacion", "observación"),
  };
  if (idx.cliente < 0 || idx.producto < 0 || idx.precio < 0) {
    throw new Error("Faltan columnas obligatorias: Cliente, Producto y Precio.");
  }

  const valor = (row, i) => (i >= 0 ? String(row[i] ?? "").trim() : "");
  const numeroDe = (row, i) => {
    if (i < 0) return 0;
    // "$ 115.060,50" y "115060.5" tienen que dar lo mismo.
    const limpio = String(row[i] ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    return Number(limpio) || 0;
  };

  const grupos = new Map();
  rows.slice(1).filter((row) => row.some((value) => String(value ?? "").trim())).forEach((row, i) => {
    const clave = valor(row, idx.pedido) || `fila-${i}`;
    if (!grupos.has(clave)) {
      const estadoCrudo = valor(row, idx.estado);
      const estado = Store.ORDER_STATES.find((e) => normalizeHeader(e) === normalizeHeader(estadoCrudo)) || "Entregado";
      grupos.set(clave, {
        referencia: valor(row, idx.pedido) || `Fila ${i + 2}`,
        lineas: [],
        fecha: fechaDesdeExcel(valor(row, idx.fecha)),
        cliente: valor(row, idx.cliente),
        telefono: valor(row, idx.telefono),
        localidad: valor(row, idx.localidad),
        direccion: valor(row, idx.direccion),
        modo: valor(row, idx.localidad) ? "Envío a domicilio" : "Retiro en el local",
        flete: numeroDe(row, idx.flete),
        fletePorcentaje: numeroDe(row, idx.fletePct),
        cobrado: numeroDe(row, idx.cobrado),
        medio: valor(row, idx.medio),
        recibo: valor(row, idx.recibo),
        estado,
        notas: valor(row, idx.notas),
        items: [],
        errors: [],
      });
    }
    const grupo = grupos.get(clave);
    grupo.lineas.push(i + 2);
    const code = valor(row, idx.code).toUpperCase();
    const measure = valor(row, idx.measure);
    // Si el código y la medida coinciden con el catálogo, el pedido queda
    // vinculado y el costo lo pone la base. Si no, entra como texto libre:
    // más vale un pedido sin costo que uno atado a la medida equivocada.
    const product = code ? adminState.products.find((p) => p.code === code) : null;
    const variant = product?.variants.find((v) => normalizeHeader(v.measure) === normalizeHeader(measure));
    grupo.items.push({
      variantId: variant?.id || null,
      code: product?.code || code,
      name: valor(row, idx.producto) || product?.name || "",
      opciones: measure,
      cantidad: Math.max(1, Math.round(numeroDe(row, idx.cantidad)) || 1),
      precio: numeroDe(row, idx.precio),
    });
  });

  return [...grupos.values()].map((grupo) => {
    const errors = [];
    if (!grupo.cliente) errors.push("Falta el cliente");
    if (grupo.items.some((item) => !item.name)) errors.push("Falta el producto");
    if (grupo.items.some((item) => !(item.precio > 0))) errors.push("Precio inválido");
    const mercaderia = grupo.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const total = mercaderia + grupo.flete + (mercaderia * grupo.fletePorcentaje) / 100;
    if (grupo.cobrado > total + 0.01) errors.push("Lo cobrado supera al total");
    if (grupo.medio && !adminState.paymentMethods.some((m) => normalizeHeader(m.name) === normalizeHeader(grupo.medio))) {
      errors.push(`El medio "${grupo.medio}" no está en la lista`);
    }
    return { ...grupo, mercaderia, total, errors };
  });
}

function showOrdersPreview(items, onConfirm) {
  adminState.preview = { items, onConfirm };
  const validos = items.filter((item) => !item.errors.length);
  const conError = items.length - validos.length;
  const vinculados = validos.reduce((sum, item) => sum + item.items.filter((i) => i.variantId).length, 0);
  const totalItems = validos.reduce((sum, item) => sum + item.items.length, 0);
  $("#preview-title").textContent = "Vista previa de los pedidos a importar";
  $("#preview-summary").innerHTML = `
    <span class="create">${validos.length} pedidos a crear</span>
    <span class="error">${conError} con errores</span>
    <span class="update">${money.format(validos.reduce((sum, item) => sum + item.total, 0))} en total</span>
    <span>${vinculados} de ${totalItems} productos quedan vinculados al catálogo (los demás entran sin costo)</span>`;
  $("#preview-head").innerHTML = "<tr><th>Ref.</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Mercadería</th><th>Flete</th><th>Total</th><th>Cobrado</th><th>Estado</th><th>Observación</th></tr>";
  $("#preview-body").innerHTML = items.map((item) => `<tr class="preview-row-${item.errors.length ? "error" : "create"}">
    <td>${esc(item.referencia)}</td>
    <td><small>${esc(item.fecha ? fechaDia(item.fecha) : "hoy")}</small></td>
    <td>${esc(item.cliente)}</td>
    <td><small>${esc(item.items.map((i) => `${i.cantidad}x ${i.name}${i.opciones ? ` (${i.opciones})` : ""}`).join(" · "))}</small></td>
    <td class="price-cell">${money.format(item.mercaderia)}</td>
    <td class="price-cell">${money.format(item.total - item.mercaderia)}</td>
    <td class="price-cell">${money.format(item.total)}</td>
    <td class="price-cell">${item.cobrado ? `${money.format(item.cobrado)}${item.medio ? `<br><small>${esc(item.medio)}</small>` : ""}` : "—"}</td>
    <td><small>${esc(item.estado)}</small></td>
    <td><small>${esc(item.errors.join(", ") || "Listo para importar")}</small></td></tr>`).join("");
  $("#confirm-preview").disabled = conError > 0 || !validos.length;
  openModal("#preview-modal");
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
  // "+ Nuevo producto" vive arriba de todo, fuera de las pestañas: si queda a
  // la vista en Resumen o en Cobros, es un botón que no hace lo que dice.
  $("#new-product").hidden = button.dataset.tab !== "products";
}));
$("#new-product").addEventListener("click", () => openEditor());
$("#admin-search").addEventListener("input", renderTable);
$("#admin-category").addEventListener("change", renderTable);
$("#product-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  const toggle = event.target.closest("[data-toggle]");
  const remove = event.target.closest("[data-delete]");
  const featured = event.target.closest("[data-featured]");
  if (featured) {
    const product = adminState.products.find((item) => item.code === featured.dataset.featured);
    if (product) {
      product.featured = !product.featured;
      persist();
      showToast(product.featured ? "Agregado a destacados" : "Quitado de destacados");
    }
  }
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
$("#orders-search").addEventListener("input", renderOrders);
$("#orders-only-debt").addEventListener("change", renderOrders);
$("#orders-filter-state").addEventListener("change", renderOrders);
$("#orders-table").addEventListener("click", async (event) => {
  const ver = event.target.closest("[data-order-view]");
  const cobrar = event.target.closest("[data-order-collect]");
  const borrar = event.target.closest("[data-order-delete]");
  if (ver) openOrderDetail(ver.dataset.orderView);
  if (cobrar) openPaymentEditor(cobrar.dataset.orderCollect, true);
  if (borrar) {
    const order = Store.getOrders().find((item) => item.id === borrar.dataset.orderDelete);
    const aviso = order?.cobrado > 0
      ? `\n\nOJO: tiene ${money.format(order.cobrado)} cobrados registrados, que también se borran.`
      : "";
    if (order && confirm(`¿Eliminar el pedido ${order.numero} de ${order.cliente.nombre}? No se puede deshacer.${aviso}`)) {
      await Store.deleteOrder(order.id);
      renderAll();
      showToast("Pedido eliminado");
    }
  }
});
$("#orders-table").addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-state]");
  if (!select) return;
  await Store.updateOrderState(select.dataset.orderState, select.value);
  renderAll();   // el contador de pedidos nuevos vive en las estadísticas
  showToast(`Pedido marcado como ${select.value.toLowerCase()}`);
});

/* ---------- Cobros ---------- */
$("#order-pay-all").addEventListener("click", () => openPaymentEditor(adminState.currentOrderId, true));
$("#order-add-payment").addEventListener("click", () => openPaymentEditor(adminState.currentOrderId, false));
$("#payment-form").addEventListener("input", actualizarNetoDelPago);
$("#payment-form").addEventListener("change", actualizarNetoDelPago);
$("#payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const order = currentOrder();
  if (!order) return;
  const data = Object.fromEntries(new FormData(event.target));
  const monto = Number(data.monto);
  if (!(monto > 0)) return showToast("El monto tiene que ser mayor que cero");
  if (monto > order.saldo + 0.01
      && !confirm(`El monto (${money.format(monto)}) es mayor que el saldo (${money.format(order.saldo)}). ¿Registrarlo igual?`)) return;
  const ok = await Store.addPayment(order.id, {
    methodId: data.methodId, monto, fecha: data.fecha || hoyISO(), notas: data.notas,
  });
  if (!ok) return showToast("No se pudo registrar el cobro");
  closeModals();
  openOrderDetail(order.id);   // se reabre con el saldo ya actualizado
  renderAll();
  showToast("Cobro registrado");
});
$("#order-detail-body").addEventListener("click", async (event) => {
  const borrar = event.target.closest("[data-payment-delete]");
  if (!borrar) return;
  if (!confirm("¿Borrar este cobro? El saldo del pedido vuelve a subir.")) return;
  const id = adminState.currentOrderId;
  if (!(await Store.deletePayment(borrar.dataset.paymentDelete))) return showToast("No se pudo borrar el cobro");
  openOrderDetail(id);
  renderAll();
  showToast("Cobro borrado");
});
$("#order-detail-body").addEventListener("submit", async (event) => {
  if (event.target.id !== "order-shipping-form") return;
  event.preventDefault();
  const id = adminState.currentOrderId;
  const data = Object.fromEntries(new FormData(event.target));
  const ok = await Store.updateOrder(id, {
    flete: data.flete === "" ? 0 : data.flete,
    fletePorcentaje: data.fletePorcentaje === "" ? 0 : data.fletePorcentaje,
  });
  if (!ok) return showToast("No se pudo guardar el flete");
  openOrderDetail(id);
  renderAll();
  showToast("Flete guardado");
});

/* ---------- Medios de pago ---------- */
$("#payment-methods-table").addEventListener("input", (event) => {
  const campo = event.target.closest("[data-index]");
  if (!campo) return;
  const method = adminState.paymentMethods[Number(campo.dataset.index)];
  if (!method) return;
  if (campo.hasAttribute("data-method-name")) method.name = campo.value;
  if (campo.hasAttribute("data-method-commission")) {
    method.commission = Number(campo.value) || 0;
    renderPaymentMethods();   // se recalcula "de cada $100.000 te quedan"
  }
});
$("#payment-methods-table").addEventListener("change", (event) => {
  const campo = event.target.closest("[data-method-active]");
  if (!campo) return;
  const method = adminState.paymentMethods[Number(campo.dataset.index)];
  if (method) method.active = campo.checked;
});
$("#new-payment-method").addEventListener("click", () => {
  adminState.paymentMethods.push({ name: "", commission: 0, active: true });
  renderPaymentMethods();
});
$("#save-payment-methods").addEventListener("click", async () => {
  const vacios = adminState.paymentMethods.filter((method) => !String(method.name).trim());
  if (vacios.length) return showToast("Hay un medio de pago sin nombre");
  const nombres = adminState.paymentMethods.map((method) => normalizeHeader(method.name));
  if (new Set(nombres).size !== nombres.length) return showToast("Hay dos medios de pago con el mismo nombre");
  if (!(await Store.savePaymentMethods(adminState.paymentMethods))) return showToast("No se pudieron guardar los medios de pago");
  adminState.paymentMethods = Store.getPaymentMethods();
  renderPaymentMethods();
  showToast("Medios de pago guardados");
});

/* ---------- Resumen ---------- */
$("#dash-period").addEventListener("change", renderDashboard);

/* ---------- Venta del local ---------- */
$("#new-local-order").addEventListener("click", openLocalOrderEditor);
$("#add-local-item").addEventListener("click", () => {
  $("#local-item-rows").insertAdjacentHTML("beforeend", localItemRowHTML());
});
$("#local-item-rows").addEventListener("change", (event) => {
  const row = event.target.closest(".local-item-row");
  if (!row) return;
  if (event.target.matches("[data-local-product]")) llenarMedidas(row);
  if (event.target.matches("[data-local-measure]")) ponerPrecioDeLista(row);
});
$("#local-item-rows").addEventListener("input", actualizarTotalLocal);
$("#local-order-form").addEventListener("input", (event) => {
  if (event.target.name === "flete" || event.target.name === "fletePorcentaje") actualizarTotalLocal();
});
$("#local-item-rows").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-local-item]");
  if (!remove) return;
  if ($("#local-item-rows").children.length === 1) return showToast("La venta necesita al menos un producto");
  remove.closest(".local-item-row").remove();
  actualizarTotalLocal();
});
$("#local-order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const items = [...$("#local-item-rows").querySelectorAll(".local-item-row")].map((row) => {
    const code = row.querySelector("[data-local-product]").value;
    const measure = row.querySelector("[data-local-measure]").value;
    const product = adminState.products.find((item) => item.code === code);
    const variant = product?.variants.find((item) => item.measure === measure);
    return {
      variantId: variant?.id || null,
      code, name: product?.name || "", opciones: measure,
      cantidad: Number(row.querySelector("[data-local-qty]").value) || 1,
      precio: Number(row.querySelector("[data-local-price]").value),
    };
  });
  if (items.some((item) => !item.variantId)) return showToast("Elegí el producto y la medida de cada fila");
  if (items.some((item) => !(item.precio >= 0))) return showToast("Revisá los precios: tienen que ser un número");

  const boton = event.target.querySelector('button[type="submit"]');
  boton.disabled = true;
  const resultado = await Store.addLocalOrder({
    cliente: { nombre: data.nombre, telefono: data.telefono, modo: data.modo, localidad: data.localidad, direccion: data.direccion },
    items, notas: data.notas, flete: data.flete, fletePorcentaje: data.fletePorcentaje, estado: data.estado,
  });
  boton.disabled = false;
  if (!resultado) return showToast("No se pudo guardar la venta");
  closeModals();
  renderAll();
  showToast(`Venta ${resultado.numero} guardada`);
  // El caso normal del mostrador es que además cobre en el momento.
  const guardado = Store.getOrders().find((order) => order.number === resultado.number);
  if (guardado && conSaldo(guardado)) openPaymentEditor(guardado.id, true);
});

$("#order-whatsapp").addEventListener("click", () => {
  const order = currentOrder();
  if (!order) return;
  const telefono = String(order.cliente.telefono).replace(/\D/g, "");
  if (!telefono) return showToast("El pedido no tiene un teléfono válido");
  const numero = telefono.startsWith("54") ? telefono : `54${telefono}`;
  const texto = `Hola ${order.cliente.nombre}, te escribimos por tu pedido ${order.numero}.`;
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
});
$("#export-orders").addEventListener("click", () => {
  if (!Store.getOrders().length) return showToast("Todavía no hay pedidos para exportar");
  XlsxUtils.download("pedidos.xlsx", ordersToRows());
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
  // Campo vacío = null (sin cargar), no cero: "no sé el costo" y "me sale
  // cero" son cosas distintas y el panel tiene que poder distinguirlas.
  const opcional = (valor) => (String(valor).trim() === "" ? null : Number(valor));
  const variants = [...$("#variant-rows").querySelectorAll(".variant-row")].map((row) => ({
    measure: row.querySelector("[data-variant-measure]").value.trim(),
    cost: opcional(row.querySelector("[data-variant-cost]").value),
    price: Number(row.querySelector("[data-variant-price]").value),
    promoPrice: opcional(row.querySelector("[data-variant-promo]").value),
    stock: Number(row.querySelector("[data-variant-stock]").value) || 0,
  })).filter((variant) => variant.measure);
  if (!variants.length || variants.some((variant) => !Number.isFinite(variant.price) || variant.price < 0)) return showToast("Completá correctamente las medidas y sus precios");
  const ofertaInvalida = variants.find((v) => v.promoPrice !== null && v.promoPrice >= v.price);
  if (ofertaInvalida) return showToast(`La oferta de ${ofertaInvalida.measure} tiene que ser menor que el precio`);
  const product = Store.normalizeProduct({
    ...data,
    variants,
    images: data.image ? [data.image] : adminState.editingImages,
    active: event.target.elements.active.checked,
    featured: event.target.elements.featured.checked,
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
/* Las filas de ejemplo siguen el orden de `headers`. Al sumarse las columnas
   de costo, oferta y stock quedaron cortas y el precio caía en la columna de
   costo: la plantilla que bajaba el negocio venía mal armada. */
$("#download-template").addEventListener("click", () => XlsxUtils.download("plantilla-productos-tienda.xlsx", [
  headers,
  ["PAL-36-C", "Puerta Aluminio", "Puerta Aluminio 36 mm Ciega", "Puerta exterior de aluminio", "70x200", "Derecha / Izquierda", "Blanco / Negro", "", 335000, "", 0, ""],
  ["PAL-36-C", "Puerta Aluminio", "Puerta Aluminio 36 mm Ciega", "Puerta exterior de aluminio", "80x200", "Derecha / Izquierda", "Blanco / Negro", "", 365000, "", 0, ""],
  ["PAL-36-C", "Puerta Aluminio", "Puerta Aluminio 36 mm Ciega", "Puerta exterior de aluminio", "90x200", "Derecha / Izquierda", "Blanco / Negro", "", 405000, "", 0, ""],
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
$("#confirm-preview").addEventListener("click", async () => {
  if (!adminState.preview || $("#confirm-preview").disabled) return;
  const boton = $("#confirm-preview");
  boton.disabled = true;
  // Importar pedidos hace una escritura por pedido: puede tardar y hay que
  // esperarla antes de cerrar, o el panel se refresca a mitad de camino.
  const mensaje = await adminState.preview.onConfirm();
  boton.disabled = false;
  closeModals();
  showToast(mensaje || "Cambios guardados correctamente");
});

/* ---------- Importar pedidos ---------- */
$("#download-orders-template").addEventListener("click", () => XlsxUtils.download("plantilla-pedidos.xlsx", [
  ordersHeaders,
  ["1", "12/03/2026", "Juan Pérez", "3454000000", "Concordia", "Belgrano 450", "AI", "60X35", "Aireador con reja", 2, 52300, "", 10, 60000, "Efectivo", "Recibo 0034", "Entregado", ""],
  ["1", "12/03/2026", "Juan Pérez", "3454000000", "Concordia", "Belgrano 450", "", "", "Ventana a medida 1,20 x 1,10", 1, 180000, "", 10, "", "", "", "Entregado", "Fabricación a medida"],
  ["2", "15/03/2026", "María Gómez", "3454111111", "Federación", "", "", "", "Puerta de chapa simple", 1, 240000, 15000, "", 240000, "Transferencia", "", "Entregado", ""],
]));
$("#preview-orders-import").addEventListener("click", async () => {
  const file = $("#orders-excel-file").files[0];
  if (!file) return showToast("Seleccioná un archivo Excel");
  try {
    const items = parseOrdersImport(await XlsxUtils.read(file));
    if (!items.length) return showToast("La planilla no tiene filas para importar");
    showOrdersPreview(items, async () => {
      const validos = items.filter((item) => !item.errors.length);
      const numeros = await Store.importOrders(validos);
      $("#orders-excel-file").value = "";
      renderAll();
      return `${numeros.length} de ${validos.length} pedidos importados`;
    });
  } catch (error) {
    showToast(error.message || "No se pudo leer el Excel");
  }
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
  showToast("Textos guardados. Recargá la tienda para verlos.");
});

$("#reset-content").addEventListener("click", () => {
  if (!confirm("¿Restaurar todos los textos originales? Se pierden los cambios que hayas hecho.")) return;
  Store.saveCommerceContent(Store.defaultCommerceContent);
  adminState.commerceContent = Store.getCommerceContent();
  cargarTextosEnFormulario();
  showToast("Textos restaurados");
});

/* ---------- Preguntas frecuentes ----------
   Se editan por grupo: el grupo trae su título, su ícono y la lista de
   preguntas. Los íconos disponibles son los que dibuja app.js. */
const faqIconLabels = { producto: "Producto", envio: "Envío", pago: "Pago", medida: "Medida" };

function renderFaqGroups() {
  const groups = adminState.faqs;
  const preguntas = groups.reduce((sum, group) => sum + group.items.length, 0);
  $("#faq-count").textContent = `${groups.length} grupo${groups.length === 1 ? "" : "s"} · ${preguntas} pregunta${preguntas === 1 ? "" : "s"}`;
  $("#faq-empty").hidden = groups.length > 0;
  $("#faq-table").innerHTML = groups.map((group) => `
    <tr>
      <td><strong>${esc(group.title)}</strong></td>
      <td><small>${esc(faqIconLabels[group.icon] || faqIconLabels.producto)}</small></td>
      <td><ul class="faq-preview">${group.items.map((item) => `<li>${esc(item.q)}</li>`).join("")}</ul></td>
      <td><div class="table-actions"><button data-edit-faq="${esc(group.id)}" type="button">Editar</button><button class="delete" data-delete-faq="${esc(group.id)}" type="button">Eliminar</button></div></td>
    </tr>`).join("");
}

function faqItemRow(item = { q: "", a: "" }) {
  return `<div class="faq-item-row">
    <div class="faq-item-fields">
      <input data-faq-question value="${esc(item.q)}" placeholder="¿Realizan envíos?" required>
      <textarea data-faq-answer rows="2" placeholder="La respuesta que ve el visitante" required>${esc(item.a)}</textarea>
    </div>
    <button data-remove-faq-item type="button" aria-label="Quitar pregunta">×</button>
  </div>`;
}

function openFaqEditor(id = "") {
  const group = adminState.faqs.find((item) => item.id === id);
  const form = $("#faq-form");
  form.reset();
  $("#faq-editor-title").textContent = group ? "Editar grupo" : "Nuevo grupo";
  form.elements.originalId.value = group?.id || "";
  form.elements.title.value = group?.title || "";
  form.elements.icon.value = group?.icon || "producto";
  $("#faq-item-rows").innerHTML = (group?.items.length ? group.items : [{ q: "", a: "" }]).map(faqItemRow).join("");
  openModal("#faq-editor");
}

function saveFaqGroups() {
  Store.saveFaqs(adminState.faqs);
  adminState.faqs = Store.getFaqs();   // se relee normalizado, como hace el catálogo
  renderFaqGroups();
}

$("#new-faq-group").addEventListener("click", () => openFaqEditor());
$("#add-faq-item").addEventListener("click", () => $("#faq-item-rows").insertAdjacentHTML("beforeend", faqItemRow()));
$("#faq-item-rows").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-faq-item]");
  if (!remove) return;
  if ($("#faq-item-rows").children.length === 1) return showToast("El grupo debe tener al menos una pregunta");
  remove.closest(".faq-item-row").remove();
});
$("#faq-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-faq]");
  const remove = event.target.closest("[data-delete-faq]");
  if (edit) openFaqEditor(edit.dataset.editFaq);
  if (remove) {
    const group = adminState.faqs.find((item) => item.id === remove.dataset.deleteFaq);
    if (group && confirm(`¿Eliminar el grupo "${group.title}" y sus ${group.items.length} preguntas?`)) {
      adminState.faqs = adminState.faqs.filter((item) => item.id !== group.id);
      saveFaqGroups();
      showToast("Grupo eliminado");
    }
  }
});
$("#faq-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const items = [...$("#faq-item-rows").querySelectorAll(".faq-item-row")].map((row) => ({
    q: row.querySelector("[data-faq-question]").value,
    a: row.querySelector("[data-faq-answer]").value,
  }));
  const id = data.originalId || `faq-${Date.now()}`;
  const index = adminState.faqs.findIndex((item) => item.id === id);
  const group = { id, icon: data.icon, title: data.title, items };
  if (index >= 0) adminState.faqs[index] = group;
  else adminState.faqs.push(group);
  saveFaqGroups();
  closeModals();
  showToast("Grupo guardado. Recargá la tienda para verlo.");
});
$("#reset-faqs").addEventListener("click", () => {
  if (!confirm("¿Restaurar las preguntas originales? Se pierden los cambios que hayas hecho.")) return;
  const originales = Store.getFactoryDefaults("faqs");
  if (!originales) return showToast("No se pudieron leer las preguntas originales");
  adminState.faqs = originales;
  saveFaqGroups();
  showToast("Preguntas restauradas");
});

/* ---------- Reseñas ---------- */
const estrellas = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

function renderReviews() {
  const reviews = adminState.reviews;
  const publicadas = reviews.filter((review) => review.published).length;
  $("#reviews-count").textContent = `${publicadas} publicada${publicadas === 1 ? "" : "s"} de ${reviews.length}`;
  $("#reviews-empty").hidden = reviews.length > 0;
  $("#reviews-table").innerHTML = reviews.map((review) => `
    <tr>
      <td><strong>${esc(review.name)}</strong>${review.date ? `<br><small>${esc(review.date)}</small>` : ""}</td>
      <td><span class="review-stars" title="${review.rating} de 5">${estrellas(review.rating)}</span></td>
      <td><small class="review-text">${esc(review.text)}</small></td>
      <td><small>${esc(review.source)}</small></td>
      <td><span class="status ${review.published ? "active" : "inactive"}">${review.published ? "Publicada" : "Oculta"}</span></td>
      <td><div class="table-actions">
        <button data-edit-review="${esc(review.id)}" type="button">Editar</button>
        <button data-toggle-review="${esc(review.id)}" type="button">${review.published ? "Ocultar" : "Publicar"}</button>
        <button class="delete" data-delete-review="${esc(review.id)}" type="button">Eliminar</button>
      </div></td>
    </tr>`).join("");
}

function openReviewEditor(id = "") {
  const review = adminState.reviews.find((item) => item.id === id);
  const form = $("#review-form");
  form.reset();
  $("#review-editor-title").textContent = review ? "Editar reseña" : "Nueva reseña";
  form.elements.originalId.value = review?.id || "";
  form.elements.name.value = review?.name || "";
  form.elements.rating.value = String(review?.rating || 5);
  form.elements.text.value = review?.text || "";
  form.elements.source.value = review?.source || "Google";
  form.elements.date.value = review?.date || "";
  form.elements.published.checked = review?.published !== false;
  openModal("#review-editor");
}

function saveReviews() {
  Store.saveReviews(adminState.reviews);
  adminState.reviews = Store.getReviews();
  renderReviews();
}

$("#new-review").addEventListener("click", () => openReviewEditor());
$("#reviews-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-review]");
  const toggle = event.target.closest("[data-toggle-review]");
  const remove = event.target.closest("[data-delete-review]");
  if (edit) openReviewEditor(edit.dataset.editReview);
  if (toggle) {
    const review = adminState.reviews.find((item) => item.id === toggle.dataset.toggleReview);
    if (review) {
      review.published = !review.published;
      saveReviews();
      showToast(review.published ? "Reseña publicada" : "Reseña oculta");
    }
  }
  if (remove) {
    const review = adminState.reviews.find((item) => item.id === remove.dataset.deleteReview);
    if (review && confirm(`¿Eliminar la reseña de ${review.name}? No se puede deshacer.`)) {
      adminState.reviews = adminState.reviews.filter((item) => item.id !== review.id);
      saveReviews();
      showToast("Reseña eliminada");
    }
  }
});
$("#review-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const id = data.originalId || `res-${Date.now()}`;
  const index = adminState.reviews.findIndex((item) => item.id === id);
  const review = { ...data, id, published: event.target.elements.published.checked };
  if (index >= 0) adminState.reviews[index] = review;
  else adminState.reviews.push(review);
  saveReviews();
  closeModals();
  showToast("Reseña guardada. Recargá la tienda para verla.");
});
$("#reset-reviews").addEventListener("click", () => {
  if (!confirm("¿Restaurar las reseñas originales? Se pierden los cambios que hayas hecho.")) return;
  const originales = Store.getFactoryDefaults("reviews");
  if (!originales) return showToast("No se pudieron leer las reseñas originales");
  adminState.reviews = originales;
  saveReviews();
  showToast("Reseñas restauradas");
});

/* ---------- Copia de seguridad ---------- */
$("#export-backup").addEventListener("click", () => {
  const datos = Store.exportBackup();
  const fecha = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
  const enlace = Object.assign(document.createElement("a"), { href: url, download: `copia-tienda-${fecha}.json` });
  enlace.click();
  URL.revokeObjectURL(url);
  showToast("Copia descargada");
});

$("#reset-products").addEventListener("click", async () => {
  // Ojo: ya no toca una copia local. Pisa el catálogo que ve todo el mundo,
  // con los precios y los costos que estén cargados.
  if (!confirm("¿Restaurar el catálogo de ejemplo?\n\nSe borran TODOS los productos cargados, con sus precios, costos y stock, y vuelven los 9 de ejemplo. Esto afecta a la tienda publicada y no se puede deshacer.")) return;
  await Store.resetProducts();
  adminState.products = Store.getProducts();
  renderAll();
  showToast("Catálogo de ejemplo restaurado");
});

$("#import-backup").addEventListener("click", () => {
  const archivo = $("#backup-file").files[0];
  if (!archivo) return showToast("Elegí primero el archivo de copia");
  const lector = new FileReader();
  lector.onload = () => {
    let datos;
    try {
      datos = JSON.parse(lector.result);
    } catch {
      return showToast("El archivo no es un JSON válido");
    }
    const fecha = datos.fecha ? new Date(datos.fecha).toLocaleString("es-AR") : "sin fecha";
    if (!confirm(`Se va a reemplazar el contenido actual por la copia del ${fecha}. ¿Continuar?`)) return;
    try {
      const r = Store.importBackup(datos);
      adminState.products = Store.getProducts();
      adminState.deliveryZones = Store.getDeliveryZones();
      adminState.commerceContent = Store.getCommerceContent();
      adminState.faqs = Store.getFaqs();
      adminState.reviews = Store.getReviews();
      cargarTextosEnFormulario();
      cargarConfiguracionEnFormulario();
      renderAll();
      $("#backup-file").value = "";
      showToast(`Restaurado: ${r.productos} productos y ${r.zonas} localidades`);
    } catch (error) {
      showToast(error.message || "No se pudo restaurar la copia");
    }
  };
  lector.readAsText(archivo);
});

function cargarTextosEnFormulario() {
  const form = $("#commerce-content-form");
  Object.entries(adminState.commerceContent).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

function cargarConfiguracionEnFormulario() {
  const form = $("#settings-form");
  Object.entries(Store.getSettings()).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

/* ---------- Ingreso al panel ----------
   El panel arranca oculto y solo se muestra con una sesión que además esté en
   la lista de administradores. Estar logueado no alcanza: la base tampoco le
   entrega un solo pedido ni un solo costo a quien no esté en esa lista. */
function mostrarPanel(visible) {
  $("#login-screen").hidden = visible;
  document.querySelector(".admin-header").hidden = !visible;
  document.querySelector(".admin-shell").hidden = !visible;
}

function arrancarPanel() {
  adminState.products = Store.getProducts();
  adminState.deliveryZones = Store.getDeliveryZones();
  adminState.commerceContent = Store.getCommerceContent();
  adminState.faqs = Store.getFaqs();
  adminState.reviews = Store.getReviews();
  adminState.paymentMethods = Store.getPaymentMethods().map((method) => ({ ...method }));
  mostrarPanel(true);
  $("#new-product").hidden = true;   // el panel abre en Resumen
  fillCategorySelects();
  $("#orders-filter-state").insertAdjacentHTML("beforeend",
    Store.ORDER_STATES.map((estado) => `<option value="${esc(estado)}">${esc(estado)}</option>`).join(""));
  cargarConfiguracionEnFormulario();
  cargarTextosEnFormulario();
  renderAll();
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const boton = $("#login-submit");
  const error = $("#login-error");
  const datos = new FormData(event.target);
  error.hidden = true;
  boton.disabled = true;
  boton.textContent = "Entrando…";
  const resultado = await Store.signIn(datos.get("email").trim(), datos.get("password"));
  boton.disabled = false;
  boton.textContent = "Entrar";
  if (!resultado.ok) {
    error.textContent = resultado.mensaje;
    error.hidden = false;
    return;
  }
  event.target.reset();
  arrancarPanel();
});

$("#logout").addEventListener("click", async () => {
  await Store.signOut();
  mostrarPanel(false);
});

Store.init().then(({ esAdmin }) => {
  if (esAdmin) arrancarPanel();
  else mostrarPanel(false);
});
