/* ==========================================================================
   INJET NOBRE – TEMPLATES / RENDERIZAÇÃO
   Funções puras que transformam dados em HTML. Sem efeitos colaterais:
   o comportamento fica em main.js / quote.js e as animações em animations.js.
   ========================================================================== */

(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  // Só produtos ativos entram no site (ativo: false = oculto)
  const products = (window.PRODUCTS || []).filter((p) => p.ativo !== false);

  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  /** Escapa texto para uso seguro dentro de HTML. */
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** 69.9 -> "R$ 69,90" (com espaço que não quebra) */
  function formatPrice(value) {
    return currency.format(value).replace(/\s/g, " ");
  }

  /** 69.9 -> "69,90" (sem o símbolo, para o círculo de preço) */
  function formatNumber(value) {
    return value.toFixed(2).replace(".", ",");
  }

  /** Percentual de desconto inteiro, ou 0. */
  function discount(product) {
    if (!product.precoAntigo || product.precoAntigo <= product.preco) return 0;
    return Math.round((1 - product.preco / product.precoAntigo) * 100);
  }

  /** "Estojo para relógio – Preto" */
  function fullName(product) {
    return product.variante ? `${product.nome} – ${product.variante}` : product.nome;
  }

  const findProduct = (ref) => products.find((p) => p.ref === ref);
  const siblings = (product) => products.filter((p) => p.grupo && p.grupo === product.grupo);

  /** Link do WhatsApp com mensagem pronta. */
  function whatsappLink(message) {
    return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  function productWhatsapp(product) {
    return whatsappLink(`Olá! Tenho interesse no produto ${fullName(product)} (Ref. ${product.ref})`);
  }

  const pad = (n) => String(n).padStart(2, "0");

  /** Atributos de cor do painel (usados pelo CSS: fundo, contorno e texto). */
  function panelAttrs(product) {
    return `data-contorno="${esc(product.contorno || "light")}" data-tema="${esc(product.tema || "light")}" style="--panel: ${esc(product.painel || "#FF6A13")}"`;
  }

  /* ---------- Fotos ---------- */

  /**
   * Foto do produto: WebP (600/1000 px) com fallback em PNG.
   * Todas as fotos são quadradas, com o produto centralizado e no mesmo tamanho
   * (tools/otimizar-imagens.py). A sombra é feita no CSS.
   */
  function pictureHTML(name, alt, { eager = false, priority = false, sizes = "(min-width: 960px) 40vw, 80vw", extraClass = "" } = {}) {
    const base = `assets/produtos/${esc(name)}`;
    const loading = eager ? (priority ? 'fetchpriority="high"' : "") : 'loading="lazy"';
    return `
      <picture class="pic ${extraClass}">
        <source type="image/webp" srcset="${base}-600.webp 600w, ${base}-1000.webp 1000w" sizes="${sizes}">
        <img src="${base}.png" alt="${esc(alt)}" width="1000" height="1000" ${loading} decoding="async">
      </picture>`;
  }

  /** Quadro "Foto em breve" (produto sem foto pronta). */
  function pendingHTML(product) {
    return `
      <div class="photo-pending" role="img" aria-label="Foto de ${esc(fullName(product))} em breve">
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 8h12l3 5h7a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3h7l3-5Zm6 10a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg>
        <span>Foto em breve</span>
      </div>`;
  }

  const hasPhoto = (product) => Boolean(product.imagem && !product.imagemComFundo);

  /** Arte do produto: foto real ou quadro "Foto em breve". */
  function artHTML(product, opts = {}) {
    return hasPhoto(product) ? pictureHTML(product.imagem, fullName(product), opts) : pendingHTML(product);
  }

  /* ---------- Blocos reutilizáveis ---------- */

  function badgeHTML(product) {
    const pct = discount(product);
    if (!pct) return "";
    return `<span class="badge" data-pop aria-label="${pct}% de desconto"><span aria-hidden="true">${pct}%<small>OFF</small></span></span>`;
  }

  /** Área da imagem: quadro tracejado sobre bloco de listras diagonais + selo. */
  function mediaHTML(product, { extraClass = "", eager = false, sizes, inner } = {}) {
    return `
      <div class="media ${extraClass}">
        <span class="media-stripes" aria-hidden="true"></span>
        <div class="media-frame" data-art>${inner || artHTML(product, { eager, sizes: sizes || "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" })}</div>
        ${badgeHTML(product)}
      </div>`;
  }

  function specsHTML(list, limit) {
    const items = (list || []).slice(0, limit || undefined);
    if (!items.length) return "";
    return `
      <table class="specs">
        <caption class="sr-only">Características</caption>
        <tbody>
          ${items.map((c) => `<tr><th scope="row">${esc(c.rotulo)}</th><td>${esc(c.valor)}</td></tr>`).join("")}
        </tbody>
      </table>`;
  }

  function priceHTML(product) {
    const old = product.precoAntigo
      ? `<p class="price-old"><span class="sr-only">Preço anterior: </span>de <s>${formatPrice(product.precoAntigo)}</s> por</p>`
      : `<p class="price-old">por apenas</p>`;
    return `
      <div class="price">
        ${old}
        <p class="price-circle" data-pop><span class="sr-only">Preço atual: </span><small aria-hidden="true">R$</small><span class="sr-only">R$ </span>${formatNumber(product.preco)}</p>
      </div>`;
  }

  const WHATS_ICON = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>`;

  function whatsButton(product, extraClass = "") {
    return `
      <a class="btn btn--whats ${extraClass}" href="${productWhatsapp(product)}" target="_blank" rel="noopener"
         aria-label="Pedir ${esc(fullName(product))} no WhatsApp (abre em nova aba)">
        ${WHATS_ICON}
        Pedir no WhatsApp
      </a>`;
  }

  function detailsButton(product, label = "Ver detalhes", cls = "btn--outline") {
    return `<button type="button" class="btn ${cls}" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">${label}<span class="sr-only"> – ${esc(fullName(product))}</span></button>`;
  }

  /** Quantidade + "Adicionar ao orçamento" (lógica em quote.js). */
  function buyHTML(product) {
    const name = esc(fullName(product));
    return `
      <div class="buy" data-buy>
        <div class="qty" role="group" aria-label="Quantidade de ${name}">
          <button type="button" data-buy-step="-1" aria-label="Diminuir quantidade de ${name}">−</button>
          <input type="number" min="1" max="9999" step="1" inputmode="numeric" value="1" aria-label="Quantidade de ${name}" data-buy-qty>
          <button type="button" data-buy-step="1" aria-label="Aumentar quantidade de ${name}">+</button>
        </div>
        <button type="button" class="btn btn--quote" data-quote-add="${esc(product.ref)}">
          <span class="btn-quote-plus" aria-hidden="true">+</span>
          <span data-quote-label>Adicionar ao orçamento</span>
          <span class="sr-only"> – ${name}</span>
        </button>
      </div>`;
  }

  /** Nome em duas partes: "Estojo para relógio" + variante destacada. */
  function titleHTML(product) {
    return `${esc(product.nome)}${product.variante ? ` <span class="title-variant">${esc(product.variante)}</span>` : ""}`;
  }

  /* ---------- Templates principais ---------- */

  /** Card do produto na grade. */
  function cardHTML(product) {
    return `
      <article class="card" data-ref="${esc(product.ref)}" data-line="${esc(product.linha)}" data-animate="card">
        ${mediaHTML(product)}
        <div class="card-body">
          <p class="card-meta">${esc(product.numero)} · Ref. ${esc(product.ref)}</p>
          <h4 class="card-title">
            <button type="button" class="card-open" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">${titleHTML(product)}</button>
          </h4>
          <p class="card-desc">${esc(product.descricao)}</p>
          ${specsHTML(product.caracteristicas)}
          <div class="card-footer">
            ${priceHTML(product)}
            ${whatsButton(product)}
            ${buyHTML(product)}
          </div>
        </div>
      </article>`;
  }

  /**
   * Produto em destaque no hero. Atrás da foto principal ficam as outras
   * cores do mesmo grupo, que abrem em leque (variável CSS --fan).
   */
  function heroHTML(product) {
    const back = siblings(product).filter((p) => p !== product && hasPhoto(p));
    const sizes = "(min-width: 960px) 32vw, 70vw";
    const slots = [-2, -1, 1, 2, -3, 3];
    const fan = `
      <div class="fan" id="hero-fan">
        ${back.map((p, i) => `
          <div class="fan-item" style="--slot: ${slots[i] ?? 0}">${pictureHTML(p.imagem, "", { eager: true, sizes })}</div>`).join("")}
        <div class="fan-item fan-item--front">${artHTML(product, { eager: true, priority: true, sizes })}</div>
      </div>`;
    return `
      <span class="dots-pattern dots-pattern--feature" data-float aria-hidden="true"></span>
      ${mediaHTML(product, { extraClass: "media--hero", inner: fan })}
      <div class="hero-feature-body">
        <p class="card-meta">${esc(product.numero)} · Ref. ${esc(product.ref)} · Destaque</p>
        <h2 class="hero-feature-title">${titleHTML(product)}</h2>
        <p class="hero-feature-desc">${esc(product.descricao)}</p>
        ${product.precoAntigo ? `<p class="price-old"><span class="sr-only">Preço anterior: </span><s>${formatPrice(product.precoAntigo)}</s></p>` : ""}
        <p class="hero-price"><span class="sr-only">Preço atual: </span>${formatPrice(product.preco)}</p>
        <div class="hero-feature-actions">
          ${whatsButton(product)}
          ${detailsButton(product)}
        </div>
      </div>`;
  }

  /** Efeito atrás da foto (brilho laranja / holofote). */
  function fxHTML(product) {
    return product.efeito ? `<span class="fx fx--${esc(product.efeito)}" aria-hidden="true"></span>` : "";
  }

  /** Slide da vitrine horizontal (painel de cor + painel branco, lado alternado). */
  function slideHTML(product, index, total) {
    const flip = index % 2 === 1;
    return `
      <li class="slide${flip ? " slide--flip" : ""}" data-index="${index}" data-ref="${esc(product.ref)}" ${panelAttrs(product)}
          aria-roledescription="slide" aria-label="${index + 1} de ${total}: ${esc(fullName(product))}">
        <div class="slide-visual">
          ${fxHTML(product)}
          <span class="slide-number outline-text" aria-hidden="true">${esc(product.numero)}</span>
          <span class="dots-pattern" data-float aria-hidden="true"></span>
          <div class="slide-art" data-art>${artHTML(product, { sizes: "(min-width: 960px) 34vw, 70vw" })}</div>
          ${badgeHTML(product)}
        </div>
        <div class="slide-info">
          <p class="card-meta">${esc(product.rotuloLinha || "")} · Ref. ${esc(product.ref)}</p>
          <h3 class="slide-title">${titleHTML(product)}</h3>
          <p class="slide-desc">${esc(product.descricao)}</p>
          ${specsHTML(product.caracteristicas, 3)}
          ${priceHTML(product)}
          <div class="slide-actions">
            ${whatsButton(product)}
            ${detailsButton(product)}
          </div>
        </div>
      </li>`;
  }

  /* ---------- Vitrine de linha (tela cheia, com seletor) ---------- */

  /** Bolinhas de cor (radios nativos: as setas do teclado já funcionam). */
  function swatchesHTML(list, line, current) {
    return `
      <fieldset class="swatches" data-line-picker="${esc(line)}">
        <legend class="picker-legend">Cor: <strong data-line-variant>${esc(current.variante)}</strong></legend>
        <div class="swatches-list">
          ${list.map((p) => `
            <label class="swatch" title="${esc(p.variante)}">
              <input type="radio" name="linha-${esc(line)}" value="${esc(p.ref)}" ${p === current ? "checked" : ""}>
              <span class="swatch-dot" style="--dot: ${esc(p.cor)}" aria-hidden="true"></span>
              <span class="sr-only">${esc(p.variante)}</span>
            </label>`).join("")}
        </div>
      </fieldset>`;
  }

  /** Botões segmentados ("Cristal / Preto / Brinco"). */
  function segmentedHTML(list, line, current) {
    return `
      <fieldset class="segmented" data-line-picker="${esc(line)}">
        <legend class="sr-only">Escolha o expositor</legend>
        <div class="segmented-list">
          ${list.map((p) => `
            <label class="segment">
              <input type="radio" name="linha-${esc(line)}" value="${esc(p.ref)}" ${p === current ? "checked" : ""}>
              <span>${esc(p.legenda || p.variante)}</span>
            </label>`).join("")}
        </div>
      </fieldset>`;
  }

  /** Miniaturas embaixo do produto (expositores). */
  function lineThumbsHTML(list, line, current) {
    return `
      <div class="line-thumbs" role="group" aria-label="Miniaturas dos expositores">
        ${list.map((p) => `
          <button type="button" class="line-thumb" data-line-thumb="${esc(line)}" value="${esc(p.ref)}" aria-pressed="${p === current}" aria-label="${esc(fullName(p))}">
            ${hasPhoto(p) ? pictureHTML(p.imagem, "", { sizes: "72px" }) : `<span class="line-thumb-pending" aria-hidden="true">?</span>`}
          </button>`).join("")}
      </div>`;
  }

  /** Card flutuante da vitrine de linha (atualizado ao trocar o produto). */
  function lineCardHTML(product, count, lineName) {
    return `
      <p class="spotlight-kicker">${esc(lineName)} · ${count} ${count === 1 ? "produto" : "produtos"} · Ref. ${esc(product.ref)}</p>
      <h4 class="spotlight-name">${titleHTML(product)}</h4>
      ${priceHTML(product)}
      ${detailsButton(product, "Ver produto", "btn--dark")}`;
  }

  /** Destaque em tela cheia que abre cada linha. */
  function spotlightHTML(list, line, { word, lineName, picker }) {
    const current = list.find((p) => p.destaqueLinha) || list[0];
    const layers = list.map((p) => `
      <span class="spot-layer${p === current ? " is-active" : ""}" data-layer="${esc(p.ref)}" style="--panel: ${esc(p.painel)}" aria-hidden="true">${fxHTML(p)}</span>`).join("");
    const arts = list.map((p) => `
      <div class="swap-item${p === current ? " is-active" : ""}" data-swap-ref="${esc(p.ref)}" ${p === current ? "" : 'aria-hidden="true"'}>
        ${artHTML(p, { sizes: "(min-width: 960px) 48vw, 86vw" })}
      </div>`).join("");
    const pickerHTML = picker === "segmented" ? segmentedHTML(list, line, current) : swatchesHTML(list, line, current);
    return `
      <div class="spotlight spotlight--${esc(line)}" data-spotlight-root="${esc(line)}" ${panelAttrs(current)}>
        <div class="spot-layers">${layers}</div>
        <span class="spotlight-word outline-text" aria-hidden="true">${esc(word)}</span>
        <span class="dots-pattern dots-pattern--spot-a" data-float aria-hidden="true"></span>
        <span class="dots-pattern dots-pattern--spot-b" data-float aria-hidden="true"></span>
        <div class="spotlight-stage">
          <div class="spotlight-art swap">${arts}</div>
          ${picker === "segmented" ? lineThumbsHTML(list, line, current) : ""}
        </div>
        <div class="spotlight-info">
          ${pickerHTML}
          <div data-line-card>${lineCardHTML(current, list.length, lineName)}</div>
        </div>
      </div>`;
  }

  /* ---------- Modal ---------- */

  /** Conteúdo do modal (foto com zoom, outras cores e navegação). */
  function modalHTML(product, index, total) {
    const others = siblings(product);
    const colors = others.length > 1
      ? `<div class="modal-colors">
          <p class="picker-legend">Outras cores</p>
          <div class="swatches-list">
            ${others.map((p) => `
              <button type="button" class="swatch" data-modal-goto="${esc(p.ref)}" aria-pressed="${p === product}" title="${esc(p.variante)}">
                <span class="swatch-dot" style="--dot: ${esc(p.cor)}" aria-hidden="true"></span>
                <span class="sr-only">${esc(p.variante)}</span>
              </button>`).join("")}
          </div>
        </div>`
      : "";

    return `
      <div class="showcase" ${panelAttrs(product)}>
        <div class="showcase-stage">
          <span class="media-stripes" aria-hidden="true"></span>
          <div class="stage-frame" data-zoom>
            ${fxHTML(product)}
            <div class="stage-zoom">
              <div class="stage-item is-active">${artHTML(product, { eager: true, sizes: "(min-width: 760px) 460px, 90vw" })}</div>
            </div>
          </div>
          ${badgeHTML(product)}
          ${hasPhoto(product) ? '<p class="stage-hint" aria-hidden="true">Passe o mouse para ampliar</p>' : ""}
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-nav">
          <button type="button" class="nav-arrow" data-modal-step="-1" aria-label="Produto anterior">←</button>
          <p class="modal-count" aria-live="polite"><span class="sr-only">Produto </span><strong>${pad(index + 1)}</strong> / ${pad(total)}</p>
          <button type="button" class="nav-arrow" data-modal-step="1" aria-label="Próximo produto">→</button>
        </div>
        <p class="card-meta">${esc(product.numero)} · Ref. ${esc(product.ref)} · ${esc(product.rotuloLinha || "")}</p>
        <h2 id="modal-titulo" class="modal-title">${titleHTML(product)}</h2>
        <p class="modal-desc">${esc(product.descricao)}</p>
        ${specsHTML(product.caracteristicas)}
        ${colors}
        <div class="card-footer">
          ${priceHTML(product)}
          ${whatsButton(product)}
          ${buyHTML(product)}
        </div>
      </div>`;
  }

  /* ---------- Outras seções ---------- */

  /** Número de destaque da fábrica (o contador anima o span visual). */
  function statHTML(stat) {
    const final = `${Number(stat.valor).toLocaleString("pt-BR")}${stat.sufixo || ""}`;
    return `
      <li>
        <strong>
          <span class="sr-only">${esc(final)}</span>
          <span aria-hidden="true" data-count="${Number(stat.valor)}" data-suffix="${esc(stat.sufixo || "")}">${esc(final)}</span>
        </strong>
        <span>${esc(stat.rotulo)}</span>
      </li>`;
  }

  /** Foto da produção: quadro provisório por baixo, foto por cima. */
  function factoryPhotoHTML(photo) {
    return `
      <li class="factory-item">
        <figure>
          <div class="factory-media" data-art>
            <div class="factory-placeholder" aria-hidden="true">
              <svg viewBox="0 0 48 48" focusable="false"><path fill="currentColor" d="M18 8h12l3 5h7a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3h7l3-5Zm6 10a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg>
              <span>Foto em breve</span>
            </div>
            <img class="media-img" data-src="${esc(photo.src)}" alt="${esc(photo.legenda)}" loading="lazy" decoding="async">
          </div>
          <figcaption>${esc(photo.legenda)}</figcaption>
        </figure>
      </li>`;
  }

  /** Item da faixa de ofertas. */
  function offerItemHTML(product) {
    return `
      <li>
        <button type="button" class="offer-item" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">
          <span class="offer-pct">-${discount(product)}%</span>
          <span class="offer-name">${esc(product.nome)}</span>
          <span class="offer-price"><s>${formatPrice(product.precoAntigo)}</s> ${formatPrice(product.preco)}</span>
        </button>
      </li>`;
  }

  window.InjetRender = {
    esc,
    pad,
    products,
    findProduct,
    siblings,
    fullName,
    hasPhoto,
    formatPrice,
    discount,
    whatsappLink,
    productWhatsapp,
    pictureHTML,
    artHTML,
    cardHTML,
    heroHTML,
    slideHTML,
    spotlightHTML,
    lineCardHTML,
    modalHTML,
    offerItemHTML,
    statHTML,
    factoryPhotoHTML
  };
})();
