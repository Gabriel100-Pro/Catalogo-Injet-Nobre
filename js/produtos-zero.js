/* ==========================================================================
   INJET NOBRE – PRODUTOS EM GRAVIDADE ZERO (seção #produtos da página inicial)
   - Produtos (js/products.js) flutuando com profundidade, parallax e repulsão
     do mouse. Ao passar o mouse (ou focar com Tab) o produto para e abre o
     card de vidro com nome, variação, cores, preço e "+ Orçamento".
   - "+ Orçamento": a miniatura voa até o ícone do orçamento (header no
     computador, barra inferior no celular) e só então entra no orçamento
     (window.InjetQuote, js/quote.js), que atualiza o contador de lá.
   - Palavra "PRODUTOS" com letras flutuando e uma letra laranja em sequência.
   - Fundo: vídeo em loop (assets/video/) e, por cima, canvas transparente com
     grade em perspectiva, partículas e riscos de luz. Com movimento reduzido
     ou economia de dados o vídeo não toca (fica o poster; ver index.html).
   - Filtros: os produtos de fora voam para longe e os outros se reagrupam.
   Desempenho: tudo pausa fora da tela (IntersectionObserver) e com a aba
   oculta; no celular, 7 produtos e menos partículas; pixel ratio até 1,5.
   Movimento reduzido: produtos parados e fundo estático (desenhado sob demanda).
   Não depende do GSAP.
   ========================================================================== */

