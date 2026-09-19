# Plano de implementação

## ▶ Retomada (atualizado em 2026-09-19)

- **O carro mudou: Vulcan → Toyota Supra MK5**, apresentado como **GR Supra GT4**. Não foi decisão de
  design: o Sketchfab quebrou o cadastro na migração para a KitBash e não existe Vulcan gratuito com
  malha utilizável em nenhum acervo. Motivos e alternativas verificadas em [design.md](design.md).
- **Estado do código:** Blocos 1–4 concluídos; Bloco 5 em andamento. 222 testes verdes, build ok.
  Sessão de 2026-09-19: **abertura da volta em cortina** — a transição virou a abertura da seção da
  volta e "The circuit." vai para o canto do palco enquanto ele sobe (design.md, "Abertura da volta:
  cortina") — e **tela de som** ("Born to be heard.", design.md "Tela de som"), com o áudio final (BMW Z3,
  Freesound, CC BY 4.0; design.md "Áudio final"). Sessão anterior (2026-09-18): TBT do desktop corrigido, checagem de acessibilidade (contraste
  sobre o 3D, Pause na volta, preloader `inert`), crédito do modelo no footer e o carro refeito a
  pedido do usuário — pipeline do modelo corrigido (o `dedup` fundia os materiais), acabamento por
  peça, detalhes (letreiro cromado, pinças e calotas lime, luzes acesas, lanternas vermelhas, sem
  placa), sombras por roda e box de pit no piso. Tudo em design.md ("Carregamento sem tarefas longas",
  "Acessibilidade", "Leitura do carro", "Profundidade", "Detalhes").
- **Lighthouse** (2026-09-19, depois do áudio final; `vite preview` + Edge headless via `npx lighthouse@12`):
  - Mobile (lite): **100 / 100 / 100 / 100** nas 3 rodadas (TBT 9–32 ms); peso 289 KB (era 4,1 MB com o MP3 provisório).
  - Desktop (full): **100 / 100 / 100 / 100** nas 3 rodadas (TBT 39–82 ms). Rodadas isoladas de 83–87 aparecem com
    a máquina ocupada (captura de imagens, laboratório aberto); repetir sem carga antes de concluir.

### Próximos passos, em ordem (combinado em 2026-09-18)

1. ~~Ritmo entre "The circuit." e a volta~~ — feito em 2026-09-19 (cortina, variante C).
2. ~~Tela de som~~ — feita em 2026-09-19, com o áudio final (BMW Z3, `public/audio/engine-start.mp3`).
3. Motion do hero/preloader.
4. Deploy na Vercel.
- Opcionais, sem efeito na nota: baixar o GLB em paralelo com o `createStage` (carro ~1 s antes);
  pré-compilar o palco da volta (bloqueia ~380 ms ao chegar perto); GLB de 7,7 MB acima da meta de ~5 MB.
- Em aberto por decisão: o preloader anuncia cada porcentagem (`role="status"`); emblema da Toyota
  discreto (regra "Sem logos oficiais").
- Não visto no navegador: a animação do reveal depois da troca do `aria-label`.

### Ferramentas desta sessão

- `tools/lookLab.html` (com `npm run dev`): `?set=look|finish|page|parts|details|normals|frame`,
  `?shots=` (capítulos e closes `nose`, `tail`, `wheel`, `headlight`), `?model=` (GLB candidato em
  `public/models/`). Compara variantes lado a lado, destaca materiais e mede onde o carro cai no quadro.
- `tools/capture.html` regrava as imagens do lite (`public/shots/*.webp`) depois de qualquer mudança no
  carro.
- Pipeline do modelo: FBX original em `Downloads/supra+personalizated(1).fbx`; passos em
  `tools/model/README.md`. As ferramentas ficam fora do projeto (instalar numa pasta temporária).

### Decisões que destravam o deploy (2026-09-18)

- **Licença do modelo:** seguir sem consultar o autor. O footer credita `mariobelmonte141` (link para o
  modelo no CGTrader) e cita a "Custom License (no AI)" como publicada.
- **Hospedagem:** Vercel.

### Dicas do ambiente

- Com o painel do navegador oculto, `requestAnimationFrame`, `IntersectionObserver`, `ResizeObserver` e
  o lazy loading de imagens não rodam, e as capturas saem pretas. **Aba em segundo plano mente igual**:
  uma medição de downloads chegou a dar "0" falso por isso.
