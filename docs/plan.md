# Plano de implementação

## ▶ Retomada (atualizado em 2026-09-17, fim da sessão)

- **Onde paramos:** Blocos 1, 2 e 3 concluídos. Bloco 2B com passos 1 a 5 **commitados** (`283bf62` lógica pura,
  `5555bfb` cena 3D na página). O usuário viu a pista 3D e aprovou ("ficou incrível"). 134 testes verdes.
- **Próximo passo: passo 6 do 2B (verificação), com o painel do navegador visível** (método escolhido pelo usuário).
  Roteiro combinado:
  1. Desktop (≥ 1024 px): volta começa a 50% visível na Heli; capturas de Chase, Heli e Top (minimapa nas três).
  2. FPS durante a volta em cada câmera.
  3. Restart no meio e depois do fim (volta a 0:00, câmera direto na largada).
  4. Pausa fora da tela: rolar para fora e voltar, a volta continua de onde parou.
  5. Lite em 375 px: 2D, Restart visível, sem baixar o Three.js.
  6. Reduced-motion (volta completa, Restart oculto) e sem WebGL (fallback 2D): simular o que der e dizer o que não deu.
- **Sandbox:** `sandbox/track3d/` (fora do git) **fica por enquanto**; decidir no fim do bloco (mover para fora do
  projeto, apagar ou manter). Não apagar sem perguntar: não tem cópia no git.
- **Pendências pequenas notadas:**
  - Ao dar Restart, o resumo para leitor de tela ("Simulated lap completed in …") continua com o texto da volta anterior.
  - Bloco 3: ver o movimento do reveal e dos contadores com o painel visível + mobile.
- **Dicas do ambiente:**
  - Com o painel do navegador oculto, `requestAnimationFrame`, `IntersectionObserver`, `ResizeObserver` e
    transições CSS não rodam, e as capturas saem pretas. Pedir para o usuário abrir o painel antes de verificar
    visualmente.
  - Para forçar o modo full no painel: emular 1440×900 e recarregar (o painel oculto tem janela 0×0 → lite).
  - A porta 5173 pode estar ocupada pelo servidor de outra conversa na mesma pasta; dá para usar esse servidor
    abrindo `http://localhost:5173/` direto.

### Mapa do Bloco 2B

| Arquivo | Responsabilidade |
|---|---|
| `data/lapScene.js` | duração (12 s), limite do quadro, medidas da pista/zebras, visual da Top, cores, câmeras (inicial: Heli) |
| `lib/lapClock.js` | tempo na tela → tempo simulado e `done` |
| `lib/geometry.js` | `smoothClosed` e `circumradius` |
| `lib/centreline.js` | linha central `{ x, z }`, tangentes, normais, raios, `frameAt(progress)`, `kerbSamples` |
| `lib/ribbon.js` | `buildRibbon` (vértices, índices, cores, segmentos pulados), `indexCountUntil`, `stripeAt` |
| `lib/cameraRigs.js` | `cameraRig`, `cameraFov`, `followFactor`, `topCameraLook` |
| `lib/lap.js` | `buildLap`: traçado em metros + modelo da volta (2D e 3D) |
| `components/lapPlayer.js` | loop + relógio: início a 50% visível, pausa fora da tela, fim na linha, Restart |
| `components/lapSection.js` | modo lite (canvas 2D + HUD) |
| `components/lapSection3d.js` | modo full (palco 3D, HUD, minimapa, câmeras, Restart); import dinâmico em `main.js` |
| `scene/renderer.js` | fábrica do WebGLRenderer (1,5× máx.), compartilhada com o Bloco 4 |
| `scene/lap/` | `lapStage` (cena, câmera, bloom), `environment`, `track`, `trail`, `car`, `ribbonMesh` |

Ordem aprovada: **Fundação → Pista → Specs → 3D → Polimento**. Design em [design.md](design.md).
Cada bloco é detalhado e combinado na conversa antes de começar; marque `[x]` ao concluir.
Legenda: 🧪 = teste escrito antes (TDD) · 👁 = verificação no navegador.

## Bloco 1 — Fundação
- [x] Scaffold Vite (JS puro) + dependências (three, gsap, lenis) + Vitest
- [x] Scripts npm: `dev`, `build`, `preview`, `test`
- [x] 🧪 `lib/capabilities.js` — decide `full | lite`
- [x] `styles/tokens.css` + `base.css` (fontes, tipografia fluida, reset)
- [x] `index.html` com a marcação semântica de todas as seções (conteúdo em inglês, placeholders visuais)
- [x] 👁 Layout estático de cada seção em desktop e em 375px
  - Números técnicos marcados com `data-provisional` até a conferência no Bloco 3

## Bloco 2 — THE LAP
- [x] Obter o GeoJSON de Silverstone (`bacinger/f1-circuits`) e registrar o crédito → `data/silverstone.json` (3,3 KB)
- [x] 🧪 `lib/track.js` — projeção, ajuste ao canvas, comprimento acumulado e `pointAt(progress)`
  - Traçado projetado: 5878 m (oficial 5891 m, erro de −0,22%). Sentido horário na tela.
