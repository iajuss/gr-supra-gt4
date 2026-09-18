# LP_piloto — Toyota GR Supra GT4 (fan-made landing page)

Landing page conceitual, não oficial, do Toyota GR Supra GT4 (começou como Aston Martin Vulcan; o motivo
da troca está em docs/design.md). Inspirada na LP "Kimi Antonelli, driver_012"
(Three.js + motion + storytelling). Decisões de design aprovadas em [docs/design.md](docs/design.md).

## Acordo de trabalho

- **Sem superpowers.** Não usar skills `superpowers:*` nem seus fluxos rígidos.
- **Sempre perguntar como prosseguir.** Em cada etapa (início de feature, troca de fase, decisão de método),
  apresentar opções com uma recomendação e esperar a escolha do usuário. Não decidir o processo sozinho.
- **TDD pragmático.** Lógica pura (dados, matemática, interpolação, telemetria, contadores) nasce com teste
  primeiro (Vitest). Partes visuais (WebGL, CSS, motion) são verificadas no navegador (desktop e mobile)
  e no console, sem forçar teste unitário onde ele não agrega.
- **Planejamento leve e explícito.** Antes de implementar um bloco, combinar o escopo e os passos na conversa;
  registrar decisões relevantes em `docs/design.md`.
- **Organização e código limpo.** Cada arquivo com uma responsabilidade; dados separados de lógica
  (`src/data/`); nada de arquivo gigante fazendo tudo. Commits pequenos e descritivos, só quando o usuário pedir.

## Stack

Vite · JavaScript puro (ES modules) · Three.js · GSAP + ScrollTrigger · Lenis · Vitest

## Idioma

- Conteúdo da página: **inglês**.
- Conversa, documentação e mensagens de commit: **português**.
