/* CAPA DE DATOS — todo pasa por acá.

   Los datos viven en Supabase. La decisión de diseño importante: `init()` trae
   todo una vez al arrancar y las `get*` siguen siendo SÍNCRONAS leyendo de
   memoria. Por eso layout.js, app.js y admin.js no cambiaron de forma: siguen
   llamando `Store.getProducts()` igual que cuando los datos estaban en el
   navegador. Lo único que hace falta es esperar a `Store.init()` antes de
   renderizar.

   Las `save*` sí son asíncronas: actualizan el caché primero (para que la
   pantalla responda al toque) y después escriben en la base. Si la escritura
   falla, avisan.

   El costo de los productos no se pide cuando no hay sesión: la base no se lo
   da al visitante y pedirlo daría error de permisos. */
(function () {
  const SUPABASE_URL = "https://knkemhghbclhipynbecr.supabase.co";
  // Clave pública: está pensada para viajar al navegador. Lo que protege los
  // datos son las políticas de la base, no esconder esto.
  const SUPABASE_KEY = "sb_publishable_RBj4jl8wx3HCtJgwDTy4lA_CtyAicAA";

  // El carrito y los datos de quien compra siguen siendo de este navegador:
  // son del visitante, no del negocio, y no tienen por qué salir de acá.
  const CART_KEY = "aac-store-cart-v2";
  const BUYER_KEY = "aac-store-buyer-v1";

  /* Las que usa el negocio en su propia lista de precios, con su nombre tal
     cual. El orden agrupa por familia para que el desplegable de la tienda se
     lea de corrido; en la planilla vienen mezcladas. */
  const categories = [
    "Ventana",
    "Ventana con Reja",
    "Ventana Repartido",
    "Ventana con Persiana",
    "Ventiluz",
    "Ventiluz con Reja",
    "Raja",
    "Puerta Aluminio",
    "Puerta Placa",
    "Puerta Chapa Simple",
    "Puerta Doble Chapa",
    "Puerta Ventana",
    "Puerta Ventana Repartido",
    "Reja 10 mm",
    "Persianas",
    "Aireador",
  ];

  const defaultSettings = {
    name: "Aberturas Aluminio Concordia",
    whatsapp: "5493454938829",
    email: "aberturasaluminioconcordia@gmail.com",
    address: "Humberto Primero 1166, Concordia, Entre Ríos",
    domain: "aberturasaluminioconcordia.com.ar",
    googleMaps: "https://www.google.com/maps/place/Aberturas+Aluminio+Concordia/@-31.3856425,-58.0291929,17z/data=!4m6!3m5!1s0x95ade9f644cd8723:0x7268e4ad6931cc87!8m2!3d-31.3856425!4d-58.0291929!16s%2Fg%2F11fl7tw509",
    /* Abre directo el formulario de reseña de Google, sin pasar por la ficha.
       El `placeid` sale del identificador que ya está en googleMaps: es el
       protobuf de `0x95ade9f644cd8723:0x7268e4ad6931cc87` en base64url.
       Si queda vacío, el botón cae a la ficha de Maps. */
    googleReview: "https://search.google.com/local/writereview?placeid=ChIJI4fNRPbprZURh8wxaa3kaHI",
  };

  /* Estos valores de fábrica ya no son de dónde salen los datos —eso es la
     base— sino el respaldo de los botones "Restaurar originales" del panel y
     lo que se muestra si la base todavía no respondió. */
  const defaultCommerceContent = {
    topbar: "Fabricación propia · Envíos a Entre Ríos y Corrientes",
    heroTitle: "Aberturas",
    heroSubtitle: "Listas para instalar",
    heroLead: "Descubrí nuestra línea de productos estándar",
    // La foto grande de la portada. Es una ruta del sitio hasta que el panel
    // sube otra, y ahí pasa a ser una URL de Supabase Storage.
    heroImage: "assets/hero-ambiente.webp",
    heroBadge1: "Envíos a toda la región",
    heroBadge2: "Abonás como prefieras",
    heroBadge3: "Medidas estándar",
    heroCta: "Ver productos",
    benefit1Title: "Compra segura",
    benefit1Text: "Confirmamos cada detalle antes de cerrar",
    benefit2Title: "Envíos propios",
    benefit2Text: "Entre Ríos y centro-sur de Corrientes",
    benefit3Title: "Pago al recibir",
    benefit3Text: "Disponible en la mayoría de las zonas",
    benefit4Title: "Retiro en local",
    benefit4Text: "Humberto Primero 1166, Concordia",
    featuredTitle: "Destacados en la tienda",
    featuredText: "Los productos más pedidos, con medidas listas para entrega.",
    banner1Label: "Ventanas",
    banner2Label: "Puertas",
    banner3Label: "Rejas",
    catalogTitle: "Catálogo online",
    catalogText: "Elegí medida, mano y color según las opciones disponibles de cada producto.",
    faqTitle: "Preguntas frecuentes",
    faqText: "Las consultas que más nos hacen sobre productos, envíos, pagos y medidas.",
    faqCtaText: "¿No encontraste lo que buscabas?",
    faqCta: "Preguntanos por WhatsApp",
    reviewsTitle: "Lo que dicen nuestros clientes",
    reviewsText: "Reseñas de personas que ya compraron en Aberturas Aluminio Concordia.",
    reviewsCtaTitle: "¿Ya compraste con nosotros?",
    reviewsCtaText: "Contá tu experiencia en Google. Nos ayuda a que más vecinos nos encuentren.",
    reviewsCta: "Dejar mi reseña en Google",
    reviewsEmptyText: "Todavía no hay reseñas publicadas.",
    paymentTitle: "Medios de pago",
    paymentText: "Queremos que comprar sea simple y cómodo. Por eso ponemos a tu disposición distintas formas de pago.",
    sectionTitle: "Cómo comprar",
    sectionIntro: "Cuatro pasos, sin registro ni pagos online. Cerrás el pedido hablando con nosotros.",
    purchaseFlow: "Elegí el producto y la medida | Agregalo al carrito | Enviá el pedido por WhatsApp | Coordinamos entrega y pago",
    pricesTitle: "Precios actualizados",
    pricesNote: "El pedido finaliza por WhatsApp para confirmar disponibilidad, envío y forma de pago.",
    deliveryTitle: "Zonas de entrega",
    deliveryText: "Hacemos envíos a Concordia, localidades de Entre Ríos y centro-sur de Corrientes.",
    deliverySearchLabel: "Consultá si llegamos a tu localidad",
    pricesText: "Buscá por nombre de localidad o código postal para ver la frecuencia de reparto y la condición de pago disponible.",
    deliveryListTitle: "Todas las localidades",
    instTitle: "Aberturas de calidad, directo de fábrica",
    instText: "Fabricamos ventanas, puertas, rejas y portones en Concordia. Trabajamos con medidas estándar para entrega inmediata y también fabricamos a medida para tu obra.",
    instCta: "Ver todos los productos",
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
    footerLink7: "Medios de pago",
    footerLink8: "Preguntas frecuentes",
    footerLink9: "Reseñas",
    footerLink10: "Contacto",
    footerHours: "Lunes a viernes · Sábados por la mañana",
    emptyTitle: "No encontramos productos",
    emptyText: "Probá otra búsqueda o elegí una categoría diferente.",
    cartTitle: "Carrito de compras",
    cartEmptyTitle: "Tu carrito está vacío",
    cartEmptyText: "Agregá productos para preparar tu pedido.",
    cartContinue: "Seguir comprando",
    cartSubtotal: "Subtotal (sin envío)",
    cartShippingLabel: "Zona de entrega",
    cartShippingButton: "Calcular",
    cartShippingEmpty: "Calculalo para verlo",
    cartTotalLabel: "Total",
    cartNote: "La compra se confirma por WhatsApp luego de verificar stock, variantes y entrega.",
    cartBuy: "Iniciar compra por WhatsApp",
    cartClear: "Vaciar carrito",
    detailBuy: "Iniciar compra",
    checkoutTitle: "Tus datos",
    checkoutIntro: "Completá tus datos y se arma el pedido en WhatsApp. El negocio solo tiene que confirmarlo.",
    checkoutModoLabel: "¿Cómo lo recibís?",
    checkoutSend: "Enviar pedido por WhatsApp",
    checkoutBack: "Volver al carrito",
    footerAbout: "Fabricación de aberturas de aluminio y herrería en Concordia, Entre Ríos.",
    footerCol1Title: "Tienda online",
    footerCol2Title: "Información",
    footerCol3Title: "Contactanos",
    footerRegion: "Concordia, Entre Ríos · Argentina",
    footerCredit: "Creado por Sistemas Umbral",
  };

  const ORDER_STATES = ["Nuevo", "Confirmado", "Entrega parcial", "Entregado", "Cancelado"];
  /* Los que se eligen de una lista. "Entrega parcial" no está a propósito: sale
     de marcar cuánto se entregó de cada producto, no de elegirlo a mano. */
  const MANUAL_ORDER_STATES = ["Nuevo", "Confirmado", "Entregado", "Cancelado"];
  const PAYMENT_STATES = ["Sin cobrar", "Parcial", "Pagado"];

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "aac-auth" },
  });

  /* Todo lo que las get* devuelven sin ir a la red. Se llena en init() y se
     mantiene al día en cada save*. */
  const cache = {
    products: [],
    zones: [],
    content: { ...defaultCommerceContent },
    settings: { ...defaultSettings },
    faqs: [],
    reviews: [],
    orders: [],
    paymentMethods: [],
    factoryDefaults: {},
  };
  let sesion = null;
  let esAdmin = false;

  function avisarError(contexto, error) {
    if (!error) return false;
    console.error(`[Store] ${contexto}:`, error.message || error);
    window.dispatchEvent(new CustomEvent("store-error", { detail: { contexto, error } }));
    return true;
  }

  const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

  /* ---------- Lecturas ---------- */

  async function cargarProductos() {
    /* El costo vive en su propia tabla, no como columna del producto: es la
       única forma de que la base lo proteja sola. A quien no está en la lista
       de administradores le devuelve cero filas, sin que el navegador tenga
       que acordarse de no pedirlo. */
    const { data, error } = await db
      .from("products")
      .select("id, code, category, name, detail, hands, colors, images, active, featured, sort_order, product_variants(id, measure, price, promo_price, stock, sort_order)")
      .order("sort_order");
    if (avisarError("cargar productos", error)) return;

    let costos = {};
    if (esAdmin) {
      const { data: filas, error: errorCostos } = await db.from("variant_costs").select("variant_id, cost");
      if (!avisarError("cargar costos", errorCostos)) {
        costos = Object.fromEntries((filas || []).map((f) => [f.variant_id, f.cost]));
      }
    }
    cache.products = (data || []).map((fila) => desdeFilaProducto(fila, costos));
  }

  function desdeFilaProducto(fila, costos = {}) {
    const variants = (fila.product_variants || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((v) => ({
        id: v.id,
        measure: String(v.measure || "").trim(),
        price: Number(v.price) || 0,
        promoPrice: numero(v.promo_price),
        cost: numero(costos[v.id]),
        stock: Number(v.stock) || 0,
      }));
    return {
      id: fila.id,
      code: String(fila.code || "").toUpperCase(),
      category: String(fila.category || ""),
      name: String(fila.name || ""),
      detail: String(fila.detail || ""),
      variants,
      measures: variants.map((v) => v.measure),
      hands: fila.hands || [],
      colors: fila.colors || [],
      // El "desde" se calcula sobre el precio que se cobra: si no, un producto
      // en oferta mostraría un "desde" más caro que su propia oferta.
      price: variants.length ? Math.min(...variants.map(precioEfectivo)) : 0,
      images: fila.images || [],
      image: (fila.images || [])[0] || "",
      active: fila.active !== false,
      featured: fila.featured === true,
    };
  }

  const precioEfectivo = (variante) =>
    variante && variante.promoPrice !== null && variante.promoPrice !== undefined
      ? Number(variante.promoPrice)
      : Number(variante?.price) || 0;

  const enOferta = (variante) =>
    variante && variante.promoPrice !== null && variante.promoPrice !== undefined
      && Number(variante.promoPrice) < Number(variante.price);

  async function cargarZonas() {
    const { data, error } = await db.from("delivery_zones").select("*").order("sort_order");
    if (avisarError("cargar zonas", error)) return;
    cache.zones = (data || []).map((z) => ({
      id: z.id,
      province: z.province || "",
      department: z.department || "",
      locality: z.locality || "",
      postalCode: z.postal_code || "",
      available: z.available !== false,
      deliveryDays: z.delivery_days || "",
      cashOnDelivery: z.cash_on_delivery === true,
      paymentCondition: z.payment_condition || "",
      nextDelivery: z.next_delivery || "",
      observations: z.observations || "",
    }));
  }

  async function cargarTextos() {
    const { data, error } = await db.from("commerce_content").select("key, value");
    if (avisarError("cargar textos", error)) return;
    const guardados = Object.fromEntries((data || []).map((f) => [f.key, f.value]));
    cache.content = { ...defaultCommerceContent, ...guardados };
  }

  async function cargarConfiguracion() {
    const { data, error } = await db.from("settings").select("key, value");
    if (avisarError("cargar configuración", error)) return;
    const guardados = Object.fromEntries((data || []).map((f) => [f.key, f.value]));
    cache.settings = { ...defaultSettings, ...guardados };
    if (!cache.settings.whatsapp) cache.settings.whatsapp = defaultSettings.whatsapp;
  }

  async function cargarPreguntas() {
    const { data, error } = await db
      .from("faq_groups")
      .select("id, icon, title, sort_order, faq_items(question, answer, sort_order)")
      .order("sort_order");
    if (avisarError("cargar preguntas", error)) return;
    cache.faqs = (data || []).map((g) => ({
      id: g.id,
      icon: g.icon || "producto",
      title: g.title || "",
      items: (g.faq_items || [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((i) => ({ q: i.question, a: i.answer })),
    }));
  }

  async function cargarResenas() {
    // Al visitante la base solo le devuelve las publicadas; con sesión llegan
    // todas para poder administrarlas.
    const { data, error } = await db.from("reviews").select("*").order("sort_order");
    if (avisarError("cargar reseñas", error)) return;
    cache.reviews = (data || []).map((r) => ({
      id: r.id,
      name: r.name || "",
      rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
      text: r.text || "",
      date: r.review_date || "",
      source: r.source === "Google" ? "Google" : "Tienda",
      published: r.published === true,
    }));
  }

  async function cargarPedidos() {
    if (!esAdmin) return;
    const { data, error } = await db
      .from("orders")
      .select(`*, order_items(*), payments(*)`)
      .order("created_at", { ascending: false });
    if (avisarError("cargar pedidos", error)) return;
    cache.orders = (data || []).map(desdeFilaPedido);
  }

  function desdeFilaPedido(fila) {
    return {
      id: fila.id,
      numero: `#${String(fila.number).padStart(4, "0")}`,
      number: fila.number,
      fecha: fila.created_at,
      // `estado` se mantiene con el nombre viejo porque es como lo llama el
      // panel; lo nuevo es que el estado de pago va aparte.
      estado: fila.delivery_status,
      estadoPago: fila.payment_status,
      canal: fila.channel,
      cliente: {
        nombre: fila.customer_name || "",
        telefono: fila.customer_phone || "",
        modo: fila.delivery_mode || "",
        localidad: fila.locality || "",
        direccion: fila.address || "",
        comentarios: fila.comments || "",
      },
      // En el orden en que se cargaron: la base no garantiza ninguno y sin esto
      // las líneas se reacomodaban solas entre una recarga y otra.
      items: (fila.order_items || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i) => ({
        id: i.id,
        variantId: i.variant_id,
        code: i.product_code,
        name: i.product_name,
        opciones: i.options,
        cantidad: i.quantity,
        entregado: Number(i.delivered_quantity) || 0,
        precio: numero(i.unit_price),
        costo: numero(i.unit_cost),
      })),
      pagos: (fila.payments || []).map((p) => ({
        id: p.id,
        medio: p.method_name,
        methodId: p.method_id,
        fecha: p.paid_at,
        monto: Number(p.amount) || 0,
        comision: Number(p.commission_percent) || 0,
        neto: Number(p.net_amount) || 0,
        notas: p.notes || "",
      })),
      mercaderia: Number(fila.goods_total) || 0,
      flete: Number(fila.shipping_amount) || 0,
      fletePorcentaje: Number(fila.shipping_percent) || 0,
      // Lo que el flete suma al total, ya sea por monto fijo, por porcentaje o
      // por los dos. Se calcula acá para no repetir la fórmula en el panel.
      fleteTotal: (Number(fila.total) || 0) - (Number(fila.goods_total) || 0),
      total: Number(fila.total) || 0,
      costoTotal: Number(fila.cost_total) || 0,
      cobrado: Number(fila.paid_amount) || 0,
      netoCobrado: Number(fila.net_paid) || 0,
      saldo: Number(fila.balance) || 0,
      notas: fila.notes || "",
      aCotizar: fila.to_quote === true,
    };
  }

  /* Cuánto se entregó y cuánto falta, en unidades. El pedido se cobra entero
     desde el día uno —el saldo no depende de la entrega— así que esto es una
     cuenta aparte de la del dinero. */
  const resumenEntrega = (order) => {
    const pedidas = order.items.reduce((sum, item) => sum + item.cantidad, 0);
    const entregadas = order.items.reduce((sum, item) => sum + item.entregado, 0);
    return { pedidas, entregadas, pendientes: pedidas - entregadas };
  };

  async function cargarMediosDePago() {
    // Son datos del negocio: al visitante la base se los niega, así que ni se
    // los pedimos. Si no, cada visita deja un 401 en la consola.
    if (!esAdmin) return;
    const { data, error } = await db.from("payment_methods").select("*").order("sort_order");
    if (avisarError("cargar medios de pago", error)) return;
    cache.paymentMethods = (data || []).map((m) => ({
      id: m.id,
      name: m.name,
      commission: Number(m.commission_percent) || 0,
      active: m.active !== false,
    }));
  }

  /* Respaldo de los botones "Restaurar originales". Solo con sesión: al
     visitante no le sirve de nada y la base no se lo entrega. */
  async function cargarValoresDeFabrica() {
    if (!esAdmin) return;
    const { data, error } = await db.from("factory_defaults").select("key, data");
    if (avisarError("cargar valores originales", error)) return;
    cache.factoryDefaults = Object.fromEntries((data || []).map((f) => [f.key, f.data]));
  }

  const getFactoryDefaults = (key) => cache.factoryDefaults[key] || null;

  /* ---------- Arranque ---------- */

  async function init() {
    const { data } = await db.auth.getSession();
    sesion = data?.session || null;
    esAdmin = await comprobarAdmin();

    await Promise.all([
      cargarProductos(),
      cargarZonas(),
      cargarTextos(),
      cargarConfiguracion(),
      cargarPreguntas(),
      cargarResenas(),
    ]);
    await Promise.all([cargarPedidos(), cargarValoresDeFabrica(), cargarMediosDePago()]);

    db.auth.onAuthStateChange((_evento, nuevaSesion) => {
      sesion = nuevaSesion;
      window.dispatchEvent(new CustomEvent("store-auth-changed", { detail: { sesion } }));
    });
    return { sesion, esAdmin };
  }

  async function comprobarAdmin() {
    if (!sesion) return false;
    const { data, error } = await db.from("admins").select("user_id").maybeSingle();
    if (error) return false;
    return Boolean(data);
  }

  /* Después de entrar o salir hay que releer: con sesión llegan los costos,
     los pedidos y las reseñas ocultas; sin sesión, nada de eso. */
  async function recargar() {
    esAdmin = await comprobarAdmin();
    cache.orders = [];
    cache.factoryDefaults = {};
    await Promise.all([cargarProductos(), cargarResenas(), cargarMediosDePago()]);
    await Promise.all([cargarPedidos(), cargarValoresDeFabrica()]);
  }

  /* ---------- Sesión ---------- */

  async function signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      // Antes cualquier fallo decía "contraseña incorrecta", incluidos los que
      // no tienen nada que ver: sin conexión, límite de intentos, mail sin
      // confirmar. Eso hacía imposible saber qué estaba pasando de verdad.
      console.error("[Store] no se pudo entrar:", error.status, error.code, error.message);
      const mensajes = {
        invalid_credentials: "Correo o contraseña incorrectos.",
        email_not_confirmed: "La cuenta existe pero el correo no está confirmado.",
        over_request_rate_limit: "Demasiados intentos seguidos. Esperá un minuto y volvé a probar.",
        user_banned: "La cuenta está suspendida.",
      };
      return {
        ok: false,
        mensaje: mensajes[error.code]
          || (error.status ? `No se pudo entrar (${error.code || error.status}). Mirá la consola para el detalle.` : "No se pudo conectar con el servidor. Revisá la conexión."),
      };
    }
    sesion = data.session;
    await recargar();
    if (!esAdmin) {
      await signOut();
      return { ok: false, mensaje: "Esta cuenta no tiene acceso al panel." };
    }
    return { ok: true };
  }

  async function signOut() {
    await db.auth.signOut();
    sesion = null;
    esAdmin = false;
    cache.orders = [];
  }

  const getSession = () => sesion;
  const isAdmin = () => esAdmin;

  /* ---------- Escrituras ---------- */

  function getProducts() {
    return cache.products;
  }

  /* Recibe el catálogo entero, como cuando vivía en el navegador. Las medidas
     se actualizan por (producto, medida) en vez de borrarse y recrearse: los
     pedidos ya registrados apuntan a esas medidas y perderían el vínculo. */
  async function saveProducts(products) {
    /* El editor, la actualización masiva de precios y la importación de Excel
       mandan cada medida como {measure, price}: no conocen el costo, la oferta
       ni el stock. Sin esto, editar el nombre de un producto borraría los
       costos cargados. La regla: campo ausente (undefined) conserva lo que ya
       había; campo en null es una decisión de vaciarlo. */
    const previos = new Map();
    for (const producto of cache.products) {
      for (const variante of producto.variants) {
        previos.set(`${producto.code}|${variante.measure}`, variante);
      }
    }
    const completos = products.map((producto) => ({
      ...producto,
      variants: (producto.variants || []).map((variante) => {
        const previo = previos.get(`${String(producto.code || "").trim().toUpperCase()}|${String(variante.measure || "").trim()}`);
        if (!previo) return variante;
        return {
          ...variante,
          cost: variante.cost === undefined ? previo.cost : variante.cost,
          promoPrice: variante.promoPrice === undefined ? previo.promoPrice : variante.promoPrice,
          stock: variante.stock === undefined ? previo.stock : variante.stock,
        };
      }),
    }));

    const normalizados = completos.map(normalizeProduct);
    cache.products = normalizados;
    window.dispatchEvent(new CustomEvent("store-products-updated"));

    const filas = normalizados.map((p, i) => ({
      code: p.code,
      category: p.category,
      name: p.name,
      detail: p.detail,
      hands: p.hands,
      colors: p.colors,
      images: p.images,
      active: p.active,
      featured: p.featured,
      sort_order: i,
    }));
    const { data: guardados, error } = await db
      .from("products")
      .upsert(filas, { onConflict: "code" })
      .select("id, code");
    if (avisarError("guardar productos", error)) return false;

    const idPorCodigo = Object.fromEntries((guardados || []).map((f) => [f.code, f.id]));
    const codigos = normalizados.map((p) => p.code);
    if (codigos.length) {
      const { error: errorBorrado } = await db.from("products").delete().not("code", "in", `(${codigos.map((c) => `"${c}"`).join(",")})`);
      avisarError("borrar productos quitados", errorBorrado);
    }

    for (const producto of normalizados) {
      const productId = idPorCodigo[producto.code];
      if (!productId) continue;
      const variantes = producto.variants.map((v, i) => ({
        product_id: productId,
        measure: v.measure,
        price: Number(v.price) || 0,
        promo_price: v.promoPrice === null || v.promoPrice === undefined || v.promoPrice === "" ? null : Number(v.promoPrice),
        stock: Number(v.stock) || 0,
        sort_order: i,
      }));
      if (variantes.length) {
        // Se piden de vuelta los ids porque el costo va en otra tabla y hay
        // que saber a qué medida corresponde cada uno.
        const { data: guardadas, error: errorVariantes } = await db
          .from("product_variants")
          .upsert(variantes, { onConflict: "product_id,measure" })
          .select("id, measure");
        if (!avisarError("guardar medidas", errorVariantes)) {
          const idPorMedida = Object.fromEntries((guardadas || []).map((f) => [f.measure, f.id]));
          const costos = producto.variants
            .filter((v) => idPorMedida[v.measure])
            .map((v) => ({
              variant_id: idPorMedida[v.measure],
              cost: v.cost === null || v.cost === undefined || v.cost === "" ? null : Number(v.cost),
            }));
          if (costos.length) {
            const { error: errorCostos } = await db.from("variant_costs").upsert(costos, { onConflict: "variant_id" });
            avisarError("guardar costos", errorCostos);
          }
        }
      }
      const medidas = producto.variants.map((v) => v.measure);
      const { error: errorSobras } = medidas.length
        ? await db.from("product_variants").delete().eq("product_id", productId)
            .not("measure", "in", `(${medidas.map((m) => `"${m}"`).join(",")})`)
        : await db.from("product_variants").delete().eq("product_id", productId);
      avisarError("borrar medidas quitadas", errorSobras);
    }

    await cargarProductos();
    window.dispatchEvent(new CustomEvent("store-products-updated"));
    return true;
  }

  const getSettings = () => cache.settings;

  async function saveSettings(settings) {
    cache.settings = { ...cache.settings, ...settings };
    const filas = Object.entries(settings).map(([key, value]) => ({ key, value: String(value ?? "") }));
    const { error } = await db.from("settings").upsert(filas, { onConflict: "key" });
    return !avisarError("guardar configuración", error);
  }

  const getDeliveryZones = () => cache.zones;

  async function saveDeliveryZones(zones) {
    const normalizadas = zones.map(normalizeDeliveryZone);
    cache.zones = normalizadas;
    const filas = normalizadas.map((z, i) => ({
      id: z.id,
      province: z.province,
      department: z.department,
      locality: z.locality,
      postal_code: z.postalCode,
      available: z.available,
      delivery_days: z.deliveryDays,
      cash_on_delivery: z.cashOnDelivery,
      payment_condition: z.paymentCondition,
      next_delivery: z.nextDelivery,
      observations: z.observations,
      sort_order: i,
    }));
    const { error } = await db.from("delivery_zones").upsert(filas, { onConflict: "id" });
    if (avisarError("guardar zonas", error)) return false;
    const ids = normalizadas.map((z) => z.id);
    if (ids.length) {
      const { error: errorBorrado } = await db.from("delivery_zones").delete()
        .not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`);
      avisarError("borrar zonas quitadas", errorBorrado);
    }
    return true;
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

  const getCommerceContent = () => cache.content;

  async function saveCommerceContent(content) {
    cache.content = { ...cache.content, ...content };
    const filas = Object.entries(content).map(([key, value]) => ({ key, value: String(value ?? "") }));
    const { error } = await db.from("commerce_content").upsert(filas, { onConflict: "key" });
    return !avisarError("guardar textos", error);
  }

  const getFaqs = () => cache.faqs;

  async function saveFaqs(groups) {
    const normalizados = groups.map(normalizeFaqGroup);
    cache.faqs = normalizados;
    const filas = normalizados.map((g, i) => ({ id: g.id, icon: g.icon, title: g.title, sort_order: i }));
    const { error } = await db.from("faq_groups").upsert(filas, { onConflict: "id" });
    if (avisarError("guardar preguntas", error)) return false;

    const ids = normalizados.map((g) => g.id);
    if (ids.length) {
      const { error: errorBorrado } = await db.from("faq_groups").delete()
        .not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`);
      avisarError("borrar grupos quitados", errorBorrado);
    }
    // Las preguntas de cada grupo se reemplazan enteras: no tienen id propio
    // en el panel y nada las referencia.
    for (const grupo of normalizados) {
      await db.from("faq_items").delete().eq("group_id", grupo.id);
      if (!grupo.items.length) continue;
      const items = grupo.items.map((item, i) => ({
        group_id: grupo.id, question: item.q, answer: item.a, sort_order: i,
      }));
      const { error: errorItems } = await db.from("faq_items").insert(items);
      avisarError("guardar preguntas del grupo", errorItems);
    }
    return true;
  }

  function normalizeFaqGroup(group) {
    return {
      id: String(group.id || `faq-${Date.now()}`).trim(),
      icon: String(group.icon || "producto").trim(),
      title: String(group.title || "").trim(),
      items: (Array.isArray(group.items) ? group.items : [])
        .map((item) => ({ q: String(item.q || "").trim(), a: String(item.a || "").trim() }))
        .filter((item) => item.q),
    };
  }

  const getReviews = () => cache.reviews;

  async function saveReviews(reviews) {
    const normalizadas = reviews.map(normalizeReview);
    cache.reviews = normalizadas;
    const filas = normalizadas.map((r, i) => ({
      id: r.id, name: r.name, rating: r.rating, text: r.text,
      review_date: r.date || null, source: r.source, published: r.published, sort_order: i,
    }));
    const { error } = await db.from("reviews").upsert(filas, { onConflict: "id" });
    if (avisarError("guardar reseñas", error)) return false;
    const ids = normalizadas.map((r) => r.id);
    if (ids.length) {
      const { error: errorBorrado } = await db.from("reviews").delete()
        .not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`);
      avisarError("borrar reseñas quitadas", errorBorrado);
    }
    return true;
  }

  function normalizeReview(review) {
    return {
      id: String(review.id || `res-${Date.now()}`).trim(),
      name: String(review.name || "").trim(),
      rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
      text: String(review.text || "").trim(),
      // Vacía cuando no se conoce: se muestra solo si el panel la carga.
      date: String(review.date || "").trim(),
      source: review.source === "Google" ? "Google" : "Tienda",
      published: review.published === true,
    };
  }

  const updateReview = (id, patch) =>
    saveReviews(cache.reviews.map((review) => (review.id === id ? { ...review, ...patch } : review)));

  const deleteReview = (id) => saveReviews(cache.reviews.filter((review) => review.id !== id));

  /* ---------- Carrito y comprador (siguen en este navegador) ---------- */

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

  /* Datos de quien compra: se recuerdan para no reescribirlos en cada pedido.
     Quedan solo en este navegador. */
  function getBuyer() {
    try {
      return JSON.parse(localStorage.getItem(BUYER_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveBuyer(buyer) {
    localStorage.setItem(BUYER_KEY, JSON.stringify(buyer));
  }

  /* ---------- Pedidos ---------- */

  const getOrders = () => cache.orders;
  const getPaymentMethods = () => cache.paymentMethods;

  /* El pedido de la tienda entra por una función de la base: el precio lo pone
     el catálogo del lado del servidor, así nadie puede mandar uno inventado
     desde la consola del navegador, y el costo nunca viaja hasta acá. */
  async function addOrder(order) {
    const items = (order.items || []).map((item) => ({
      variantId: item.variantId || null,
      code: item.code || "",
      name: item.name || "",
      options: item.opciones || item.options || "",
      quantity: item.cantidad || item.quantity || 1,
      aPedido: item.precio === null || item.price === null,
    }));
    const { data, error } = await db.rpc("create_order", {
      payload: { cliente: order.cliente, items },
    });
    if (avisarError("registrar pedido", error)) return null;
    return { numero: `#${String(data).padStart(4, "0")}`, number: data };
  }

  /* Venta del mostrador: la carga el panel, con precio editable porque en el
     rubro se negocia. El costo lo completa la base desde el catálogo. */
  async function addLocalOrder({ cliente, items, notas, flete, fletePorcentaje, estado }) {
    const { data: pedido, error } = await db
      .from("orders")
      .insert({
        channel: "local",
        /* Entra siempre como "Nuevo" y el estado real se aplica más abajo, ya
           con los ítems cargados. El trigger que descuenta el stock mira el
           cambio de estado: si el pedido naciera "Entregado" —antes de que
           existan los ítems— no habría nada que descontar. */
        customer_name: cliente?.nombre || "",
        customer_phone: cliente?.telefono || "",
        delivery_mode: cliente?.modo || "Retiro en el local",
        locality: cliente?.localidad || "",
        address: cliente?.direccion || "",
        comments: cliente?.comentarios || "",
        notes: notas || "",
        shipping_amount: Math.max(0, Number(flete) || 0),
        shipping_percent: Math.min(100, Math.max(0, Number(fletePorcentaje) || 0)),
      })
      .select("id, number")
      .single();
    if (avisarError("cargar venta del local", error)) return null;

    const filas = (items || []).map((item, i) => ({
      order_id: pedido.id,
      variant_id: item.variantId || null,
      product_code: item.code || "",
      product_name: item.name || "",
      options: item.opciones || "",
      quantity: Number(item.cantidad) || 1,
      unit_price: item.precio === null || item.precio === "" ? null : Number(item.precio),
      sort_order: i,
    }));
    if (filas.length) {
      const { error: errorItems } = await db.from("order_items").insert(filas);
      if (avisarError("cargar los productos de la venta", errorItems)) return null;
    }
    if (estado === "Entregado") {
      // Entregar es marcar las líneas: es lo que descuenta el stock.
      const { error: errorEntrega } = await db.rpc("set_order_delivery", { p_order: pedido.id, p_full: true });
      avisarError("marcar la venta como entregada", errorEntrega);
    } else if (MANUAL_ORDER_STATES.includes(estado) && estado !== "Nuevo") {
      const { error: errorEstado } = await db.from("orders").update({ delivery_status: estado }).eq("id", pedido.id);
      avisarError("marcar el estado de la venta", errorEstado);
    }
    await recargarPedidosYCatalogo();
    return { numero: `#${String(pedido.number).padStart(4, "0")}`, number: pedido.number };
  }

  /* Entrar o salir de "Entregado" mueve el stock desde un trigger, así que el
     catálogo que tiene el navegador queda viejo. Sin releerlo, editar ese
     producto lo guardaría con el stock de antes de la venta y el descuento se
     perdería. Lo mismo al cargar una venta o al borrar un pedido entregado. */
  async function recargarPedidosYCatalogo() {
    await Promise.all([cargarPedidos(), cargarProductos()]);
    window.dispatchEvent(new CustomEvent("store-products-updated"));
  }

  /* Vuelca una venta vieja de la planilla del negocio. Dos diferencias a
     propósito con una venta del mostrador:

     - El estado se escribe directo, sin pasar por "Nuevo". Son ventas que ya
       ocurrieron: el stock de hoy ya las tiene descontadas y volver a
       descontarlas dejaría el inventario en negativo.
     - El cobro se registra con la fecha de la planilla, no con la de hoy, así
       el resumen de cada mes cierra con lo que de verdad entró ese mes. */
  async function addImportedOrder(pedido) {
    const estado = MANUAL_ORDER_STATES.includes(pedido.estado) ? pedido.estado : "Entregado";
    const { data: fila, error } = await db
      .from("orders")
      .insert({
        channel: "local",
        delivery_status: estado,
        customer_name: pedido.cliente || "",
        customer_phone: pedido.telefono || "",
        delivery_mode: pedido.modo || "",
        locality: pedido.localidad || "",
        address: pedido.direccion || "",
        notes: pedido.notas || "",
        shipping_amount: Math.max(0, Number(pedido.flete) || 0),
        shipping_percent: Math.min(100, Math.max(0, Number(pedido.fletePorcentaje) || 0)),
        ...(pedido.fecha ? { created_at: pedido.fecha } : {}),
      })
      .select("id, number")
      .single();
    if (avisarError("importar el pedido", error)) return null;

    const items = (pedido.items || []).map((item, i) => ({
      order_id: fila.id,
      variant_id: item.variantId || null,
      product_code: item.code || "",
      product_name: item.name || "",
      options: item.opciones || "",
      quantity: Number(item.cantidad) || 1,
      unit_price: Number(item.precio) || 0,
      sort_order: i,
      /* Nace entregada, y por eso mismo no mueve el stock: el trigger de la base
         solo reacciona al CAMBIO de lo entregado, nunca al alta. Es una venta
         que ya ocurrió y cuyo inventario la realidad ya descontó. */
      delivered_quantity: estado === "Entregado" ? (Number(item.cantidad) || 1) : 0,
    }));
    if (items.length) {
      const { error: errorItems } = await db.from("order_items").insert(items);
      if (avisarError("importar los productos del pedido", errorItems)) return null;
    }
    if (Number(pedido.cobrado) > 0) {
      const metodo = cache.paymentMethods.find(
        (m) => m.name.toLowerCase() === String(pedido.medio || "").trim().toLowerCase()
      );
      const { error: errorPago } = await db.from("payments").insert({
        order_id: fila.id,
        method_id: metodo?.id || null,
        method_name: metodo ? metodo.name : String(pedido.medio || "").trim(),
        amount: Number(pedido.cobrado),
        paid_at: pedido.fechaCobro || pedido.fecha?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        notes: pedido.recibo || "",
      });
      avisarError("importar el cobro del pedido", errorPago);
    }
    return fila.number;
  }

  async function importOrders(pedidos) {
    const numeros = [];
    for (const pedido of pedidos) {
      const numero = await addImportedOrder(pedido);
      if (numero) numeros.push(numero);
    }
    await cargarPedidos();
    return numeros;
  }

  /* El estado de entrega ya no se escribe a mano: lo calcula la base a partir de
     cuánto se entregó de cada línea, y el stock sale de ahí. Marcar el pedido
     entero es marcar todas sus líneas de una. */
  async function updateOrderState(id, estado) {
    /* No se elige: es el resultado de tener algunas líneas entregadas y otras
       no. Aceptarlo acá dejaría el pedido en "Entrega parcial" sin nada
       entregado, que es justo la contradicción que este diseño evita. */
    if (estado === "Entrega parcial") return true;
    if (estado === "Entregado") {
      /* Un pedido cancelado no deja que sus líneas le cambien el estado —si no,
         cualquier retoque lo resucitaría solo—, así que primero sale de
         cancelado y recién después se marca la entrega. */
      const { error: errorPrevio } = await db.from("orders")
        .update({ delivery_status: "Confirmado" }).eq("id", id).eq("delivery_status", "Cancelado");
      if (avisarError("reabrir el pedido cancelado", errorPrevio)) return false;
      const { error } = await db.rpc("set_order_delivery", { p_order: id, p_full: true });
      if (avisarError("marcar el pedido como entregado", error)) return false;
    } else {
      // Nuevo, Confirmado y Cancelado significan que no hay nada entregado:
      // desmarcar las líneas es lo que devuelve el stock.
      const { error } = await db.rpc("set_order_delivery", { p_order: id, p_full: false });
      if (avisarError("desmarcar la entrega del pedido", error)) return false;
      const { error: errorEstado } = await db.from("orders").update({ delivery_status: estado }).eq("id", id);
      if (avisarError("cambiar el estado del pedido", errorEstado)) return false;
    }
    await recargarPedidosYCatalogo();
    return true;
  }

  /* Entrega parcial: cuántas unidades de esta línea salieron. La base ajusta el
     stock por la diferencia y recalcula el estado del pedido. */
  async function setItemDelivered(itemId, cantidad) {
    const { error } = await db.from("order_items")
      .update({ delivered_quantity: Math.max(0, Math.floor(Number(cantidad) || 0)) })
      .eq("id", itemId);
    if (avisarError("marcar la entrega del producto", error)) return false;
    await recargarPedidosYCatalogo();
    return true;
  }

  /* El flete y las notas del pedido. El total lo recalcula la base: acá se
     mandan los dos conceptos de flete y ella los suma a la mercadería. */
  async function updateOrder(id, { flete, fletePorcentaje, notas } = {}) {
    const patch = {};
    if (flete !== undefined) patch.shipping_amount = Math.max(0, Number(flete) || 0);
    if (fletePorcentaje !== undefined) patch.shipping_percent = Math.min(100, Math.max(0, Number(fletePorcentaje) || 0));
    if (notas !== undefined) patch.notes = String(notas || "");
    if (!Object.keys(patch).length) return true;
    const { error } = await db.from("orders").update(patch).eq("id", id);
    if (avisarError("guardar el pedido", error)) return false;
    await cargarPedidos();
    return true;
  }

  async function deleteOrder(id) {
    const { error } = await db.from("orders").delete().eq("id", id);
    if (avisarError("borrar pedido", error)) return false;
    await recargarPedidosYCatalogo();
    return true;
  }

  /* Un cobro. El estado de pago y el saldo los calcula la base a partir de
     esto: no hay un campo "pagado" que se pueda contradecir con los montos. */
  async function addPayment(orderId, { methodId, monto, fecha, notas }) {
    const { error } = await db.from("payments").insert({
      order_id: orderId,
      method_id: methodId || null,
      amount: Number(monto),
      paid_at: fecha || new Date().toISOString().slice(0, 10),
      notes: notas || "",
    });
    if (avisarError("registrar el cobro", error)) return false;
    await cargarPedidos();
    return true;
  }

  async function deletePayment(paymentId) {
    const { error } = await db.from("payments").delete().eq("id", paymentId);
    if (avisarError("borrar el cobro", error)) return false;
    await cargarPedidos();
    return true;
  }

  /* Los medios no se borran nunca: cada cobro guarda a qué medio se hizo y con
     qué comisión, así que borrar uno rompería el historial de un mes cerrado.
     El que deja de usarse se desactiva y no aparece más al cobrar. */
  async function savePaymentMethods(methods) {
    const fila = (m, i) => ({
      name: String(m.name || "").trim(),
      commission_percent: Math.min(100, Math.max(0, Number(m.commission) || 0)),
      active: m.active !== false,
      sort_order: i,
    });
    const existentes = methods.map((m, i) => (m.id ? { id: m.id, ...fila(m, i) } : null)).filter(Boolean);
    const nuevos = methods.map((m, i) => (m.id ? null : fila(m, i))).filter((f) => f && f.name);

    if (existentes.length) {
      const { error } = await db.from("payment_methods").upsert(existentes, { onConflict: "id" });
      if (avisarError("guardar medios de pago", error)) return false;
    }
    if (nuevos.length) {
      const { error } = await db.from("payment_methods").insert(nuevos);
      if (avisarError("agregar medio de pago", error)) return false;
    }
    await cargarMediosDePago();
    return true;
  }

  /* ---------- Imágenes ---------- */

  /* Sube la imagen al bucket y devuelve su URL. Lo importante es lo que NO hace:
     no la guarda dentro de la fila. Una foto en base64 dentro de `commerce_content`
     viajaría entera en cada visita a cada página del sitio, porque el contenido
     lo carga el encabezado común. Así, el navegador la baja aparte y la cachea. */
  async function uploadMedia(file, carpeta = "banner") {
    const extension = ({ "image/png": "png", "image/webp": "webp" })[file.type] || "jpg";
    const ruta = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await db.storage.from("medios").upload(ruta, file, {
      cacheControl: "31536000",
      contentType: file.type,
    });
    if (avisarError("subir la imagen", error)) return null;
    return db.storage.from("medios").getPublicUrl(ruta).data.publicUrl;
  }

  /* ---------- Utilidades que ya usaba el resto de la aplicación ---------- */

  function splitOptions(value) {
    if (Array.isArray(value)) return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
    return [...new Set(String(value || "").split(/\s*[;|/]\s*|\s*,\s*/).map((item) => item.trim()).filter(Boolean))];
  }

  function normalizeProduct(product) {
    const legacyMeasures = splitOptions(product.measures ?? product.measure);
    const variants = Array.isArray(product.variants) && product.variants.length
      ? product.variants
      : legacyMeasures.map((measure) => ({ measure, price: product.price }));
    /* Tres estados, no dos, y la diferencia importa:
         undefined → el que llama no sabe nada de este campo (el editor viejo,
                     un Excel sin la columna). Se deja pasar tal cual para que
                     saveProducts conserve lo que ya está guardado.
         null      → vino vacío a propósito: sin cargar.
         número    → el valor.
       Aplastar undefined contra null acá hacía que importar una planilla sin
       columna de costo borrara todos los costos. */
    const opcional = (valor) => {
      if (valor === undefined) return undefined;
      if (valor === null || valor === "") return null;
      return Math.max(0, Number(valor) || 0);
    };
    const normalizedVariants = variants.map((variant) => ({
      id: variant.id,
      measure: String(variant.measure || "").trim(),
      price: Math.max(0, Number(variant.price) || 0),
      promoPrice: opcional(variant.promoPrice),
      cost: opcional(variant.cost),
      stock: variant.stock === undefined ? undefined : Math.max(0, Number(variant.stock) || 0),
    })).filter((variant) => variant.measure);
    if (!normalizedVariants.length && Number(product.price) >= 0) {
      normalizedVariants.push({ measure: "Única", price: Math.max(0, Number(product.price) || 0), promoPrice: null, cost: null, stock: 0 });
    }
    const images = Array.isArray(product.images)
      ? product.images.map(String).map((image) => image.trim()).filter(Boolean)
      : product.image ? [String(product.image).trim()] : [];
    if (!images.length && product.image) images.push(String(product.image).trim());
    return {
      id: product.id,
      code: String(product.code || "").trim().toUpperCase(),
      category: String(product.category || "").trim(),
      name: String(product.name || "").trim(),
      detail: String(product.detail || "").trim(),
      variants: normalizedVariants,
      measures: normalizedVariants.map((variant) => variant.measure),
      hands: splitOptions(product.hands ?? product.hand),
      colors: splitOptions(product.colors ?? product.color),
      price: normalizedVariants.length ? Math.min(...normalizedVariants.map(precioEfectivo)) : 0,
      images,
      image: images[0] || "",
      active: product.active !== false,
      featured: product.featured === true,
    };
  }

  /* Copia de seguridad: sigue existiendo aunque los datos ya no vivan en el
     navegador. Ahora sirve para tener un respaldo propio y para llevar una
     configuración de un proyecto a otro al re-brandear la plantilla. */
  function exportBackup() {
    return {
      formato: "aac-backup",
      version: 2,
      fecha: new Date().toISOString(),
      productos: cache.products,
      zonas: cache.zones,
      textos: cache.content,
      configuracion: cache.settings,
      pedidos: cache.orders,
      preguntas: cache.faqs,
      resenas: cache.reviews,
      mediosDePago: cache.paymentMethods,
    };
  }

  async function importBackup(data) {
    if (!data || data.formato !== "aac-backup") {
      throw new Error("El archivo no es una copia de seguridad de esta tienda.");
    }
    const resumen = { productos: 0, zonas: 0, preguntas: 0, resenas: 0, textos: false, configuracion: false };
    if (Array.isArray(data.productos)) {
      await saveProducts(data.productos);
      resumen.productos = data.productos.length;
    }
    if (Array.isArray(data.zonas)) {
      await saveDeliveryZones(data.zonas);
      resumen.zonas = data.zonas.length;
    }
    if (data.textos && typeof data.textos === "object") {
      await saveCommerceContent(data.textos);
      resumen.textos = true;
    }
    if (data.configuracion && typeof data.configuracion === "object") {
      await saveSettings(data.configuracion);
      resumen.configuracion = true;
    }
    if (Array.isArray(data.preguntas)) {
      await saveFaqs(data.preguntas);
      resumen.preguntas = data.preguntas.length;
    }
    if (Array.isArray(data.resenas)) {
      await saveReviews(data.resenas);
      resumen.resenas = data.resenas.length;
    }
    // Los pedidos no se importan: son el historial real del negocio y
    // pisarlos con los de un archivo viejo haría perder cobros registrados.
    return resumen;
  }

  window.Store = {
    init,
    recargar,
    signIn,
    signOut,
    getSession,
    isAdmin,
    categories,
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
    getFaqs,
    saveFaqs,
    getReviews,
    saveReviews,
    updateReview,
    deleteReview,
    getCart,
    saveCart,
    getBuyer,
    saveBuyer,
    ORDER_STATES,
    MANUAL_ORDER_STATES,
    PAYMENT_STATES,
    getOrders,
    resumenEntrega,
    addOrder,
    addLocalOrder,
    importOrders,
    updateOrderState,
    setItemDelivered,
    updateOrder,
    uploadMedia,
    deleteOrder,
    addPayment,
    deletePayment,
    getPaymentMethods,
    savePaymentMethods,
    splitOptions,
    normalizeProduct,
    precioEfectivo,
    enOferta,
    getFactoryDefaults,
    /* Ojo: con los datos en la nube esto pisa el catálogo real del negocio,
       no una copia local. El panel tiene que confirmarlo antes de llamarlo. */
    resetProducts: () => {
      const originales = getFactoryDefaults("products");
      if (!originales) return Promise.resolve(false);
      return saveProducts(originales);
    },
  };
})();