- Para forçar o modo full: emular 1440×900 e recarregar. O app limpa a emulação quando a largura do
  painel muda, então vale reemular antes de cada recarga.
- A porta 5173 costuma estar ocupada por um dev server de outra sessão, que serve módulos em cache.
  Use a entrada `vite-dev-auto` do `.claude/launch.json`, que sobe em 5174 (conferir nos logs:
  `preview_logs`, busca "Local"; o painel pode anunciar outra porta, mas o Vite fica na 5174).
- A 4173 também pode estar com o `vite-preview` de outra sessão (servindo um `dist` antigo): para o
  Lighthouse, use `vite-preview-auto` (4174) e feche as abas do painel antes de medir.
- A emulação "mobile" do painel pode continuar valendo na carga seguinte: depois dela, conferir
  `data-mode` antes de medir o modo full.
- Capturar a cena antes do `ResizeObserver` enquadra contra o canvas padrão de 300×150.
- Uma volta dura 12 s; para pegá-la correndo, agrupar clique + espera + leitura num único lote.
- O painel pode ficar oculto no meio de uma medição (quadro de ~1 s no FPS, capturas com timeout ou
  pretas). Conferir `document.visibilityState` antes de medir; `tabs_select` às vezes o traz de volta.
- A primeira captura depois de recarregar costuma sair preta; a segunda sai certa.
- Em 1440×900 a captura do painel mostra só uma parte da viewport: para ver o quadro inteiro, emular
  1152×720 (mesmo aspecto 16:10).
- Lighthouse no Windows termina com `EPERM` ao apagar a pasta temporária; os relatórios saem mesmo assim.
- Tempo de shader não se mede no navegador do app depois da primeira carga: o cache de shaders do
  navegador fica quente. Para TBT, confiar no Lighthouse (perfil novo, cache frio); os `performance.mark`
  e `measure` aparecem no audit `user-timings` do JSON.

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
| `lib/lapPlayback.js` | regras puras de quando a volta anda: autoplay a 50% visível, fora da tela, pausa, fim, Restart |
| `components/lapPlayer.js` | loop + relógio seguindo o `lapPlayback`; liga o botão Pause (`aria-pressed`) |
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
2. **Pontos de câmera** — concluído em 2026-09-17
   - [x] 🧪 Interpolação entre pontos de câmera em `lib/math.js`: `clamp`, `lerpShot(a, b, t)`
     (posição, alvo e fov, com `t` preso em [0, 1] e sem devolver os objetos de entrada) e
     `shotAt(shots, progress)`, que percorre a lista com paradas igualmente espaçadas
   - [x] `data/cameraShots.js`: um ponto por capítulo (hero, aero, chassis, v12, transição), em
     posição + alvo + fov. O enquadramento do hero saiu de `carStage.js`, que ficou só com fov, near e far
   - [x] `scene/stage.js` ganhou `setShot(shot)` e o `main.js` aceita `?shot=<id>` para travar a câmera
     num capítulo (mecanismo de inspeção; o scroll assume no passo 3)
   - [x] 👁 Os cinco conferidos em 1440×900, console limpo. Com o proxy dá para julgar pouco: só o `v12`
     mudou (estava colado na lateral, recuou para caber com silhueta). O ajuste fino dos cinco é o passo 5
3. **Scroll** — concluído em 2026-09-17
   - [x] 🧪 `normalizeStops` em `lib/math.js` e `shotAt` aceitando paradas irregulares: cada ponto é
     alcançado quando a sua seção está centralizada, mesmo com seções de alturas diferentes
   - [x] `lib/scroll.js`: Lenis + ScrollTrigger no mesmo ticker (importado só no modo full, então o
     toque segue com o scroll nativo)
   - [x] `scene/cameraRig.js`: timeline única com `scrub: 0.6` movendo um progresso 0–1, ligada aos
     `data-shot`; quem calcula a câmera é o `shotAt`. Um segundo ScrollTrigger avisa quando a zona 3D
     entra e sai da tela
   - [x] `data-shot="hero"` e `data-shot="transition"` no `index.html` (faltavam os dois extremos)
   - [x] Pausa do render: o palco só desenha quando algo muda (bandeira suja + um rAF), e nunca fora da
     zona 3D ou com a aba em segundo plano
   - [x] 👁 Percorrer a página inteira: transições sem tranco, console limpo
     - Chamadas de desenho do WebGL contadas no console: **0** parado na zona 3D, 264 durante um trecho
       de scroll de 2 s, **0** rolando 300 px dentro da SPECS (fora da zona).
     - A câmera bate com o `?shot=` de cada capítulo quando a seção está centralizada, e continua batendo
       depois de redimensionar de 1440×900 para 1280×720 sem recarregar.
     - Âncoras do header funcionam com o Lenis ligado (scrollY = offsetTop em Specs e Aero).
     - Lite em 375 px: nada de `lenis` nem de `ScrollTrigger` é baixado.
     - Build: `scroll` 18,9 KB (5,6 gzip) e `cameraRig` 1,0 KB em chunks sob demanda; principal 88,4 KB.
