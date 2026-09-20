# Design — Toyota GR Supra GT4 LP

Status: aprovado em 2026-09-17.

## Conceito

- Landing page **fan-made** do **Toyota GR Supra GT4** (só para pista, 6 em linha turbo, asa grande).
- Nasceu como LP do Aston Martin Vulcan; o carro mudou por falta de modelo 3D utilizável
  (ver "Troca de carro: Vulcan → Toyota Supra MK5").
- Conteúdo em inglês. Sem logos oficiais; aviso "Unofficial fan-made concept. Not affiliated with,
  endorsed by or connected to Toyota Motor Corporation or Toyota Gazoo Racing."
- Objetivo: peça de portfólio para divulgar no LinkedIn.

## Direção visual — Carbono + Lime

| Token        | Valor     | Uso                          |
|--------------|-----------|------------------------------|
| `--bg`       | `#0A0B0A` | fundo carbono                |
| `--text`     | `#F2F2EE` | texto off-white              |
| `--accent`   | `#C6FF00` | lime de telemetria (ver "Paleta: mantida") |
| `--support`  | `#1F3D2B` | racing green escuro          |

- Títulos e números: **Big Shoulders Display** (variável 100–900; hero 900, títulos 800, números 700).
  Escolhida depois de comparar com Anton: mais técnica/industrial e mais legível nos números.
- Labels e telemetria: **JetBrains Mono** (variável).
- Texto corrido: fonte do sistema (`system-ui`), sem download extra.
- Fontes hospedadas no próprio site via `@fontsource-variable`. O navegador baixa só os subconjuntos usados.

## Estrutura da página

