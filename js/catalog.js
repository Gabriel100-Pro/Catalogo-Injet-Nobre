/* ==========================================================================
   INJET NOBRE – GRADE DE PRODUTOS (página inicial)
   Cards montados por js/main.js (R.catalogCardsHTML). Aqui:
   - Base (funciona sem GSAP): bolinhas de cor do estojo, interruptores do
     acrílico, preço e contador de produtos.
   - Com GSAP (e sem "reduzir movimento"):
     1. entrada em cascata (só na primeira vez que a grade aparece);
     2. pílula do filtro deslizando + cards reorganizados com Flip;
     3. card 3D seguindo o mouse (computador) / afunda ao toque (CSS);
     4–5. foto troca com giro rápido, fundo do estojo muda de cor, preço rola;
     6. "+ Orçamento": a foto voa até o ícone do orçamento;
     7. palavra gigante "PRODUTOS" com parallax horizontal.
   Só anima transform e opacity. Sem altura extra e sem prender a rolagem.
   ========================================================================== */

(function () {
  "use strict";

  const section = document.getElementById("produtos");
  const grid = section && section.querySelector("[data-grid-compact]");
  const R = window.InjetRender;
  if (!grid || !R) return;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const Flip = window.Flip;
  const motionOK = () => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  const anim = () => !!gsap && motionOK();
  const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (gsap && Flip) gsap.registerPlugin(Flip);
  // experience.js: nos cards da grade o voo da foto substitui o confete
  window.InjetCatalogFX = true;

  const OUT = "power3.out";
  const cards = () => $$(".pcard", grid);
  const FORMA_CURTA = { Redonda: "Redonda", Quadrangular: "Quadrada" };
  const variantLabel = (p) => (p.grupo === "caixa-acrilico" ? `${FORMA_CURTA[p.formato] || p.formato} · ${p.interior}` : p.variante || "");

  /* ---------- Números que rolam (preço e contador) ---------- */
  function setRoll(roll, text, animate) {
    if (!roll) return;
    const digits = String(text).replace(/\D/g, "").split("").map(Number);
    $$(".roll-strip", roll).forEach((strip, i) => {
      const yPercent = -(digits[i] || 0) * 10;
      if (animate) gsap.to(strip, { yPercent, duration: 0.6, ease: "power3.inOut", delay: i * 0.05, overwrite: true });
      else if (gsap) gsap.set(strip, { yPercent });
      else strip.style.transform = `translateY(${yPercent}%)`;
    });
  }
  // As fitas começam com translateY no style; o GSAP passa a controlar em yPercent
  function adoptRolls(root) {
    if (!gsap) return;
    $$(".roll-strip", root).forEach((strip) => {
      const m = /-?\d+(\.\d+)?(?=%)/.exec(strip.style.transform || "");
      strip.style.transform = "";
      gsap.set(strip, { y: 0, yPercent: m ? Number(m[0]) : 0 });
    });
  }

  /* ---------- Contador "X produtos" (soma as variações dos cards visíveis) ---------- */
  const filters = $(".filter--pills", section);
  const counter = $("[data-catalog-count]", section);
  const countNow = () => cards().filter((c) => !c.hidden).reduce((n, c) => n + (Number(c.dataset.variants) || 1), 0);
  if (counter) {
    counter.innerHTML = `${R.rollHTML(R.pad(countNow()))} <span>produtos</span>`;
    counter.hidden = false;
  }
  function updateCount(animate) {
    if (counter) setRoll($(".roll", counter), R.pad(countNow()), animate);
  }

  /* ---------- Trocar a variação (estojo: cor; acrílico: interior/formato) ---------- */
  function showVariant(card, ref) {
    const p = R.findProduct(ref);
    if (!p || card.dataset.ref === ref) return;
    card.dataset.ref = ref;
    $$("[data-open-product]", card).forEach((b) => (b.dataset.openProduct = ref));
    $("[data-quote-add]", card).dataset.quoteAdd = ref;
    $("[data-add-sr]", card).textContent = ` – adicionar ${R.fullName(p)}`;
    $("[data-variant-name]", card).textContent = variantLabel(p);
    $("[data-price-sr]", card).textContent = `${R.formatPrice(p.preco)} por unidade`;
    setRoll($(".pcard-pill .roll", card), R.formatNumber(p.preco), anim());

    // Foto: giro rápido; a troca acontece de lado (rotationY 90°)
    const frame = $(".pcard-frame", card);
    const swap = () => $$(".pcard-pic", card).forEach((pic) => pic.classList.toggle("is-active", pic.dataset.pic === ref));
    if (anim()) {
      gsap.killTweensOf(frame);
      gsap.timeline()
        .to(frame, { rotationY: 90, transformPerspective: 600, duration: 0.14, ease: "power2.in" })
        .add(swap)
        .fromTo(frame, { rotationY: -90 }, { rotationY: 0, duration: 0.34, ease: "back.out(1.8)" });
    } else {
      swap();
    }

    // Estojo: fundo do card na cor escolhida (camadas trocadas por opacidade)
    if (p.fundo) {
      card.classList.add("has-bg");
      $$(".pcard-bgs > span", card).forEach((l) => l.classList.toggle("is-on", l.dataset.bg === ref));
      card.dataset.ink = p.tinta || "dark";
      card.dataset.bgtone = p.fundo.toUpperCase() === "#FF6A13" ? "orange" : "";
    }
  }

  grid.addEventListener("click", (e) => {
    const dot = e.target.closest(".pcard-dot");
    if (dot) {
      const card = dot.closest(".pcard");
      $$(".pcard-dot", card).forEach((d) => d.setAttribute("aria-pressed", String(d === dot)));
      showVariant(card, dot.dataset.pick);
      return;
    }
    const opt = e.target.closest(".pcard-switch button");
    if (opt) {
      const card = opt.closest(".pcard");
      $$("button", opt.parentElement).forEach((b) => b.setAttribute("aria-pressed", String(b === opt)));
      const pick = {};
      $$(".pcard-switch", card).forEach((g) => {
        const on = $('button[aria-pressed="true"]', g);
        if (on) pick[g.dataset.opt] = on.dataset.val;
      });
      const current = R.findProduct(card.dataset.ref);
      const match = R.products.find((p) => p.grupo === current.grupo && p.interior === pick.interior && p.formato === pick.formato);
      if (match) showVariant(card, match.ref);
    }
  });
  // Mouse sobre a bolinha já mostra a cor
  grid.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const dot = e.target.closest(".pcard-dot");
    if (dot && dot.getAttribute("aria-pressed") !== "true") dot.click();
  });

  /* ======================================================================
     Daqui para baixo: só com GSAP e sem "reduzir movimento"
     ====================================================================== */
  adoptRolls(section);
  if (!gsap) return;

  /* ---------- 2. Filtros: pílula deslizante + Flip ---------- */
  let indicator = null;
  if (filters) {
    indicator = document.createElement("span");
    indicator.className = "filter-ind";
    indicator.setAttribute("aria-hidden", "true");
    filters.prepend(indicator);
    filters.classList.add("has-ind");
  }
  function moveIndicator(btn, animate) {
    if (!indicator || !btn) return;
    const prevW = indicator.offsetWidth;
    const w = btn.offsetWidth;
    indicator.style.width = `${w}px`;
    indicator.style.height = `${btn.offsetHeight}px`;
    indicator.style.top = `${btn.offsetTop}px`;
    if (animate && prevW) {
      gsap.fromTo(indicator, { scaleX: prevW / w }, { x: btn.offsetLeft, scaleX: 1, duration: 0.45, ease: "power3.inOut", overwrite: true });
    } else {
      gsap.set(indicator, { x: btn.offsetLeft, scaleX: 1 });
    }
  }
  const pressed = () => filters && $('.filter-btn[aria-pressed="true"]', filters);
  moveIndicator(pressed(), false);
  window.addEventListener("resize", () => moveIndicator(pressed(), false));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(pressed(), false));

  let flipState = null;
  if (filters) {
    // Fase de captura: guarda as posições antes de main.js esconder os cards
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      if (anim() && Flip) flipState = Flip.getState(cards(), { props: "opacity" });
      moveIndicator(btn, anim());
    }, true);
  }
  document.addEventListener("injet:filter", () => {
    updateCount(anim());
    const state = flipState;
    flipState = null;
    if (!state) return;
    Flip.from(state, {
      duration: 0.5,
      ease: "power3.inOut",
      // só os que saem ficam absolutos: a grade mantém a altura (a página não pula)
      absoluteOnLeave: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, delay: 0.12, ease: "back.out(1.6)" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.6, duration: 0.3, ease: "power2.in" })
    });
  });

  if (!motionOK()) return;

  /* ---------- 1. Entrada (uma vez) ---------- */
  if (ScrollTrigger) {
    const all = cards();
    const frames = all.map((c) => $(".pcard-frame", c));
    const pills = all.map((c) => $(".pcard-pill", c));
    gsap.set(all, { y: 40, opacity: 0 });
    gsap.set(frames, { rotation: -8 });
    gsap.set(pills, { scale: 0 });
    ScrollTrigger.create({
      trigger: grid,
      start: "top 88%",
      once: true,
      onEnter: () => {
        const vis = all.filter((c) => !c.hidden);
        // cards escondidos por um filtro: ficam prontos, sem animação
        const hidden = all.filter((c) => c.hidden);
        if (hidden.length) {
          gsap.set(hidden, { clearProps: "transform,opacity" });
          gsap.set(hidden.map((c) => $(".pcard-frame", c)), { clearProps: "transform" });
          gsap.set(hidden.map((c) => $(".pcard-pill", c)), { clearProps: "transform" });
        }
        if (!vis.length) return;
        gsap.timeline()
          .to(vis, { y: 0, opacity: 1, duration: 0.6, ease: OUT, stagger: 0.06, clearProps: "transform,opacity" })
          .to(vis.map((c) => $(".pcard-frame", c)), { rotation: 0, duration: 0.7, ease: "back.out(1.6)", stagger: 0.06, clearProps: "rotation" }, 0)
          .to(vis.map((c) => $(".pcard-pill", c)), { scale: 1, duration: 0.45, ease: "back.out(3)", stagger: 0.06, clearProps: "transform" }, 0.35);
      }
    });
  }

  /* ---------- 3. Card 3D seguindo o mouse (computador) ---------- */
  function tilt(card) {
    const media = $(".pcard-media", card);
    const glare = $(".pcard-glare", card);
    const light = $(".pcard-glare i", card);
    const shadow = $(".pcard-shadow", card);
    const q = (el, prop) => gsap.quickTo(el, prop, { duration: 0.5, ease: OUT });
    const rx = q(card, "rotationX"), ry = q(card, "rotationY");
    const lx = q(light, "xPercent"), ly = q(light, "yPercent");
    let on = false;
    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !finePointer() || !motionOK()) return;
      on = true;
      gsap.set(card, { transformPerspective: 800 });
      gsap.to(media, { z: 40, duration: 0.45, ease: OUT, overwrite: "auto" });
      gsap.to([glare, shadow], { opacity: 1, duration: 0.35, overwrite: "auto" });
    });
    card.addEventListener("pointermove", (e) => {
      if (!on) return;
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 16);          // ±8°
      rx(-ny * 16);
      lx(nx * 50);          // o reflexo acompanha o cursor
      ly(ny * 50);
    });
    card.addEventListener("pointerleave", () => {
      if (!on) return;
      on = false;
      rx(0); ry(0); lx(0); ly(0);
      gsap.to(media, { z: 0, duration: 0.5, ease: OUT, overwrite: "auto" });
      gsap.to([glare, shadow], { opacity: 0, duration: 0.4, overwrite: "auto" });
    });
  }
  cards().forEach(tilt);
  // iOS: sem isto o :active (card afunda ao toque) não dispara
  document.addEventListener("touchstart", () => {}, { passive: true });

  /* ---------- 6. "+ Orçamento": a foto voa até o ícone do orçamento ---------- */
  function fly(img) {
    if (!img) return;
    const header = $("[data-header]");
    if (header) header.classList.remove("is-hidden"); // o header volta a aparecer
    const target = () => window.InjetQuote && window.InjetQuote.visibleButton();
    const r = img.getBoundingClientRect();
    if (!r.width) return;
    const clone = document.createElement("img");
    clone.src = img.currentSrc || img.src;
    clone.alt = "";
    clone.className = "pcard-flyer";
    clone.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    document.body.appendChild(clone);

    const start = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const p = { t: 0 };
    gsap.to(p, {
      t: 1,
      duration: 0.8,
      ease: "power1.inOut",
      onUpdate() {
        const btn = target();
        const tr = btn && btn.getBoundingClientRect();
        const end = tr && tr.width ? { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 } : { x: window.innerWidth - 40, y: 40 };
        // Curva: ponto de controle acima do caminho (Bézier quadrática)
        const c = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 160 };
        const t = p.t, u = 1 - t;
        const x = u * u * start.x + 2 * u * t * c.x + t * t * end.x;
        const y = u * u * start.y + 2 * u * t * c.y + t * t * end.y;
        gsap.set(clone, { x: x - start.x, y: y - start.y, scale: 1 - 0.86 * t, rotation: 18 * t, opacity: t > 0.85 ? (1 - t) / 0.15 : 1 });
      },
      onComplete() {
        clone.remove();
        if (window.InjetJumpCounter) window.InjetJumpCounter();
      }
    });
  }
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quote-add]");
    if (!btn || !anim()) return;
    const card = btn.closest(".pcard");
    fly($(".pcard-pic.is-active img", card));
    gsap.fromTo($(".pcard-add-icon", btn), { scale: 0.4, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(3)" });
  });

  /* ---------- 7. Palavra gigante "PRODUTOS" (parallax horizontal) ---------- */
  const word = $(".catalog-word", section);
  if (word && ScrollTrigger) {
    gsap.fromTo(word, { xPercent: -8 }, {
      xPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 }
    });
  }
})();