4. **Preloader** — adiado para junto do passo 5 (2026-09-17): sem o GLB, o progresso seria inventado
   - [x] 🧪 `lib/progress.js`: `byteRatio` (evento de download → 0–1, `null` sem tamanho) e
     `percentShown` (nunca volta, segura em 99 até o carro estar no palco). Sem `lib/loader.js`: o
     `createCar` passou a informar os bytes do próprio GLB (o `LoadingManager` contava arquivos e
     pulava de terço em terço)
   - [x] `components/preloader.js`: bloqueia a página (`.is-loading`) enquanto o carro carrega, mas abre
     sozinho aos 8 s; sai com fade de 0,6 s. O palco ganhou `veil()`/`reveal()`: o carro sai da névoa
     (densidade 0,45 → 0,022 em 1,4 s; instantâneo com reduced-motion)
   - [x] Placas laterais da asa invisíveis por fora (2026-09-17, visto pelo usuário): são superfícies de
     face única com a normal para dentro (25 mil triângulos virados para o carro, área quase nula para
     fora), no material da lataria. `paint.body.doubleSided` liga `DoubleSide` nos materiais pintados
     como lataria. Render contínuo: 78 → 74 FPS, p95 15,4 → 16,9 ms. Lite recapturado
   - [x] Falha no carregamento: `preloader.fail()` e o `main.js` cai para o lite, como antes
   - [x] 👁 Conferido em 1440×900: 34 eventos de progresso crescentes, com tamanho conhecido; o
     preloader cobre a página e some ao fim; sem `finish`, abre aos 8,0 s e some aos 8,8 s; console
     limpo. Não conferidos: o fade da névoa quadro a quadro (as capturas do painel não pegam o
     intervalo) e o caminho de falha real (só o `catch` já existente)
