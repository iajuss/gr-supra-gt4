# Plano de implementação

## ▶ Retomada (atualizado em 2026-09-17, fim da sessão da troca de carro)

- **O carro mudou: Vulcan → Toyota Supra MK5.** Não foi decisão de design: o Sketchfab quebrou o
  cadastro na migração para a KitBash e não existe Vulcan gratuito com malha utilizável em nenhum
  acervo. Motivos e alternativas verificadas em [design.md](design.md).
- **Estado do código:** a troca de carro foi commitada em `1c364f5` + `93ae51e`. O ajuste de luz e
  enquadramentos (passo 5 do Bloco 4) veio depois; confira com `git log` se já foi commitado.
  166 testes verdes.
- **O que já funciona:** o Supra carrega no palco (13 malhas, 3.551.233 triângulos, 7,9 MB), na escala
  e orientação certas, pintado na paleta carbono + lime por nome de material, com sombra de contato.
  Console limpo.

### Próximos passos, em ordem

1. ~~**Luz e enquadramentos**~~ — feito em 2026-09-17 (ver passo 5 do Bloco 4).
2. ~~**Recapturar as imagens do lite**~~ — feito em 2026-09-17.
3. **Reescrever o conteúdo para o Supra** — a página ainda diz "VULCAN / Seven litres. Twelve
   cylinders." com um Supra na tela. Trocar título, kicker (`// TRACK ONLY · V12 7.0 · 24 UNITS`), os
   três capítulos e a SPECS, com números conferidos em fontes públicas e a tabela do design.md
   atualizada. O 2JZ do MK4 não serve: o MK5 (A90) é B58 3.0 turbo.
4. **Passo 4 do Bloco 4 (preloader)** — agora faz sentido, porque há 4 MB de GLB para carregar:
   `lib/loader.js` com progresso real e `components/preloader.js`. O `createCar` já aceita
   `{ onProgress }`.
5. **Bloco 5** — polimento, créditos, acessibilidade, Lighthouse, deploy.

### Pendências que bloqueiam o deploy

- **Licença do modelo indeterminada:** "Custom License (no AI)" sem termos publicados. O usuário optou
  por seguir assim; resolver antes de publicar (perguntar ao autor `mariobelmonte141` no CGTrader ou
  trocar por um Royalty Free).
- O footer precisa dos créditos finais, que dependem dessa decisão.

### Dicas do ambiente

- Com o painel do navegador oculto, `requestAnimationFrame`, `IntersectionObserver`, `ResizeObserver` e
  o lazy loading de imagens não rodam, e as capturas saem pretas. **Aba em segundo plano mente igual**:
  uma medição de downloads chegou a dar "0" falso por isso.
- Para forçar o modo full: emular 1440×900 e recarregar. O app limpa a emulação quando a largura do
  painel muda, então vale reemular antes de cada recarga.
- A porta 5173 costuma estar ocupada por um dev server de outra sessão, que serve módulos em cache.
  Use a entrada `vite-dev-auto` do `.claude/launch.json`, que sobe em 5174.
- Capturar a cena antes do `ResizeObserver` enquadra contra o canvas padrão de 300×150.
- Uma volta dura 12 s; para pegá-la correndo, agrupar clique + espera + leitura num único lote.

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
   - [ ] `lib/loader.js` (GLB/HDR com progresso) + `components/preloader.js` com progresso real
   - [ ] Falha no carregamento cai para o modo lite, como o `main.js` já faz com o 3D da volta
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
- [ ] Transições do hero/preloader e ritmo do motion
- [ ] Footer com créditos (modelo CC-BY, traçado, fontes)
- [ ] Acessibilidade: foco, contraste, textos alternativos, ordem de leitura
- [ ] Lighthouse no build (metas em design.md)
- [ ] Deploy (definir: Vercel / Netlify / GitHub Pages)
