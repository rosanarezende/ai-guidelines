# Plan — Spec 0008 Governance Coherence

> Spec: [`./spec.md`](./spec.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após
> In Review), este arquivo é atualizado conforme o entendimento técnico
> evolui. Decisões revisitadas ficam na seção final, não apagam o histórico.

---

## 🏗️ Design e Arquitetura

### Princípio guia (estende ADR 0004)

```
┌─────────────────────────────────────────────────────────────┐
│ ADR 0004 — Responsabilidade Única                           │
├─────────────────────────────────────────────────────────────┤
│ AGENTS.md           → contrato operacional + Phase 0        │
│ global-rules.md     → princípios universais (sem workflow)  │
│ rpi-protocol.md     → ciclo cognitivo R→P→I (referência)    │
│ spec-foundation.md  → implementação canônica do Plan        │
│ ai-efficiency-guide → context engineering + model routing   │
└─────────────────────────────────────────────────────────────┘
```

**Distinção formal nova introduzida pela Spec 0008** (decisão registrada
2026-04-24, validando observação 4 do review):

| Categoria                                                                          | Destino                                         | Aplicação                         |
| :--------------------------------------------------------------------------------- | :---------------------------------------------- | :-------------------------------- |
| **Universal de governança IA** (workflow, plan mode, PR collab, environment check) | `.core/rules/global-rules.md` (sempre injetado) | Mandatory core                    |
| **Opt-in de stack/processo** (Quality Gates, TDD, formatter)                       | `.core/rules/<feature>.md` + flag CLI ou wizard | Wizard pergunta; default sugerido |

