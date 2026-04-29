# Spec 0017 — Process Refinement & CLI Refactor

> Status: Draft
> Author: Antigravity
> Date: 2026-04-28
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).

> **Fusão consolidada:** absorve as candidatas `process-refinement` e
> `cli-refactor` registradas em `roadmap/backlog.md`. Ver decisão de fusão
> abaixo.

---

## 🎯 Objetivo

O repositório acumulou dois conjuntos de débitos estruturais após a Spec 0008:

- **Processo e governança**: a política de lifecycle de research é vaga (evidenciada
  pelas remoções manuais de duplicatas na Fase 3 da 0008), o boot dos agentes não
  inclui leitura obrigatória do `backlog.md`, branches concorrentes não têm workflow
  documentado, e a divisão AGENTS.md vs `global-rules.md` nunca foi validada
  empiricamente com diferentes modelos.

- **Arquitetura do CLI**: a reorganização de `cli/features/opt-in/` em subpastas
  (Fase 2.8 da Spec 0008) revelou imports com 3+ níveis `../../../`, ausência de
  aliases de caminho, e uma estrutura `cli/core/` que mistura responsabilidades
  distintas (orquestração, parsing, I/O, merge). A `docs/` também cresce sem
  estrutura sidebar-ready, dificultando o onboarding de contribuidores.

O resultado esperado é um repositório com **política de research lifecycle clara e
aplicada**, **backlog com formato canônico**, **boot de agentes mais robusto**, e
uma **estrutura de CLI mais idiomática** — reduzindo fricção para contribuidores
humanos e futuros sub-agentes.

---

## 🧠 Decisão de Fusão

### Critério aplicado

> _"Se a entrega de um item altera o contrato de outro, devem ser specs separadas."_

### Análise

| Sub-bloco               | Arquivos principais                                | Sobreposição |
| ----------------------- | -------------------------------------------------- | ------------ |
| A. Process & Governance | `AGENTS.md`, `docs/process/`, `.specify/`, roadmap | —            |
| B. CLI & Docs Structure | `cli/`, `docs/`, `package.json`                    | Média com A  |

### Conclusão

**Fundir** porque:

1. A reorganização de `docs/` (B) depende de saber **o que permanece** em
   `docs/process/` após A definir a política de research lifecycle — sem A, B
   pode reorganizar a pasta e A desfazer o trabalho depois.
2. Ambos são pré-requisitos para Spec 0006 (publicação npm) e Spec 0009 (harness
   engineering): CLI estruturada + docs claros viabilizam onboarding de
   contribuidores externos.
3. Custo de spec separada (cerimônia, ROADMAP, branch, PR, review) > custo de
   sub-blocos isolados com commits atômicos.

### Fora desta fusão (spinoff)

- **`cli-typescript`** — migração `.mjs` → `.ts` com `tsconfig.json` estrito:
  escopo de ~40 arquivos + bundler decision + breaking changes nos tipos.
  Complexidade justifica spec própria. Pré-requisito: esta spec concluída (estrutura
  estável antes de migrar linguagem).

---

## 📦 Escopo

### Dentro do escopo

**Sub-bloco A — Process & Governance Refinement:**

- Política formal de **research lifecycle**: onde ficam os `research/` após closure,
  quando migrar para `researchs/`, como indexar no `research-index.md`, o que fazer
  com duplicatas. Aplicar política ao estado atual do repositório.
- **Boot obrigatório**: leitura de `backlog.md` mandatória no `AGENTS.md` raiz e
  no template `.core/templates/AGENTS-core.md.tmpl`.
