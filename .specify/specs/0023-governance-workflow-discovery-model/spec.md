<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0023 — Modelo de Workflow de Governança e Descoberta

> Status: Draft (Stage A — Discovery)
> Author: Claude Code (em sessão com Rosana Rezende, 2026-05-19)
> Date: 2026-05-19
> Owner: Rosana Rezende
> Tipo de spec: evidence-driven
> Decision Brief: (não criado em Stage A — nasce após `research.md` produzir evidência e o gate humano ser explicitamente aberto)
> Plan: (não criado em Stage A — nasce após o `decision-brief.md`)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo,
> a ser criado).
>
> **Princípios da Escrita:** ver `.core/process/governance-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

> **Disciplina de Stage A (dogfooding intencional):** esta spec inaugura o uso explícito do lifecycle proposto por ela mesma. O setup inicial contém **apenas** `spec.md` + `research.md` + `NEXT.md`. `decision-brief.md`, `plan.md` e `tasks.md` **não existem** e **não devem ser criados** antes do gate humano. Esse vácuo é proposital — é insumo experimental para validar (ou falsificar) que o lifecycle proposto é aplicável a si mesmo.

> ⚠️ **Aviso de leitura — Stage A em curso.** Este `spec.md` declara **objetivo, escopo, critérios de aceite e dependências**. As conclusões concretas sobre lifecycle, taxonomia de workflows, taxonomia de artefatos e contrato de `research.md` **ainda são hipóteses** investigadas em [`./research.md`](./research.md). Só serão cravadas após o gate humano de Stage A → Stage B (que materializa o `decision-brief.md`). Ler este arquivo como **descrição da pergunta** a investigar, não como descrição da resposta a executar.

---

## 🎯 Objetivo

O framework `ai-guidelines` foi consolidado como sistema **governance-first** pela Spec 0021 (ADR 0018: AI-as-Channel). Mas o **lifecycle metodológico** das specs ainda carrega herança da fase anterior, "spec-driven": toda iniciativa é tratada como spec, e toda spec percorre o caminho `spec → decision-brief → plan → tasks` por reflexo, com frequência criando `plan.md` e `tasks.md` antes que qualquer investigação arquitetural tenha ocorrido.

A dor real é **churn por planning prematuro**. A Spec 0022 (CLI Runtime Cutover) é o caso concreto: nasceu três vezes sob framings diferentes (PR #15 "de-arrumação", PR #16 "cutover arquitetural completo via DDD/TDD/BDD") antes que a sessão de design 2026-05-18 revelasse que o problema era **epistemológico** — a 0022 estava sendo planejada antes do domínio ter sido investigado, e os boilerplates atuais não oferecem lugar canônico para descoberta arquitetural disciplinada.

Esta spec resolve isso entregando **conceitos e contratos** (não código de runtime):

- um **lifecycle metodológico** com gates explícitos que separa discovery de delivery;
- uma **taxonomia de workflows** posicionada no nível abstrativo correto (sem concluir cedo se os 7 pilares atuais estão no nível certo — o output é rationale, não pressuposto);
- uma **taxonomia de artefatos** distinguindo universais de workflow-específicos;
- um **contrato canônico para `research.md`** como artifact de primeira classe (hoje informal);
- uma **política de placement** para pesquisas profundas (lar canônico, convenções de nomeação, disciplina de citação cross-spec).

Resultado observável quando esta spec encerrar: futuras specs podem nascer com `research.md` real antes de `decision-brief.md`; workflows que não justificam plan/tasks (patches, hotfixes, governance reviews) deixariam de produzir esses artefatos por reflexo; e o `NEXT.md` deixaria de inflar como caixote, porque cada item teria classificação imediata.

---

## 📦 Escopo

### Dentro do escopo

- **Lifecycle mínimo** com gates explícitos: estágios nomeados, critérios de entrada e saída de cada estágio, condições de gate humano. Sem hierarquia decorativa — só os estágios necessários para separar discovery de delivery.
- **Taxonomia de workflows** no nível taxonômico correto. Mapear cada um dos 7 pilares atuais (`spec`, `spike`, `fix`, `patch`, `incident`, `proposal`, `experiment`) contra níveis candidatos (workflow family / artifact / lifecycle stage / governance context / operational state / decision object). O output pode ser "mantém os 7 pilares no nível atual" **ou** "ajusta a posição taxonômica de N pilares" — em ambos os casos com **rationale baseado em evidência**, sem conclusão antecipada.
- **Taxonomia de artefatos**: classificar `spec.md`, `decision-brief.md`, `plan.md`, `tasks.md`, `NEXT.md`, `research.md` (novo), `closure-review.md` (caso 0021) e candidatos futuros entre universais e workflow-específicos.
- **Contrato canônico de `research.md`**: estrutura mínima obrigatória (hipóteses, evidências, matriz, anti-patterns, perguntas abertas); cardinalidade declarada (1:1 com spec? múltiplos por tópico?); regra de migração ao fechamento; anti-patterns explícitos (não virar mini-plan).
- **Política de placement** para pesquisas profundas: lar canônico (proposta em investigação: `.core/research/` por tema vs `.specify/research/`), convenções de nomeação, citação cross-spec, ciclo de vida (research permanece vs envelhece vs vira ADR).
- **Matriz workflow → artefatos mínimos**: tabela explícita listando, para cada pilar (após eventual reposicionamento taxonômico), quais artefatos são obrigatórios, opcionais e proibidos.
- **Diretrizes objetivas** para "quando plan/tasks é permitido" e "quando decision-brief é obrigatório".
- **Seção "como aplicar"** com ao menos um exemplo concreto baseado em caso real do repo (Spec 0021, 0022 ou a própria 0023 como dogfooding).

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Runtime rewrite, CLI migration ou engine convergence**: 0023 é metodológica, não runtime. O cutover operacional `cli/` → `src/` continua sendo objeto da Spec 0022 (paused, aguardando o output desta spec). **A 0023 não absorve o runtime.**
- **Reescrita completa dos boilerplates existentes** (`spec-boilerplate.md`, `decision-brief-boilerplate.md`, `plan-boilerplate.md`, `tasks-boilerplate.md`, `next-boilerplate.md`): boilerplates são **consequência** do lifecycle, não ponto de partida. A 0023 pode propor **alterações pontuais** a esses arquivos quando o lifecycle exigir (ex.: header aceitar `Plan: (a definir)`), mas **redesign completo** é trabalho de spec dedicada, sequenciada após esta.
- **Implementar comando novo na CLI** (`ai-guidelines research`, `ai-guidelines intake`, etc.): comandos são execução, não definição. Se a 0023 propuser comandos novos, isso vira spec própria.
- **Mexer em Spec 0021 ou Spec 0022**: a 0021 está fechada como foundation governance-driven; a 0022 está paused aguardando o output desta 0023. Esta spec **não** absorve runtime redesign e **não** reabre o framing da 0021.
- **Decisão antecipada sobre se os 7 pilares estão "certos" ou "errados"**: a investigação pode revelar que estão no nível correto, ou que precisam ser reposicionados. **A conclusão é output da spec, baseada em evidência empírica; não premissa.**
- **Importação de modelos prontos externos** (Growth Engineering, SAFe, Scrum, etc.) como verdade estrutural: framings organizacionais externos são enviesados pelo contexto em que nasceram. Servem apenas como inspiração abstrata para a noção de separação epistemológica entre tipos de trabalho.

---

## ✅ Critérios de Aceite (alto nível)

Critérios **observáveis** que indicam "spec está pronta para Done". Detalhamento operacional fica em `plan.md` (a ser criado).

- [ ] **Lifecycle proposto com gates explícitos** documentado: estágios nomeados, critérios de transição, gate humano onde aplicável.
- [ ] **Contrato canônico de `research.md`** documentado: estrutura mínima obrigatória, anti-patterns explícitos, exemplos do que NÃO fazer.
- [ ] **Matriz workflow → artefatos mínimos** publicada cobrindo todos os 7 pilares atuais (mais a posição taxonômica revisada se houver reposicionamento).
- [ ] **Política de placement** de pesquisas profundas definida (lar canônico + convenções de nomeação + citação cross-spec + ciclo de vida).
- [ ] **Diretrizes objetivas** publicadas para "quando plan/tasks é permitido" e "quando decision-brief é obrigatório".
- [ ] **Seção "como aplicar"** com pelo menos 1 exemplo concreto baseado em caso real do repo (não exemplo hipotético).
- [ ] **Dogfooding validado**: esta própria 0023 conseguiu nascer e progredir até gate sob o lifecycle que ela define (ou falhas de aplicação foram registradas como evidência crítica de revisão pré-canonização).
- [ ] Pipeline `yarn check && yarn test` verde, sempre (esta spec toca markdown que entra em `prettier --check`).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- [`./research.md`](./research.md) — artifact central de Stage A (obrigatório). Captura hipóteses, evidências, matriz inicial, anti-patterns e perguntas abertas. Insumo direto para o `decision-brief.md` futuro.
- [`./research/`](./research/) — anexos extensos da própria spec. Local à 0023; usado quando o material é narrativo da spec e não reutilizável cross-spec.
- [`.specify/specs/0021-governance-information-architecture/closure-review.md`](../0021-governance-information-architecture/closure-review.md) — boundary review da 0021. Precedente concreto de "spec de fundação" e da necessidade de artifact de fechamento disciplinado (inaugurado sem template).
- [`.specify/specs/0022-cli-runtime-cutover/`](../0022-cli-runtime-cutover/) — Spec 0022 paused em Stage A, com `plan.archived.md` + `tasks.archived.md` arquivados por **invalidação metodológica**. Caso concreto e documentado de churn por planning prematuro.
- [`.core/governance/adrs/0018-governance-first-ai-as-channel.md`](../../../.core/governance/adrs/0018-governance-first-ai-as-channel.md) — repositioning governance-first / AI-as-channel; princípio narrativo que justifica esta spec.
- [`.specify/templates/`](../../templates/) — boilerplates atuais cujos vieses implícitos serão auditados em [`./research/boilerplates-audit.md`](./research/boilerplates-audit.md).

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0021 fechada (foundation governance-driven estabilizada). Sem a 0021, esta spec ficaria desenhando sobre paradigma em movimento. **A 0021 PR #14 deve ter ido para Ready/Merge antes da 0023 entrar em Stage B.**
- **Specs afetadas**:
  - **Spec 0022** (CLI Runtime Cutover) — paused em Stage A; **destravada** pelo output desta 0023. Quando o lifecycle estiver definido, a 0022 renasce com `research.md` real, sem o framing herdado CLI-first/runtime-assumption que invalidou metodologicamente seus `plan.archived.md`/`tasks.archived.md` atuais.
  - **Boilerplates atuais em `.specify/templates/`** — podem receber **alterações pontuais** desta spec (não redesign completo).
- **Cross-refs com specs irmãs** _(opcional)_:
  - **Spec 0021** — fronteira clara: a 0021 entrega a fundação **estrutural** (`.governance/` canônico, taxonomia de 7 pilares no nível de WorkItem, ADRs); a 0023 entrega a fundação **metodológica** (como specs nascem, evoluem e fecham). 0021 não toca lifecycle; 0023 não toca runtime.
- **Riscos macro**:
  - **Virar manifesto sem aplicação**: lifecycle bonito mas inaplicável. Mitigação: exemplos concretos baseados em casos do próprio repo (0021 e 0022) + gates mínimos (não maximalistas) + dogfooding obrigatório nesta própria spec.
  - **Overengineering taxonômico**: investigação filosófica sem retorno prático. Mitigação: critério explícito de "para quando esta diferenciação faz diferença operacional?" antes de canonizar qualquer categoria; matriz inicial em `research.md` registra apenas níveis com exemplos concretos do repo.
  - **Absorver runtime redesign**: usar o lifecycle como cavalo-de-tróia para reabrir o cutover da 0022. Mitigação: § "Fora do escopo" taxativo + revisão constante contra a 0022 (que NÃO pode ser absorvida) + a 0022 permanece em PR próprio durante toda a execução desta spec.
  - **Anti-self-aplicação**: spec metodológica que viola o próprio lifecycle que define. Mitigação: dogfooding intencional (esta spec usa `research.md` antes de `decision-brief.md`); falhas de aplicação registradas como evidência crítica, não como fracasso a esconder.

Detalhamento técnico (riscos por componente, mitigações operacionais) fica em `plan.md` (a ser criado após gate humano).

---

## 📚 Referências

- Specs relacionadas: **0021** (Governance Information Architecture — foundation governance-driven), **0022** (CLI Runtime Cutover — paused, destravada por esta).
- ADRs aplicáveis: **ADR 0018** (Governance-first, AI-as-Channel).
- Templates atuais auditados em `research/boilerplates-audit.md`: `.specify/templates/spec-boilerplate.md`, `decision-brief-boilerplate.md`, `plan-boilerplate.md`, `tasks-boilerplate.md`, `next-boilerplate.md`.
- Sessão de design 2026-05-18/19 entre Rosana Rezende e Claude Code — trilha narrativa nos commits que abrem e mantêm esta spec.
