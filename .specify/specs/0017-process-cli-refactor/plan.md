# Plan — Spec 0017 Process Refinement & CLI Refactor

> Spec: [`./spec.md`](./spec.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🏗️ Design e Arquitetura

### Princípio guia

**A antes de B**: sub-bloco A (process & governance) define onde ficam os `docs/`
e qual é a estrutura canônica do repositório — B (CLI & docs structure) não deve
reorganizar `docs/` sem saber o que A mantém lá. Commits atômicos por
responsabilidade dentro de cada sub-bloco.

Ambos os sub-blocos devem manter o invariante `yarn check && yarn test` verde após
cada commit — sem accumular debt técnico para resolver na Fase 2.

### Sub-bloco A — Process & Governance Refinement

#### A.1 — Research Lifecycle (política + aplicação)

**Estado atual:**

- `.specify/specs/researchs/` existe como pasta temporária (docs migrados do repo
  privado/archived manualmente na Fase 3 da Spec 0008).
- Nenhuma política formal define: quando migrar, o que migrar, o que deletar, o que
  linkar no `research-index.md`.
- Duplicatas existiram (removidas no commit `6c16e85`) — prova da ausência de regra.
- `research-index.md` aponta para arquivos deletados (link quebrado para
  `governance-coherence-audit.md` — fix pendente do commit de research cleanup).

**Decisão validada (Opção B - Aprimorada):**

Política "Migração centralizada com taxonomia": ao encerrar uma spec:

- Os arquivos de pesquisa com valor reutilizável devem ser movidos para `.specify/specs/researchs/`.
- **Estrutura de pastas**: Não usar pastas por spec. Usar subpastas baseadas em domínio/escopo. Exemplo de domínios (baseados no `research-index.md`):
  - `governance/` (Governança IA, SDD, Engenharia de Prompt)
  - `architecture/` (Design e decisões de arquitetura)
  - `oss/` (Open Source e Publicação)
- **Nomenclatura**: Os arquivos devem ser renomeados para o padrão `YYYY-MM-DD-nome-da-pesquisa.md` (ex: `2026-04-28-synthesis.md`), garantindo uma linha do tempo clara para auditorias futuras de defasagem.
- Após a movimentação, linkar no `.specify/specs/research-index.md`.
- A pasta `research/` local da spec pode ser deletada se não restar nada de útil nela.

**Mudanças em arquivos:**

- `docs/process/spec-foundation.md` — nova seção "Research Lifecycle Policy".
- `.specify/templates/tasks-boilerplate.md` — Fase 3 (3.2) reescrita.
- `.specify/specs/research-index.md` — fix link quebrado + revisão de entradas.
- `.specify/specs/researchs/0008-*/` — avaliar se arquivos remanescentes devem ser
  movidos de volta para `0008-governance-coherence/research/` (aplicar nova política).

#### A.2 — Boot Obrigatório

**Estado atual:**

Agentes iniciam sessão sem leitura mandatória do `backlog.md`. Resultado: agentes
retomam specs erradas ou ignoram prioridade definida.

**Decisão:**

Inserir no `AGENTS.md` raiz (bloco gerenciado pelo CLI — dentro do `<!-- BEGIN:ai-guidelines-core -->`) um novo step de boot:

```
3. Antes de qualquer execução: ler `roadmap/backlog.md` — identificar spec em
   execução, prioridade Now, bloqueadores cross-spec.
```

Mesma instrução adicionada ao template `.ai-guidelines/AGENTS.md` (o que o CLI
injeta em repositórios consumidores).

**Mudanças em arquivos:**

- `.ai-guidelines/AGENTS.md` — novo step de boot.
- `AGENTS.md` (raiz) — mesmo step (atualizado manualmente ou via `adopt` local).

#### A.3 — Concorrência de Specs

**Estado atual:**
Não há documento descrevendo o que fazer quando duas branches modificam os mesmos arquivos de governança. O plano inicial era limitar a cota, o que é restritivo para OSS.

**Decisão Validada (Visibilidade + Justificativa):**
Migrar para uma política de "Sinalização Semântica":

- **Backlog Warnings**: A seção `## Em execução` do `backlog.md` deve listar os domínios impactados por cada spec ativa. Se houver sobreposição, sinalizar com `[!] CONFLICT-RISK`.
- **Seção de Justificativa**: Incluir no template `spec.md` uma seção de "Justificativa de Concorrência" obrigatória se houver risco de conflito no backlog. O autor deve documentar como o isolamento será mantido.
- **Configurabilidade (Policy)**: Permitir que o repositório alvo defina em `.ai-guidelines/config.json` sua política: `STRICT` (bloqueio), `ADVISORY` (avisos) ou `OPEN`.

**Mudanças em arquivos:**

- `docs/process/spec-foundation.md` — nova seção "Concurrency Policy".
- `.specify/templates/spec-boilerplate.md` — nova seção de justificativa.
- `.ai-guidelines/config.json` (ou equivalente) — definição de `concurrencyPolicy`.

#### A.4 — Reorganização do Backlog

**Estado atual:**
`backlog.md` mistura formatos e não tem hierarquia visual clara.

**Decisão:**
Reformatar com hierarquia explícita e padronização total:

- **Formato Único**: Todas as entradas usam `**slug** (label)`. Entradas numeradas (ex: `spec 0006`) seguem um padrão legado e devem ser convertidas para o novo formato **removendo o número** (ex: `**npm-publication** (feature)`).
- **Hierarquia Visual**: Header de cada seção com critério de promoção. Uso de `<details>` e `<summary>` para descrições.
- **Shared Context**: Incluir campo `Shared Context` para specs em execução.

**Mudanças em arquivos:**

- `roadmap/backlog.md` — reforma completa de formato.

#### A.5 — Pesquisa: AGENTS.md vs global-rules.md (Matriz 2026)

**Estado atual:**
ADR 0004 definiu a separação. Precisamos validar se modelos modernos (Gemini 3, Claude 4) mantêm a eficácia com essa divisão ou se a escala de contexto atual permite/exige novos padrões.

**Decisão Validada (Investigação Pesada):**
Realizar benchmarking formal com data de corte em 2026-04-29:

- **Modelos Alvo**:
  - **Google**: Gemini 3 Pro (Large Context), Gemini 3 Flash (Fast/Edge).
  - **Anthropic**: Claude 4 Opus (Reasoning), Claude 4 Haiku (Efficient).
  - **Microsoft/OpenAI (Codex)**: GPT 4.4 (SOTA 2026), GPT 4.4-mini.
- **Protocolo de Validação**:
  - **Fase de Documentação Inicial**: Gerar o arquivo de pesquisa como boilerplate antes da execução, para alocação incremental de achados.
  - **Teste de Prioridade**: Regras conflitantes entre `global-rules.md` (System) e `AGENTS.md` (Context).
  - **Teste de "Ruído"**: Eficácia da regra em contextos de 50k, 200k e 1M de tokens.
  - **Teste de Estética**: Compliance com regras de UI/Design premium (essencial para o framework).
- **Entregável**: Matriz de Compliance em `research/agents-vs-rules-compliance.md` com recomendações para o CLI (ex: se o CLI deve fundir arquivos para modelos Flash para garantir atenção).

**Mudanças em arquivos:**

- `.specify/specs/0017-process-cli-refactor/research/agents-vs-rules-compliance.md` — novo.
- Potencial revisão do ADR 0004 baseada nos achados.

#### A.6 — Validação Humana de Specs

**Estado atual:**

O RPI e os boilerplates não forçam explicitamente que o agente pare e peça
permissão humana após criar `spec.md`, antes de desdobrar as soluções em
`plan.md` e `tasks.md`.

**Decisão:**

Adicionar ao `tasks-boilerplate.md` e à documentação de processo a exigência formal
de que a spec seja revisada pelo humano antes que o design técnico comece.
Isso impede que agentes automatizados divaguem em implementações sem que
o problema (escopo/motivação) esteja assinado pelo owner do projeto.

**Mudanças em arquivos:**

- `.specify/templates/tasks-boilerplate.md` — novo checkbox na Fase 0 (ou novo step).
- `docs/process/spec-foundation.md` (ou equivalente) — documentar a trava no RPI.

---

### Sub-bloco B — CLI & Docs Structure

#### B.1 — Reorganização de `cli/core/`

**Estado atual:**

`cli/core/` contém: `engine.mjs` (orquestração), `cli-input.mjs` (parsing de args),
`file-system.mjs` (I/O), `content-merge.mjs` (merge de conteúdo),
`guidance-helpers.mjs` (formatters), `install-runtime.mjs` (execução de scripts).
Responsabilidades distintas sob o mesmo diretório sem semântica.

**Decisão:**

Avaliar in-place se renomear os diretórios sem mover arquivos é suficiente para
comunicar responsabilidades. Se mover for necessário, garantir que todos os imports
atualizem (busca global + grep). Priorizar **não quebrar testes** como invariante.

> ⚠️ Decisão pendente de pesquisa: verificar se Yarn Berry + Node.js suporta
> `imports` field do `package.json` para aliases sem build step.

**Mudanças em arquivos:**

- Potencial: mover arquivos de `cli/core/` para `cli/engine/`, `cli/utils/`.
- Todos os `import` afetados nos `.mjs` e `.test.mjs` correspondentes.
- `package.json` — `imports` field com aliases `#core/*`, `#features/*`,
  `#formatters/*`.

#### B.2 — Path Aliases

**Estado atual:**

Features opt-in usam `import { ... } from '../../../core/file-system.mjs'`. Toda
nova feature adicionada em subpasta acumula um nível extra de `../`.

**Decisão:**

Configurar `imports` field no `package.json` (Node.js Subpath Imports — suporte
nativo desde Node 12.7, sem dependência de bundler):

```json
{
  "imports": {
    "#core/*": "./cli/core/*.mjs",
    "#features/*": "./cli/features/*.mjs",
    "#formatters/*": "./cli/formatters/*.mjs"
  }
}
```

Atualizar todos os imports existentes para usar aliases.

**Mudanças em arquivos:**

- `package.json` — `imports` field.
- Todos os arquivos `.mjs` e `.test.mjs` que usam imports relativos com `../`.

#### B.3 — Auditoria e Reorganização de `docs/`

**Estado atual:**

`docs/` contém: `cli/ai-guidelines-cli.md`, `process/spec-foundation.md`,
`features.md`, `ai-efficiency-guide.md`, `rpi-protocol.md`, `tdd-guidelines.md`.
Estrutura plana sem agrupamento semântico, e o real propósito de alguns desses arquivos em `docs/` vs `.core/rules/` é incerto (algumas regras podem estar "escondidas" como documentação passiva).

**Decisão:**

1. **Auditoria de Propósito**: avaliar arquivo a arquivo de `docs/`. Se for
   regra de engenharia que o agente precisa seguir e agir ativamente, propor a
   movimentação para `.core/rules/`.
2. **Consolidação/Remoção**: identificar redundâncias.
3. **Reorganização**: o que sobrar (documentação puramente passiva/institucional)
   será reorganizado em estrutura sidebar-ready (ex: `docs/process/`, `docs/cli/`,
   `docs/guides/`).

> ⚠️ A estrutura final aguarda o resultado da Auditoria (B.3) e as decisões da
> política de lifecycle (A.1).

**Mudanças em arquivos:**

- Possíveis migrações para `.core/rules/`.
- Mover + atualizar referências cruzadas em `README.md`, `AGENTS.md` e arquivos
  que linkam para docs/ hoje.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Sub-bloco A

- [ ] `docs/process/spec-foundation.md` tem seção "Research Lifecycle Policy" com
      decisão documentada e critérios de quando linkar vs não linkar.
- [ ] `tasks-boilerplate.md` Fase 3.2 reescrita com a nova política.
- [ ] `research-index.md` sem links quebrados.
- [ ] `AGENTS.md` raiz e `.ai-guidelines/AGENTS.md` incluem step de boot para
      leitura de `backlog.md`.
- [ ] `docs/process/spec-foundation.md` tem seção "Concorrência de Specs".
- [ ] `roadmap/backlog.md` reformatado com hierarquia e critérios de promoção.
- [ ] `research/agents-vs-rules-compliance.md` existe com achados documentados
      (mesmo que resultado seja "manter separação atual").

### Sub-bloco B

- [ ] Nenhum import em `cli/features/` tem mais de 2 níveis de `../`.
- [ ] `package.json` tem campo `imports` configurado.
- [ ] `docs/` reorganizada com estrutura sidebar-ready.
- [ ] Referências a paths antigos atualizadas em `README.md` e `AGENTS.md`.

### Globais

- [ ] `yarn check` verde.
- [ ] `yarn test` verde (107+ testes).
- [ ] Diff em consumidor real (dry-run) sem quebras.

---

## 🧪 Estratégia de Testes

- **Unit**: testes existentes devem passar sem modificação após reorganização de
  imports (B.2). Se imports mudam, atualizar só o path, não a lógica.
- **Manual smoke test**: após B.1+B.2, rodar `node cli/ai-guidelines-cli.mjs adopt
--target /tmp/test-consumer --dry-run` e verificar output.
- **Pesquisa A.5**: teste empírico manual com 2+ modelos (não automatizado — é
  qualitative research).

---

## 🛠️ Arquivos modificados (esperado)

- `docs/process/spec-foundation.md` — Research Lifecycle + Concorrência.
- `.specify/templates/tasks-boilerplate.md` — Fase 3.2 reescrita.
- `.specify/specs/research-index.md` — fix link + revisão.
- `.ai-guidelines/AGENTS.md` — step de boot.
- `AGENTS.md` (raiz) — step de boot.
- `roadmap/backlog.md` — reforma de formato.
- `.specify/specs/0017-process-cli-refactor/research/agents-vs-rules-compliance.md` — novo.
- `package.json` — `imports` field.
- `cli/features/opt-in/**/*.mjs` — imports atualizados.
- `cli/features/core/**/*.mjs` — imports atualizados.
- `docs/**/*.md` — reorganização + atualização de refs.
- `README.md` — atualizar links de docs/.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                          | Mitigação                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| `imports` field do `package.json` não funciona com Yarn Berry  | Testar em isolamento antes de refatorar todos os arquivos             |
| Reorganização de `cli/core/` quebra imports não rastreados     | `grep -r 'from.*core/'` antes + testes como gate                      |
| Pesquisa A.5 inconclusiva ou tomando mais de 2 sessões         | Delimitar escopo mínimo: 2 modelos, 3 cenários, resultado documentado |
| docs/ reorganização cria links quebrados em README e AGENTS.md | Script de busca de refs antes + `yarn check` com `[BR-GOV-COH-01]`    |

---

## 📐 Decisões revisitadas

_(Registrar aqui mudanças de design durante a execução.)_
