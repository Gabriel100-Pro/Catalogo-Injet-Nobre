# Injet Nobre: site institucional e catálogo

Site estático feito com HTML, CSS e JavaScript puros. Não tem build nem dependências: é só abrir o `index.html`.

## Estrutura

```
index.html                Página única (estrutura e textos fixos)
css/styles.css            Estilos (mobile first, organizados por seção)
js/products.js            DADOS: contatos + produtos  ← edite aqui
js/render.js              Templates HTML (card, hero, vitrine, vitrine de linha, modal)
js/main.js                Comportamento (menu, filtro, vitrine/carrossel, seletores, modal, kit)
js/quote.js               Orçamento de atacado (cor + quantidade → WhatsApp)
js/animations.js          Animações com GSAP + ScrollTrigger
js/experience.js          Abertura do estojo, cursor, confete, aviso e agradecimento
js/try3d.js               "Experimente em 3D": interface, orçamento e carregamento sob demanda
js/try3d-scene.js         Cena 3D (módulo ES com Three.js r160)
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
- `linha` (`estojos`, `expositores` ou `acrilicos`) define a seção e o filtro. `grupo` junta as cores do mesmo item ("Outras cores" no modal e o leque do hero).
- `ativo: false` esconde o produto. Os produtos fictícios de utilidades continuam no arquivo, ocultos.
- `preco` é o preço por unidade (estojo R$ 2,50, suporte para relógio R$ 1,00, suporte para brinco R$ 2,00, caixa de acrílico R$ 1,90 com espuma / R$ 2,30 com almofada). O orçamento calcula preço × quantidade e envia o total no WhatsApp.
- Caixas de acrílico: cada combinação de `formato` + `interior` é um produto (função `caixa()` em `js/products.js`). A vitrine de linha mostra dois seletores; trocar o formato gira a foto, trocar o interior só troca a foto e o preço.
- As fotos originais com fundo preto ficam em `assets/originais/`. As versões em `assets/` já estão sem fundo.
- **Referências são provisórias** (PLACEHOLDER): troque pelas reais.

## Fotos

1. Salve o PNG **com fundo transparente** em `assets/`, com nome em kebab-case, sem espaços nem acentos, começando com `estojo-`, `suporte-` ou `caixa-`.
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
- **Atacado:** título entram com desfoque que vira nitidez.
- `js/animations.js` usa GSAP 3.12.5 + ScrollTrigger via CDN e anima só `transform`, `opacity` e `filter`. Com "reduzir movimento" ativado, o site fica estático (com o leque aberto). Se o CDN falhar, o site funciona sem animação.
- `js/experience.js`: abertura com o estojo (só na primeira visita da sessão, chave `injet-intro-v1` no sessionStorage, máx. 2,5 s, botão "Pular" ou Esc), cursor próprio e botões magnéticos (só mouse), chuva de quadradinhos + aviso ao adicionar ao orçamento (vibração curta no celular) e tela de agradecimento ao enviar pelo WhatsApp. Com "reduzir movimento": sem abertura, cursor, magnetismo nem confete.
- `js/try3d.js` + `js/try3d-scene.js`: seção "Experimente em 3D" (logo após o hero). O Three.js 0.160.0 vem do mapa de imports no `<head>` e só é baixado quando a seção chega perto da tela, depois da abertura e do carregamento da página. Produtos, refs e preços vêm de `js/products.js`, e o botão usa o mesmo `[data-quote-add]` do catálogo. Sem WebGL, aparece a foto real. No celular: sem sombra projetada, resolução limitada a 1,5× e redução automática se os quadros ficarem lentos; a cena só é desenhada com a seção visível. O protótipo original fica em `prototipos/` (fora do git e do site).
- Eventos para analytics: `injet:filter`, `injet:modal-open`, `injet:modal-change`, `injet:vitrine`, `injet:line-change`, `injet:quote-add`, `injet:quote-change`.
