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
     - Uma volta de 12 s ao entrar na tela (50% visível) → para na linha com o tempo final → Replay.
       O render pausa ao terminar e fora da tela.
     - Câmeras Chase / Heli / Top em botões; começa na **Heli**. Minimapa some na Top.
     - Three.js e pós-processamento carregados sob demanda, só no modo full.
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

## Pendências

- Usuário baixa o modelo Vulcan do Sketchfab (exige login). Candidatos: Sohan3D, Zain Jafar,
  DisneyCars (AMR Pro). Comparar peso, qualidade e licença antes.
- Confirmar os números da ficha técnica em fontes públicas.
