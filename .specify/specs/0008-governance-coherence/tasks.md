# Tasks — Spec 0008 Governance Coherence

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Draft (Fase 1 decomposta; Fase 2/3 a refinar conforme execução)

> **Ordem de execução revisada (2026-04-24, segunda rodada — ver
> `plan.md` seção "Decisões revisitadas"):** PR #20 planejamento (merged)
> → `feat/spec-0008-A-B` (A+B, esta branch, sem F) → **Spec 0015** (auditoria
> destrutiva, branch separada) → `feat/spec-0008-F-G` (F+G com repo curado)
> → `feat/spec-0008-C-D` → `feat/spec-0008-E`. Spec 0016 (adapters) roda
> após 0008 completa.

---

## Fase 0 — Setup e research

- [x] **0.1** Branch `feat/spec-0008-governance-coherence` criada.
- [x] **0.2** `spec.md` inicial criado.
- [x] **0.3** `ROADMAP.md` atualizado: 0005-B, 0008-original, 0010 marcadas
      como consolidadas em 0008.
- [x] **0.4** Criar `research/mapping-doc-to-rules.md` classificando cada
      arquivo de `.core/docs/` em **3 categorias** (decisão registrada
      2026-04-24, observação 4):
  - `humano` — pura documentação humana, mantém em `.core/docs/`.
  - `universal` — regra acionável de governança IA, vai para
    `.core/rules/global-rules.md` ou `.core/rules/<topic>.md` (mandatory
    core).
  - `opt-in` — regra de stack/processo (TDD, Quality Gates), vai para
    `.core/rules/<feature>.md` + feature em `cli/features/opt-in/`.
- [x] **0.5** Criar `research/governance-coherence-audit.md` listando todas
      as referências cruzadas atuais entre `AGENTS.md`, `global-rules.md`,
      `rpi-protocol.md`, `spec-foundation.md`, `ai-efficiency-guide.md`.
      Marcar quais quebram no consumidor pós-`adopt`.
- [x] **0.6** Sintetizar insights das 6 transcrições em
      `research/synthesis.md`, com impacto explícito por sub-bloco e
      justificativa dos spinoffs propostos (Specs 0011, 0012, 0014).
- [x] **0.7** Refazer `spec-boilerplate.md` (estava minimalista) e criar
      novos templates em `.specify/templates/`: `plan-boilerplate.md`,
      `tasks-boilerplate.md`, `next-boilerplate.md`. (Pré-condição para a
      separação spec/plan da própria 0008 — observação 2 do mantenedor.)
- [x] **0.8** Aplicar retroativamente o novo padrão à própria Spec 0008:
      separar `spec.md` (enxuto, imutável) + criar `plan.md` (vivo,
      detalhado). Registrado em `plan.md` seção "Decisões revisitadas".

---

## Fase 1 — Sub-bloco A (Filtro doc → rules)

- [x] **A.1** Para cada arquivo classificado como "regra acionável" em
      `mapping-doc-to-rules.md`, decidir destino:
  - Inline em `global-rules.md` (regra única, ≤ 3 linhas)
  - Arquivo dedicado em `.core/rules/<topic>.md` (conjunto de regras
    relacionadas, ex.: `.core/rules/tdd.md`)
  - **Decisão aplicada (2026-04-24):** conforme síntese em
    `research/mapping-doc-to-rules.md`, nenhum arquivo de `.core/docs/`
    tem regra imperativa nova para promover **neste PR**. TDD vai para
    `.core/rules/tdd.md` no sub-bloco E.TDD (PR 3); `ai-efficiency-guide.md`
    tem regras consolidadas no sub-bloco C (PR 2). As únicas regras novas
    em `global-rules.md` (seção "Workflow com IA") vêm da pesquisa de
    transcrições, não de `.core/docs/`.
- [x] **A.2** Mover/duplicar conteúdo conforme decisão de A.1, preservando
      versão histórica em `.core/docs/` quando o documento ainda tem valor
      explicativo (ex.: TDD guide pode coexistir com `.core/rules/tdd.md`
      sintético).
  - **No-op neste PR:** nenhum conteúdo movido (ver A.1). Movimentação de
    TDD acontece no PR 3; consolidação AI Efficiency no PR 2.
- [x] **A.3** Reescrever links cruzados em `.core/rules/global-rules.md` para
      remover qualquer referência a `docs/...` que quebre no consumidor.
      Substituir por:
  - Link interno a `.core/rules/<topic>.md` (vai ao consumidor)
  - Ou nota "Para detalhe completo, consulte o repositório fonte do
    ai-guidelines" (quando explicação só faz sentido na fonte)
- [x] **A.4** Atualizar `cli/features/core/rules.mjs` se A.1 introduzir novos
      arquivos em `.core/rules/` — verificar que `applyRules` itera todos
      automaticamente (já faz via `fs.readdir`; provável zero mudança).
  - **Confirmado zero mudança:** `applyRules` em `cli/features/core/rules.mjs`
    usa `fs.readdir(sourceRulesDir)` e itera todos os arquivos presentes.
    Arquivos novos (ex.: `.core/rules/tdd.md` em PR 3) serão sincronizados
    automaticamente.
