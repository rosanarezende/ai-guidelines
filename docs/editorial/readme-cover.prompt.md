<!--
  Imagem 1 — Capa principal do README do framework ai-guidelines.

  Substitui (ou refresca) `docs/assets/ai-guidelines-flow.png`. Foco:
  arquitetura de governança. Pessoa bate o olho e entende que o framework
  é útil em 5 segundos.

  Calibragem cravada nesta versão (após auditoria 2026-05-23):

  - Kernel é `.governance/registry.yml` + governance core, NÃO `AGENTS.md`.
    AGENTS.md é canal output entre vários (cf. ADR 0018).
  - Capacidades entregues (workflow runtime, enforcement L2) aparecem
    como módulos sólidos.
  - Capacidades direcionais ainda não materializadas (handoff, boilerplate
    por classe) aparecem visualmente diferenciadas (pontilhado, "em breve")
    para honestidade preview vs. entregue (cf. ADR 0022 em Proposta).

  Histórico:
  - v1 (4:3, em produção desde 1.0.1): `docs/assets/ai-guidelines-flow.png`.
  - v2 (1:1 com órbita externa de runtime): descartada — densidade poluía.
  - v3 (esta, 4:3): retorno ao formato original; kernel correto; honestidade
    visual sobre capacidades em preview vs. entregues.

  Como usar:
  1. Cole o bloco entre `<prompt>` e `</prompt>` em ferramenta de geração
     de imagem (Claude com diagram tool, Gemini, Midjourney, DALL-E).
  2. Salve o resultado em `docs/assets/ai-guidelines-flow.png`.
-->

<prompt>
Diagrama editorial-tech em dark mode para o projeto ai-guidelines — framework de governança de engenharia repo-first com integração AI-agnóstica como canal opt-in.

A composição deve parecer um ecossistema operacional vivo — sofisticado, modular, arquitetural — inspirado em visual systems contemporâneos da Linear, Vercel, Raycast e mapas operacionais modernos.

Visual alinhado à identidade de rosanarezende.com:

- elegante
- técnico
- respirado
- conceitual
- sistêmico

Sem figuras humanas. Todos os textos em Português do Brasil (exceto identificadores de código em monospace, que mantêm forma original).

PROPORÇÃO: 4:3 editorial premium.

————————————————————
OBJETIVO VISUAL
————————————————————

O protagonista é o **ciclo contínuo de governança de engenharia**:

Backlog → Spec → Plano → Execução → Pull Request → Merge → Valor entregue

A imagem deve comunicar, em 5 segundos:

- transformação de intenção em entrega governada
- fluxo operacional auditável
- repositório como memória canônica
- governança que orquestra IAs como canal, não como protagonista

Respiração é mais importante que exaustividade. A pessoa precisa entender o ciclo sem esforço — não tentamos mostrar todas as capacidades aqui.

A composição NÃO deve parecer:

- pipeline DevOps tradicional
- dashboard corporativo
- fluxograma BPMN
- AI tooling diagram
- mapa de capacidades de produto SaaS

A composição deve parecer:

- sistema operacional vivo
- runtime graph governado
- ecossistema modular
- arquitetura em movimento

————————————————————
PALETA DARK MODE
————————————————————

Fundo: #0B1020 ou #0F172A
Texto principal: #E5E7EB
Linhas: rgba(148,163,184,0.18)
Accent principal: #5EEAD4 / #7DD3FC
Accent secundário: #A78BFA
Governança humana (gates): #F59E0B extremamente sutil
Estados "em construção / direcional": pontilhado em #A78BFA com baixa saturação
Glow: mínimo, atmosférico

————————————————————
ELEMENTO PRINCIPAL — LOOP OPERACIONAL
————————————————————

Loop arquitetural semi-radial fluido ao redor do kernel central. Etapas como nodes elegantes — não cards pesados.

Cada etapa:

- ícone outline minimalista
- label curta
- subtítulo técnico discreto
- pouco contorno, muita respiração

Fluxo:

Backlog
"candidatas · prioridades"

