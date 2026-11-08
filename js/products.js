/* ==========================================================================
   INJET NOBRE – DADOS DO SITE
   Edite este arquivo para trocar contatos e produtos. Não precisa mexer
   em mais nada. Veja o README.md para instruções detalhadas.
   ========================================================================== */

window.SITE_CONFIG = {
  // Somente números, com DDI 55 + DDD. Ex.: "5511987654321"
  whatsapp: "5511900000000",
  telefone: "(11) 0000-0000",
  email: "contato@injetnobre.com.br",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  // Mensagem usada no botão "Falar com a equipe" (atacado)
  mensagemAtacado: "Olá! Sou lojista e quero saber das condições de atacado da Injet Nobre.",

  // Foto de um relógio (PNG com fundo transparente) para a composição "Monte seu kit vitrine".
  // Ex.: "assets/kit-relogio.png". Vazio = a composição mostra só estojo + suporte.
  fotoRelogioKit: "",

  // Catálogo em PDF (coloque o arquivo neste caminho)
  catalogoPdf: "assets/catalogo-injet-nobre.pdf",

  // ---- SOBRE A FÁBRICA ----
  // PLACEHOLDERS: troque pelos números reais. "valor" precisa ser um número.
  numerosFabrica: [
    { valor: 20,  sufixo: "+",    rotulo: "anos de mercado" },
    { valor: 500, sufixo: " mil", rotulo: "peças produzidas por mês" },
    { valor: 300, sufixo: "+",    rotulo: "lojistas atendidos" },
    { valor: 100, sufixo: "%",    rotulo: "produção própria" }
  ],

  // Fotos da produção (coloque os arquivos em assets/fabrica/).
  // A primeira aparece maior. Sem o arquivo, aparece um quadro provisório.
  fotosFabrica: [
    { src: "assets/fabrica/fabrica-1.jpg", legenda: "Injetoras em operação" },
    { src: "assets/fabrica/fabrica-2.jpg", legenda: "Moldes de precisão" },
    { src: "assets/fabrica/fabrica-3.jpg", legenda: "Controle de qualidade" },
    { src: "assets/fabrica/fabrica-4.jpg", legenda: "Matéria-prima selecionada" },
    { src: "assets/fabrica/fabrica-5.jpg", legenda: "Expedição para lojistas" }
  ]
};

/*
  Campos de cada produto (cada variação de cor é um produto = um slide da vitrine):
  - ref .............. referência (ex.: "IN-E01")
  - ativo ............ false = oculto no site e no orçamento
  - numero ........... número do slide e do card ("01", "02"...)
  - nome ............. nome do produto ("Estojo para relógio")
  - variante ......... cor/versão ("Preto"). Vai junto do nome no orçamento:
                       "Estojo para relógio – Preto – 50 un."
  - grupo ............ produtos com o mesmo grupo são cores do mesmo item
                       (aparecem como "Outras cores" no modal)
  - linha ............ "estojos" ou "expositores" (seção e filtro)
  - rotuloLinha ...... texto pequeno acima do nome ("Linha relojoaria")
  - descricao ........ texto curto
  - caracteristicas .. lista de { rotulo, valor } exibida na tabelinha
  - precoAntigo ...... preço "de" (ponto como decimal: 18.90). null se não houver.
  - preco ............ preço "por"
  - imagem ........... nome-base da foto em assets/produtos/ (sem extensão).
                       O site usa <imagem>-600.webp, <imagem>-1000.webp e <imagem>.png.
                       Gere com: python tools/otimizar-imagens.py
  - imagemComFundo ... true = a foto ainda tem fundo; o site mostra "Foto em breve"
  - cor .............. cor da bolinha do seletor
  - painel ........... cor do painel da vitrine e do fundo da vitrine de linha
  - contorno ......... cor do número gigante vazado: "light" (branco), "dark" (preto) ou "orange"
  - tema ............. "dark" = texto escuro sobre o painel (fundos claros, ex. amarelo)
  - efeito ........... (opcional) "glow" = brilho laranja radial; "spot" = holofote de cima
  - destaque ......... true = produto do hero (use em apenas um)
  - destaqueLinha .... true = produto que abre a vitrine da sua linha (um por linha)
  - legenda .......... (opcional) nome curto do botão do seletor ("Cristal")
*/

