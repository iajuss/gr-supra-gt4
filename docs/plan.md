# Plano de implementação

## ▶ Retomada (atualizado em 2026-09-19)

- **O carro mudou: Vulcan → Toyota Supra MK5**, apresentado como **GR Supra GT4**. Não foi decisão de
  design: o Sketchfab quebrou o cadastro na migração para a KitBash e não existe Vulcan gratuito com
  malha utilizável em nenhum acervo. Motivos e alternativas verificadas em [design.md](design.md).
- **No ar:** https://gr-supra-gt4.vercel.app — código em https://github.com/iajuss/gr-supra-gt4 (público,
  branch `main`). A Vercel publica sozinha a cada push no `main`. Commits com o e-mail noreply do GitHub
  (`269213431+iajuss@users.noreply.github.com`, configurado no repositório; o histórico foi reescrito
  antes do primeiro envio para tirar o e-mail da Insper).
- **Estado do código:** Blocos 1–5 concluídos. 240 testes verdes, build ok.
  Última sessão (2026-09-19, tarde): **abertura como partida do motor** — carregamento em linha, faróis
  piscando, motor, "SUPRA" na pega, som com ambiente (design.md "Abertura: partida do motor").
  Sessão de 2026-09-19: **abertura da volta em cortina** — a transição virou a abertura da seção da
  volta e "The circuit." vai para o canto do palco enquanto ele sobe (design.md, "Abertura da volta:
  cortina") — e **tela de som** ("Born to be heard.", design.md "Tela de som"), com o áudio final (BMW Z3,
  Freesound, CC BY 4.0; design.md "Áudio final"). Sessão anterior (2026-09-18): TBT do desktop corrigido, checagem de acessibilidade (contraste
  sobre o 3D, Pause na volta, preloader `inert`), crédito do modelo no footer e o carro refeito a
  pedido do usuário — pipeline do modelo corrigido (o `dedup` fundia os materiais), acabamento por
  peça, detalhes (letreiro cromado, pinças e calotas lime, luzes acesas, lanternas vermelhas, sem
  placa), sombras por roda e box de pit no piso. Tudo em design.md ("Carregamento sem tarefas longas",
  "Acessibilidade", "Leitura do carro", "Profundidade", "Detalhes").
- **Lighthouse** (2026-09-19, depois da abertura; `vite preview` + Edge headless via `npx lighthouse@12`):
  - Mobile (lite): **100 / 100 / 100 / 100** nas 3 rodadas (TBT 12–13 ms); peso 346 KB.
  - Desktop (full): **97–99 / 100 / 100 / 100** (TBT 81–140 ms). Comparado lado a lado com o commit
    anterior (build do HEAD numa worktree, rodadas alternadas): 100 / TBT 55–82 contra 99–100 / TBT 81–97.
    ~20 ms a mais, numa tarefa do chunk `stage` aos ~0,4 s; não investigado. Rodadas isoladas de 83–87 aparecem com
    a máquina ocupada (captura de imagens, laboratório aberto); repetir sem carga antes de concluir.

### ▶ Próxima rodada: Bloco 6 — upgrades (planejado em 2026-09-19)

Plano aprovado em 3 dias, no fim deste arquivo. Decisões em design.md ("Rodada de upgrades"). Começar
pelo P0 (prévia do link), antes de o post do LinkedIn circular.

### Próximos passos, em ordem (combinado em 2026-09-18)

1. ~~Ritmo entre "The circuit." e a volta~~ — feito em 2026-09-19 (cortina, variante C).
2. ~~Tela de som~~ — feita em 2026-09-19, com o áudio final (BMW Z3, `public/audio/engine-start.mp3`).
3. ~~Motion do hero/preloader~~ — feito em 2026-09-19 (abertura como partida do motor).
4. ~~Deploy na Vercel~~ — feito em 2026-09-19.
- Opcional: os ~20 ms de TBT a mais no desktop depois da abertura (tarefa no chunk `stage`).
- Opcionais, sem efeito na nota: baixar o GLB em paralelo com o `createStage` (carro ~1 s antes);
  pré-compilar o palco da volta (bloqueia ~380 ms ao chegar perto); GLB de 7,7 MB acima da meta de ~5 MB.
