<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0022 — CLI Runtime Cutover (DDD + TDD + BDD)

> Status: **Paused — Stage A (Discovery)** _(framing arquitetural sob revisão; aguarda Spec 0023 — lifecycle metodológico novo)_
> Author: Claude Code (em sessão com Rosana Rezende, 2026-05-18)
> Date: 2026-05-18
> Owner: Rosana Rezende
> Tipo de spec: ~~mixed~~ _(classificação será revista quando o novo lifecycle estiver disponível)_
> Decision Brief: [`./decision-brief.md`](./decision-brief.md) — _ver aviso no cabeçalho daquele arquivo_
> Plan: ~~[`./plan.md`](./plan.md)~~ → [`./plan.archived.md`](./plan.archived.md) _(arquivado por invalidação metodológica)_
> Tasks: ~~[`./tasks.md`](./tasks.md)~~ → [`./tasks.archived.md`](./tasks.archived.md) _(arquivado por invalidação metodológica)_

> ⚠️ **Aviso editorial — pre-discovery framing artifact (sessão 2026-05-18)**
>
> Este `spec.md` foi escrito na sessão de design 2026-05-18 e **capturou corretamente a percepção de que existe um problema arquitetural importante** (coexistência de `cli/` mjs e `src/` TS, débito enterrado no NEXT.md da 0021, necessidade de cutover real). Permanece preservado como **artifact histórico** dessa percepção.
>
> Mas a sessão também revelou que **o próprio framing do problema** estava parcialmente enviesado por heranças do estágio AI-first/spec-centric:
>
> - CLI-first (assumiu implicitamente que CLI é a arquitetura-alvo),
> - runtime assumptions (assumiu que comandos atuais são bounded contexts reais),
> - command-centricity (assumiu que `init`/`adopt`/`update`/`providers`/`check-budget` continuam centrais),
> - spec-centricity (nasceu como spec antes de discovery arquitetural).
>
> Em outras palavras: este documento sabia que **havia um problema**, mas ainda não tinha maturidade para formular corretamente **qual era o problema real do sistema**. O framing correto exige discovery sob o novo lifecycle metodológico — em desenvolvimento na **Spec 0023 (Governance Workflow & Discovery Model)**.
>
> **Como ler este arquivo:** como evidência da percepção inicial de tensões arquiteturais, NÃO como descrição operacional válida do problema. O escopo, perguntas e premissas aqui contidos devem ser **reexaminados** após o Stage A (Discovery) sob a Spec 0023.

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
>
> **Princípios da Escrita:** ver `.core/process/governance-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

O framework `ai-guidelines` hoje tem **dois lares de código vivo** que cumprem papéis sobrepostos: `cli/` (41 arquivos `.mjs` que servem o comando publicado `npx ai-guidelines <init|adopt|update|providers|check-budget>`) e `src/` (53 arquivos `.ts` com modelo DDD construído ao longo da Spec 0021). Para um humano novo lendo o repositório, a primeira pergunta é "qual é o código real?" — e a resposta hoje é "depende do comando".

Esta spec **elimina `cli/`** ao implementar via DDD + TDD + BDD em `src/` tudo o que o `cli/` mjs faz hoje. Não é um move de arquivos; é um **cutover arquitetural completo**: cada comando da CLI passa a ser servido por casos de uso (use cases) isolados em `src/app/use-cases/` com testes próprios, composition root explícito em `src/cli/`, e adapters reais em `src/infrastructure/`. Quando a spec encerrar, a pasta raiz `cli/` não existe mais e o consumidor não nota diferença (mesmos comandos, mesmo comportamento — só o **runtime interno** muda para DDD).

A spec absorve o aprendizado da própria Spec 0021: a tentativa anterior (PR #15, branch `feat/spec-0022-cli-runtime-relocation`) propôs cutover só de paths ("de-arrumação") como atalho de 1-2 dias; a owner corrigiu o escopo na sessão 2026-05-18 — o cutover precisa eliminar a duplicação **arquitetural**, não só visual. PR #15 foi fechado; esta spec (PR #16) entra com escopo correto e Harness Lock multi-PR para caber em revisões legíveis.

### Histórico de instanciação

- **Tentativa 1** (PR #15, fechada): escopo "de-arrumação" — `git mv cli src/cli` sem refatorar conteúdo. Branch `feat/spec-0022-cli-runtime-relocation` arquivada.
- **Tentativa 2** (esta — PR #16): escopo "cutover arquitetural completo" via DDD/TDD/BDD. Branch `feat/spec-0022-cli-runtime-cutover`.

---

## 📦 Escopo

### Dentro do escopo

- **Para cada comando publicado** (`init`, `adopt`, `update`, `providers`, `check-budget`): garantir que existe um **caso de uso DDD em `src/app/use-cases/`** com testes próprios (TDD), e que esse use case é o que **realmente roda** quando o consumidor executa o comando (não a versão mjs de `cli/`).
- **Para cada feature de runtime** em `cli/features/`, `cli/governance/`, `cli/fs/`: migrar para a camada DDD correspondente em `src/` (`src/domain/`, `src/app/`, `src/infrastructure/`), com testes próprios.
- **Composition root** em `src/cli/` (substituindo `cli/ai-guidelines-cli.mjs`) que injeta adapters reais nos casos de uso e roteia comandos do argv para use cases.
- **`package.json:bin`** aponta para o novo entrypoint em `src/cli/`.
- **Suíte de smoke tests** validando comportamento ponta-a-ponta (BDD) de cada comando via tarball real (`npm pack` + install em sandbox + roda o comando).
- **Remoção total da pasta `cli/`** quando todos os comandos e features estiverem cobertos em `src/` e validados.
- **Harness Lock multi-PR** explícito: a spec é executada em sub-PRs sequenciais (número exato cravado em `[DEC-0022-A01]`), cada um deixando o repo em estado funcional (consumidor não quebra entre PRs).

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Rebranding textual** ("a CLI" → "`ai-guidelines`", `yarn guidelines` → `yarn ai-guidelines`, scripts `guidelines:*` → `ai-guidelines:*`, mensagens de `printHelp`): mantém termos atuais. Rebranding completo vira spec própria (slug provisório `cli-naming-cleanup`) — não bloqueia esta spec e não interfere no cutover.
- **Rename do pacote npm `ai-guidelines`**: registrado no backlog como decisão de positioning (ADR 0018 / sinal de mercado). Não aqui.
- **Mudanças de comportamento dos comandos**: o cutover é **estritamente** equivalente — mesmo output, mesmas opções, mesmos arquivos gerados, mesmos códigos de saída. Qualquer melhoria de UX ou correção de bug **descoberta durante o cutover** vira issue/spec separada; aqui só replica comportamento.
- **Novos comandos**: se durante o cutover surgir necessidade de comando novo, ele é spec própria.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Pasta raiz `cli/` não existe mais ao final da spec (verificável via `ls`).
- [ ] `package.json:bin` aponta para arquivo dentro de `src/cli/`.
- [ ] Cada comando publicado (`init`, `adopt`, `update`, `providers`, `check-budget`) é servido por um caso de uso DDD em `src/app/use-cases/` com cobertura de teste.
- [ ] Toda feature de runtime em `cli/features/`, `cli/governance/`, `cli/fs/` foi migrada para a camada DDD correspondente em `src/` (ou explicitamente declarada como deprecated com remoção planejada).
- [ ] Suíte de testes mantém ou aumenta a cobertura — pipeline `yarn check && yarn test` verde com todos os testes da 0021 (296+ baseline) preservados ou substituídos por equivalentes DDD.
- [ ] Smoke tests `yarn test:smoke` cobrindo todos os comandos verdes em ubuntu/macos/windows × node 22/24 (matriz CI atual).
- [ ] Tarball gerado por `npm pack` contém o entrypoint correto, os artefatos compilados em `dist/`, e **não** contém `cli/` (porque não existe mais).
- [ ] Consumidor que instala via `npm i ai-guidelines` e roda qualquer dos 5 comandos em diretório vazio recebe o **mesmo output** que recebia antes (golden test comparativo entre baseline pré-cutover e estado pós-cutover).
- [ ] Cada sub-PR do Harness Lock é independente (CI verde, consumidor funciona) — nenhum sub-PR deixa o repo em estado quebrado.
- [ ] Última sub-PR (cleanup final) revisada e aprovada por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design (estrutura Harness Lock, ordem de cutover, bridge, estratégia de testes, saúde técnica).
- **Origem do escopo correto**: sessão 2026-05-18 entre Rosana Rezende e Claude Code. A primeira tentativa (PR #15) foi vetada pela owner por inverter o escopo (move sem refator). Esta spec corrige isso e nasce com Harness Lock explícito porque a owner concordou em ir além de 1-2 dias.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**:
  - Spec 0021 PR #14 mergeada (entrega `dist/` no tarball npm + `prepack` build automático + fail-fast em `engine-unavailable`). Sem isso, o entrypoint movido para `src/cli/` não consegue carregar a engine no consumer.
  - Spec 0021 PR #14 também entrega a maioria dos use cases base (AdoptWorkspace, AssembleArtifact, CheckLivingDocs, GenerateLivingDocs, PromoteWorkItem, RegisterWorkItem, StructuralValidation, etc.) que serão usados ou ampliados aqui.

- **Specs afetadas**:
  - **Spec 0021** — fronteira: a 0021 entrega o "porquê" (governance-driven, `.governance/` canônico, modelo DDD em `src/`) e a 0022 entrega o "como executar" o cutover do runtime. 0021 nunca toca `cli/`; 0022 elimina `cli/`.
  - **Backlog "Cutover completo da CLI mjs para `src/` DDD"** (`roadmap/backlog.md`, migrado pela 0021): esta spec **absorve** esse item. Ao mergeá-la, a entry no backlog é movida para `roadmap/historico.md` com ponteiro a esta spec.
  - **Backlog "Rebranding textual do produto"** (a abrir): independente desta spec, executada depois.

- **Cross-refs com specs irmãs**:
  - **Spec 0021** — fronteira já citada.

- **Riscos macro**:
  - **Quebra de comportamento do consumidor**: o cutover é estritamente equivalente, mas implementar via DDD pode introduzir diferenças sutis (ordem de operações, mensagens de log). Mitigação: golden tests comparativos + smoke tests cross-OS + revisão humana de cada sub-PR.
  - **PRs não-independentes**: se um sub-PR depender de mudanças não-mergeadas de outro, vira deadlock. Mitigação: cada sub-PR deixa o repo em estado funcional (bridge `cli/` ↔ `src/cli/` durante a transição — detalhes em `[DEC-0022-A03]`).
  - **Escopo crescer durante a execução**: ao migrar uma feature, descobrir que ela tem bugs/duplicação. Mitigação: regra "replicar comportamento, não corrigir" — bugs viram issues separadas, não entram no cutover.
  - **Duração maior que estimada**: estimativa empírica de ~1 semana com Harness Lock pode escorregar para 2-3 semanas se features residuais forem mais complexas. Mitigação: cada sub-PR é independente, então a spec pode pausar entre sub-PRs sem prejuízo.

---

## 📚 Referências

- Spec 0021 — Governance Information Architecture (origem do débito declarado em `roadmap/backlog.md`).
- ADR 0018 — Governance-first, AI-as-Channel (princípio narrativo do produto).
- `roadmap/backlog.md` — entry "Cutover completo da CLI mjs para `src/` DDD" (absorvida por esta spec).
- PR #15 (fechado) — tentativa anterior com escopo de "de-arrumação" (vetada pela owner). Branch `feat/spec-0022-cli-runtime-relocation` arquivada.
- Sessão de design 2026-05-18 (Rosana + Claude Code) — trilha narrativa nos commits que abrem esta spec.