Esta distinção **estende a decisão original da Spec 0005** ("o que é opt-in é
exatamente o que varia por stack") aplicando-a também a regras editoriais
(antes só se aplicava a features técnicas como `prettier`, `husky`, `ci`).

---

### Sub-bloco A — Filtro doc → rules

**Estado atual:** `.core/docs/` contém mistura de:

- **Conteúdo humano puro** (ex.: `editorial-guidelines.md`,
  `cinematic-ui-boilerplates.md`, `advanced-ai-patterns.md`) — não vai para
  consumidor (correto).
- **Regras acionáveis para IA** disfarçadas de docs (ex.: regras citadas em
  `rpi-protocol.md`, partes de `tdd-guidelines.md`, regras de eficiência em
  `ai-efficiency-guide.md`) — atualmente só ficam na fonte; quando o agente
  no consumidor lê `.ai-guidelines/rules/global-rules.md`, encontra
  referências quebradas tipo "consulte `docs/...`".

**Decisão:** mapear conteúdo de `.core/docs/` em **três categorias** (não
mais duas), aplicando a distinção universal vs opt-in:

| Categoria                            | Destino                                                        | Sincronização                                            |
| :----------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------- |
| Pura documentação humana             | Mantém em `.core/docs/`                                        | Sem mudança; não vai ao consumidor                       |
| Regra **universal** de governança IA | `.core/rules/global-rules.md` ou `.core/rules/<topic>.md`      | Vai ao consumidor sempre via `applyRules` (mandatory)    |
| Regra **opt-in** de stack/processo   | `.core/rules/<feature>.md` + feature em `cli/features/opt-in/` | Vai ao consumidor só se feature ativada (wizard ou flag) |
| Referência cruzada                   | Reescreve link para apontar ao destino correto pós-promoção    | Auditável                                                |

**Artefato:** `mapping-doc-to-rules.md` em `research/` documentando a
classificação por arquivo.

**Regras a canonizar como universais** (vão em `global-rules.md` seção nova
"Workflow com IA"):

- **Plan mode antes de agent mode** (já existe via RPI, reforçar).
- **Referencie um padrão existente ao gerar código novo** (Lucas/Senior).
- **PR description colaborativo (3 etapas)** — substitui a regra original
  categórica do Lucas. Decisão registrada 2026-04-24 (observação 1):
  > "Ao escrever ou editar PR description: (1) liste os tópicos relevantes
  > para validação humana antes do texto final; (2) só escreva o texto após
  > o humano editar/aprovar a lista; (3) submeta o texto final para um
  > último check humano antes de criar/editar o PR."
- **Patterns devem ser agnósticos ao LLM**.
- **Não documentar nomes de arquivo/pasta nas rules** — documentar padrões
  (Diego/Rocketseat).

**Regras a reclassificar como opt-in de stack** (decisão registrada 2026-04-24,
observação 4):

- **TDD e BDD** (`tdd-guidelines.md`) — nem todo repo escolhe BDD nem mesmo
  testes. Vira duas features separadas no CLI (`tdd` e `bdd`), com suporte
  a escolha de idioma (PT-BR ou EN) para as regras geradas.
- **Quality Gates** — sub-bloco E (ver detalhamento próprio).

**Bloqueadores técnicos absorvidos por A** (PR #19):

- **Bloqueador 4** — `.core/rules/global-rules.md` linhas 37 e 39
  referenciam `docs/ai-efficiency-guide.md` e `docs/process/` (paths que não
  existem no consumidor). Reescrever conforme decisão geral de A.
- **Bloqueador 3** — `.core/templates/AGENTS-core.md.tmpl` linha 19
  referencia paths antigos pré-pointer architecture. Apontar para
  `.ai-guidelines/rules/...` ou remover linha se a regra equivalente passar
  a viver em `global-rules.md` injetado.

---

### Sub-bloco B — Consolidação RPI ↔ spec-foundation

**Estado atual:** RPI (`docs/rpi-protocol.md`) e spec-foundation
(`docs/process/spec-foundation.md`) coexistem sem hierarquia explícita.
RPI já não menciona mais `.ai-runtime/` (corrigido na Spec 0004), mas a
relação entre os dois ainda é implícita.

**Decisão:**

- **RPI** = ciclo cognitivo universal (Research → Plan → Implement). Conceito
  agnóstico de ferramenta. Permanece em `docs/rpi-protocol.md` como
  referência conceitual.
- **spec-foundation** = implementação canônica do passo "Plan" quando a
  iniciativa merece persistência. Permanece em
  `docs/process/spec-foundation.md`.
- **Plano leve** (sem spec) vive em scratchpad da ferramenta (ex.:
  `~/.claude/plans/`), nunca em arquivo paralelo versionado no repo.

**Decisão adicional sobre spec.md vs plan.md** (decisão registrada 2026-04-24,
observação 2):

- `spec.md` é **imutável** após status `In Review`. Captura: problema, escopo,
  decisão de fusão (se aplicável), critérios de aceite globais (alto nível),
  pesquisa de contexto, dependências macro.
- `plan.md` é **vivo** durante execução. Captura: design e arquitetura por
  componente, DoD operacional detalhado, estratégia de testes, arquivos
  modificados, riscos técnicos. Tem seção "Decisões revisitadas" para
  registrar mudanças sem reescrever o histórico.
- **Esta spec aplica retroativamente o novo padrão** (a primeira versão da
  spec 0008 fundiu spec + plan; reorganizado em 2026-04-24 — ver "Decisões
  revisitadas" no final).
- Templates novos em `.specify/templates/`: `spec-boilerplate.md` (refeito,
  enxuto), `plan-boilerplate.md`, `tasks-boilerplate.md`,
  `next-boilerplate.md` (todos novos).
- `spec-foundation.md` será atualizado para refletir o novo lifecycle, com
  checklist explícito de abertura e fechamento.

**Decisão sobre NEXT.md:**

- Hoje "opcional"; passa a ser **temporário-mandatório quando há débitos**:
  criar quando a spec gerar débitos adiados, **deletar no encerramento**
  (Fase 3 do `tasks.md`), migrando o conteúdo para `ROADMAP.md`. O lifecycle
  já está em `spec-foundation.md` mas falta enforcement.

**Decisão sobre formato do ROADMAP** (nova, decisão registrada 2026-04-24):

- Hoje a numeração sequencial fixa força **renumeração quando prioridade
  muda** (ex.: uma candidata renumerada de 0011 para 0013 ao adicionar
  novas candidatas). Isso é churn que esta spec deve eliminar.
- **Princípio:** candidatas vivem por **slug semântico** sem número.
  Número só é alocado quando a spec sai de candidata e cria branch
  (`feat/spec-XXXX-<slug>`); recebe o **próximo número sequencial
  disponível**, sem reservar à frente.
- **Estrutura proposta** (a validar via pesquisa de benchmarks B.9):
  pasta `.specify/specs/roadmap/` com 2 arquivos:
  - `concluido.md` — passado: specs concluídas + absorvidas com
    rastreabilidade. Números mantidos como histórico.
  - `proximos.md` — presente + futuro: em execução + Now / Next / Later.
    Candidatas listadas por slug, sem número.
- **Pesquisa de benchmarks** (B.9): analisar Vercel/Next.js, Astro, Vue,
  Vite, Specify Kit, RFCs (Rust/React) antes de finalizar formato.
- **Templates faltantes** (B.8): `roadmap-boilerplate.md` (formato final
  decidido em B.10) e `research-index-boilerplate.md` (formato canônico do
  index de pesquisa).

**Mudanças em arquivos:**

- `AGENTS.md` (regras 8 e 9) — distinguir "Plano formado via spec-foundation"
  vs "plano leve fora do repo". Critério objetivo: > 1 sessão estimada, mais
  de 1 arquivo tocado fora de feature isolada, ou resultado precisa
  sobreviver a troca de IA/sessão → spec-foundation; demais casos → plano leve.
- `.core/templates/AGENTS-core.md.tmpl` — espelhar a mudança.
- `docs/rpi-protocol.md` — adicionar seção "Quando usar spec-foundation
  vs plano leve" com o critério acima.
- `docs/process/spec-foundation.md` — adicionar header "Implementação
  canônica do Plan no ciclo RPI" + atualizar lifecycle (open/close
  checklist) + clarificar distinção spec/plan e política de NEXT.md.
- `cli/core/engine.mjs` — **Bloqueador 2 do PR #19**: decidir destino do
  `DEFAULT_AI_GUIDELINES_REF` (dead code). Recomendação default:
  **Opção 1 — remoção completa** da constante e da opção CLI
  `--ai-guidelines-ref` (sai também de `cli-input.mjs` no `printHelp`).
  Justificativa: pointer architecture (Spec 0005) tornou o ref auto-derivado;
  a opção sobreviveu por inércia. Reabrir Opção 2 (manter como hook futuro)
  só se a Spec 0011 (hierarquia de regras) precisar.

---

### Sub-bloco C — Consolidação AI Efficiency Guide

**Estado atual:**

- `AGENTS.md` regra 1 cita `[Economia de Tokens](docs/ai-efficiency-guide.md)`.
- `global-rules.md` tem **duas seções** sobre eficiência: "Economia de Tokens"
  (regras 7-9) e "Eficiência de IA — Lembrete Rápido" (linhas 33-39) —
  duplicação interna.
- `ai-efficiency-guide.md` é o guia profundo, mas tem links quebrados para
  `for-gemini/setup.md`, `for-claude/setup.md`, `for-codex/setup.md` (pastas
  removidas na Spec 0004).

**Decisão:**

- Consolidar em `global-rules.md` uma **única seção** "Eficiência de IA"
  contendo as regras acionáveis (4-6 regras imperativas).
- `ai-efficiency-guide.md`: reescrever como guia profundo com framework
  coerente (context engineering → model routing → cost optimization → cache
  patterns), corrigindo links quebrados e atualizando matriz de modelos para
  Claude 4.x / Gemini 2.x / GPT-4o (referência 2026).
- Adicionar seção "Prompt Caching" (relevante para Claude Code / Anthropic
  API).
- `AGENTS.md` regra 1 mantém referência única ao guia.

**Conteúdo adicional vindo da pesquisa de transcrições:**

- **Model routing inteligente + ceticismo informado sobre versões novas**
  (Lucas/Vai Faltar Dev): Lucas observou Opus 4.6 "nerfado" perto do anúncio
  do 4.7, e 4.7 sentindo pior que 4.6. Mensagem: não confiar cegamente em
  "mais novo é melhor"; testar por feature crítica; manter fallback.
  Mencionar adaptive thinking como variável a observar.
- **EN vs PT em prompts** (Lucas/Senior): inglês performa melhor em alguns
  modelos (tradução interna perde nuance). Recomendação: inglês para tarefas
  críticas, PT para iteração/exploração. Não obrigatório.
- **Padrão "AI revisando AI como júnior"** (Lucas/Senior): tática útil; entra
  como exemplo prático, não como regra obrigatória.
- **Quotas e sinais de cota** (Lucas/Vai Faltar Dev): documentar como
  interpretar e quando agir (rotacionar entre modelos, fragmentar tarefa).
  **Visualizador automático fica para Spec 0014 (candidata)** — sub-bloco C
  apenas referencia: "para ferramenta de visualização, ver Spec 0014".

---

### Sub-bloco D — Step 0 (Environment Awareness)

**Estado atual:** Phase 0 do `AGENTS.md` cobre persistência ("repositório é
sua memória") mas não detecção de ambiente. Agente em Windows + Git Bash pode
acabar usando comandos PowerShell ou esquecer que `/dev/null` ≠ `NUL`.
Resposta menos assertiva por falta de contexto situacional.

**Decisão:** estender Phase 0 com sub-item curto (≤ 8 linhas) "Environment
Check":

```text
0a. Antes da primeira ação destrutiva, identifique:
    - Plataforma: Windows / Linux / macOS / WSL
    - Shell: bash / zsh / PowerShell / cmd
    - Surface: CLI agent (Claude Code, Gemini CLI, Codex) vs IDE assistant
      (Cursor, Copilot) vs IDE agent (Antigravity)
    - Modelo: quando exposto pela plataforma
Adapte comandos a essa matriz (forward slashes em paths, `/dev/null` vs `NUL`,
sintaxe de chain de comandos, evitar tools que a IDE não tem).
```

**Limite:** prescrição editorial, não código no CLI. A Spec 0005 já cobre
detecção técnica no CLI (PM, monorepo, EOL). Sub-bloco D foca em fazer a IA
usar a informação que já recebe do harness com mais disciplina.

---

### Sub-bloco E — Quality Gates (opt-in feature)

**Estado atual:** o baseline (`AGENTS.md` + `global-rules.md`) não prescreve
gates objetivos para código predominantemente gerado por IA. Cada consumidor
decide ad-hoc o que rodar em CI.

**Problema (origem: pesquisa de transcrições):**

- Uncle Bob (via Lucas Montano): "não reviso código gerado por agente; rastreio
  cyclomatic complexity, dependency structure, mutation tests, tamanho de
  módulos". A premissa "humano revisa cada linha" não escala para 50%+ de
  código gerado por máquina.
- Lucas Montano (Vai Faltar Dev 2027): bugs típicos de código gerado por IA
  (N+1 queries, race conditions, memory leaks) só aparecem em produção e só
  são detectados por sensores específicos, não por code review humano.

**Decisão (revisada em 2026-04-24, observação 4):** Quality Gates entra como
**feature opt-in de stack**, não como regra core mandatory. Razão: gates
**variam por stack** (Python = hypothesis, JS = fast-check, mutation tool por
linguagem). Aplica o princípio da Spec 0005 ("opt-in = o que varia por
stack").

**Componentes:**

1. **`.core/rules/quality-gates.md`** — arquivo de regras editoriais com
   checklist mínimo (≤ 15 linhas). 4 grupos de gates:
   - Análise estática (cyclomatic complexity, tamanho de módulo, estrutura
     de dependências).
   - Cobertura + mutation testing (sugestão default: cobertura ≥ 85%,
     mutation kill rate ≥ 60%).
   - Detecção de bugs típicos de IA (N+1, race condition, memory leak) com
     exemplos de tooling por linguagem em parênteses.
   - Secret scanning (cross-ref Spec 0012 candidata).
   - Ressalva: gates objetivos pegam bugs locais; arquitetura crítica
     (tradeoffs, capacity, failure modes) ainda exige senior review humano.
2. **`cli/features/opt-in/quality-gates.mjs`** — feature CLI nova ao lado de
   `prettier`, `husky`, `ci`. Quando ativada (via flag ou wizard):
   - Sincroniza `.core/rules/quality-gates.md` para
     `.ai-guidelines/rules/quality-gates.md` no consumidor.
   - (Opcional, futuro) sugere config inicial de gates por linguagem
     detectada — mas implementação técnica fica para Spec 0009.
3. **Wizard** (`cli/core/cli-input.mjs`) — adicionar `quality-gates` à lista
   `FEATURE_OPTIONS` com descrição "Gates objetivos para código gerado por
   IA (recomendado)". Default: incluído na seleção sugerida; pulável
   explicitamente.

**Limite:** Sub-bloco E entrega o **checklist editorial + estrutura opt-in
no CLI**. A **implementação técnica dos sensores** (multi-agent validators,
gates rodando em CI, evaluation gates) fica em **Spec 0009 — Harness
Engineering** (handoff já registrado no ROADMAP).

---

### Sub-bloco F — Onboarding e contribuição

**Estado atual:** README é institucional/marketing (descreve "o que é" o
framework); CONTRIBUTING é técnico mas genérico ("issue → spec → branch →
PR"). Falta caminho explícito por **persona** (humano novo, humano
experiente, agente IA atuando autonomamente).

**Problema (origem: decisão registrada 2026-04-24):** quem chega novo não sabe
exatamente o que é esperado. Cada workflow descrito em mais de um lugar
(README, CONTRIBUTING, AGENTS) com versões ligeiramente diferentes — viola
Single Source of Truth, mesma classe de problema do ADR 0004.

**Decisão:** clarificar entradas e workflows por persona, com Single
Source of Truth por workflow. Cada documento aponta para o outro quando
necessário, sem duplicar conteúdo.

**Mudanças em arquivos:**

- `README.md` — seção "Para começar" com 3 caminhos curtos (consumir
  framework / contribuir / atuar como agente). Cada caminho é um link
  para o documento profundo correspondente.
- `CONTRIBUTING.md` — workflows concretos por persona:
  - Ajuste rápido (sem spec).
  - Feature/refactor (com spec, usando os templates SDD novos).
  - Spec consolidada (critério de fusão da Spec 0008 documentado como
    padrão).
  - Agente IA com autonomia (cross-ref AGENTS.md + global-rules.md
    "Workflow com IA").
- `AGENTS.md` — adicionar referência cruzada para CONTRIBUTING.md quando
  o agente for ajudar humano contribuidor.

**Princípio Single Source of Truth aplicado:**

| Conteúdo                          | Vive em           | Outros docs apenas linkam |
| :-------------------------------- | :---------------- | :------------------------ |
| Workflow obrigatório do agente IA | `AGENTS.md`       | README, CONTRIBUTING      |
| Princípios de engenharia (regras) | `global-rules.md` | AGENTS, CONTRIBUTING      |
| Como contribuir (humano)          | `CONTRIBUTING.md` | README                    |
| Visão geral do framework          | `README.md`       | (raiz, ponto de entrada)  |

**Limite:** F é editorial, não muda código do CLI. Não envolve novas
features opt-in. Escopo enxuto (3-4 arquivos editados, ≤ 200 linhas
totais de mudança).

---

### Sub-bloco G — ADR de visibilidade pública

**Estado atual:** o repo `ai-guidelines` é privado. Decisão de torná-lo
público está em aberto há semanas, registrada na memória
`project_ai_guidelines_visibilidade_publica.md`. Impacto direto no Sub-bloco F:
se privado, README é institucional/interno; se público, README é
convite/institucional à comunidade BR. Sem decisão explícita, F teria que
escrever uma versão e depois reescrever — churn garantido.

**Decisão (registrada em 2026-04-24, segunda rodada de review):** fundir a ADR de
visibilidade pública nesta spec como Sub-bloco G, resolvendo antes da
execução de F. Aplica o critério canonizado da própria 0008: "se a entrega
de um altera o contrato do outro, specs separadas" — aqui a sobreposição é
real, então fundir é o movimento certo.

**Escopo do Sub-bloco G:**

- **Criar `docs/adr/0007-visibilidade-publica-ai-guidelines.md`** (numeração
  ADR em sequência do 0004) com:
  - Contexto: motivação (vitrine dev, contribuição open source BR,
    comunidade vulnerável) + bloqueios observados (conteúdo operacional
    interno, links GitHub só funcionam se público).
  - Opções consideradas: (1) manter privado; (2) público integral;
    (3) público com curadoria — separar layers públicos (rules, workflows,
    adapters, CLI) vs privados (memórias pessoais, notas estratégicas).
  - Decisão tomada + justificativa.
  - Consequências (impacto em naming do package, em referências GitHub em
    AGENTS.md de consumidores, em `.specify/memory/` que contém notas
    pessoais).
- **Atualizar memória** `project_ai_guidelines_visibilidade_publica.md`
  pós-decisão (marcar status como decidido + linkar ADR).
- **Pré-condição para F**: tom do README/CONTRIBUTING reflete a decisão.

**Decisão aberta (a resolver no PR F-G):**

- Qual das 3 opções adotar.
- Se "público com curadoria" (recomendação default): lista explícita de
  arquivos/pastas a gitignore-ar ou mover antes de tornar público
  (cruza com Spec 0015 — auditoria de inflado, que já fez a curadoria
  estrutural e destrutiva; G apenas formaliza a decisão).

**Mudanças em arquivos:**

- `docs/adr/0007-visibilidade-publica-ai-guidelines.md` — **novo** (G.1).
  pós-decisão (G.2).
- (Se adotar opção "público com curadoria") `.gitignore` e/ou exclusões
  no CLI para `.specify/memory/` — G.3.

**Limite:** G **não** executa a publicação nem reclassifica permissões
do repo no GitHub. Entrega apenas a decisão formalizada. A execução
(`gh repo edit --visibility public`) fica como ação manual pós-merge de
F-G, condicional a 0015 ter rodado.

**Ordem com 0015:** 0015 roda **antes** de F-G porque G precisa decidir
sobre um repo já curado (não faz sentido decidir visibilidade com pastas
`cinematic-ui-boilerplates/` / `design/inspirations/` inflando o repo).

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Sub-bloco A — Filtro doc → rules

- [ ] `mapping-doc-to-rules.md` produzido com classificação tripla (humano /
      universal / opt-in) por arquivo de `.core/docs/`.
- [ ] Nenhuma regra acionável para IA permanece exclusivamente em
      `.core/docs/` sem espelho em `.core/rules/`.
- [ ] `global-rules.md` no consumidor tem zero referências quebradas.
- [ ] Nova seção "Workflow com IA" criada em `global-rules.md` com 5 regras
      universais (incluindo PR collab 3 etapas).
- [ ] `applyRules` continua sincronizando idempotentemente; `rules.test.mjs`
      e `mandatory.test.mjs` passam sem regressão.

### Sub-bloco B — Consolidação RPI ↔ spec-foundation

- [ ] `AGENTS.md` regras 8 e 9 distinguem spec-foundation de plano leve com
      critério objetivo (> 1 sessão / > 1 arquivo / sobreviver a troca de
      sessão).
- [ ] `rpi-protocol.md` tem seção "Quando usar spec-foundation vs plano leve".
- [ ] `spec-foundation.md` tem header linkando rpi-protocol.md +
      atualização do lifecycle (open/close checklist) + política de NEXT.md.
- [ ] Templates novos em `.specify/templates/` (spec/plan/tasks/next) usados
      por todas as specs futuras.
- [ ] Nenhuma referência residual a `.ai-runtime/` em arquivos ativos.
- [ ] Adapter `~/.gemini/GEMINI.md` continua mínimo (Pointer-only conforme
      ADR 0004).
- [ ] **Bloqueador 2 do PR #19 resolvido**:
      `grep -n "DEFAULT_AI_GUIDELINES_REF" cli/` retorna zero matches (Opção 1) ou apenas referências documentadas (Opção 2).

### Sub-bloco C — Consolidação AI Efficiency

- [ ] `global-rules.md` tem **uma única seção** "Eficiência de IA" (não
      duas).
- [ ] `ai-efficiency-guide.md` zero links quebrados; matriz de modelos 2026;
      seção Prompt Caching adicionada.
- [ ] Conteúdo derivado de pesquisa adicionado: model routing + ceticismo,
      EN vs PT, AI revisando AI, cost awareness (com cross-ref Spec 0014).
- [ ] `AGENTS.md` regra 1 com link único ao guia.

### Sub-bloco D — Step 0 (Environment Awareness)

- [ ] `AGENTS.md` Phase 0 inclui sub-item Environment Check (≤ 8 linhas).
- [ ] Reflexo no `.core/templates/AGENTS-core.md.tmpl`.
- [ ] Smoke test manual em Claude Code (Windows) e Gemini CLI (Linux):
      confirmar que a IA invoca o check no início da sessão.

### Sub-bloco E — Quality Gates (opt-in)

- [ ] `.core/rules/quality-gates.md` criado com checklist mínimo (≤ 15
      linhas + ressalva sobre arquitetura crítica).
- [ ] `cli/features/opt-in/quality-gates.mjs` criado seguindo padrão de
      `prettier.mjs`/`husky.mjs`/`ci.mjs`.
- [ ] Wizard inclui `quality-gates` em `FEATURE_OPTIONS` com descrição
      "(recomendado)" e selecionado por default.
- [ ] Teste BDD (`quality-gates.test.mjs`) cobre ativação/skip da feature.
- [ ] Quando ativada, o arquivo é sincronizado para
      `.ai-guidelines/rules/quality-gates.md`; quando pulada, não é.
- [ ] **TDD reclassificado como opt-in** análogo: `tdd-guidelines.md`
      promovido para `.core/rules/tdd.md` + feature opt-in `tdd` no CLI
      (mesma estrutura de quality-gates).
- [ ] `ROADMAP.md` da Spec 0009 atualizado com cross-ref "implementa
      tecnicamente Spec 0008-E" (já feito em commit anterior; revalidar).
- [ ] Agnosticismo mantido: nenhuma menção a tooling específico no texto
      principal — apenas categorias e exemplos por linguagem entre
      parênteses.

### Sub-bloco F — Onboarding e contribuição

- [ ] `README.md` tem seção "Para começar" com 3 caminhos por persona.
- [ ] `CONTRIBUTING.md` tem workflows concretos para os 4 cenários
      (ajuste rápido, feature/refactor, spec consolidada, agente IA).
- [ ] `AGENTS.md` tem cross-ref para CONTRIBUTING.md.
- [ ] Templates SDD novos (`spec`/`plan`/`tasks`/`next` boilerplates)
      explicitamente citados em CONTRIBUTING.md.
- [ ] Validação Single Source of Truth: nenhum workflow duplicado em mais
      de um documento com versões diferentes.

### Sub-bloco G — ADR de visibilidade pública

- [ ] `docs/adr/0007-visibilidade-publica-ai-guidelines.md` criada seguindo
      padrão dos ADRs existentes (0001-0004) com contexto, opções,
      decisão e consequências.
- [ ] Memória `project_ai_guidelines_visibilidade_publica.md` atualizada
      pós-decisão (status "decidido" + link ADR).
- [ ] Se decisão for "público com curadoria": lista de exclusões
      documentada no ADR + refletida em `.gitignore` ou no CLI (conforme
      sobreposição com 0015).
- [ ] README e CONTRIBUTING do Sub-bloco F refletem o tom adequado à
      decisão (validação cruzada F ↔ G).

### Globais (toda a spec)

- [ ] Os 3 bloqueadores do PR #19 resolvidos (validados via grep na Fase 2).
- [ ] `yarn check` verde.
- [ ] `yarn test` verde (esperado 90+/90+ com novas BDDs de quality-gates +
      governance-coherence).
- [ ] PR Draft com matriz `.github/pull_request_template.md` preenchida.
- [ ] Diff de `AGENTS.md` em consumidor real com adopted: zero quebras retroativas.

---

## 🧪 Estratégia de Testes

- **BDD/Unit**:
  - `rules.test.mjs` — validar que toda regra promovida do sub-bloco A é
    sincronizada para `.ai-guidelines/rules/`.
  - `pointers.test.mjs` — validar que `AGENTS-core.md.tmpl` atualizado (com
    Step 0 + correção L19) é injetado corretamente.
  - **Novo:** `governance-coherence.test.mjs` — valida ausência de links
    quebrados em `global-rules.md` pós-promoção (cobre bloqueador 4).
  - **Novo:** `quality-gates.test.mjs` (em `cli/features/opt-in/`) — valida
    ativação opt-in via flag e via wizard, e skip explícito.
  - **Novo:** `tdd.test.mjs` análogo (em `cli/features/opt-in/`).
  - `engine.test.mjs` + `cli-input.test.mjs` — após decisão de B.7
    (DEFAULT_AI_GUIDELINES_REF), validar que nenhum teste regrediu.
- **Integração**:
  - `node cli/ai-guidelines-cli.mjs adopt --target "<repo_path>"
--dry-run` — diffar; nenhum link quebrado em `global-rules.md`.
  - `... adopt --target ... --with-quality-gates --with-tdd --dry-run` —
    validar que ambos opt-ins aparecem no diff esperado.
- **Manual**:
  - Smoke test do Step 0 em Windows + Linux/WSL com Claude Code + Gemini CLI.

---

## 🛠️ Arquivos modificados (esperado)

- `AGENTS.md` (raiz) — Phase 0 com Environment Check + regras 8/9 reescritas.
- `.core/templates/AGENTS-core.md.tmpl` — espelha `AGENTS.md`; corrige
  bloqueador 3 (L19).
- `.core/rules/global-rules.md` — corrige bloqueadores 4 (L37/L39); nova
  seção "Workflow com IA" (com PR collab 3 etapas); única seção "Eficiência
  de IA"; referência a `quality-gates.md` (opt-in) e `tdd.md` (opt-in).
- `.core/rules/quality-gates.md` — **novo**, checklist editorial.
- `.core/rules/tdd.md` — **novo**, regras imperativas extraídas de
  `tdd-guidelines.md`.
- `docs/rpi-protocol.md` — seção "Quando usar spec-foundation vs plano
  leve".
- `docs/process/spec-foundation.md` — header de canonização + lifecycle
  open/close + política NEXT.md + clarificação spec/plan.
- `docs/ai-efficiency-guide.md` — reescrita ampla (matriz 2026, prompt
  caching, model routing, EN vs PT, cost awareness).
- `docs/tdd-guidelines.md` — mantido como doc explicativo; regras
  imperativas migram para `.core/rules/tdd.md`.
- `cli/features/opt-in/quality-gates.mjs` — **novo**, padrão
  prettier/husky/ci.
- `cli/features/opt-in/quality-gates.test.mjs` — **novo**.
- `cli/features/opt-in/tdd.mjs` — **novo**, análogo.
- `cli/features/opt-in/tdd.test.mjs` — **novo**.
- `cli/core/cli-input.mjs` — `FEATURE_OPTIONS` ganha `quality-gates` e `tdd`;
  descrições atualizadas.
- `cli/core/engine.mjs` — chamadas `applyQualityGates` e `applyTdd` no fluxo
  de features; tratar bloqueador 2 (DEFAULT_AI_GUIDELINES_REF) conforme
  decisão de B.7.
- `.specify/templates/` — 4 boilerplates novos/refeitos (já criados em
  2026-04-24; documentar no commit).
- `.specify/specs/0008-governance-coherence/spec.md` — refatorada para
  enxuta (este commit).
- `.specify/specs/0008-governance-coherence/plan.md` — **novo** (este
  commit, recebe o conteúdo detalhado anterior).
- `.specify/specs/ROADMAP.md` — pode ser **migrado para
  `.specify/specs/roadmap/concluido.md` + `.specify/specs/roadmap/proximos.md`**
  conforme decisão B.10 (após benchmarks B.9). Migração inclui Spec 0014
  como candidata e Spec 0015 como prioridade Now (auditoria de inflado).
- `.specify/templates/roadmap-boilerplate.md` — **novo** (B.8).
- `.specify/templates/research-index-boilerplate.md` — **novo** (B.8).
- `README.md` — seção "Para começar" com 3 caminhos por persona (F.1).
- `CONTRIBUTING.md` — workflows concretos por persona (F.2).
- `AGENTS.md` — cross-ref para CONTRIBUTING.md (F.3).
- `docs/adr/0007-visibilidade-publica-ai-guidelines.md` — **novo** (G.1).
- `.gitignore` e/ou `cli/...` — ajustes condicionais se a decisão G for
  "público com curadoria" (G.3).
- `CHANGELOG.md` — entrada para a versão (Fase 2).

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                        | Mitigação                                                                                                                                                    |
| :--------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promover muitas regras de docs para rules infla `global-rules.md`            | Critério objetivo "imperativa → regra; explicativa → doc"; cap em 30 regras/seção.                                                                           |
| Reclassificação de TDD quebra repos que esperam o doc                        | Diff em consumidor real antes de mergear; manter `tdd-guidelines.md` como doc.                                                                               |
| Wizard com features opt-in demais cansa o usuário                            | Defaults bem escolhidos (recomendado por default); opção `--yes` pula tudo.                                                                                  |
| Step 0 vira ruído para tarefas pequenas                                      | Marcação como check rápido (≤ 8 linhas); modelos ignoram quando irrelevante.                                                                                 |
| Reescrita do `ai-efficiency-guide` perde insights atuais                     | Branch separada para draft; revisão antes de mergear; preservar versão histórica em git.                                                                     |
| Decisão B.7 (Opção 1 vs 2) requer mudança de contrato CLI público            | Documentar em CHANGELOG como breaking se Opção 1; manter como minor se Opção 2 + deprecation.                                                                |
| Sub-bloco G decide "público" mas pasta `.specify/memory/` tem notas pessoais | G depende de 0015 ter rodado (curadoria destrutiva); ADR lista exclusões explícitas; gitignore/remoção antes de executar `gh repo edit --visibility public`. |

---

## 📐 Decisões revisitadas

> Registro de decisões mudadas durante a execução. Não apaga histórico.

- **2026-04-24** — `spec.md` original (de 2026-04-23) fundiu spec + plan em
  um único arquivo. Reorganização: `spec.md` encolhido para conteúdo
  imutável (problema, escopo, fusão, critérios alto-nível); `plan.md` criado
  para conteúdo vivo (design por sub-bloco, DoD operacional, testes,
  arquivos, riscos técnicos). Decisão validada após observação 2
  do review. Templates SDD novos criados como pré-condição.
- **2026-04-24** — Sub-bloco E reclassificado de "regra editorial em
  `global-rules.md`" para "feature opt-in completa" (`.core/rules/quality-gates.md`
  - `cli/features/opt-in/quality-gates.mjs`). Razão: gates variam por stack,
    então aplicam o princípio da Spec 0005. Validado (observação 4).
- **2026-04-24** — Regra "PR description" original (categórica: "não delegue
  à IA") substituída por workflow colaborativo de 3 etapas. Validado
  (observação 1). Permanece como **core mandatory** — é regra
  acionável para o agente.
- **2026-04-24** — Visualizador de quotas mapeado para spec dedicada (Spec
  0014 candidata) em vez de virar mais um sub-bloco. Sub-bloco C apenas
  documenta interpretação manual. Validado (observação 3).
- **2026-04-24** — Sub-bloco B estendido com templates SDD que ainda
  faltavam (`roadmap-boilerplate`, `research-index-boilerplate`) +
  reformulação do formato do ROADMAP atual. Problema: numeração sequencial
  fixa força renumeração quando prioridade muda (já aconteceu com uma
  candidata renumerada de 0011 para 0013). Decisão preliminar (a validar
  via pesquisa B.9): candidatas vivem por slug, número só ao iniciar;
  ROADMAP migra para pasta `roadmap/` com 2 arquivos (`concluido.md` +
  `proximos.md`).
- **2026-04-24** — Sub-bloco F novo (Onboarding e contribuição) absorvido na 0008. Razão: README e CONTRIBUTING confusos para quem chega novo;
  workflows duplicados entre documentos. Aplica Single Source of Truth
  (mesma classe de problema que ADR 0004 resolveu para regras canônicas).
  Escopo enxuto (3-4 arquivos editados, ≤ 200 linhas).
- **2026-04-24** — Auditoria de inflado (skills/, mcp/, design/,
  cinematic-ui-boilerplates, advanced-ai-patterns, etc.) **NÃO entra em
  0008**. Vira **Spec 0015 (prioridade Now no ROADMAP)** porque é
  destrutiva, cruza com decisão de visibilidade pública, e contradiria o
  princípio "menos inflado" se inchar a 0008 em mais um sub-bloco.
- **2026-04-24** — **Estratégia de execução decidida: fragmentação híbrida
  em 3 PRs** (opção validada c). PR #20 atual é o PR de
  planejamento; após merge, a execução acontece em 3 branches derivadas
  de `main`, em **ordem sequencial** (por dependência em arquivos
  compartilhados):
  1. `feat/spec-0008-A-B-F` — editorial puro (filtro doc→rules +
     RPI/spec-foundation + templates faltantes + reformulação ROADMAP +
     onboarding README/CONTRIBUTING). Absorve bloqueadores 2, 3 e 4 do
     PR #19. Primeiro porque estabelece o critério "universal vs opt-in"
     que os outros dois PRs consomem.
  2. `feat/spec-0008-C-D` — AI Efficiency consolidado + Step 0
     Environment Awareness. Depende de A (critério universal vs opt-in)
     para saber o que entra em `global-rules.md`. Mexe em AGENTS.md,
     AGENTS-core.md.tmpl, global-rules.md, ai-efficiency-guide.md.
  3. `feat/spec-0008-E` — Quality Gates opt-in + TDD reclassificado como
     opt-in. Depende de A (TDD classificado como opt-in) e de B
     (templates novos + cli-input.mjs decidido). Mexe em cli/features/
     opt-in/ novos + testes BDD.
- **2026-04-24** — **Merge do PR de planejamento acontece antes da
  execução** (opção validada a). Razão: aplica o próprio princípio
  `spec.md` imutável + `plan.md` vivo, deixa templates SDD disponíveis
  para outras specs, permite pausar/retomar execução sem branch longa.
- **2026-04-24 (segunda rodada, pós-review da pesquisa B.9)** —
  **Princípio "repo-first, integração-friendly" canonizado e Sub-bloco G
  adicionado.** Contexto: após a pesquisa B.9 inicial, ficou questionado
  como o formato `backlog.md` escalaria em projetos maiores / GitHub-native /
  Jira. Validação independente confirmou que é discussão viva em
  `github/spec-kit` (Issues #880/#889/#1088, Discussion #1549) via
  **extension system**. Decisões encadeadas:
  1. Pesquisa `research/roadmap-format-benchmarks.md` ajustada: nomes finais
     `historico.md` + `backlog.md` (mais amplos semanticamente que
     `concluido.md`/`proximos.md`); tabela de síntese reclassifica
     GitHub Projects/Jira/Linear como **complementares**, não excludentes;
     nova seção "Política repo-first, integração-friendly" canoniza princípio;
     campo opcional `tracker` adicionado ao formato de entrada.
  2. Nova candidata **Spec 0016 — Roadmap Adapters / SDD Extension System**
     criada no ROADMAP como feature opt-in futura
     (`cli/features/opt-in/adapters/` com subadapters
     `github-projects.mjs`/`github-issues.mjs`/`jira.mjs`/`linear.mjs`).
  3. **Sub-bloco G adicionado à Spec 0008**: ADR de visibilidade pública do
     `ai-guidelines` é fundida nesta spec porque altera o contrato do
     Sub-bloco F (tom do README/CONTRIBUTING muda radicalmente se público
     vs privado). Sem fundir, F reescreveria o README duas vezes.
  4. **Spec 0015 (auditoria de inflado) permanece separada**: escopo
     destrutivo (rm de pastas herdadas) é categoria distinta do escopo
     editorial/construtivo da 0008. Misturar gera PR difícil de revisar e
     arriscada de reverter parcialmente.
  5. **Ordem de execução final revisada**: PR #20 (planejamento, merged) →
     `feat/spec-0008-A-B` (editorial sem F/G) → **Spec 0015 (auditoria,
     branch separada)** → `feat/spec-0008-F-G` (README/CONTRIBUTING + ADR
     visibilidade, com repo já curado) → `feat/spec-0008-C-D` → `feat/spec-0008-E`
     → **Spec 0016** (adapters, spec separada após 0008 completa).
  6. **Branch atual `feat/spec-0008-A-B-F`**: como F ainda não foi
     executado nesta branch, F sai do escopo da branch e vira branch
     própria `feat/spec-0008-F-G`. Renomear a branch atual para
     `feat/spec-0008-A-B` seria destrutivo sem ganho; mantida como está,
     mas escopo operacional = apenas A e B.
- **2026-04-25 (kickoff `feat/spec-0008-F-G`)** — **5 decisões fechadas
  ampliando escopo de G antes de qualquer arquivo ser tocado:**
  1. **Naming npm: híbrido**. `@ai-guidelines/core` como pacote técnico +
     branding "ai-guidelines BR" no README. Validar via benchmark formal
     (G.0.1) antes de comprometer; orgs `ai-guidelines` e `ai-guidelines-br`
     já criadas no npm sob usuário `rosanarezende` (squat defensivo).
  2. **Estratégia de migração: fresh repo**. Repo atual será arquivado
     (renomeado para `ai-guidelines-archive`, mantém privado preservando
     git history como acervo); novo repo público `rosanarezende/ai-guidelines`
     nasce com snapshot pós-curadoria como commit inicial. Razão:
     rastreabilidade preservada + clean slate público + sem risco de
     squash/rewrite. Substitui as opções (1) flip simples e (3) reescrita
     in-place originalmente listadas em G.
  3. **Curadoria precede ADR**. 4 auditorias formais (G.0.1-G.0.4) rodam
     antes do ADR ser escrito, gerando evidência: naming benchmarks,
     menções pessoais, citações de terceiros, exposição em git history.
     ADR consome auditorias como contexto. G.0.5 sintetiza e o mantenedor
     valida decisões finais antes da curadoria executiva.
  4. **Specs antigas não migram cruas**. Specs 0001-0004/5 (primeiras,
     confusas) não vão para o snapshot do repo novo; são distiladas em
     `roadmap/historico.md` cobrindo era pré-SDD (sem specs) → primeiras
     specs (só temas/data) → maturidade. Mostra evolução real sem expor
     conteúdo cru. Não viola imutabilidade pós-Review (specs antigas
     permanecem intactas no archive).
  5. **F.6 issue templates absorvido em F**. `.github/ISSUE_TEMPLATE/`
     com 4 templates (bug, feature, friction, question) entra no escopo
     de F antes de F.5 (yarn check). Roadmap 3/3 (revisão de integrações
     com precedentes da pesquisa B.9) **empurrado para depois** —
     candidatas resultantes vão para `roadmap/backlog.md` em sessão
     posterior, não bloqueia F-G.

  **Posicionamento canonizado para F.1 (README)**:
  ai-guidelines não se posiciona como solução definitiva, mas como
  **case study vivo** nascido de dor concreta (manter coerência
  editorial e governança técnica entre múltiplos agentes IA — Claude,
  Gemini, Codex — sem reescrever as mesmas regras em N lugares). Frase
  de abertura aceita como direção. Spec-kit (GitHub Spec
  Kit) citado explicitamente como precedente reconhecido — humildade
  - clarifica entrega de valor (sobreposição ~30%, diferenciação real
    em pointer architecture + multi-agent agnostic + opt-in features
    composable + governance coherence first-class).

- **2026-04-26** — **Validação final e marcação de progresso (PRs #21, #22, #23)**. Após auditoria técnica, as fases F (Onboarding) e G (Visibilidade Pública) foram validadas como implementadas. O `CHANGELOG.md` foi atualizado (Tarefa 2.4) para consolidar as mudanças das Specs 0008 e 0015. As tarefas correspondentes no `tasks.md` foram marcadas como concluídas `[x]`, refletindo o estado real do repositório antes da abertura do PR consolidado. A Spec 0015 foi oficialmente encerrada.
- **2026-04-27** — **Separação Arquitetural de Regras Editoriais Opt-in.** Durante a implementação das features opt-in (`quality-gates` e `tdd`), identificou-se que a função `applyRules` (que sincroniza as regras core) copiava indiscriminadamente todos os arquivos de `.core/rules/`. Para evitar que regras opt-in fossem sincronizadas mesmo quando desativadas, os arquivos opt-in foram movidos para a subpasta `.core/rules/opt-in/`. O motor CLI e a documentação (`docs/features.md`) foram atualizados para refletir essa distinção explícita.