5. **Modelo de verdade** — carro trocado para o Supra MK5 (ver [design.md](design.md))
   - [x] Comparar candidatos em quatro acervos; Sketchfab inviável, Vulcan gratuito inexistente
   - [x] Baixar o modelo (usuário) — Supra MK5 "personalized", FBX de 217 MB
   - [x] Converter e otimizar: 9450 malhas / 5,3M tris → 13 malhas / 1,47M tris, 4,0 MB
     (pipeline em [tools/model/README.md](../tools/model/README.md))
   - [x] Trocar o proxy pelo modelo: `scene/car.js` carrega o GLB com Draco, orienta, escala pelo
     `fitToLength`, pinta por nome de material e devolve a sombra de contato
   - [x] 👁 Ajuste fino dos pontos de câmera e da iluminação, com o carro real (2026-09-17)
     - A lataria estava escura por **mapeamento**, não por luz: o material `WHEELARCH RUBBER - black`
       é a maior parte da carroceria (852 mil dos 1,47M triângulos) e era pintado como pneu fosco.
       Saiu da lista `tyre`; key 1.6 → 2.2, ambiente 0.35 → 0.6.
     - O spot lime atravessava o teto e fazia uma poça no piso à frente do carro. Agora vem de cima e
       de trás mirando o centro do carro (intensidade 110, alcance 11): brilho lime no teto e no capô,
       e o que chega ao piso cai embaixo do carro.
     - 🧪 `offsetTarget` em `lib/math.js` (+ `offset` no `lerpShot`): cada ponto guarda o alvo no carro
       e um `offset` em fração da largura do quadro; o palco desloca o olhar pelo aspecto real da
       câmera e reaplica no resize. O carro fica no lado livre do texto de cada seção; a captura do
       lite usa `offset: 0` (carro centralizado).
     - Conferido em 1440×900 nos cinco pontos e em 1280×1000 sem recarregar; console limpo.
       FPS rolando a zona 3D: média 137, p95 12,2 ms, pior quadro 18,3 ms.
     - Prévias feitas com um helper temporário que renderizava folhas de contato pelo `/__shot/`
       (gravar em `public/` recarrega a página do dev server: renderizar tudo antes de postar).
   - [x] Recapturar as imagens do modo lite (2026-09-17): 22 / 24 / 16 KB, carro centralizado
     (`offset: 0`); conferidas em 375 px, carregadas, sem overflow, console limpo. Recapturadas de
     novo depois da correção da lataria (20 / 22 / 16 KB)
   - [x] Ondulações na lataria corrigidas (2026-09-17): vinham do `simplify`, não do modelo nem do Draco
     - Diagnóstico por variantes, na mesma câmera: sem simplify → lisa; sem Draco → amassada; lataria
       simplificada com erro 0.0002 ou 0.0005 → amassada; normais recalculadas depois → facetada
       (a malha não compartilha vértices entre faces). O meshopt ignora as normais ao colapsar.
     - Solução: `optimize.mjs` deixa intacto o material `WHEELARCH RUBBER - black` (a lataria
       principal) e simplifica o resto. 3.551.233 tris, 7,9 MB (antes 1.472.254 e 4,0 MB). O script
       versionado reproduz o `supra.glb` byte a byte.
     - Preservar também as outras peças pintadas como body (V1: 4,7M tris, 10,3 MB) não mudava nada
       visível e custava mais FPS: render contínuo 61 × 70 (V5, escolhida) × 90 (antes).
     - Página real, rolando a zona 3D em 1440×900: média 118 FPS (antes 137), p95 18,2 ms (antes
       12,2), pior quadro 36,3 ms. GLB de 7,9 MB em 273 ms no servidor local; o preloader (passo 4)
       passa a importar mais.
     - `createCar` ganhou a opção `url` (padrão `supra.glb`), usada para comparar variantes.
6. **Modo lite** — feito com o proxy em 2026-09-17; as imagens são recapturadas no passo 5
   - [x] Ferramenta de captura: `tools/capture.html` + `tools/capture.js` montam o palco num canvas de
     1440×900 e postam cada shot; o plugin de dev `tools/shotServer.js` grava em `public/shots/`.
     Rodar com o dev server no ar: `http://localhost:<porta>/tools/capture.html`
   - [x] `public/shots/{aero,chassis,v12}.webp` capturados (9–12 KB cada)
   - [x] `components/chapterShots.js`: o `src` fica em `data-src` e só o modo lite o promove, senão o
     desktop baixaria imagens que nunca mostra (medido: uma delas vinha mesmo com `display: none`)
   - [x] 👁 Substituir os `chapter__shot-placeholder` pelas imagens, em 375 px
     - Medido na aba visível: full baixa 0 imagens, lite baixa as 3 e as renderiza; console limpo.
     - Duas armadilhas do ambiente: capturar antes do `ResizeObserver` enquadra a cena contra o canvas
       padrão de 300×150, e em aba de segundo plano o lazy loading não roda (a medição mente).

## Bloco 5 — Polimento e entrega
- [x] Limpeza dos restos do Vulcan: `name` do pacote (`gr-supra-gt4-landing`), `CLAUDE.md`, `design.md`
  (título, conceito, estrutura, pendências) e a constante do teste do `fitModel`
- [ ] Transições do hero/preloader e ritmo do motion
- [x] 🧪 Trajetória da câmera em arco (2026-09-18): `lerpOrbit` em `lib/math.js` gira a posição em volta
  do eixo vertical do carro (ângulo pelo caminho mais curto, distância ao eixo e altura lineares); o
  `lerpShot` usa ele para a posição e mantém alvo, fov e offset lineares. Os dados seguem cartesianos.
  - Menor distância à lataria no meio de cada trecho, linear → arco: hero→aero 2,5 → 3,8 m;
    aero→chassis 1,9 → 3,8 m; chassis→engine 3,7 → 3,8 m. `data/cameraShots.test.js` garante que
    nenhum trecho chega mais perto do carro do que os seus pontos de parada.
  - 👁 1440×900: no meio das três primeiras transições o carro aparece inteiro de perfil; os pontos
    de parada não mudaram (o arco devolve as pontas exatas). Console limpo; p95 de 12,4 ms rolando
    (antes 12,2). As medições tiveram um quadro de ~1 s por rodada, coincidindo com o painel do
    navegador sendo ocultado; não investigado além disso.
