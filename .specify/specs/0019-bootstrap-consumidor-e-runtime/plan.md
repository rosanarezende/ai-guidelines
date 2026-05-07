# Plan — Spec 0019 Bootstrap Consumidor e Runtime

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Review

---

## 🛰️ Stage 1 / Stage 2

> **Stage 1 (Research → opções).** Coletar evidência, preencher `decision-brief.md` com pontos em status `Pendente` e aguardar Gate humano (Aplica-se ao sub-bloco B).
>
> **Stage 2 (Design + Implementação).** Sub-bloco A (CLI Wizard e Template Sync) entra direto. Sub-bloco B (Arquitetura do Runtime e Trampolins) aguarda Gate.

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
- Remover o template legado `AGENTS-pointer` e passar a compilar o `AGENTS.md` diretamente em zonas temáticas: `Top Zone: Primary Directives`, `Lifecycle & Spec System`, `Git & PR Workflow`, `Engineering Principles`, `Center Zone: Opt-in Methodologies` e `Base Zone: Tactical Context`.
- Usar `sdd_dir` do config para interpolar caminhos do consumidor dentro do runtime compilado, evitando referências hardcoded ao repositório mantenedor.

**Mudanças em arquivos**:

- `cli/features/core/compiler.mjs` e afins.
- `cli/features/core/trampolines.mjs` — novo módulo para scaffolding de providers.
- `cli/features/core/templates.mjs` — novo módulo para sincronização de `.specify/templates`.
- `cli/features/core/config.mjs` — novo módulo para leitura/escrita de `.ai-guidelines/config.json`.

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

- **2026-05-06** — `providers` e `adapters` foram separados em camadas distintas. Os arquivos nativos de tooling (`CLAUDE.md`, `.cursor/rules/ai-guidelines.mdc`, `.openai/instructions.md`) passaram a ser governados por `providers`, enquanto o monólito usa `adapters` (`claude`, `codex`, `gemini`) derivados por mapeamento determinístico. Motivo: nem todo provider precisa de regras próprias no `AGENTS.md`, mas todos podem precisar de hard-redirect.
- **2026-05-06** — O runtime deixou de depender do template `AGENTS-pointer` e passou a compor a base tática diretamente no compilador. Motivo: eliminar o ponteiro legado e centralizar a topologia final do payload no mesmo fluxo que já monta as zonas temáticas.
- **2026-05-06** — O owner aprovou ampliar a spec para adotar `@inquirer/prompts` no wizard. Motivo: entrada CSV em CLI interativa é UX inadequada para seleção múltipla; `checkbox` passa a ser requisito funcional do bootstrap.
- **2026-05-06** — O owner aprovou esvaziar o `CLAUDE.md` local em favor de documentos canônicos compartilhados, preservando apenas um ponteiro mínimo compatível com Claude. Motivo: reduzir drift entre instruções por provider e documentação real do repositório.
- **2026-05-06** — `adapters` deixaram de ser persistidos no `config.json`; o arquivo expõe apenas o contrato do usuário (`providers`, `features`, `lang`, `sdd_dir`) e o compilador deriva adapters internamente. Motivo: reduzir vazamento de abstração interna e evitar estranheza como `openai -> codex` no estado persistido.