- [x] 🧪 Modelo de telemetria simulada (`lib/telemetry.js` + `data/vulcanDynamics.js`): tempo → { progress, speed, gear, sector, elapsed }
  - Velocidade derivada da curvatura. Volta de 1:45.4, 94–288 km/h, 18 zonas de frenagem (= 18 curvas). Montagem em ~1 ms.
  - `lib/math.js` com a busca binária compartilhada
- [x] 🧪 `lib/track.js` + `orientToBox`, `sliceUntil` · `lib/format.js` (tempo de volta e velocidade)
- [x] `components/lapTrack.js` — contorno fantasma, marcas de setor, linha de largada, rastro lime e ponto com brilho
- [x] `components/telemetryHud.js` — exibe os dados recebidos (+ resumo para leitor de tela)
- [x] `components/lapSection.js` — volta de 12 s ao entrar na tela, botão REPLAY, modo reduced-motion
- [x] 👁 Desktop (traçado girado, 4:3) + mobile (em pé, 3:4), sem erros no console
- [x] 🧪 Linha de largada movida para Hamilton Straight (`rotateStart` + `data/circuit.js`). O GeoJSON começava na reta antiga (Woodcote–Copse).
  - Teste amarrado à realidade: 18 zonas de frenagem, Abbey à frente e Club atrás (200–400 m cada), passagem acima de 200 km/h
  - Setores aproximados: S1 termina na Wellington, S2 na Hangar
- [x] 👁 Reduced-motion: volta completa, HUD final (1:45.364) e replay oculto

## Bloco 2B — THE LAP em 3D (modo full)
Protótipo aprovado em `sandbox/track3d`. O 2D atual continua como modo lite.
- [x] 🧪 Extrair a lógica pura do protótipo:
  - relógio da volta (tempo na tela → tempo simulado, fim da volta);
  - posição e direção ao longo da linha central;
  - geometria das fitas (vértices e índices, sem Three.js);
  - trechos com zebra (por raio de curva);
  - posição das 3 câmeras.
- [x] Refatorar `components/lapSection.js` (2D) para usar o relógio da volta
  - 👁 2D conferido pelo DOM (painel oculto): volta em ~12 s até 1:45.364, pausa sem pular, console sem erros
- [x] `scene/renderer.js` (fábrica compartilhada com o Bloco 4) + `scene/lap/` (pista, zebras, largada, rastro, carro, bloom, loop com pausa)
- [x] HTML/CSS do modo full: palco em tela cheia, HUD, minimapa, câmeras (padrão Heli), Restart
- [x] Ligação: import dinâmico no modo full; lite mantém o 2D
  - Build: `lapSection3d` em chunk separado (559 KB, 139 KB gzip); bundle principal 86 KB (34 KB gzip)
- [x] 👁 Usuário viu a pista 3D na página e aprovou; minimapa passou a aparecer também na Top
- [ ] 👁 Desktop: 3 câmeras, Restart, pausa fora da tela, FPS · Lite: fallback 2D · reduced-motion · sem WebGL
- [ ] Remover `sandbox/track3d`

## Bloco 3 — SPECS
- [x] Levantar e conferir números do Vulcan em fontes públicas → tabela em `design.md` + valores no HTML (`data-count`)
  - Corrigido: 820 PS → 820 hp; "Splitter + canards" (não confirmado) → Downforce 1,300+ kg
- [x] 🧪 Lógica de contagem (`lib/counter.js`: easing, casas decimais, valor por progresso, formatação en-US)
- [x] `components/specCounters.js` + barra downforce vs peso (96%): uma vez ao entrar na tela, escalonado
- [x] 🧪 `lib/lines.js` + `components/textReveal.js`: linhas sobem de trás de uma máscara (GSAP), aplicado a títulos de capítulos e seções
  - Unidades com a caixa correta (`.unit`: Nm, kg, mm); espaços preservados entre as linhas divididas
- [x] 👁 Desktop: contadores chegam a 820 / 780 / 1,350 / 24 / 96% e a barra a 0,96, sem erros no console
- [ ] 👁 Ver o movimento do reveal e dos contadores com o painel visível (o painel ficou oculto durante os testes) + mobile

## Bloco 4 — 3D (modo full)
- [ ] Escolher e baixar o modelo (usuário) → comparar peso/qualidade/licença
- [ ] Otimizar com `gltf-transform` (meta ≤ ~5 MB)
- [ ] `lib/loader.js` + `components/preloader.js` com progresso real
- [ ] `scene/renderer.js`, `stage.js`, `car.js`
- [ ] 🧪 Interpolação entre pontos de câmera (`lib/math.js`)
- [ ] `data/cameraShots.js` + `scene/cameraRig.js` (ScrollTrigger scrub) + `lib/scroll.js` (Lenis)
- [ ] Pausa do render fora da zona 3D / aba em segundo plano
- [ ] Capturar `public/shots/*.webp` de cada capítulo para o modo lite
- [ ] 👁 Ajuste fino dos pontos de câmera e da iluminação

## Bloco 5 — Polimento e entrega
- [ ] Transições do hero/preloader e ritmo do motion
- [ ] Footer com créditos (modelo CC-BY, traçado, fontes)
- [ ] Acessibilidade: foco, contraste, textos alternativos, ordem de leitura
- [ ] Lighthouse no build (metas em design.md)
- [ ] Deploy (definir: Vercel / Netlify / GitHub Pages)
