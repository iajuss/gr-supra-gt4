# Plano de implementação

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
- [ ] Linha de largada: o GeoJSON começa na reta antiga (Woodcote–Copse), não na atual (Hamilton Straight) → decidir
- [ ] 👁 Conferir o modo reduced-motion no navegador

## Bloco 3 — SPECS
- [ ] Levantar e conferir números do Vulcan em fontes públicas → `data/specs.js`
- [ ] 🧪 Lógica de contagem (easing, formatação de números/unidades)
- [ ] `components/specCounters.js` + barras comparativas
- [ ] `components/textReveal.js` (reutilizável nas outras seções)
- [ ] 👁 Desktop + mobile + reduced-motion

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
