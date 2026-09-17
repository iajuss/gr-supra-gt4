# Design — Aston Martin Vulcan LP

Status: aprovado em 2026-09-17.

## Conceito

- Landing page **fan-made** do **Aston Martin Vulcan** (V12, só para pista, com aerofólio grande).
- Escolhido em vez do Vantage AMR Pro porque o Vulcan tem modelos 3D gratuitos em GLB (CC-BY) no Sketchfab.
- Conteúdo em inglês. Sem logos oficiais; aviso "Unofficial fan-made concept. Not affiliated with Aston Martin."
- Objetivo: peça de portfólio para divulgar no LinkedIn.

## Direção visual — Carbono + Lime AMR

| Token        | Valor     | Uso                          |
|--------------|-----------|------------------------------|
| `--bg`       | `#0A0B0A` | fundo carbono                |
| `--text`     | `#F2F2EE` | texto off-white              |
| `--accent`   | `#C6FF00` | lime Aston Martin Racing     |
| `--support`  | `#1F3D2B` | racing green escuro          |

- Títulos e números: **Big Shoulders Display** (variável 100–900; hero 900, títulos 800, números 700).
  Escolhida depois de comparar com Anton: mais técnica/industrial e mais legível nos números.
- Labels e telemetria: **JetBrains Mono** (variável).
- Texto corrido: fonte do sistema (`system-ui`), sem download extra.
- Fontes hospedadas no próprio site via `@fontsource-variable`. O navegador baixa só os subconjuntos usados.

## Estrutura da página

0. **Preloader** — `LOADING_TELEMETRY — NN%` com progresso real do modelo; abre revelando o hero.
1. **Hero** — Vulcan em 3/4 de frente, piso escuro reflexivo, "VULCAN" gigante,
   `// TRACK ONLY · V12 7.0 · 24 UNITS`, `SCROLL TO DRIVE ↓`.
2. **01 — AERO** — close da asa traseira e difusor.
3. **02 — CHASSIS** — dianteira, splitter, monocoque de carbono.
4. **03 — V12** — escapes laterais e motor.
5. **Transição** — câmera se afasta, carro escurece, render 3D pausa.
6. **THE LAP** — traçado real de Silverstone (GeoJSON `bacinger/f1-circuits`, MIT) em Canvas 2D, ponto lime
   percorrendo a volta + HUD (velocidade, marcha, setor, tempo). Inicia ao entrar na tela; botão `REPLAY`.
   Telemetria **simulada**, identificada como tal.
   - Velocidade derivada da curvatura do traçado (suavizado). Volta de ~1:45, animada em 12 s.
   - Largada na Hamilton Straight (atual). O GeoJSON começa na reta pré-2011, então o laço é reordenado.
   - **Modo full (desktop): pista 3D** (decidido em 2026-09-17, após protótipo em `sandbox/track3d`):
     - Palco em tela cheia (100% × 100vh) abaixo do título, com HUD (inferior esquerdo), minimapa 2D
       (inferior direito), botões de câmera e Replay (superior direito) sobrepostos.
     - Fita de asfalto com bordas cinza, zebras lime/brancas só em curvas fechadas, linha de largada,
       chão escuro com grid racing green, neblina e bloom.
     - Carro representado por um bloco lime brilhante com luz (carro procedural testado e rejeitado).
       Rastro fino verde-escuro, abaixo do limiar do bloom, para não ofuscar a câmera próxima.
     - Uma volta de 12 s ao entrar na tela (50% visível) → para na linha com o tempo final.
       O render pausa ao terminar e fora da tela.
     - Botão **Restart** sempre visível (substitui o Replay que só aparecia no fim): zera a volta e a
       câmera vai direto para a largada (aprovado no sandbox em 2026-09-17).
     - Câmeras Chase / Heli / Top em botões; começa na **Heli**. Minimapa visível em todas
       (antes sumia na Top; o usuário pediu o mapa também nela em 2026-09-17).
     - **Top mais clara** (a ~1 km a neblina apagava ~70% da cor e o carro e o rastro ficavam abaixo do bloom):
       só na Top, com transição suave, neblina desligada, bloco do carro 6× maior e rastro lime cheio de 6 m.
       Chase e Heli mantêm o rastro fino verde-escuro.
     - Three.js e pós-processamento carregados sob demanda, só no modo full.
     - Lógica pura separada da cena (2026-09-17): `lib/lapClock.js` (compartilhado com o 2D), `geometry.js`,
       `centreline.js`, `ribbon.js` e `cameraRigs.js`, sem Three.js. Valores do protótipo em `data/lapScene.js`.
       Coordenadas no chão do 3D (`{ x, z }`, y para cima); o `{ x, y }` do traçado só existe dentro do `centreline`.
     - O relógio soma o tempo entre quadros com limite de 0,05 s: aba em segundo plano ou fora da tela
       retoma a volta de onde parou, em vez de pular para o fim (vale para o 2D também).
     - Ajustes da verificação de 2026-09-17 (passo 6 do Bloco 2B):
       - Controles, Restart e legenda do palco começam abaixo do header fixo (`--header-h`, 3,75 rem):
         com o palco em tela cheia, a nav e os botões de câmera ocupavam a mesma faixa do topo.
       - `[hidden] { display: none !important }` no `base.css`: `.button` define `display`, então o
         atributo `hidden` não escondia o Restart no modo reduced-motion.
       - O resumo para leitor de tela é limpo no Restart (`hud.clear()` nos dois modos); antes ele
         mantinha o tempo da volta anterior enquanto a nova corria.
   - **Modo lite (mobile, reduced-motion, sem WebGL): canvas 2D** com contorno fantasma cinza + rastro lime.
     Pista girada 90° em telas largas (4:3) e em pé no mobile (3:4).