// PLACEHOLDERS: referências, preços e características abaixo são provisórios.
// Troque pelos valores reais antes de publicar.
const ESTOJO = {
  nome: "Estojo para relógio",
  grupo: "estojo-relogio",
  linha: "estojos",
  rotuloLinha: "Linha relojoaria",
  descricao: "Caixa com tampa de encaixe e almofada interna para apresentar e proteger o relógio.",
  caracteristicas: [
    { rotulo: "Tampa", valor: "De encaixe, removível" },
    { rotulo: "Interno", valor: "Almofada para relógio" },
    { rotulo: "Cores", valor: "Preto, branco, amarelo, azul e rosa" }
  ],
  precoAntigo: 18.90,
  preco: 14.90
};

const SUPORTE = {
  nome: "Suporte para relógio de acrílico",
  grupo: "suporte-relogio",
  linha: "expositores",
  rotuloLinha: "Linha relojoaria",
  descricao: "Expositor em C que mantém o relógio fechado e em pé, com o mostrador virado para o cliente.",
  caracteristicas: [
    { rotulo: "Material", valor: "Acrílico" },
    { rotulo: "Formato", valor: "C, com base" },
    { rotulo: "Uso", valor: "Vitrine e balcão" }
  ],
  precoAntigo: 6.90,
  preco: 4.90
};

