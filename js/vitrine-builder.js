/* ==========================================================================
   INJET NOBRE – "MONTE SUA VITRINE"
   Balcão com 3 prateleiras (4 lugares cada) + bandeja com os produtos reais.
   - Mouse/caneta: arrasta da bandeja (ou entre prateleiras; solto fora = sai).
   - Toque/clique: escolhe o produto e depois a prateleira.
   - Teclado: Enter escolhe o produto, setas ↑/↓ escolhem a prateleira, Enter
     coloca, Esc cancela. Num produto da prateleira: ↑/↓ troca de prateleira,
     ←/→ muda a posição, Delete tira.
   - Lista com quantidade por produto, total com contador animado, envio pelo
     WhatsApp (também entra no orçamento do site) e imagem PNG da vitrine.
   Preços, refs e fotos vêm de js/products.js. A vitrine fica salva no
   navegador do visitante (localStorage).
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;
  const root = document.getElementById("monte-sua-vitrine");
  if (!R || !root) return;

  const $ = (sel, ctx = root) => ctx.querySelector(sel);
  const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));
  const motion = () => !!window.gsap && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  const SHELVES = 3;
  const SLOTS = 4;            // lugares por prateleira
  const DEFAULT_QTY = 10;     // quantidade inicial ao colocar um produto
  const MAX_QTY = 9999;
  const KEY = "injet-vitrine-v1";
  const clampQty = (n) => Math.min(MAX_QTY, Math.max(1, Math.round(Number(n)) || 1));

  /* ---------- Produtos (todos os ativos com foto) ---------- */
  const products = R.products.filter((p) => p.imagem);
  const find = (ref) => products.find((p) => p.ref === ref);
  function shortName(p) {
    if (p.grupo === "estojo-relogio") return `Estojo ${p.variante}`;
    if (p.grupo === "caixa-acrilico") return `Acrílico ${p.formato} · ${p.interior}`;
    if (p.grupo === "suporte-relogio") return `Suporte relógio ${p.variante}`;
    return p.nome;
  }
  const photoHTML = (p, sizes) => R.pictureHTML(p.imagem, "", { sizes });
  const imgSrc = (p, ext = "-600.webp") => `assets/produtos/${p.imagem}${ext}`;

  /* ---------- Estado (salvo no navegador) ---------- */
  let items = [];   // [{ id, ref, shelf }] na ordem em que aparecem
  let qty = {};     // { ref: quantidade }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Array.isArray(saved.items)) {
      const perShelf = [0, 0, 0];
      saved.items.forEach((it) => {
        if (it && find(it.ref) && it.shelf >= 0 && it.shelf < SHELVES && perShelf[it.shelf] < SLOTS) {
          perShelf[it.shelf]++;
          items.push({ id: String(it.id), ref: it.ref, shelf: it.shelf });
        }
      });
      items.forEach((it) => { qty[it.ref] = clampQty((saved.qty || {})[it.ref] || DEFAULT_QTY); });
    }
  } catch (e) { /* sem armazenamento */ }

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ items, qty })); } catch (e) { /* sem armazenamento */ }
  };
  const newId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const onShelf = (s) => items.filter((it) => it.shelf === s);
  const refsInOrder = () => Array.from(new Set(items.map((it) => it.ref)));

  /* ---------- Elementos ---------- */
  const shelvesEl = $$("[data-shelf]");
  const trayList = $("[data-builder-tray]");
  const list = $("[data-builder-list]");
  const empty = $("[data-builder-empty]");
  const totalEl = $("[data-builder-total]");
  const unitsEl = $("[data-builder-units]");
  const hintText = $("[data-builder-hint-text]");
  const cancelBtn = $("[data-builder-cancel]");
  const takeOutBtn = $("[data-builder-takeout]");
  const sendBtn = $("[data-builder-send]");
  const downloadBtn = $("[data-builder-download]");
  const clearBtn = $("[data-builder-clear]");
  const status = $("[data-builder-status]");

  function announce(text) {
    status.textContent = "";
    setTimeout(() => { status.textContent = text; }, 40);
  }

  /* ---------- Bandeja ---------- */
  trayList.innerHTML = products.map((p) => `
    <li>
      <button type="button" class="tray-item" data-tray-ref="${R.esc(p.ref)}" aria-pressed="false"
              aria-label="${R.esc(R.fullName(p))}, ${R.esc(R.formatPrice(p.preco))} a unidade. Escolher para colocar na vitrine.">
        <span class="tray-art" aria-hidden="true">${photoHTML(p, "96px")}</span>
        <span class="tray-name" aria-hidden="true">${R.esc(shortName(p))}</span>
        <span class="tray-price" aria-hidden="true">${R.esc(R.formatPrice(p.preco))}</span>
      </button>
    </li>`).join("");
  $$("img", trayList).forEach((img) => { img.draggable = false; });

  /* ---------- Prateleiras ---------- */
  function renderShelves(animateId, focusId) {
    shelvesEl.forEach((shelf, s) => {
      const here = onShelf(s);
      const slots = here.map((it, i) => {
        const p = find(it.ref);
        return `
          <li class="shelf-slot">
            <button type="button" class="shelf-item" data-item-id="${it.id}"
                    aria-label="${R.esc(R.fullName(p))}, prateleira ${s + 1}, lugar ${i + 1}. Setas movem, Delete tira da vitrine.">
              <span class="shelf-shadow" aria-hidden="true"></span>
              <span class="shelf-art" aria-hidden="true">${photoHTML(p, "(min-width: 960px) 160px, 22vw")}</span>
            </button>
          </li>`;
      });
      for (let i = here.length; i < SLOTS; i++) slots.push('<li class="shelf-slot is-empty" aria-hidden="true"></li>');
      const ul = $(".shelf-items", shelf);
      ul.innerHTML = slots.join("");
      ul.setAttribute("aria-label", `Prateleira ${s + 1}: ${here.length} de ${SLOTS} lugares ocupados`);
      $$("img", ul).forEach((img) => { img.draggable = false; });
    });
    if (selection && selection.type === "item") {
      const el = $(`[data-item-id="${selection.id}"]`);
      if (el) el.classList.add("is-selected");
    }
    if (animateId) bounceIn(animateId);
    if (focusId) {
      const el = $(`[data-item-id="${focusId}"]`);
      if (el) el.focus();
    }
  }

  // Entrada com quique: o produto cai na prateleira e a sombra "cresce"
  function bounceIn(id) {
    const el = $(`[data-item-id="${id}"]`);
    if (!el || !motion()) return;
    const gsap = window.gsap;
    gsap.fromTo($(".shelf-art", el), { y: -46, scale: 0.86, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: "bounce.out" });
    gsap.fromTo($(".shelf-shadow", el), { scaleX: 0.3, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.7, ease: "bounce.out" });
  }

  function shakeShelf(s) {
    announce(`A prateleira ${s + 1} está cheia (${SLOTS} lugares).`);
    if (!motion()) return;
    window.gsap.fromTo(shelvesEl[s], { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2, 0.3)" });
  }

  /* ---------- Ações ---------- */
  function place(ref, s) {
    if (onShelf(s).length >= SLOTS) { shakeShelf(s); return null; }
    const id = newId();
    items.push({ id, ref, shelf: s });
    if (!qty[ref]) qty[ref] = DEFAULT_QTY;
    commit({ animateId: id });
    announce(`${R.fullName(find(ref))} colocado na prateleira ${s + 1}.`);
    return id;
  }

  function moveTo(id, s, { focus = false } = {}) {
    const it = items.find((x) => x.id === id);
    if (!it) return false;
    if (it.shelf === s) return true;
    if (onShelf(s).length >= SLOTS) { shakeShelf(s); return false; }
    items = items.filter((x) => x !== it);
    it.shelf = s;
    items.push(it);
    commit({ animateId: id, focusId: focus ? id : null });
    announce(`${R.fullName(find(it.ref))} movido para a prateleira ${s + 1}.`);
    return true;
  }

  function reorder(id, dir) {
    const it = items.find((x) => x.id === id);
    const here = onShelf(it.shelf);
    const i = here.indexOf(it);
    const other = here[i + dir];
    if (!other) return;
    const a = items.indexOf(it), b = items.indexOf(other);
    [items[a], items[b]] = [items[b], items[a]];
    commit({ focusId: id });
    announce(`Lugar ${i + dir + 1} da prateleira ${it.shelf + 1}.`);
  }

  function removeItem(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    items = items.filter((x) => x !== it);
    if (!items.some((x) => x.ref === it.ref)) delete qty[it.ref];
    commit();
    announce(`${R.fullName(find(it.ref))} saiu da vitrine.`);
  }

  function removeRef(ref) {
    items = items.filter((x) => x.ref !== ref);
    delete qty[ref];
    commit();
    announce(`${R.fullName(find(ref))} saiu da vitrine.`);
  }

  function clearAll() {
    items = [];
    qty = {};
    commit();
    announce("Vitrine limpa.");
  }

  function commit({ animateId = null, focusId = null } = {}) {
    if (selection && selection.type === "item" && !items.some((x) => x.id === selection.id)) setSelection(null);
    save();
    renderShelves(animateId, focusId);
    renderList();
  }

  /* ---------- Seleção (toque, clique e teclado) ---------- */
  let selection = null; // { type: "tray", ref, origin } | { type: "item", id, ref, origin }

  function setSelection(sel, { focusShelf = false } = {}) {
    selection = sel;
    root.classList.toggle("is-selecting", !!sel);
    $$(".tray-item").forEach((b) => b.setAttribute("aria-pressed", String(!!sel && sel.type === "tray" && b.dataset.trayRef === sel.ref)));
    $$(".shelf-item").forEach((b) => b.classList.toggle("is-selected", !!sel && sel.type === "item" && b.dataset.itemId === sel.id));
    $$("[data-shelf-drop]").forEach((b) => { b.hidden = !sel; });
    takeOutBtn.hidden = !(sel && sel.type === "item");
    cancelBtn.hidden = !sel;
    if (sel) {
      const p = find(sel.ref);
      hintText.textContent = sel.type === "tray"
        ? `${shortName(p)}: escolha uma prateleira.`
        : `${shortName(p)}: escolha a nova prateleira ou tire da vitrine.`;
      if (focusShelf) {
        const free = shelvesEl.findIndex((_, s) => onShelf(s).length < SLOTS);
        $(`[data-shelf-drop="${Math.max(0, free)}"]`).focus();
      }
    } else {
      hintText.textContent = hintText.dataset.default;
    }
  }

  function cancelSelection() {
    const origin = selection && selection.origin;
    setSelection(null);
    if (origin && origin.isConnected) origin.focus();
  }

  // Cliques: bandeja, produto na prateleira, alvo de prateleira
  let suppressClick = false;
  root.addEventListener("click", (e) => {
    if (suppressClick) { suppressClick = false; return; }
    const tray = e.target.closest("[data-tray-ref]");
    const shelfItem = e.target.closest("[data-item-id]");
    const drop = e.target.closest("[data-shelf-drop]");
    const byKeyboard = e.detail === 0;

    if (drop && selection) {
      const s = Number(drop.dataset.shelfDrop);
      if (selection.type === "tray") {
        const origin = selection.origin;
        const id = place(selection.ref, s);
        if (id) {
          setSelection(null);
          if (byKeyboard && origin) origin.focus();
        }
      } else if (moveTo(selection.id, s)) {
        const id = selection.id;
        setSelection(null);
        if (byKeyboard) { const el = $(`[data-item-id="${id}"]`); if (el) el.focus(); }
      }
      return;
    }
    if (tray) {
      const ref = tray.dataset.trayRef;
      if (selection && selection.type === "tray" && selection.ref === ref) return cancelSelection();
      setSelection({ type: "tray", ref, origin: tray }, { focusShelf: byKeyboard });
      return;
    }
    if (shelfItem) {
      const id = shelfItem.dataset.itemId;
      if (selection && selection.type === "item" && selection.id === id) return cancelSelection();
      const it = items.find((x) => x.id === id);
      setSelection({ type: "item", id, ref: it.ref, origin: shelfItem }, { focusShelf: byKeyboard });
    }
  });

  cancelBtn.addEventListener("click", cancelSelection);
  takeOutBtn.addEventListener("click", () => {
    if (!selection || selection.type !== "item") return;
    const id = selection.id;
    setSelection(null);
    removeItem(id);
    trayList.querySelector(".tray-item").focus();
  });

  // Teclado
  root.addEventListener("keydown", (e) => {
    const drop = e.target.closest("[data-shelf-drop]");
    const shelfItem = e.target.closest("[data-item-id]");

    if (e.key === "Escape" && selection) {
      e.preventDefault();
      cancelSelection();
      return;
    }
    if (drop && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const s = Number(drop.dataset.shelfDrop) + (e.key === "ArrowUp" ? -1 : 1);
      const next = $(`[data-shelf-drop="${(s + SHELVES) % SHELVES}"]`);
      if (next) next.focus();
      return;
    }
    if (shelfItem && !selection) {
      const id = shelfItem.dataset.itemId;
      const it = items.find((x) => x.id === id);
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const s = it.shelf + (e.key === "ArrowUp" ? -1 : 1);
        if (s >= 0 && s < SHELVES) moveTo(id, s, { focus: true });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        reorder(id, e.key === "ArrowLeft" ? -1 : 1);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const all = $$(".shelf-item");
        const i = all.indexOf(shelfItem);
        removeItem(id);
        const rest = $$(".shelf-item");
        (rest[Math.min(i, rest.length - 1)] || trayList.querySelector(".tray-item")).focus();
      }
    }
  });

  /* ---------- Arrastar (mouse e caneta; no toque é tocar + tocar) ---------- */
  let drag = null;
  let ghost = null;

  const shelfAt = (x, y) => shelvesEl.findIndex((el) => {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
  const insideScene = (x, y) => {
    const r = $("[data-builder-scene]").getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  root.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    const src = e.target.closest("[data-tray-ref], [data-item-id]");
    if (!src) return;
    const id = src.dataset.itemId || null;
    const ref = src.dataset.trayRef || items.find((x) => x.id === id).ref;
    drag = { src, id, ref, x0: e.clientX, y0: e.clientY, active: false, over: -1 };
  });

  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.active = true;
      setSelection(null);
      ghost = document.createElement("div");
      ghost.className = "builder-ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.innerHTML = `<img src="${imgSrc(find(drag.ref))}" alt="" draggable="false">`;
      document.body.appendChild(ghost);
      root.classList.add("is-dragging");
      if (drag.id) drag.src.classList.add("is-lifted");
    }
    ghost.style.transform = `translate(${e.clientX - 55}px, ${e.clientY - 70}px)`;
    const s = shelfAt(e.clientX, e.clientY);
    if (s !== drag.over) {
      shelvesEl.forEach((el, i) => el.classList.toggle("is-over", i === s));
      drag.over = s;
    }
  });

  function endDrag(e, cancelled) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    ghost.remove();
    ghost = null;
    root.classList.remove("is-dragging");
    shelvesEl.forEach((el) => el.classList.remove("is-over"));
    if (d.src.isConnected) d.src.classList.remove("is-lifted");
    if (cancelled) return;
    const s = shelfAt(e.clientX, e.clientY);
    if (s >= 0) {
      if (d.id) moveTo(d.id, s);
      else place(d.ref, s);
    } else if (d.id && !insideScene(e.clientX, e.clientY)) {
      removeItem(d.id); // soltou fora do balcão: sai da vitrine
    }
  }
  document.addEventListener("pointerup", (e) => endDrag(e, false));
  document.addEventListener("pointercancel", (e) => endDrag(e, true));

  /* ---------- Lista + total ---------- */
  let shownTotal = 0;
  let totalTween = null;

  function totals() {
    const refs = refsInOrder();
    const cents = refs.reduce((sum, ref) => sum + Math.round(R.lineTotal(find(ref), qty[ref]) * 100), 0);
    const units = refs.reduce((sum, ref) => sum + qty[ref], 0);
    return { refs, total: cents / 100, units };
  }

  function rowHTML(ref) {
    const p = find(ref);
    const n = qty[ref];
    const name = R.esc(R.fullName(p));
    const count = items.filter((x) => x.ref === ref).length;
    return `
      <li class="builder-row" data-row-ref="${R.esc(ref)}">
        <span class="builder-thumb" aria-hidden="true">${photoHTML(p, "48px")}</span>
        <p class="builder-name">${R.esc(shortName(p))}<small>${R.esc(R.formatPrice(p.preco))} / un.${count > 1 ? ` · ${count}× na vitrine` : ""}</small></p>
        <button type="button" class="builder-remove" data-row-remove aria-label="Tirar ${name} da vitrine">×</button>
        <div class="qty" role="group" aria-label="Quantidade de ${name}">
          <button type="button" data-row-step="-1" aria-label="Diminuir quantidade de ${name}" ${n <= 1 ? "disabled" : ""}>−</button>
          <input type="number" min="1" max="${MAX_QTY}" step="1" inputmode="numeric" value="${n}" aria-label="Quantidade de ${name} (unidades)" data-row-qty>
          <button type="button" data-row-step="1" aria-label="Aumentar quantidade de ${name}">+</button>
        </div>
        <p class="builder-sub">${R.esc(R.formatPrice(R.lineTotal(p, n)))}</p>
      </li>`;
  }

  function renderList() {
    // preserva o foco (quantidade) ao redesenhar
    const active = document.activeElement;
    const row = active && list.contains(active) ? active.closest("[data-row-ref]") : null;
    const focusKey = row && { ref: row.dataset.rowRef, sel: active.matches("[data-row-qty]") ? "[data-row-qty]" : `[data-row-step="${active.dataset.rowStep}"]` };

    const t = totals();
    list.innerHTML = t.refs.map(rowHTML).join("");
    empty.hidden = t.refs.length > 0;
    list.hidden = t.refs.length === 0;
    unitsEl.textContent = t.refs.length
      ? `${t.refs.length} ${t.refs.length === 1 ? "produto" : "produtos"} · ${t.units.toLocaleString("pt-BR")} ${t.units === 1 ? "unidade" : "unidades"}`
      : "Nenhum produto na vitrine";
    [sendBtn, downloadBtn].forEach((b) => { b.disabled = t.refs.length === 0; });
    clearBtn.hidden = t.refs.length === 0;
    setTotal(t.total);

    if (focusKey) {
      const el = list.querySelector(`[data-row-ref="${focusKey.ref}"] ${focusKey.sel}`);
      if (el && !el.disabled) el.focus();
      else if (list.querySelector(`[data-row-ref="${focusKey.ref}"] [data-row-qty]`)) list.querySelector(`[data-row-ref="${focusKey.ref}"] [data-row-qty]`).focus();
    }
  }

  // Total sobe/desce como contador
  function setTotal(value) {
    if (totalTween) totalTween.kill();
    if (!motion() || value === shownTotal) {
      shownTotal = value;
      totalEl.textContent = R.formatPrice(value);
      return;
    }
    const gsap = window.gsap;
    const state = { v: shownTotal };
    shownTotal = value;
    totalTween = gsap.to(state, {
      v: value,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: () => { totalEl.textContent = R.formatPrice(Math.round(state.v * 100) / 100); }
    });
    gsap.fromTo(totalEl, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
  }

  list.addEventListener("click", (e) => {
    const row = e.target.closest("[data-row-ref]");
    if (!row) return;
    const ref = row.dataset.rowRef;
    const step = e.target.closest("[data-row-step]");
    if (step) {
      qty[ref] = clampQty(qty[ref] + Number(step.dataset.rowStep));
      save();
      renderList();
      return;
    }
    if (e.target.closest("[data-row-remove]")) {
      const next = row.nextElementSibling || row.previousElementSibling;
      const nextRef = next && next.dataset.rowRef;
      removeRef(ref);
      const target = nextRef && list.querySelector(`[data-row-ref="${nextRef}"] [data-row-remove]`);
      (target || trayList.querySelector(".tray-item")).focus();
    }
  });
  const setFromInput = (input) => {
    const ref = input.closest("[data-row-ref]").dataset.rowRef;
    qty[ref] = clampQty(input.value);
    save();
    renderList();
  };
  list.addEventListener("change", (e) => { if (e.target.matches("[data-row-qty]")) setFromInput(e.target); });
  list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("[data-row-qty]")) {
      e.preventDefault();
      setFromInput(e.target);
    }
  });

  /* ---------- Limpar (duas etapas, sem janela de confirmação) ---------- */
  let clearTimer = 0;
  const resetClear = () => {
    clearTimeout(clearTimer);
    clearBtn.dataset.confirm = "";
    clearBtn.textContent = "Limpar vitrine";
  };
  clearBtn.addEventListener("click", () => {
    if (clearBtn.dataset.confirm) {
      resetClear();
      clearAll();
      trayList.querySelector(".tray-item").focus();
      return;
    }
    clearBtn.dataset.confirm = "1";
    clearBtn.textContent = "Confirmar: limpar vitrine?";
    clearTimer = setTimeout(resetClear, 4000);
  });

  /* ---------- Enviar: WhatsApp + orçamento do site ---------- */
  function message() {
    const t = totals();
    const lines = t.refs.map((ref) => {
      const p = find(ref);
      return `• ${R.fullName(p)} – ${qty[ref].toLocaleString("pt-BR")} un. × ${R.formatPrice(p.preco)} = ${R.formatPrice(R.lineTotal(p, qty[ref]))}`;
    });
    return [
      "Olá! Montei esta vitrine no site da Injet Nobre e quero fazer o pedido:",
      "",
      ...lines,
      "",
      `${t.refs.length} ${t.refs.length === 1 ? "produto" : "produtos"}, ${t.units.toLocaleString("pt-BR")} ${t.units === 1 ? "unidade" : "unidades"}.`,
      `*Total: ${R.formatPrice(t.total)}*`
    ].join("\n");
  }

  sendBtn.addEventListener("click", () => {
    const t = totals();
    if (!t.refs.length) return;
    const url = R.whatsappLink(message());
    if (window.InjetQuote) t.refs.forEach((ref) => window.InjetQuote.add(ref, qty[ref]));
    window.open(url, "_blank", "noopener");
    announce("Lista aberta no WhatsApp e adicionada ao orçamento do site.");
    // Mesma tela de agradecimento do orçamento (experience.js)
    document.dispatchEvent(new CustomEvent("injet:quote-sent", { detail: { source: "vitrine" } }));
  });

  /* ---------- Baixar imagem (PNG desenhado em canvas) ---------- */
  function loadImage(p) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (img.dataset.fallback) return resolve(null);
        img.dataset.fallback = "1";
        img.src = imgSrc(p, ".png");
      };
      img.src = imgSrc(p);
    });
  }

  function fitText(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
    return `${t}…`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function drawPNG() {
    const W = 1600, H = 1000;
    const ORANGE = "#FF6A13", BLACK = "#111111", WHITE = "#FFFFFF";
    const TITLE = '700 {s}px Oswald, "Arial Narrow", Impact, sans-serif';
    const BODY = '{w} {s}px Inter, system-ui, sans-serif';
    const font = (tpl, s, w = 400) => tpl.replace("{s}", s).replace("{w}", w);
    if (document.fonts && document.fonts.load) {
      await Promise.all([document.fonts.load(font(TITLE, 40)), document.fonts.load(font(BODY, 20, 600)), document.fonts.load(font(BODY, 20, 400))]).catch(() => {});
    }
    const refs = refsInOrder();
    const imgs = {};
    await Promise.all(refs.map(async (ref) => { imgs[ref] = await loadImage(find(ref)); }));

    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d");

    // Fundo laranja + quadradinhos
    x.fillStyle = ORANGE;
    x.fillRect(0, 0, W, H);
    x.fillStyle = BLACK;
    [[0, 0], [11, 0], [22, 11], [0, 11], [11, 22]].forEach(([a, b]) => x.fillRect(60 + a * 1.4, 52 + b * 1.4, 11, 11));

    // Título
    x.fillStyle = BLACK;
    x.font = font(TITLE, 64);
    x.textBaseline = "alphabetic";
    x.fillText("MINHA VITRINE", 120, 100);
    x.font = font(BODY, 20, 600);
    x.fillText("INJET NOBRE · ESTOJOS E EXPOSITORES", 122, 134);

    // Móvel: moldura preta, fundo branco, 3 prateleiras
    const cx = 60, cy = 170, cw = 940, shelfH = 210, frame = 16;
    x.fillStyle = BLACK;
    x.fillRect(cx, cy, cw, frame + SHELVES * (shelfH + frame));
    for (let s = 0; s < SHELVES; s++) {
      const sy = cy + frame + s * (shelfH + frame);
      x.fillStyle = WHITE;
      x.fillRect(cx + frame, sy, cw - 2 * frame, shelfH);
      // lugares
      const inner = cw - 2 * frame - 40;
      const slotW = inner / SLOTS;
      onShelf(s).forEach((it, i) => {
        const img = imgs[it.ref];
        const size = Math.min(slotW - 8, shelfH - 16);
        const ix = cx + frame + 20 + i * slotW + (slotW - size) / 2;
        const base = sy + shelfH;
        // sombra
        const g = x.createRadialGradient(ix + size / 2, base - 4, 2, ix + size / 2, base - 4, size * 0.42);
        g.addColorStop(0, "rgba(0,0,0,.28)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g;
        x.save();
        x.translate(ix + size / 2, base - 4);
        x.scale(1, 0.18);
        x.beginPath();
        x.arc(0, 0, size * 0.42, 0, Math.PI * 2);
        x.restore();
        x.fill();
        if (img) x.drawImage(img, ix, base - size * 0.97, size, size);
      });
    }
    // Balcão
    const by = cy + frame + SHELVES * (shelfH + frame);
    x.fillStyle = WHITE;
    x.fillRect(cx - 24, by, cw + 48, 10);
    x.fillStyle = BLACK;
    x.fillRect(cx - 24, by + 10, cw + 48, H - by - 10 - 40);
    x.fillStyle = ORANGE;
    x.font = font(TITLE, 26);
    x.textAlign = "center";
    x.fillText("INJET NOBRE", cx + cw / 2, by + 50);
    x.textAlign = "left";

    // Lista à direita
    const px = 1050, pw = 490;
    let py = 170;
    x.fillStyle = BLACK;
    x.fillRect(px, py, pw, H - py - 40);
    x.fillStyle = WHITE;
    x.font = font(TITLE, 34);
    x.fillText("LISTA", px + 28, py + 52);
    py += 82;
    const rowH = Math.min(54, (H - 40 - 150 - py) / Math.max(1, refs.length));
    refs.forEach((ref) => {
      const p = find(ref);
      const img = imgs[ref];
      if (img) x.drawImage(img, px + 24, py, rowH - 8, rowH - 8);
      x.fillStyle = WHITE;
      x.font = font(BODY, Math.min(18, rowH * 0.36), 600);
      x.fillText(fitText(x, shortName(p), 250), px + 24 + rowH, py + rowH * 0.42);
      x.font = font(BODY, Math.min(15, rowH * 0.3), 400);
      x.fillStyle = "#BDBDBD";
      x.fillText(`${qty[ref].toLocaleString("pt-BR")} un. × ${R.formatPrice(p.preco)}`, px + 24 + rowH, py + rowH * 0.78);
      x.fillStyle = WHITE;
      x.font = font(TITLE, Math.min(22, rowH * 0.42));
      x.textAlign = "right";
      x.fillText(R.formatPrice(R.lineTotal(p, qty[ref])), px + pw - 24, py + rowH * 0.6);
      x.textAlign = "left";
      py += rowH;
    });
    // Total
    const t = totals();
    const ty = H - 40 - 110;
    x.fillStyle = ORANGE;
    x.fillRect(px + 24, ty, pw - 48, 4);
    x.fillStyle = WHITE;
    x.font = font(BODY, 18, 600);
    x.fillText(`${t.units.toLocaleString("pt-BR")} unidades`, px + 24, ty + 40);
    x.fillStyle = ORANGE;
    x.font = font(TITLE, 54);
    x.textAlign = "right";
    x.fillText(R.formatPrice(t.total), px + pw - 24, ty + 84);
    x.textAlign = "left";
    x.fillStyle = WHITE;
    x.font = font(BODY, 18, 600);
    x.fillText("TOTAL", px + 24, ty + 80);

    // Rodapé
    x.fillStyle = BLACK;
    x.font = font(BODY, 16, 600);
    x.fillText(`Preços por unidade · ${new Date().toLocaleDateString("pt-BR")}`, 60, H - 14);
    // Marca "IN" no canto
    roundRect(x, W - 60 - 34, H - 36, 30, 30, 6);
    x.fill();
    x.fillStyle = ORANGE;
    x.font = font(TITLE, 15);
    x.textAlign = "center";
    x.fillText("IN", W - 60 - 19, H - 15);
    x.textAlign = "left";
    return c;
  }

  downloadBtn.addEventListener("click", async () => {
    if (!items.length) return;
    const label = downloadBtn.textContent;
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Gerando imagem…";
    try {
      const canvas = await drawPNG();
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "minha-vitrine-injet-nobre.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      announce("Imagem da vitrine baixada.");
    } catch (err) {
      announce("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      downloadBtn.textContent = label;
      downloadBtn.disabled = !items.length;
    }
  });

  /* ---------- Início ---------- */
  hintText.dataset.default = hintText.textContent;
  renderShelves();
  renderList();
  window.InjetVitrineBuilder = { drawPNG, message, items: () => items.slice(), qty: () => ({ ...qty }) };
})();