- **Concorrência de specs**: documentar workflow para branches concorrentes focado em visibilidade (warnings no backlog), justificativa técnica mandatória em caso de sobreposição e políticas configuráveis por repositório (STRICT/ADVISORY/OPEN).
- **Reorganização do backlog**: hierarquia visual clara usando `<details>`, critérios de promoção entre Now/Next/Later, formato padronizado `**slug** (label)` (removendo números de specs legadas), e regras de archiving.
- **Pesquisa de Compliance Multi-Modelo (2026)**: investigação profunda da divisão AGENTS.md vs `global-rules.md`. Benchmarking de hierarquia de instruções e atenção em janelas extensas com modelos de ponta (Gemini 3 Pro/Flash, Claude 4 Opus/Haiku, GPT 4.4/4.4-mini). Resultado em `research/agents-vs-rules-compliance.md`.
- **Validação humana obrigatória**: formalizar no processo que agentes de IA devem
  exigir validação humana do `spec.md` ANTES de gerar o `plan.md` e `tasks.md`,
  impedindo decisões de design unilaterais não supervisionadas.

**Sub-bloco B — CLI & Docs Structure:**

- **Reorganização de `cli/core/`**: separar responsabilidades distintas hoje
  agrupadas (orquestração → engine, parsing → input, I/O → file-system, merge
  → content-merge). Sem renomear arquivos se quebrar imports nos testes.
- **Path aliases**: configurar `imports` field do `package.json` (`#core/*`,
  `#features/*`, `#formatters/*`) eliminando `../../../` nos arquivos de features.
- **Auditoria e Reorganização de `docs/`**: auditar o real propósito da pasta `docs/`
  e seu conteúdo, avaliando se arquivos específicos devem ser consolidados em
  `.core/rules/` em vez de apenas organizados visualmente. Estruturar o que sobrar
  de forma lógica e sidebar-ready.

### Fora do escopo

- **Migração TypeScript** — candidata `cli-typescript` no backlog.
- **Automatização de ciclo de vida de Gaps via CLI** — processo pode ser documentado
  em A; automação CLI é escopo de spec própria.
- **Spec 0012 (segurança IA)** — audiência e artefatos diferentes, sem sobreposição
  com os arquivos desta spec.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Política de research lifecycle documentada em `docs/process/spec-foundation.md`
      e no template `tasks-boilerplate.md` (Fase 3 atualizada). Estado atual do
      repositório coerente com a política.
- [ ] `AGENTS.md` raiz e template core incluem step de boot de leitura do
      `backlog.md`.
- [ ] Concorrência de specs documentada em `docs/process/`.
- [ ] `roadmap/backlog.md` reformatado: hierarquia clara, critérios de promoção,
      sem mistura de formatos.
- [ ] Pesquisa `research/agents-vs-rules-compliance.md` com achados e
      recomendações documentados.
- [ ] Nenhum import em `cli/features/` com mais de 2 níveis de `../`.
- [ ] `docs/` reorganizada com estrutura sidebar-ready.
- [ ] `yarn check && yarn test` verde.
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0008 (✓) e Spec 0015 (✓) concluídas.
- **Specs afetadas**:
  - Spec 0006 (npm publication) — beneficia-se de CLI estruturada e docs claros.
  - Spec 0009 (harness engineering) — beneficia-se de CLI estruturada e processo
    de concorrência de specs documentado.
  - Candidata `cli-typescript` — depende de B concluído (estrutura estável antes
    de migrar linguagem).
- **Riscos macro**:
  - Reorganização de `cli/core/` pode gerar diff massivo; mitigar com commits
    atômicos por responsabilidade.
  - Aliases via `imports` do `package.json` têm suporte nativo em Node.js a partir
    de v12.7 (subpath imports) — validar comportamento com Yarn Berry e CI.
  - Pesquisa de compliance por modelo pode levar mais de uma sessão; delimitar
    escopo mínimo viável antes de executar.

---

## 📚 Referências

- Spec 0008: Governance Coherence — contexto da taxonomia, boilerplates e lacunas
  de process que esta spec resolve.
- Spec 0015: Auditoria Destrutiva — limpeza de docs que antecede reorganização de
  `docs/`.
- ADR 0004: Governance Single Responsibility — origem da divisão AGENTS.md vs
  `global-rules.md` que sub-bloco A investiga.
- `roadmap/backlog.md`: candidatas `process-refinement` (itens 1-6) e `cli-refactor`
  (itens 1-4 excluindo TS).
- Research: [concurrency-best-practices.md](./research/concurrency-best-practices.md) — Melhores práticas para gestão de concorrência em projetos OSS.
