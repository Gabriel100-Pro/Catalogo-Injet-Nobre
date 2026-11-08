/* ==========================================================================
   INJET NOBRE – ORÇAMENTO DE ATACADO
   Lista salva no localStorage do visitante. Cada cor é um produto (ref).
   Ao finalizar, monta uma mensagem com os itens e abre o WhatsApp:
   "• Estojo para relógio – Azul – 50 un."
   Eventos: injet:quote-add { ref, qty }, injet:quote-change { count }
   ========================================================================== */

(function () {
  "use strict";

  const R = window.InjetRender;

  const KEY_ITEMS = "injet-orcamento-v1";
  const KEY_CLIENT = "injet-orcamento-cliente-v1";
  const MAX_QTY = 9999;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
  const findProduct = R.findProduct; // só produtos ativos
  const clampQty = (n) => Math.min(MAX_QTY, Math.max(1, Math.round(Number(n)) || 1));

  /* ---------- Armazenamento (falha silenciosa: modo privado etc.) ---------- */
  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sem armazenamento */ }
    }
  };

  // Só mantém itens de produtos que ainda existem no catálogo
  let items = (storage.get(KEY_ITEMS, []) || [])
    .filter((i) => i && findProduct(i.ref))
    .map((i) => ({ ref: i.ref, qty: clampQty(i.qty) }));

  /* ---------- Estado ---------- */
  function save() {
    storage.set(KEY_ITEMS, items);
    render();
    emit("injet:quote-change", { count: items.length });
  }

  function add(ref, qty = 1) {
    if (!findProduct(ref)) return;
    const found = items.find((i) => i.ref === ref);
    if (found) found.qty = clampQty(found.qty + qty);
    else items.push({ ref, qty: clampQty(qty) });
    save();
    const item = items.find((i) => i.ref === ref);
    announce(`${R.fullName(findProduct(ref))} no orçamento: ${item.qty} ${item.qty === 1 ? "unidade" : "unidades"}.`);
    emit("injet:quote-add", { ref, qty: item.qty });
  }

  function setQty(ref, qty) {
    const found = items.find((i) => i.ref === ref);
    if (!found) return;
    found.qty = clampQty(qty);
    save();
  }

  function remove(ref) {
    const product = findProduct(ref);
    items = items.filter((i) => i.ref !== ref);
    save();
    if (product) announce(`${R.fullName(product)} removido do orçamento.`);
  }

  function clear() {
    items = [];
    save();
    announce("Orçamento limpo.");
  }

  /* ---------- Elementos ---------- */
  const drawer = $("#quote-drawer");
  const fab = $("#quote-fab");
  const countEl = $("#quote-count");
  const list = $("#quote-list");
  const empty = $("#quote-empty");
  const filled = $("#quote-filled");
  const totalItems = $("#quote-total-items");
  const totalUnits = $("#quote-total-units");
  const clearBtn = $("#quote-clear");
  const form = $("#quote-form");
  const note = $("#quote-note");
  const status = $("#quote-status");
  if (!drawer || !list) return;

  function announce(text) {
    if (!status) return;
    status.textContent = "";
    // pequeno atraso para leitores de tela anunciarem textos repetidos
    setTimeout(() => (status.textContent = text), 50);
  }

  function itemHTML(item) {
    const p = findProduct(item.ref);
    const name = R.esc(R.fullName(p));
    const thumb = R.hasPhoto(p) ? R.pictureHTML(p.imagem, "", { sizes: "56px" }) : "";
    return `
      <li class="quote-item" data-ref="${R.esc(p.ref)}">
        <div class="quote-thumb" aria-hidden="true">${thumb}</div>
        <div class="quote-info">
          <p class="quote-name">${R.esc(p.nome)}</p>
          <p class="quote-ref">${p.variante ? `<span class="quote-dot" style="--dot: ${R.esc(p.cor)}" aria-hidden="true"></span>${R.esc(p.variante)} · ` : ""}Ref. ${R.esc(p.ref)}</p>
        </div>
        <div class="qty" role="group" aria-label="Quantidade de ${name}">
          <button type="button" data-qty-step="-1" aria-label="Diminuir quantidade de ${name}" ${item.qty <= 1 ? "disabled" : ""}>−</button>
          <input type="number" min="1" max="${MAX_QTY}" step="1" inputmode="numeric" value="${item.qty}" aria-label="Quantidade de ${name}" data-qty-input>
          <button type="button" data-qty-step="1" aria-label="Aumentar quantidade de ${name}">+</button>
        </div>
        <button type="button" class="quote-remove" data-quote-remove aria-label="Remover ${name} do orçamento">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z"/></svg>
        </button>
      </li>`;
  }

  /** Redesenha a lista preservando o foco do teclado. */
  function render() {
    const active = document.activeElement;
    const activeItem = active && list.contains(active) ? active.closest(".quote-item") : null;
    const focusKey = activeItem && {
      ref: activeItem.dataset.ref,
      sel: active.matches("[data-qty-input]") ? "[data-qty-input]"
        : active.matches('[data-qty-step="1"]') ? '[data-qty-step="1"]'
        : active.matches('[data-qty-step="-1"]') ? '[data-qty-step="-1"]' : null
    };

    list.innerHTML = items.map(itemHTML).join("");

    const count = items.length;
    const units = items.reduce((sum, i) => sum + i.qty, 0);
    countEl.textContent = count;
    fab.classList.toggle("has-items", count > 0);
    fab.setAttribute("aria-label", `Abrir orçamento (${count} ${count === 1 ? "item" : "itens"})`);
    totalItems.textContent = count;
    totalUnits.textContent = units.toLocaleString("pt-BR");
    empty.hidden = count > 0;
    filled.hidden = count === 0;
    resetClear();

    if (focusKey && focusKey.sel) {
      const row = list.querySelector(`.quote-item[data-ref="${focusKey.ref}"]`);
      const el = row && row.querySelector(focusKey.sel);
      if (el && !el.disabled) el.focus();
      else if (row) row.querySelector("[data-qty-input]").focus();
    }
  }

  /* ---------- "Limpar tudo" em duas etapas (sem janela de confirmação) ---------- */
  let clearTimer = null;
  function resetClear() {
    clearTimeout(clearTimer);
    clearBtn.dataset.confirm = "";
    clearBtn.textContent = "Limpar tudo";
  }
  clearBtn.addEventListener("click", () => {
    if (clearBtn.dataset.confirm) {
      clear();
      $(".drawer-close", drawer).focus();
      return;
    }
    clearBtn.dataset.confirm = "1";
    clearBtn.textContent = "Confirmar: limpar tudo?";
    clearTimer = setTimeout(resetClear, 4000);
  });

  /* ---------- Lista: quantidade e remoção ---------- */
  list.addEventListener("click", (e) => {
    const row = e.target.closest(".quote-item");
    if (!row) return;
    const ref = row.dataset.ref;
    const step = e.target.closest("[data-qty-step]");
    if (step) {
      const item = items.find((i) => i.ref === ref);
      setQty(ref, item.qty + Number(step.dataset.qtyStep));
      return;
    }
    if (e.target.closest("[data-quote-remove]")) {
      // foco vai para o próximo item (ou anterior) para não se perder
      const next = row.nextElementSibling || row.previousElementSibling;
      const nextRef = next && next.dataset.ref;
      remove(ref);
      const target = nextRef && list.querySelector(`.quote-item[data-ref="${nextRef}"] [data-quote-remove]`);
      (target || $(".drawer-close", drawer)).focus();
    }
  });

  list.addEventListener("change", (e) => {
    if (!e.target.matches("[data-qty-input]")) return;
    setQty(e.target.closest(".quote-item").dataset.ref, e.target.value);
  });
  list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("[data-qty-input]")) {
      e.preventDefault();
      e.target.blur();
      setQty(e.target.closest(".quote-item").dataset.ref, e.target.value);
    }
  });

  /* ---------- Abrir / fechar painel ---------- */
  let lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    // fecha o modal de produto, se estiver aberto, para não empilhar diálogos
    const productModal = $("#product-modal");
    if (productModal && productModal.open) productModal.close();
    render();
    drawer.showModal();
    document.body.classList.add("is-drawer-open");
    emit("injet:quote-open", { drawer });
  }
  function close() {
    drawer.close();
  }

  drawer.addEventListener("close", () => {
    document.body.classList.remove("is-drawer-open");
    if (lastFocus && document.contains(lastFocus) && lastFocus.offsetParent !== null) lastFocus.focus();
    else if (fab) fab.focus();
  });
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) close(); // clique no fundo escuro
    if (e.target.closest("[data-quote-close]")) close();
  });

  /* ---------- Botões espalhados pelo site (delegação) ----------
     Cada produto tem quantidade (+ / −) e "Adicionar ao orçamento". */
  const labelTimers = new WeakMap();
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-quote-add]");
    if (addBtn) {
      const ref = addBtn.dataset.quoteAdd;
      const input = addBtn.closest("[data-buy]") && addBtn.closest("[data-buy]").querySelector("[data-buy-qty]");
      add(ref, clampQty(input ? input.value : 1));
      if (input) input.value = 1;
      const label = addBtn.querySelector("[data-quote-label]");
      const item = items.find((i) => i.ref === ref);
      if (label && item) {
        addBtn.classList.add("is-added");
        label.textContent = `No orçamento: ${item.qty.toLocaleString("pt-BR")} un.`;
        clearTimeout(labelTimers.get(addBtn));
        labelTimers.set(addBtn, setTimeout(() => {
          addBtn.classList.remove("is-added");
          label.textContent = "Adicionar ao orçamento";
        }, 2000));
      }
      return;
    }
    const step = e.target.closest("[data-buy-step]");
    if (step) {
      const input = step.closest("[data-buy]").querySelector("[data-buy-qty]");
      input.value = clampQty(Number(input.value) + Number(step.dataset.buyStep));
      return;
    }
    if (e.target.closest("[data-quote-open]") && !drawer.contains(e.target)) open();
  });

  // Quantidade digitada fica entre 1 e 9999
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-buy-qty]")) e.target.value = clampQty(e.target.value);
  });

  /* ---------- Enviar pelo WhatsApp ---------- */
  const savedClient = storage.get(KEY_CLIENT, {}) || {};
  ["nome", "empresa", "cidade"].forEach((f) => {
    if (savedClient[f] && form.elements[f]) form.elements[f].value = savedClient[f];
  });

  function buildMessage(client) {
    const lines = items.map((i) => {
      const p = findProduct(i.ref);
      return `• ${R.fullName(p)} – ${i.qty.toLocaleString("pt-BR")} un.`;
    });
    const units = items.reduce((s, i) => s + i.qty, 0);
    return [
      "Olá! Gostaria de um orçamento de atacado.",
      "",
      `*Nome:* ${client.nome}`,
      `*Empresa:* ${client.empresa}`,
      `*Cidade:* ${client.cidade}`,
      "",
      "*Itens:*",
      ...lines,
      "",
      `Total: ${items.length} ${items.length === 1 ? "item" : "itens"}, ${units.toLocaleString("pt-BR")} unidades.`
    ].join("\n");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!items.length) return;
    const client = {
      nome: form.elements.nome.value.trim(),
      empresa: form.elements.empresa.value.trim(),
      cidade: form.elements.cidade.value.trim()
    };
    // campos só com espaços contam como vazios
    for (const f of ["nome", "empresa", "cidade"]) {
      if (!client[f]) {
        form.elements[f].value = "";
        form.reportValidity();
        return;
      }
    }
    storage.set(KEY_CLIENT, client);
    const url = R.whatsappLink(buildMessage(client));
    window.open(url, "_blank", "noopener");
    note.textContent = "Abrimos o WhatsApp com a mensagem pronta. Depois de enviar, você pode limpar a lista.";
    announce("Mensagem do orçamento aberta no WhatsApp.");
  });

  window.InjetQuote = { add, remove, setQty, clear, open, close, items: () => items.slice(), buildMessage };

  render();
})();
