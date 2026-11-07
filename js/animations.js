/* ==========================================================================
   INJET NOBRE – ANIMAÇÕES (GSAP + ScrollTrigger)
   Regras:
   - Só transform e opacity (bom desempenho no celular).
   - Durações de até 0,8 s, com cascata (stagger) entre itens de grade.
   - Tudo dentro de gsap.matchMedia: com prefers-reduced-motion: reduce
     nada aqui roda e o site fica estático. Se o GSAP não carregar, idem.
   ========================================================================== */

(function () {
  "use strict";

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  // Libera o hero escondido pelo <head> (antes de qualquer tween ler a opacidade)
  const releaseHero = () => document.documentElement.classList.remove("motion-pending");
  if (!gsap || !ScrollTrigger) return releaseHero();

  gsap.registerPlugin(ScrollTrigger);

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const BOUNCE = "back.out(1.7)";   // "quique" no fim da entrada das imagens
  const POP = "back.out(3)";        // selos e círculos de preço
  const OUT = "power3.out";

  const motionQuery = "(prefers-reduced-motion: no-preference)";
  const allowMotion = () => window.matchMedia(motionQuery).matches;
  const headerH = () => ($(".site-header") || { offsetHeight: 0 }).offsetHeight;

  // Entrada padrão das imagens: ~15° + escala, terminando com quique
  const imageFrom = (dir = 1) => ({ rotation: 15 * dir, scale: 0.7, opacity: 0 });
  const imageTo = { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: BOUNCE };

  /* ---------- Hero: título linha por linha ---------- */
  function hero() {
    const tl = gsap.timeline({ defaults: { ease: OUT, duration: 0.7 } });
    tl.from(".hero-title .line-inner", { yPercent: 110, duration: 0.8, stagger: 0.12 })
      .from("[data-hero-intro]", { x: -48, opacity: 0, stagger: 0.08 }, "-=0.5")
      .fromTo(".hero-feature .media-frame", imageFrom(1), { ...imageTo }, 0.25)
      .from(".hero-feature [data-pop]", { scale: 0, duration: 0.45, ease: POP }, "-=0.3")
      .from(".hero-feature-body > *", { x: 48, opacity: 0, stagger: 0.06, duration: 0.6 }, "-=0.55");
  }

  /* ---------- Entrada de um slide da vitrine ---------- */
  function slideTimeline(slide, vars) {
    const tl = gsap.timeline(vars);
    tl.fromTo($(".slide-art", slide), imageFrom(1), { ...imageTo })
      .from($$("[data-pop]", slide), { scale: 0, duration: 0.45, ease: POP, stagger: 0.1 }, "-=0.35")
      .from($$(".slide-info > *", slide), { x: 60, opacity: 0, duration: 0.55, ease: OUT, stagger: 0.05 }, 0.1);
    return tl;
  }

  /* ---------- Vitrine no desktop: rolagem horizontal presa ---------- */
  function vitrinePinned() {
    const section = $(".vitrine");
    const viewport = $("#vitrine-viewport");
    const track = $("#vitrine-track");
    const V = window.InjetVitrine;
    if (!section || !track || !V) return () => {};

    section.classList.add("is-pinned");
    viewport.scrollLeft = 0;
    const slides = $$(".slide", track);
    const n = slides.length;
    const distance = () => track.scrollWidth - viewport.clientWidth;

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: () => `top ${headerH()}`,
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        snap: n > 1 ? { snapTo: 1 / (n - 1), inertia: false, duration: { min: 0.2, max: 0.6 }, ease: "power1.inOut" } : false,
        invalidateOnRefresh: true,
        onUpdate: (self) => V.update(Math.round(self.progress * (n - 1)), self.progress)
      }
    });

    // Setas e foco por teclado rolam a página até o slide
    V.pinnedGoTo = (i) => {
      const st = tween.scrollTrigger;
      const y = st.start + (st.end - st.start) * (n > 1 ? i / (n - 1) : 0);
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    slides.forEach((slide, i) => {
      // Número gigante vazado com parallax horizontal
      gsap.fromTo($(".slide-number", slide), { xPercent: 25 }, {
        xPercent: -25,
        ease: "none",
        scrollTrigger: { trigger: slide, containerAnimation: tween, start: "left right", end: "right left", scrub: true }
      });

      slideTimeline(slide, {
        scrollTrigger: i === 0
          ? { trigger: section, start: "top 70%", toggleActions: "play none none none" }
          : { trigger: slide, containerAnimation: tween, start: "left 65%", toggleActions: "play none none reverse" }
      });
    });

    return () => {
      V.pinnedGoTo = null;
      section.classList.remove("is-pinned");
    };
  }

  /* ---------- Vitrine no celular: carrossel com entrada por slide ---------- */
  function vitrineCarousel() {
    const first = $(".slide");
    if (first) slideTimeline(first, { scrollTrigger: { trigger: ".vitrine", start: "top 75%" } });

    const onChange = (e) => {
      const slide = $$(".slide")[e.detail.index];
      if (!slide) return;
      gsap.fromTo($(".slide-art", slide), { rotation: 12, scale: 0.85 }, { rotation: 0, scale: 1, duration: 0.7, ease: BOUNCE, overwrite: true });
      gsap.fromTo($$("[data-pop]", slide), { scale: 0 }, { scale: 1, duration: 0.45, ease: POP, delay: 0.25, stagger: 0.08, overwrite: true });
    };
    document.addEventListener("injet:vitrine", onChange);
    return () => document.removeEventListener("injet:vitrine", onChange);
  }

  /* ---------- Destaques de linha em tela cheia ---------- */
  function spotlights() {
    $$(".spotlight").forEach((spot, i) => {
      const dir = i % 2 ? 1 : -1;

      // Nome gigante vazado desliza atrás do produto
      gsap.fromTo($(".spotlight-word", spot), { xPercent: 12 * -dir }, {
        xPercent: 18 * dir,
        ease: "none",
        scrollTrigger: { trigger: spot, start: "top bottom", end: "bottom top", scrub: true }
      });

      // Leve parallax vertical do produto (propriedade diferente da entrada)
      gsap.fromTo($(".spotlight-art", spot), { yPercent: 8 }, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: spot, start: "top bottom", end: "bottom top", scrub: true }
      });

      gsap.timeline({ scrollTrigger: { trigger: spot, start: "top 60%" } })
        .fromTo($(".spotlight-art", spot), imageFrom(dir * -1), { ...imageTo })
        .from($$("[data-pop]", spot), { scale: 0, duration: 0.45, ease: POP, stagger: 0.1 }, "-=0.35")
        .from($$(".spotlight-info > *", spot), { x: 60 * dir, opacity: 0, duration: 0.6, ease: OUT, stagger: 0.07 }, 0.15);
    });
  }

  /* ---------- Cards e tiles das grades ---------- */
  function grids() {
    const cards = $$(".card");
    cards.forEach((card) => {
      gsap.set($(".media-frame", card), imageFrom(1));
      gsap.set($$("[data-pop]", card), { scale: 0 });
      gsap.set($$(".card-body > *", card), { y: 24, opacity: 0 });
    });

    ScrollTrigger.batch(cards, {
      start: "top 85%",
      once: true,
      onEnter: (batch) => {
        batch.forEach((card, i) => {
          const delay = i * 0.08; // cascata entre itens da grade
          const dir = i % 2 ? -1 : 1;
          gsap.fromTo($(".media-frame", card), imageFrom(dir), { ...imageTo, delay });
          gsap.to($$("[data-pop]", card), { scale: 1, duration: 0.45, ease: POP, delay: delay + 0.45, stagger: 0.1 });
          gsap.to($$(".card-body > *", card), { y: 0, opacity: 1, duration: 0.5, ease: OUT, delay: delay + 0.15, stagger: 0.04 });
        });
      }
    });

    $$(".tile").forEach((tile, i) => {
      gsap.from(tile.children, {
        x: (tile.classList.contains("tile--line") ? -1 : 1) * 60,
        opacity: 0,
        duration: 0.6,
        ease: OUT,
        stagger: 0.08,
        delay: i % 2 ? 0.1 : 0,
        scrollTrigger: { trigger: tile, start: "top 85%" }
      });
    });
  }

  /* ---------- Textos entram pelos lados, alternando por seção ---------- */
  function textReveals() {
    const groups = [
      { trigger: "#produtos .section-head", items: "#produtos .section-head > div > *, #produtos .filter" },
      { trigger: "#ofertas", items: ".offers-head > *", opposite: ".offers-list > li" },
      { trigger: "#sobre", items: ".about-text > *", opposite: ".about-stats > li" },
      { trigger: "#atacado", items: ".wholesale-grid > div:first-child > *", opposite: ".wholesale-side > *" },
      { trigger: "#contato", items: ".footer-brand > *, .footer-contact > *", opposite: ".footer-map, .footer-qr" }
    ];

    groups.forEach((g, i) => {
      const dir = i % 2 ? 1 : -1; // esquerda, direita, esquerda...
      const tl = gsap.timeline({ scrollTrigger: { trigger: g.trigger, start: "top 78%" } });
      tl.from(g.items, { x: 70 * dir, opacity: 0, duration: 0.7, ease: OUT, stagger: 0.08 });
      if (g.opposite) {
        tl.from(g.opposite, { x: -70 * dir, opacity: 0, duration: 0.6, ease: OUT, stagger: 0.08 }, 0.15);
      }
    });
  }

  /* ---------- Quadradinhos: flutuação + parallax ---------- */
  function floaters() {
    $$(".dots-pattern").forEach((el, i) => {
      // y = flutuação; yPercent = parallax (propriedades independentes no GSAP)
      gsap.to(el, {
        y: -10,
        rotation: i % 2 ? 8 : -8,
        duration: 2.2 + (i % 3) * 0.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
      if (el.closest(".vitrine")) return; // dentro da área presa, só flutua
      gsap.fromTo(el, { yPercent: 0 }, {
        yPercent: i % 2 ? -160 : -90,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ---------- Sobre a fábrica: contador + fotos ---------- */
  const formatCount = (el, value) => {
    el.textContent = `${Math.round(value).toLocaleString("pt-BR")}${el.dataset.suffix || ""}`;
  };

  function counters() {
    $$("[data-count]").forEach((el, i) => {
      const target = Number(el.dataset.count) || 0;
      const state = { v: 0 };
      formatCount(el, 0);
      ScrollTrigger.create({
        trigger: el.closest("ul") || el,
        start: "top 80%",
        once: true,
        onEnter: () => gsap.to(state, {
          v: target,
          duration: 0.8,
          delay: i * 0.08, // cascata entre os números
          ease: "power2.out",
          onUpdate: () => formatCount(el, state.v)
        })
      });
    });
  }

  function factoryGallery() {
    const photos = $$(".factory-item");
    gsap.set(photos, { rotation: (i) => (i % 2 ? -8 : 8), scale: 0.8, opacity: 0 });
    ScrollTrigger.batch(photos, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: BOUNCE, stagger: 0.08 })
    });
  }

  /* ---------- Orçamento: ícone pula ao adicionar, painel desliza ---------- */
  function onQuoteAdd() {
    if (!allowMotion()) return;
    gsap.fromTo("#quote-fab", { scale: 0.8 }, { scale: 1, duration: 0.5, ease: POP, clearProps: "transform" });
    gsap.fromTo("#quote-count", { scale: 0 }, { scale: 1, duration: 0.45, ease: POP, delay: 0.1, clearProps: "transform" });
  }

  function onQuoteOpen(e) {
    if (!allowMotion()) return;
    const inner = $(".drawer-inner", e.detail.drawer);
    gsap.timeline()
      .fromTo(inner, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: OUT, clearProps: "transform" })
      .from($$(".quote-item, .quote-empty > *", inner), { x: 40, opacity: 0, duration: 0.4, ease: OUT, stagger: 0.05, clearProps: "transform,opacity" }, 0.15);
  }

  /* ---------- Modal showcase ---------- */
  function onModal(e, isChange) {
    if (!allowMotion()) return;
    const c = e.detail.content;
    const tl = gsap.timeline();
    tl.fromTo($(".stage-frame", c),
      isChange ? { scale: 0.88, rotation: 6, opacity: 0 } : { scale: 0.75, rotation: 12, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: isChange ? 0.55 : 0.7, ease: BOUNCE, clearProps: "transform,opacity" })
      .from($$("[data-pop]", c), { scale: 0, duration: 0.4, ease: POP, stagger: 0.1, clearProps: "transform" }, "-=0.3")
      .from($$(".modal-body > *", c), { x: 40, opacity: 0, duration: 0.45, ease: OUT, stagger: 0.04, clearProps: "transform,opacity" }, 0.05)
      .from($$(".thumb", c), { y: 16, opacity: 0, duration: 0.35, ease: OUT, stagger: 0.06, clearProps: "transform,opacity" }, 0.2);
  }

  function onGalleryChange(e) {
    if (!allowMotion() || !e.detail.item) return;
    gsap.fromTo(e.detail.item.firstElementChild, { scale: 0.9, rotation: -4 }, {
      scale: 1, rotation: 0, duration: 0.5, ease: BOUNCE, clearProps: "transform"
    });
  }

  /* ---------- Inicialização ---------- */
  function init() {
    releaseHero();
    const mm = gsap.matchMedia();

    mm.add({ motion: motionQuery, desktop: "(min-width: 960px)" }, (ctx) => {
      if (!ctx.conditions.motion) return; // movimento reduzido: tudo estático

      document.documentElement.classList.add("has-motion");
      hero();
      // A área presa precisa ser criada antes dos gatilhos abaixo dela
      const cleanupVitrine = ctx.conditions.desktop ? vitrinePinned() : vitrineCarousel();
      spotlights();
      grids();
      textReveals();
      counters();
      factoryGallery();
      floaters();

      return () => {
        cleanupVitrine && cleanupVitrine();
        // contadores voltam ao valor final se o movimento for desativado
        $$("[data-count]").forEach((el) => formatCount(el, Number(el.dataset.count) || 0));
        document.documentElement.classList.remove("has-motion");
      };
    });

    document.addEventListener("injet:modal-open", (e) => onModal(e, false));
    document.addEventListener("injet:modal-change", (e) => onModal(e, true));
    document.addEventListener("injet:gallery-change", onGalleryChange);
    document.addEventListener("injet:quote-add", onQuoteAdd);
    document.addEventListener("injet:quote-open", onQuoteOpen);
    document.addEventListener("injet:filter", () => ScrollTrigger.refresh());

    // Recalcula posições quando fontes e imagens terminam de carregar
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
