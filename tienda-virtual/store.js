(function () {
  const PRODUCT_KEY = "aac-store-products-v2";
  const SETTINGS_KEY = "aac-store-settings-v2";
  const CART_KEY = "aac-store-cart-v2";
  const DELIVERY_KEY = "aac-store-delivery-zones-v1";
  // v3: ahora el panel edita todos los textos de la web, no solo los de compra.
  const CONTENT_KEY = "aac-store-commerce-content-v3";
  const DELIVERY_REVISION_KEY = "aac-store-delivery-revision";
  const DELIVERY_REVISION = 1;
  const CATALOG_REVISION_KEY = "aac-store-catalog-revision";
  const CATALOG_REVISION = 3;

  const categories = [
    "Ventanas de aluminio",
    "Ventanas aluminio con rejas",
    "Puertas de chapa",
    "Puertas placa",
    "Puertas de aluminio",
    "Rejas",
    "Portones",
    "Mamparas",
    "Accesorios",
  ];

  const defaults = [
    { code: "VA-001", category: categories[0], name: "Ventana aluminio vidrio entero corrediza", detail: "Ventana corrediza de dos hojas con vidrio entero. Medidas expresadas como ancho x alto.", variants: [{ measure: "80x80", price: 69300 }, { measure: "100x80", price: 72500 }, { measure: "100x100", price: 87800 }, { measure: "120x100", price: 95800 }, { measure: "120x110", price: 101300 }, { measure: "120x120", price: 119700 }, { measure: "120x150", price: 136700 }, { measure: "150x100", price: 111500 }, { measure: "150x110", price: 114500 }, { measure: "150x120", price: 136700 }, { measure: "150x150", price: 143900 }, { measure: "200x150", price: 167000 }], hands: [], colors: ["Blanco"], images: ["assets/products/ventana-vidrio-entero-frente.webp", "assets/products/ventana-vidrio-entero-perspectiva.webp"], active: true, featured: true },
    { code: "VR-001", category: categories[1], name: "Ventana corrediza con reja", detail: "Ventana de aluminio con reja de hierro incorporada.", variants: [{ measure: "100x100", price: 275000 }, { measure: "120x100", price: 315000 }], hands: [], colors: ["Blanco", "Negro"], image: "", active: true, featured: true },
    { code: "PCH-001", category: categories[2], name: "Puerta de chapa inyectada", detail: "Puerta exterior reforzada con marco y cerradura.", variants: [{ measure: "80x200", price: 320000 }, { measure: "90x200", price: 355000 }], hands: ["Derecha", "Izquierda"], colors: ["Blanco", "Negro", "Gris"], image: "", active: true, featured: true },
    { code: "PPL-001", category: categories[3], name: "Puerta placa interior", detail: "Puerta interior lista para colocar. Consultar marco disponible.", variants: [{ measure: "70x200", price: 165000 }, { measure: "80x200", price: 182000 }], hands: ["Derecha", "Izquierda"], colors: ["Blanco", "Cedro"], image: "", active: true, featured: true },
    { code: "PAL-36-C", category: categories[4], name: "Puerta Aluminio 36 mm Ciega", detail: "Puerta de aluminio ciega de 36 mm para exterior o lavadero.", variants: [{ measure: "70x200", price: 335000 }, { measure: "80x200", price: 365000 }, { measure: "90x200", price: 405000 }], hands: ["Derecha", "Izquierda"], colors: ["Blanco", "Negro"], image: "", active: true },
    { code: "REJ-001", category: categories[5], name: "Reja de hierro reforzada", detail: "Protección para ventana con diseño de líneas rectas.", variants: [{ measure: "100x100", price: 135000 }, { measure: "120x100", price: 158000 }, { measure: "150x110", price: 198000 }], hands: [], colors: ["Negro", "Blanco"], image: "", active: true },
    { code: "POR-001", category: categories[6], name: "Portón corredizo", detail: "Portón metálico para ingreso vehicular. Consultar fabricación.", variants: [{ measure: "240x200", price: 890000 }, { measure: "300x200", price: 1080000 }], hands: ["Derecha", "Izquierda"], colors: ["Negro", "Gris"], image: "", active: true },
    { code: "MAM-001", category: categories[7], name: "Mampara frontal corrediza", detail: "Mampara para ducha con panel traslúcido y perfilería de aluminio.", variants: [{ measure: "120x180", price: 225000 }, { measure: "140x180", price: 255000 }], hands: [], colors: ["Blanco", "Natural"], image: "", active: true },
    { code: "ACC-001", category: categories[8], name: "Mosquitero de aluminio", detail: "Marco de aluminio con tela mosquitera, listo para colocar.", variants: [{ measure: "100x100", price: 58000 }, { measure: "120x100", price: 69000 }], hands: [], colors: ["Blanco", "Natural"], image: "", active: true },
  ];

  const defaultSettings = {
    name: "Aberturas Aluminio Concordia",
    whatsapp: "5493454938829",
    address: "Humberto Primero 1166, Concordia, Entre Ríos",
    domain: "aberturasaluminioconcordia.com.ar",
  };

  const fallbackDeliveryZones = [
    { id: "concordia", province: "Entre Ríos", locality: "Concordia", available: true, deliveryDays: "Reparto diario", cashOnDelivery: true, nextDelivery: "", observations: "Pago al recibir disponible con todos los medios de pago." },
    { id: "chajari", province: "Entre Ríos", locality: "Chajarí", available: true, deliveryDays: "Reparto diario", cashOnDelivery: true, nextDelivery: "", observations: "Pago al recibir disponible con todos los medios de pago." },
    { id: "gualeguay", province: "Entre Ríos", locality: "Gualeguay", available: true, deliveryDays: "Reparto semanal", cashOnDelivery: false, nextDelivery: "", observations: "50% por transferencia y el resto al recibir. Consultá por otros medios de pago." },
  ];
  const defaultDeliveryZones = Array.isArray(window.DEFAULT_DELIVERY_ZONES) && window.DEFAULT_DELIVERY_ZONES.length
    ? window.DEFAULT_DELIVERY_ZONES
    : fallbackDeliveryZones;

  /* Todos los textos editables de la tienda, en el mismo orden en que
     aparecen en la página. La clave se usa tal cual en el HTML como
     data-content="...", así agregar un texto nuevo no requiere tocar app.js. */
  const defaultCommerceContent = {
    // Barra superior
    topbar: "Fabricación propia · Envíos a Entre Ríos y Corrientes",

    // Banner principal
    heroTitle: "Aberturas",
    heroSubtitle: "Listas para instalar",
    heroLead: "Descubrí nuestra línea de productos estándar",
    heroBadge1: "Envíos a toda la región",
    heroBadge2: "Abonás como prefieras",
    heroBadge3: "Medidas estándar",
    heroCta: "Ver productos",

    // Franja de beneficios
    benefit1Title: "Compra segura",
    benefit1Text: "Confirmamos cada detalle antes de cerrar",
    benefit2Title: "Envíos propios",
    benefit2Text: "Entre Ríos y centro-sur de Corrientes",
    benefit3Title: "Pago al recibir",
    benefit3Text: "Disponible en la mayoría de las zonas",
    benefit4Title: "Retiro en local",
    benefit4Text: "Humberto Primero 1166, Concordia",

    // Destacados
    featuredTitle: "Destacados en la tienda",
    featuredText: "Los productos más pedidos, con medidas listas para entrega.",

    // Accesos por categoría
    banner1Label: "Ventanas",
    banner2Label: "Puertas",
    banner3Label: "Rejas",

    // Catálogo
    catalogTitle: "Catálogo online",
    catalogText: "Elegí medida, mano y color según las opciones disponibles de cada producto.",

    // Cómo comprar
    sectionTitle: "Cómo comprar",
    sectionIntro: "Cuatro pasos, sin registro ni pagos online. Cerrás el pedido hablando con nosotros.",
    purchaseFlow: "Elegí el producto y la medida | Agregalo al carrito | Enviá el pedido por WhatsApp | Coordinamos entrega y pago",
    pricesTitle: "Precios actualizados",
    pricesNote: "El pedido finaliza por WhatsApp para confirmar disponibilidad, envío y forma de pago.",

    // Zonas de entrega
    deliveryTitle: "Zonas de entrega",
    deliveryText: "Hacemos envíos a Concordia, localidades de Entre Ríos y centro-sur de Corrientes.",
    deliverySearchLabel: "Consultá si llegamos a tu localidad",
    pricesText: "Buscá por nombre de localidad o código postal para ver la frecuencia de reparto y la condición de pago disponible.",
    deliveryListTitle: "Todas las localidades",

    // Bloque institucional
    instTitle: "Aberturas de calidad, directo de fábrica",
    instText: "Fabricamos ventanas, puertas, rejas y portones en Concordia. Trabajamos con medidas estándar para entrega inmediata y también fabricamos a medida para tu obra.",
    instCta: "Ver todos los productos",

    // Contacto
    contactOverline: "Atención personalizada",
    contactTitle: "¿Tenés dudas sobre medidas o modelos?",
    contactText: "Escribinos con las medidas aproximadas y una foto del espacio. Te ayudamos a elegir la mejor alternativa.",
    contactCta: "Consultar por WhatsApp",
    contactLocalLabel: "Local comercial",
    contactHoursLabel: "Atención",
    contactHours: "Lunes a viernes",
    contactHoursExtra: "Sábados por la mañana",
    mapCta: "Cómo llegar",

    footerLink1: "Catálogo completo",
    footerLink2: "Ventanas",
    footerLink3: "Puertas",
    footerLink4: "Rejas y portones",
    footerLink5: "Cómo comprar",
    footerLink6: "Zonas de entrega",
    footerLink7: "Formas de pago",
    footerLink8: "Contacto",
    footerHours: "Lunes a viernes · Sábados por la mañana",

    // Catálogo sin resultados
    emptyTitle: "No encontramos productos",
    emptyText: "Probá otra búsqueda o elegí una categoría diferente.",

    // Carrito
    cartEmptyTitle: "Tu carrito está vacío",
    cartEmptyText: "Agregá productos para preparar tu pedido.",
    cartContinue: "Seguir comprando",
    cartSubtotal: "Subtotal estimado",
    cartNote: "La compra se confirma por WhatsApp luego de verificar stock, variantes y entrega.",
    cartBuy: "Finalizar pedido por WhatsApp",
    cartClear: "Vaciar carrito",

    // Pie de página
    footerAbout: "Fabricación de aberturas de aluminio y herrería en Concordia, Entre Ríos.",
    footerCol1Title: "Tienda online",
    footerCol2Title: "Información",
    footerCol3Title: "Contactanos",
    footerRegion: "Concordia, Entre Ríos · Argentina",
    footerCredit: "Creado por Sistemas Umbral",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCT_KEY));
      let products = Array.isArray(saved) ? saved.map(normalizeProduct) : clone(defaults).map(normalizeProduct);
      const revision = Number(localStorage.getItem(CATALOG_REVISION_KEY) || 0);
      if (revision < CATALOG_REVISION) {
        /* Se mira lo guardado ANTES de tocar nada: si el catálogo viene de una
           versión sin destacados, no hay ninguna elección que respetar y se
           aplican los de fábrica. Si el negocio ya eligió, no se toca. */
        const sinElecciones = Array.isArray(saved) && !saved.some((product) => product.featured);

        const updatedWindow = normalizeProduct(defaults.find((product) => product.code === "VA-001"));
        const index = products.findIndex((product) => product.code === updatedWindow.code);
        // Al reponer la ficha no se pisa lo que el negocio haya elegido.
        if (index >= 0) products[index] = { ...updatedWindow, featured: sinElecciones ? updatedWindow.featured : products[index].featured };
        else products.unshift(updatedWindow);

        if (sinElecciones) {
          const deFabrica = new Set(defaults.filter((product) => product.featured).map((product) => product.code));
          products = products.map((product) => ({ ...product, featured: deFabrica.has(product.code) }));
        }
        localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
        localStorage.setItem(CATALOG_REVISION_KEY, String(CATALOG_REVISION));
      }
      return products;
    } catch {
      return clone(defaults).map(normalizeProduct);
    }
  }

  function saveProducts(products) {
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("store-products-updated"));
  }

  function getSettings() {
    try {
      const settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
      if (!settings.whatsapp) settings.whatsapp = defaultSettings.whatsapp;
      return settings;
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...settings }));
  }

  function getDeliveryZones() {
    try {
      const saved = JSON.parse(localStorage.getItem(DELIVERY_KEY));
      const revision = Number(localStorage.getItem(DELIVERY_REVISION_KEY) || 0);
      if (revision < DELIVERY_REVISION) {
        const imported = clone(defaultDeliveryZones).map(normalizeDeliveryZone);
        localStorage.setItem(DELIVERY_KEY, JSON.stringify(imported));
        localStorage.setItem(DELIVERY_REVISION_KEY, String(DELIVERY_REVISION));
        return imported;
      }
      return Array.isArray(saved) ? saved.map(normalizeDeliveryZone) : clone(defaultDeliveryZones).map(normalizeDeliveryZone);
    } catch {
      return clone(defaultDeliveryZones);
    }
  }

  function saveDeliveryZones(zones) {
    localStorage.setItem(DELIVERY_KEY, JSON.stringify(zones.map(normalizeDeliveryZone)));
  }

  function normalizeDeliveryZone(zone) {
    return {
      id: String(zone.id || `${zone.province}-${zone.locality}-${Date.now()}`).trim(),
      province: String(zone.province || "").trim(),
      department: String(zone.department || "").trim(),
      locality: String(zone.locality || "").trim(),
      postalCode: String(zone.postalCode || zone.cp || "").trim(),
      available: zone.available !== false,
      deliveryDays: String(zone.deliveryDays || "").trim(),
      cashOnDelivery: zone.cashOnDelivery === true,
      paymentCondition: String(zone.paymentCondition || (zone.cashOnDelivery ? "Pago al recibir disponible" : "Pago anticipado o combinado, sujeto a confirmación")).trim(),
      nextDelivery: String(zone.nextDelivery || "").trim(),
      observations: String(zone.observations || "").trim(),
    };
  }

  function getCommerceContent() {
    try {
      return { ...defaultCommerceContent, ...JSON.parse(localStorage.getItem(CONTENT_KEY)) };
    } catch {
      return { ...defaultCommerceContent };
    }
  }

  function saveCommerceContent(content) {
    localStorage.setItem(CONTENT_KEY, JSON.stringify({ ...getCommerceContent(), ...content }));
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function splitOptions(value) {
    if (Array.isArray(value)) return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
    return [...new Set(String(value || "").split(/\s*[;|/]\s*|\s*,\s*/).map((item) => item.trim()).filter(Boolean))];
  }

  function normalizeProduct(product) {
    const legacyMeasures = splitOptions(product.measures ?? product.measure);
    const variants = Array.isArray(product.variants) && product.variants.length
      ? product.variants
      : legacyMeasures.map((measure) => ({ measure, price: product.price }));
    const normalizedVariants = variants.map((variant) => ({
      measure: String(variant.measure || "").trim(),
      price: Math.max(0, Number(variant.price) || 0),
    })).filter((variant) => variant.measure);
    if (!normalizedVariants.length && Number(product.price) >= 0) {
      normalizedVariants.push({ measure: "Única", price: Math.max(0, Number(product.price) || 0) });
    }
    const images = Array.isArray(product.images)
      ? product.images.map(String).map((image) => image.trim()).filter(Boolean)
      : product.image ? [String(product.image).trim()] : [];
    if (!images.length && product.image) images.push(String(product.image).trim());
    return {
      code: String(product.code || "").trim().toUpperCase(),
      category: String(product.category || "").trim(),
      name: String(product.name || "").trim(),
      detail: String(product.detail || "").trim(),
      variants: normalizedVariants,
      measures: normalizedVariants.map((variant) => variant.measure),
      hands: splitOptions(product.hands ?? product.hand),
      colors: splitOptions(product.colors ?? product.color),
      price: normalizedVariants.length ? Math.min(...normalizedVariants.map((variant) => variant.price)) : 0,
      images,
      image: images[0] || "",
      active: product.active !== false,
      featured: product.featured === true,
    };
  }

  /* Copia de seguridad: mientras los datos vivan en el navegador, esta es la
     única forma de llevar una configuración de una computadora a otra. */
  function exportBackup() {
    return {
      formato: "aac-backup",
      version: 1,
      fecha: new Date().toISOString(),
      productos: getProducts(),
      zonas: getDeliveryZones(),
      textos: getCommerceContent(),
      configuracion: getSettings(),
    };
  }

  function importBackup(data) {
    if (!data || data.formato !== "aac-backup") {
      throw new Error("El archivo no es una copia de seguridad de esta tienda.");
    }
    const resumen = { productos: 0, zonas: 0, textos: false, configuracion: false };
    if (Array.isArray(data.productos)) {
      saveProducts(data.productos.map(normalizeProduct));
      resumen.productos = data.productos.length;
    }
    if (Array.isArray(data.zonas)) {
      saveDeliveryZones(data.zonas);
      resumen.zonas = data.zonas.length;
    }
    if (data.textos && typeof data.textos === "object") {
      localStorage.setItem(CONTENT_KEY, JSON.stringify({ ...defaultCommerceContent, ...data.textos }));
      resumen.textos = true;
    }
    if (data.configuracion && typeof data.configuracion === "object") {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings, ...data.configuracion }));
      resumen.configuracion = true;
    }
    return resumen;
  }

  window.Store = {
    categories,
    defaults,
    defaultCommerceContent,
    exportBackup,
    importBackup,
    getProducts,
    saveProducts,
    getSettings,
    saveSettings,
    getDeliveryZones,
    saveDeliveryZones,
    normalizeDeliveryZone,
    getCommerceContent,
    saveCommerceContent,
    getCart,
    saveCart,
    splitOptions,
    normalizeProduct,
    resetProducts: () => saveProducts(clone(defaults)),
  };
})();
