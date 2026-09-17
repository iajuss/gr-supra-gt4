# Plano de implementação

## ▶ Retomada (atualizado em 2026-09-17, fim do passo 1 do Bloco 4)

- **Onde paramos:** Blocos 1, 2, 2B e 3 concluídos e verificados no navegador; nada pendente para trás.
  O **passo 1 do Bloco 4 (palco com proxy)** está feito e verificado. 140 testes verdes.
- **Próximo passo: Bloco 4, passo 2 (pontos de câmera)** — método combinado: teste antes da
  interpolação (posição, alvo e fov) em `lib/math.js`, depois `data/cameraShots.js` com um ponto por
  capítulo e um modo de inspeção para conferir cada enquadramento no navegador.
- **Passo 1, o que ficou:** `lib/fitModel.js` (🧪 `fitToLength`), `data/carStage.js`, `scene/stage.js`,
  `scene/car.js` (proxy por trás da interface final) e o import dinâmico do palco no `main.js`.
  O gradiente placeholder saiu do `stage.css`. Build: `stage` 3,3 KB, `car` 1,0 KB, `carStage` 0,6 KB
  em chunks próprios, compartilhando `renderer`/`three.core` com a volta 3D; principal 87 KB (34,7 gzip).
- **Sandbox:** o protótipo saiu do projeto e vive em `Desktop/track3d-sandbox` (nunca esteve no git).
  A entrada `sandbox/` continua no `.gitignore`, à toa.
- **Dicas do ambiente:**
  - Com o painel do navegador oculto, `requestAnimationFrame`, `IntersectionObserver`, `ResizeObserver` e
    transições CSS não rodam, e as capturas saem pretas — mesmo com `visibilityState` dizendo `visible`.
    Sintoma típico: o canvas do palco fica em 300×150 (o padrão), esticado pelo CSS.
  - Para forçar o modo full: emular 1440×900 e recarregar. O app limpa a emulação quando a largura do
    painel muda, então vale reemular antes de cada recarga.
  - O buffer de rede da aba mistura as cargas anteriores: para provar que o lite não baixa Three.js,
    abrir uma aba nova, emular 375 px e ler a rede só dela.
  - Uma volta dura 12 s; entre duas chamadas de ferramenta ela pode terminar sozinha. Para pegá-la
    correndo, agrupar clique + espera + leitura num único lote (ou orquestrar tudo em um script só).
  - Clicar por referência de elemento rola a página antes do clique; clicar pelo DOM não mexe no scroll.

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
- [x] 👁 Desktop: 3 câmeras, Restart, pausa fora da tela, FPS · Lite: fallback 2D · reduced-motion · sem WebGL
  - Verificado em 2026-09-17 com o painel visível, em 1440×900 e 375×812. FPS: Heli 134, Chase 142, Top 137.
  - Restart no meio (0:44 → 0:00) e depois do fim (1:45.364 → 0:01), com a câmera direto na largada.
  - Fora da tela o relógio congela (0:26.3) e retoma de lá. Lite e sem WebGL não baixam nada do Three.js.
  - Reduced-motion e sem WebGL testados por uma página temporária que sobrescrevia `matchMedia` e
    `getContext` antes do `main.js` (apagada depois): o `detectEnvironment` lê o `window` real.
  - Três correções saíram daqui: controles abaixo do header, `[hidden]` valendo sobre `.button`
    (o Restart aparecia em reduced-motion) e o resumo para leitor de tela limpo no Restart.
- [x] Remover `sandbox/track3d` — movido para `Desktop/track3d-sandbox`, fora do projeto (2026-09-17)

## Bloco 3 — SPECS
- [x] Levantar e conferir números do Vulcan em fontes públicas → tabela em `design.md` + valores no HTML (`data-count`)
  - Corrigido: 820 PS → 820 hp; "Splitter + canards" (não confirmado) → Downforce 1,300+ kg
- [x] 🧪 Lógica de contagem (`lib/counter.js`: easing, casas decimais, valor por progresso, formatação en-US)
- [x] `components/specCounters.js` + barra downforce vs peso (96%): uma vez ao entrar na tela, escalonado
- [x] 🧪 `lib/lines.js` + `components/textReveal.js`: linhas sobem de trás de uma máscara (GSAP), aplicado a títulos de capítulos e seções
  - Unidades com a caixa correta (`.unit`: Nm, kg, mm); espaços preservados entre as linhas divididas
