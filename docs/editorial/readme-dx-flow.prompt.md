<!--
  Imagem 2 — Variante A: Fluxo de sessão real (capacidades entregues).

  Foco: como uma sessão típica flui com o framework hoje (preview).
  Cinemático, narrativa temporal. Wizard → opção executada → estado
  projetado no índice público → enforcement intercepta quando precisa.

  Calibragem cravada nesta versão (após auditoria 2026-05-23):

  - 4 momentos honestos do entregue HOJE (sem antecipar handoff).
  - Handoff (ADR 0022 em Proposta; candidata `handoff-as-first-class`)
    aparece como ponte pontilhada NA BORDA, marcada "em construção" —
    visão direcional explícita, não protagonista.
  - Comando consumer-facing: `npx ai-guidelines`, não `yarn guidelines`
    (yarn é fluxo de contribuidor; npx é fluxo de uso).

  Específica do framework (não invocável via wizard CLI). Testa lado a
  lado com `readme-dx-capability.prompt.md` (B) e
  `readme-dx-before-after.prompt.md` (C) antes de escolher.

  Como usar:
  1. Cole o bloco `<prompt>` em IA de geração/orientação de imagem.
  2. Salve como `docs/assets/ai-guidelines-dx-flow.png`.
-->

<prompt>
Composição editorial-tech em dark mode para o projeto ai-guidelines — segunda capa do README com foco em uma sessão real de trabalho com o framework (versão preview).

A imagem deve parecer uma sequência cinemática horizontal: o usuário abre o wizard, executa uma opção, o estado é projetado no índice público, e o enforcement intercepta quando algo está fora de ordem. Não é tutorial — é narrativa visual do que o runtime entrega hoje.

Visual alinhado à identidade de rosanarezende.com:

- elegante
- técnico
- respirado
- conceitual
- sistêmico

Sem figuras humanas. Todos os textos em Português do Brasil (exceto identificadores de código em monospace, que mantêm forma original).

PROPORÇÃO: 16:9 cinemática (paisagem editorial — narrativa flui da esquerda para a direita).

————————————————————
OBJETIVO VISUAL
————————————————————

Mostrar 1 sessão típica com o framework, em **4 momentos honestos do que está entregue**:

1. ABERTURA: terminal com `npx ai-guidelines workflow` — wizard aparece com 6 opções declarativas.
2. EXECUÇÃO: usuário escolhe uma opção (ex.: continuar spec atual). Runtime lê `state.yml` + `tasks.md` + `decision-brief.md` da spec — representado por linhas finas convergindo no centro.
3. ESTADO PUBLICADO: `publish-state` projeta o estado interno para `.governance/runtime/active-specs.yml` (índice público). Cross-machine, descoberta zero-prompt.
4. ENFORCEMENT: quando algo está fora de ordem (gate.status ≠ closed, tasks.md ausente), `continue` recusa narrativamente — não bloqueia silencioso, explica o que falta.

A imagem comunica, em 5 segundos:

- "o framework lembra do contexto que o humano não precisa repetir"
- "estado canônico vive no repositório, não em dashboard externo"
- "governance é runtime, não decoração — enforcement intercepta antes do erro"

A composição NÃO deve parecer:

- screenshot de IDE
- tutorial step-by-step com setas duras
- mapa de features
- onboarding genérico de produto SaaS

A composição deve parecer:

- narrativa visual cinemática
- runtime governado em ação
- operação que respira
- 4 momentos conectados por luz e geometria, não por setas

————————————————————
PALETA DARK MODE
————————————————————

Manter EXATAMENTE a paleta da Imagem 1 — continuidade visual.

Fundo: #0B1020 ou #0F172A
Texto principal: #E5E7EB
Linhas: rgba(148,163,184,0.18)
Accent principal (entregue): #5EEAD4 / #7DD3FC
Accent secundário (direcional / em construção): #A78BFA pontilhado
Estados "em execução": terracota suave e discreto
Glow: mínimo, atmosférico

