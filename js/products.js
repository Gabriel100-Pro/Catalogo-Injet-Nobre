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
  Campos de cada produto:
  - ref .............. referência (ex.: "IN-101"). A foto deve se chamar ref em minúsculas: assets/produtos/in-101.jpg
  - numero ........... número exibido no card ("01", "02"...)
  - nome ............. nome do produto
  - linha ............ "utilidades" ou "relojoaria"
  - descricao ........ texto curto
  - caracteristicas .. lista de { rotulo, valor } exibida na tabelinha
  - precoAntigo ...... preço "de" (use ponto como decimal: 89.90). Use null se não houver.
  - preco ............ preço "por"
  - imagem ........... (opcional) caminho da foto principal. Se omitido, usa assets/produtos/<ref>.jpg
  - imagens .......... (opcional) lista de fotos para as miniaturas do modal.
                       Ex.: ["assets/produtos/in-101.jpg", "assets/produtos/in-101-2.jpg"]
  - destaque ......... (opcional) true = aparece no topo do site (use em apenas um produto)
  - destaqueLinha .... (opcional) true = produto grande na abertura da sua linha (um por linha)
*/
window.PRODUCTS = [
  // ---------------- LINHA UTILIDADES ----------------
  {
    ref: "IN-101",
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
    destaque: true
  },
  {
    ref: "IN-202",
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
    preco: 24.90,
    destaqueLinha: true
  },
  {
    ref: "IN-303",
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
    numero: "07",
    nome: "Estojo Flip Premium",
    linha: "relojoaria",
    descricao: "Estojo com tampa articulada e berço interno para apresentação do relógio.",
    caracteristicas: [
      { rotulo: "Tampa", valor: "Articulada" },
      { rotulo: "Interno", valor: "Berço" }
    ],
    precoAntigo: 29.90,
    preco: 22.90,
    destaqueLinha: true
  },
  {
    ref: "IN-808",
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