- [x] 👁 Desktop: contadores chegam a 820 / 780 / 1,350 / 24 / 96% e a barra a 0,96, sem erros no console
- [x] 👁 Ver o movimento do reveal e dos contadores com o painel visível + mobile
  - Verificado em 2026-09-17, em 1440×900 e 375×812, amostrando o movimento quadro a quadro.
  - Reveal: a linha sobe de 83 px (desktop) / 42 px (mobile) até 0 em ~0,9 s e o texto volta ao normal
    (`unsplit`), então um resize depois disso reflui sem resíduo.
  - Contadores: escalonados, chegam a 820 / 780 / 1,350 / 24 / 96 em ~1,8 s.
  - Barra: transição de 1,4 s até 1.226 px de 1.281 px = 0,96. Em 375 px, sem overflow horizontal.

## Bloco 4 — 3D (modo full)
Ordem combinada em 2026-09-17: **a cena nasce com um proxy no lugar do carro** (como o bloco lime no 2B),
para o download do modelo não travar nada; o GLB entra depois, no passo 5. **Lenis entra junto com as
câmeras** (passo 3), porque o ritmo do scrub é calibrado sentindo o scroll real.
A marcação já existe no `index.html`: `.stage` fixo com canvas, `.preloader` e as seções `data-shot`.

1. **Palco com proxy** — concluído em 2026-09-17
   - [x] 🧪 `lib/fitModel.js`: `fitToLength` põe uma bounding box no tamanho real, centrada em x/z e
     apoiada em y = 0. O proxy já passa por ele; o GLB do passo 5 reaproveita.
   - [x] `data/carStage.js`: medidas do Vulcan, luzes, piso, névoa, câmera do hero e cores
   - [x] `scene/stage.js`: estúdio escuro (piso quase metálico, key/fill/rim, `RoomEnvironment` via PMREM,
     névoa), câmera parada e render sob demanda, reusando a fábrica `scene/renderer.js` do Bloco 2B
   - [x] `scene/car.js`: `createCar()` async → `{ object3D, dimensions, setVisible, dispose }`, com o proxy
     (caixa nas medidas do Vulcan) por trás da interface que o modelo vai cumprir
   - [x] Ligação no `main.js` (import dinâmico só em full) e limpeza do gradiente placeholder no `stage.css`
   - [x] 👁 Palco visível atrás do hero, sem erros no console
     - Verificado em 1440×900 com o painel visível: canvas 1425×900 CSS / 1781×1125 de buffer.
     - Lite em 375 px: palco com `display: none` e nenhuma das 60 requisições vinda do Three.js.
     - O palco fixo não vaza: aparece atrás do AERO (zona 3D) e as seções LAP e SPECS o cobrem.
     - O rim lime como `DirectionalLight` cobria o piso metálico inteiro de verde (lóbulo especular);
       virou um `SpotLight` de alcance curto mirado no carro.
2. **Pontos de câmera**
   - [ ] 🧪 Interpolação entre pontos de câmera em `lib/math.js` (posição, alvo e fov)
   - [ ] `data/cameraShots.js`: um ponto por capítulo (hero, aero, chassis, v12, transição)
3. **Scroll**
   - [ ] `lib/scroll.js`: Lenis + ScrollTrigger sincronizados (scroll nativo no toque)
   - [ ] `scene/cameraRig.js`: timeline única com `scrub`, ligada aos `data-shot`
   - [ ] Pausa do render fora da zona 3D e com a aba em segundo plano
   - [ ] 👁 Percorrer a página inteira: transições sem tranco, FPS, console limpo
4. **Preloader**
   - [ ] `lib/loader.js` (GLB/HDR com progresso) + `components/preloader.js` com progresso real
   - [ ] Falha no carregamento cai para o modo lite, como o `main.js` já faz com o 3D da volta
5. **Modelo de verdade**
   - [ ] Escolher e baixar o modelo (usuário) → comparar peso/qualidade/licença
   - [ ] Otimizar com `gltf-transform` (meta ≤ ~5 MB)
   - [ ] Trocar o proxy pelo modelo e ajustar materiais
   - [ ] 👁 Ajuste fino dos pontos de câmera e da iluminação, com o carro real
6. **Modo lite**
   - [ ] Capturar `public/shots/*.webp` de cada capítulo a partir da cena ajustada
   - [ ] 👁 Substituir os `chapter__shot-placeholder` pelas imagens, em 375 px

## Bloco 5 — Polimento e entrega
- [ ] Transições do hero/preloader e ritmo do motion
- [ ] Footer com créditos (modelo CC-BY, traçado, fontes)
- [ ] Acessibilidade: foco, contraste, textos alternativos, ordem de leitura
- [ ] Lighthouse no build (metas em design.md)
- [ ] Deploy (definir: Vercel / Netlify / GitHub Pages)