————————————————————
COMPOSIÇÃO
————————————————————

Layout horizontal em 4 momentos com transições orgânicas:

**Momento 1 — esquerda** (~25% da largura):
Terminal sutil com prompt `> npx ai-guidelines workflow`. Logo abaixo, menu do wizard aparece com 6 opções declarativas curtas (não detalhar todas — sugerir as 3-4 primeiras). Tom: convidativo, não denso. Accent principal #5EEAD4.

**Momento 2 — centro-esquerda** (~25%):
A escolha materializa uma ação. Linhas finas e silenciosas convergem dos artifacts da spec (`.governance/specs/<slug>/state.yml`, `tasks.md`, `decision-brief.md`) para o centro do quadro — representação visual de leitura determinística. Sem labels narrativos ("executando…", "carregando…"); a geometria comunica.

**Momento 3 — centro-direita** (~25%):
Estado projetado para o índice público `.governance/runtime/active-specs.yml` — pequena tabela esquemática com 2-3 entries (id, slug, branch, stage, status). Selo discreto: "descoberta cross-machine". A força aqui é "main agora sabe o que está ativo".

**Momento 4 — direita** (~25%):
Enforcement em ação. Um caminho de execução é interceptado pelo runtime (`continue` retorna exit 1) com mensagem narrativa visível (não modal de erro corporativo — texto humano). Glow leve em #5EEAD4. Badge minúsculo: "L2 · runtime refuse".

Entre os momentos: respiração orgânica, transições suaves por luz. Nenhuma seta dura. A leitura é por geometria, não por numeração agressiva.

————————————————————
ELEMENTO DIRECIONAL — HANDOFF EM CONSTRUÇÃO
————————————————————

CRÍTICO — honestidade preview vs. entregue:

Na borda inferior do quadro (NÃO no centro narrativo, NÃO entre os 4 momentos), pequeno elemento secundário em pontilhado #A78BFA representa o **handoff situado** — capacidade direcional ainda não materializada (ADR 0022 em Proposta; candidata `handoff-as-first-class` no backlog `Now`).

Visual:

- contorno pontilhado (DASHED outline, stroke-dasharray pattern visível), não fechado
- accent secundário #A78BFA com **60-70% de opacidade** — visivelmente presente como elemento secundário, NÃO como sombra de 20-30% que desaparece em thumbnails
- badge discreto: "em construção · próxima spec"
- legenda sutil: "handoff de sessão · adiante"

Sensação: "isto vem na sequência, mas não está aqui ainda". Honestidade explícita — não vender ponte que não existe.

**TECHNICAL HINT for image generator:** o handoff deve ser **claramente legível** como elemento secundário direcional. Se passar batido em uma visualização de 800px de largura (resolução típica de README), está conservador demais. Calibragem: presente sem competir com os 4 momentos principais.

————————————————————
KERNEL — SECUNDÁRIO
————————————————————

`.governance/` aparece como elemento discreto na parte inferior central, conectando os 4 momentos por baixo — substrato que sustenta a operação. Sem destaque. Pequeno selo monogramado: "ai-guidelines · runtime".

NÃO colocar `AGENTS.md` como kernel — o kernel é `.governance/` (registry.yml + governance core), e AGENTS.md é canal output (cf. ADR 0018).

————————————————————
RODAPÉ
————————————————————

Linha sutil em #E5E7EB com baixo contraste:

"sessão típica · 4 momentos · estado preservado · enforcement integrado"

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- fluidez operacional governada
- repositório como memória da sessão
- enforcement que protege antes de explicar
- honestidade visual sobre o que está pronto e o que vem

A pessoa que olha precisa sentir, sem ler nada:

"trabalhar aqui é diferente — o contexto sobrevive entre sessões, e o runtime intercepta antes do erro humano custar".
</prompt>