window.PRODUCTS = [
  // ---------------- ESTOJOS PARA RELÓGIO ----------------
  { ...ESTOJO, ref: "IN-E01", numero: "01", variante: "Preto", ativo: true,
    imagem: "estojo-relogio-preto", cor: "#1E1E1E", painel: "#FF6A13", contorno: "light",
    destaque: true, destaqueLinha: true },
  { ...ESTOJO, ref: "IN-E02", numero: "02", variante: "Branco", ativo: true,
    imagem: "estojo-relogio-branco", cor: "#F4F4F4", painel: "#111111", contorno: "orange" },
  { ...ESTOJO, ref: "IN-E03", numero: "03", variante: "Amarelo", ativo: true,
    imagem: "estojo-relogio-amarelo", cor: "#F5C518", painel: "#F5C518", contorno: "dark", tema: "dark" },
  { ...ESTOJO, ref: "IN-E04", numero: "04", variante: "Azul", ativo: true,
    imagem: "estojo-relogio-azul", cor: "#2F8FE0", painel: "#2F8FE0", contorno: "light" },
  { ...ESTOJO, ref: "IN-E05", numero: "05", variante: "Rosa", ativo: true,
    imagem: "estojo-relogio-rosa", cor: "#E8338A", painel: "#E8338A", contorno: "light" },

  // ---------------- EXPOSITORES ----------------
  { ...SUPORTE, ref: "IN-S01", numero: "06", variante: "Transparente", legenda: "Cristal", ativo: true,
    imagem: "suporte-relogio-acrilico-transparente", cor: "#DDE6EE", painel: "#111111", contorno: "orange",
    efeito: "glow", destaqueLinha: true },
  { ...SUPORTE, ref: "IN-S02", numero: "07", variante: "Preto", legenda: "Preto", ativo: true,
    imagem: "suporte-relogio-acrilico-preto", cor: "#1E1E1E", painel: "#FF6A13", contorno: "light" },
  {
    ref: "IN-B01", numero: "08", nome: "Suporte para brinco", variante: "Transparente", legenda: "Brinco",
    ativo: true,
    grupo: "suporte-brinco",
    linha: "expositores",
    rotuloLinha: "Joias e bijuterias",
    descricao: "Placa em acrílico transparente com base em L para expor um par de brincos no balcão ou na vitrine.",
    caracteristicas: [
      { rotulo: "Material", valor: "Acrílico transparente" },
      { rotulo: "Base", valor: "Em L, inclinada" },
      { rotulo: "Capacidade", valor: "1 par" }
    ],
    precoAntigo: 9.90,
    preco: 6.90,
    imagem: "suporte-brinco-transparente",
    // A foto atual ainda tem o fundo claro dentro da placa de acrílico.
    // Troque o PNG em assets/, rode tools/otimizar-imagens.py e mude para false.
    imagemComFundo: true,
    cor: "#E9EEF2", painel: "#111111", contorno: "orange", efeito: "spot"
  },

  // ---------------- PRODUTOS FICTÍCIOS (ocultos) ----------------
  // Mantidos só como exemplo de cadastro. Com "ativo: false" não aparecem no site.
  // ---------------- LINHA UTILIDADES ----------------
  {
    ref: "IN-101",
    ativo: false,
    numero: "01",
    nome: "Caixa Stack Pro 12 L",
    linha: "utilidades",
    descricao: "Caixa empilhável com tampa de travas laterais. Organiza e protege sem ocupar espaço.",
    caracteristicas: [
      { rotulo: "Capacidade", valor: "12 litros" },
      { rotulo: "Tampa", valor: "Com travas laterais" },
      { rotulo: "Uso", valor: "Empilhável" }
    ],
    precoAntigo: 89.90,
    preco: 69.90,
    destaque: false
  },
  {
    ref: "IN-202",
    ativo: false,
    numero: "02",
    nome: "Pote Lock Fresh 1,2 L",
    linha: "utilidades",
    descricao: "Pote hermético com fechamento de 4 travas. Vai ao micro-ondas e ao freezer.",
    caracteristicas: [
      { rotulo: "Capacidade", valor: "1,2 litro" },
      { rotulo: "Fecho", valor: "4 travas herméticas" },
      { rotulo: "BPA", valor: "Livre de BPA" },
      { rotulo: "Uso", valor: "Micro-ondas e freezer" }
    ],
    precoAntigo: 32.90,
    preco: 24.90
  },
  {
    ref: "IN-303",
    ativo: false,
    numero: "03",
    nome: "Balde Flex 20 L",
    linha: "utilidades",
    descricao: "Alça reforçada com pega ergonômica e graduação interna de volume. Ideal para limpeza e obra.",
    caracteristicas: [
      { rotulo: "Capacidade", valor: "20 litros" },
      { rotulo: "Alça", valor: "Reforçada" },
      { rotulo: "Medida", valor: "Graduação interna" }
    ],
    precoAntigo: 49.90,
    preco: 39.90
  },
  {
    ref: "IN-404",
    ativo: false,
    numero: "04",
    nome: "Banqueta Fold Up",
    linha: "utilidades",
    descricao: "Banqueta dobrável com pés antiderrapantes. Fechada, cabe em qualquer canto.",
    caracteristicas: [
      { rotulo: "Altura", valor: "45 cm" },
      { rotulo: "Fechada", valor: "6 cm" },
      { rotulo: "Base", valor: "Antiderrapante" }
    ],
    precoAntigo: 79.90,
    preco: 59.90
  },
  {
    ref: "IN-505",
    ativo: false,
    numero: "05",
    nome: "Organizador Grid Set",
    linha: "utilidades",
    descricao: "Kit com 6 módulos encaixáveis para gavetas, armários e bancadas. Montagem sem ferramentas.",
    caracteristicas: [
      { rotulo: "Módulos", valor: "6 peças" },
      { rotulo: "Encaixe", valor: "Sem ferramentas" }
    ],
    precoAntigo: 59.90,
    preco: 44.90
  },

  // ---------------- LINHA RELOJOARIA ----------------
  {
    ref: "IN-606",
    ativo: false,
    numero: "06",
    nome: "Caixa para Relógio Classic",
    linha: "relojoaria",
    descricao: "Caixa com tampa sacada e almofada removível. Acabamento preto fosco.",
    caracteristicas: [
      { rotulo: "Tampa", valor: "Sacada" },
      { rotulo: "Interno", valor: "Almofada removível" },
      { rotulo: "Cor", valor: "Preto fosco" }
    ],
    precoAntigo: 18.90,
    preco: 14.90
  },
  {
    ref: "IN-707",
    ativo: false,
    numero: "07",
    nome: "Estojo Flip Premium",
    linha: "relojoaria",
    descricao: "Estojo com tampa articulada e berço interno para apresentação do relógio.",
    caracteristicas: [
      { rotulo: "Tampa", valor: "Articulada" },
      { rotulo: "Interno", valor: "Berço" }
    ],
    precoAntigo: 29.90,
    preco: 22.90
  },
  {
    ref: "IN-808",
    ativo: false,
    numero: "08",
    nome: "Expositor C Cristal",
    linha: "relojoaria",
    descricao: "Suporte transparente em formato C para exibir relógios e pulseiras na vitrine.",
    caracteristicas: [
      { rotulo: "Formato", valor: "C" },
      { rotulo: "Cor", valor: "Cristal" },
      { rotulo: "Uso", valor: "Vitrine" }
    ],
    precoAntigo: 6.90,
    preco: 4.90
  }
];