- Em aberto por decisão: o preloader anuncia cada porcentagem (`role="status"`); emblema da Toyota
  discreto (regra "Sem logos oficiais").
- Não visto no navegador: a animação do reveal depois da troca do `aria-label`.

### Ferramentas desta sessão

- `tools/lookLab.html` (com `npm run dev`): `?set=look|finish|page|parts|details|normals|frame`,
  `?shots=` (capítulos e closes `nose`, `tail`, `wheel`, `headlight`), `?model=` (GLB candidato em
  `public/models/`), `?models=a.glb,b.glb` (compara GLBs, uma linha por modelo, com a pintura da página). Compara variantes lado a lado, destaca materiais e mede onde o carro cai no quadro.
- `tools/capture.html` regrava as imagens do lite (`public/shots/*.webp`) depois de qualquer mudança no
  carro. `tools/shareCard.html` faz o mesmo com a imagem de compartilhamento (`?save=a` →
  `public/shots/og.jpg`).
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
- **A própria página aberta envenena o Lighthouse, e agora o tempo todo.** Com a câmera na mão o palco
  desenha sem parar enquanto a zona 3D está na tela, então uma aba esquecida no painel consome GPU
  indefinidamente — não só durante uma captura. Uma série medida assim deu desktop 72 / 93 / 96 contra
  87 / 93 / 99 da referência; fechada a aba e parado o dev server, deu 99 contra 99 nos quatro pares.
  Antes de medir: fechar as abas do painel e parar o dev server.
- Lighthouse no Windows termina com `EPERM` ao apagar a pasta temporária; os relatórios saem mesmo assim.
  **E deixa o Edge headless vivo:** depois de ~30 rodadas eram 1.266 processos `msedge` e a memória
  acabou (o Vitest caiu com "heap out of memory" e contou 135 testes). Depois de cada série, encerrar
  os `msedge.exe` cuja linha de comando contém `lighthouse` (o perfil temporário); os outros são o Edge
  do usuário.
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
- [x] Motion do hero/preloader (pedido do usuário, 2026-09-19): variantes comparadas lado a lado na página
  real (laboratório temporário, apagado); escolhidos carregamento em linha e título "ignição"; depois,
  quatro refinamentos (som com ambiente e cauda, faróis piscando, "respira", abertura em etapas).
  Detalhes em design.md ("Abertura: partida do motor").
  - 🧪 `lib/heroEntrance.js` (4), `lib/ignition.js` (6), `lib/loudness.js` (4), `lib/impulse.js` (4).
  - 👁 1152×720: som agendado para 1,5 s, grafo com graves e reverb, título aos ~1,95 s do clique e
    restaurado como texto; faróis medidos apagados até 0,72 s, acesos 0,15 s, apagados 0,2 s, acesos de
    vez; capturas apagado × aceso distintas. 375 px (lite): som no clique, título aos ~0,45 s, sem
    overflow. Console limpo. O movimento contínuo foi visto pelo usuário no navegador dele.
  - Corrigido no caminho: o `AudioContext` criado no clique travava ~200 ms (som atrasado); passou a ser
    criado no primeiro movimento do ponteiro/toque/tecla (15 ms do clique ao som, TBT intacto).
  - Recorte do som refeito: 0–9 s, 145 KB. Imagens do lite não regravadas (o carro aceso não mudou).
  - Lighthouse: mobile 100 × 3; desktop 97–99 (ver "Retomada").
- [x] Deploy na Vercel (2026-09-19): repositório público `iajuss/gr-supra-gt4` com README em inglês;
  importado pelo usuário no painel da Vercel (preset Vite, `npm run build`, saída `dist`, sem variáveis).
  - Conferido no ar: página, GLB (`model/gltf-binary`), áudio, Draco `wasm`; modo full abre, console limpo.
  - Lighthouse em produção, rodadas alternadas com o build local para separar a máquina do site: as
    duas oscilam juntas (89–91 numa dupla, 99–100 na outra; produção 100 com TBT 39 ms). Mobile 92–100.

## Bloco 6 — Upgrades de qualidade (3 dias, planejado em 2026-09-19)

