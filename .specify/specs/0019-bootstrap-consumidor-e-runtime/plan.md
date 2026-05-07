# Plan — Spec 0019 Bootstrap Consumidor e Runtime

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Review

---

## 🛰️ Stage 1 / Stage 2

> **Stage 1 (Research → opções).** Coletar evidência, preencher `decision-brief.md` com pontos em status `Pendente` e aguardar Gate humano (Aplica-se aos sub-blocos B e C).
>
> **Stage 2 (Design + Implementação).** Sub-bloco A (CLI Wizard e Template Sync) entra direto. Sub-bloco B (Arquitetura do Runtime e Trampolins) e sub-bloco C (Update Lifecycle Unificado, adicionado em 2026-05-07) aguardam Gate. O Gate do bloco C foi consensuado direto pelo owner durante a revisão da implementação, sem necessidade de research adicional — o problema é continuação direta dos blocos A/B com design já aderente.

---

## 📚 Research Lifecycle

> Arquivos de pesquisa que fundamentam o `decision-brief.md`.

- `research/2026-05-06-trampolins-e-guardrails.md` — Responde: Como mitigar o Context Rot gerando scaffolding de inicialização de providers na CLI? (Alimenta `[DEC-0019-B01]`).
- `research/2026-05-06-topologia-runtime.md` — Responde: Qual deve ser a hierarquia e as divisões semânticas (zonas) do AGENTS.md para deixá-lo legível e menos monolítico? (Alimenta `[DEC-0019-B02]`).

---

## 🏗️ Design e Arquitetura

### Princípio guia

Separar as mudanças da CLI (determinísticas) da governança de templates/trampolins e arquitetura final do payload (evidence-driven).

### Componentes ou Sub-blocos

#### [A | CLI Wizard & Template Distribution] `(deterministic)`

**Estado atual**:
CLI pergunta as features numa lista flat. Não copia `.specify/templates` para o destino.

**Decisão**:

- Refatorar wizard (`cli.mjs` ou módulo interativo correspondente) para agrupar escolhas (ex: Editoriais vs. CI/CD vs. Processo).
- Substituir o fluxo manual de CSV em `readline` por prompts interativos com `@inquirer/prompts`, usando `checkbox` para seleções múltiplas e `select`/`confirm` quando aplicável.
- Formalizar a execução local da CLI via scripts `yarn cli*`, evitando o uso suportado de `node cli/ai-guidelines-cli.mjs` em ambiente Yarn PnP.
- Quando uma feature selecionada entrar em conflito com contexto detectado do consumidor, informar explicitamente o bloqueio e oferecer override interativo granular no wizard/TTY, sem exigir `--force` global.
- O comando `providers` deve preservar `features`/`lang` do runtime existente e fazer merge aditivo de providers por padrão, usando `--prune` como modo autoritativo para remoção.
- Atualizar módulo de `init`/`adopt` para realizar a cópia controlada do diretório `.specify/templates/` da origem para dentro de `.ai-guidelines/templates` no repo consumidor.
- Remoção definitiva do arquivo legado `.core/templates/AGENTS-pointer.md.tmpl` e de suas referências, já que o modelo de pointer único foi descontinuado.
- Persistir a configuração mínima do consumidor em `.ai-guidelines/config.json`, incluindo `sdd_dir`, `providers`, `features` e `lang`; `adapters` seguem como derivação interna, não como contrato persistido.
- Redistribuir o conteúdo útil do `CLAUDE.md` raiz entre `AGENTS.md` fora de `<AI_GUIDELINES>`, `README.md` e `CONTRIBUTING.md`, reduzindo o arquivo Claude local a um ponteiro mínimo para evitar drift documental.

**Mudanças em arquivos**:

- `cli/ai-guidelines-cli.mjs` (ou arquivos dentro de `cli/features/`) — Refatoração do prompt interativo e workflow de deploy.
- `package.json` / `yarn.lock` — inclusão de `@inquirer/prompts` como dependência de runtime aprovada pelo owner.
- `README.md` e templates SDD — atualização do comando canônico para `yarn cli`.
- `AGENTS.md` / `CLAUDE.md` / `CONTRIBUTING.md` — consolidação do contexto operacional local e remoção de redundância específica de provider.
- `cli/app/engine.mjs` / `cli/features/opt-in/infrastructure/prettier.mjs` — prompts de incompatibilidade e override granular.
- `cli/features/core/config.mjs` / `cli/features/core/pointers.mjs` — persistência ampliada de config e merge semântico do comando `providers`.