- [x] Enquadramento do aero (2026-09-18): a traseira do carro passava por baixo da coluna de texto à
  direita (já era assim antes do arco). Câmera 10% mais longe, (−5,4; 2,2; 3,0) → (−5,8; 2,35; 3,3), e
  `offset` −0,17 → −0,22.
  - 👁 `?shot=aero` em 1152×720 (mesmo aspecto de 1440×900): carro de ~0,06 a ~0,63 da largura, texto
    a partir de 0,67. Console limpo. As transições vizinhas não foram capturadas (screenshots dando
    timeout); o `cameraShots.test.js` segue garantindo que não passam perto do carro.
- [x] Footer com créditos: modelo (`mariobelmonte141`, link do CGTrader, "Custom License, no AI"), traçado e fontes
- [x] Leitura do carro (pedido do usuário, 2026-09-18): verniz, luz de recorte e soleira lime escolhidos
  no laboratório `tools/lookLab.html`; aero e chassis reenquadrados; âncoras do menu no ponto da câmera;
  imagens do lite regeradas. Detalhes em design.md ("Leitura do carro").
  - 👁 1152×720: aero e chassis com folga do texto; âncoras param no centro do capítulo (866/864, 1874/1872).
  - Lighthouse desktop: 99 em 4 de 5 rodadas (TBT 48–62 ms), uma de 87 fora da curva.
  - `tools/capture.js` corrigido: não esperava o `createStage`, que virou assíncrono.
- [x] Profundidade do carro (pedido do usuário, 2026-09-18): pipeline do modelo corrigido (o `dedup`
  fundia os materiais), GLB regerado com pintura, blackout, carbono e vidro separados; acabamento por
  peça; ambiente 0,5; spot lime fora do teto; sombras por roda (🧪 `lib/wheelContacts.js`) e box de pit
  no piso. Detalhes em design.md ("Profundidade").
  - 👁 1152×720: hero, aero, chassis e engine sem linhas do box sob o texto; console limpo.
  - Imagens do lite regeradas. Lighthouse desktop 100 / 99 / 100.
- [x] Detalhes do carro (pedido do usuário, 2026-09-18): letreiro "Supra" cromado, pinças e calotas lime
  sutis, neblinas e luz de chuva acesas, placa escondida; soleira lime retirada; emblema da Toyota
  discreto (regra "Sem logos oficiais"). Pipeline separa placa, luz de chuva, neblinas e calotas.
  Detalhes em design.md ("Detalhes"). Lighthouse desktop 99–100, mobile 100.
- [x] Luzes do carro (2026-09-18): LED branco dos faróis por cima do vidro, lanternas e refletores
  vermelhos, as duas neblinas acesas. Pipeline separa lanternas, vidro delas e pinças. Lighthouse
  desktop 100. Detalhes em design.md ("Detalhes" → "Luzes").
- [x] Ritmo entre "The circuit." e a volta (pedido do usuário, 2026-09-19): variantes A/B/C comparadas
  lado a lado na página real (lab temporário, apagado); escolhida a **C, cortina**. Detalhes em design.md
  ("Abertura da volta: cortina").
  - 🧪 `lib/curtain.js` (`curtainAt`, 5 testes): caminho do título com a rolagem compensada, sem `sticky`
    (que deslocava as paradas do `cameraRig`). `components/lapCurtain.js` liga ao ScrollTrigger (full).
  - 👁 1152×720: título pousa alinhado ao label (58 px, 12 px acima); paradas da câmera iguais (3744 /
    4464); âncora "Lap" para no palco assentado; 1280×1000 sem recarregar continua alinhado; lite em
    375 px empilhado, sem overflow; console limpo. Movimento contínuo não visto (painel oculto): medido
    em pontos da rolagem.
  - Lighthouse: desktop 100 × 4 (TBT 44–49 ms), mobile 100 × 4.