- [x] **A.5** Adicionar teste em `rules.test.mjs` ou
      `governance-coherence.test.mjs` que valida ausência de links quebrados
      (regex por padrões `docs/`, `for-claude/`, etc.) em qualquer arquivo
      sincronizado para `.ai-guidelines/rules/`.
  - Criado `cli/features/core/governance-coherence.test.mjs` com regra
    `[BR-GOV-COH-01]` que varre `.core/rules/*.md` contra padrões
    `docs/`, `for-claude/`, `for-gemini/`, `for-codex/`, `.ai-runtime/`,
    `process/` em sintaxe de link markdown. 86/86 testes verdes.
- [x] **A.6** **[Bloqueador 4 do PR #19]** Reescrever
      `.core/rules/global-rules.md` linhas 37 e 39, que referenciam
      `docs/ai-efficiency-guide.md` e `docs/process/` (caminhos que não
      existem no consumidor pós-`adopt`). Substituir conforme decisão geral
      de A: link interno a `.core/rules/<topic>.md` ou nota "consulte
      repositório fonte do ai-guidelines".
- [x] **A.7** **[Bloqueador 3 do PR #19]** Reescrever
      `.core/templates/AGENTS-core.md.tmpl` linha 19, que ainda referencia
      `rules/global-rules.md` + `docs/ai-efficiency-guide.md` (paths antigos
      pré-pointer architecture). Apontar para `.ai-guidelines/rules/...`
      (path real do consumidor) ou remover a linha se a regra equivalente
      passar a viver no `global-rules.md` injetado.
- [x] **A.8** Adicionar nova seção **"Workflow com IA"** em
      `.core/rules/global-rules.md` com regras **universais** (mandatory core)
      vindas do `synthesis.md` + refinamentos registrados:
  - **Plan mode antes de agent mode** (reforço RPI).
  - **Referenciar padrão existente ao gerar código novo** (reduz alucinação,
    força consistência).
  - **PR description colaborativo (3 etapas)** — substitui a regra original
    categórica "não delegue à IA" (decisão registrada 2026-04-24, observação 1):
    > "Ao escrever ou editar PR description: (1) liste os tópicos relevantes
    > para validação humana antes do texto final; (2) só escreva o texto
    > após o humano editar/aprovar a lista; (3) submeta o texto final para
    > um último check humano antes de criar/editar o PR."
  - **Patterns devem ser agnósticos ao LLM**.
  - **Não documentar nomes de arquivo/pasta nas rules** — documentar padrões.
- [x] **A.9** Aplicar a classificação tripla decidida em 0.4 separando
      regras **opt-in** (Quality Gates → sub-bloco E; TDD → também opt-in,
      ver E.7) das regras universais. Documentar cada decisão em
      `mapping-doc-to-rules.md`.
  - **Classificação já documentada** em `research/mapping-doc-to-rules.md`
    (seção "Classificação por arquivo" + "Síntese — Ações em 0008").
    Quality Gates e TDD explicitamente marcados como opt-in; execução no PR 3.
- [x] **A.10** Documentar em `docs/process/spec-foundation.md` (ou em
      `CONTRIBUTING.md`) a nova categoria **"opt-in de stack"** vs
      **"universal de governança IA"** para futuros contribuidores.
  - **Executado como parte de B.4:** nova seção "Categorias de regras:
    universal vs opt-in de stack" em `docs/process/spec-foundation.md`
    com tabela categoria/destino/sincronização + link à Spec 0005.
- [x] **A.11** `yarn check && yarn test` verde.

---

## Fase 1 — Sub-bloco B (RPI ↔ spec-foundation)

- [x] **B.1** Editar `AGENTS.md` regras 8 e 9: distinguir explicitamente
      "spec-foundation (formal, persistente)" de "plano leve (na
      ferramenta)". Sugestão de critério objetivo (use spec-foundation
      quando): mais de uma sessão estimada, mais de 1 arquivo tocado fora
      de uma feature isolada, ou quando o resultado precisa sobreviver a
      troca de IA/sessão. Use plano leve nos demais casos.
- [x] **B.2** Espelhar mudança em `.core/templates/AGENTS-core.md.tmpl`.
- [x] **B.3** Adicionar seção em `rpi-protocol.md`: "Quando usar
      spec-foundation vs plano leve" com o critério acima.
- [x] **B.4** Atualizar `docs/process/spec-foundation.md` (decisão
      registrada em 2026-04-24, observação 2):
  - Adicionar header "Implementação canônica do passo Plan no ciclo RPI"
    linkando `rpi-protocol.md`.
  - Clarificar **distinção spec.md vs plan.md**: spec.md é imutável após
    `In Review`; plan.md é vivo durante execução; templates novos em
    `.specify/templates/` (já criados em 0.7).
  - Adicionar **checklist explícita de abertura de spec** (ler ROADMAP, ler
    research-index, instanciar 3-4 arquivos a partir dos boilerplates).
  - Adicionar **checklist explícita de fechamento de spec** (deletar
    NEXT.md, atualizar research-index, mover spec para "concluídas" no
    ROADMAP, status → Done).
  - Documentar política de **NEXT.md temporário-mandatório**: criar quando
    houver débitos adiados; deletar no encerramento (após migrar débitos
    para ROADMAP).
  - Documentar regra de ordem: **fechar spec anterior antes de abrir nova**.
  - **Executado:** reescrita ampla de spec-foundation.md (33 → 178 linhas).
    Inclui também A.10 (categoria universal vs opt-in) e B.12 (regra de
    numeração por slug sem renumeração).
