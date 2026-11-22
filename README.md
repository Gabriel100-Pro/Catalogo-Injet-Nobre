# Injet Nobre: site institucional e catálogo

Site estático feito com HTML, CSS e JavaScript puros. Não tem build nem dependências: é só abrir o `index.html`.

## Estrutura

```
index.html                Página inicial: hero 3D → produtos → monte sua vitrine → atacado → contato
sobre.html                Sobre a fábrica (texto, números e fotos da produção)
guardados/                Seções que saíram da página inicial (HTML guardado para reaproveitar)
css/styles.css            Estilos (mobile first, organizados por seção)
js/products.js            DADOS: contatos + produtos  ← edite aqui
js/render.js              Templates HTML (card, hero, vitrine, vitrine de linha, modal)
js/main.js                Comportamento (menu, filtro, vitrine/carrossel, seletores, modal, kit)
js/quote.js               Orçamento de atacado (cor + quantidade → WhatsApp)
js/animations.js          Animações com GSAP + ScrollTrigger
js/catalog.js             Grade de produtos: cores do estojo, interruptores do acrílico, filtros com Flip, card 3D, voo até o orçamento
js/experience.js          Abertura do estojo, cursor, confete, aviso e agradecimento
js/hero3d.js              Hero 3D: variações, tampa, relógio, orçamento e carregamento
js/hero3d-scene.js        Cena da hero (módulo ES, Three.js r160 + relógio .glb)
js/vitrine-builder.js     "Monte sua vitrine": prateleiras, lista, WhatsApp e imagem PNG
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

## Página inicial (curta)

Ordem: **hero 3D → produtos → monte sua vitrine → atacado → contato/footer**.

- **Produtos:** o estojo é um card com 6 bolinhas de cor e a caixa de acrílico um card com "Espuma | Almofada" e "Redonda | Quadrada"; os expositores têm um card cada (5 cards, 13 variações). Animações em `js/catalog.js` (GSAP + ScrollTrigger + Flip; tudo estático com "reduzir movimento"). Grade compacta com todos os produtos ativos (card de `R.compactCardHTML` em `js/render.js`: foto, nome, preço por unidade e "+ Orçamento"). Filtros em pílulas (Todos · Estojos · Acrílico · Expositores). 2 por linha no celular, 3 no tablet, 4 no computador. Os atalhos do menu filtram a grade (`data-filter-link`); de outra página use `index.html?linha=estojos#produtos`.
- **Atacado:** faixa curta com WhatsApp, "Montar orçamento" e a linha do kit vitrine (leva para "Monte sua vitrine").
- **Sobre a fábrica** fica em `sobre.html` (mesmo header, menu, barra inferior e footer; foi gerada a partir do `index.html`, então mudanças no header/footer precisam ir para as duas páginas).
- Barra inferior do celular: Produtos · Vitrine · Orçamento · Atacado · WhatsApp. "Sobre" e "Contato" ficam no menu ☰.
- **Seções guardadas:** `guardados/secoes-antigas.html` tem o HTML da vitrine horizontal, dos destaques em tela cheia por linha (com os cards grandes), do kit vitrine grande e do atacado grande. O CSS e o JS delas continuam no projeto: basta colar o bloco de volta no `index.html` (instruções no topo do arquivo).

Os itens abaixo sobre vitrine, vitrine de linha e kit descrevem essas seções guardadas.

## Seções e animações

- **Hero:** painel laranja desliza da esquerda, título linha por linha com a tarja preta "pintando", estojo preto entra girando e as outras 4 cores abrem em leque. O leque fecha ao rolar.
- **Vitrine (8 slides):** no desktop, a seção fica presa e os produtos passam para o lado. O painel de cor alterna de lado e a cor muda com transição suave (camadas com opacidade). No celular (e com movimento reduzido) vira carrossel deslizável com a mesma troca de cor.
- **Vitrine de linha:** Estojos (bolinhas de cor) e Expositores (Cristal / Preto / Brinco + miniaturas). A palavra gigante corre na horizontal ao rolar.
- **Grade:** cards entram em cascata. Ao passar o mouse, a foto gira e aumenta e o card ganha sombra laranja.
- **Atacado:** título entram com desfoque que vira nitidez.
- `js/animations.js` usa GSAP 3.12.5 + ScrollTrigger via CDN e anima só `transform`, `opacity` e `filter`. Com "reduzir movimento" ativado, o site fica estático (com o leque aberto). Se o CDN falhar, o site funciona sem animação.
- `js/experience.js`: abertura com o estojo (só na primeira visita da sessão, chave `injet-intro-v1` no sessionStorage, máx. 2,5 s, botão "Pular" ou Esc), cursor próprio e botões magnéticos (só mouse), chuva de quadradinhos + aviso ao adicionar ao orçamento (vibração curta no celular) e tela de agradecimento ao enviar pelo WhatsApp. Com "reduzir movimento": sem abertura, cursor, magnetismo nem confete.
- `js/hero3d.js` + `js/hero3d-scene.js`: hero 3D em tela cheia (base: `prototipos/hero-3d-injet-nobre.html`, fora do git). Setas, bolinhas e teclado (←/→) trocam a variação; seletor Estojo/Acrílico; tampa e "Tirar/Guardar relógio"; "Orçamento" usa o `[data-quote-add]` do catálogo. Preços e refs vêm de `js/products.js`. O Three.js 0.160.0 vem do mapa de imports no `<head>`; a cena só anima depois da abertura do site. O relógio `assets/relogio.glb` (GLTFLoader, ~3,4 MB) só é baixado depois que a caixa caiu e abriu a tampa; o botão fica desativado até lá e some se o modelo não carregar. O shader do relógio troca mostrador e metal conforme a cor (tabelas `ESTOJO` / `ACRILICO` em `js/hero3d.js`). Sem WebGL aparece a foto real. Mantém "Sou lojista" (vai para #atacado), "Baixar catálogo (PDF)" e a seta "role para ver mais".
- `js/vitrine-builder.js`: seção "Monte sua vitrine" (depois do kit vitrine). Balcão com 3 prateleiras de 4 lugares; arrastar com o mouse, tocar no produto e depois na prateleira no celular, ou teclado (Enter escolhe, setas ↑/↓ escolhem a prateleira, Enter coloca; num item: setas movem, Delete tira). Cada produto entra com 10 unidades (constante `DEFAULT_QTY`). "Enviar esta vitrine" abre o WhatsApp de `SITE_CONFIG.whatsapp` com a lista e também adiciona tudo ao orçamento. "Baixar imagem" gera um PNG 1600×1000 em canvas. A vitrine fica salva no navegador (`injet-vitrine-v1`).
- Eventos para analytics: `injet:filter`, `injet:modal-open`, `injet:modal-change`, `injet:vitrine`, `injet:line-change`, `injet:quote-add`, `injet:quote-change`.
