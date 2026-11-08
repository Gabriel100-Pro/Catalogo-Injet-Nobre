# Injet Nobre: site institucional e catálogo

Site estático feito com HTML, CSS e JavaScript puros. Não tem build nem dependências: é só abrir o `index.html`.

## Estrutura

```
index.html                Página única (estrutura e textos fixos)
css/styles.css            Estilos (mobile first, organizados por seção)
js/products.js            DADOS: contatos + produtos  ← edite aqui
js/render.js              Templates HTML (card, hero, vitrine, vitrine de linha, modal, ofertas)
js/main.js                Comportamento (menu, filtro, vitrine/carrossel, seletores, modal, kit)
js/quote.js               Orçamento de atacado (cor + quantidade → WhatsApp)
js/animations.js          Animações com GSAP + ScrollTrigger
tools/otimizar-imagens.py Gera as fotos otimizadas (WebP + PNG) em assets/produtos/
assets/*.png              Fotos originais dos produtos (fundo transparente)
```

## Como editar os produtos

Abra `js/products.js`. **Cada cor é um produto** (e um slide da vitrine). O bloco no topo do arquivo explica todos os campos. Os principais são:

```js
{ ...ESTOJO, ref: "IN-E04", numero: "04", variante: "Azul", ativo: true,
  imagem: "estojo-relogio-azul", cor: "#2F8FE0", painel: "#2F8FE0", contorno: "light" }
```

- `nome` + `variante` formam a linha do orçamento: `• Estojo para relógio – Azul – 50 un.`
- `painel` é a cor do painel na vitrine, na vitrine de linha e no modal. `contorno` define a cor do número vazado (`light`, `dark` ou `orange`), e `efeito` pode ser `glow` (brilho laranja) ou `spot` (holofote).
- `linha` (`estojos` ou `expositores`) define a seção e o filtro. `grupo` junta as cores do mesmo item ("Outras cores" no modal e o leque do hero).
- `ativo: false` esconde o produto. Os produtos fictícios de utilidades continuam no arquivo, ocultos.
- **Preços e referências são provisórios** (PLACEHOLDER): troque pelos reais.
- O selo de % OFF é calculado a partir dos dois preços. "Ofertas do mês" mostra os 3 maiores descontos, um por produto.

## Fotos

1. Salve o PNG **com fundo transparente** em `assets/`, com nome em kebab-case, sem espaços nem acentos, começando com `estojo-` ou `suporte-`.
2. Rode `python tools/otimizar-imagens.py` (precisa do Pillow: `pip install pillow`). O script recorta, centraliza e padroniza o tamanho e gera `-600.webp`, `-1000.webp` e `.png` em `assets/produtos/`.
3. Use o nome-base (sem extensão) no campo `imagem`.

A sombra é feita no CSS (`drop-shadow`). Fora do hero, as fotos carregam em modo *lazy*.

**Foto com fundo:** com `imagemComFundo: true`, o site mostra "Foto em breve" no lugar da foto. É o caso atual do suporte para brinco.

**Relógio no kit:** para mostrar um relógio na composição "Monte seu kit vitrine", salve a foto (PNG transparente) e preencha `SITE_CONFIG.fotoRelogioKit`.

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

## Seções e animações

- **Hero:** painel laranja desliza da esquerda, título linha por linha com a tarja preta "pintando", estojo preto entra girando e as outras 4 cores abrem em leque. O leque fecha ao rolar.
- **Vitrine (8 slides):** no desktop, a seção fica presa e os produtos passam para o lado. O painel de cor alterna de lado e a cor muda com transição suave (camadas com opacidade). No celular (e com movimento reduzido) vira carrossel deslizável com a mesma troca de cor.
- **Vitrine de linha:** Estojos (bolinhas de cor) e Expositores (Cristal / Preto / Brinco + miniaturas). A palavra gigante corre na horizontal ao rolar.
- **Grade:** cards entram em cascata. Ao passar o mouse, a foto gira e aumenta e o card ganha sombra laranja.
- **Ofertas e atacado:** títulos entram com desfoque que vira nitidez.
- `js/animations.js` usa GSAP 3.12.5 + ScrollTrigger via CDN e anima só `transform`, `opacity` e `filter`. Com "reduzir movimento" ativado, o site fica estático (com o leque aberto). Se o CDN falhar, o site funciona sem animação.
- Eventos para analytics: `injet:filter`, `injet:modal-open`, `injet:modal-change`, `injet:vitrine`, `injet:line-change`, `injet:quote-add`, `injet:quote-change`.