- [x] Tela de som depois do carregamento (pedido do usuário, 2026-09-19): segunda fase do preloader, nos
  dois modos, centralizada, "Born to be heard." Detalhes em design.md ("Tela de som").
  - 🧪 `lib/soundGate.js` (teclas → escolha) e `lib/envelope.js` (recorte e fades): 19 testes.
  - 👁 1152×720 (full) e 375 px (lite): tela depois do 100%, foco no Start, página `inert`; clique e
    tecla K tocam o recorte (contexto `running`, 0 ms até tocar) e abrem a página; "Enter without sound"
    e Esc abrem sem criar `AudioContext`. Uma rodada de Esc não abriu e não se repetiu (provável foco
    no painel do app); vale conferir num navegador de verdade.
  - Lighthouse: desktop 100 × 4 (TBT 35–66 ms), mobile 100 × 4; peso mobile 4,1 MB pelo MP3 provisório.
- [x] Áudio final do motor (2026-09-19): candidatas do Freesound comparadas no `tools/soundLab.html`
  (temporário), com trechos pré-marcados por análise de volume e uma montagem de dois trechos; escolhida
  a **BMW Z3** ("car-start", Erdie, CC BY 4.0), 0–5,5 s. Detalhes em design.md ("Áudio final").
  - Recorte com ffmpeg da prévia HQ pública (o original pede login): `public/audio/engine-start.mp3`,
    estéreo, 128 kbps, 89 KB. Crédito no footer (título, autor, licença, "trimmed").
  - 👁 1152×720 (dev): arquivo local chega (87 KB), decodifica 5,5 s estéreo e toca no Start; crédito no
    footer; console limpo.
  - Lighthouse: mobile 100 × 3 (peso 289 KB), desktop 100 × 3 (TBT 39–82 ms).
- [x] Acessibilidade: foco, contraste, textos alternativos, ordem de leitura (2026-09-18)
  - Roteiro manual no build (1152×720 full, 375 px lite). Passaram: ordem do foco, foco visível,
    âncoras pelo teclado, `alt` do lite, anúncio do HUD, reduced motion → lite.
  - Corrigidos: contraste dos labels sobre o 3D (muted → text-soft no full; kicker em text; medido no
    frame renderizado, tudo ≥ 4,5:1); 🧪 Pause na volta (`lib/lapPlayback.js`, 9 testes) nos dois modos;
    preloader deixa a página `inert`; `//` do kicker em `aria-hidden`.
  - 👁 Pause congela o tempo, segue pausado fora da tela e de volta, Restart despausa (full e lite);
    `inert` ativo durante o preloader e removido depois.
  - Lighthouse depois: desktop 99 / 100 / 100 / 100, mobile 100 em tudo. 195 testes.
- [x] Lighthouse no build (metas em design.md) — medido em 2026-09-18: mobile 100 em tudo; desktop
  Perf 66–70 pelo TBT, depois **99 / 100 / 100 / 100** com a correção abaixo. Corrigidos os achados menores: `public/favicon.svg` (a barra lime
  do header), `public/robots.txt` e o reveal, que punha `aria-label` num `<p>` (proibido pelo ARIA) e
  agora usa uma cópia do texto em `.visually-hidden`, com as linhas em `aria-hidden`
  - Entrada `vite-preview` (porta 4173) no `.claude/launch.json` para medir o build
  - TBT do desktop (2026-09-18): medido com `performance.mark` temporários (já removidos), atacado por
    ordem do ganho. Cada passo revalidado com 3 rodadas (Perf / TBT):
    - início: 69–70 / 764–909 ms;
    - volta 3D adiada com `whenNear` (layout 3D desde o início): 69–70 / 826–913 ms. A tarefa dela
      começava antes do FCP e quase não contava, e a criação do contexto WebGL (~130 ms) passou para
      o `createStage`;
    - `compileAsync` no palco e no carro (`view.prepare`): 70–72 / 725–861 ms;
    - ambiente com shaders pré-compilados (`scene/studioEnvironment.js`): 81–82 / 382–390 ms;
    - filtros do PMREM compilados na malha de LOD real: **99 / 38–70 ms**.
  - 👁 1152×720: hero com os reflexos e o lime como antes; a volta monta só ao rolar até perto dela
    (0 → 1 montagem) e roda. Com o cache frio, o console mostra um aviso de precisão do compilador
    HLSL (`X4122`) num programa não identificado; inofensivo, não verificado se já aparecia antes.
- [ ] Deploy na Vercel (decidido em 2026-09-18)
