# Plano de implementação

## ▶ Retomada (atualizado em 2026-09-17)

- **Onde paramos:** Blocos 1, 2 e 3 concluídos e commitados. Bloco 2B (THE LAP em 3D) aprovado e planejado,
  ainda **sem código**.
- **Referência visual aprovada:** `sandbox/track3d/` (fora do git; rode `npm run dev` e abra `/sandbox/track3d/`).
- **Ritmo combinado para o 2B:** passos 1 e 2 juntos (só lógica, TDD) → pausa com relatório → passos 3 a 5
  (cena, layout, ligação) → pausa para o usuário ver → verificação e limpeza.
- **Próximo passo (1 + 2), módulos propostos:**

  | Módulo | Responsabilidade |
  |---|---|
  | `lib/lapClock.js` | tempo na tela → tempo simulado e `done` (usado pelo 2D e pelo 3D) |
  | `lib/geometry.js` | `smoothClosed` e `circumradius` movidos de `telemetry.js` (os testes vão junto) |
  | `lib/centreline.js` | linha central suavizada (tangentes, normais), `frameAt(progress)`, trechos com zebra |
  | `lib/ribbon.js` | vértices e índices das fitas sem Three.js, com opção de pular segmentos (zebras sem rampas) |
  | `lib/cameraRigs.js` | posição e alvo de Chase (atrás 24, alto 7,5, olha 30 à frente), Heli (atrás 90, alto 70, lado 40, olha 60 à frente) e Top (offset fixo −150, 950, 250), mais FOV por velocidade (Chase: 50 + v/300 × 18) |

  Depois: refatorar `components/lapSection.js` (2D) para usar `lapClock`.

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
- [ ] 🧪 Extrair a lógica pura do protótipo:
  - relógio da volta (tempo na tela → tempo simulado, fim da volta);
  - posição e direção ao longo da linha central;
  - geometria das fitas (vértices e índices, sem Three.js);
  - trechos com zebra (por raio de curva);
  - posição das 3 câmeras.
- [ ] Refatorar `components/lapSection.js` (2D) para usar o relógio da volta
- [ ] `scene/renderer.js` (fábrica compartilhada com o Bloco 4) + `scene/lap/` (pista, zebras, largada, rastro, carro, bloom, loop com pausa)
- [ ] HTML/CSS do modo full: palco em tela cheia, HUD, minimapa, câmeras (padrão Heli), Replay
- [ ] Ligação: import dinâmico no modo full; lite mantém o 2D
- [ ] 👁 Desktop: 3 câmeras, replay, pausa fora da tela, FPS, tamanho do build · Lite: fallback 2D
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
