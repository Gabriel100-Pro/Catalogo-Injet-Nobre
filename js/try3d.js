/* ==========================================================================
   INJET NOBRE – "EXPERIMENTE EM 3D" (interface + carregamento sob demanda)
   - Os produtos, refs e preços vêm do catálogo (js/products.js): o botão
     "Adicionar ao orçamento" usa o mesmo [data-quote-add] do resto do site,
     então quote.js e experience.js (confete, aviso) funcionam sem código novo.
   - A cena (js/try3d-scene.js + Three.js) só é importada quando a seção chega
     perto da tela e depois da abertura do site.
   - Sem WebGL (ou se o 3D falhar), fica a foto real do produto escolhido.
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;
  const section = document.getElementById("experimente-3d");
  if (!section || !R) return;

  const $ = (sel, ctx = section) => ctx.querySelector(sel);
  const $$ = (sel, ctx = section) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SCENE_URL = new URL("try3d-scene.js", document.currentScript.src).href;

  /* ---------- Visual de cada cor (caixa, almofada e fundo da seção) ---------- */
  const COLOR_ORDER = ["amarelo", "azul", "branco", "preto", "rosa", "vermelho"];
  const LOOK = {
    amarelo:  { box: "#F5C518", pill: "#EDB800", bg: "#FFF1BF", ink: "#111111", stroke: "rgba(17,17,17,.7)" },
    azul:     { box: "#3B9BE6", pill: "#1436B5", bg: "#DDEBFF", ink: "#111111", stroke: "rgba(17,17,17,.7)" },
    branco:   { box: "#F1F1EF", pill: "#FAFAFA", bg: "#151515", ink: "#FFFFFF", stroke: "rgba(255,106,19,.9)" },
    preto:    { box: "#262626", pill: "#121212", bg: "#FF6A13", ink: "#111111", stroke: "rgba(255,255,255,.9)" },
    rosa:     { box: "#E8338A", pill: "#D92A7C", bg: "#FFE0EE", ink: "#111111", stroke: "rgba(17,17,17,.7)" },
    vermelho: { box: "#D61F26", pill: "#B9141B", bg: "#1A1A1A", ink: "#FFFFFF", stroke: "rgba(214,31,38,.95)" }
  };
  const ACRYLIC_LOOK = { bg: "#111111", ink: "#FFFFFF", stroke: "rgba(255,106,19,.95)" };
  const FORMA = { quad: "Quadrangular", red: "Redonda" };
  const INTERIOR = { espuma: "Espuma", almofada: "Almofada" };
  const TEXT = {
    estojo: "Tampa encaixada e almofada macia. Gire, abra a tampa e escolha a cor.",
    acrilico: "Base preta e tampa transparente: o relógio aparece sem abrir a caixa."
  };

  /* ---------- Produtos reais do catálogo ---------- */
  const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const estojos = {};
  R.products.filter((p) => p.grupo === "estojo-relogio").forEach((p) => { estojos[slug(p.variante)] = p; });
  const cores = COLOR_ORDER.filter((k) => estojos[k]);
  const caixas = R.products.filter((p) => p.grupo === "caixa-acrilico");
  const caixaFor = (forma, int) => caixas.find((p) => p.formato === FORMA[forma] && p.interior === INTERIOR[int]);
  if (!cores.length) { section.hidden = true; return; }

  const state = { prod: "estojo", cor: estojos.preto ? "preto" : cores[0], forma: "quad", int: "almofada" };
  const current = () => (state.prod === "estojo" ? estojos[state.cor] : caixaFor(state.forma, state.int));
  const look = () => (state.prod === "estojo" ? LOOK[state.cor] : ACRYLIC_LOOK);
  const priceText = (p) => p.preco.toFixed(2).replace(".", ",");
  const isDark = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.45;
  };

  /* ---------- Elementos ---------- */
  const stage = $("[data-try3d-stage]");
  const photo = $("[data-try3d-photo]");
  const hint = $("[data-try3d-hint]");
  const word = $("[data-try3d-word]");
  const bgHost = $("[data-try3d-bg]");
  const lidBtn = $("[data-try3d-lid]");
  const addBtn = $("[data-try3d-add]");

  // Bolinhas de cor (radios nativos: setas do teclado já funcionam)
  $("[data-try3d-swatches]").innerHTML = cores.map((k) => {
    const p = estojos[k];
    return `
      <label class="swatch" title="${R.esc(p.variante)}">
        <input type="radio" name="try3d-cor" value="${k}" ${k === state.cor ? "checked" : ""}>
        <span class="swatch-dot" style="--dot: ${LOOK[k].box}" aria-hidden="true"></span>
        <span class="sr-only">${R.esc(p.variante)}</span>
      </label>`;
  }).join("");

  // Preço real de cada interior no rótulo ("Espuma · R$ 1,90")
  $$('input[name="try3d-int"]').forEach((input) => {
    const p = caixaFor(state.forma, input.value) || caixas.find((c) => c.interior === INTERIOR[input.value]);
    if (p) input.nextElementSibling.textContent = `${INTERIOR[input.value]} · ${R.formatPrice(p.preco)}`;
  });
  if (!caixas.length) {
    const opt = $('input[name="try3d-prod"][value="acrilico"]');
    if (opt) opt.closest("label").hidden = true;
  }

  /* ---------- Fundo da seção: camadas de cor trocadas por opacidade ---------- */
  let lastBg = "";
  function setTheme(l, animate) {
    if (l.bg === lastBg) return;
    lastBg = l.bg;
    const gsap = window.gsap;
    const layer = document.createElement("span");
    layer.style.background = l.bg;
    bgHost.appendChild(layer);
    const old = Array.from(bgHost.children).filter((c) => c !== layer);
    const applyInk = () => {
      section.style.setProperty("--t-bg", l.bg);
      section.style.setProperty("--t-ink", l.ink);
      section.style.setProperty("--t-stroke", l.stroke);
      section.dataset.tone = isDark(l.bg) ? "dark" : "light";
    };
    if (animate && gsap && !reduceMotion()) {
      gsap.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.inOut", onComplete: () => old.forEach((o) => o.remove()) });
      gsap.delayedCall(0.25, applyInk); // texto troca no meio do fade
    } else {
      old.forEach((o) => o.remove());
      applyInk();
    }
  }

  /* ---------- Foto real (antes do 3D carregar, ou sem WebGL) ---------- */
  let photoRef = "";
  function showPhoto(p) {
    if (!p || photoRef === p.ref) return;
    photoRef = p.ref;
    photo.innerHTML = R.artHTML(p, { sizes: "(min-width: 960px) 46vw, 86vw" });
  }

  /* ---------- Sincroniza interface + cena ---------- */
  let viewer = null;
  let ready = false;

  function sync({ pop = true, reopen = false, animate = true } = {}) {
    const p = current();
    if (!p) return;
    const l = look();
    const name = R.fullName(p);

    $("[data-try3d-title]").textContent = p.nome;
    $("[data-try3d-desc]").textContent = TEXT[state.prod];
    $("[data-try3d-price]").textContent = priceText(p);
    $("[data-try3d-variant]").textContent = state.prod === "estojo"
      ? p.variante
      : `${p.formato} · com ${p.interior.toLowerCase()}`;
    $("[data-try3d-cor]").textContent = estojos[state.cor].variante;
    $$("[data-try3d-group]").forEach((g) => { g.hidden = g.dataset.try3dGroup !== state.prod; });
    word.textContent = state.prod === "estojo" ? "Estojo" : "Acrílico";

    // Mesmo botão do catálogo: quote.js adiciona, experience.js comemora
    addBtn.dataset.quoteAdd = p.ref;
    $(".sr-only", addBtn).textContent = ` – ${name}`;
    $$("[data-buy] [aria-label]").forEach((el) => {
      el.setAttribute("aria-label", el.getAttribute("aria-label").replace(/ de .*$/, ` de ${name}`));
    });

    setTheme(l, animate);
    if (!ready) showPhoto(p);
    if (viewer) {
      viewer.update({ prod: state.prod, forma: state.forma, int: state.int, colors: LOOK[state.cor] }, { pop, reopen });
      viewer.setDarkBackground(isDark(l.bg));
    }
  }

  function syncLid(open) {
    lidBtn.textContent = open ? "Fechar tampa" : "Abrir tampa";
  }

  section.addEventListener("change", (e) => {
    const input = e.target;
    if (!input.name || !input.name.startsWith("try3d-")) return;
    const key = input.name.slice(6); // prod | cor | forma | int
    state[key] = input.value;
    sync({ reopen: key === "prod" });
  });
  lidBtn.addEventListener("click", () => { if (viewer) viewer.toggleLid(); });

  /* ---------- Sem 3D: foto real ---------- */
  function fallback(message) {
    section.classList.add("is-3d-fallback");
    lidBtn.hidden = true;
    hint.textContent = message;
    stage.removeAttribute("tabindex");
    stage.removeAttribute("data-cursor");
    showPhoto(current());
  }

  function webglSupported() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) {
      return false;
    }
  }

  /* ---------- Carrega o 3D só quando precisa ---------- */
  let loading = false;
  async function load() {
    if (loading) return;
    loading = true;
    if (!webglSupported()) return fallback("Este aparelho não exibe 3D. Veja a foto real do produto.");

    hint.textContent = "Carregando 3D…";
    try {
      const mod = await import(SCENE_URL);
      const lowPower = window.matchMedia("(pointer: coarse)").matches
        || window.innerWidth < 760
        || (navigator.hardwareConcurrency || 8) <= 4;
      viewer = mod.createViewer(stage, {
        reduce: reduceMotion(),
        lowPower,
        colors: LOOK[state.cor],
        onLidChange: syncLid,
        onFirstFrame: () => section.classList.add("is-3d-ready")
      });
      ready = true;
      stage.tabIndex = 0;
      hint.textContent = window.matchMedia("(hover: hover)").matches
        ? "Arraste para girar · clique para abrir"
        : "Arraste para girar · toque para abrir";
      sync({ pop: false, animate: false });
      watchVisibility();
    } catch (err) {
      viewer = null;
      fallback("Não foi possível carregar o 3D. Veja a foto real do produto.");
    }
  }

  // Desenha só enquanto a seção está na tela (economiza bateria no celular)
  function watchVisibility() {
    let onScreen = false;
    const apply = () => {
      if (onScreen && document.visibilityState === "visible") viewer.start();
      else viewer.stop();
    };
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      apply();
    }).observe(stage);
    document.addEventListener("visibilitychange", apply);
  }

  function armLazyLoad() {
    if (!("IntersectionObserver" in window)) return load();
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      io.disconnect();
      load();
    }, { rootMargin: "250px 0px" });
    io.observe(section);
  }

  /* ---------- Início ---------- */
  sync({ pop: false, animate: false });
  syncLid(true);
  // Espera a abertura do site e o carregamento da página (fotos do hero)
  // terminarem, e um momento ocioso, para não disputar rede/CPU com eles
  const whenIdle = (cb) => ("requestIdleCallback" in window ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200));
  const afterLoad = (cb) => (document.readyState === "complete" ? cb() : window.addEventListener("load", cb, { once: true }));
  const begin = () => {
    const go = () => afterLoad(() => whenIdle(armLazyLoad));
    if (window.InjetIntro) window.InjetIntro.onReveal(go);
    else go();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin);
  else begin();
})();
