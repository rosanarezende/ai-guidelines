# Briefing de continuação — [🛠️13️⃣➜] [Spec 0024] Falsificação ampla do lifecycle governado

## Fatos governados

- Origem: PR #46
- Checkpoint de continuação: `broad-flow-falsification`
- Base: `feat/spec-0024-internal-architecture-refactor-ddd-bdd`
- Head: `feat/spec-0024-broad-flow-falsification`
- Preparado em: 2026-07-14
- O PR #46 concluiu seu recorte com Human Gate aprovado; o checkpoint seguinte terá
  revisão própria em um novo Draft PR.
- `broad-flow-falsification` continua dentro do nó topológico seq. 13. Ele não cria
  um nó adicional e não autoriza `dualroot-collapse`.

## Objeto da continuação

Falsificar o lifecycle governado de ponta a ponta depois do refactor DDD/BDD,
provando não apenas transições válidas, mas valor entregue, autoridade humana,
projeções por consumidor e comportamento não linear. O checkpoint deve consolidar
fixtures/journeys canônicas e eliminar fontes paralelas ou dispositioná-las
explicitamente.

## Leituras obrigatórias

- `state.yml`, `tasks.md`, `plan.md` e `decision-brief.md` desta frente;
- `[DEC-0024-G23]`, `[DEC-0024-G28]` e `[DEC-0024-G31]`;
- `work-graph-model/GUILDA-QRD-PRESERVATION-MATRIX.md` e a matriz de lentes do PR #46;
- contratos atuais de consumer journeys, site scenarios, PR body e checks.

## Limites

Este pacote não cria PR remoto por si só, não muda Ready, não registra Human Gate,
não faz merge e não altera a topologia. Também não implementa `dualroot-collapse`,
shared kernel/Guilda Flow, produto Guilda ou integrações cross-repo.

## Próximo passo humano

1. Revisar `body.md` e este briefing.
2. Rodar `continuation:create-pr -- --package <dir>` para ver o comando.
3. Reexecutar com `--confirm` somente quando a criacao do Draft PR estiver autorizada.