#### [B | Runtime Architecture & Trampolines] `(evidence-driven)`

**Estado atual**:
O compilador constrói um `AGENTS.md` monolítico que ainda sofre de redundâncias e inclui um ponteiro frágil. Arquivos de adapter (`CLAUDE.md`, etc) proliferam sem controle no consumidor.

**Decisão**:

- Implementar seleção explícita de providers no wizard e via flags/CLI (`providers`), gerando apenas os trampolins e ignore files correspondentes aos providers escolhidos.
- Separar `providers` (arquivos nativos como `CLAUDE.md`, `.cursor/rules/ai-guidelines.mdc`, `.openai/instructions.md`) de `adapters` do monólito (`claude`, `codex`, `gemini`), com mapeamento determinístico entre eles quando aplicável.
- **Colocalizar adapter content no trampolino**: regras específicas do adapter (ex.: `.core/rules/adapters/claude.md`) deixam de ser injetadas no `AGENTS.md` compilado e passam a viver dentro do bloco `managed-block` do trampolino correspondente, abaixo do hard-redirect. Resultado: `AGENTS.md` perde a seção `### Provider Adapters` (e o H3 órfão), e cada provider lê seu próprio arquivo nativo com tudo o que precisa para complementar a camada universal.
- Remover o template legado `AGENTS-pointer` e passar a compilar o `AGENTS.md` diretamente em zonas temáticas: `Top Zone: Primary Directives`, `Lifecycle & Spec System`, `Git & PR Workflow`, `Engineering Principles`, `Center Zone: Opt-in Methodologies` e `Base Zone: Tactical Context`.
- Usar `sdd_dir` do config para interpolar caminhos do consumidor dentro do runtime compilado, evitando referências hardcoded ao repositório mantenedor.

**Mudanças em arquivos**:

- `cli/features/core/compiler.mjs` e afins.
- `cli/features/core/trampolines.mjs` — novo módulo para scaffolding de providers.
- `cli/features/core/templates.mjs` — novo módulo para sincronização de `.specify/templates`.
- `cli/features/core/config.mjs` — novo módulo para leitura/escrita de `.ai-guidelines/config.json`.

#### [C | Update Lifecycle Unificado] `(deterministic, adicionado em 2026-05-07)`

**Estado atual**:
A primeira implementação distribui trampolins, ignore files e templates SDD ao consumidor sem contrato de update. Quando o framework atualiza um desses artefatos, o consumidor só recebe a mudança rerodando `adopt`, que sobrescreve customizações sem aviso. O comando `providers --prune` propaga prune para `.ai-guidelines/templates/`, com risco de apagar customizações do consumidor (regressão silenciosa de dados). Trampolins preexistentes são preservados integralmente, silenciando atualizações da CLI até o usuário rodar `--force`.

**Decisão (consenso owner 2026-05-07)**:

- **Política unificada de update** dividida em dois modos:
  - **`managed-block`**: trampolins (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, `.cursor/rules/ai-guidelines.mdc`, etc.) e ignore files (`.claudeignore`, `.aiexclude`, `.gptignore`) recebem marcadores delimitando a região controlada pela CLI:
    - Markdown: `<!-- ai-guidelines:managed-start v=1 -->` ... `<!-- ai-guidelines:managed-end -->`
    - Estilo gitignore: `# ai-guidelines:managed-start v=1` ... `# ai-guidelines:managed-end`
    - Updates substituem **somente** o conteúdo entre marcadores. Conteúdo fora preservado.
    - Em arquivos preexistentes sem marcadores: prepend do bloco gerenciado + comentário PT-BR dirigido ao mantenedor humano sinalizando legado preservado abaixo (instrução textual neutra à IA, sem metaprompt frágil).
  - **`mirror`**: `.ai-guidelines/templates/` é overwrite total. Seguro porque boilerplates SDD não são editados in-place — customização vive em `.specify/specs/<slug>/`. Comando `providers` **nunca** propaga prune para esse path (corrige regressão).
