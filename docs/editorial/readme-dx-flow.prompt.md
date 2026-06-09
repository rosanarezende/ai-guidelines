<!--
  Imagem 2 — Variante A: Fluxo de sessão real (capacidades entregues).

  Foco: como uma sessão típica flui com o framework hoje.
  Cinemático, narrativa temporal. Wizard → opção executada → estado
  projetado no índice público → a governança ativa intercepta quando precisa.

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
Composição editorial-tech em dark mode para o projeto ai-guidelines — segunda capa do README com foco em uma sessão real de trabalho com o framework.

A imagem deve parecer uma sequência cinemática horizontal: o usuário abre o wizard, executa uma opção, o estado é projetado no índice público, e a governança ativa intercepta quando algo está fora de ordem. Não é tutorial — é narrativa visual do que o runtime entrega hoje.

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

1. ABERTURA: terminal com `npx ai-guidelines workflow` — wizard aparece com 8 opções declarativas, cada uma com ícone (📍 📍 📡 🔗 🔀 📋 🔍 🎨).
2. LEITURA DETERMINÍSTICA (3 boundaries): usuário escolhe uma opção (ex.: continuar spec atual). Runtime lê os artifacts da spec organizados em três boundaries, com rótulos operacionais visíveis na imagem — **Execução** (`tasks.md`), **Prontidão** (`review.md`), **Pós-merge** (`release-log.md`) — representado por linhas finas convergindo no centro. Monta o "contexto pronto para colar" na IA externa.
3. ESTADO PUBLICADO: `publish-state` projeta o estado interno para `.governance/runtime/specs/active.yml` (índice público). Cross-machine, descoberta zero-prompt.
4. GOVERNANÇA ATIVA + GATE DE PRONTIDÃO: quando algo está fora de ordem, o runtime intercepta narrativamente — `continue` recusa execução (gate de execução não fechado), e as ops transacionais 🔗 (Integration PR) e 🔀 (merge da stack) ficam **bloqueadas** enquanto os gates do `review.md` não fecharem. Não bloqueia silencioso: explica o que falta.

A imagem comunica, em 5 segundos:

- "o framework lembra do contexto que o humano não precisa repetir"
- "estado canônico vive no repositório, não em dashboard externo"
- "a governança é runtime, não decoração — ela intercepta antes do erro"

A composição NÃO deve parecer:

- screenshot de IDE
- tutorial step-by-step com setas duras
- mapa de features
- onboarding genérico de produto SaaS

A composição deve parecer:

- narrativa visual cinemática
- operação governada em ação
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
Terminal sutil com prompt `> npx ai-guidelines workflow`. Logo abaixo, menu do wizard aparece com 8 opções declarativas curtas (não detalhar todas — sugerir as 3-4 primeiras). Tom: convidativo, não denso. Accent principal #5EEAD4.

**Momento 2 — centro-esquerda** (~25%):
A escolha materializa uma ação. Linhas finas e silenciosas convergem dos artifacts da spec, sutilmente agrupados em **três boundaries** com rótulos operacionais visíveis — **Execução** (`tasks.md`), **Prontidão** (`review.md`), **Pós-merge** (`release-log.md`) — para o centro do quadro, representação visual de leitura determinística. Pode sugerir um pequeno cartão "contexto pronto para colar". Sem labels narrativos ("executando…", "carregando…"); a geometria comunica.

**Momento 3 — centro-direita** (~25%):
Estado projetado para o índice público `.governance/runtime/specs/active.yml` — pequena tabela esquemática com 2-3 entries (id, slug, branch, stage, status). Selo discreto: "descoberta cross-machine". A força aqui é "main agora sabe o que está ativo".

