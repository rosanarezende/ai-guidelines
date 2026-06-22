# CO-10.8.1 — Classificação de reparabilidade dos drifts #2, #3 e #4

Data: 2026-06-21
Spec: 0024 — context-architecture
Checkpoint: `checkpoint-co-flow-continuation` (CO-10.8.1)
PR: #44
Natureza: classificação factual (leitura de código). Narrativa de apoio, não autoridade.

## Critério preservado (decisão da owner)

**Auto-reparo só existe quando há um gerador determinístico governado capaz de recompor o
artefato inteiro a partir da fonte de verdade, com preview e confirmação.** Fora disso:

- detectar e explicar é papel do framework;
- mostrar a divergência e a fonte de verdade é obrigatório;
- reparar exige decisão humana ou comando governado específico;
- não reescrever cursor, topologia, `next` narrado ou `tasks.md` como se fossem projeções técnicas.

Referência do exemplar que satisfez o critério: **Drift #1** (`active.yml`), reparável porque
`active.yml` é projeção derivada e `publish-state` (`PublishState`) é o gerador determinístico que
recompõe o arquivo a partir de `state.yml` + git.

## Classificação

### Drift #2 — cursor de retomada diverge do próximo nó canônico

- **O que aconteceu:** o cursor (`state.yml § topology.cursor`) aponta para um nó/checkpoint que
  não é o próximo canônico derivado da topologia.
- **Fonte de verdade:** `state.yml § topology` — a SSOT estrutural. O cursor _é_ parte da topologia.
- **Detectável hoje:** sim. `reconcileCheck` (`cursor-not-canonical-next`,
  `cursor-checkpoint-mismatch`) + `active-specs:check` (branch).
- **Classificação:** **decisão humana / bloqueado.** Reparar = mexer no cursor/topologia. O próprio
  `reconcileCheck` orienta "reconcilie o cursor com a topologia **ou** ajuste a topologia se a
  realidade da stack mudou" — qual lado está certo é julgamento humano. Não há gerador determinístico.
- **Testes que comprovam:** `src/cli/reconcileCheck.test.ts`.

### Drift #3 — `next` narrado diverge da topologia derivável

- **O que aconteceu:** `state.next[0]` não declara, ou declara errado, o marcador estrutural
  `canonical-next: <id>` do próximo nó canônico.
- **Fonte de verdade:** o id canônico é **derivado** da topologia (`deriveCanonicalNext`,
  determinístico). `state.next[0]` é **prosa humana situada**, explicitamente não-autoridade.
- **Detectável hoje:** sim. `reconcileCheck` (`narrated-next-omits-canonical`).
- **Classificação:** **explicável; reparo = decisão humana** (não determinístico-seguro). Sem LLM no
  runtime (ADR 0018), "regenerar a narração a partir da topologia" só produz um template pobre que
  apaga o contexto humano; trocar só o id do marcador deixa a prosa ao redor incoerente. Não é a
  "projeção stale com gerador" do #1 — é narrativa. Reparo seguro: a pessoa reconcilia, com a
  ferramenta **mostrando** o id canônico correto.
- **Testes que comprovam:** `src/cli/reconcileCheck.test.ts` (marcador ausente e stale).

### Drift #4 — `tasks.md` não materializa o checkpoint ativo

- **O que aconteceu:** o checkpoint ativo não tem tarefa correspondente, ou o marcador
  `[ ]/[/]/[x]` de um sub-checkpoint contradiz a narrativa.
- **Fonte de verdade:** `tasks.md` é narrativa humana; o estado vem de `state.yml` (cursor) e dos
  comandos governados `decide/*` (`advanceSubcheckpoint`/`finishSubcheckpoint`), que já são
  human-gated.
- **Detectável hoje:** **sim.** `active-specs:check` (`validateEntrySubCheckpointCoherence`)
  detecta checkpoint ativo ausente em `tasks.md` e incoerência do marcador de sub-checkpoint.
- **Classificação:** **decisão humana.** Conteúdo autoral, mutado só por decisão governada; sem
  gerador determinístico do texto da tarefa.
- **Testes que comprovam:** `src/cli/activeSpecsConsistencyCheck.test.ts`.

## Atualização pós-implementação — drifts #5, #6 e #7

Depois da primeira classificação, a owner decidiu que #5, #6 e #7 não deveriam ficar apenas como
candidatos narrativos. A implementação posterior ampliou o `GovernanceDoctor`:

- **#5 — PR body ≠ recorte:** agora é detectado/explicado no comando interativo `drift`, que tenta
  ler o PR atual via `gh` autenticado e valida o body contra o contrato de perfil (`PrProfileContract`
  - `validateProfileBody`). Se `gh` não estiver instalado/autenticado, o doctor explica isso em
    linguagem humana e orienta login/instalação ou edição manual assistida. **Reparo:** decisão humana,
    porque o alvo é GitHub/PR body; o framework pode gerar o template (`pr-body:create`/`pr-body:update`),
    mas não deve editar a descrição do PR sem go.
- **#6 — gate aprovado, topologia não avançou:** agora é detectado/explicado quando o gate do nó ativo
  está `decision: approved` e o cursor ainda aponta para o mesmo nó. **Reparo:** decisão humana, pois
  avançar nó/topologia é efeito de Human Gate/decisão governada.
- **#7 — topologia aponta próximo nó sem PR/branch:** agora é detectado/explicado quando o próximo nó
  de execução segue planejado ou sem `github_pr`. **Reparo:** decisão humana, porque abrir branch/PR é
  a materialização governada de novo trabalho.
- **#8 — `research/` contradiz o estado:** permanece fora desta fatia. Entra no **CO-10.8.2**, junto
  da reorganização/higiene de artefatos e separação entre evidência, status, research e backlog.

## Conclusão sobre CO-10.8.1

A camada de reparo entregou: (1) o modelo (`RepairPlan`/autoridade), (2) **um** reparo seguro real
(#1) como exemplar, (3) detecção/explicação para #2/#3/#4, (4) detecção/explicação para #5/#6/#7,
e (5) esta classificação, que estabelece o **invariante de reparabilidade**. Conclusão proposta:
o único drift com auto-reparo local possível era o #1. #2..#7 são agora diagnosticáveis quando seus
fatos estão disponíveis, mas os reparos que tocam narrativa humana, topologia, Human Gate, PR body
ou GitHub permanecem como decisão humana. #8 fica explicitamente para CO-10.8.2. Decisão de
fechamento é da owner (Human Gate).