Spec
"spec.md (imutável após review)"
pequeno cadeado discreto

Plano
"plan.md (vivo) · decision-brief.md"

Execução
"tasks.md (execução) · branch · commits"

Pull Request
"review.md (prontidão) · gates humanos"
pequeno cadeado discreto

Merge
"release-log.md (pós-merge) · histórico"

Valor entregue
"feature em produção · auditável"

————————————————————
VALOR ENTREGUE — FOCO EMOCIONAL
————————————————————

"Valor entregue" é o ponto de maior energia visual.

Representa:

- outcome operacional
- visibilidade organizacional
- entrega rastreável do backlog ao código em produção

Visual:

- glow extremamente sutil
- contraste levemente maior
- sensação de expansão

Conexões ao redor dele: mais vivas, mais fluidas.

————————————————————
KERNEL DE GOVERNANÇA
————————————————————

CRÍTICO — calibragem técnica:

O kernel é `.governance/registry.yml` + governance core (taxonomia MECE de 7 pilares: spec, experiment, spike, incident, proposal, patch, fix). NÃO é `AGENTS.md`.

`AGENTS.md` é **um dos canais output** entre vários, não o centro.

Visual do kernel:

- pequeno núcleo técnico discreto
- monogramado: ".governance/" ou "registry.yml"
- elegante, secundário, infraestrutura silenciosa
- sustenta o loop por baixo

Ao redor do kernel, **canais multi-IA** como módulos pequenos com peso visual equivalente entre si (nenhum é mais importante):

- AGENTS.md
- CLAUDE.md
- GEMINI.md
- .openai/instructions.md
- .cursor/rules/
- .github/copilot-instructions.md

Sensação: "kernel governa; canais distribuem para IAs". A geometria comunica por si — não usar verbos dinâmicos ("sincronizando…", "distribuindo…"). A presença basta.

————————————————————
EXTENSÕES DO FRAMEWORK
————————————————————

Na periferia inferior: módulos editoriais discretos divididos em **dois tipos visualmente distintos**:

**Entregues (sólidos, accent principal #5EEAD4):**

- Lifecycle de release
  "publish · tag · sync"
- Arquitetura da informação
  "ADR · runtime rules · referência"
- Workflow runtime (preview)
  "wizard · continue · publish-state"
- Enforcement estrutural
  "L2 runtime + L4 CI"

**Direcionais — em construção (pontilhados, accent #A78BFA com baixa saturação, badge "em breve" discreto):**

- Handoff situado
  "boot de sessão IA contextual"
- Boilerplate por classe MECE
  "spec · incident · experiment · ..."
- Dashboard de governança
  "visualização stakeholder"

A diferença visual entre Entregues vs. Direcionais é honestidade — preview ≠ release. Os sólidos têm contorno fechado; os direcionais têm contorno pontilhado.

**TECHNICAL HINT for image generator (non-negotiable):** render Direcional cards with explicit DASHED outline — visible stroke-dasharray pattern (e.g., 4px dash + 4px gap). Solid Entregues cards use closed continuous outline. The visual distinction must be UNAMBIGUOUS at first glance, conveyed by the outline style itself — not only by the "em breve" badge text. If the generated image shows Direcional cards with the same solid contour as Entregues, the image fails this requirement and must be regenerated.

Todos com baixo peso visual (não competem com o loop principal).

————————————————————
RODAPÉ CONCEITUAL
————————————————————

Pills extremamente discretas:

- Auditável
- Repo-first
- Headless
- Multi-stack
- AI-as-channel

Baixo contraste. Sem competir.

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- maturidade técnica
- governança repo-first
- IA como canal de primeira classe (não como protagonista)
- rigor de engenharia
- honestidade sobre o que está pronto e o que está vindo

A imagem deve fazer stakeholders sentirem, em 5 segundos:

"isso não é AI tooling — isso é um modelo operacional para engenharia governada, com IAs integradas como canal".

Detalhes operacionais (wizard, comandos, enforcement em ação) ficam para a Imagem 2 (capa DX).
</prompt>
