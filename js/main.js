/* ==========================================================================
   INJET NOBRE – COMPORTAMENTO
   Cada bloco é um módulo pequeno (init*). Tudo aqui funciona sem GSAP;
   animations.js só acrescenta movimento por cima.
   Eventos disparados (para animações/analytics):
     injet:filter        { filter }
     injet:modal-open    { product, content }
     injet:modal-change  { product, content }
     injet:vitrine       { index }
   O orçamento de atacado fica em quote.js.
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;
  const I = window.InjetIllustrations;
  const products = window.PRODUCTS || [];
  const config = window.SITE_CONFIG || {};

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  const findIndex = (ref) => products.findIndex((p) => p.ref === ref);

  /* ---------- Imagens: carrega a foto; se faltar, mantém a ilustração ---------- */
  function hydrateImages(root = document) {
    $$("img[data-src]", root).forEach((img) => {
      const holder = img.closest("[data-art]");
      img.addEventListener("load", () => holder && holder.classList.add("has-image"), { once: true });
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
  }

  /* Verifica (uma vez) se cada foto existe, para montar a galeria do modal */
  const photoCache = new Map();
  function photoExists(src) {
    if (!photoCache.has(src)) {
      photoCache.set(src, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      }));
    }
    return photoCache.get(src);
  }

  async function galleryFor(product) {
    const srcs = R.photoList(product);
    const ok = await Promise.all(srcs.map(photoExists));
    const photos = srcs
      .filter((_, i) => ok[i])
      .map((src, i) => ({ type: "img", src, label: `${product.nome}, foto ${i + 1}` }));
    if (photos.length) return photos;

    // Sem fotos: usa as variações de cor da ilustração
    if (I && I.has(product.ref)) {
      return I.variants(product.ref).map((v) => ({
        type: "svg",
        html: I.draw(product.ref, v),
        label: `Cor ilustrativa: ${I.palettes[v].nome}`
      }));
    }
    return [{ type: "svg", html: `<span class="media-placeholder-name">${R.esc(product.nome)}</span>`, label: product.nome }];
  }

  /* ---------- Grades de produtos ---------- */
  function initGrids() {
    $$("[data-grid]").forEach((grid) => {
      const line = grid.dataset.grid;
      const html = products.filter((p) => p.linha === line).map(R.cardHTML).join("");
      const anchor = $("[data-tile]", grid); // tiles fixos no fim da grade
      if (anchor) anchor.insertAdjacentHTML("beforebegin", html);
      else grid.insertAdjacentHTML("beforeend", html);
    });
  }

  /* ---------- Destaques de linha (tela cheia) ---------- */
  function initSpotlights() {
    $$("[data-spotlight]").forEach((el) => {
      const line = el.dataset.spotlight;
      const list = products.filter((p) => p.linha === line);
      const featured = list.find((p) => p.destaqueLinha) || list[0];
      if (featured) el.innerHTML = R.spotlightHTML(featured, line, list.length);
    });
  }

  /* ---------- Destaque do hero ---------- */
  function initHero() {
    const el = $("#hero-feature");
    const featured = products.find((p) => p.destaque) || products[0];
    if (el && featured) el.innerHTML = R.heroHTML(featured);
  }

  /* ---------- Ofertas do mês: 3 maiores descontos ---------- */
  function initOffers() {
    const list = $("#ofertas-lista");
    if (!list) return;
    const top = products
      .filter((p) => R.discount(p) > 0)
      .sort((a, b) => R.discount(b) - R.discount(a))
      .slice(0, 3);
    list.innerHTML = top.map(R.offerItemHTML).join("");
  }

  /* ---------- Vitrine: carrossel (base) ----------
     No celular ou com movimento reduzido é um carrossel com scroll-snap.
     No desktop, animations.js transforma em rolagem horizontal presa e
     define vitrine.pinnedGoTo para que as setas rolem a página. */
  const vitrine = { index: 0, count: 0, pinnedGoTo: null };
  window.InjetVitrine = vitrine;

  function initVitrine() {
    const track = $("#vitrine-track");
    const viewport = $("#vitrine-viewport");
    if (!track || !viewport) return;

    track.innerHTML = products.map((p, i) => R.slideHTML(p, i, products.length)).join("");
    vitrine.count = products.length;
    $("#vitrine-total").textContent = R.pad(products.length);

    const current = $("#vitrine-current");
    const name = $("#vitrine-name");
    const bar = $("#vitrine-bar");
    const prev = $('[data-vitrine-step="-1"]');
    const next = $('[data-vitrine-step="1"]');
    const slides = $$(".slide", track);

    vitrine.update = (i, progress) => {
      i = Math.max(0, Math.min(vitrine.count - 1, i));
      const p = progress ?? (vitrine.count > 1 ? i / (vitrine.count - 1) : 1);
      if (bar) bar.style.transform = `scaleX(${Math.max(0.04, p)})`;
      if (i === vitrine.index && vitrine.ready) return;
      vitrine.ready = true;
      vitrine.index = i;
      current.textContent = R.pad(i + 1);
      name.textContent = products[i] ? products[i].nome : "";
      prev.disabled = i === 0;
      next.disabled = i === vitrine.count - 1;
      slides.forEach((s, n) => s.classList.toggle("is-current", n === i));
      emit("injet:vitrine", { index: i });
    };

    vitrine.goTo = (i) => {
      i = Math.max(0, Math.min(vitrine.count - 1, i));
      if (vitrine.pinnedGoTo) return vitrine.pinnedGoTo(i);
      viewport.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: "smooth" });
    };

    // Carrossel: índice segue a rolagem horizontal
    let ticking = false;
    viewport.addEventListener("scroll", () => {
      if (vitrine.pinnedGoTo || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const step = slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : viewport.clientWidth;
        const max = viewport.scrollWidth - viewport.clientWidth;
        const i = viewport.scrollLeft >= max - 4 ? vitrine.count - 1 : Math.round(viewport.scrollLeft / step);
        vitrine.update(i);
        ticking = false;
      });
    }, { passive: true });

    $$("[data-vitrine-step]").forEach((btn) =>
      btn.addEventListener("click", () => vitrine.goTo(vitrine.index + Number(btn.dataset.vitrineStep)))
    );

    // Navegar por teclado (Tab) até um slide fora da tela o traz para a vista
    track.addEventListener("focusin", (e) => {
      const slide = e.target.closest(".slide");
      if (slide && Number(slide.dataset.index) !== vitrine.index) vitrine.goTo(Number(slide.dataset.index));
    });

    vitrine.update(0);
  }

  /* ---------- Sobre a fábrica: números + galeria ---------- */
  function initFactory() {
    const stats = $("#fabrica-numeros");
    const gallery = $("#fabrica-galeria");
    if (stats) stats.innerHTML = (config.numerosFabrica || []).map(R.statHTML).join("");
    if (gallery) gallery.innerHTML = (config.fotosFabrica || []).map(R.factoryPhotoHTML).join("");
  }

  /* ---------- Filtro por linha ---------- */
  function initFilter() {
    const buttons = $$(".filter-btn");
    const lines = $$("[data-line].product-line");
    const status = $("#filtro-status");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        lines.forEach((line) => {
          line.hidden = filter !== "todos" && line.dataset.line !== filter;
        });
        const count = filter === "todos" ? products.length : products.filter((p) => p.linha === filter).length;
        if (status) status.textContent = `Mostrando ${count} produtos (${btn.textContent.trim()}).`;
        emit("injet:filter", { filter });
      });
    });

    // Links do menu para uma linha específica resetam o filtro
    $$('a[href="#linha-utilidades"], a[href="#linha-relojoaria"]').forEach((a) => {
      a.addEventListener("click", () => {
        const target = $(a.getAttribute("href"));
        if (target && target.hidden) $('.filter-btn[data-filter="todos"]').click();
      });
    });
  }

  /* ---------- Modal showcase ---------- */
  function initModal() {
    const modal = $("#product-modal");
    const content = $("#modal-content");
    if (!modal || !content) return;
    let lastFocus = null;
    let currentIndex = -1;
    let requestId = 0;

    const hoverZoom = window.matchMedia("(hover: hover) and (pointer: fine)");

    function setupGallery() {
      const items = $$(".stage-item", content);
      const thumbs = $$(".thumb", content);
      thumbs.forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const n = Number(thumb.dataset.thumb);
          thumbs.forEach((t) => t.setAttribute("aria-pressed", String(t === thumb)));
          items.forEach((item, i) => {
            item.classList.toggle("is-active", i === n);
            if (i === n) item.removeAttribute("aria-hidden");
            else item.setAttribute("aria-hidden", "true");
          });
          emit("injet:gallery-change", { item: items[n] });
        });
      });

      // Zoom ao passar o mouse: só transform (escala) + origem no cursor
      const frame = $("[data-zoom]", content);
      const zoom = frame && $(".stage-zoom", frame);
      if (!frame || !zoom || !hoverZoom.matches) return;
      frame.classList.add("can-zoom");
      frame.addEventListener("pointermove", (e) => {
        const r = frame.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        zoom.style.transformOrigin = `${x}% ${y}%`;
        frame.classList.add("is-zoomed");
      });
      frame.addEventListener("pointerleave", () => frame.classList.remove("is-zoomed"));
    }

    async function render(index, { focusStep } = {}) {
      const product = products[index];
      if (!product) return false;
      const id = ++requestId;
      const gallery = await galleryFor(product);
      if (id !== requestId) return false; // outro produto foi pedido enquanto carregava
      currentIndex = index;
      content.innerHTML = R.modalHTML(product, index, products.length, gallery);
      setupGallery();
      if (focusStep) {
        const btn = $(`[data-modal-step="${focusStep}"]`, content);
        if (btn) btn.focus();
      }
      return product;
    }

    async function open(ref) {
      const index = findIndex(ref);
      if (index < 0) return;
      lastFocus = document.activeElement;
      const product = await render(index);
      if (!product) return;
      if (!modal.open) modal.showModal();
      document.body.classList.add("is-modal-open");
      $(".modal-close", modal).focus();
      emit("injet:modal-open", { product, content });
    }

    async function step(dir) {
      const index = (currentIndex + dir + products.length) % products.length;
      const product = await render(index, { focusStep: String(dir) });
      if (product) emit("injet:modal-change", { product, content });
    }

    modal.addEventListener("close", () => {
      document.body.classList.remove("is-modal-open");
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    });

    // Clique no fundo escuro fecha
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
      const stepBtn = e.target.closest("[data-modal-step]");
      if (stepBtn) step(Number(stepBtn.dataset.modalStep));
    });
    $$("[data-close-modal]", modal).forEach((b) => b.addEventListener("click", () => modal.close()));

    // Setas do teclado trocam de produto
    modal.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    });

    // Delegação: qualquer [data-open-product] ou clique no card abre o modal
    document.addEventListener("click", (e) => {
      // Links (WhatsApp) e botões de orçamento têm ação própria
      if (e.target.closest("a, [data-quote-add], [data-quote-open]")) return;
      if (modal.contains(e.target)) return;
      const trigger = e.target.closest("[data-open-product]");
      if (trigger) return open(trigger.dataset.openProduct);
      const card = e.target.closest(".card[data-ref]");
      if (card) open(card.dataset.ref);
    });
  }

  /* ---------- Menu mobile ---------- */
  function initNav() {
    const toggle = $(".nav-toggle");
    const nav = $("#menu-principal");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("is-nav-open", open);
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("is-nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", (e) => e.matches && setOpen(false));
  }

  /* ---------- Dados de contato vindos do SITE_CONFIG ---------- */
  function initContacts() {
    const map = {
      telefone: config.telefone && { href: `tel:+55${config.telefone.replace(/\D/g, "")}`, text: config.telefone },
      email: config.email && { href: `mailto:${config.email}`, text: config.email },
      instagram: config.instagram && { href: config.instagram },
      facebook: config.facebook && { href: config.facebook },
      whatsapp: config.whatsapp && { href: `https://wa.me/${config.whatsapp}` }
    };
    $$("[data-config]").forEach((el) => {
      const data = map[el.dataset.config];
      if (!data) return;
      el.href = data.href;
      if (data.text) el.textContent = data.text;
    });

    const atacado = $("#atacado-whatsapp");
    if (atacado) atacado.href = R.whatsappLink(config.mensagemAtacado || "Olá! Quero saber sobre o atacado.");

    if (config.catalogoPdf) $$("[data-pdf]").forEach((a) => (a.href = config.catalogoPdf));

    const ano = $("#ano");
    if (ano) ano.textContent = new Date().getFullYear();
  }

  function init() {
    initHero();
    initVitrine();
    initSpotlights();
    initGrids();
    initOffers();
    initFactory();
    hydrateImages();
    initFilter();
    initModal();
    initNav();
    initContacts();
    document.documentElement.classList.add("js-ready");
  }

  // O script fica no fim do <body>: o HTML acima já existe, então monta na hora
  // (sem esperar o download do GSAP).
  init();
})();