7. **SPECS** — contadores, barras comparativas, reveal tipográfico. Números verificados em fontes públicas.
8. **Footer** — aviso fan-made, crédito CC-BY do modelo 3D, crédito do traçado.

## Fontes dos números

Os valores exibidos ficam no `index.html` (atributo `data-count` na SPECS), que é a única fonte da verdade.
O JS só anima até esses valores. Conferido em 2026-09-17.

| Dado | Valor na página | Fontes |
|---|---|---|
| Motor | 7.0 L V12 aspirado (6.949 cc) | [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_Vulcan), [evo](https://www.evo.co.uk/features/15364/aston-martin-vulcan-preview-hear-its-800bhp-v12) |
| Potência | 820 hp @ 7,750 rpm (= 831 PS; oficial: "800-plus bhp") | [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_Vulcan), [Aston Martin Pressroom](https://media.astonmartin.com/vulcan/), [Motor1](https://www.motor1.com/news/53403/aston-martin-vulcan-unveiled-with-800-bhp/) |
| Torque | 780 Nm @ 6,500 rpm | [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_Vulcan) |
| Peso | ~1,350 kg (algumas fontes: 1,360) | [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_Vulcan) |
| Downforce | 1,300+ kg perto de 200 mph → 96% do peso | [evo](https://www.evo.co.uk/features/15364/aston-martin-vulcan-preview-hear-its-800bhp-v12) (Wikipedia: 1,362 kg na velocidade máxima) |
| Câmbio | Xtrac sequencial de 6 marchas (transaxle) | [evo](https://www.evo.co.uk/features/15364/aston-martin-vulcan-preview-hear-its-800bhp-v12), [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_Vulcan) |
| Freios | Brembo carbono-cerâmica, 380/360 mm | [evo](https://www.evo.co.uk/features/15364/aston-martin-vulcan-preview-hear-its-800bhp-v12), [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_Vulcan) |
| Chassi | Monocoque e carroceria de fibra de carbono (Multimatic) | [evo](https://www.evo.co.uk/features/15364/aston-martin-vulcan-preview-hear-its-800bhp-v12), [Stratstone](https://www.stratstone.com/blog/spotlight/aston-martin-vulcan/) |
| Escape | Saída lateral (Inconel e titânio) | [TopSpeed](https://www.topspeed.com/cars/aston-martin/2016-aston-martin-vulcan-ar167713.html) |
| Produção | 24 unidades (2015–2016) | todas as fontes acima |

Fora da página: velocidade máxima e 0–100, porque as fontes divergem.

## Palco do carro (Bloco 4, passo 1 — 2026-09-17)

- **Estúdio próprio**, distinto do palco da volta: piso grande quase metálico (roughness 0,5,
  metalness 0,85) que espelha o escuro em vez de acumular luz difusa, névoa exponencial fechando o
  horizonte e ambiente procedural (`RoomEnvironment` via PMREM) — sem HDRI para baixar.
- **Luzes:** key quente e fill frio como `DirectionalLight`; **rim lime como `SpotLight`** de alcance
  curto mirado no carro. Como directional, o rim virava um lóbulo especular que pintava o piso inteiro
  de verde (visto no navegador). Sem sombras em tempo real, como já previsto.
- **Proxy antes do modelo:** `scene/car.js` já expõe a interface final
  (`{ object3D, dimensions, setVisible, dispose }`, criação assíncrona); hoje ela devolve uma caixa nas
  medidas do Vulcan, no passo 5 devolverá o GLB, sem mexer em quem chama.
- **Tamanho real vem de uma função pura:** `lib/fitModel.js` (`fitToLength`) recebe uma bounding box e
  devolve escala uniforme + deslocamento que a põem no comprimento real, centrada em x/z e apoiada em
  y = 0. O proxy é criado de propósito em "centímetros" e fora do chão, então passa pelo mesmo caminho
  que o GLB vai passar. Medidas aproximadas usadas na cena (4,72 × 2,05 × 1,19 m) são valores internos,
  não aparecem na página.
- **Render sob demanda** no passo 1 (uma vez e a cada resize); o loop com pausa entra no passo 3, junto
  com o Lenis e a timeline de scroll.
- Valores de apresentação em `src/data/carStage.js`, como `data/lapScene.js` faz para a volta.

### Pontos de câmera (passo 2 — 2026-09-17)

- Cada ponto é **posição + alvo + fov** em coordenadas absolutas (`data/cameraShots.js`), na ordem em
  que a página passa por eles: `hero`, `aero`, `chassis`, `v12`, `transition`. Orbital (azimute,
  elevação, distância) foi considerado e descartado: cartesiano é mais fácil de ler e de ajustar com o
  carro real. Se as transições do passo 3 ficarem retas demais, revisitamos.
- A interpolação é código puro e testado, não do GSAP: `lerpShot(a, b, t)` e `shotAt(shots, progress)`
  em `lib/math.js`. No passo 3 o ScrollTrigger só move um progresso 0–1; quem calcula a câmera é o
  `shotAt`.
- **`?shot=<id>`** trava a câmera num capítulo, para conferir o enquadramento isolado. É o mecanismo de
  inspeção do passo 2 e não aparece em uso normal.
- Enquadrar contra uma caixa tem limite: os cinco ângulos existem e são distintos, mas o ajuste fino
  (distância, altura, fov e luz) é o passo 5, com o modelo real.

### Scroll (passo 3 — 2026-09-17)

- **Lenis e ScrollTrigger no mesmo ticker** (`lib/scroll.js`), importados só no modo full: no toque a
  página segue com o scroll nativo, como já estava decidido.
- **Uma timeline com `scrub: 0.6`** move um progresso de 0 a 1 (`scene/cameraRig.js`); o GSAP só dá o
  ritmo, e quem calcula a câmera é o `shotAt` testado. A timeline vai do centro do hero ao centro da
  seção de transição.
- **Paradas ancoradas às seções:** as seções têm alturas diferentes, então dividir o scroll em fatias
  iguais faria a câmera chegar antes ou depois do capítulo. `normalizeStops` converte o centro de cada
  `[data-shot]` numa parada 0–1 e o `shotAt` interpola entre elas; as paradas são recalculadas a cada
  refresh do ScrollTrigger (resize incluído).
- **O palco desenha só quando algo muda:** uma bandeira suja agenda um único rAF. Nada anima sozinho,
  então parado o custo é zero. O render também para fora da zona 3D (um segundo ScrollTrigger avisa) e
  com a aba em segundo plano. Medido no navegador contando as chamadas de desenho do WebGL: 0 parado,
  0 fora da zona, centenas durante o scroll.
- `data-shot` agora marca as cinco seções: hero, os três capítulos e a transição.

### Imagens do modo lite (passo 6 — 2026-09-17)

- As imagens de cada capítulo saem **da própria cena**, não de um render externo: `tools/capture.html`
  monta o palco num canvas de 1440×900 (16:10, o mesmo da figura), percorre os shots e posta cada um
  para `tools/shotServer.js`, um plugin de dev do Vite que grava em `public/shots/`. Repetível: quando
  o carro real entrar, roda-se a captura de novo e as três imagens se atualizam.
- O `src` fica em **`data-src`** e só o modo lite o promove (`components/chapterShots.js`). Sem isso o
  desktop baixava imagem que nunca mostra: `display: none` não impede o download, e uma das três vinha
  mesmo com `loading="lazy"`.
- Se o palco 3D falhar, o `main.js` cai para lite e carrega as imagens, então a página nunca fica sem
  o carro.

## Abordagem técnica — canvas 3D fixo + timeline única

- Um canvas Three.js `position: fixed` atrás das seções 1–5.
- Uma timeline GSAP ScrollTrigger (`scrub`) interpola os pontos de câmera definidos em `src/data/cameraShots.js`.
- Ao sair da zona 3D, o loop de render pausa. As seções 6–8 ficam no fluxo normal da página.

Alternativas descartadas: seções presas com animação própria (transições com tranco, problemas de pin no
celular) e sequência de imagens pré-renderizadas (pesada, sem 3D em tempo real).

## Estratégia de dispositivos — desktop first, mobile simplificado

Um modo é escolhido na inicialização por `src/lib/capabilities.js`:

- **`full`** (desktop com WebGL): experiência completa com câmera 3D no scroll.
- **`lite`** (tela estreita, toque, sem WebGL, `prefers-reduced-motion` ou falha no carregamento do modelo):
  - Three.js e o modelo **não são carregados**.
  - Cada capítulo mostra uma imagem estática do seu ângulo, capturada da própria cena desktop.
  - Pista e specs continuam: animadas normalmente, ou já no estado final com `prefers-reduced-motion`.
  - Layout empilhado com CSS (`clamp()` + breakpoints); scroll nativo (sem Lenis no toque).

## Arquitetura

```
index.html
public/
  models/vulcan.glb        modelo comprimido (Draco/meshopt, meta ≤ ~5 MB)
  env/studio.hdr           HDRI leve de estúdio
  shots/*.webp             imagens estáticas por capítulo (modo lite)
src/
  main.js                  ponto de entrada: escolhe modo, inicia módulos
  data/
    cameraShots.js         [{ id, position, target, fov }]
    specs.js               números + fontes
    silverstone.json       traçado normalizado
  lib/
    capabilities.js        decide full | lite
    scroll.js              Lenis + ScrollTrigger sincronizados
    loader.js              carrega GLB/HDR com progresso
    math.js                lerp, normalização, interpolação
  scene/
    renderer.js            renderer, limite de resolução, loop que pausa
    stage.js               piso, luzes, ambiente
    car.js                 monta o modelo e ajusta materiais
    cameraRig.js           timeline de scroll → câmera
  components/
    preloader.js
    textReveal.js
    lapTrack.js            Canvas 2D: traçado + ponto
    telemetryHud.js        só exibe { progress, speed, gear, sector }
    specCounters.js
  styles/
    tokens.css · base.css · sections/*.css
```

## Performance

- Modelo ≤ ~5 MB, texturas ≤ 2K. Se vier pesado, simplificar com `gltf-transform`.
- Resolução do 3D limitada a 1,5x. Sem sombras em tempo real: sombra do chão em textura fixa.
- Render pausa fora da zona 3D e com a aba em segundo plano.
- Lighthouse desktop: Performance ≥ 85, Acessibilidade ≥ 95. Mobile (lite): Performance ≥ 90.

## Verificação

- **Vitest (TDD)** para lógica pura:
  - normalização do GeoJSON;
  - velocidade e marcha a partir do progresso da volta;
  - interpolação de câmera;
  - contadores;
  - decisão full/lite.
- **Navegador:** desktop e viewport de 375px, console sem erros, modo reduced-motion.
- **Lighthouse** no build de produção.

## Modelo 3D — comparação dos candidatos (2026-09-17)

Levantado pela API pública do Sketchfab. O peso do `.zip` só aparece logado, então ele não entrou na
comparação; malha, texturas e licença bastaram para decidir.

| Modelo | Malha | Texturas | Licença | Observação |
|---|---|---|---|---|
| **Sohan3D** (escolhido) | 429k tris | 0 (16 materiais) | CC-BY | Forma completa: asa em pilares, difusor, splitter, rodas. Cor vem dos materiais |
| KRYPTA "Soft Lavender" | 72k tris | 28 (PBR metalness) | CC-BY | Único com PBR declarado; malha mais replicada do site. Pintura lilás |
| DisneyCars AMR Pro | 93k tris | 37 | CC-BY | Variante AMR Pro, com aero diferente do Vulcan |
| Galaxy Car Showroom | 59k tris | 16 | CC-BY | O mais leve dos completos; feito para Unity |
| AzzyLino | 67k tris | 0 | CC-BY | Estilizado/low-poly, sem asa — descartado |
| Zain Jafar | 3,9M tris | — | CC-BY | Detalhado demais, exigiria decimação pesada |
| temich / Outlaw Games | 72k tris | — | CC BY-**NC** | Os mais curtidos, mas a licença não-comercial não serve |

**Escolhido: Sohan3D** (`sketchfab.com/3d-models/aston-martin-vulcan-66cdaa9a8d114633986772a07b32d91c`).
Zero textura é vantagem aqui: a página tem direção visual própria (carbono escuro + lime), então a
pintura é definida nos materiais e o peso do arquivo vira só malha, que Draco/meshopt comprimem bem.
Os 429k triângulos são o preço, pago só no desktop — o mobile é lite, com imagens estáticas.

## Pendências

- Usuário baixa o GLB do Sohan3D no Sketchfab (exige login).
- Preloader (passo 4) adiado para junto do modelo: hoje não há nada pesado para carregar, e o progresso
  seria inventado. Quando o GLB entrar, o `lib/loader.js` reporta bytes de verdade.