- **Comando dedicado `update`**: lê `.ai-guidelines/config.json` existente e re-aplica trampolins + templates + recompilação do `AGENTS.md`. Não-interativo por padrão, idempotente, não modifica o config. Sem `--force` (managed-block já isola o que é seguro sobrescrever); `--force` permanece como override raro para reescrever conteúdo legado também.
- **Versionamento `v=N`** no marcador permite migração futura sem quebra: incremento sinalizado por warning na CLI quando detectar versão antiga.

**Mudanças em arquivos**:

- `cli/features/core/managed-block.mjs` — novo módulo: parser/serializer de blocos delimitados, com 3 estratégias (arquivo novo, com marcadores, legado sem marcadores).
- `cli/features/core/managed-block.test.mjs` — testes unitários cobrindo todas as estratégias e idempotência.
- `cli/features/core/trampolines.mjs` — passa a emitir conteúdo dentro de `managed-block`; adapter content do provider correspondente é injetado no bloco.
- `cli/features/core/templates.mjs` — modo `mirror` controlado; aceita flag `prune` apenas quando chamado por `init`/`adopt`/`update`, nunca por `providers`.
- `cli/governance/monolith/compiler.mjs` — remoção da seção `### Provider Adapters` do compilado.
- `cli/app/engine.mjs` — novo comando `update`.
- `cli/cli/args.mjs` — registro do comando `update` no parser e no help.
- `tests/integration/cli.integration.test.mjs` — cobertura de todos os caminhos de update (legado, managed, idempotência).

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A]

- [x] O CLI agrupa corretamente as categorias ao rodar interativamente.
- [x] O wizard substitui entrada CSV por UX de seleção interativa (`checkbox`) para features e providers.
- [x] O repositório expõe scripts `yarn cli*` e documenta esse contrato como caminho suportado de execução local.
- [x] A CLI informa quando uma feature selecionada é bloqueada por incompatibilidade detectada e oferece override granular em modo interativo.
- [x] O comando `providers` preserva opt-ins editoriais já ativos no `AGENTS.md` e não remove providers previamente configurados sem intenção explícita (`--prune`).
- [x] Templates em `.specify/templates/` são escritos em `.ai-guidelines/templates/` no projeto-alvo.
- [x] O template `.core/templates/AGENTS-pointer.md.tmpl` e menções no código da CLI foram removidos.
- [x] `.ai-guidelines/config.json` persiste a configuração mínima do bootstrap.
- [x] O contexto operacional local antes concentrado em `CLAUDE.md` passa a viver em documentos canônicos compartilhados, e `CLAUDE.md` vira apenas um ponteiro compatível.

### Componente [B]

- [x] O wizard e o comando `providers` geram apenas trampolins/ignore files dos providers selecionados.
- [x] O compilado `AGENTS.md` passa a ser agrupado por zonas temáticas sem depender do template legado `AGENTS-pointer`.
- [x] O runtime compilado usa interpolação baseada em `sdd_dir` para paths do consumidor.
- [x] Adapter rules de cada provider são injetadas dentro do trampolino correspondente; `AGENTS.md` compilado não contém mais a seção `### Provider Adapters`.

### Componente [C]

- [x] Trampolins e ignore files emitidos com marcadores `managed-block` e versionamento `v=N`.
- [x] Update em arquivo preexistente sem marcadores aplica prepend do bloco gerenciado + comentário humano em PT-BR; conteúdo legado preservado abaixo.
- [x] Update em arquivo já gerenciado substitui apenas o conteúdo entre marcadores.
- [x] Comando `update` lê `.ai-guidelines/config.json`, re-aplica trampolins + templates + recompilação de forma idempotente, sem perguntas e sem modificar o config.
- [x] Comando `providers --prune` nunca apaga arquivos em `.ai-guidelines/templates/`.
- [x] `sdd_dir` validado contra path traversal antes de ser usado em I/O.

