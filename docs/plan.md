# Plano de implementação

Ordem aprovada: **Fundação → Pista → Specs → 3D → Polimento**. Design em [design.md](design.md).
Cada bloco é detalhado e combinado na conversa antes de começar; marque `[x]` ao concluir.
Legenda: 🧪 = teste escrito antes (TDD) · 👁 = verificação no navegador.

## Bloco 1 — Fundação
- [x] Scaffold Vite (JS puro) + dependências (three, gsap, lenis) + Vitest
- [x] Scripts npm: `dev`, `build`, `preview`, `test`
- [x] 🧪 `lib/capabilities.js` — decide `full | lite`
- [x] `styles/tokens.css` + `base.css` (fontes, tipografia fluida, reset)
- [ ] `index.html` com a marcação semântica de todas as seções (conteúdo em inglês, placeholders visuais)
- [ ] 👁 Layout estático de cada seção em desktop e em 375px

## Bloco 2 — THE LAP
- [ ] Obter o GeoJSON de Silverstone (`bacinger/f1-circuits`) e registrar o crédito
- [ ] 🧪 `lib/math.js` — normalização de coordenadas para o canvas e comprimento acumulado do traçado
- [ ] 🧪 Modelo de telemetria simulada: progresso → { speed, gear, sector, lapTime }
- [ ] `components/lapTrack.js` — desenho progressivo do traçado + ponto, com ajuste à densidade de pixels e ao redimensionamento
- [ ] `components/telemetryHud.js` — exibe os dados recebidos
- [ ] Início ao entrar na tela, botão REPLAY, suporte a reduced-motion
- [ ] 👁 Desktop + mobile

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
