/* ==========================================================================
   INJET NOBRE – TEMPLATES / RENDERIZAÇÃO
   Funções puras que transformam dados em HTML. Sem efeitos colaterais:
   o comportamento fica em main.js e as animações em animations.js.
   ========================================================================== */

(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const I = window.InjetIllustrations;

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

  /** 69.9 -> "R$ 69,90" */
  function formatPrice(value) {
    return currency.format(value).replace(/ /g, " ");
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

  /** Caminho da foto principal: campo "imagem" ou assets/produtos/<ref>.jpg */
  function imagePath(product) {
    return product.imagem || `assets/produtos/${product.ref.toLowerCase()}.jpg`;
  }

  /** Lista de fotos para a galeria do modal. */
  function photoList(product) {
    return product.imagens && product.imagens.length ? product.imagens : [imagePath(product)];
  }

  /** Link do WhatsApp com mensagem pronta. */
  function whatsappLink(message) {
    return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  function productWhatsapp(product) {
    return whatsappLink(`Olá! Tenho interesse no produto ${product.nome} (Ref. ${product.ref})`);
  }

  const lineLabel = { utilidades: "Linha Utilidades", relojoaria: "Linha Relojoaria" };
  const pad = (n) => String(n).padStart(2, "0");

  /** Escolhe a cor da ilustração que contrasta com o fundo. */
  function variantFor(product, background) {
    if (!I) return undefined;
    const list = I.variants(product.ref);
    if (background === "orange") return list.find((v) => v !== "laranja") || list[0];
    if (background === "dark") return list.find((v) => v !== "preto") || list[0];
    return list[0];
  }

  /* ---------- Blocos reutilizáveis ---------- */

  function badgeHTML(product) {
    const pct = discount(product);
    if (!pct) return "";
    return `<span class="badge" data-pop aria-label="${pct}% de desconto"><span aria-hidden="true">${pct}%<small>OFF</small></span></span>`;
  }

  /**
   * Arte do produto: ilustração (ou nome) por baixo + <img> por cima.
   * Se a foto não existir, main.js remove a <img> e a ilustração aparece.
   */
  function artHTML(product, { variant, eager = false } = {}) {
    const fallback = I && I.has(product.ref)
      ? I.draw(product.ref, variant)
      : `<span class="media-placeholder-ref">${esc(product.ref)}</span><span class="media-placeholder-name">${esc(product.nome)}</span>`;
    return `
      <div class="media-placeholder" aria-hidden="true">${fallback}</div>
      <img class="media-img" data-src="${esc(imagePath(product))}" alt="${esc(product.nome)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;
  }

  /** Área da imagem com bloco de listras diagonais e selo. */
  function mediaHTML(product, { extraClass = "", eager = false, variant } = {}) {
    return `
      <div class="media ${extraClass}">
        <span class="media-stripes" aria-hidden="true"></span>
        <div class="media-frame" data-art>${artHTML(product, { eager, variant })}</div>
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

  function whatsButton(product, extraClass = "") {
    return `
      <a class="btn btn--whats ${extraClass}" href="${productWhatsapp(product)}" target="_blank" rel="noopener"
         aria-label="Pedir ${esc(product.nome)} no WhatsApp (abre em nova aba)">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>
        Pedir no WhatsApp
      </a>`;
  }

  /** Botão "Adicionar ao orçamento" (lógica em quote.js). */
  function quoteButton(product) {
    return `
      <button type="button" class="btn btn--quote" data-quote-add="${esc(product.ref)}">
        <span class="btn-quote-plus" aria-hidden="true">+</span>
        <span data-quote-label>Adicionar ao orçamento</span>
        <span class="sr-only"> – ${esc(product.nome)}</span>
      </button>`;
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
            <button type="button" class="card-open" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">${esc(product.nome)}</button>
          </h4>
          <p class="card-desc">${esc(product.descricao)}</p>
          ${specsHTML(product.caracteristicas, 2)}
          <div class="card-footer">
            ${priceHTML(product)}
            ${whatsButton(product)}
            ${quoteButton(product)}
          </div>
        </div>
      </article>`;
  }

  /** Produto em destaque no hero. */
  function heroHTML(product) {
    return `
      ${mediaHTML(product, { extraClass: "media--hero", eager: true })}
      <div class="hero-feature-body">
        <p class="card-meta">${esc(product.numero)} · Ref. ${esc(product.ref)} · Destaque</p>
        <h2 class="hero-feature-title">${esc(product.nome)}</h2>
        <p class="hero-feature-desc">${esc(product.descricao)}</p>
        ${product.precoAntigo ? `<p class="price-old"><span class="sr-only">Preço anterior: </span><s>${formatPrice(product.precoAntigo)}</s></p>` : ""}
        <p class="hero-price"><span class="sr-only">Preço atual: </span>${formatPrice(product.preco)}</p>
        <div class="hero-feature-actions">
          ${whatsButton(product)}
          <button type="button" class="btn btn--outline" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">Ver detalhes</button>
        </div>
      </div>`;
  }

  /** Slide da vitrine horizontal. */
  function slideHTML(product, index, total) {
    const dark = product.linha === "relojoaria";
    return `
      <li class="slide slide--${esc(product.linha)}" data-index="${index}" data-ref="${esc(product.ref)}"
          aria-roledescription="slide" aria-label="${index + 1} de ${total}: ${esc(product.nome)}">
        <div class="slide-visual">
          <span class="slide-number outline-text ${dark ? "outline-text--orange" : "outline-text--light"}" aria-hidden="true">${esc(product.numero)}</span>
          <span class="dots-pattern ${dark ? "dots-pattern--orange" : ""}" data-float aria-hidden="true"></span>
          <div class="slide-art" data-art>${artHTML(product, { variant: variantFor(product, dark ? "dark" : "orange") })}</div>
          ${badgeHTML(product)}
        </div>
        <div class="slide-info">
          <p class="card-meta">${esc(lineLabel[product.linha] || "")} · Ref. ${esc(product.ref)}</p>
          <h3 class="slide-title">${esc(product.nome)}</h3>
          <p class="slide-desc">${esc(product.descricao)}</p>
          ${specsHTML(product.caracteristicas, 3)}
          ${priceHTML(product)}
          <div class="slide-actions">
            ${whatsButton(product)}
            <button type="button" class="btn btn--outline" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">Ver detalhes</button>
          </div>
        </div>
      </li>`;
  }

  /** Destaque em tela cheia que abre cada linha. */
  function spotlightHTML(product, line, count) {
    const dark = line === "relojoaria";
    const word = line === "relojoaria" ? "Relojoaria" : "Utilidades";
    return `
      <div class="spotlight spotlight--${esc(line)}">
        <span class="spotlight-word outline-text ${dark ? "outline-text--orange" : "outline-text--light"}" aria-hidden="true">${word}</span>
        <span class="dots-pattern dots-pattern--spot-a ${dark ? "dots-pattern--orange" : ""}" data-float aria-hidden="true"></span>
        <span class="dots-pattern dots-pattern--spot-b ${dark ? "dots-pattern--orange" : ""}" data-float aria-hidden="true"></span>
        <div class="spotlight-art" data-art>
          ${artHTML(product, { variant: variantFor(product, dark ? "dark" : "orange") })}
        </div>
        <div class="spotlight-info">
          <p class="spotlight-kicker">${esc(lineLabel[line])} · ${count} produtos</p>
          <h4 class="spotlight-name">${esc(product.nome)}</h4>
          ${priceHTML(product)}
          <button type="button" class="btn ${dark ? "btn--orange" : "btn--dark"}" data-open-product="${esc(product.ref)}" aria-haspopup="dialog">Ver produto</button>
        </div>
        ${badgeHTML(product)}
      </div>`;
  }

  /** Item de galeria (foto real ou ilustração). */
  function galleryItemHTML(item) {
    return item.type === "img"
      ? `<img src="${esc(item.src)}" alt="${esc(item.label)}" decoding="async">`
      : item.html;
  }

  /** Conteúdo do modal (showcase com galeria, zoom e navegação). */
  function modalHTML(product, index, total, gallery) {
    const thumbs = gallery.length > 1
      ? `<div class="thumbs" role="group" aria-label="Escolher imagem">
          ${gallery.map((g, i) => `
            <button type="button" class="thumb" data-thumb="${i}" aria-pressed="${i === 0}" aria-label="${esc(g.label)}">
              ${galleryItemHTML(g)}
            </button>`).join("")}
        </div>`
      : "";

    return `
      <div class="showcase">
        <div class="showcase-stage">
          <span class="media-stripes" aria-hidden="true"></span>
          <div class="stage-frame" data-zoom>
            <div class="stage-zoom">
              ${gallery.map((g, i) => `
                <div class="stage-item${i === 0 ? " is-active" : ""}" data-stage="${i}" ${i === 0 ? "" : 'aria-hidden="true"'}>
                  ${galleryItemHTML(g)}
                </div>`).join("")}
            </div>
          </div>
          ${badgeHTML(product)}
          <p class="stage-hint" aria-hidden="true">Passe o mouse para ampliar</p>
        </div>
        ${thumbs}
      </div>
      <div class="modal-body">
        <div class="modal-nav">
          <button type="button" class="nav-arrow" data-modal-step="-1" aria-label="Produto anterior">←</button>
          <p class="modal-count" aria-live="polite"><span class="sr-only">Produto </span><strong>${pad(index + 1)}</strong> / ${pad(total)}</p>
          <button type="button" class="nav-arrow" data-modal-step="1" aria-label="Próximo produto">→</button>
        </div>
        <p class="card-meta">${esc(product.numero)} · Ref. ${esc(product.ref)} · ${esc(lineLabel[product.linha] || "")}</p>
        <h2 id="modal-titulo" class="modal-title">${esc(product.nome)}</h2>
        <p class="modal-desc">${esc(product.descricao)}</p>
        ${specsHTML(product.caracteristicas)}
        <div class="card-footer">
          ${priceHTML(product)}
          ${whatsButton(product)}
          ${quoteButton(product)}
        </div>
      </div>`;
  }

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
    formatPrice,
    discount,
    imagePath,
    photoList,
    whatsappLink,
    productWhatsapp,
    cardHTML,
    heroHTML,
    slideHTML,
    spotlightHTML,
    modalHTML,
    offerItemHTML,
    statHTML,
    factoryPhotoHTML
  };
})();
