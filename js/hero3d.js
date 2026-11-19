/* ==========================================================================
   INJET NOBRE – HERO 3D (interface + carregamento)
   - Variações e preços vêm do catálogo (js/products.js). O botão "Orçamento"
     usa o mesmo [data-quote-add] do site: quote.js adiciona e experience.js
     mostra o confete e o aviso.
   - A cena (js/hero3d-scene.js + Three.js) é importada logo após o HTML,
     mas só começa a animar quando a abertura do site termina.
   - O relógio (assets/relogio.glb, ~3,4 MB) só é baixado depois que a caixa
     caiu e abriu a tampa. Até lá "Tirar relógio" fica desativado; se falhar,
     o botão some.
   - Sem WebGL: foto real da variação escolhida (setas e bolinhas continuam).
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;
  const hero = document.getElementById("inicio");
  if (!hero || !R) return;

  const $ = (sel, ctx = hero) => ctx.querySelector(sel);
  const $$ = (sel, ctx = hero) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapOK = () => !!window.gsap && !reduceMotion();
  const SCENE_URL = new URL("hero3d-scene.js", document.currentScript.src).href;
  const WATCH_URL = new URL("../assets/relogio.glb", document.currentScript.src).href;

  /* ---------- Variações (visual) + produtos reais ---------- */
  const STEEL = "#ffffff", GOLD = "#ffcf7a", ROSE = "#ffc0a6";
  const ESTOJO = [
    { cor: "preto",    box: "#262626", pill: "#121212", bg: "#FF6A13", ink: "#111111", stroke: "rgba(255,255,255,.9)", watch: { metal: STEEL, dial: null } },
    { cor: "branco",   box: "#F1F1EF", pill: "#FAFAFA", bg: "#151515", ink: "#FFFFFF", stroke: "rgba(255,106,19,.9)", watch: { metal: STEEL, dial: "#e8e8e2" } },
    { cor: "amarelo",  box: "#F5C518", pill: "#EDB800", bg: "#FFF1BF", ink: "#111111", stroke: "rgba(17,17,17,.75)", watch: { metal: GOLD, dial: "#c9a04a" } },
    { cor: "azul",     box: "#3B9BE6", pill: "#1436B5", bg: "#DDEBFF", ink: "#111111", stroke: "rgba(17,17,17,.75)", watch: { metal: STEEL, dial: "#1f4fd0" } },
    { cor: "rosa",     box: "#E8338A", pill: "#D92A7C", bg: "#FFE0EE", ink: "#111111", stroke: "rgba(17,17,17,.75)", watch: { metal: ROSE, dial: "#e897bd" } },
    { cor: "vermelho", box: "#D61F26", pill: "#B9141B", bg: "#1A1A1A", ink: "#FFFFFF", stroke: "rgba(214,31,38,.95)", watch: { metal: STEEL, dial: "#b0141b" } }
  ];
  const ACRILICO = [
    { forma: "quad", int: "almofada", watch: { metal: STEEL, dial: null } },
    { forma: "quad", int: "espuma",   watch: { metal: STEEL, dial: "#1f4fd0" } },
    { forma: "red",  int: "almofada", watch: { metal: GOLD,  dial: null } },
    { forma: "red",  int: "espuma",   watch: { metal: STEEL, dial: "#e8e8e2" } }
  ];
  const ACR_LOOK = { bg: "#111111", ink: "#FFFFFF", stroke: "rgba(255,106,19,.95)" };
  const FORMA = { quad: "Quadrangular", red: "Redonda" };
  const INTERIOR = { espuma: "Espuma", almofada: "Almofada" };

  const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const estojoRefs = {};
  R.products.filter((p) => p.grupo === "estojo-relogio").forEach((p) => { estojoRefs[slug(p.variante)] = p; });
  const caixas = R.products.filter((p) => p.grupo === "caixa-acrilico");
  const LISTS = {
    estojo: ESTOJO.filter((v) => estojoRefs[v.cor]).map((v) => ({ ...v, product: estojoRefs[v.cor] })),
    acrilico: ACRILICO.map((v) => ({ ...v, product: caixas.find((p) => p.formato === FORMA[v.forma] && p.interior === INTERIOR[v.int]) }))
      .filter((v) => v.product)
  };
  if (!LISTS.estojo.length) return;

  const state = { prod: "estojo", i: 0 };
  const list = () => LISTS[state.prod];
  const cur = () => list()[state.i];
  const look = () => (state.prod === "estojo" ? cur() : ACR_LOOK);
  const isDark = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.45;
  };
  const variantName = (v) => (state.prod === "estojo" ? v.product.variante : `${v.product.formato} · ${v.product.interior}`);
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- Elementos ---------- */
  const stage = $("[data-hero-stage]");
  const photo = $("[data-hero-photo]");
  const hint = $("[data-hero-hint]");
  const lidBtn = $("[data-hero-lid]");
  const watchBtn = $("[data-hero-watch]");
  const addBtn = $("[data-hero-add]");
  const vname = $("[data-hero-vname]");

  if (!LISTS.acrilico.length) $('[data-hero-prod="acrilico"]').hidden = true;

  /* ---------- Cor de destaque para o header (js/header.js) ----------
     É a cor da caixa escolhida. Caixas muito escuras (estojo preto) e o
     acrílico (base preta) usam o laranja da marca, para não sumirem no
     vidro escuro do header. */
  function emitAccent() {
    const v = cur();
    const n = parseInt(v.box ? v.box.slice(1) : "000000", 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    const color = state.prod === "estojo" && lum > 0.2 ? v.box : "#FF6A13";
    window.InjetHeroAccent = color; // o header lê isto ao iniciar
    document.dispatchEvent(new CustomEvent("injet:hero-accent", { detail: { color } }));
  }

  /* ---------- Fundo: camadas trocadas por opacidade ---------- */
  let lastBg = "";
  function setTheme(l, animate) {
    if (l.bg === lastBg) return;
    lastBg = l.bg;
    const bgHost = $("[data-hero-bg]");
    const layer = document.createElement("span");
    layer.style.background = l.bg;
    bgHost.appendChild(layer);
    const old = Array.from(bgHost.children).filter((c) => c !== layer);
    const ink = () => {
      hero.style.setProperty("--h-bg", l.bg);
      hero.style.setProperty("--h-ink", l.ink);
      hero.style.setProperty("--h-stroke", l.stroke);
      hero.dataset.tone = isDark(l.bg) ? "dark" : "light";
      hero.classList.toggle("is-acrilico", state.prod === "acrilico");
    };
    if (animate && gsapOK()) {
      window.gsap.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.inOut", onComplete: () => old.forEach((o) => o.remove()) });
      setTimeout(ink, 300);
    } else {
      old.forEach((o) => o.remove());
      ink();
    }
  }

  /* ---------- Textos ---------- */
  function setName(text, dir) {
    const write = () => {
      vname.textContent = text;
      vname.classList.toggle("is-long", text.length > 10); // "Quadrangular · Espuma"
    };
    if (!dir || !gsapOK()) { write(); return; }
    const gsap = window.gsap;
    gsap.timeline()
      .to(vname, { yPercent: -dir * 100, opacity: 0, duration: 0.22, ease: "power2.in" })
      .add(write)
      .fromTo(vname, { yPercent: dir * 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.38, ease: "power3.out" });
  }

  function renderDots() {
    $("[data-hero-dots]").innerHTML = list().map((v, k) => `
      <button type="button" data-hero-dot="${k}" aria-label="${R.esc(variantName(v))}" ${k === state.i ? 'aria-current="true"' : ""}><i></i></button>`).join("");
  }

  let photoRef = "";
  function showPhoto() {
    const p = cur().product;
    if (photoRef === p.ref) return;
    photoRef = p.ref;
    photo.innerHTML = R.artHTML(p, { eager: true, sizes: "(min-width: 960px) 40vw, 80vw" });
  }

  function applyText(dir) {
    const v = cur();
    const p = v.product;
    $("[data-hero-title]").textContent = p.nome;
    $("[data-hero-tag]").textContent = p.rotuloLinha || "Linha relojoaria";
    $("[data-hero-price]").textContent = p.preco.toFixed(2).replace(".", ",");
    $("[data-hero-idx]").textContent = pad(state.i + 1);
    $("[data-hero-total]").textContent = pad(list().length);
    $("[data-hero-word]").textContent = state.prod === "estojo" ? "Estojo" : "Acrílico";
    setName(variantName(v), dir);
    renderDots();
    addBtn.dataset.quoteAdd = p.ref;
    $(".sr-only", addBtn).textContent = ` – adicionar ${R.fullName(p)} ao orçamento`;
    $("[data-hero-status]").textContent = `${R.fullName(p)}, ${R.formatPrice(p.preco)} por unidade.`;
    emitAccent();
  }

  /* ---------- Cena ---------- */
  let viewer = null;
  let ready = false;
  const sceneVariant = () => {
    const v = cur();
    return { prod: state.prod, forma: v.forma, int: v.int, colors: state.prod === "estojo" ? { box: v.box, pill: v.pill } : null, watch: v.watch };
  };

  function go(step) {
    if (!step) return;
    const n = list().length;
    const dir = step > 0 ? 1 : -1;
    state.i = (state.i + step + n * 10) % n;
    applyText(dir);
    if (viewer) {
      viewer.setVariant(sceneVariant(), { dir });
      // o fundo troca no meio do giro (setTimeout: não depende dos quadros do GSAP)
      if (gsapOK()) setTimeout(() => setTheme(look(), true), 260);
      else setTheme(look(), false);
    } else {
      setTheme(look(), true);
      showPhoto();
    }
  }

  function setProd(prod) {
    if (prod === state.prod) return;
    state.prod = prod;
    state.i = 0;
    $$("[data-hero-prod]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.heroProd === prod)));
    applyText(1);
    if (viewer) {
      viewer.setVariant(sceneVariant(), { prodChange: true });
      if (gsapOK()) setTimeout(() => setTheme(look(), true), 380);
      else setTheme(look(), false);
    } else {
      setTheme(look(), true);
      showPhoto();
    }
  }

  hero.addEventListener("click", (e) => {
    const step = e.target.closest("[data-hero-step]");
    if (step) return go(Number(step.dataset.heroStep));
    const dot = e.target.closest("[data-hero-dot]");
    if (dot) return go(Number(dot.dataset.heroDot) - state.i);
    const prod = e.target.closest("[data-hero-prod]");
    if (prod) return setProd(prod.dataset.heroProd);
  });
  lidBtn.addEventListener("click", () => { if (viewer) viewer.toggleLid(); });
  watchBtn.addEventListener("click", () => { if (viewer) viewer.toggleWatch(); });

  // Setas ←/→ trocam a variação: com o foco na hero, ou com a hero na tela e
  // nenhum outro controle em foco (não interfere na vitrine, modal etc.)
  let heroOnScreen = true;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
    const a = document.activeElement;
    const inHero = a && hero.contains(a) && !a.matches("input, textarea, select");
    const idle = (!a || a === document.body) && heroOnScreen;
    if (!inHero && !idle) return;
    e.preventDefault();
    go(e.key === "ArrowRight" ? 1 : -1);
  });
  // A dica some depois da primeira interação com a caixa
  stage.addEventListener("pointerdown", () => hero.classList.add("has-interacted"), { once: true });
  stage.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && viewer) {
      e.preventDefault();
      viewer.toggleLid();
    }
  });

  function syncLid(open) {
    $("span", lidBtn).innerHTML = `${open ? "Fechar" : "Abrir"}<span class="hero3d-long"> tampa</span>`;
  }
  function syncWatch(out) {
    $("span", watchBtn).innerHTML = `${out ? "Guardar" : "Tirar"}<span class="hero3d-long"> relógio</span>`;
  }

  /* ---------- Sem 3D ---------- */
  function fallback() {
    hero.classList.add("is-3d-fallback");
    lidBtn.hidden = true;
    watchBtn.hidden = true;
    hint.hidden = true;
    stage.removeAttribute("tabindex");
    stage.removeAttribute("data-cursor");
    showPhoto();
  }
  function webglSupported() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) {
      return false;
    }
  }

  const whenIdle = (cb) => ("requestIdleCallback" in window ? requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 300));
  const onReveal = (cb) => (window.InjetIntro ? window.InjetIntro.onReveal(cb) : cb());

  async function load() {
    if (!webglSupported()) return fallback();
    try {
      const mod = await import(SCENE_URL);
      const lowPower = window.matchMedia("(pointer: coarse)").matches
        || window.innerWidth < 760
        || (navigator.hardwareConcurrency || 8) <= 4;
      viewer = mod.createHero(stage, {
        reduce: reduceMotion(),
        lowPower,
        onLidChange: syncLid,
        onWatchChange: syncWatch,
        onFirstFrame: () => hero.classList.add("is-3d-ready"),
        // A caixa caiu e abriu a tampa: agora sim baixa o relógio
        onIntroDone: () => whenIdle(() => viewer.loadWatch(WATCH_URL)),
        onWatchReady: (ok) => {
          if (ok) watchBtn.disabled = false;
          else watchBtn.hidden = true;
        }
      });
      viewer.setVariant(sceneVariant());
      viewer.setDarkBackground(isDark(look().bg));
      ready = true;
      stage.tabIndex = 0;
      hint.textContent = window.matchMedia("(hover: hover)").matches
        ? "Arraste para girar · clique para abrir"
        : "Arraste para girar · toque para abrir";
      // Só anima depois da abertura do site; para quando a hero sai da tela
      onReveal(() => watchVisibility());
    } catch (err) {
      viewer = null;
      fallback();
    }
  }

  function watchVisibility() {
    const apply = () => {
      if (heroOnScreen && document.visibilityState === "visible") viewer.start();
      else viewer.stop();
    };
    new IntersectionObserver((entries) => {
      heroOnScreen = entries[0].isIntersecting;
      apply();
    }).observe(hero);
    document.addEventListener("visibilitychange", apply);
  }

  /* ---------- Início ---------- */
  watchBtn.disabled = true;
  syncLid(true);
  syncWatch(false);
  applyText(0);
  setTheme(look(), false);
  showPhoto(); // aparece até o 3D desenhar o primeiro quadro
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
