/* ==========================================================================
   INJET NOBRE – EXPERIÊNCIA
   1. Abertura: estojo preto cai com quique, a tampa abre, a logo sobe de
      dentro da caixa e a tela se abre revelando o hero (máx. 2,5 s, botão
      "Pular", só na primeira visita da sessão).
   2. Cursor próprio (só mouse): quadradinho laranja que vira "ver" nos produtos.
   3. Botões magnéticos (só mouse).
   4. Adicionar ao orçamento: chuva de quadradinhos, contador pula, aviso
      "Adicionado: produto · cor" e vibração curta no celular.
   5. Enviar pelo WhatsApp: tela de agradecimento com a tampa se fechando.
   Regras: GSAP, só transform e opacity. Com prefers-reduced-motion: reduce
   não há abertura, cursor, magnetismo nem confete (aviso e agradecimento
   aparecem sem animação). Sem GSAP o site segue funcionando.
   ========================================================================== */

(function () {
  "use strict";

  const gsap = window.gsap;
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const INTRO_KEY = "injet-intro-v1";
  const motionOK = () => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animate = () => !!gsap && motionOK();

  /* Estado "tampa aberta" (mesmo valor na abertura e no agradecimento) */
  const LID_OPEN = { x: "-20%", y: "-24%", rotation: -20, transformOrigin: "12% 60%" };

  /* ======================================================================
     1. ABERTURA
     ====================================================================== */
  const revealQueue = [];
  let revealed = false;

  // animations.js consulta isto para segurar a entrada do hero
  const Intro = (window.InjetIntro = {
    pending: root.classList.contains("intro-pending") && animate(),
    onReveal(cb) {
      if (revealed) cb();
      else revealQueue.push(cb);
    }
  });

  function reveal() {
    if (revealed) return;
    revealed = true;
    Intro.pending = false;
    revealQueue.splice(0).forEach((cb) => {
      try { cb(); } catch (e) { /* uma falha não trava as outras */ }
    });
  }

  function intro() {
    const el = $("#intro");
    if (!el || !root.classList.contains("intro-pending")) return reveal();
    clearTimeout(window.__introSafety);

    const skip = $("#intro-skip", el);
    let tl = null;

    const finish = () => {
      reveal();
      root.classList.remove("intro-pending");
      document.removeEventListener("keydown", onKey);
      if (document.activeElement === skip) skip.blur();
    };
    const skipNow = () => {
      if (!tl) return finish();
      reveal();
      if (tl.time() < tl.labels.reveal) tl.seek("reveal").timeScale(1.4);
    };
    const onKey = (e) => { if (e.key === "Escape") skipNow(); };

    if (!animate()) return finish();
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) { /* modo privado */ }

    skip.addEventListener("click", skipNow);
    document.addEventListener("keydown", onKey);

    const box = $(".ibox", el);
    const lid = $(".ibox-lid", el);
    const logo = $(".ibox-logo", el);
    const shadow = $(".ibox-shadow", el);

    tl = gsap.timeline({ onComplete: finish });
    // Caixa desce e quica de leve (amassa, sobe um pouco, assenta): ~0,8 s
    tl.from(box, { y: () => -window.innerHeight * 0.6, opacity: 0, duration: 0.45, ease: "power3.in" })
      .from(shadow, { scale: 0.3, opacity: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "power3.in" }, "<")
      .to(box, { scaleX: 1.06, scaleY: 0.9, transformOrigin: "50% 100%", duration: 0.08, ease: "power1.out" })
      .to(box, { scaleX: 1, scaleY: 1, y: -16, duration: 0.15, ease: "power2.out" })
      .to(box, { y: 0, duration: 0.14, ease: "power2.in" })
      // Tampa abre e a logo sobe de dentro da caixa
      .addLabel("open", "+=0.02")
      .to(lid, { ...LID_OPEN, duration: 0.42, ease: "back.out(1.4)" }, "open")
      .fromTo(logo, { yPercent: 0, scale: 0.9 }, { yPercent: -250, scale: 1.35, duration: 0.5, ease: "back.out(1.6)" }, "open+=0.12")
      // A tela inteira se abre ao meio revelando o hero (termina em ~2,15 s)
      .addLabel("reveal", "+=0.1")
      .add(reveal, "reveal")
      .set(el, { pointerEvents: "none" }, "reveal")
      .to(".intro-panel--l", { xPercent: -101, duration: 0.55, ease: "power3.inOut" }, "reveal")
      .to(".intro-panel--r", { xPercent: 101, duration: 0.55, ease: "power3.inOut" }, "reveal")
      .to(".intro-stage", { scale: 1.12, opacity: 0, duration: 0.4, ease: "power2.in" }, "reveal")
      .to(skip, { opacity: 0, duration: 0.2 }, "reveal");

    // Se o GSAP demorou a chegar (rede lenta), vai direto para a revelação
    if (performance.now() > 1400) skipNow();
    // Teto rígido em tempo real (aparelho lento / quadros perdidos): nunca passa de 2,5 s
    setTimeout(() => { if (tl.progress() < 1) tl.progress(1); }, 2500);
  }

  /* ======================================================================
     2. CURSOR PERSONALIZADO (só mouse, sem movimento reduzido)
     ====================================================================== */
  const PRODUCT_SEL = ".card .media-frame, .pcard-media, .slide-art, .spotlight-art, .hero-feature .media-frame, .kit-stage, .line-thumb";
  const INTERACTIVE_SEL = "a, button, [role='button'], summary, label, select";

  function cursor() {
    if (!animate() || !finePointer()) return;

    const el = document.createElement("div");
    el.className = "cursor";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="cursor-dot"></span><span class="cursor-ring">ver</span>';
    document.body.appendChild(el);
    root.classList.add("has-cursor");

    const dot = el.firstChild;
    const ring = el.lastChild;
    gsap.set(ring, { scale: 0.3, opacity: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.22, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.22, ease: "power3.out" });

    let shown = false;
    let mode = "";
    const setMode = (next) => {
      mode = next;
      // "ver" nos produtos; outros textos vêm de data-cursor (ex.: "girar" no 3D)
      if (next.startsWith("ring:")) { ring.textContent = next.slice(5); next = "ver"; }
      else if (next === "ver") ring.textContent = "ver";
      gsap.to(dot, {
        scale: next === "ver" ? 0 : next === "link" ? 1.7 : 1,
        rotation: next === "link" ? 45 : 0,
        opacity: next === "ver" ? 0 : 1,
        duration: 0.25,
        ease: "power3.out",
        overwrite: "auto"
      });
      gsap.to(ring, next === "ver"
        ? { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)", overwrite: "auto" }
        : { scale: 0.3, opacity: 0, duration: 0.2, ease: "power2.in", overwrite: "auto" });
    };
    const show = (v) => {
      if (shown === v) return;
      shown = v;
      gsap.to(el, { opacity: v ? 1 : 0, duration: 0.2, overwrite: "auto" });
    };

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) gsap.set(el, { x: e.clientX, y: e.clientY });
      show(true);
      xTo(e.clientX);
      yTo(e.clientY);
      const t = e.target instanceof Element ? e.target : null;
      const custom = t && t.closest("[data-cursor]");
      const next = !t ? "" : custom ? `ring:${custom.dataset.cursor}`
        : t.closest(PRODUCT_SEL) ? "ver" : t.closest(INTERACTIVE_SEL) ? "link" : "";
      if (next !== mode) setMode(next);
    }, { passive: true });

    // Saiu da janela (ou entrou no mapa): esconde
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) show(false); });
    window.addEventListener("blur", () => show(false));
  }

  /* ======================================================================
     3. BOTÕES MAGNÉTICOS (só mouse, sem movimento reduzido)
     ====================================================================== */
  const MAGNETIC_SEL = ".btn, .nav-arrow, .filter-btn, .intro-skip, .hero3d-btn, .hero3d-arrow, .hero3d-pill, .hdr-quote, .hdr-search";

  function magnetic() {
    if (!animate() || !finePointer()) return;
    const clamp = gsap.utils.clamp(-10, 10);
    let current = null;
    let xTo = null;
    let yTo = null;

    const release = () => {
      if (!current) return;
      gsap.to(current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
      current = null;
    };

    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target instanceof Element ? e.target.closest(MAGNETIC_SEL) : null;
      if (target !== current) {
        release();
        if (!target) return;
        current = target;
        xTo = gsap.quickTo(target, "x", { duration: 0.35, ease: "power3.out" });
        yTo = gsap.quickTo(target, "y", { duration: 0.35, ease: "power3.out" });
      }
      if (!current) return; // fora de qualquer botão magnético
      // centro "de repouso" (desconta o deslocamento atual)
      const r = current.getBoundingClientRect();
      const cx = r.left + r.width / 2 - gsap.getProperty(current, "x");
      const cy = r.top + r.height / 2 - gsap.getProperty(current, "y");
      xTo(clamp((e.clientX - cx) * 0.25));
      yTo(clamp((e.clientY - cy) * 0.35));
    }, { passive: true });

    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) release(); });
    window.addEventListener("blur", release);
  }

  /* ======================================================================
     4. ADICIONAR AO ORÇAMENTO: confete, pulo do contador, aviso, vibração
     ====================================================================== */
  function quoteFeedback() {
    const R = window.InjetRender;
    let lastTrigger = null;
    let lastTriggerAt = 0;
    let batch = [];
    let batchTimer = 0;

    // Guarda o botão clicado para a chuva sair dele
    document.addEventListener("click", (e) => {
      const b = e.target instanceof Element ? e.target.closest("[data-quote-add], [data-kit-add]") : null;
      if (b) { lastTrigger = b; lastTriggerAt = performance.now(); }
    }, true);

    // O kit adiciona vários itens de uma vez: junta tudo num só aviso
    document.addEventListener("injet:quote-add", (e) => {
      batch.push(e.detail.ref);
      if (!batchTimer) batchTimer = setTimeout(flush, 30);
    });

    function flush() {
      batchTimer = 0;
      const refs = Array.from(new Set(batch.splice(0)));
      const recent = performance.now() - lastTriggerAt < 800 && lastTrigger && lastTrigger.isConnected && lastTrigger.offsetParent !== null;
      const origin = recent ? lastTrigger : (window.InjetQuote && window.InjetQuote.visibleButton());

      try {
        if (navigator.vibrate && window.matchMedia("(pointer: coarse)").matches) navigator.vibrate(30);
      } catch (err) { /* sem vibração */ }

      toast(refs.map((ref) => {
        const p = R && R.findProduct(ref);
        return p ? (p.variante ? `${p.nome} · ${p.variante}` : p.nome) : ref;
      }).join(" + "));

      // Produtos em gravidade zero (js/produtos-zero.js): a miniatura já voou
      // até o orçamento; aqui só o contador pula
      const landed = window.InjetFlyLanding;
      window.InjetFlyLanding = false;
      if (!animate()) return;
      if (landed) { jumpCounter(); return; }
      // Cards da grade: a foto voa até o orçamento e o contador pula na
      // chegada (js/catalog.js), em vez do confete
      if (origin && origin.closest(".pcard") && window.InjetCatalogFX) return;
      if (origin) confetti(origin);
      jumpCounter();
    }
  }

  window.InjetJumpCounter = () => jumpCounter();
  function jumpCounter() {
    const btn = window.InjetQuote && window.InjetQuote.visibleButton();
    if (btn) gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
    const counts = $$("[data-quote-count]").filter((el) => el.offsetParent !== null);
    if (!counts.length) return;
    gsap.timeline()
      .to(counts, { y: -12, scale: 1.3, duration: 0.18, ease: "power2.out", overwrite: "auto" })
      .to(counts, { y: 0, scale: 1, duration: 0.5, ease: "bounce.out" });
  }

  function confetti(origin) {
    const r = origin.getBoundingClientRect();
    const ox = r.left + r.width / 2;
    const oy = r.top + r.height / 2;
    const rand = gsap.utils.random;
    const layer = document.createElement("div");
    layer.className = "confetti";
    layer.setAttribute("aria-hidden", "true");

    for (let i = 0; i < 28; i++) {
      const s = document.createElement("span");
      const size = Math.round(rand(6, 11));
      s.style.cssText = `left:${ox}px;top:${oy}px;width:${size}px;height:${size}px`;
      if (i % 3 === 0) s.className = "is-black";
      layer.appendChild(s);

      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05); // leque para cima
      const speed = rand(80, 210);
      gsap.timeline()
        .set(s, { xPercent: -50, yPercent: -50, rotation: rand(0, 90) })
        .to(s, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed, rotation: `+=${rand(-200, 200)}`, duration: rand(0.35, 0.5), ease: "power2.out" })
        .to(s, { y: `+=${rand(150, 260)}`, x: `+=${rand(-30, 30)}`, rotation: `+=${rand(-180, 180)}`, opacity: 0, duration: rand(0.6, 0.9), ease: "power1.in" });
    }
    document.body.appendChild(layer);
    gsap.delayedCall(1.6, () => layer.remove());
  }

  /* Aviso "Adicionado: ..." (o leitor de tela já ouve o aviso do quote.js) */
  let toastEl = null;
  let toastTimer = 0;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("aria-hidden", "true");
      toastEl.innerHTML = '<span class="toast-mark"></span><p><strong>Adicionado:</strong> <span data-toast-text></span></p>';
      document.body.appendChild(toastEl);
    }
    $("[data-toast-text]", toastEl).textContent = text;
    clearTimeout(toastTimer);
    if (animate()) gsap.fromTo(toastEl, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(2)", overwrite: "auto" });
    else toastEl.style.opacity = "1";
    toastTimer = setTimeout(() => {
      if (animate()) gsap.to(toastEl, { y: 10, opacity: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
      else toastEl.style.opacity = "0";
    }, 2400);
  }

  /* ======================================================================
     5. AGRADECIMENTO: tampa do estojo se fecha
     ====================================================================== */
  function thanks() {
    let el = null;
    let inerted = [];

    function build() {
      el = document.createElement("div");
      el.className = "thanks";
      el.hidden = true;
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-labelledby", "thanks-titulo");
      el.innerHTML = `
        <span class="dots-pattern thanks-dots" aria-hidden="true"></span>
        <div class="thanks-inner">
          <div class="thanks-stage"></div>
          <p class="eyebrow eyebrow--dark">Orçamento pronto</p>
          <h2 id="thanks-titulo" class="thanks-title">Obrigado!</h2>
          <p class="thanks-text">Abrimos o WhatsApp com a sua lista. É só enviar a mensagem: nossa equipe responde com frete e prazo.</p>
          <div class="thanks-actions">
            <button type="button" class="btn btn--dark" data-thanks-close>Voltar ao catálogo</button>
            <button type="button" class="btn btn--ghost-dark" data-thanks-clear>Limpar orçamento</button>
          </div>
        </div>`;

      // Mesmo desenho do estojo da abertura (ids dos gradientes renomeados)
      const src = $("#intro .ibox");
      if (src) {
        const tmp = document.createElement("div");
        tmp.innerHTML = src.outerHTML.replace(/ibox-(cushion|front-g|lid-g)/g, "ibox-$1-t");
        const box = tmp.firstElementChild;
        const logo = $(".ibox-logo-clip", box);
        if (logo) logo.remove();
        $(".thanks-stage", el).appendChild(box);
      }

      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-thanks-close]")) close();
        if (e.target.closest("[data-thanks-clear]")) {
          if (window.InjetQuote) window.InjetQuote.clear();
          close();
        }
      });
      el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
      document.body.appendChild(el);
    }

    function open() {
      if (!el) build();
      if (window.InjetQuote) window.InjetQuote.close();
      el.hidden = false;
      document.body.classList.add("is-thanks-open");
      // Fundo inerte enquanto a tela está aberta (foco fica aqui)
      inerted = Array.from(document.body.children).filter((c) => c !== el && !c.inert && c.tagName !== "SCRIPT" && !c.classList.contains("cursor"));
      inerted.forEach((c) => (c.inert = true));
      $("[data-thanks-close]", el).focus();

      const box = $(".ibox", el);
      const lid = $(".ibox-lid", el);
      if (!animate() || !box || !lid) return;
      gsap.timeline()
        .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" })
        .fromTo(box, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.05)
        .fromTo(lid, LID_OPEN, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: "power3.in" }, 0.35)
        .to(box, { scaleX: 1.05, scaleY: 0.92, transformOrigin: "50% 100%", duration: 0.08, ease: "power1.out" })
        .to(box, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" })
        .from($$(".thanks-inner > :not(.thanks-stage)", el), { y: 24, opacity: 0, duration: 0.45, ease: "power3.out", stagger: 0.07 }, 0.75);
    }

    function close() {
      if (!el || el.hidden) return;
      el.hidden = true;
      document.body.classList.remove("is-thanks-open");
      inerted.forEach((c) => (c.inert = false));
      inerted = [];
      const btn = window.InjetQuote && window.InjetQuote.visibleButton();
      if (btn) btn.focus();
    }

    document.addEventListener("injet:quote-sent", open);
  }

  /* ---------- Inicialização ---------- */
  intro();
  quoteFeedback();
  thanks();
  cursor();
  magnetic();
})();
