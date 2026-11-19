/* ==========================================================================
   INJET NOBRE – HEADER
   - Cápsula de vidro flutuante: fica compacta ao rolar, mostra o progresso
     da rolagem, some ao descer e volta ao subir.
   - Menu numerado com pílula deslizante (hover + seção visível / scroll-spy).
   - Mega menu "Produtos" (passar o mouse ou clicar; Esc fecha).
   - Busca Ctrl K / ⌘K: ↑ ↓ navegam, Enter abre o produto, Ctrl+Enter adiciona
     ao orçamento, Esc fecha.
   - Cor de destaque (--accent) = cor da caixa da hero 3D enquanto a hero está
     na tela; fora dela, laranja da marca.
   - Celular: cápsula mínima, menu em tela cheia e barra inferior de atalhos.
   Animações só em transform/opacity; com movimento reduzido ficam instantâneas.
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;
  const header = document.querySelector("[data-header]");
  if (!header || !R) return;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = () => window.matchMedia("(min-width: 1100px)").matches;
  const root = document.documentElement;
  const ORANGE = "#FF6A13";
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const hdr = $("[data-hdr]");
  const list = $("[data-hdr-list]");
  const pill = $("[data-hdr-pill]");
  const progress = $("[data-hdr-progress]");
  const megaToggle = $("[data-mega-toggle]");
  const mega = $("[data-mega]");
  const menuToggle = $("[data-menu-toggle]");
  const mmenu = $("[data-mmenu]");
  const search = $("#busca");

  if (isMac) {
    $$("[data-kbd]").forEach((k) => { k.textContent = "⌘ K"; });
    $$("[data-kbd-mod]").forEach((k) => { k.textContent = "⌘"; });
  }

  /* ---------- Produtos por linha (mega menu e atalhos do celular) ---------- */
  const byGroup = (g) => R.products.filter((p) => p.grupo === g);
  const minPrice = (arr) => Math.min(...arr.map((p) => p.preco));
  const estojos = byGroup("estojo-relogio");
  const caixas = byGroup("caixa-acrilico");
  const suportes = R.products.filter((p) => p.linha === "expositores");
  const LINES = [
    {
      num: "01", nome: "Estojo para relógio", href: "#linha-estojos", short: "Estojos",
      foto: (estojos.find((p) => p.variante === "Preto") || estojos[0]),
      preco: estojos.length ? minPrice(estojos) : 0, desde: false, cores: estojos.map((p) => ({ cor: p.cor, nome: p.variante }))
    },
    {
      num: "02", nome: "Caixa de acrílico", href: "#linha-acrilicos", short: "Acrílico",
      foto: caixas.find((p) => p.destaqueLinha) || caixas[0],
      preco: caixas.length ? minPrice(caixas) : 0, desde: caixas.length > 1
    },
    {
      num: "03", nome: "Suportes", href: "#linha-expositores", short: "Suportes",
      foto: suportes.find((p) => p.destaqueLinha) || suportes[0],
      preco: suportes.length ? minPrice(suportes) : 0, desde: suportes.length > 1
    }
  ].filter((l) => l.foto);
  const priceLabel = (l) => `${l.desde ? "a partir de " : ""}${R.formatPrice(l.preco)}`;

  $("[data-mega-cards]").innerHTML = LINES.map((l) => `
    <li>
      <a class="mega-card" href="${l.href}">
        <span class="mega-photo" aria-hidden="true">${R.pictureHTML(l.foto.imagem, "", { sizes: "180px" })}</span>
        <span class="hdr-num" aria-hidden="true">${l.num}</span>
        <strong class="mega-name">${R.esc(l.nome)}</strong>
        ${l.cores ? `<span class="mega-dots" role="img" aria-label="${l.cores.length} cores: ${R.esc(l.cores.map((c) => c.nome).join(", "))}">${l.cores.map((c) => `<i style="--dot: ${R.esc(c.cor)}"></i>`).join("")}</span>` : ""}
        <span class="mega-price">${R.esc(priceLabel(l))}</span>
      </a>
    </li>`).join("");

  $("[data-mmenu-shortcuts]").innerHTML = LINES.map((l) => `
    <li>
      <a class="mmenu-short" href="${l.href}">
        <span class="mmenu-short-photo" aria-hidden="true">${R.pictureHTML(l.foto.imagem, "", { sizes: "64px" })}</span>
        <span class="mmenu-short-name">${R.esc(l.short)}</span>
        <span class="mmenu-short-price">${R.esc(priceLabel(l))}</span>
      </a>
    </li>`).join("");

  /* ---------- Cor de destaque ---------- */
  let heroAccent = window.InjetHeroAccent || ORANGE;
  let activeKey = ""; // definido pelo scroll-spy logo ao carregar
  function hexInk(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.55 ? "#111111" : "#FFFFFF";
  }
  function applyAccent() {
    const color = activeKey === "inicio" ? heroAccent : ORANGE;
    root.style.setProperty("--accent", color);
    root.style.setProperty("--accent-ink", hexInk(color));
  }
  document.addEventListener("injet:hero-accent", (e) => {
    heroAccent = e.detail.color;
    applyAccent();
  });

  /* ---------- Pílula deslizante ---------- */
  const links = $$("[data-spy-link]", list);
  let pillTarget = null;
  function movePill(el) {
    if (!el || !desktop()) {
      pill.classList.remove("is-on");
      pillTarget = null;
      return;
    }
    const prevW = pill.offsetWidth || el.offsetWidth;
    const prevX = pillTarget ? pillTarget.offsetLeft : el.offsetLeft;
    const w = el.offsetWidth;
    const x = el.offsetLeft;
    const wasOn = pill.classList.contains("is-on");
    pillTarget = el;
    // FLIP: largura nova na hora, depois anima só transform (posição + escala)
    pill.style.transition = "none";
    pill.style.width = `${w}px`;
    if (wasOn && !reduce()) {
      pill.style.transform = `translateX(${prevX}px) scaleX(${prevW / w})`;
      void pill.offsetWidth;
      pill.style.transition = "";
    }
    pill.style.transform = `translateX(${x}px)`;
    if (!wasOn) {
      void pill.offsetWidth;
      pill.style.transition = "";
    }
    pill.classList.add("is-on");
  }
  const activeLink = () => links.find((l) => l.dataset.spyLink === activeKey) || null;
  list.addEventListener("pointerover", (e) => {
    const l = e.target.closest("[data-spy-link]");
    if (l) movePill(l);
  });
  list.addEventListener("pointerleave", () => movePill(activeLink()));
  list.addEventListener("focusin", (e) => {
    const l = e.target.closest("[data-spy-link]");
    if (l) movePill(l);
  });
  list.addEventListener("focusout", () => setTimeout(() => {
    if (!list.contains(document.activeElement)) movePill(activeLink());
  }, 0));
  window.addEventListener("resize", () => movePill(activeLink()));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(activeLink()));

  /* ---------- Scroll-spy (seção visível) ---------- */
  const SECTIONS = [
    ["inicio", "#inicio"], ["produtos", "#vitrine"], ["produtos", "#produtos"], ["produtos", "#kit"],
    ["vitrine", "#monte-sua-vitrine"], ["atacado", "#atacado"], ["sobre", "#sobre"], ["contato", "#contato"]
  ].map(([key, sel]) => ({ key, el: $(sel) })).filter((s) => s.el);

  function setActive(key) {
    if (key === activeKey) return;
    activeKey = key;
    links.forEach((l) => {
      if (l.dataset.spyLink === key) l.setAttribute("aria-current", "true");
      else l.removeAttribute("aria-current");
    });
    $$("[data-mmenu] [data-spy-link]").forEach((l) => l.classList.toggle("is-active", l.dataset.spyLink === key));
    $$("[data-tab]").forEach((t) => {
      if (t.dataset.tab === key) t.setAttribute("aria-current", "location");
      else t.removeAttribute("aria-current");
    });
    if (!list.matches(":hover") && !list.contains(document.activeElement)) movePill(activeLink());
    applyAccent();
  }

  // A seção que cruza a faixa do meio da tela é a ativa
  const visible = new Map();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) visible.set(en.target, en);
      else visible.delete(en.target);
    });
    const current = SECTIONS.find((s) => visible.has(s.el));
    if (current) setActive(current.key);
  }, { rootMargin: "-45% 0px -50% 0px" });
  SECTIONS.forEach((s) => spy.observe(s.el));

  /* ---------- Rolagem: compacta, progresso, some/volta ---------- */
  let lastY = window.scrollY;
  let ticking = false;
  const menusOpen = () => !mega.hidden || !mmenu.hidden || (search && search.open);
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    header.classList.toggle("is-compact", y > 40);
    const delta = y - lastY;
    if (Math.abs(delta) > 6) {
      const hide = delta > 0 && y > 200 && !menusOpen() && !header.contains(document.activeElement);
      header.classList.toggle("is-hidden", hide);
      if (hide) closeMega(false);
      lastY = y;
    }
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
  onScroll();

  /* ---------- Mega menu ---------- */
  let megaTimer = 0;
  function openMega({ focusFirst = false } = {}) {
    clearTimeout(megaTimer);
    if (!mega.hidden) return;
    mega.hidden = false;
    megaToggle.setAttribute("aria-expanded", "true");
    header.classList.add("is-mega-open");
    if (focusFirst) {
      const first = $(".mega-card", mega);
      if (first) first.focus();
    }
  }
  function closeMega(returnFocus) {
    clearTimeout(megaTimer);
    if (mega.hidden) return;
    mega.hidden = true;
    megaToggle.setAttribute("aria-expanded", "false");
    header.classList.remove("is-mega-open");
    if (returnFocus) megaToggle.focus();
  }
  megaToggle.addEventListener("click", (e) => {
    if (mega.hidden) openMega({ focusFirst: e.detail === 0 });
    else closeMega(false);
  });
  megaToggle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openMega({ focusFirst: true });
    }
  });
  // Passar o mouse abre (com pequena intenção) e sair fecha
  const hoverIn = (e) => {
    if (e.pointerType !== "mouse" || !desktop()) return;
    clearTimeout(megaTimer);
    megaTimer = setTimeout(() => openMega(), 90);
  };
  const hoverOut = (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(megaTimer);
    megaTimer = setTimeout(() => closeMega(false), 220);
  };
  megaToggle.addEventListener("pointerenter", hoverIn);
  megaToggle.addEventListener("pointerleave", hoverOut);
  mega.addEventListener("pointerenter", () => clearTimeout(megaTimer));
  mega.addEventListener("pointerleave", hoverOut);
  mega.addEventListener("click", (e) => { if (e.target.closest("a")) closeMega(false); });
  mega.addEventListener("keydown", (e) => {
    const cards = $$(".mega-card, .mega-cta, .mega-link", mega);
    const i = cards.indexOf(document.activeElement);
    if ((e.key === "ArrowRight" || e.key === "ArrowDown") && i >= 0) {
      e.preventDefault();
      cards[(i + 1) % cards.length].focus();
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && i >= 0) {
      e.preventDefault();
      cards[(i - 1 + cards.length) % cards.length].focus();
    }
  });
  header.addEventListener("focusout", () => setTimeout(() => {
    if (!header.contains(document.activeElement)) closeMega(false);
  }, 0));
  document.addEventListener("click", (e) => {
    if (!mega.hidden && !header.contains(e.target)) closeMega(false);
  });

  /* ---------- Menu do celular ---------- */
  let inerted = [];
  function setMenu(open) {
    if (open === !mmenu.hidden) return;
    mmenu.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("is-menu-open", open);
    header.classList.remove("is-hidden");
    if (open) {
      // fundo inerte: o foco fica entre o menu e a cápsula (com o X)
      inerted = Array.from(document.body.children).filter((c) => c !== header && c !== mmenu && !c.inert && c.tagName !== "SCRIPT" && !c.matches("dialog, .cursor"));
      inerted.forEach((c) => { c.inert = true; });
      const first = $("a", mmenu);
      if (first) first.focus();
    } else {
      inerted.forEach((c) => { c.inert = false; });
      inerted = [];
    }
  }
  menuToggle.addEventListener("click", () => setMenu(mmenu.hidden));
  mmenu.addEventListener("click", (e) => { if (e.target.closest("a[href^='#']")) setMenu(false); });
  window.matchMedia("(min-width: 1100px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
    else closeMega(false);
    movePill(activeLink());
  });

  /* ---------- Busca (Ctrl K) ---------- */
  const input = $("[data-search-input]", search);
  const results = $("[data-search-list]", search);
  const emptyMsg = $("[data-search-empty]", search);
  const searchStatus = $("[data-search-status]", search);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const index = R.products.map((p) => ({
    p,
    text: norm([p.nome, p.variante, p.ref, p.linha, p.rotuloLinha, p.formato, p.interior, p.legenda, p.descricao].join(" "))
  }));
  let found = [];
  let cursor = 0;
  let lastFocus = null;

  function renderResults() {
    const terms = norm(input.value).split(/\s+/).filter(Boolean);
    found = index.filter((it) => terms.every((t) => it.text.includes(t))).map((it) => it.p);
    cursor = Math.min(cursor, Math.max(0, found.length - 1));
    results.innerHTML = found.map((p, i) => `
      <li class="search-item" role="option" id="busca-op-${i}" data-search-ref="${R.esc(p.ref)}" aria-selected="${i === cursor}">
        <span class="search-thumb" aria-hidden="true">${p.imagem ? R.pictureHTML(p.imagem, "", { sizes: "48px" }) : ""}</span>
        <span class="search-text">
          <strong>${R.esc(p.nome)}</strong>
          <span>${R.esc(p.variante || "")} · Ref. ${R.esc(p.ref)}</span>
        </span>
        <span class="search-price">${R.esc(R.formatPrice(p.preco))}</span>
      </li>`).join("");
    emptyMsg.hidden = found.length > 0;
    input.setAttribute("aria-activedescendant", found.length ? `busca-op-${cursor}` : "");
    searchStatus.textContent = `${found.length} ${found.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
  }
  function moveCursor(i) {
    if (!found.length) return;
    cursor = (i + found.length) % found.length;
    $$(".search-item", results).forEach((li, k) => li.setAttribute("aria-selected", String(k === cursor)));
    input.setAttribute("aria-activedescendant", `busca-op-${cursor}`);
    const el = $(`#busca-op-${cursor}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
  function openSearch() {
    if (search.open) return;
    lastFocus = document.activeElement;
    closeMega(false);
    setMenu(false);
    input.value = "";
    cursor = 0;
    renderResults();
    search.showModal();
    document.body.classList.add("is-search-open");
    input.focus();
  }
  function openProduct(ref) {
    search.close();
    if (window.InjetCatalog) window.InjetCatalog.openProduct(ref);
  }
  search.addEventListener("close", () => {
    document.body.classList.remove("is-search-open");
    if (lastFocus && document.contains(lastFocus) && !(document.querySelector("#product-modal") || {}).open) lastFocus.focus();
  });
  search.addEventListener("click", (e) => {
    if (e.target === search) return search.close(); // fundo
    if (e.target.closest("[data-search-close]")) return search.close();
    const item = e.target.closest("[data-search-ref]");
    if (item) openProduct(item.dataset.searchRef);
  });
  input.addEventListener("input", () => { cursor = 0; renderResults(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveCursor(cursor + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(cursor - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const p = found[cursor];
      if (!p) return;
      if (e.ctrlKey || e.metaKey) {
        if (window.InjetQuote) window.InjetQuote.add(p.ref, 1);
        searchStatus.textContent = `${R.fullName(p)} adicionado ao orçamento.`;
        const li = $(`#busca-op-${cursor}`);
        if (li) {
          li.classList.add("is-added");
          setTimeout(() => li.classList.remove("is-added"), 900);
        }
      } else {
        openProduct(p.ref);
      }
    }
  });
  $$("[data-search-open]").forEach((b) => b.addEventListener("click", openSearch));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (search.open) search.close();
      else openSearch();
      return;
    }
    if (e.key === "Escape") {
      if (!mega.hidden) { e.preventDefault(); closeMega(true); }
      else if (!mmenu.hidden) { e.preventDefault(); setMenu(false); menuToggle.focus(); }
    }
  });

  /* ---------- Início ---------- */
  applyAccent();
  movePill(null);
})();