- [x] **B.5** Grep por `.ai-runtime` em arquivos ativos
      (`AGENTS.md`/`.core/`/`docs/`) — confirmar zero matches; se algum,
      remover.
  - **Executado:** 5 matches totais. Mantidos como legítimos: `.gitignore`
    (exclui a pasta), `adrs/0001` + `adrs/0005` (referências históricas em
    ADRs, não rewriteable), `cli/features/core/governance-coherence.test.mjs`
    (padrão de regex do próprio teste). Removida 1 linha em
    `.core/docs/process/project-init.md` L11 (único match em arquivo ativo
    do `.core/docs/`). Demais partes stale do `project-init.md` ficam para
    Spec 0015 (mapping-doc-to-rules.md classifica como candidato a remoção).
- [x] **B.6** Validar `~/.gemini/GEMINI.md` (config local do mantenedor, fora do
      repo) — apenas conferir que continua como Pointer mínimo conforme ADR
      0004; se houver regra de RPI, esvaziar.
  - **Validado:** config global injetada via `user_rules` é um pointer
    mínimo com 3 princípios agnósticos, sem regras de workflow (coerente
    com ADR 0004).
- [x] **B.7** **[Bloqueador 2 do PR #19]** Decidir destino do
      `DEFAULT_AI_GUIDELINES_REF` em `cli/core/engine.mjs` (dead code:
      declarado, atribuído em `options["ai-guidelines-ref"]`, nunca lido
      downstream):
  - **Opção 1 aplicada (2026-04-24):** removida a constante `DEFAULT_AI_GUIDELINES_REF`
    em `engine.mjs`, a linha `"ai-guidelines-ref"` do objeto `options`, e
    a entrada `--ai-guidelines-ref <path>` do `printHelp` em `cli-input.mjs`.
    Grep `DEFAULT_AI_GUIDELINES_REF|ai-guidelines-ref` em `cli/` retorna zero.
    85/85 testes verdes após remoção (zero testes tocavam a opção).
- [x] **B.8** **[Templates faltantes — decisão registrada 2026-04-24]** Criar
      templates SDD que ainda faltam em `.specify/templates/`:
  - `roadmap-boilerplate.md` — formato canônico do ROADMAP (a definir após
    B.9).
  - `research-index-boilerplate.md` — formato canônico do
    `research-index.md` (cabeçalho explicativo, seções por spec, formato de
    entrada por arquivo de pesquisa).
  - **Executado:** criados `.specify/templates/roadmap-boilerplate.md` (190
    linhas; documenta `historico.md` + `backlog.md` com regras de uso +
    seção de migração de ROADMAP.md legado) e
    `.specify/templates/research-index-boilerplate.md` (75 linhas; header
    - estrutura de categorias com emojis + formato de entrada).
- [x] **B.9** **[Pesquisa de benchmarks — decisão registrada 2026-04-24]** Criar
      `research/roadmap-format-benchmarks.md` analisando como projetos open
      source maduros organizam roadmap e backlog público. Candidatos para
      benchmark: Vercel/Next.js, Astro, Vue, Vite, Specify Kit (GitHub),
      RFCs (Rust, React). Avaliar:
  - Pasta única vs pasta `roadmap/` com múltiplos arquivos (split
    passado vs futuro/presente — proposta inicial registrada).
  - GitHub Projects vs arquivo Markdown vs híbrido.
  - Numeração: sequencial fixa, slug-only, híbrida.
  - Como tratam reorganização de prioridade sem renumeração.
  - **Executado em commits anteriores** (e9b9424 + f66a27e). Arquivo
    final em `research/roadmap-format-benchmarks.md` com 9 projetos
    benchmarkados, síntese de padrões, validação da decisão preliminar +
    ajustes (nomes finais `historico.md`/`backlog.md`, política
    "repo-first, integração-friendly", handoff para Spec 0016 candidata).
- [x] **B.10** Decidir formato do ROADMAP com base em B.9. Decisão default
      preliminar (revisar pós-pesquisa):
  - Pasta `.specify/specs/roadmap/` com 2 arquivos:
    - `concluido.md` (specs concluídas + absorvidas, com rastreabilidade
      e números mantidos como histórico).
    - `proximos.md` (em execução + Now/Next/Later, candidatas por slug
      sem número).
  - Candidatas vivem por **slug**; número só alocado quando a spec sai de
    candidata e cria branch (próximo número sequencial disponível).
  - Reorganizar prioridade = mover linha entre seções, não renumerar.
- [x] **B.11** Reformatar `.specify/specs/ROADMAP.md` atual para o novo
      formato (ou migrar para a pasta `roadmap/` se for a decisão).
      Atualizar referências em `AGENTS.md`, `README.md`, `CONTRIBUTING.md`,
      `docs/process/spec-foundation.md` se mudarem caminhos.
- [x] **B.12** Atualizar `docs/process/spec-foundation.md` (já tarefa
      B.4) com a nova regra de numeração: "candidatas vivem por slug;
      número só ao iniciar a spec; nunca renumerar".
  - **Executado como parte de B.4:** nova seção "Numeração de specs" em
    `docs/process/spec-foundation.md` com regra canônica + motivação
    (candidata renumerada de 0011 para 0013 como exemplo de churn evitado).
- [x] **B.13** `yarn check && yarn test` verde.

---

## Fase 1 — Sub-bloco C (AI Efficiency)

- [x] **C.1** Mapear duplicação em `.core/rules/global-rules.md` entre
      "Economia de Tokens" (regras 7-9) e "Eficiência de IA — Lembrete
      Rápido" (linhas 33-39).
- [x] **C.2** Consolidar em **uma única seção** "Eficiência de IA" em
      `global-rules.md`. Conteúdo final: 4-6 regras imperativas
      (model routing, modularidade, feedback cirúrgico, ignore files, link
      ao guia profundo).
- [x] **C.3** Reescrever `docs/ai-efficiency-guide.md`:
  - Substituir links quebrados (`for-gemini/setup.md`, `for-claude/setup.md`,
    `for-codex/setup.md`) por links a `.core/rules/<adapter>.md`.
  - Atualizar matriz de modelos (seção 5) para 2026: Claude 4.x (Opus/Sonnet/
    Haiku), Gemini 2.x, GPT-4o.
  - Adicionar seção "Prompt Caching" (relevante para Claude Code / Anthropic
    API).
- [x] **C.4** Adicionar conteúdo derivado do `synthesis.md` no
      `ai-efficiency-guide.md`:
  - Seção "Model routing inteligente + ceticismo informado": não confiar
    cegamente em "mais novo é melhor"; documentar adaptive thinking como
    variável a observar; fallback para versão anterior conhecida.
  - Nota sobre **EN vs PT em prompts**: alguns modelos perdem nuance na
    tradução interna; recomendação de inglês para tarefas críticas, PT
    para iteração/exploração.
  - Padrão "AI revisando AI como júnior" como exemplo prático (não regra).
  - Seção "Cost awareness": como interpretar quotas/plan usage e quando
    rotacionar entre modelos ou fragmentar tarefa. **Visualizador automático
    fica para Spec 0014 (candidata)** — referenciar explicitamente.
- [x] **C.5** Confirmar que `AGENTS.md` regra 1 mantém referência única ao
      guia (`docs/ai-efficiency-guide.md`).
- [x] **C.6** `yarn check && yarn test` verde.

---

## Fase 1 — Sub-bloco D (Step 0 — Environment Awareness)

- [x] **D.1** Editar `AGENTS.md` Phase 0: inserir sub-item curto (≤ 8 linhas)
      "Environment Check" antes da regra 0 atual, com matriz Plataforma/
      Shell/Surface/Modelo.
- [x] **D.2** Espelhar em `.core/templates/AGENTS-core.md.tmpl`.
- [x] **D.3** Adicionar nota em `.core/rules/global-rules.md` (seção
      Eficiência de IA, pós-consolidação C): "antes de comandos de shell,
      consulte Phase 0 → Environment Check".
- [x] **D.4** Smoke test manual:
  - Sessão Claude Code (Windows + Git Bash): verificar se a IA explicita o
    ambiente antes da primeira ação de shell.
  - Sessão Gemini CLI ou Codex (Linux/WSL): mesmo teste.
  - Documentar resultados em `research/step-zero-smoke-test.md`.
- [x] **D.5** Refinar texto se smoke test mostrar ruído ou má adesão.
- [x] **D.6** `yarn check && yarn test` verde.

---

## Fase 1 — Sub-bloco E (Quality Gates como feature opt-in + TDD opt-in)

> **Decisão revisada (registrada 2026-04-24 (observação 4):** Quality Gates não
> entra como regra core mandatory em `global-rules.md`. Vira **feature
> opt-in** análoga a `prettier`/`husky`/`ci`, porque gates **variam por
> stack**. Princípio Spec 0005 ("opt-in = o que varia por stack") aplicado
> a regras editoriais. Mesma lógica para TDD.

### E — Quality Gates (feature opt-in)

- [x] **E.1** Criar `.core/rules/quality-gates.md` com checklist editorial
      mínimo (≤ 15 linhas) listando os 4 grupos de gates:
  - Análise estática (cyclomatic complexity, tamanho de módulo, estrutura
    de dependências).
  - Cobertura + mutation testing (sugestão default: cobertura ≥ 85%,
    mutation kill rate ≥ 60%).
  - Detecção de bugs típicos de IA (N+1, race condition, memory leak) com
    exemplos de tooling por linguagem em parênteses (ex.: "hypothesis em
    Python, fast-check em JS").
  - Secret scanning (cross-ref Spec 0012 candidata).
- [x] **E.2** Incluir ressalva: "gates objetivos pegam bugs locais;
      arquitetura crítica (tradeoffs, capacity, failure modes) ainda exige
      senior review humano".
- [x] **E.3** Manter agnosticismo: nenhuma menção a tooling específico no
      texto principal — apenas categorias e exemplos entre parênteses.
- [x] **E.4** Criar `cli/features/opt-in/quality-gates.mjs` seguindo o
      padrão de `cli/features/opt-in/prettier.mjs`:
  - Função `applyQualityGates(targetDir, options, context, actions)`.
  - Quando ativada: copia `.core/rules/quality-gates.md` para
    `.ai-guidelines/rules/quality-gates.md`.
  - Quando pulada: nenhuma escrita; ação registrada em `actions`.
  - Suportar `--dry-run` e `--prune` consistentes com outras features.
- [x] **E.5** Atualizar `cli/core/cli-input.mjs`:
  - Adicionar `quality-gates` em `FEATURE_OPTIONS`.
  - Adicionar descrição em `FEATURE_DESCRIPTIONS`: "Gates objetivos para
    código gerado por IA (recomendado)".
  - Garantir que está na seleção sugerida por default no wizard.
- [x] **E.6** Atualizar `cli/core/engine.mjs` para invocar
      `applyQualityGates` quando `features.includes("quality-gates")`.
- [x] **E.7** Criar `cli/features/opt-in/quality-gates.test.mjs` com BDD:
  - DADO `features: ["quality-gates"]` QUANDO `applyQualityGates` ENTÃO
    arquivo escrito em `.ai-guidelines/rules/quality-gates.md`.
  - DADO `features: []` QUANDO engine roda ENTÃO arquivo NÃO é escrito.
  - DADO `--dry-run` ENTÃO ação é registrada mas não escrita.
- [x] **E.8** Atualizar `ROADMAP.md` da Spec 0009 (já feito em commit
      anterior; revalidar) com referência cruzada "implementa tecnicamente
      Spec 0008-E + 0008-E.TDD".

### E.TDD — Separação Arquitetural de TDD, BDD e i18n

- [x] **E.9** Promover regras imperativas de `docs/tdd-guidelines.md` para novos arquivos em `.core/rules/opt-in/`: - `tdd-pt.md` e `tdd-en.md` (focados no ciclo técnico Red-Green-Refactor). - `bdd-pt.md` e `bdd-en.md` (focados no padrão DADO/QUANDO/ENTÃO).
      Manter `tdd-guidelines.md` original como doc explicativo.
- [x] **E.10** Atualizar testes ANTES da implementação (TDD para as próprias features): - Atualizar `cli/features/opt-in/tdd.test.mjs` e criar `bdd.test.mjs` garantindo suporte a i18n via parâmetro `options.lang`. - Atualizar `cli-input.test.mjs` para prever a pergunta sobre idioma e adição da feature `bdd`. - Atualizar `cli.integration.test.mjs` para validar o diff completo considerando TDD e BDD independentes.
- [x] **E.11** Atualizar `cli-input.mjs`: - Adicionar `bdd` em `FEATURE_OPTIONS`. - Adicionar flag/pergunta `--lang` (pt/en, default pt) quando `tdd` ou `bdd` forem selecionados.
- [x] **E.12** Criar/Atualizar as features no CLI: - Atualizar `cli/features/opt-in/tdd.mjs` para ler `.core/rules/opt-in/tdd-{lang}.md` e gerar `tdd.md` no alvo. - Criar `cli/features/opt-in/bdd.mjs` análogo para o BDD.
- [x] **E.13** Atualizar `engine.mjs` para invocar ambas as features independentemente e passar as opções de `lang`.
- [x] **E.14** `yarn check && yarn test` verde com os testes cobrindo a separação e os idiomas (esperado: sucesso em todos os cenários E2E e unitários).

### E.Refactor — Separação Arquitetural de Regras Opt-in

- [x] **E.R1** Criar subdiretório `.core/rules/opt-in/` e mover `quality-gates.md` e `tdd.md` para ele, garantindo que `applyRules` não os copie indiscriminadamente.
- [x] **E.R2** Atualizar `cli/features/core/rules.mjs` (`applyRules`) para ignorar subdiretórios (ex: `opt-in/`) durante a sincronização e proteger arquivos opt-in conhecidos durante o processo de _prune_ global.
- [x] **E.R3** Atualizar `quality-gates.mjs` e `tdd.mjs` para lerem de `.core/rules/opt-in/` e implementarem a deleção (prune) local caso a feature esteja desativada e a flag `--prune` seja utilizada.
- [x] **E.R4** Atualizar testes unitários (`rules.test.mjs`, `quality-gates.test.mjs`, `tdd.test.mjs`) para cobrir os novos cenários de exclusão e prune independente.
- [x] **E.R5** Adicionar teste de integração (E2E) em `cli.integration.test.mjs` para validar a ausência e o prune dos arquivos opt-in no contexto do motor CLI completo.
- [x] **E.R6** Documentar a distinção entre "Regras Core" e "Features Opt-in" em `docs/features.md`.

---

## Fase 1 — Sub-bloco F (Onboarding e contribuição)

> **Decisão registrada 2026-04-24:** README e CONTRIBUTING atuais estão
> confusos para quem chega novo. Falta caminho explícito por persona
> (humano novo, humano experiente, agente IA atuando autonomamente). Sub-
> bloco F clarifica entradas e workflows.

- [x] **F.1** Refatorar `README.md` adicionando seção "Para começar" com 3
      caminhos curtos:
  - **Quero usar o framework no meu repo** → `node cli/ai-guidelines-cli.mjs
init` ou `adopt`. Exemplos concretos.
  - **Quero contribuir** → ler `CONTRIBUTING.md`; entrada em
    `ROADMAP.md` (em "Itens oportunistas" ou abrir issue com label
    `friction`).
  - **Sou agente IA atuando neste repo** → ler `AGENTS.md` (Phase 0
    obrigatório); seguir ciclo SDD.
- [x] **F.2** Refatorar `CONTRIBUTING.md` com workflows concretos por
      persona:
  - **Ajuste rápido** (typo, bug pequeno): branch → PR Draft. Sem spec.
  - **Feature ou refactor** (>1 sessão, >1 arquivo): registrar em
    `ROADMAP.md` → criar pasta `.specify/specs/<slug>/` a partir dos
    templates (`spec-boilerplate.md` etc.) → branch → PR Draft.
  - **Spec consolidada** (absorve candidatas): seguir critério "se a
    entrega de uma altera o contrato da outra, separar"; documentar
    decisão de fusão na própria `spec.md`.
  - **Agente IA com autonomia**: ler `AGENTS.md` Phase 0 + `global-rules.md`
    seção "Workflow com IA"; seguir PR description colaborativo (3 etapas).
- [x] **F.3** Adicionar referência cruzada em `AGENTS.md` (na introdução)
      para `CONTRIBUTING.md` quando o agente for ajudar humano contribuidor.
- [x] **F.4** Validar consistência entre os 3 documentos (README ↔
      CONTRIBUTING ↔ AGENTS): nenhum link quebrado, nenhum workflow descrito
      em mais de um lugar com versões diferentes (Single Source of Truth
      por workflow).
- [x] **F.5** Criar issue templates em `.github/ISSUE_TEMPLATE/` com casos
      de uso explícitos (decisão registrada 2026-04-25):
  - `bug-report.md` — falha no CLI (`adopt`, `init`, sync), regra quebrada,
    link inválido em `.ai-guidelines/rules/` no consumidor.
  - `feature-proposal.md` — nova feature opt-in, nova regra universal,
    novo adapter (Spec 0016 candidata).
  - `friction-report.md` — incoerência de governança (rules conflitantes,
    documentação confusa), candidata a ADR.
  - `question.md` — discussão aberta, dúvida de adoção.
  - Cada template referencia `CONTRIBUTING.md` para o workflow correto.
- [x] **F.6** `yarn check && yarn test` verde.

---

## Fase 1 — Sub-bloco G (ADR de visibilidade pública)

> **Direção firmada (2026-04-25):** "público com curadoria" via \*\*fresh repo
>
> - snapshot curado\*\*. Repo atual será arquivado (renomeado para
>   `ai-guidelines-archive`); novo repo `ai-guidelines` nasce com snapshot
>   pós-curadoria como commit inicial. Ver entry de 2026-04-25 em
>   `plan.md` "Decisões revisitadas" para o racional completo das 5
>   decisões (naming híbrido + fresh repo + auditoria pré-ADR + specs
>   antigas distiladas + roadmap 3/3 empurrado).

### Pré-condições — Auditorias

- [x] **G.0.1** Pesquisa de benchmarks de naming npm →
      `research/npm-org-naming-benchmarks.md`. Analisar Vercel/Next.js,
      Anthropic, Astro, Vue, Specify Kit, Linear, Vite. Avaliar:
  - Convenção de scope (`@org/core`, `@org/cli`, monolito vs distribuído).
  - Branding regional/lingüístico (BR-first, hybrid, internacional puro).
  - Tradeoff entre fragmentação de pacotes e coesão.
  - **Validar híbrido**: `@ai-guidelines/core` como pacote técnico +
    branding "ai-guidelines BR" no README.
- [x] **G.0.2** Auditoria de menções pessoais →
      `research/name-attribution-audit.md`. Grep "rosanarezende"
      no conteúdo do repo (excluindo `.git/`, `.yarn/`, `.pnp.*`,
      `coverage/`, `yarn.lock`). Para cada match: file, line, contexto,
      classificação:
  - **preserve** — ADR signature, autoria formal, commit metadata.
  - **rewrite** — narração inline em prosa;
    converter para voz neutra, preservando autoria via referência ao
    ADR/commit.
- [x] **G.0.3** Auditoria de citações de terceiros →
      `research/third-party-citations-audit.md`. Listar nomes.
      Para cada um:
  - **Fonte canônica linkável** (canal YouTube, episódio, talk, livro)?
  - **Conteúdo no repo** (cita insight ou transcrição bruta?).
  - **Recomendação**: manter com link à fonte + atribuição correta;
    distilar (preservar insight, remover quote longa); ou remover
    (sem fonte pública linkável + sem consentimento explícito).
- [x] **G.0.4** Auditoria de exposição em git history →
      `research/git-history-exposure-audit.md`. Validar viabilidade da
      estratégia "fresh repo + snapshot curado" via varredura:
  - `git log -p` por padrões sensíveis (senha, segredo, token, email).
  - Lista de arquivos deletados em commits passados (transcrições,
    `.specify/memory/` antigos, conteúdo removido pela 0015).
  - Tamanho do histórico e binários grandes que não devem migrar.
  - Recomendação final: snapshot é viável e desejável, ou exposição
    é gerenciável com flip simples?
- [x] **G.0.5** Sintetizar achados das 4 auditorias e validar com o mantenedor
      decisões finais (validado: as 4 auditorias G.0.1-G.0.4 entram na
      lista de exclusão do snapshot).

### Curadoria executada

- [x] **G.curadoria** Sweep de reescrita pós-G.0.5:
  - Voz neutra para menções pessoais (preservando autoria via ADR
    signatures + commit metadata).
  - Atribuição correta a terceiros (link à fonte pública canônica).
  - Destilação ou remoção de transcrições brutas conforme G.0.5.
  - **Importante**: edições acontecem nesta branch (no repo atual);
    estado pós-curadoria é o que vai para snapshot inicial do repo
    novo. Repo atual preserva versão original via git history (vira
    `ai-guidelines-archive` privado).

### Formalização (ADR)

- [x] **G.1** Criar `docs/adr/0007-visibilidade-publica-ai-guidelines.md`
      (ADR 0005 já existe — `curadoria-publico-privado`; ADR 0006 também
      existe — `licenca`; ADR 0007 é o próximo número disponível, declara
      substituição autossuficiente da decisão preliminar de naming npm)
      seguindo padrão dos ADRs existentes. Conteúdo:
  - **Contexto**: motivação (vitrine dev, contribuição open source BR,
    comunidade vulnerável) + auditorias G.0.1-G.0.4 como evidência.
  - **Opções consideradas**:
    1. Manter privado.
    2. Público integral (flip simples).
    3. Público com curadoria via flip + reescrita in-place.
    4. **Público com curadoria via fresh repo + snapshot curado** (decisão).
  - **Decisão**: opção 4. Justificativa: rastreabilidade git history
    preservada (archive privado) + clean slate público + clareza de
    branding + sem risco de squash/rewrite.
  - **Plano de migração** (executado pós-merge, manual):
    1. Renomear repo atual para `ai-guidelines-archive` (privado),
       liberando o nome canônico.
    2. Criar repo `rosanarezende/ai-guidelines` público no GitHub.
    3. Snapshot pós-curadoria validado contra lista de exclusões antes do
       `git init`; commit inicial só depois de `git add .` + revisão de
       `git status`.
    4. Comunicar mudança via CHANGELOG/release notes; consumidores ativos
       atualizam URLs quando conveniente.
    5. Publicar `@ai-guidelines/core` no npm (ou conforme G.0.1).
  - **Naming npm**: decidido pós-G.0.1 (preliminar: `@ai-guidelines/core`).
  - **Tratamento das specs antigas**: 0001-0004/5 não migram cruas;
    `roadmap/historico.md` no novo repo cobre era pré-SDD + primeiras
    specs (só temas/data) + maturidade. Permite mostrar evolução real
    sem expor specs confusas.
  - **Consequências**: impacto em URLs GitHub nos AGENTS.md de
    consumidores; em `.specify/memory/`; em referências antigas; em
    estratégia de publicação npm.
- [x] **G.2** Atualizar memória
      `project_ai_guidelines_visibilidade_publica.md` pós-decisão final:
      status "decidido" + link ao ADR + timestamp.
- [x] **G.3** Configurar `.gitignore` no repo atual para conteúdo que
      **não vai ao snapshot** do novo repo (notas pessoais, transcrições
      brutas se decidido remover, etc.). Lista refletida no ADR.
- [ ] **G.6** Validar checklist de limpeza do `.gitignore` para o snapshot
      público (remover entries temporárias do ADR 0007).

### Validação cruzada e fechamento

- [x] **G.4** Validação cruzada F ↔ G: tom do README/CONTRIBUTING
      (F.1/F.2) reflete decisão pública (convite à comunidade, "case
      study vivo"); spec-kit citado como precedente reconhecido.
- [x] **G.5** `yarn check && yarn test` verde.

> **Limite:** G **não** executa a publicação em si. Entrega: ADR +
> auditorias + curadoria + plano de migração documentado. A criação do
> repo novo + snapshot é ação manual pós-merge, seguindo o plano do ADR.

---

## Fase 2 — Validação cruzada e PR

- [x] **2.1** Diff `node cli/ai-guidelines-cli.mjs adopt --target ../site --dry-run` — revisar ausência de links quebrados em `global-rules.md` injetado e presença das novas seções (Workflow com IA + Quality Gates). Validado em `../site`.
- [ ] **2.2** Mesmo teste em outro consumidor real se disponível.
- [x] **2.3** Confirmar que os 3 bloqueadores do PR #19 foram resolvidos
      (grep ad-hoc):
  - Bloqueador 2: `grep -n "DEFAULT_AI_GUIDELINES_REF" cli/` retorna zero
    matches (após B.7) ou apenas referências documentadas.
  - Bloqueador 3: `grep -n "rules/global-rules\|docs/ai-efficiency"
.core/templates/AGENTS-core.md.tmpl` retorna zero matches.
  - Bloqueador 4: `grep -n "docs/ai-efficiency\|docs/process"
.core/rules/global-rules.md` retorna zero matches.
- [x] **2.4** Atualizar `CHANGELOG.md` com seção 1.x.x descrevendo a
      consolidação (5 sub-blocos + bloqueadores absorvidos).
- [x] **2.5** PR Draft via `gh pr create --draft` com matriz
      `.github/pull_request_template.md` preenchida e descrição apontando à
      spec.
- [/] **2.6** Aguardar revisão humana antes de converter para Ready.

---

## Fase 2.5 — Dogfooding (Opt-ins locais)

> **Decisão:** Implementar as features opt-in no próprio repositório `ai-guidelines` para uso da equipe/agentes, sem contaminar os pacotes npm dos consumidores.

- [x] **2.5.1** Modificar `package.json` para adicionar o array `"files"` contendo apenas os diretórios públicos (`["cli", ".core", "docs", "README.md", "CHANGELOG.md"]`). Isso previne que `.ai-guidelines/`, `.husky/`, `.github/`, `tests/` vazem para o pacote npm publicado.
- [x] **2.5.2** Executar o CLI no repositório: `node cli/ai-guidelines-cli.mjs adopt --target . --yes` para instanciar todas as features opt-in (`quality-gates`, `tdd`, `bdd`, `prettier`, `husky`, `ci`) localmente.
- [x] **2.5.3** Garantir que os arquivos gerados no repositório (ex: `.ai-guidelines/rules/*.md`) sejam adicionados ao git para guiar agentes futuros.
- [x] **2.5.4** Atualizar teste `cli/features/opt-in/ci.test.mjs` para refletir os novos comandos esperados (BDD/TDD).
- [x] **2.5.5** Corrigir `cli/features/opt-in/ci.mjs` para usar formatadores de `package-context.mjs` (resolveInstallCommand e resolveCiRunner).
- [x] **2.5.6** Re-executar o CLI localmente para consertar o arquivo de workflow `.github/workflows/ai-guidelines-ci.yml`.
- [x] **2.5.7** Validar se a suíte de testes (integração e unitários) passa após as correções.

---

## ~~Fase 2.6 — Spec Init Command (Scaffold)~~ [REMOVIDA DO ESCOPO]

> **Decisão (2026-04-28):** Removida deste PR por recomendação do code review.
> O `spec init` é uma feature CLI nova sem relação com "Governance Coherence".
> Mantido como item oportunista no `roadmap/backlog.md` (L51) para promoção
> a spec separada quando priorizado.

---

## Fase 2.7 — Correções Pós-Review

> **Origem:** Code review do PR #1 (2026-04-28).

- [x] **2.7.1** Fix bug: `KNOWN_OPT_IN_RULES` faltava `"bdd.md"`. Derivar lista
      programaticamente de `FEATURE_OPTIONS` via `OPT_IN_RULE_FILES` em `cli-input.mjs`,
      filtrando features de infraestrutura (`prettier`, `husky`, `ci`).
- [x] **2.7.2** Criar `test-helpers.mjs` com factory `createOptInRuleTestSuite()` para
      eliminar boilerplate duplicado entre `quality-gates.test.mjs`, `tdd.test.mjs`
      e `bdd.test.mjs` (DRY nos testes opt-in — débito do backlog L47).
- [x] **2.7.3** Reescrever os 3 arquivos de teste opt-in para usar o helper DRY.
- [x] **2.7.4** Adicionar teste de governança `[GOVERNANCE]` em `rules.test.mjs` validando
      que `OPT_IN_RULE_FILES` contém todos os arquivos esperados e não contém features
      de infraestrutura.
- [x] **2.7.5** Adicionar teste explícito `[PRUNE]` para proteção de `bdd.md` no
      prune global.
- [x] **2.7.6** Validar suíte completa: 107/107 testes, cobertura 93%+.

---

## Fase 2.8 — Taxonomia Editorial vs Infraestrutura

> **Origem:** Observação pós-review (2026-04-28): a distinção entre features editoriais e de infraestrutura não estava clara na estrutura de pastas, código-fonte nem documentação.

- [x] **2.8.1** Criar subpastas `cli/features/opt-in/editorial/` e `cli/features/opt-in/infrastructure/`.
- [x] **2.8.2** Mover quality-gates, tdd, bdd, test-helpers para `editorial/`.
- [x] **2.8.3** Mover prettier, husky, ci para `infrastructure/`.
- [x] **2.8.4** Atualizar imports em `engine.mjs` com caminhos novos e comentários semânticos.
- [x] **2.8.5** Atualizar imports relativos internos (`../../core/` → `../../../core/`).
- [x] **2.8.6** Reestruturar `cli-input.mjs`: exportar `EDITORIAL_FEATURES` e
      `INFRASTRUCTURE_FEATURES` como fonte de verdade, derivar `FEATURE_OPTIONS`
      por composição, simplificar `OPT_IN_RULE_FILES`.
- [x] **2.8.7** Reescrever `docs/features.md` com terminologia "Infraestrutura"
      consistente, tabela de taxonomia e referências aos paths do source.
- [x] **2.8.8** Adicionar business rules `[BR-CLI-EDITORIAL-*]` e `[BR-CLI-INFRA]`
      em `docs/cli/ai-guidelines-cli.md`, renumerar seções.
- [x] **2.8.9** Validar suíte completa: 107/107 testes, cobertura 93%+.

---

## Fase 3 — Encerramento

- [x] **3.1** Após merge: deletar `.specify/specs/0008-.../NEXT.md` (se
      criado), migrando débitos relevantes para `roadmap/backlog.md`.
- [x] **3.2** Atualizar `.specify/specs/research-index.md` com índice dos
      arquivos de `research/` desta spec.
- [x] **3.3** Marcar spec como "Done" no header e mover entrada para
      `roadmap/historico.md` (remover de "Em execução" em
      `roadmap/backlog.md`).