0. **Preloader** — `LOADING_TELEMETRY — NN%` e uma linha lime com o progresso real do modelo; depois
   dele, a tela de som (ver "Tela de som"); a página abre como um carro dando partida (ver "Abertura:
   partida do motor").
1. **Hero** — Supra em 3/4 de frente, piso escuro reflexivo, "SUPRA" gigante,
   `// UNOFFICIAL CONCEPT · TRACK ONLY · 3.0 TURBO · 100+ BUILT`, `SCROLL TO DRIVE ↓`.
2. **01 — AERO** — close da asa traseira e difusor.
3. **02 — CHASSIS** — dianteira e splitter, rente ao chão.
4. **03 — ENGINE** — 3.0 L, 6 em linha, um turbo (era `V12` na versão Vulcan).
5. **Transição** — câmera se afasta, carro escurece, render 3D pausa. Desde 2026-09-19 é a abertura da
   volta: "Built for one place / The circuit." fica dentro da seção e "The circuit." é o título dela
   (ver "Abertura da volta: cortina").
6. **THE LAP** — traçado real de Silverstone (GeoJSON `bacinger/f1-circuits`, MIT) em Canvas 2D, ponto lime
   percorrendo a volta + HUD (velocidade, marcha, setor, tempo). Inicia ao entrar na tela; botão `REPLAY`.
   Telemetria **simulada**, identificada como tal.
   - Velocidade derivada da curvatura do traçado (suavizado). Volta de 2:10.222 (era ~1:45 com o Vulcan), animada em 12 s.
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
8. **Footer** — aviso fan-made, crédito do modelo 3D (autor, link e licença como publicada), crédito do traçado e das fontes.

### Abertura da volta: cortina (2026-09-19)

Pedido do usuário: entre a transição e o palco da volta havia um cabeçalho comum ("04 — One lap of
Silverstone", 151 px em 1152×720), que quebrava o ritmo. Três variantes comparadas lado a lado na página
real (laboratório temporário, já apagado): **A** título e dados sobre o palco, com a transição igual;
**B** "The circuit." como título e só label e dados no palco; **C** cortina. Escolha do usuário: **C**.

- **Uma seção só:** a transição (`.handoff`, ainda com `data-shot="transition"`) abre a `section.lap`;
  "The circuit." é o `h2#lap-title`. O cabeçalho comum saiu. Sobre o palco ficam o label
  `04 — One lap of Silverstone` e os dados (Circuit / Length / Corners) no canto superior esquerdo,
  com uma sombra suave no topo do palco; a nota "Telemetry simulated" foi para baixo dos botões.
- **A cortina:** o palco sobe uma tela por baixo da transição e "The circuit." encolhe do centro até o
  canto (metade do tamanho), pousando logo acima do label. O label "Built for one place" só sobe com a
  página.
- **Sem `sticky`:** no laboratório a transição ficava presa, e o `offsetTop` dela passava a mentir
  enquanto presa (3744 → 4104), o que desloca as paradas da câmera no `cameraRig`. Em vez de prender, o
  título recebe no `y` a distância rolada, então na tela ele só faz o próprio caminho. As seções não
  mudam de lugar e a câmera não mudou.
- O caminho é puro e testado (`lib/curtain.js`, `curtainAt`: ease in-out cúbico, compensação da
  rolagem); `components/lapCurtain.js` só liga um ScrollTrigger ao progresso, no modo full, e mede de novo
  quando o título muda de largura (o reveal divide e junta as linhas depois da primeira medição).
- **Âncora "Lap":** o `id="lap"` está no palco (`.lap__layout`); no full a âncora para com o palco
  assentado e o título no canto; no lite, logo abaixo do header.
- **Lite:** empilhado — transição, label e dados, volta 2D.
- O fundo opaco passou da seção para o `.lap__layout`, e no full a seção não tem padding embaixo: senão
  o carro fixo apareceria no respiro sob o palco e o título sairia antes do palco.

### Tela de som (2026-09-19)

Pedido do usuário: depois do carregamento, uma tela pedindo som; tecla, clique ou toque liga o motor.

- **Texto** (centralizado, a pedido do usuário): `// Turn your sound up`, título **"Born to be heard."**
  (escolhido entre quatro frases), "Press any key, click or tap to start the engine" e dois botões:
  **Start the engine** (com foco) e **Enter without sound**.
- **Fluxo:** a tela é a segunda fase do preloader (mesma camada: página `inert`, rolagem travada). Ela
  aparece quando o carro está no palco, aos 8 s numa linha lenta ou numa falha; no lite, logo ao abrir.
  **Espera pela escolha** (é o gesto que libera o áudio no navegador). Qualquer tecla, clique ou toque
  liga o motor; o botão silencioso ou Esc entram sem som; Tab, Shift e atalhos não contam
  (`lib/soundGate.js`). O que acontece depois está em "Abertura: partida do motor".
- **Sem memória da escolha** (a tela aparece em toda visita) e **sem botão de som no header**: só existe o
  clipe da partida. Decisões do usuário.
- **Áudio:** Web Audio, porque o fade precisa de um nó de ganho (no iOS o `volume` do `<audio>` é só
  leitura). O arquivo é baixado e decodificado antes, num `OfflineAudioContext`. **Criar o
  `AudioContext` trava a thread** (~200 ms no navegador do app, ~500 ms no Lighthouse: é o dispositivo
  de áudio abrindo): criado no clique, atrasava o som e congelava a imagem; criado na carga, subia o TBT
  (mobile 12 → ~220 ms). Ele é criado **suspenso no primeiro sinal de intenção** (mover o ponteiro,
  tocar, tecla) e o gesto só dá `resume()`: 15 ms do clique ao som. Decodificar depois do gesto atrasava o
  som em ~2 s com o arquivo provisório. Recorte e fades em `lib/envelope.js`; se o áudio não chegar em
  1,5 s depois do gesto, a página abre em silêncio.
- **Áudio final (2026-09-19):** BMW Z3, "car-start" de Erdie no Freesound (**CC BY 4.0**): pega logo no
  início e acelera. O usuário pediu partida e acelerada rápidas dentro do tempo da tela. Primeiro com o
  trecho 0–5,5 s; depois (ver "Abertura") a gravação até 9 s, voltando à lenta.
  - Busca: nenhum B58/A90/M340i com licença aberta no Freesound. Comparadas no laboratório (temporário)
    gravações curtas com partida e acelerada (Z3, Mercedes 190E-16V, Lotus Elise, BMW M6, todas CC0
    menos a Z3) e uma montagem de dois trechos com crossfade (partida e acelerada do M4, cujo original
    no Freesound é CC0). Escolha do usuário: a Z3, sem edição.
  - Arquivo: `public/audio/engine-start.mp3`, recortado com ffmpeg da prévia HQ pública (o original, MP3
    de 160 kbps, exige login), estéreo 128 kbps, 145 KB com 9 s (o provisório tinha 4 MB e vinha do CDN
    do Pixabay). Os fades continuam no código (`lib/envelope.js`), não no arquivo.
  - Crédito no footer, **só porque a licença pede** (decisão do usuário: CC0 ficaria sem crédito): título,
    autor com link, licença com link e "trimmed" (a CC BY exige indicar a alteração).

### Abertura: partida do motor (2026-09-19)

Pedido do usuário: motion do hero e do preloader. Variantes comparadas lado a lado na página real
(laboratório temporário com iframes, apagado): carregamento **L1 linha** / L2 contador / L3 shift light;
título **H1 ignição** / H2 letra a letra / H3 tranco (escala e solavanco da câmera). Escolhas: **L1 e H1**.
O usuário achou o resultado "cru" e o som "seco"; vieram quatro refinamentos, todos aprovados.

- **Carregamento:** o label e uma linha lime de 2 px que cresce com o download (`--progress`). Ao
  chegar a 100% o carregamento sobe e some (400 ms) e as linhas da tela de som entram em sequência, o
  título por trás de uma máscara (`gate.css`).
- **A sequência** (`data/opening.js`, segundos a partir do clique), como um carro dando partida:
  1. 0–0,7 s: a tela sai (fade de 600 ms) e a névoa se dissipa em 700 ms; o carro aparece **apagado**.
  2. 0,7 s: **a chave vira** — faróis acesos 0,15 s, apagados 0,2 s, acesos de vez; as lanternas sobem
     depois (`lib/ignition.js`, `lightsAt`).
  3. 1,5 s: o motor dá partida; na **pega** (0,4 s no clipe, o ponto mais alto do volume, medido no
     arquivo: `engineSound.catchAt`) o "SUPRA" sobe de trás da máscara (`lib/heroEntrance.js`); depois o
     kicker, a frase e o "Scroll to drive". No fim o título volta a ser texto simples.
  4. Enquanto o motor gira, **"respira"**: a luz lime do teto cresce com o volume e a câmera se aproxima
     0,35 m, voltando ao enquadramento em 1,5 s depois do clipe (`components/ignitionShow.js`). O volume
     vem da curva do arquivo decodificado (`lib/loudness.js`), então roda igual **sem som**.
  - A primeira tentativa abria a tela e acendia os faróis juntos na pega: "rápido demais, muita
    informação", a piscada não era vista. Separar os momentos resolveu.
- **Faróis apagados de verdade:** zerar só o `emissive` não bastava — a cor base (quase branca nos
  faróis, vermelha nas lanternas) iluminada pelo estúdio continuava parecendo acesa. Apagados, as cores
  vão a `lightsOff` (`data/carStage.js`). Testados e **retirados** a pedido do usuário: um facho de spot
  no chão (virava uma mancha oval longe do nariz) e um halo sobre cada farol ("bolinha de luz demais").
- **Som com espaço:** a gravação inteira (9 s, fade de 2,5 s), num ambiente gerado no navegador — reverb
  por convolução com ruído decaindo (`lib/impulse.js`, semente fixa, sem download) — e +4 dB de graves
  abaixo de 140 Hz. O contexto só fecha depois do eco.
- **Lite** (sem carro 3D): sem luzes nem "respira"; o motor toca no clique e o título sobe na pega.
  Numa linha lenta (a tela de som abre aos 8 s, antes do carro) vale o mesmo.
- **Reduced motion:** cai no lite, e o título e os textos aparecem parados.
- **Sempre do topo** (pedido do usuário): a abertura acontece no hero, então a página não restaura a
  rolagem num F5 (`history.scrollRestoration = 'manual'`), tira a âncora do endereço (`/#lap` abre no
  topo) e volta ao topo de novo no clique da tela de som (`components/startAtTop.js`). O menu segue
  levando às seções depois que a página abre.

## Fontes dos números

A página apresenta o **Toyota GR Supra GT4** (decisão de 2026-09-17): o Supra de corrida da Toyota Gazoo
Racing, só pista, com asa e splitter — casa com o modelo widebody e com a estrutura Aero / Chassis /
Engine. Os valores exibidos ficam no `index.html` (atributo `data-count` na SPECS), que é a única fonte
da verdade; o JS só anima até eles. Conferido em 2026-09-17.

| Dado | Valor na página | Fontes |
|---|---|---|
| Motor | 3.0 L, 6 em linha (2.998 cm³), um turbo twin-scroll | [TGR GT4](https://toyotagazooracing.com/gt4/cars/); B58 pela [Wikipedia](https://en.wikipedia.org/wiki/Toyota_GR_Supra) |
| Potência | 430 hp (320 kW), "varia com o BoP" | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Torque | 650 Nm | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Peso | 1,350 kg, "varia com o BoP" (EVO2: 1.360) | [TGR GT4](https://toyotagazooracing.com/gt4/cars/), [gr-supra-gt4.com](https://gr-supra-gt4.com/) |
| Câmbio | automático de 7 marchas com borboletas, tração traseira, autoblocante | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Freios | Brembo, 6 pistões / disco de aço 390 mm (diant.), 4 pistões / 355 mm (tras.) | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Suspensão | MacPherson (diant.), multilink (tras.), amortecedores KW | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Tanque | célula de segurança de 120 L | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Asa e splitter | compósito de fibra natural | [TGR GT4](https://toyotagazooracing.com/gt4/cars/) |
| Produção | 100 unidades (marco de 2023), lançado em março de 2020 → "100+ units, since 2020" | [Toyota Europe](https://newsroom.toyota.eu/new-limited-series-gr-supra-celebrating-gt4-customer-motorsport-milestone/) |
| Potência por tonelada | 318 hp/t (320 kW / 1.350 kg) contra 224 hp/t do GR Supra 3.0 de rua (250 kW / 1.495 kg sem motorista) → 42% a mais | conta em `lib/units.js`; carro de rua pela [ficha técnica da Toyota UK](https://media.toyota.co.uk/wp-content/uploads/sites/5/2021/03/1614278028210223MGRSupraTechSpec.pdf) (fev/2021) |

- A comparação usa kW para fugir da ambiguidade hp/PS: a Toyota escreve "320kW (430hp)" para o GT4 e
  "335/340/250" (bhp / DIN hp / kW) para o carro de rua.
- Fora da página: velocidade máxima (250 km/h só em fonte secundária, [UltimateSpecs](https://www.ultimatespecs.com/car-specs/Toyota/137259/Toyota-GR-Supra-30-GT4.html))
  e 0–100 km/h.
- **Volta simulada:** `data/supraDynamics.js` calibrado para 2:10.222 em Silverstone GP, 78–226 km/h,
  7 marchas, mantendo as 18 zonas de frenagem. Referência: melhor tempo GT4 no qualifying da British GT
  2024 em Silverstone, 2:08.984 (McLaren Artura GT4). Os valores de aderência e aceleração são
  calibrados pelo resultado, não medidos — o modelo suaviza a curvatura e usa aceleração constante,
  como já acontecia com o Vulcan (2,8 G para 1:45).
- A barra do downforce (96% do peso, dado do Vulcan) virou a barra de **potência por tonelada**: o
  GT4 enche a trilha e um traço marca o carro de rua em 224 / 318 = 0,70.
- O capítulo 03 mudou de `v12` para `engine` (âncora, `data-shot`, ponto de câmera, imagem do lite).

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
  que a página passa por eles: `hero`, `aero`, `chassis`, `engine` (era `v12`), `transition`. Orbital (azimute,
  elevação, distância) foi considerado e descartado: cartesiano é mais fácil de ler e de ajustar com o
  carro real. Se as transições do passo 3 ficarem retas demais, revisitamos.
- **Revisitado em 2026-09-18: a posição agora anda em arco.** A câmera dá meia volta no carro (hero
  à frente, aero atrás, chassis à frente de novo) e a reta entre pontos de lados opostos passava a
  1,9–2,5 m da lataria, cortando o carro no meio do scroll. Os dados continuam cartesianos; só a
  interpolação da posição é cilíndrica em volta do eixo vertical do carro (`lerpOrbit`). Alvo, fov e
  offset seguem lineares.
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

Atualizada em 2026-09-19 (o esboço inicial previa `vulcan.glb`, HDRI e um `loader.js`, que não
vieram a existir).

```
index.html
public/
  models/supra.glb         modelo com Draco (5,75 MB desde o Bloco 6, com a silhueta do bloom)
  draco/                   decodificador Draco
  audio/engine-start.mp3   partida do motor (tela de som)
  shots/*.webp             imagens estáticas por capítulo (modo lite)
src/
  main.js                  ponto de entrada: escolhe o modo, inicia os módulos
  data/                    números e ajustes: câmeras, palco, volta, som, abertura, traçado
  lib/                     lógica pura, cada arquivo com o seu teste (capabilities, math, track,
                           telemetry, lapClock, ignition, loudness, curtain…)
  scene/                   Three.js: renderer, stage, studioEnvironment, car, pitBox, cameraRig,
                           lap/ (palco 3D da volta, com bloom)
  components/              comportamento da página: preloader, soundGate, ignitionShow, heroEntrance,
                           lapSection(3d), lapCurtain, specCounters, textReveal, chapterShots…
  styles/                  tokens, base e um arquivo por seção
tools/                     laboratório, capturas do lite, pipeline do modelo (model/)
```

## Performance

- Metas atuais (desde 2026-09-18): Lighthouse **mobile 100** em tudo; **desktop ≥ 97**, idealmente 100
  (o desktop oscila com a carga da máquina: medir contra um build de referência, em rodadas alternadas).
- Modelo: meta ≤ 5 MB (ideal 3–4 MB); hoje 5,75 MB, por escolha visual e pela silhueta do bloom (Bloco 6).
- Resolução do 3D limitada a 1,5x. Sem sombras em tempo real: sombras de contato em textura fixa.
- Render sob demanda; pausa fora da zona 3D e com a aba em segundo plano. O que desenhar sem parar
  (câmera na mão, fluxo de ar) tem limite explícito: ver "Rodada de upgrades".

### Carregamento sem tarefas longas (2026-09-18)

O TBT do desktop (1,0–1,7 s) era quase todo **compilação de shader na thread principal**, não trabalho
de GPU nem download. Medido com `performance.mark` no build, pelo Lighthouse (cache de shaders frio):
PMREM do `RoomEnvironment` ~600 ms (o filtro GGX sozinho ~420; não muda com a resolução, então é
compilação), primeiro frame com o carro ~360 ms, 3D da volta ~365 ms, primeiro frame do palco ~125 ms.

- **Ambiente com shaders pré-compilados** (`scene/studioEnvironment.js`): antes do `fromScene`, os
  shaders do quarto, do blur e do GGX são compilados com `compileAsync` (compilação paralela via
  `KHR_parallel_shader_compile`), contra o mesmo render target e sem tone mapping, como o `fromScene`
  os usa. O `createStage` virou assíncrono.
  - **Os filtros precisam ser compilados na malha de LOD real.** Com uma geometria vazia, o ANGLE
    (D3D11) montava o shader final para outro layout de vértice e recompilava bloqueando no primeiro
    draw (~330 ms restantes). Com a malha real, o `fromScene` caiu para ~18 ms.
  - Usa campos internos do `PMREMGenerator` (three r186: `_setSize`, `_allocateTargets`,
    `_blurMaterial`, `_ggxMaterial`, `_lodMeshes`). Se sumirem numa atualização, a pré-compilação é
    pulada e o `fromScene` volta a compilar bloqueando: correto, só mais lento. **Conferir o TBT ao
    atualizar o three.**
- **`view.prepare(objeto)`** compila com `compileAsync` antes do primeiro frame do palco e do carro.
- **3D da volta montado só perto da seção** (`lib/whenNear.js`, uma tela de antecedência). O layout 3D
  é aplicado desde o início para não haver salto. O custo (~380 ms) não sumiu: passou para o momento
  em que o usuário se aproxima da volta.
- Resultado: desktop 99 / 100 / 100 / 100, TBT 58–70 ms (era 764–909).
- Medir TBT no navegador do app engana: o cache de shaders do navegador já está quente depois da
  primeira carga (o GGX cai de ~310 para ~5 ms). O Lighthouse usa perfil novo, com o cache frio.

## Acessibilidade (checagem manual, 2026-09-18)

Roteiro no navegador (build, 1152×720 full e 375 px lite). Passaram sem mudança: ordem do foco pelo
teclado, foco visível (inclusive no botão lime pressionado), âncoras da navegação pelo teclado, `alt`
das imagens do lite, anúncio único do HUD no fim da volta, reduced motion → lite.

- **Contraste sobre o 3D se mede no frame renderizado.** O Lighthouse não enxerga o WebGL. Método: copiar
  o canvas no mesmo frame em que ele desenha (hook em `drawElements` + `drawImage` dentro do rAF),
  compor os painéis semitransparentes por cima e comparar a cor do texto com o percentil 98 da
  luminância na área das letras (retângulos do texto, não a caixa do bloco).
- **Labels sobre o palco no tom `--color-text-soft`** (modo full: hero, capítulos, transição e HUD da
  volta). O `--color-muted` ficava em 1,1–4,8:1 sobre as áreas iluminadas. O lite mantém o muted, sobre
  fundo liso. O kicker do hero usa `--color-text`: ele fica sobre o reflexo da key light no piso.
  Resultado: todo texto medido ≥ 4,5:1 (pior caso: o lime de "Track only", 4,74).
- **A volta pode ser pausada** (WCAG 2.2.2: movimento automático com mais de 5 s). Botão Pause
  (`aria-pressed`) ao lado de Restart, nos dois modos; o autoplay continua. A regra de quando a volta
  anda é pura (`lib/lapPlayback.js`): pausar antes do início impede o autoplay, sair da tela e voltar
  não despausa, Restart despausa. Com reduced motion (lite) a volta aparece terminada e os dois botões
  somem.
- **Preloader torna a página `inert`** enquanto a cobre (até 8 s), para o Tab não andar por links
  escondidos. O anúncio da porcentagem a cada mudança (`role="status"`) ficou como está, por decisão.
- O `//` do kicker fica em `aria-hidden`.
- Não testado com leitor de tela real (NVDA); anúncios conferidos pelo DOM.

## Verificação

- **Vitest (TDD)** para lógica pura:
  - normalização do GeoJSON;
  - velocidade e marcha a partir do progresso da volta;
  - interpolação de câmera;
  - contadores;
  - decisão full/lite.
- **Navegador:** desktop e viewport de 375px, console sem erros, modo reduced-motion.
- **Lighthouse** no build de produção.

## Troca de carro: Vulcan → Toyota Supra MK5 (2026-09-17)

O Aston Martin Vulcan foi abandonado por **falta de modelo 3D utilizável**, não por decisão de design:

- O Sketchfab, única fonte com Vulcan em licença aberta, **quebrou o cadastro** durante a migração de
  dono (a KitBash comprou Sketchfab e ArtStation da Epic em 10/08/2026). O login com a Epic abre uma
  página vazia — os assets do portal de contas dão `ERR_CONNECTION_TIMED_OUT` — e o login social
  conclui no provedor e falha no retorno. Reproduzido em navegador limpo, com Gmail e Outlook.
- Fora do Sketchfab **não existe Vulcan gratuito**: zero no TurboSquid, zero no Free3D, zero no Poly
  Pizza e em repositórios abertos. No CGTrader só pagos (US$ 2 a 100).
- O único Vulcan gratuito encontrado (modelo de impressão 3D, CGTrader) tem a **dianteira degenerada**:
  capô e para-lamas com superfícies fragmentadas, faróis inexistentes. Inviável para uma estética que
  desenha arestas.

**Escolhido: Toyota Supra MK5 "personalized"** (CGTrader, gratuito), com body kit widebody e asa GT —
o carro que o usuário queria e que atende ao requisito de aerofólio grande.
Licença: **"Custom License (no AI)", com termos não divulgados** nem na página nem no pacote baixado.
O usuário decidiu seguir assim (2026-09-17); a pendência está registrada abaixo.

### O que o modelo exigiu

- Veio como **cena de render completa**: além do carro, um fundo de estúdio (`Cylinder`, escala 7425),
  uma luz de área (`Area`, escala 8006) e uma `Camera`. Sem removê-los, o `fitToLength` escalava o
  cenário e o carro sumia — o "bloco cinza gigante" das primeiras tentativas era a parede do estúdio.
- 9.450 malhas (uma por peça) e 5.310.866 triângulos → 13 malhas e 3.551.233 triângulos, 7,9 MB com
  Draco. Pipeline documentado em [tools/model/README.md](../tools/model/README.md).
- **A lataria principal não é simplificada.** Simplificada, mesmo de leve, a pintura brilhante fica
  cheia de amassados (o meshopt ignora as normais). Pagamos o dobro de peso (4,0 → 7,9 MB) e perdemos
  uns 15% de FPS (137 → 118 rolando) por uma superfície lisa, que é o que a estética de reflexos
  exige. As demais peças continuam simplificadas. **Revisto em 2026-09-19:** simplificada pesando as
  normais, a lataria perde metade dos triângulos sem amassar (5,6 MB; ver "Rodada de upgrades").
- O conversor FBX2glTF **já corrige Z-up → Y-up**; só faltava um quarto de volta em y para o nariz
  apontar para +x. Uma permutação de eixos por cima disso embaralhou tudo e custou algumas rodadas.
- O GLB chega quase todo off-white: a pintura é aplicada por nome de material em `data/carStage.js`
  (`paint` e `materialRoles`), mantendo a paleta carbono + lime da página.

### Luz e enquadramentos com o carro real (2026-09-17)

- **Carbono brilhante, não fosco.** O carro parecia escuro demais porque o material que o modelo chama
  de `WHEELARCH RUBBER - black` é a maior parte da carroceria, e ele era pintado como pneu. Pintado
  como `body` (metalness 0.85, roughness 0.28), com key 2.2 e ambiente 0.6, a lataria ganha reflexos
  e o body kit se lê contra o fundo.
- **O lime é um brilho no carro, não uma poça no piso.** O spot vem de cima e de trás, mirando o
  centro do carro, de modo que a luz que passa cai embaixo dele.
- **O carro fica no lado livre do texto.** Cada ponto de câmera tem um `offset` (fração da largura do
  quadro) que desloca o olhar para o lado oposto ao texto da seção: hero +0.22, aero −0.22 (era −0.17 até 2026-09-18),
  chassis +0.25, engine −0.15. É calculado pelo aspecto real da tela, e as imagens do lite saem
  centralizadas (lá a figura aparece sozinha).

### Leitura do carro: verniz, recorte e soleira (2026-09-18)

O preto fosco perdia o volume do carro no estúdio escuro (pedido do usuário). Comparadas no laboratório
(`tools/lookLab.html?set=look`, variantes lado a lado em três ângulos): só luz, grafite, grafite com
faixa central e grafite com soleira. Escolha do usuário: **preto com verniz + soleira lime**.

- **Verniz:** a lataria vira `MeshPhysicalMaterial` com `clearcoat` 1 (rugosidade do verniz 0,06) sobre
  preto `0x0e100f`, metalness 0,2 e roughness 0,5. O reflexo nítido do verniz desenha os volumes; o
  preto continua preto. O modelo não tem texturas, então trocar o material não perde nada.
- **Luz de recorte fria** (`lights.edge`, spot branco-azulado de trás e da direita) e ambiente 0,6 → 0,8.
- ~~Soleira lime~~ (faixa desenhada no shader por posição): **retirada** na rodada de detalhes, a
  pedido do usuário — lime chamativo demais; os acentos lime ficaram pequenos e sutis (ver abaixo).
- **Reenquadramento:** com o carro visível, o aero e o chassis encostavam no texto (antes o preto sumia
  no escuro). `offset` do aero −0,22 → −0,245 e do chassis 0,25 → 0,29. Medido projetando os vértices do
  carro pela câmera (`lookLab.html?set=frame`), em 16:10: aero 0,035–0,614 com texto a partir de 0,66;
  chassis 0,36–0,94 com texto até 0,32.
- **Âncoras do menu no ponto da câmera:** a câmera fecha o enquadramento com o capítulo centralizado,
  mas a âncora parava no topo (144 px antes, em 1152×720). `scroll-margin-top: -20svh` nos capítulos
  do modo full (altura 140svh).
- Imagens do lite regeradas com `tools/capture.html`.

### Profundidade: peças separadas, chão e teto (2026-09-18, segunda rodada)

O usuário achou o carro monocromático (farol e espelho da cor da lataria) e flutuando, e o teto parecia
amassado.

- **Causa do monocromático: o pipeline do modelo.** O FBX tem materiais distintos (pintura
  `METALLIC CARPAINT`, `BLACKOUT`, carbono, vidro, caixas de roda), mas o `dedup()` do `optimize.mjs`
  fundia materiais de valores iguais, e o conversor dá os mesmos valores a todos: tudo virava
  "WHEELARCH RUBBER". Corrigido no script (dedup sem materiais) e o GLB regerado: 17 malhas, mesmos
  3,55M triângulos e 7,7 MB. Detalhes em `tools/model/README.md`.
- **Um acabamento por peça** (`paint` e `materialRoles` em `data/carStage.js`): pintura preta com
  verniz; blackout acetinado (grades, raios das rodas, acabamentos inferiores); carbono com verniz,
  um tom acima da pintura; vidro escuro espelhado. Os materiais que só aparecem por dentro ou por baixo
  (`Material.002`, `.003`, `.005`, `a0000…`) ficam como blackout.
- **Ambiente 0,8 → 0,5.** O `RoomEnvironment` é uma sala branca: com o verniz, a pintura preta lia como
  prata. 0,8, 0,5 e 0,3 comparados no laboratório; o usuário escolheu 0,5. (`envMapIntensity` por
  material não serve aqui: no three r186 ele só vale com `envMap` próprio, não com `scene.environment`.)
- **O teto não está amassado:** a imagem de normais mostra a superfície lisa. É o teto *double bubble*
  do GR Supra real; o spot lime mirado no meio do carro formava uma mancha no vale. Agora ele mira a
  traseira (`rim.target` x −1,6).
- **Chão:** sombra de contato mais fechada sob a carroceria e uma escura sob cada pneu (centros achados
  na malha dos pneus por `lib/wheelContacts.js`), e um **box de pit** pintado no piso
  (`scene/pitBox.js`): linhas laterais e de fundo e uma marca de parada lime à frente do bico. As linhas
  laterais somem em degradê nas pontas (`fade` 0,38), porque passavam por baixo do texto do chassis e do
  engine; a marca de parada fica a 0,55 m da ponta do box, fora da coluna do engine.
- Lighthouse desktop depois: 100 / 99 / 100 (TBT 38–49 ms). Uma série anterior deu 83–90 com a máquina
  ocupada pela captura das imagens; repetida sem carga, voltou ao normal.

### Detalhes (2026-09-18, terceira rodada)

Pedido do usuário: detalhes que deixem o carro rico, com lime mais sutil.

- **Peças achadas nos nós do FBX, por posição** (a traseira fica em z negativo): o letreiro "Supra" é o
  `Material.001` (tampa e lateral); as **pinças** são o `Material.002` (uma junto a cada roda, ~32 × 11 cm);
  placa, luz central do difusor, faróis de neblina e calotas estavam juntos no `Material.003`. O pipeline
  agora dá material próprio a esses quatro grupos antes da junção (`DETAILS` em
  `tools/model/optimize.mjs`, pelos nomes dos nós): 21 malhas, 7,7 MB.
- **Acabamentos:** letreiro em cromo polido; pinças e calotas lime com brilho próprio mínimo (0,1);
  faróis de neblina acesos em branco; luz de chuva do difusor acesa em lime; **placa escondida**
  (receita `hidden`), coerente com "No number plate".
- **O emblema da Toyota fica discreto**, esculpido na peça e da cor dela: mantém a regra "Sem logos
  oficiais" (decisão do usuário). Ele não é peça própria no modelo.
- Lighthouse depois: desktop 99 / 100 / 100 (TBT 46–90 ms), mobile 100 em tudo.

**Luzes (quarta rodada, mesmo dia).** Pedido do usuário: LED branco nos faróis e vermelho atrás.

- **Lanternas vermelhas** — a única cor fora da paleta, porque lanterna só se lê em vermelho. Os
  conjuntos das lanternas estavam espalhados em `a0000…` (lado esquerdo) e `Llanta` (direito); o vidro
  delas, fundido com o para-brisa. O pipeline separa os dois (`DETAIL tail light`, `DETAIL tail glass`).
  A barra entre as lanternas (`Material.004`, antes lime) também fica vermelha.
- **Refletores traseiros vermelhos:** o `Material.002` era pinças + refletores do para-choque; as
  pinças ganharam material próprio (`DETAIL caliper`) e o resto virou refletor.
- **LED dos faróis por cima do vidro:** o LED (`Luz blanca1`) fica atrás da lente, que é a mesma peça
  dos vidros das janelas, escura; lido através dela, sumia. O vidro não grava profundidade
  (`depthWrite: false`) e o LED é desenhado depois dele (`overGlass`: passe transparente,
  `renderOrder` 1).
- **As duas neblinas acesas:** uma delas é uma superfície única virada para dentro e sumia vista de
  fora; o material ficou de dois lados.
- Mais lime: considerado e descartado pelo usuário (fica nas pinças, calotas e luz de chuva).
- Lighthouse depois: desktop 100 / 100 / 100 (TBT 36–52 ms).

### Paleta: mantida

O lime `#C6FF00` foi escolhido por ser o verde da Aston Martin Racing, vínculo que caiu com a troca de
carro. Foi mantido mesmo assim (decisão do usuário, 2026-09-17): a página inteira já é coerente nele e
ele funciona como cor de telemetria, não só de marca. Trocá-lo custaria quatro valores
(`--color-accent` em `tokens.css`, mais três constantes em `data/carStage.js` e `data/lapScene.js`),
e o caro seria reconferir as seções no navegador.

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

- **Licença do modelo: seguir sem consultar o autor** (decisão do usuário, 2026-09-18). A "Custom
  License (no AI)" não tem termos publicados; a página dá o crédito ao autor (`mariobelmonte141`, com
  link para o modelo no CGTrader) e cita a licença como publicada. Se um dia for preciso trocar, os
  candidatos Royalty Free verificados são o Supra MK5 "Hyper Realistic" (sem asa grande) e o
  Koenigsegg Jesko (asa enorme).
- ~~Deploy na Vercel~~ — feito em 2026-09-19 (https://gr-supra-gt4.vercel.app).

## Rodada de upgrades (planejada em 2026-09-19)

Objetivo: subir o patamar de qualidade em ~3 dias, com o site já no ar. Plano em
[plan.md](plan.md) (Bloco 6). Decisões do usuário, todas pelas recomendações:

- **Celular: vídeo curto no hero do lite**, não 3D. O GLB tem 3,55M triângulos e 7,7 MB; 3D no celular
  exigiria outra versão do carro e poria o Three.js (e a compilação de shaders) na emulação mobile do
  Lighthouse. O vídeo (loop mudo de 4–6 s, ~1 MB) só carrega depois do clique na tela de som, então
  o lite continua sem Three.js e o Lighthouse mobile não o vê. Com reduced motion fica a imagem.
- **Grão e vinheta em CSS, nos dois modos (feito):** sobre a imagem do carro e abaixo de todo o texto
  (full: o palco fixo; lite: as figuras dos capítulos). Custo zero de GPU do palco, que continua
  desenhando só sob demanda. Vinheta radial de 50% nas bordas; grão em ruído SVG embutido que se mexe
  8×/s por `transform`, parado com reduced motion.
  - **O filme só escurece:** o grão é multiplicado (ruído em tons claros), não sobreposto. Com `overlay`
    ele clareava o piso atrás do texto do hero e derrubava o contraste para 3,7–4,3:1; multiplicado, o
    contraste sobe (medido no quadro renderizado, pior caso do ruído). Custo: ~5% de escurecimento médio.
  - É acabamento, não destaque: aparece na tela grande e em movimento; nas imagens mandadas ao celular
    só se via ampliado. O usuário escolheu a intensidade B e vai reavaliar no notebook.
- **Bloom discreto e físico, só nas luzes (feito):** brilham LEDs, lanternas, neblinas e luz de chuva, e
  nunca a lataria; sem halo em sprite nem facho no chão (os dois já rejeitados).
  - **Por que seletivo:** um limiar de brilho não separa as luzes do verniz. Os reflexos dos spots no
    verniz são mais brilhantes que os faróis, e mesmo com limiar 4 viravam manchas leitosas.
  - **Como, sem custo:** a cena vai direto ao canvas, com o antialias e o tone mapping de sempre. O
    brilho é feito à parte, a ¼ da resolução: as malhas marcadas `glows` pelo `car.js` (as que a ignição
    acende), escondidas atrás da lataria por uma silhueta grosseira que o pipeline gera (`OCCLUDER`,
    53 mil triângulos, nunca desenhada no quadro). Só o desfoque é somado por cima, sem conversão de
    cor, para os rastros fracos não acinzentarem a tela. Como vem das próprias luzes (mesmo material),
    o bloom apaga e pisca junto com os faróis na abertura.
  - Descartados por custo, medidos rolando no notebook: tudo num composer com MSAA em meio float
    (76 → 34 FPS) e a lataria real em preto para esconder as luzes (~6 ms por quadro). Descartado por
    vazar: só as faces das luzes viradas para a câmera (as lanternas apareciam pela cabine).
  - **Intensidade:** a suave de três (força 0,4, raio 0,25), escolha do usuário.
  - **Liga no primeiro movimento do visitante** (mouse, toque, tecla), como o `AudioContext`: montar
    os ~15 shaders do bloom durante a carga custava ~60 ms de thread principal e derrubava o Lighthouse
    desktop para 93–96. Ele fica pronto muito antes de os faróis acenderem (0,7 s depois do clique).
  - Orçamento: o `lib/quality.js` segue no plano, mas o bloom não mudou o FPS (69 contra 76 sem ele,
    mediana igual), então a urgência caiu.
- **Câmera na mão só com o palco visível:** liga com a zona 3D na tela e a aba ativa, entra suave e
  desliga fora dela e com reduced motion. É a primeira coisa que desenha sem parar em repouso.
- **Spline (feita):** a câmera já andava em arco (`lerpOrbit`), mas em movimentos retos entre pares de
  paradas; agora a lista inteira é uma curva só (`smoothShotAt`), que passa exatamente por cada parada
  sem a quebra de velocidade ao chegar nela.
  - **Monótona (Fritsch–Carlson), não Catmull-Rom:** a versião monótona proíbe qualquer trecho de
    ultrapassar os vizinhos, e é isso que impede a câmera de chegar mais perto do carro no meio do
    movimento. Uma Catmull-Rom faria esse desvio justamente na meia-volta do hero para o aero.
  - O previsto era descartar a spline se o laboratório não mostrasse diferença. Mostrou, mas não em
    quadro parado: a diferença é de ritmo e só aparece rolando. A comparação foi feita na página real,
    com uma flag temporária (`?camera=arc`) que roda a câmera antiga no mesmo scroll, removida depois.
    **Escolha do usuário: spline.**
- **Carro mais leve (feito):** o peso era a lataria, deixada sem simplificação porque o meshopt
  ignorava as normais. Com `simplifyWithAttributes` pesando as normais, metade dos triângulos sai sem
  amassar o verniz: 7,7 → 5,6 MB e mais FPS rolando (61 → 74–79 no mesmo teste). Comparadas 50, 30 e
  20%; a 20% o capô e a tampa traseira amassam. O usuário escolheu 50%, a mais segura, aceitando
  ficar 0,6 MB acima da meta de 5 MB.
- **Case:** seção "Making of" no README; sem página nova e sem versão em português nesta rodada.
- **Fora da rodada:** o Supra na pista da volta e o som seguindo a telemetria.