Ponto de partida: `6768e5c`, 240 testes. Decisões e motivos em design.md ("Rodada de upgrades").
Cada item visual passa pelo laboratório (`?lab-...` temporário, iframes da página real), uma coisa de
cada vez; os parâmetros saem depois da escolha. Push para o `main` publica: confirmar antes de cada um.

**Não pode regredir:** Lighthouse mobile 100 e desktop ≥ 97; contraste ≥ 4,5:1 no quadro renderizado;
reduced motion → página parada; Pause na volta; ordem do foco; lite sem Three.js; `AudioContext` no
primeiro movimento.

**Referência para medir:** worktree de `6768e5c` servida em outra porta; Lighthouse em rodadas
alternadas (3 pares por modo). FPS com o painel visível em 1152×720 (média, p95, pior quadro), rolando
a zona 3D e parado num capítulo.

### Dia 1 — prévia do link, CI e peso
- [x] **P0** Prévia do link (2026-09-19): `og:*` com URLs absolutas, `twitter:card=summary_large_image`
  e `canonical` no `index.html`. Imagem `public/shots/og.jpg` (1200×630, 57 KB) gerada por
  `tools/shareCard.html`: renderiza a cena e compõe o kicker (encurtado para "// Unofficial concept ·
  Track only"), "SUPRA" e o endereço com as fontes da página. Variantes A (hero), B (frente baixa) e
  C (perfil) comparadas; escolhida a **A**. `?save=<id>` grava pelo `shotServer`, que passou a aceitar
  `.jpg`. Regravar quando o carro mudar (bloom, peso)
  - 👁 tags e imagem no `dist`; 240 testes. Falta: LinkedIn Post Inspector depois do deploy
- [x] **P0** Comentário truncado no topo de `components/ignitionShow.js`
- [x] CI no GitHub Actions (`.github/workflows/ci.yml`): `npm ci`, `npm test`, `npm run build` a cada
  push no `main` e em pull requests, Node 24; selo no README. O lockfile já traz os binários nativos
  de Linux (rolldown, lightningcss)
- [x] Carro mais leve (2026-09-19): **7,7 → 5,6 MB**, 3,54M → 2,08M triângulos. O GLB já usava Draco
  e só tinha `POSITION` + `NORMAL`; o peso era a lataria não simplificada. Agora ela passa por
  `simplifyWithAttributes` do meshoptimizer (1.2) pesando as normais (`BODYWORK_SIMPLIFY` no
  `optimize.mjs`: metade dos triângulos, erro 0,001, peso 1). O script reproduz o GLB byte a byte
  - Variantes (lataria a 50 / 30 / 20%): 5,6 / 4,3 / 3,9 MB. Comparadas no novo
    `tools/lookLab.html?models=a.glb,b.glb` (uma linha por modelo, pintura da página) em perfil,
    frente e traseira: 50% e 30% iguais ao atual; 20% com vinco no capô e ondulação na tampa.
    **Escolha do usuário: 50%**, a mais segura, acima da meta de 5 MB por 0,6 MB
  - 📏 FPS em 1152×720, página recém-carregada, rolagem programada de 4 s do hero à transição
    (inclui a montagem da volta 3D), dois pares alternados: antigo 61 / 61 FPS, p95 18,4 / 24,1 ms;
    novo **74 / 79 FPS, p95 18,3 / 18,2 ms**. Console limpo
  - 📏 Lighthouse no build, rodadas alternadas contra o mesmo `dist` com o GLB antigo: desktop novo
    99 / 99 / 99 (TBT 86–108 ms, peso 5,9 MB) × referência 99 / 98 / 97 (TBT 110–143 ms, 8,0 MB);
    mobile 100 nos dois (o lite não baixa o carro). Acessibilidade, práticas e SEO 100 em tudo
  - Imagens do lite e `og.jpg` não regravadas: o carro não muda à vista; ficam para depois do bloom
  - Quantização do Draco não testada (a meta de peso ficou para trás na escolha do usuário)

### Dia 2 — imagem de cinema
- [x] Bloom no palco do carro (2026-09-19), **seletivo**: só as luzes do carro brilham
  (`scene/bloom.js`, valores em `data/carStage.js`). Render sob demanda mantido
  - O plano (limiar alto num composer com MSAA) não serviu: os reflexos dos spots no verniz passam do
    brilho dos faróis, e mesmo com limiar 4 viravam manchas leitosas (`lookLab ?set=bloom`)
  - Seletivo pela cena inteira num composer MSAA meio float: **34 FPS** rolando (sem bloom, 76). O MSAA
    em meio float custava ~12 ms; a segunda passada com a lataria real em preto (~2M triângulos) ~6 ms
  - Solução: a cena vai direto ao canvas, como antes; o brilho é feito à parte, a ¼ da resolução, só
    das luzes, escondidas atrás da lataria por uma **silhueta** grosseira (`OCCLUDER`, 53 mil
    triângulos, nunca desenhada no quadro; +187 KB no GLB, 5,75 MB), e só o desfoque é somado por cima.
    Tentado antes: só as faces das luzes viradas para a câmera (as lanternas vazavam pela cabine)
  - 📏 69 FPS rolando, mediana 12,2 ms e p95 18,3 ms, iguais a sem bloom. Console limpo
  - 👁 hero, aero, chassis e engine lado a lado (sem / mínimo / suave / médio); **escolha do usuário:
    suave** (força 0,4, raio 0,25)
  - 📏 TBT: compilando os shaders do bloom na hora do primeiro quadro, desktop 70 / 87 / 90 (TBT até
    1,3 s). Pré-compilados no `prepare`: 80–99, uma tarefa de ~350 ms quando um quadro chegava antes da
    compilação; com o bloom esperando os shaders: 93–99 (~60 ms de montagem dos shaders na carga).
    **Solução: o bloom liga no primeiro movimento / toque / tecla** (como o `AudioContext`), bem antes
    de os faróis acenderem. Final, alternado com o publicado (`b90aeed`, worktree): **98 / 99 / 99 / 98**
    (TBT 101–128 ms) × 99 / 98 / 91 (85–242 ms); mobile 100
  - 👁 build em 1152×720: movimento real do mouse + clique em "Enter without sound" → ~14 passadas de
    tela cheia por quadro (o bloom ligado). As ferramentas (`capture`, `shareCard`, `lookLab`) ligam o
    bloom com `view.activateBloom()`
  - Não visto quadro a quadro: o bloom piscando junto com os faróis na abertura (mesmo material, então
    segue por construção)
- [x] 🧪 `lib/quality.js` (2026-09-20): orçamento explícito de quadros. Decide **uma vez**, depois da
  abertura, e não volta atrás; o que cai é, nesta ordem, a **câmera na mão** e depois o **bloom** — a
  mão é o que desenha para sempre e é a perda menos visível, o bloom é assinatura. Regra pura em
  `lib/quality.js`, laço em `scene/qualityBudget.js`, alavancas novas `view.dropBloom()` e
  `handheld.park()`
  - **O limiar do plano não servia como escrito.** "p95 acima de ~20 ms" confunde esforço com vsync: o
    intervalo entre quadros é travado pela tela, então 16,7 ms é um 60 Hz perfeitamente saudável e o
    orçamento castigaria justo os monitores comuns que deveria proteger. Virou **quadros perdidos
    relativos ao ritmo da própria tela**
  - O ritmo sai do **quartil inferior** dos intervalos, não da mediana: metade dos quadros pode
    atrasar sem mover um quantil baixo, enquanto a mediana subiria junto e esconderia o engasgo
  - Dois tetos, cada um tapando um buraco da métrica relativa: o ritmo é limitado a 21 ms (máquina que
    não alcança nenhuma tela plausível está lenta o tempo todo, e nada se destacaria como perdido) e um
    piso absoluto de 20 ms (👁 **achado no navegador:** a 164 Hz perder um quadro é 12 ms, ou seja
    80 FPS; sem o piso a máquina boa levava veredito `still` com `missed: 0.111`)
  - **Julga depois da abertura, não durante.** 👁 medido: o veredito caía em 1,76 s, em plena ignição,
    que é o momento mais pesado da página — quem engasgasse só na partida perderia a mão para sempre.
    `ignitionShow.play()` passou a devolver uma promessa e o orçamento espera por ela
  - 📏 Os três vereditos forçados por chave temporária (removida), contando desenhos por canvas:
    `full` desenha ~4.300/s parado; `still` zera parado e faz 1836 desenhos numa rolagem padrão;
    `plain` zera parado e faz **1089** na mesma rolagem, 41% menos — a passada do bloom sumiu mesmo
  - 🧪 16 testes: lê o ritmo da tela em vez de um milissegundo fixo, deixa 60 Hz e 164 Hz saudáveis
    em paz, aguenta engasgo isolado, tira a mão a um quinto de quadros perdidos e o bloom a um terço,
    ignora pausa de aba, não fala antes de ter amostra, não se deixa enganar por quadros selvagens ao
    estimar o ritmo, pega a máquina lenta o tempo todo e não altera o que recebe
- [x] Grão e vinheta em CSS (2026-09-19, `styles/sections/film.css`): pseudo-elementos do palco fixo
  (full, abaixo de todo o texto) e das figuras dos capítulos (lite). Ruído SVG embutido, sem download;
  o grão se mexe 8×/s só por `transform` (compositor) e para com reduced motion
  - 👁 variantes montadas em canvas com o mesmo ruído e a mesma mistura, sobre o quadro real, em 1:1 e
    ampliadas (pelo celular o grão não aparecia em tamanho real). **Escolha do usuário: B** (vinheta 50%)
    e grão se mexendo; avaliar de novo no notebook
  - 📏 contraste no quadro renderizado (p98 atrás de cada texto do hero, pior caso do ruído): a primeira
    versão, com `overlay`, clareava o piso e derrubava kicker 5,25 → 3,90, "Track only" 4,96 → 3,69 e
    frase 5,40 → 4,27. Trocada por `multiply` com o ruído em tons claros: o filme só escurece, e todos
    sobem (kicker 5,46, "Track only" 5,16, frase 5,57). Escurecimento do grão 0,7–10,6%, média 5%
  - 📏 FPS rolando em 1152×720: 78, mediana 12,1 ms, p95 18,2 ms (igual). Lighthouse no build: desktop
    93 / 99 / 99 (a primeira rodada fria), mobile 100 / 100, CLS 0
  - 👁 375 px: vinheta nas figuras, grão animado, sem rolagem horizontal; console limpo
- [x] 🧪 Câmera em spline (2026-09-20, `smoothShotAt` em `lib/math.js`): a lista inteira de paradas
  vira uma curva só, em vez de um movimento reto por par. Passa exatamente por cada parada, mas sem a
  quebra de velocidade ao chegar nela. Interpola em volta do carro, como o `lerpOrbit` faz para um par
  (ângulo desenrolado, raio, altura), mais alvo, fov e offset
  - **Fritsch–Carlson, não Catmull-Rom:** a spline monótona não deixa nenhum trecho ultrapassar os
    vizinhos. É isso que impede a câmera de chegar mais perto do carro no meio do movimento — a
    Catmull-Rom faria justamente esse desvio na meia-volta do hero para o aero
  - 🧪 10 testes novos: passa pelas paradas, sem quebra de velocidade nos dois lados de cada uma,
    nunca abre nem fecha mais que as paradas vizinhas, paradas desiguais, corte fora da faixa; e o
    `cameraShots.test.js` repete a folga do carro sobre a curva, com os pontos reais
  - 👁 arco × spline rolando a mesma página (flag temporária `?camera=arc` no `cameraRig`, removida
    depois). **Escolha do usuário: spline.** `mode=full`, console limpo, 250 testes. O `lookLab` ganhou
    `?set=path` com `?shots=p:<0–1>`, que amostra o próprio caminho no meio dos movimentos
- [x] 🧪 Câmera na mão (2026-09-20): `lib/handheld.js` puro — `handheldAt` devolve a deriva em -1–1 por
  eixo (três senos de períodos que não se encaixam, pesos somando 1, então o limite é garantido por
  construção e não por corte) e `applyHandheld` re-mira o shot **girando só o olhar**: a câmera não sai
  do lugar, a distância até o carro é a do capítulo e o `offsetTarget` segue valendo. O laço vive em
  `scene/handheldCamera.js`, entre o rig e o palco; enquanto roda é o **único** que escreve na câmera,
  senão um quadro cairia meio tremido. Valores em `data/carStage.js`
  - 👁 amplitudes comparadas na página real (chave temporária `?hand=off|a|b|c`, removida depois):
    sem, 0,20°/0,12°, 0,35°/0,20° e 0,60°/0,35°. **Escolha do usuário: B** (0,35°/0,20°, ~7 px de
    deriva no quadro), entrada de 1,2 s
  - 📏 FPS **parado** em 1152×720, o número que decidia o item: hero **156** e chassis **138**, mediana
    6,1 ms e p95 12,2 ms nos dois — a tela do notebook é de ~164 Hz e a mão não perde o vsync
  - 📏 O laço para mesmo fora da zona 3D: 825 quadros gravados depois dela (logo o rAF estava vivo) e
    **zero** desenhos do canvas do carro, contados por canvas — a volta tem palco próprio e contaminava
    a conta total
  - 📏 Rolando o hero → transição em 4 s: 108 / 106 FPS, mediana 6,2 / 12,0 ms, p95 12,3 ms. Sem
    regressão; não dá para cravar melhora porque a referência anotada (78, 12,1, 18,2) incluía a
    montagem da volta 3D na mesma passada
  - **O custo real não é taxa de quadros, é GPU contínua:** 27 chamadas de desenho por quadro enquanto
    a zona 3D está na tela, onde antes eram 0 em repouso
  - 📏 Lighthouse no build, 4 pares alternados contra `e9c1695` numa worktree: **desktop 99 nos quatro
    pares dos dois lados**, TBT novo 91–119 ms contra referência 95–110 ms — faixas sobrepostas, sem
    regressão. Mobile 100 / 100 / 100 / 100 (TBT 12–15 ms, CLS 0): o lite não carrega Three.js, então
    a mão nem existe lá
  - 🧪 14 testes (264 no total): começa exatamente parada, determinística, nunca sai de -1–1, usa a
    faixa que tem, nenhum atraso traz o movimento de volta, os dois eixos não balançam juntos, a entrada
    é uma fração do movimento e termina sem degrau; e, do lado do shot, amplitude zero devolve o shot
    intacto, a posição nunca muda, a distância se mantém e o giro bate com a amplitude pedida
- Profundidade de campo: fora, a menos que sobre tempo (caro, borra perto do texto)

### Dia 3 — aero, celular e entrega
- [x] 🧪 Fluxo de ar no capítulo aero (2026-09-20): `lib/airflow.js` puro — `streamlines` monta o leque
  a partir das medidas do carro, `pointAt` diz onde uma marca está em cada instante (laço sem emenda) e
  `nearStop` diz quanto do efeito pertence àquele ponto da rolagem. Cena em `scene/airflow.js`: o leque
  inteiro num único `LineSegments`, com a marca correndo feita no shader
  - 🧪 18 testes. O invariante do plano é o principal: **nenhum ponto de nenhuma linha entra na caixa
    do carro** — o ar sobe no nariz, passa o teto com a folga pedida e assenta atrás; as faixas laterais
    são empurradas para fora, nunca para dentro
  - 👁 linhas × pontos comparados na página real (chave temporária `?flow`, removida).
    **Escolha do usuário: linhas**, que desenham a forma do carro mesmo paradas
  - 🐛 **O gatilho estava grosseiro e o usuário pegou:** prendi o fluxo a um `IntersectionObserver` na
    seção aero, que tem 1008 px contra 720 de tela e por isso "está visível" por quase toda a zona 3D —
    o ar aparecia fora do capítulo. Agora segue a **posição da câmera** (`nearStop`, alcance 0,11 do
    caminho, com as paradas a ~0,25 uma da outra), acendendo e apagando em desvanecimento
  - 🐛 **Vazamento no bloom, achado medindo:** `lampsOnly` só escondia `isMesh`, e `LineSegments` não é
    mesh — as linhas entravam na passada de brilho e **brilhavam**, contra a regra do bloom seletivo.
    Corrigido para cobrir linhas e pontos. **Escolha do usuário: sem halo**
  - 📏 O porteiro, contado por canvas: **27 desenhos por quadro fora do capítulo, 37 dentro** (hero
    27,0 · aero 37,4 · chassis 27,1)
  - 📏 Custo do efeito, três passadas estáveis na parada do aero: **137 → 108 FPS**, mediana 6,2 ms,
    p95 18,1 ms. É o item mais caro da rodada, e por isso **cai junto com a câmera na mão** quando o
    orçamento aperta (escolha do usuário)
  - Reduced motion não chega aqui, como na câmera na mão: ele manda a página para o modo leve
  - Amarrar o fluxo ao som do motor foi levantado pelo usuário e **descartado por ele** depois de ver o
    efeito só no capítulo: o motor toca uma vez só, na abertura, com a câmera no hero
- [x] Vídeo curto no hero do lite (2026-09-20): `public/video/hero.mp4`, **769 KB**, 720×1280, 6 s,
  180 quadros, H.264 **sem trilha de áudio**; pôster de 12 KB. Mudo, em laço, `playsinline`, e só
  carregado depois do clique na tela de som. Regra pura em `lib/heroMedia.js` (🧪 9 testes),
  componente em `components/heroMedia.js`
  - **O plano partia de uma premissa falsa:** "a imagem atual como pôster" — o hero do lite não tinha
    imagem nenhuma, era só tipografia sobre preto (verificado no DOM). O item virou, com decisão do
    usuário, **acrescentar** uma imagem em movimento atrás do título, espelhando o desktop, onde o
    mesmo texto já fica sobre o carro. O pôster também teve de ser gerado
  - **Prato giratório de 360°**, de propósito: o laço fecha por construção, sem corte nem fade. A
    câmera na mão não serviria de base, porque por construção ela nunca repete
  - Pipeline sem Playwright: `tools/heroClip.html` grava 180 quadros pelo `shotServer`, que ganhou um
    destino em `.frames/` (fora de `public/`, no `.gitignore`); o ffmpeg junta. **WebM foi tentado e
    descartado por não compensar**: VP9 deu 740 KB contra 471 KB do H.264 no mesmo CRF de partida.
    Com folga no orçamento, o CRF final foi 24 (769 KB) em vez de 28 (471 KB), porque o risco aqui é
    banding em degradê escuro
  - 📏 **Contraste no quadro composto, ao longo de toda a volta** (critério do bloco, ≥ 4,5:1):
    título 14,27 · lead 11,87 · cue 5,92 · **kicker 5,47**. O kicker reprovava com 3,69: ele cai em
    65–69% da altura, em cima da poça de luz do piso, e a cor dele tem teto de 6,18:1 **mesmo sobre
    preto puro**. Escolha do usuário entre três opções medidas: um cinza intermediário só sobre a
    imagem, que dá 5,47 — praticamente o 5,46 que ele já mede no desktop — em vez de esconder o
    clipe atrás de uma tarja de 90%
  - 👁 375 px: nada baixado antes do clique (zero pedidos), depois vídeo tocando, mudo, em laço, sem
    rolagem horizontal; full intacto (slot `display:none`, zero pedidos). Console limpo
  - 📏 Lighthouse mobile no build, máquina limpa: **100 / 100 / 100** (a primeira rodada fria deu 82),
    TBT 34–44 ms, LCP 1,51 s, peso 349 KB contra os 346 KB de antes. O relatório confirma que **o
    vídeo não é pedido em nenhuma rodada**: o Lighthouse nunca clica na tela de som. Ressalva para a
    rodada final: o TBT do celular era 12–15 ms antes deste item e agora é 34–44 — a nota segue 100
    (o limite é 200 ms), mas o aumento é real
- [x] Imagens do lite regravadas (2026-09-20, com autorização): as três de `public/shots/*.webp` por
  `tools/capture.html` e a `og.jpg` por `tools/shareCard.html?save=a` — agora com o bloom nas luzes,
  pendentes desde o Dia 1
- [ ] Lighthouse CI no workflow, **informativo** (não bloqueia: o runner oscila)
- [ ] 📏 Rodada final: Lighthouse alternado contra a referência, FPS, peso da página; números na Retomada
- [ ] README: seção "Making of" (bastidores, métricas, antes e depois, link para o vídeo)
- [ ] Vídeos de divulgação regravados (Playwright é download → pedir autorização)

**Fora desta rodada:** o Supra na pista da volta, o som seguindo a telemetria (com botão de som no
header), a página de case e a versão em português.
