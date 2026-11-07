# Injet Nobre: site institucional e catálogo

Site estático feito com HTML, CSS e JavaScript puros. Não tem build nem dependências: é só abrir o `index.html`.

## Estrutura

```
index.html            Página única (estrutura e textos fixos)
css/styles.css        Estilos (mobile first, organizados por seção)
js/products.js        DADOS: contatos + lista de produtos  ← edite aqui
js/illustrations.js   Desenhos provisórios dos produtos (usados enquanto não há foto)
js/render.js          Templates HTML (card, vitrine, destaques, modal, ofertas)
js/main.js            Comportamento (menu, filtro, vitrine/carrossel, modal, imagens)
js/animations.js      Animações com GSAP + ScrollTrigger
assets/favicon.svg    Ícone da aba
assets/og-image.jpg   Imagem de compartilhamento (1200×630), provisória
assets/produtos/      Fotos dos produtos
```

## Como editar os produtos

Abra `js/products.js`.

**Contatos:** edite o bloco `SITE_CONFIG`:

```js
whatsapp: "5511987654321",   // só números: 55 + DDD + número
telefone: "(11) 98765-4321",
email: "contato@injetnobre.com.br",
instagram: "https://instagram.com/injetnobre",
facebook: "https://facebook.com/injetnobre",
```

**Produtos:** cada item de `PRODUCTS` segue este modelo:

```js
{
  ref: "IN-909",
  numero: "09",
  nome: "Nome do Produto",
  linha: "utilidades",            // ou "relojoaria"
  descricao: "Texto curto.",
  caracteristicas: [
    { rotulo: "Material", valor: "Polipropileno" }
  ],
  precoAntigo: 39.90,             // ponto como separador decimal; null se não houver
  preco: 29.90,
  destaque: false,                // true = aparece no topo (use em só um)
  destaqueLinha: false            // true = produto grande na abertura da linha (um por linha)
},
```

- O desconto do selo é calculado sozinho a partir dos dois preços.
- A faixa "Ofertas do mês" mostra automaticamente os 3 maiores descontos.
- O card mostra as 2 primeiras características e o modal mostra todas.
- Para remover um produto, apague o bloco `{ ... },` dele.

**Fotos:** salve em `assets/produtos/` com o nome da referência em minúsculas: `IN-606` vira `in-606.jpg`. Para usar outro nome ou formato (por exemplo `.png` ou `.webp`), adicione `imagem: "assets/produtos/meu-arquivo.png"` ao produto. O ideal é usar fundo transparente (PNG/WebP), proporção 4:3 e uns 1200 px de largura. Assim o produto "flutua" sobre os blocos de cor da vitrine.

- Enquanto não há foto, o site mostra uma **ilustração provisória** do produto (`js/illustrations.js`). Produtos novos sem desenho mostram um quadro cinza com o nome.
- **Miniaturas do modal:** liste as fotos no campo `imagens`. Sem fotos, as miniaturas mostram variações de cor da ilustração, só como demonstração.

```js
imagens: ["assets/produtos/in-101.jpg", "assets/produtos/in-101-2.jpg", "assets/produtos/in-101-3.jpg"]
```

## Outros ajustes

- **QR code:** troque o `div.qr-placeholder` no rodapé do `index.html` por `<img src="assets/qrcode.png" alt="QR code para o WhatsApp da Injet Nobre">`.
- **Imagem de compartilhamento:** troque `assets/og-image.jpg` por uma arte final de 1200×630 px.
- **Domínio:** no `<head>` do `index.html`, troque `https://www.injetnobre.com.br/` (em `canonical`, `og:url` e `og:image`) pelo endereço real.
- **Cores e fontes:** ficam nas variáveis do início de `css/styles.css` (`--orange`, `--black` etc.).

## Testar localmente

Dá para abrir o `index.html` direto no navegador. Se preferir um servidor local:

```bash
npx serve .
# ou
python -m http.server 8000
```

## Deploy

### Netlify
1. Acesse https://app.netlify.com/drop e arraste a pasta do projeto, **ou**
2. Coloque o projeto no GitHub e, na Netlify, use *Add new site → Import from Git*. Deixe o *Build command* vazio e use `.` como *Publish directory*.

### Vercel
1. Coloque o projeto no GitHub.
2. Na Vercel, use *Add New → Project*, importe o repositório, escolha o *Framework Preset* **Other** e deixe o build vazio.
3. Ou, pelo terminal: `npx vercel` na pasta do projeto.

Nos dois casos, cada alteração enviada ao GitHub publica o site de novo automaticamente.

## Vitrine e animações

- **Vitrine:** no desktop, ao rolar a página os produtos passam para o lado, um por vez (rolagem horizontal presa). No celular, e para quem desativou animações, ela vira um carrossel deslizável. O indicador `01 / 08`, a barra de progresso e as setas funcionam nos dois modos.
- **Destaques de linha:** cada linha abre com uma tela cheia. O produto que aparece ali é o marcado com `destaqueLinha: true`.
- **Modal:** imagem grande com zoom ao passar o mouse, miniaturas e setas (ou ← → do teclado) para ir ao produto anterior ou ao próximo.
- **Animações** (`js/animations.js`): usam GSAP 3.12.5 + ScrollTrigger via CDN e só mexem em `transform` e `opacity`. As durações vão até 0,8 s.
  - Quem ativou "reduzir movimento" no sistema vê o site estático.
  - Se o CDN não carregar, o site continua funcionando, só que sem animação.

## Próximas etapas (preparado para)

- Cada recurso em `main.js` e `animations.js` é uma função isolada.
- O site dispara eventos que dá para escutar com `document.addEventListener(...)`, por exemplo para analytics: `injet:filter`, `injet:modal-open`, `injet:modal-change`, `injet:gallery-change` e `injet:vitrine`.