(function () {
  "use strict";

  const sec = document.querySelector("[data-zg]");
  const R = window.InjetRender;
  if (!sec || !R) return;

  const $ = (sel, ctx = sec) => ctx.querySelector(sel);
  const $$ = (sel, ctx = sec) => Array.from(ctx.querySelectorAll(sel));
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mqMobile = window.matchMedia("(max-width: 760px)");
  const mqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  let reduce = mqReduce.matches;
  const mobile = () => mqMobile.matches;
  const hoverable = () => mqHover.matches;

  /* ---------- Posição de cada produto (por referência) ----------
     pos: centro em fração da seção (x, y) · d: profundidade (maior = mais
     perto, maior e mais nítido) · w: largura base em px · mob: posição no
     celular (só os 7 com "mob" aparecem em "Todos") · mask: máscara radial
     para fotos com fundo escuro (hoje todas as fotos já têm fundo transparente). */
  const LAYOUT = {
    "IN-E01": { pos: [0.50, 0.44], d: 1.15, w: 300, mob: [0.50, 0.47] },
    "IN-E03": { pos: [0.16, 0.32], d: 0.85, w: 230, mob: [0.24, 0.33] },
    "IN-E04": { pos: [0.83, 0.28], d: 0.90, w: 240 },
    "IN-E05": { pos: [0.30, 0.70], d: 1.00, w: 250, mob: [0.75, 0.33] },
    "IN-E02": { pos: [0.66, 0.20], d: 0.70, w: 190 },
    "IN-E06": { pos: [0.91, 0.62], d: 0.95, w: 230 },
    "IN-A02": { pos: [0.70, 0.72], d: 1.05, w: 240, mob: [0.76, 0.62] },
    "IN-A03": { pos: [0.10, 0.66], d: 0.80, w: 220, mob: [0.24, 0.62] },
    "IN-A01": { pos: [0.76, 0.46], d: 0.72, w: 190 },
    "IN-A04": { pos: [0.04, 0.44], d: 0.75, w: 200 },
    "IN-S01": { pos: [0.36, 0.22], d: 0.75, w: 170, mob: [0.50, 0.72] },
    "IN-S02": { pos: [0.53, 0.80], d: 0.90, w: 180 },
    "IN-B01": { pos: [0.22, 0.50], d: 0.70, w: 120, mob: [0.50, 0.27] }
  };
  const FORMA_CURTA = { Redonda: "Redonda", Quadrangular: "Quadrada" };
  const variantLabel = (p) => (p.formato ? `${FORMA_CURTA[p.formato] || p.formato} · com ${String(p.interior).toLowerCase()}` : p.variante || "");
  const imgSrc = (p) => `assets/produtos/${p.imagem}-460.webp`;

  /* ---------- Produtos ---------- */
  const field = $("[data-zg-field]");
  const LINE_ORDER = ["estojos", "acrilicos", "expositores"];
  const list = R.products
    .filter((p) => p.imagem && LINE_ORDER.includes(p.linha))
    .sort((a, b) => LINE_ORDER.indexOf(a.linha) - LINE_ORDER.indexOf(b.linha));

  const P = list.map((data, i) => {
    const L = LAYOUT[data.ref] || { pos: [0.15 + ((i * 0.37) % 0.7), 0.25 + ((i * 0.23) % 0.5)], d: 0.8, w: 200 };
    const b = document.createElement("button");
    b.type = "button";
    b.className = "zg-p";
    b.setAttribute("aria-label", `${R.fullName(data)}, ${R.formatPrice(data.preco)} por unidade`);
    b.innerHTML = `<span class="zg-halo"></span><img src="${R.esc(imgSrc(data))}" alt="" width="460" height="460" decoding="async"${L.mask ? ' class="is-mask"' : ""}>`;
    b.style.setProperty("--w", `${L.w}px`);
    field.appendChild(b);
    return {
      data, el: b, i, pos: L.pos, mob: L.mob || null, d: L.d, w: L.w,
      ph: i * 1.73, ax: 22 + (i % 3) * 10, ay: 16 + (i % 4) * 7,
      sx: 0.21 + (i % 5) * 0.035, sy: 0.27 + (i % 3) * 0.04,
      rot: (i % 2 ? 1 : -1) * (4 + (i % 4) * 2), spin: (i % 2 ? 1 : -1) * (0.08 + (i % 3) * 0.05),
      bx: L.pos[0], by: L.pos[1], tx: L.pos[0], ty: L.pos[1],
      vx: 0, vy: 0, px: 0, py: 0, freeze: 0, sc: 1, scT: 1, visible: true, fx: 0, fy: 0, _f: null
    };
  });

  /* ---------- Palavra "PRODUTOS" ---------- */
  const word = $("[data-zg-word]");
  const letters = [..."PRODUTOS"].map((c) => {
    const s = document.createElement("span");
    s.textContent = c;
    word.appendChild(s);
    return s;
  });
  let hot = 0;
  let hotTimer = 0;
  function startHot() {
    if (hotTimer || reduce) return;
    hotTimer = setInterval(() => {
      letters.forEach((l) => l.classList.remove("is-hot"));
      letters[hot % letters.length].classList.add("is-hot");
      hot++;
    }, 650);
  }
  function stopHot() {
    clearInterval(hotTimer);
    hotTimer = 0;
  }

  /* ---------- Card de vidro ---------- */
  const card = $("[data-zg-card]");
  const addBtn = $("[data-zg-add]");
  const addLabel = $("[data-zg-add-label]");
  const hint = $("[data-zg-hint]");
  let cur = null;
  let blurT = 0;
  let addT = 0;
  let quiet = false; // foco devolvido ao produto sem reabrir o card
  card.inert = true;
  const refocus = (p) => {
    quiet = true;
    p.el.focus({ preventScroll: true });
    quiet = false;
  };

  function fillCard(p) {
    const d = p.data;
    $("[data-zg-k]").textContent = `${d.ref} · ${d.rotuloLinha || ""}`;
    $("[data-zg-t]").textContent = d.nome;
    $("[data-zg-v]").textContent = variantLabel(d);
    $("[data-zg-price]").innerHTML = `<span class="sr-only">Preço: </span>R$ ${R.formatNumber(d.preco)}<small>/un</small>`;
    const specs = (d.caracteristicas || []).filter((c) => c.rotulo !== "Cores" && !(d.formato && (c.rotulo === "Formato" || c.rotulo === "Interior"))).slice(0, 3);
    $("[data-zg-specs]").innerHTML = specs.map((c) => `<span><em>${R.esc(c.rotulo)}</em> ${R.esc(c.valor)}</span>`).join("");
    // Bolinhas: as cores do mesmo produto (estojo e suporte), com a atual marcada
    const sibs = R.siblings(d);
    const colors = new Set(sibs.map((s) => s.cor));
    const dots = $("[data-zg-dots]");
    dots.hidden = colors.size < 2;
    dots.innerHTML = colors.size < 2 ? "" : sibs.map((s) => `<i style="background:${R.esc(s.cor)}" class="${s === d ? "is-cur" : ""}" title="${R.esc(s.variante)}"></i>`).join("");
    addBtn.classList.remove("is-ok");
    addLabel.textContent = "Orçamento";
    addBtn.setAttribute("aria-label", `Adicionar ${R.fullName(d)} ao orçamento`);
    clearTimeout(addT);
  }

  function focusOn(p) {
    clearTimeout(blurT);
    if (!p.visible) return;
    if (cur === p) return;
    if (cur) {
      cur.el.classList.remove("is-on");
      cur.scT = 1;
    }
    cur = p;
    p.el.classList.add("is-on");
    p.scT = 1.28;
    sec.classList.add("is-focus");
    fillCard(p);
    card.classList.add("is-show");
    card.inert = false;
    card.removeAttribute("aria-hidden");
    hint.style.opacity = 0;
    placeCard();
    kick();
  }
  function scheduleBlur() {
    clearTimeout(blurT);
    blurT = setTimeout(unfocus, 260);
  }
  function unfocus() {
    clearTimeout(blurT);
    if (!cur) return;
    // o foco não pode ficar num card escondido (inert): volta ao produto
    if (card.contains(document.activeElement)) refocus(cur);
    cur.el.classList.remove("is-on");
    cur.scT = 1;
    cur = null;
    sec.classList.remove("is-focus");
    card.classList.remove("is-show");
    card.inert = true;
    card.setAttribute("aria-hidden", "true");
    kick();
  }

  // Card ao lado do produto (computador) ou fixo acima dos filtros (celular, CSS)
  function placeCard() {
    if (!cur) return;
    if (mobile()) {
      card.style.left = card.style.top = "";
      return;
    }
    const s = sec.getBoundingClientRect();
    const r = cur.el.getBoundingClientRect();
    const W = s.width, H = s.height;
    const cw = card.offsetWidth || 300, ch = card.offsetHeight || 260;
    const rl = r.left - s.left, rr = r.right - s.left, rt = r.top - s.top;
    let left = rr + 18;
    if (left + cw > W - 20) left = rl - cw - 18;
    left = Math.max(20, Math.min(W - cw - 20, left));
    let top = rt + r.height / 2 - ch / 2;
    top = Math.max(100, Math.min(H - ch - 110, top));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  const visibleProducts = () => P.filter((p) => p.visible);

  P.forEach((p) => {
    const b = p.el;
    b.addEventListener("mouseenter", () => { if (hoverable() && !mobile()) focusOn(p); });
    b.addEventListener("mouseleave", () => { if (hoverable() && !mobile()) scheduleBlur(); });
    b.addEventListener("focus", () => { if (!quiet) focusOn(p); });
    b.addEventListener("click", (e) => {
      focusOn(p);
      // Teclado (Enter/Espaço): vai direto para o "+ Orçamento"
      if (e.detail === 0) addBtn.focus();
    });
  });
  card.addEventListener("mouseenter", () => clearTimeout(blurT));
  card.addEventListener("mouseleave", () => { if (hoverable() && !mobile()) scheduleBlur(); });
  $("[data-zg-close]").addEventListener("click", unfocus);

  // Tab dentro do card: para frente vai ao próximo produto; para trás, ao produto atual
  card.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !cur) return;
    const focusables = $$("button", card).filter((b) => b.offsetParent !== null);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      cur.el.focus({ preventScroll: true });
    } else if (!e.shiftKey && document.activeElement === last) {
      const vis = visibleProducts();
      const next = vis[vis.indexOf(cur) + 1];
      if (next) {
        e.preventDefault();
        next.el.focus({ preventScroll: true });
      } else {
        unfocus();
      }
    }
  });

  // Foco saiu dos produtos e do card: fecha
  sec.addEventListener("focusout", (e) => {
    const to = e.relatedTarget;
    if (to && (to.closest(".zg-p") || card.contains(to))) return;
    if (hoverable() && !mobile() && cur && cur.el.matches(":hover")) return;
    setTimeout(() => {
      const a = document.activeElement;
      if (a && (a.closest && (a.closest(".zg-p") || card.contains(a)))) return;
      unfocus();
    }, 0);
  });

  // Esc fecha (se nenhum diálogo do site estiver aberto)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !cur || document.querySelector("dialog[open]")) return;
    unfocus();
  });

  // Celular: toque fora do produto/card fecha
  sec.addEventListener("click", (e) => {
    if (!cur || hoverable()) return;
    if (!e.target.closest(".zg-p, .zg-card, .zg-bar")) unfocus();
  });

  /* ---------- "+ Orçamento": a miniatura voa até o orçamento do site ---------- */
  function quoteTarget() {
    const btn = window.InjetQuote && window.InjetQuote.visibleButton();
    if (!btn) return null;
    const count = btn.querySelector("[data-quote-count]");
    return count && !count.hidden && count.offsetParent !== null ? count : btn;
  }
  function addToQuote(ref) {
    if (!window.InjetQuote) return;
    // experience.js: o voo substitui o confete; o contador pula na chegada
    window.InjetFlyLanding = true;
    window.InjetQuote.add(ref, 1);
  }
  addBtn.addEventListener("click", () => {
    if (!cur) return;
    const p = cur;
    addBtn.classList.add("is-ok");
    addLabel.textContent = "Adicionado";
    clearTimeout(addT);
    addT = setTimeout(() => {
      addBtn.classList.remove("is-ok");
      addLabel.textContent = "Orçamento";
    }, 1400);
    try { if (navigator.vibrate && !hoverable()) navigator.vibrate(15); } catch (err) { /* sem vibração */ }

    const header = document.querySelector("[data-header]");
    if (header) header.classList.remove("is-hidden"); // o header volta a aparecer
    const r = p.el.getBoundingClientRect();
    if (reduce || !document.body.animate || !r.width) {
      addToQuote(p.data.ref);
      return;
    }
    const target = quoteTarget();
    // espera o header voltar (0,45 s de transição) para mirar no lugar certo
    const f = document.createElement("div");
    f.className = "zg-flyer";
    f.innerHTML = `<img src="${R.esc(imgSrc(p.data))}" alt="">`;
    document.body.appendChild(f);
    const S = 90;
    const x0 = r.left + r.width / 2 - S / 2, y0 = r.top + r.height / 2 - S / 2;
    let t = target ? target.getBoundingClientRect() : null;
    if (header && target && header.contains(target) && t.bottom < 0) t = null;
    const x1 = t ? t.left + t.width / 2 - S / 2 : innerWidth - 40 - S / 2;
    const y1 = t ? t.top + t.height / 2 - S / 2 : (mobile() ? innerHeight - 40 : 40) - S / 2;
    const anim = f.animate([
      { transform: `translate(${x0}px,${y0}px) scale(1.2) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 160}px) scale(.8) rotate(-20deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x1}px,${y1}px) scale(.12) rotate(-40deg)`, opacity: 0.6 }
    ], { duration: 850, easing: "cubic-bezier(.45,0,.2,1)" });
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      f.remove();
      addToQuote(p.data.ref);
    };
    anim.onfinish = land;
    anim.oncancel = land;
    setTimeout(land, 1200); // rede de segurança (aba em segundo plano)
  });

  /* ---------- Filtros ---------- */
  const pills = $("[data-zg-pills]");
  const ind = $("[data-zg-ind]");
  const num = $("[data-zg-num]");
  const status = $("[data-zg-status]");
  let filter = "todos";

  function moveInd() {
    const b = $('[aria-pressed="true"]', pills);
    if (!b) return;
    ind.style.left = `${b.offsetLeft}px`;
    ind.style.width = `${b.offsetWidth}px`;
  }
  function rollNum(n) {
    const from = Number(num.textContent) || 0;
    if (reduce || from === n) {
      num.textContent = n;
      return;
    }
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / 500);
      num.textContent = Math.round(from + (n - from) * k);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  // Quem aparece: o filtro; no celular, "Todos" mostra só os 7 com posição "mob"
  function applyFilter(f, announce) {
    filter = f;
    $$("button", pills).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.zgFilter === f)));
    moveInd();
    if (cur) unfocus();
    const mob = mobile();
    P.forEach((p) => {
      const inLine = f === "todos" || p.data.linha === f;
      const v = inLine && (f !== "todos" || !mob || !!p.mob);
      p.visible = v;
      p.el.classList.toggle("is-out", !v);
      p.el.tabIndex = v ? 0 : -1;
      p.el.inert = !v;
      if (v) p.el.removeAttribute("aria-hidden");
      else p.el.setAttribute("aria-hidden", "true");
    });
    layout();
    const total = f === "todos" ? P.length : P.filter((p) => p.data.linha === f).length;
    const shown = visibleProducts().length;
    rollNum(total);
    if (announce) {
      const btn = $(`[data-zg-filter="${f}"]`, pills);
      status.textContent = shown < total
        ? `Mostrando ${shown} de ${total} produtos. Use os filtros para ver cada linha.`
        : `Mostrando ${total} produtos (${btn ? btn.textContent.trim() : f}).`;
    }
    kick();
  }

  // Posições-alvo: em "Todos" cada um no seu lugar; filtrado, se reagrupam
  function layout() {
    const mob = mobile();
    const vis = visibleProducts();
    const n = vis.length;
    vis.forEach((p, k) => {
      if (filter === "todos") {
        const pos = mob && p.mob ? p.mob : p.pos;
        p.tx = pos[0];
        p.ty = pos[1];
      } else if (mob) {
        // celular: duas colunas
        const rows = Math.ceil(n / 2);
        const col = n % 2 && k === n - 1 ? 0.5 : k % 2 ? 0.73 : 0.27;
        p.tx = col;
        p.ty = rows === 1 ? 0.48 : 0.3 + (Math.floor(k / 2) / (rows - 1)) * 0.44;
      } else if (n <= 4) {
        p.tx = (k + 1) / (n + 1);
        p.ty = 0.47 + (k % 2 ? 0.08 : -0.06);
      } else {
        const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
        const c = k === 0 ? 0 : 1;
        p.tx = 0.5 + Math.cos(a) * 0.3 * c;
        p.ty = 0.48 + Math.sin(a) * 0.26 * c;
      }
    });
    // os de fora voam para longe, na direção em que estavam
    P.filter((p) => !p.visible).forEach((p) => {
      const a = Math.atan2(p.pos[1] - 0.5, p.pos[0] - 0.5);
      p.tx = 0.5 + Math.cos(a) * 1.2;
      p.ty = 0.5 + Math.sin(a) * 1.2;
    });
    if (reduce) P.forEach((p) => { p.bx = p.tx; p.by = p.ty; });
  }

  pills.addEventListener("click", (e) => {
    const b = e.target.closest("[data-zg-filter]");
    if (!b || b.getAttribute("aria-pressed") === "true") return;
    applyFilter(b.dataset.zgFilter, true);
  });
  // Atalhos do menu (mega menu / menu do celular): <a href="#produtos" data-filter-link="estojos">
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("[data-filter-link]");
    if (a && $(`[data-zg-filter="${a.dataset.filterLink}"]`, pills)) applyFilter(a.dataset.filterLink, true);
  });

  /* ---------- Ponteiro (só mouse) ---------- */
  const ptr = { cx: -9999, cy: -9999, nx: 0, ny: 0, sx: 0, sy: 0, on: false };
  sec.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    ptr.cx = e.clientX;
    ptr.cy = e.clientY;
    ptr.on = true;
  });
  sec.addEventListener("pointerleave", () => {
    ptr.on = false;
    ptr.nx = ptr.ny = 0;
  });

  /* ---------- Fundo animado (canvas) ---------- */
  const cv = $("[data-zg-bg]");
  const cx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  const mkParts = (n) => Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.9, s: 0.2 + Math.random() * 0.8 }));
  let parts = [];
  const streaks = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = sec.clientWidth;
    H = sec.clientHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const want = mobile() ? 40 : 110;
    if (parts.length !== want) parts = mkParts(want);
    moveInd();
    kick();
  }

  function drawBg(t, dt) {
    // canvas transparente: as luzes vêm do vídeo de fundo
    cx.globalCompositeOperation = "source-over";
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = "lighter";
    // grade em perspectiva no chão
    const hz = H * 0.62, vp = W / 2 + ptr.sx * -40;
    cx.strokeStyle = "rgba(255,106,19,.16)";
    cx.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {
      cx.beginPath();
      cx.moveTo(vp + i * 14, hz);
      cx.lineTo(vp + i * W * 0.14, H);
      cx.stroke();
    }
    const off = (t * 0.35) % 1;
    for (let j = 0; j < 12; j++) {
      const k = (j + off) / 12, y = hz + (H - hz) * k * k;
      cx.globalAlpha = k * 0.9;
      cx.beginPath();
      cx.moveTo(0, y);
      cx.lineTo(W, y);
      cx.stroke();
    }
    cx.globalAlpha = 1;
    // partículas subindo
    parts.forEach((p) => {
      if (!reduce) {
        p.y -= dt * 0.018 * p.z;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      }
      const x = p.x * W + ptr.sx * -24 * p.z, y = p.y * H + ptr.sy * -16 * p.z;
      cx.fillStyle = `rgba(255,${(150 + p.s * 80) | 0},${(80 + p.s * 80) | 0},${0.25 + p.z * 0.35})`;
      cx.fillRect(x, y, 1.2 + p.z * 1.4, 1.2 + p.z * 1.4);
    });
    // riscos de luz
    if (!reduce && Math.random() < dt * 0.5) streaks.push({ x: -0.2, y: 0.15 + Math.random() * 0.5, v: 0.9 + Math.random() * 0.8, l: 0.15 + Math.random() * 0.2 });
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.x += dt * s.v;
      const x = s.x * W, y = s.y * H, L = s.l * W;
      const g = cx.createLinearGradient(x - L, y, x, y);
      g.addColorStop(0, "rgba(255,106,19,0)");
      g.addColorStop(1, "rgba(255,200,150,.55)");
      cx.strokeStyle = g;
      cx.lineWidth = 1.5;
      cx.beginPath();
      cx.moveTo(x - L, y);
      cx.lineTo(x, y);
      cx.stroke();
      if (s.x > 1.3) streaks.splice(i, 1);
    }
    cx.globalCompositeOperation = "source-over";
  }

  /* ---------- Loop ---------- */
  let prev = performance.now();
  let T = 0;
  let raf = 0;
  let inView = false;

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const still = reduce;
    T += still ? 0 : dt * (cur ? 0.3 : 1);

    const s = sec.getBoundingClientRect();
    const mob = mobile();
    const touch = !hoverable();
    if (ptr.on && !still) {
      ptr.nx = ((ptr.cx - s.left) / s.width) * 2 - 1;
      ptr.ny = ((ptr.cy - s.top) / s.height) * 2 - 1;
    }
    const ease = still ? 1 : Math.min(1, dt * 3);
    ptr.sx += ((still ? 0 : ptr.nx) - ptr.sx) * ease;
    ptr.sy += ((still ? 0 : ptr.ny) - ptr.sy) * ease;
    drawBg(still ? 0 : now / 1000, still ? 0 : dt);

    // palavra flutuando
    word.style.transform = `translate(calc(-50% + ${ptr.sx * -30}px), calc(-50% + ${ptr.sy * -18}px))`;
    letters.forEach((l, i) => {
      const y = still ? 0 : Math.sin(T * 1.1 + i * 0.7) * 14;
      const r = still ? 0 : Math.sin(T * 0.8 + i * 1.3) * 4;
      l.style.transform = `translateY(${y}px) rotate(${r}deg)`;
    });

    const Wd = s.width, Hd = s.height;
    const sc0 = mob ? Math.min(0.55, Wd / 650) : Math.min(1.1, Wd / 1440, Hd / 820);
    const lx = ptr.cx - s.left, ly = ptr.cy - s.top;
    const amp = mob ? 0.55 : 1; // no celular flutuam menos (não saem da tela)
    // celular: o produto escolhido sobe para o espaço livre acima do card
    let mobFocus = null;
    if (mob && cur) {
      const top = 130, bottom = card.offsetTop || Hd * 0.55;
      mobFocus = [Wd / 2, top + Math.max(0, bottom - top) / 2];
    }
    let moving = false;
    P.forEach((p) => {
      const k = still ? 1 : Math.min(1, dt * 1.8);
      p.bx += (p.tx - p.bx) * k;
      p.by += (p.ty - p.by) * k;
      const fz = p === cur ? 1 : 0;
      p.freeze += (fz - p.freeze) * (still ? 1 : Math.min(1, dt * 6));
      const live = 1 - p.freeze;
      const ox = still ? 0 : Math.sin(T * p.sx * 2 + p.ph) * p.ax * live * amp;
      const oy = still ? 0 : Math.cos(T * p.sy * 2 + p.ph) * p.ay * live * amp;
      let x = p.bx * Wd + ox, y = p.by * Hd + oy;
      if (mobFocus) {
        const kf = p === cur ? 1 : 0;
        p.fx += (kf - p.fx) * (still ? 1 : Math.min(1, dt * 5));
      } else {
        p.fx += (0 - p.fx) * (still ? 1 : Math.min(1, dt * 5));
      }
      if (p.fx > 0.001 && (mobFocus || p.lastFocus)) {
        const fpos = mobFocus || p.lastFocus;
        if (mobFocus && p === cur) p.lastFocus = mobFocus;
        x += (fpos[0] - x) * p.fx;
        y += (fpos[1] - y) * p.fx;
      }
      // repulsão do mouse (gravidade zero: empurra)
      if (!still && !touch && ptr.on && p !== cur) {
        const dx = x + p.px - lx, dy = y + p.py - ly, d = Math.hypot(dx, dy), Rr = 180 * p.d;
        if (d < Rr && d > 1) {
          const f = (1 - d / Rr) * 900 * dt;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      p.vx *= Math.pow(0.04, dt);
      p.vy *= Math.pow(0.04, dt);
      p.px += p.vx * dt * 60 * 0.05;
      p.py += p.vy * dt * 60 * 0.05;
      p.px *= Math.pow(0.35, dt);
      p.py *= Math.pow(0.35, dt);
      // parallax por profundidade
      x += p.px + ptr.sx * -26 * p.d;
      y += p.py + ptr.sy * -18 * p.d;
      p.sc += (p.scT - p.sc) * (still ? 1 : Math.min(1, dt * 7));
      const rot = still ? 0 : (Math.sin(T * 0.6 + p.ph) * p.rot + T * p.spin * 10) * live;
      const sc = p.sc * p.d * sc0;
      p.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      p.el.style.zIndex = p === cur ? 50 : Math.round(p.d * 10);
      const fstr = p === cur ? "none" : cur ? "" : p.d < 0.8 ? "blur(1.2px) brightness(.8)" : "";
      if (p._f !== fstr) {
        p.el.style.filter = fstr;
        p._f = fstr;
      }
      if (Math.abs(p.tx - p.bx) > 0.002 || Math.abs(p.ty - p.by) > 0.002) moving = true;
    });
    if (cur) placeCard();

    if (!still && inView && !document.hidden) raf = requestAnimationFrame(frame);
    else if (still && moving) raf = requestAnimationFrame(frame);
  }

  // Pede um quadro (no modo reduzido, só quando algo muda)
  function kick() {
    if (raf || !inView) return;
    prev = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  /* ---------- Vídeo de fundo: toca só com a seção na tela ---------- */
  const video = $("[data-zg-video]");
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const videoOK = () => video && !reduce && !saveData && video.dataset.off !== "1";
  function syncVideo(on) {
    if (!video) return;
    if (on && videoOK()) {
      const p = video.play();
      if (p && p.catch) p.catch(() => { /* autoplay bloqueado: fica o poster */ });
    } else if (!video.paused) {
      video.pause();
    }
  }

  function sync() {
    const on = inView && !document.hidden;
    if (on) {
      kick();
      startHot();
    } else {
      stop();
      stopHot();
    }
    syncVideo(on);
  }

  new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1].isIntersecting;
    sync();
  }, { rootMargin: "80px 0px" }).observe(sec);
  document.addEventListener("visibilitychange", sync);

  if (window.ResizeObserver) new ResizeObserver(resize).observe(sec);
  else window.addEventListener("resize", resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);

  // Muda de computador para celular (ou o inverso): refaz quem aparece
  mqMobile.addEventListener("change", () => {
    resize();
    applyFilter(filter, false);
  });
  mqReduce.addEventListener("change", (e) => {
    reduce = e.matches;
    if (reduce) {
      stopHot();
      letters.forEach((l) => l.classList.remove("is-hot"));
    }
    layout();
    sync();
    kick();
  });

  function setHint() {
    hint.textContent = hoverable() ? "Passe o mouse num produto para ele parar" : "Toque num produto para ele parar";
  }
  setHint();
  mqHover.addEventListener("change", setHint);

  // Início: vindo de outra página com ?linha=estojos#produtos já filtra
  const fromUrl = new URLSearchParams(location.search).get("linha");
  const startFilter = fromUrl && $(`[data-zg-filter="${fromUrl}"]`, pills) ? fromUrl : "todos";
  resize();
  applyFilter(startFilter, false);
  P.forEach((p) => { p.bx = p.tx; p.by = p.ty; });
  num.textContent = startFilter === "todos" ? P.length : P.filter((p) => p.data.linha === startFilter).length;
  sec.classList.add("is-ready");
})();
