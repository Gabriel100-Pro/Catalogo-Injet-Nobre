/* ==========================================================================
   INJET NOBRE – COMPORTAMENTO
   Cada bloco é um módulo pequeno (init*). Tudo aqui funciona sem GSAP;
   animations.js só acrescenta movimento por cima.
   Eventos disparados (para animações/analytics):
     injet:filter        { filter }
     injet:modal-open    { product, content }
     injet:modal-change  { product, content }
     injet:vitrine       { index }
     injet:line-change   { line, product, item }
   O orçamento de atacado fica em quote.js.
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;
  const products = R.products;
  const config = window.SITE_CONFIG || {};

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  const findIndex = (ref) => products.findIndex((p) => p.ref === ref);

  /** Aplica cor do painel / contorno / tema de um produto num elemento. */
  function setPanel(el, product) {
    el.style.setProperty("--panel", product.painel || "#FF6A13");
    el.dataset.contorno = product.contorno || "light";
    el.dataset.tema = product.tema || "light";
  }

  /* ---------- Fotos da fábrica: carrega; se faltar, mantém o quadro provisório ---------- */
  function hydrateImages(root = document) {
    $$("img[data-src]", root).forEach((img) => {
      const holder = img.closest("[data-art]");
      img.addEventListener("load", () => holder && holder.classList.add("has-image"), { once: true });
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
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

  /* ---------- Vitrine de linha (tela cheia, com seletor) ---------- */
  function initSpotlights() {
    $$("[data-spotlight]").forEach((el) => {
      const line = el.dataset.spotlight;
      const list = products.filter((p) => p.linha === line);
      if (!list.length) {
        const region = el.closest(".product-line");
        if (region) region.hidden = true;
        return;
      }
      el.innerHTML = R.spotlightHTML(list, line, {
        word: el.dataset.word || line,
        lineName: el.dataset.lineName || line,
        picker: el.dataset.picker
      });
    });

    function select(line, ref) {
      const root = $(`[data-spotlight-root="${line}"]`);
      const product = R.findProduct(ref);
      if (!root || !product) return;
      const list = products.filter((p) => p.linha === line);

      let activeItem = null;
      $$("[data-swap-ref]", root).forEach((item) => {
        const on = item.dataset.swapRef === ref;
        item.classList.toggle("is-active", on);
        if (on) { item.removeAttribute("aria-hidden"); activeItem = item; }
        else item.setAttribute("aria-hidden", "true");
      });
      // Fundo: a camada da cor escolhida aparece por cima (opacidade)
      $$("[data-layer]", root).forEach((layer) => layer.classList.toggle("is-active", layer.dataset.layer === ref));
      setPanel(root, product);

      $$(`input[name="linha-${line}"]`, root).forEach((r) => (r.checked = r.value === ref));
      $$("[data-line-thumb]", root).forEach((t) => t.setAttribute("aria-pressed", String(t.value === ref)));
      const legend = $("[data-line-variant]", root);
      if (legend) legend.textContent = product.variante;
      $("[data-line-card]", root).innerHTML = R.lineCardHTML(product, list.length, $(`[data-spotlight="${line}"]`).dataset.lineName);

      emit("injet:line-change", { line, product, item: activeItem, root });
    }

    document.addEventListener("change", (e) => {
      const picker = e.target.closest("[data-line-picker]");
      if (picker && e.target.type === "radio") select(picker.dataset.linePicker, e.target.value);
    });
    document.addEventListener("click", (e) => {
      const thumb = e.target.closest("[data-line-thumb]");
      if (thumb) select(thumb.dataset.lineThumb, thumb.value);
    });
  }

  /* ---------- Destaque do hero ---------- */
  function initHero() {
    const el = $("#hero-feature");
    const featured = products.find((p) => p.destaque) || products[0];
    if (el && featured) el.innerHTML = R.heroHTML(featured);
  }

  /* ---------- Ofertas do mês: 3 maiores descontos (um por produto, não por cor) ---------- */
  function initOffers() {
    const list = $("#ofertas-lista");
    if (!list) return;
    const seen = new Set();
    const top = products
      .filter((p) => R.discount(p) > 0)
      .sort((a, b) => R.discount(b) - R.discount(a))
      .filter((p) => {
        const key = p.grupo || p.ref;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
    list.innerHTML = top.map(R.offerItemHTML).join("");
    const max = $("#ofertas-max");
    if (max && top[0]) max.textContent = `${R.discount(top[0])}%`;
    if (!top.length) $("#ofertas").hidden = true;
  }

  /* ---------- Monte seu kit vitrine ---------- */
  function initKit() {
    const refs = [];
    $$("[data-kit-item]").forEach((el) => {
      const product = R.findProduct(el.dataset.kitItem);
      if (!product) return;
      refs.push(product.ref);
      el.innerHTML = R.artHTML(product, { sizes: "(min-width: 960px) 30vw, 60vw" });
    });

    const list = $("[data-kit-list]");
    if (list) {
      list.innerHTML = refs.map((ref) => {
        const p = R.findProduct(ref);
        return `<li><span class="kit-dot" style="--dot: ${R.esc(p.cor)}" aria-hidden="true"></span>${R.esc(R.fullName(p))} <small>Ref. ${R.esc(p.ref)}</small></li>`;
      }).join("");
    }

    // Foto opcional de relógio (SITE_CONFIG.fotoRelogioKit)
    const watch = $("[data-kit-watch]");
    if (watch && config.fotoRelogioKit) {
      watch.addEventListener("load", () => { watch.hidden = false; $(".kit-stage").classList.add("has-watch"); }, { once: true });
      watch.addEventListener("error", () => watch.remove(), { once: true });
      watch.src = config.fotoRelogioKit;
    } else if (watch) {
      watch.remove();
    }

    const add = $("[data-kit-add]");
    if (add) {
      add.addEventListener("click", () => {
        if (!window.InjetQuote) return;
        refs.forEach((ref) => window.InjetQuote.add(ref, 1));
        window.InjetQuote.open();
      });
    }
  }

  /* ---------- Vitrine: carrossel (base) ----------
     No celular ou com movimento reduzido é um carrossel com scroll-snap.
     No desktop, animations.js transforma em rolagem horizontal presa e
     define vitrine.pinnedGoTo para que as setas rolem a página. */
  const vitrine = { index: 0, count: 0, pinnedGoTo: null };
  window.InjetVitrine = vitrine;

  function initVitrine() {
    const section = $("#vitrine");
    const track = $("#vitrine-track");
    const viewport = $("#vitrine-viewport");
    const bg = $("#vitrine-bg");
    if (!track || !viewport) return;

    track.innerHTML = products.map((p, i) => R.slideHTML(p, i, products.length)).join("");
    // Uma camada de cor por slide; a troca é uma transição de opacidade
    if (bg) bg.innerHTML = products.map((p) => `<span class="vitrine-layer" style="--panel: ${R.esc(p.painel)}"></span>`).join("");
    const layers = bg ? $$(".vitrine-layer", bg) : [];
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
      name.textContent = products[i] ? R.fullName(products[i]) : "";
      prev.disabled = i === 0;
      next.disabled = i === vitrine.count - 1;
      slides.forEach((s, n) => s.classList.toggle("is-current", n === i));
      layers.forEach((l, n) => l.classList.toggle("is-active", n === i));
      if (products[i]) setPanel(section, products[i]);
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
    $$('a[href="#linha-estojos"], a[href="#linha-expositores"]').forEach((a) => {
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

    const hoverZoom = window.matchMedia("(hover: hover) and (pointer: fine)");

    // Zoom ao passar o mouse: só transform (escala) + origem no cursor
    function setupZoom() {
      const frame = $("[data-zoom]", content);
      const zoom = frame && $(".stage-zoom", frame);
      if (!frame || !zoom || !hoverZoom.matches || !$(".pic", frame)) return;
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

    function render(index, { focus } = {}) {
      const product = products[index];
      if (!product) return null;
      currentIndex = index;
      content.innerHTML = R.modalHTML(product, index, products.length);
      setupZoom();
      if (focus) {
        const el = $(focus, content);
        if (el) el.focus();
      }
      return product;
    }

    function open(ref) {
      const index = findIndex(ref);
      if (index < 0) return;
      lastFocus = document.activeElement;
      const product = render(index);
      if (!modal.open) modal.showModal();
      document.body.classList.add("is-modal-open");
      $(".modal-close", modal).focus();
      emit("injet:modal-open", { product, content });
    }

    function show(index, focus) {
      const product = render(index, { focus });
      if (product) emit("injet:modal-change", { product, content });
    }

    const step = (dir) => show((currentIndex + dir + products.length) % products.length, `[data-modal-step="${dir}"]`);

    modal.addEventListener("close", () => {
      document.body.classList.remove("is-modal-open");
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) return modal.close(); // clique no fundo escuro
      const stepBtn = e.target.closest("[data-modal-step]");
      if (stepBtn) return step(Number(stepBtn.dataset.modalStep));
      const color = e.target.closest("[data-modal-goto]");
      if (color) show(findIndex(color.dataset.modalGoto), `[data-modal-goto="${color.dataset.modalGoto}"]`);
    });
    $$("[data-close-modal]", modal).forEach((b) => b.addEventListener("click", () => modal.close()));

    // Setas do teclado trocam de produto (fora dos campos de quantidade)
    modal.addEventListener("keydown", (e) => {
      if (e.target.matches("input")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    });

    // Delegação: qualquer [data-open-product] ou clique no card abre o modal
    document.addEventListener("click", (e) => {
      // Links, botões de orçamento, quantidade e seletores têm ação própria
      if (e.target.closest("a, [data-quote-add], [data-quote-open], [data-buy], label, input")) return;
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
    initKit();
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