**Momento 4 — direita** (~25%):
Governança ativa + gate de prontidão em ação. Um caminho de execução é interceptado pelo runtime (`continue` retorna exit 1) com mensagem narrativa visível (não modal de erro corporativo — texto humano). Ao lado, as ops transacionais 🔗 e 🔀 aparecem com um pequeno cadeado discreto — bloqueadas enquanto os gates do `review.md` não fecharem. Glow leve em #5EEAD4. Badge minúsculo: "runtime recusa execução".

Entre os momentos: respiração orgânica, transições suaves por luz. Nenhuma seta dura. A leitura é por geometria, não por numeração agressiva.

————————————————————
TEXTO LITERAL DO TERMINAL (renderizar exatamente, sem traduzir)
————————————————————

Para reduzir alucinação do gerador, use estas linhas reais do runtime nos terminais/cartões (monospace, pt-BR, exatamente como saem na CLI — não inventar outras):

- Momento 1 (prompt): `> npx ai-guidelines workflow`
- Momento 4 (bloqueio): `🔒 Integration PR bloqueado — homologação (review.md) ainda aberta.`
- Momento 4 (itens abertos): `Itens abertos detectados em review.md:`
- Momento 2 (handoff de contexto): `──── Contexto pronto para colar na sua IA externa ────`

NÃO renderizar identificadores internos (`DEC-…`, `ADR-…`, `[1.H]`) no texto visível — usar apenas os rótulos operacionais (**Execução / Prontidão / Pós-merge**) e as linhas literais acima.

————————————————————
ELEMENTO DIRECIONAL — HANDOFF EM CONSTRUÇÃO
————————————————————

CRÍTICO — honestidade direcional vs. entregue:

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

"sessão típica · 4 momentos · estado preservado · governança ativa"

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- fluidez operacional governada
- repositório como memória da sessão
- governança ativa que protege antes de explicar
- honestidade visual sobre o que está pronto e o que vem

A pessoa que olha precisa sentir, sem ler nada:

"trabalhar aqui é diferente — o contexto sobrevive entre sessões, e o runtime intercepta antes do erro humano custar".

————————————————————
LÍNGUA (NÃO-NEGOCIÁVEL)
————————————————————

TODO texto renderizado na imagem deve ser em **Português do Brasil (pt-BR)**. NÃO gerar texto em inglês. A única exceção são identificadores em monospace que são literais de comando/código (`npx ai-guidelines workflow`, `tasks.md`, `review.md`, `release-log.md`, `specs/active.yml`, `continue`) — esses mantêm a forma original. Selos, badges, títulos e legendas: sempre pt-BR.
</prompt>

---

## Sanity checklist — o que DEVE aparecer na imagem

Use para validar a imagem gerada antes de salvar em `docs/assets/ai-guidelines-dx-flow.png`:

- [ ] **4 momentos** legíveis da esquerda para a direita, conectados por luz/geometria (não por setas duras).
- [ ] **Momento 1:** prompt `npx ai-guidelines workflow` + wizard com **8 opções** (sugerir as 3-4 primeiras com ícones 📍 📡 🔗 🔀).
- [ ] **Momento 2:** leitura convergente dos artifacts agrupados nos **3 boundaries** (`tasks.md` / `review.md` / `release-log.md`); pode haver cartão "contexto pronto para colar".
- [ ] **Momento 3:** projeção para o índice público `specs/active.yml` (mini-tabela id/slug/branch/stage/status) + selo "descoberta cross-machine".
- [ ] **Momento 4:** governança ativa narrativa (`continue` recusa) **+** ops 🔗/🔀 com cadeado (bloqueadas por gates abertos do `review.md`).
- [ ] **Handoff** aparece SÓ como elemento secundário pontilhado na borda, marcado "em construção" — nunca como protagonista.
- [ ] **Kernel** `.governance/` discreto na base; **NÃO** colocar `AGENTS.md` como kernel.
- [ ] **Todo texto em pt-BR** (exceto literais de comando/arquivo em monospace). Zero inglês renderizado.
- [ ] Dark mode na paleta da Imagem 1; sem aparência de screenshot de IDE / tutorial / SaaS.