### Globais (toda a spec)

- [x] Pipeline de format/lint verde (`yarn check`).
- [x] Suíte de testes verde (`yarn test`).

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: Testes de CLI e prompts interativos em `cli.integration.test.mjs` e `compiler.test.mjs`.

---

## 🛠️ Arquivos modificados (esperado)

- `cli/ai-guidelines-cli.mjs` — Atualização do wizard.
- `cli/features/core/pointers.mjs` — passa a orquestrar config, templates, trampolins e compilação final.
- `cli/governance/monolith/compiler.mjs` — atualização do builder/compilador de runtime.
- `cli/cli/args.mjs` — categorias do wizard + seleção de providers.
- `package.json` / `yarn.lock` — dependência de prompts interativos.
- `cli/app/engine.mjs` — suporte ao novo comando `providers`.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                         | Mitigação                                                       |
| :---------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| Quebra de testes de snapshots da Spec 0018 devido a mudanças no header/layout | Atualizar explicitamente snapshots da suíte de BDD ao compilar. |

---

## 📐 Decisões revisitadas

- **2026-05-07** — Spinoff `template-lifecycle-e-update` absorvido pela 0019. Motivo: distribuir templates/trampolins sem política de update fixa um contrato que vai mudar logo, gerando re-trabalho na primeira leva de consumidores. Resolver agora evita débito imediato.
- **2026-05-07** — Adapter content migra do `AGENTS.md` compilado para o bloco `managed-block` do trampolino do provider correspondente. Motivo: cada provider passa a ler **um único arquivo nativo** com hard-redirect + regras específicas, eliminando o H3 órfão `### Provider Adapters` e melhorando a topologia. Decisão `[DEC-0019-B02]` (zonas temáticas) refinada: a zona de adapters deixa de existir no monólito.
- **2026-05-07** — Comando `update` separado de `adopt` (em vez de unificar). Motivo: `adopt` é bootstrap interativo (com wizard, escreve config); `update` é re-aplicação idempotente headless (lê config existente). Separar mantém a semântica clara — wizard é pergunta, update é cumprimento.
- **2026-05-07** — Metaprompt do comentário em arquivo legado é dirigido ao **mantenedor humano** em PT-BR (não à IA leitora). Motivo: instruções metalinguais para LLMs são frágeis (Claude/GPT podem ignorar ou agir destrutivamente sobre instruções "limpe X"). Comentário visível ao humano em qualquer editor é neutro à IA e mantém responsabilidade da limpeza com quem deve decidir.
- **2026-05-06** — `providers` e `adapters` foram separados em camadas distintas. Os arquivos nativos de tooling (`CLAUDE.md`, `.cursor/rules/ai-guidelines.mdc`, `.openai/instructions.md`) passaram a ser governados por `providers`, enquanto o monólito usa `adapters` (`claude`, `codex`, `gemini`) derivados por mapeamento determinístico. Motivo: nem todo provider precisa de regras próprias no `AGENTS.md`, mas todos podem precisar de hard-redirect.
- **2026-05-06** — O runtime deixou de depender do template `AGENTS-pointer` e passou a compor a base tática diretamente no compilador. Motivo: eliminar o ponteiro legado e centralizar a topologia final do payload no mesmo fluxo que já monta as zonas temáticas.
- **2026-05-06** — O owner aprovou ampliar a spec para adotar `@inquirer/prompts` no wizard. Motivo: entrada CSV em CLI interativa é UX inadequada para seleção múltipla; `checkbox` passa a ser requisito funcional do bootstrap.
- **2026-05-06** — O owner aprovou esvaziar o `CLAUDE.md` local em favor de documentos canônicos compartilhados, preservando apenas um ponteiro mínimo compatível com Claude. Motivo: reduzir drift entre instruções por provider e documentação real do repositório.
- **2026-05-06** — `adapters` deixaram de ser persistidos no `config.json`; o arquivo expõe apenas o contrato do usuário (`providers`, `features`, `lang`, `sdd_dir`) e o compilador deriva adapters internamente. Motivo: reduzir vazamento de abstração interna e evitar estranheza como `openai -> codex` no estado persistido.
