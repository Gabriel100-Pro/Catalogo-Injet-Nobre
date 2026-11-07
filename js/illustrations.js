/* ==========================================================================
   INJET NOBRE – ILUSTRAÇÕES PROVISÓRIAS
   Desenhos em SVG no estilo do catálogo, usados enquanto não houver foto
   em assets/produtos/. Cada desenho aceita uma paleta (cor ilustrativa),
   o que alimenta as miniaturas do modal. Quando houver fotos reais, elas
   têm prioridade e este arquivo deixa de aparecer.
   ========================================================================== */

(function () {
  "use strict";

  const O = "#111111"; // contorno

  const palettes = {
    laranja: { nome: "Laranja", body: "#FF6A13", lid: "#111111", detail: "#FFFFFF" },
    preto:   { nome: "Preto",   body: "#2B2B2B", lid: "#111111", detail: "#FF6A13" },
    branco:  { nome: "Branco",  body: "#FFFFFF", lid: "#111111", detail: "#CFCFCF" },
    cristal: { nome: "Cristal", body: "#CDEBF2", lid: "#111111", detail: "#FFFFFF" }
  };

  // Ordem das variações por produto (a primeira é a padrão)
  const variantsByRef = {
    "IN-606": ["preto", "laranja", "branco"],
    "IN-808": ["cristal", "laranja", "preto"]
  };
  const defaultVariants = ["laranja", "preto", "branco"];

  const shadow = `<ellipse cx="120" cy="186" rx="92" ry="8" fill="${O}" opacity=".16"/>`;

  const drawings = {
    // Caixa Stack Pro: duas caixas empilhadas
    "IN-101": (p) => `
      ${shadow}
      <rect x="34" y="108" width="172" height="72" rx="10" fill="${p.lid}" stroke="${O}" stroke-width="5"/>
      <rect x="26" y="98" width="188" height="18" rx="6" fill="${p.lid}" stroke="${O}" stroke-width="5"/>
      <rect x="96" y="132" width="48" height="8" rx="4" fill="${p.body}"/>
      <rect x="44" y="34" width="152" height="62" rx="9" fill="${p.body}" stroke="${O}" stroke-width="5"/>
      <rect x="36" y="22" width="168" height="18" rx="6" fill="${p.lid}"/>
      <rect x="30" y="16" width="20" height="14" rx="3" fill="${p.detail}" stroke="${O}" stroke-width="4"/>
      <rect x="190" y="16" width="20" height="14" rx="3" fill="${p.detail}" stroke="${O}" stroke-width="4"/>
      <rect x="72" y="62" width="96" height="5" rx="2.5" fill="${p.detail}" opacity=".75"/>`,

    // Pote Lock Fresh: pote hermético com 4 travas
    "IN-202": (p) => `
      ${shadow}
      <rect x="52" y="80" width="136" height="96" rx="16" fill="#FFFFFF" stroke="${O}" stroke-width="5"/>
      <rect x="66" y="98" width="108" height="60" rx="10" fill="${p.body}" opacity=".3"/>
      <rect x="40" y="62" width="160" height="24" rx="8" fill="${p.body}" stroke="${O}" stroke-width="5"/>
      <rect x="28" y="66" width="16" height="22" rx="4" fill="${p.body}" stroke="${O}" stroke-width="4"/>
      <rect x="196" y="66" width="16" height="22" rx="4" fill="${p.body}" stroke="${O}" stroke-width="4"/>
      <rect x="102" y="48" width="36" height="16" rx="5" fill="#FFFFFF" stroke="${O}" stroke-width="4"/>`,

    // Balde Flex: alça reforçada e graduação interna
    "IN-303": (p) => `
      ${shadow}
      <path d="M64 70 Q120 -6 176 70" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
      <rect x="102" y="24" width="36" height="12" rx="6" fill="${p.lid}"/>
      <path d="M60 74 L180 74 L166 178 L74 178 Z" fill="${p.body}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="50" y="62" width="140" height="18" rx="7" fill="${p.lid}"/>
      <g stroke="${p.detail}" stroke-width="5" stroke-linecap="round" opacity=".85">
        <line x1="84" y1="108" x2="124" y2="108"/>
        <line x1="86" y1="130" x2="114" y2="130"/>
        <line x1="88" y1="152" x2="124" y2="152"/>
      </g>`,

    // Banqueta Fold Up: assento + pernas dobráveis
    "IN-404": (p) => `
      ${shadow}
      <path d="M66 74 L56 176 L78 176 L88 74 Z" fill="${p.lid}"/>
      <path d="M174 74 L184 176 L162 176 L152 74 Z" fill="${p.lid}"/>
      <rect x="66" y="124" width="108" height="10" rx="3" fill="${p.lid}"/>
      <rect x="50" y="170" width="34" height="10" rx="4" fill="${p.body}" stroke="${O}" stroke-width="3"/>
      <rect x="156" y="170" width="34" height="10" rx="4" fill="${p.body}" stroke="${O}" stroke-width="3"/>
      <rect x="40" y="50" width="160" height="28" rx="10" fill="${p.body}" stroke="${O}" stroke-width="5"/>
      <rect x="100" y="59" width="40" height="9" rx="4.5" fill="${p.lid}"/>`,

    // Organizador Grid Set: 6 módulos encaixáveis
    "IN-505": (p) => {
      const cells = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const fill = (r + c) % 2 ? "#FFFFFF" : p.body;
          cells.push(`<rect x="${38 + c * 56}" y="${58 + r * 58}" width="50" height="52" rx="7" fill="${fill}" stroke="${O}" stroke-width="5"/>`);
        }
      }
      return `${shadow}<rect x="28" y="48" width="184" height="134" rx="12" fill="${p.lid}"/>${cells.join("")}`;
    },

    // Caixa para Relógio Classic: tampa sacada + almofada
    "IN-606": (p) => `
      ${shadow}
      <g transform="rotate(-9 120 52)">
        <rect x="52" y="30" width="136" height="40" rx="10" fill="${p.body}" stroke="${O}" stroke-width="5"/>
        <rect x="64" y="40" width="112" height="6" rx="3" fill="${p.detail}" opacity=".6"/>
      </g>
      <rect x="46" y="104" width="148" height="74" rx="12" fill="${p.body}" stroke="${O}" stroke-width="5"/>
      <rect x="108" y="74" width="24" height="56" rx="5" fill="${p.lid}"/>
      <rect x="72" y="92" width="96" height="30" rx="15" fill="#FFFFFF" stroke="${O}" stroke-width="5"/>
      <circle cx="120" cy="96" r="20" fill="#FFFFFF" stroke="${O}" stroke-width="5"/>
      <path d="M120 96 L120 84 M120 96 L129 101" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`,

    // Estojo Flip Premium: tampa articulada + berço
    "IN-707": (p) => `
      ${shadow}
      <rect x="40" y="36" width="160" height="70" rx="12" fill="${p.body}" stroke="${O}" stroke-width="5"/>
      <rect x="54" y="50" width="132" height="44" rx="7" fill="${p.lid}"/>
      <rect x="40" y="104" width="160" height="10" rx="3" fill="${p.lid}"/>
      <rect x="40" y="112" width="160" height="66" rx="12" fill="${p.body}" stroke="${O}" stroke-width="5"/>
      <rect x="66" y="118" width="108" height="30" rx="15" fill="${p.lid}"/>
      <circle cx="120" cy="128" r="17" fill="#FFFFFF" stroke="${O}" stroke-width="5"/>
      <path d="M120 128 L120 118 M120 128 L127 132" stroke="${O}" stroke-width="3" stroke-linecap="round"/>
      <rect x="106" y="160" width="28" height="6" rx="3" fill="${p.detail}" opacity=".8"/>`,

    // Expositor C Cristal: suporte transparente em C
    "IN-808": (p) => `
      ${shadow}
      <rect x="64" y="166" width="112" height="14" rx="5" fill="${p.body}" stroke="${O}" stroke-width="4"/>
      <path d="M156 52 A56 56 0 1 0 156 160" fill="none" stroke="${O}" stroke-width="30" stroke-linecap="round"/>
      <path d="M156 52 A56 56 0 1 0 156 160" fill="none" stroke="${p.body}" stroke-width="20" stroke-linecap="round"/>
      <path d="M150 60 A46 46 0 0 0 82 82" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".9"/>
      <circle cx="66" cy="106" r="20" fill="#FFFFFF" stroke="${O}" stroke-width="5"/>
      <path d="M66 106 L66 95 M66 106 L74 110" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`
  };

  function has(ref) {
    return Boolean(drawings[ref]);
  }

  function variants(ref) {
    return variantsByRef[ref] || defaultVariants;
  }

  /** SVG completo de um produto numa variação de cor. */
  function draw(ref, variant, className = "media-illustration") {
    const fn = drawings[ref];
    if (!fn) return "";
    const p = palettes[variant || variants(ref)[0]] || palettes.laranja;
    return `<svg class="${className}" viewBox="0 0 240 200" aria-hidden="true" focusable="false">${fn(p)}</svg>`;
  }

  window.InjetIllustrations = { has, draw, variants, palettes };
})();
