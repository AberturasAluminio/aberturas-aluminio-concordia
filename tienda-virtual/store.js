(function () {
  const PRODUCT_KEY = "aac-store-products-v2";
  const SETTINGS_KEY = "aac-store-settings-v2";
  const CART_KEY = "aac-store-cart-v2";
  const DELIVERY_KEY = "aac-store-delivery-zones-v1";
  const CONTENT_KEY = "aac-store-commerce-content-v1";
  const DELIVERY_REVISION_KEY = "aac-store-delivery-revision";
  const DELIVERY_REVISION = 1;
  const CATALOG_REVISION_KEY = "aac-store-catalog-revision";
  const CATALOG_REVISION = 1;

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
    { code: "VA-001", category: categories[0], name: "Ventana aluminio vidrio entero corrediza", detail: "Ventana corrediza de dos hojas con vidrio entero. Medidas expresadas como ancho x alto.", variants: [{ measure: "80x80", price: 69300 }, { measure: "100x80", price: 72500 }, { measure: "100x100", price: 87800 }, { measure: "120x100", price: 95800 }, { measure: "120x110", price: 101300 }, { measure: "120x120", price: 119700 }, { measure: "120x150", price: 136700 }, { measure: "150x100", price: 111500 }, { measure: "150x110", price: 114500 }, { measure: "150x120", price: 136700 }, { measure: "150x150", price: 143900 }, { measure: "200x150", price: 167000 }], hands: [], colors: ["Blanco"], images: ["assets/products/ventana-vidrio-entero-frente.webp", "assets/products/ventana-vidrio-entero-perspectiva.webp"], active: true },
    { code: "VR-001", category: categories[1], name: "Ventana corrediza con reja", detail: "Ventana de aluminio con reja de hierro incorporada.", variants: [{ measure: "100x100", price: 275000 }, { measure: "120x100", price: 315000 }], hands: [], colors: ["Blanco", "Negro"], image: "", active: true },
    { code: "PCH-001", category: categories[2], name: "Puerta de chapa inyectada", detail: "Puerta exterior reforzada con marco y cerradura.", variants: [{ measure: "80x200", price: 320000 }, { measure: "90x200", price: 355000 }], hands: ["Derecha", "Izquierda"], colors: ["Blanco", "Negro", "Gris"], image: "", active: true },
    { code: "PPL-001", category: categories[3], name: "Puerta placa interior", detail: "Puerta interior lista para colocar. Consultar marco disponible.", variants: [{ measure: "70x200", price: 165000 }, { measure: "80x200", price: 182000 }], hands: ["Derecha", "Izquierda"], colors: ["Blanco", "Cedro"], image: "", active: true },
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

  const defaultCommerceContent = {
    sectionTitle: "Cómo comprar y recibir tu pedido",
    sectionIntro: "Información clara para que puedas elegir, comprar y coordinar la entrega con confianza.",
    pricesTitle: "Precios actualizados",
    pricesText: "Todos los precios publicados están actualizados. Podés armar tu carrito con las medidas y productos que necesitás.",
    pricesNote: "El pedido finaliza por WhatsApp para confirmar disponibilidad, envío y forma de pago.",
    purchaseFlow: "Ver productos | Agregar al carrito | Enviar pedido por WhatsApp | Confirmar compra",
    deliveryTitle: "Zonas de entrega",
    deliveryText: "Hacemos envíos a Concordia, localidades de Entre Ríos y Corrientes.",
    paymentsTitle: "Formas de pago",
    paymentsText: "En la mayoría de nuestras zonas de entrega podés pagar al recibir tu pedido.",
    paymentsNote: "Al finalizar el pedido confirmamos la modalidad disponible según tu ubicación.",
    paymentMethods: "Efectivo | Transferencia bancaria | Crédito",
    shippingTitle: "Envíos",
    shippingText: "Contamos con reparto frecuente. Algunas localidades tienen entregas diarias y otras entregas programadas semanalmente.",
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
        const updatedWindow = normalizeProduct(defaults.find((product) => product.code === "VA-001"));
        const index = products.findIndex((product) => product.code === updatedWindow.code);
        if (index >= 0) products[index] = updatedWindow;
        else products.unshift(updatedWindow);
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
    };
  }

  window.Store = {
    categories,
    defaults,
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
