# PIT-0010 — Memória de agente não é contrato

> Material longo do insight capturado no ledger (`.governance/runtime/insights/open.yml`,
> PIT-0010). Contexto: Spec 0024 · PR #39 (`toolchain-simplification`,
> `checkpoint-npm-toolchain`), Bloco 3 (2026-06-10).

## Insight

Quando um fluxo depende de o agente "lembrar" a sequência correta, o formato
esperado ou a exceção operacional já conhecida, o sistema ainda não tem
governança suficiente.

Instrução verbal, prompt longo e memória de sessão reduzem erro no curto
prazo, mas não criam contrato reprodutível. O padrão correto é transformar
atrito recorrente em template, comando, checker, schema ou CI.

## Evidência observada

Durante o PR #39 da Spec 0024, dois problemas apareceram:

1. O body do Draft PR falhou no `governance-pr-check` porque não seguia o
   contrato esperado do projeto.
2. Uma atualização posterior do PR body removeu a imagem/prompt original de
   `## Visão pretendida`, apagando a baseline de intenção criada no Draft
   (o agente regenerou o body inteiro a partir do arquivo local, em vez de
   ler o body remoto e atualizar apenas seções mutáveis).

Nos dois casos, a causa não era falta de explicação em chat, mas ausência de
contrato executável suficiente para guiar e validar o agente.

## Regra

Sempre que um erro recorrente exigir a frase "o agente deveria lembrar
que...", investigar se isso deve virar uma das seguintes formas governadas:

- template;
- script;
- checker local;
- CI;
- comando canônico;
- schema;
- boilerplate derivado;
- documentação curta acoplada ao fluxo.

## Aplicação no ai-guidelines

O framework deve preferir contratos executáveis a dependência de memória do
agente.

Exemplos diretos:

- PR body deve ser gerado/validado antes de ser aplicado.
- Atualização de PR body deve preservar seções baseline, especialmente
  `## Visão pretendida`.
- Draft e Ready têm contratos diferentes (Template v3, entregue no Bloco 1.5).
- Fallback de atualização de PR body deve ser procedimento canônico (FU-1).
- Sequência `PR body final → CI verde → Ready → Human Gate → gate artifact →
próximo checkpoint` deve ser verificável (FU-2).

## Contrato de mutabilidade do PR body (a enforçar no FU-1)

Regra registrada também nos comentários de `.github/pull_request_template.md`:

```text
Visão pretendida = baseline inicial.
Valor entregue  = evidência final.
```

- **Preservada por padrão**: `## Visão pretendida` — baseline de intenção do
  Draft (imagem + prompt). Atualizações automáticas do PR body devem
  preservá-la byte a byte. Mudança excepcional de visão (decisão da owner)
  entra como `Prompt complementar — atualização de visão pretendida`, sem
  apagar o baseline original.
- **Atualizáveis durante a implementação**: `## Resumo`, `## Escopo`,
  `## Test plan`, `## Validação, evidências e checklist`, `## Cross-refs`,
  `## Disclosure de IA`.
- **Preenchida ao final**: `## Valor entregue` (placeholder até a entrega
  para revisão final / Human Gate).

O FU-1 (fallback/procedimento canônico de atualização de PR body) deve
implementar atualização **seletiva por seção** sobre o body remoto lido na
hora — nunca regeneração integral a partir de arquivo local — e tratar a
lista acima como contrato.

## Recuperação aplicada (registro operacional)

O baseline do PR #39 foi recuperado pelo histórico de edições do body no
GitHub (GraphQL `PullRequest.userContentEdits[].diff`, edição de
2026-06-10T15:35:57Z) e restaurado — incluindo a imagem original
(`github.com/user-attachments/assets/02f85a35-…`). O histórico de edições do
GitHub é o mecanismo de recuperação quando essa regra falhar.

## Formulação curta

Memória de agente é canal.
Contrato governado é fonte de verdade.
