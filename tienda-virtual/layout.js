/* ============================================================
   Header, footer y capas flotantes (ficha, carrito, WhatsApp).
   Se inyectan desde acá para que las nueve páginas compartan una
   única fuente: editar el menú o el pie se hace en un solo lugar.
   Corre antes que app.js —ambos con defer, en ese orden—, así que
   cuando app.js busca sus nodos ya están en el documento.
   ============================================================ */
(function () {
  const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  // Iconos de línea, 24x24, trazo uniforme, para acompañar el isotipo del logo.
  window.svgIcon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true">${paths}</svg>`;
  const svg = window.svgIcon;

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

  window.ICON_WA = '<svg class="icon-wa" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2.02c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22.06l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01a9.86 9.86 0 0 0-7.01-2.94z"/><path fill="var(--wa-ink, #fff)" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>';
  const ICON_WA = window.ICON_WA;

  // Las páginas del menú. `page` coincide con el data-page del <body>.
  const NAV = [
    { page: "home", href: "index.html", label: "Inicio" },
    { page: "productos", href: "productos.html", label: "Productos" },
    { page: "faq", href: "preguntas-frecuentes.html", label: "Preguntas frecuentes" },
    { page: "resenas", href: "resenas.html", label: "Reseñas" },
    { page: "contacto", href: "contacto.html", label: "Contacto" },
  ];

  const current = document.body.dataset.page || "";

  function navItems() {
    return NAV.map((item) => `
      <a class="nav-page ${current === item.page ? "active" : ""}" href="${item.href}"${current === item.page ? ' aria-current="page"' : ""}>${esc(item.label)}</a>
    `).join("");
  }

  // Las categorías dejaron de ocupar la barra: viven en este desplegable y
  // cada una abre el catálogo ya filtrado.
  function categoryMenu() {
    return Store.categories.map((category) => `
      <a href="productos.html?categoria=${encodeURIComponent(category)}">
        <b>${categoryIcons[category] || fallbackIcon}</b><span>${esc(category)}</span>
      </a>
    `).join("");
  }

  const header = `
  <div class="topbar">
    <span data-content="topbar">Fabricación propia · Envíos a Entre Ríos y Corrientes</span>
  </div>

  <header class="site-header">
    <div class="head-main">
      <a class="brand" href="index.html" aria-label="Aberturas Aluminio Concordia">
        <img class="brand-logo" src="assets/logo-color.png" alt="Aberturas Aluminio Concordia">
      </a>

      <form class="head-search" id="head-search-form" role="search">
        <input id="head-search" type="search" placeholder="Buscar ventanas, puertas, rejas..." autocomplete="off" aria-label="Buscar productos">
        <button type="submit" aria-label="Buscar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
        </button>
      </form>

      <div class="head-actions">
        <button class="head-wa" data-general-whatsapp type="button">
          ${ICON_WA}
          <span>WhatsApp</span>
        </button>
        <button class="cart-button" id="open-cart" type="button" aria-label="Ver carrito">
          <svg class="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H7a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M9 10V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V10"/></svg>
          <b id="cart-count">0</b>
        </button>
      </div>
    </div>

    <div class="head-nav-bar">
      <div class="nav-cats">
        <button class="nav-all" id="nav-all" type="button" aria-expanded="false" aria-controls="nav-cats-panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span>Categorías</span>
          <svg class="nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nav-cats-panel" id="nav-cats-panel" hidden>${categoryMenu()}</div>
      </div>
      <button class="nav-arrow" id="nav-prev" type="button" aria-label="Ver páginas anteriores">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 5 8 12 15 19"/></svg>
      </button>
      <nav class="head-nav" id="page-strip" aria-label="Secciones">${navItems()}</nav>
      <button class="nav-arrow" id="nav-next" type="button" aria-label="Ver más páginas">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 5 16 12 9 19"/></svg>
      </button>
    </div>
  </header>`;

  const footer = `
  <footer class="site-footer">
    <div class="footer-cols">
      <div class="footer-col footer-brand">
        <img class="footer-logo" src="assets/logo-blanco.png" alt="Aberturas Aluminio Concordia">
        <p data-content="footerAbout">Fabricación de aberturas de aluminio y herrería en Concordia, Entre Ríos.</p>
      </div>
      <div class="footer-col">
        <h3 data-content="footerCol1Title">Tienda online</h3>
        <ul>
          <li><a href="productos.html" data-content="footerLink1">Catálogo completo</a></li>
          <li><a href="productos.html?categoria=Ventanas%20de%20aluminio" data-content="footerLink2">Ventanas</a></li>
          <li><a href="productos.html?categoria=Puertas%20de%20aluminio" data-content="footerLink3">Puertas</a></li>
          <li><a href="productos.html?categoria=Rejas" data-content="footerLink4">Rejas y portones</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3 data-content="footerCol2Title">Información</h3>
        <ul>
          <li><a href="index.html#como-comprar" data-content="footerLink5">Cómo comprar</a></li>
          <li><a href="index.html#zonas-de-entrega" data-content="footerLink6">Zonas de entrega</a></li>
          <li><a href="medios-de-pago.html" data-content="footerLink7">Medios de pago</a></li>
          <li><a href="preguntas-frecuentes.html" data-content="footerLink8">Preguntas frecuentes</a></li>
          <li><a href="resenas.html" data-content="footerLink9">Reseñas</a></li>
          <li><a href="contacto.html" data-content="footerLink10">Contacto</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3 data-content="footerCol3Title">Contactanos</h3>
        <ul class="footer-contact">
          <li data-store-address>Humberto Primero 1166</li>
          <li data-store-phone>+54 9 345 493 8829</li>
          <li><a data-store-email href="#">aberturasaluminioconcordia@gmail.com</a></li>
          <li data-content="footerHours">Lunes a viernes · Sábados por la mañana</li>
        </ul>
        <div class="social-links">
          <a href="https://www.instagram.com/aberturasaluminioconcordia/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>
          </a>
          <a href="https://www.facebook.com/AberturasAluminioConcordia2020/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <nav class="footer-policies" aria-label="Información legal">
      <a href="terminos-y-condiciones.html">Términos y condiciones</a>
      <a href="politica-de-privacidad.html">Política de privacidad</a>
      <a href="politica-de-devoluciones.html">Política de devoluciones</a>
    </nav>
    <div class="footer-legal">
      <span>© <span id="year"></span> Aberturas Aluminio Concordia</span>
      <span data-content="footerRegion">Concordia, Entre Ríos · Argentina</span>
      <span class="footer-credit" data-content="footerCredit">Creado por Sistemas Umbral</span>
    </div>
  </footer>`;

  const overlays = `
  <div class="modal-backdrop" id="product-backdrop" hidden></div>
  <section class="product-modal" id="product-modal" aria-hidden="true" role="dialog" aria-modal="true">
    <button class="modal-close" data-close-product type="button" aria-label="Cerrar">×</button>
    <div id="product-detail"></div>
  </section>

  <div class="drawer-backdrop" id="drawer-backdrop" hidden></div>
  <aside class="cart-drawer" id="cart-drawer" aria-hidden="true">
    <div class="drawer-header">
      <button class="drawer-back" id="cart-back" type="button" hidden aria-label="Volver al carrito">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 5 8 12 15 19"/></svg>
      </button>
      <h2 id="drawer-title" data-content="cartTitle">Carrito de compras</h2>
      <button class="modal-close" id="close-cart" type="button" aria-label="Cerrar">×</button>
    </div>

    <div class="cart-step" id="step-cart">
      <div class="cart-items" id="cart-items"></div>

      <div class="cart-empty" id="cart-empty">
        <strong data-content="cartEmptyTitle">Tu carrito está vacío</strong>
        <p data-content="cartEmptyText">Agregá productos para preparar tu pedido.</p>
        <button class="button button-outline full" id="continue-shopping" type="button" data-content="cartContinue">Seguir comprando</button>
      </div>

      <div class="cart-summary" id="cart-summary" hidden>
        <div class="cart-line">
          <span data-content="cartSubtotal">Subtotal (sin envío)</span>
          <strong id="cart-total">$ 0</strong>
        </div>

        <div class="cart-shipping">
          <p class="cart-shipping-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="1" y="6" width="13" height="10"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>
            <span data-content="cartShippingLabel">Zona de entrega</span>
          </p>
          <form class="cart-shipping-form" id="cart-shipping-form">
            <input id="cart-postal" type="search" placeholder="Tu código postal o localidad" autocomplete="off" aria-label="Código postal o localidad">
            <button type="submit" data-content="cartShippingButton">Calcular</button>
          </form>
          <div class="cart-shipping-result" id="cart-shipping-result">
            <span data-content="cartShippingEmpty">Calculalo para verlo</span>
          </div>
        </div>

        <div class="cart-line cart-total-line">
          <span data-content="cartTotalLabel">Total</span>
          <strong id="cart-grand-total">$ 0</strong>
        </div>

        <button class="button button-whatsapp full" id="go-checkout" type="button">
          ${ICON_WA}
          <span data-content="cartBuy">Iniciar compra por WhatsApp</span>
        </button>
        <button class="clear-cart" id="clear-cart" type="button" data-content="cartClear">Vaciar carrito</button>
      </div>
    </div>

    <form class="cart-step" id="step-datos" hidden>
      <p class="checkout-intro" data-content="checkoutIntro">Completá tus datos y se arma el pedido en WhatsApp. El negocio solo tiene que confirmarlo.</p>

      <div class="checkout-resumen" id="checkout-resumen"></div>

      <label>Nombre y apellido
        <input name="nombre" type="text" required autocomplete="name" placeholder="Ej. Juan Pérez">
      </label>

      <label>Teléfono
        <input name="telefono" type="tel" required autocomplete="tel" placeholder="Ej. 345 400 0000">
      </label>

      <fieldset class="checkout-modo">
        <legend data-content="checkoutModoLabel">¿Cómo lo recibís?</legend>
        <label class="radio"><input name="modo" type="radio" value="envio" checked> Envío a domicilio</label>
        <label class="radio"><input name="modo" type="radio" value="retiro"> Retiro en el local</label>
      </fieldset>

      <div id="campos-envio">
        <label>Localidad
          <input name="localidad" type="text" autocomplete="address-level2" placeholder="Ej. Concordia">
        </label>
        <label>Dirección de entrega
          <input name="direccion" type="text" autocomplete="street-address" placeholder="Calle, número, piso o depto">
        </label>
      </div>

      <label>Comentarios <small>(opcional)</small>
        <textarea name="comentarios" rows="2" placeholder="Referencias, horarios, lo que necesites aclarar"></textarea>
      </label>

      <p class="validation-message" id="checkout-error" hidden></p>

      <button class="button button-whatsapp full" id="buy-cart" type="submit">
        ${ICON_WA}
        <span data-content="checkoutSend">Enviar pedido por WhatsApp</span>
      </button>
      <button class="clear-cart" id="back-to-cart" type="button" data-content="checkoutBack">Volver al carrito</button>
    </form>
  </aside>

  <button class="wa-float" data-general-whatsapp type="button" aria-label="Consultar por WhatsApp">${ICON_WA}</button>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer + overlays);

  /* Desplegable de categorías: se cierra al elegir, al hacer clic afuera y
     con Escape. */
  const catsButton = document.getElementById("nav-all");
  const catsPanel = document.getElementById("nav-cats-panel");

  function toggleCategories(open) {
    catsPanel.hidden = !open;
    catsButton.setAttribute("aria-expanded", String(open));
    catsButton.classList.toggle("open", open);
  }

  catsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCategories(catsPanel.hidden);
  });
  document.addEventListener("click", (event) => {
    if (!catsPanel.hidden && !event.target.closest(".nav-cats")) toggleCategories(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleCategories(false);
  });
})();
