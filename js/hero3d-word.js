/* ==========================================================================
   INJET NOBRE – PALAVRA DO FUNDO DA HERO ("ESTOJO" / "ACRÍLICO")
   Cada letra é um pequeno SVG (contorno em <text>), dentro de uma "casa"
   que pode girar na vertical:
   - Ao carregar: o contorno é desenhado (stroke-dashoffset) e depois as
     letras sobem, uma após a outra.
   - Ao trocar de produto: letra por letra, com giro vertical (placar).
   - De tempos em tempos uma luz curta percorre o contorno.
   - Acompanha o mouse de leve (só com mouse).
   Com prefers-reduced-motion: reduce (ou sem GSAP) a palavra fica parada e a
   troca é instantânea. Sem JS fica o texto com -webkit-text-stroke do CSS.
   API: window.InjetHeroWord.set("Acrílico") (chamada por js/hero3d.js).
   ========================================================================== */

(function () {
  "use strict";

  const el = document.querySelector("[data-hero-word]");
  if (!el) return;
  const hero = el.closest(".hero3d") || document.body;

  const NS = "http://www.w3.org/2000/svg";
  const FS = 200;      // tamanho da fonte dentro de cada SVG (unidades do viewBox)
  const DASH = 1600;   // maior que o contorno de qualquer letra usada
  const GLINT = 130;   // comprimento da luz que passa pelo contorno
  const STROKE_PX = 2.6;
  const STROKE_PX_MOBILE = 1.5;  // celular: contorno mais fino e suave
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
  const FILL = 0.08;     // preenchimento leve (igual ao .hw-base do CSS)
  const motionOK = () => !!window.gsap && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  const up = (s) => String(s).trim().toLocaleUpperCase("pt-BR");
  const words = (el.dataset.heroWords || el.textContent).split("|").map(up);

  let word = up(el.textContent);
  let inner = null;          // .hw-inner (parallax) com as casas .hw-ch
  let ctx = null;            // canvas para medir as letras
  let metrics = null;        // { asc, desc } comuns a todas as letras
  let tl = null;             // animação em andamento (entrada ou troca)
  let introDone = false;
  let flipping = false;      // troca em placar em andamento (larguras animadas)
  let glintCall = null;
  let onScreen = true;

  /* ---------- Medidas ---------- */
  function setupMeasure() {
    const family = getComputedStyle(el).fontFamily;
    ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `700 ${FS}px ${family}`;
    const a = ctx.measureText("ÁÉÍÓÚÂÊÔÃÕÇESTOJACRLI");
    const d = ctx.measureText(words.join(""));
    metrics = {
      asc: Math.ceil(a.actualBoundingBoxAscent || FS * 0.95) + 6,
      desc: Math.ceil(d.actualBoundingBoxDescent || FS * 0.05) + 6
    };
  }
  const widthOf = (ch) => (ch ? ctx.measureText(ch).width : 0);
  const em = (units) => `${(units / FS).toFixed(4)}em`;

  /* ---------- Letras ---------- */
  function glyph(ch) {
    const w = Math.max(1, widthOf(ch));
    const h = metrics.asc + metrics.desc;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${w.toFixed(2)} ${h}`);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.width = em(w);
    svg.style.height = em(h);
    ["hw-base", "hw-glint"].forEach((cls) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("class", cls);
      t.setAttribute("x", "0");
      t.setAttribute("y", String(metrics.asc));
      t.textContent = ch;
      svg.appendChild(t);
    });
    return svg;
  }

  function makeCell(ch) {
    const c = document.createElement("span");
    c.className = "hw-ch";
    c.dataset.ch = ch;
    c.style.width = em(widthOf(ch));
    c.appendChild(glyph(ch));
    return c;
  }

  function swapGlyph(c, ch) {
    c.dataset.ch = ch;
    c.replaceChildren(glyph(ch));
  }

  const cells = () => (inner ? Array.from(inner.children) : []);
  const part = (cls) => cells().map((c) => c.querySelector(cls)).filter(Boolean);

  function build(text) {
    inner.replaceChildren(...Array.from(text).map(makeCell));
  }

  /* Fonte chegou depois de montar: atualiza as medidas no lugar (sem recriar
     os elementos, para não interromper a entrada ou a troca) */
  function remeasure() {
    setupMeasure();
    const h = metrics.asc + metrics.desc;
    cells().forEach((c) => {
      const w = Math.max(1, widthOf(c.dataset.ch));
      const svg = c.querySelector("svg");
      if (!svg) return;
      svg.setAttribute("viewBox", `0 0 ${w.toFixed(2)} ${h}`);
      svg.style.width = em(w);
      svg.style.height = em(h);
      svg.querySelectorAll("text").forEach((t) => t.setAttribute("y", String(metrics.asc)));
      if (!flipping) c.style.width = em(c.dataset.ch ? w : 0);
    });
    fit();
  }

  /* ---------- Tamanho ----------
     Computador: palavra longa encolhe para caber (92% da largura).
     Celular: "ESTOJO" e "ACRÍLICO" sempre inteiras, com ~90% da largura.
     Escala no .hw-inner (o GSAP junta com o x/y do mouse); o contorno é
     compensado para manter a mesma espessura na tela. */
  function fit(text = word, animate = false) {
    const px = parseFloat(getComputedStyle(el).fontSize) || 200;
    const wordPx = (Array.from(text).reduce((s, ch) => s + widthOf(ch), 0) / FS) * px;
    const mobile = isMobile();
    const target = (hero.clientWidth * (mobile ? 0.9 : 0.92)) / Math.max(1, wordPx);
    const scale = mobile ? target : Math.min(1, target);
    el.style.setProperty("--hw-sw", `${(((mobile ? STROKE_PX_MOBILE : STROKE_PX) * FS) / (px * scale)).toFixed(2)}px`);
    if (window.gsap) window.gsap.to(inner, { scale, duration: animate ? 0.6 : 0, ease: "power3.inOut", overwrite: "auto" });
    else inner.style.transform = `scale(${scale})`;
  }

  /* ---------- Entrada: desenha o contorno, depois as letras sobem ---------- */
  function intro() {
    const gsap = window.gsap;
    const cs = cells();
    const bases = part(".hw-base");
    gsap.set(bases, { strokeDasharray: DASH, strokeDashoffset: DASH, fillOpacity: 0 });
    gsap.set(cs, { yPercent: 26 });
    el.classList.remove("hw-pending");
    tl = gsap.timeline({ onComplete: finishIntro })
      .to(bases, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: 0.09 })
      .to(cs, { yPercent: 0, duration: 0.7, ease: "back.out(1.8)", stagger: 0.08 }, "-=0.55")
      .to(bases, { fillOpacity: FILL, duration: 0.6, ease: "power1.out", stagger: 0.08 }, "<0.1");
  }

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    tl = null;
    el.classList.remove("hw-pending");
    if (window.gsap) {
      window.gsap.set(part(".hw-base"), { clearProps: "strokeDasharray,strokeDashoffset,fillOpacity" });
      window.gsap.set(cells(), { clearProps: "transform" });
    }
    if (motionOK()) scheduleGlint(2.2);
  }

  /* ---------- Luz que percorre o contorno ---------- */
  function scheduleGlint(delay) {
    if (glintCall) glintCall.kill();
    glintCall = window.gsap.delayedCall(delay, glint);
  }
  function glint() {
    if (!motionOK()) return;
    // no celular a luz fica desligada (aparecia como trechos brancos sobre as letras)
    if (onScreen && !tl && !isMobile()) {
      window.gsap.fromTo(part(".hw-glint"),
        { strokeDashoffset: GLINT, opacity: 1 },
        { strokeDashoffset: -DASH * 0.75, duration: 2.6, ease: "power1.inOut", stagger: 0.14,
          onComplete() { window.gsap.set(this.targets(), { opacity: 0 }); } });
    }
    scheduleGlint(6 + Math.random() * 2);
  }

  /* ---------- Troca de palavra: letra por letra, giro vertical (placar) ---------- */
  function set(text) {
    const next = up(text);
    if (next === word) return;
    const prevWord = word;
    word = next;
    if (!inner) { el.textContent = text; return; }   // ainda não montado: só o texto

    if (!introDone) finishIntro();
    if (tl) { tl.kill(); tl = null; flipping = false; build(prevWord); }
    fit(next, motionOK());
    if (!motionOK()) { build(next); return; }
    flipping = true;

    const gsap = window.gsap;
    const chars = Array.from(next);
    const cs = cells();
    // casas novas entram com largura zero (palavra maior)
    while (cs.length < chars.length) {
      const c = makeCell("");
      c.style.width = "0em";
      inner.appendChild(c);
      cs.push(c);
    }
    tl = gsap.timeline({
      onComplete() {
        cs.forEach((c) => { if (!c.dataset.ch) c.remove(); });
        gsap.set(cells(), { clearProps: "transform" });
        tl = null;
        flipping = false;
      }
    });
    cs.forEach((c, i) => {
      const ch = chars[i] || "";
      const at = i * 0.07;
      tl.to(c, { rotationX: -90, opacity: 0.4, duration: 0.2, ease: "power2.in" }, at)
        .add(() => swapGlyph(c, ch), at + 0.2)
        .to(c, { width: em(widthOf(ch)), duration: 0.34, ease: "power2.inOut" }, at + 0.08)
        .fromTo(c, { rotationX: 90, opacity: 0.4 }, { rotationX: 0, opacity: 1, duration: 0.42, ease: "back.out(2.2)" }, at + 0.2);
    });
  }

  /* ---------- Acompanha o mouse ---------- */
  function parallax() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const gsap = window.gsap;
    const qx = gsap.quickTo(inner, "x", { duration: 1.1, ease: "power3.out" });
    const qy = gsap.quickTo(inner, "y", { duration: 1.1, ease: "power3.out" });
    const qr = gsap.quickTo(inner, "rotationY", { duration: 1.1, ease: "power3.out" });
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !motionOK()) return;
      const r = hero.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      qx(-nx * 26);
      qy(-ny * 14);
      qr(nx * 5);
    });
    hero.addEventListener("pointerleave", () => { qx(0); qy(0); qr(0); });
  }

  /* ---------- Início ---------- */
  function mount() {
    setupMeasure();
    inner = document.createElement("span");
    inner.className = "hw-inner";
    el.replaceChildren(inner);
    build(word);
    el.classList.add("is-svg");
    fit();
    window.addEventListener("resize", () => fit(), { passive: true });
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(remeasure);
    new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; }).observe(hero);

    if (!motionOK()) { introDone = true; return; }
    el.classList.add("hw-pending");
    parallax();
    const reveal = (cb) => (window.InjetIntro ? window.InjetIntro.onReveal(cb) : cb());
    reveal(() => setTimeout(() => { if (!introDone && !tl) intro(); }, 120));
  }

  window.InjetHeroWord = { set };

  // Monta depois que a fonte dos títulos carrega (as medidas dependem dela)
  const start = () => {
    const fonts = document.fonts;
    if (!fonts || !fonts.load) return mount();
    const family = getComputedStyle(el).fontFamily;
    Promise.race([
      fonts.load(`700 ${FS}px ${family}`, word),
      new Promise((r) => setTimeout(r, 1500))
    ]).then(mount, mount);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
