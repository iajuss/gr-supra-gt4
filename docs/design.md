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

- Títulos: sans condensada pesada (ex.: Anton / Big Shoulders Display).
- Labels e telemetria: monoespaçada (ex.: JetBrains Mono).

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
7. **SPECS** — contadores, barras comparativas, reveal tipográfico. Números verificados em fontes públicas.
8. **Footer** — aviso fan-made, crédito CC-BY do modelo 3D, crédito do traçado.

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
