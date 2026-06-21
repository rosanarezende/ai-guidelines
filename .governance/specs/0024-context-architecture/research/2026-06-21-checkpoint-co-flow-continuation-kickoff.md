# CO-10.8 / PR #44 — Kickoff: drift governado precisa virar diagnóstico e reparo guiado

Data: 2026-06-21  
Spec: 0024 — context-architecture  
Checkpoint: `checkpoint-co-flow-continuation`  
PR: #44 — `co-flow-continuation`  
Status: kickoff do nó de continuação após Human Gate aprovado do PR #43.

## Decisão de produto

O usuário final não deve precisar entender `state.yml`, `active.yml`, `tasks.md`, topologia, PR stack, gates e projeções para continuar trabalhando com segurança.

Esses arquivos existem para o framework manter memória, autoridade e rastreabilidade. Quando eles entram em drift, o framework deve:

1. detectar o problema;
2. explicar em linguagem humana;
3. classificar a gravidade;
4. oferecer reparo seguro quando for determinístico;
5. pedir decisão humana apenas quando houver escolha real;
6. mostrar preview antes de qualquer escrita;
7. registrar evidência do que foi corrigido.

## Fato observado no fechamento do PR #43

Durante a abertura do próximo nó, o comando governado `open-next-node` criou a branch `feat/spec-0024-co-flow-continuation`, mas tentou publicar a branch antes de reconciliar `.governance/runtime/specs/active.yml`.

O hook de pre-push executou `active-specs:check` e bloqueou corretamente a publicação porque:

- a branch atual já era `feat/spec-0024-co-flow-continuation`;
- a projeção ativa ainda apontava para `feat/spec-0024-co-flow-convergence`.

O bloqueio estava certo. O problema de produto é que a recuperação exigiu conhecimento interno de governança:

- publicar manualmente o estado ativo;
- commitar a projeção;
- criar o PR Draft;
- aplicar a transição em `state.yml`, `active.yml` e `tasks.md`;
- reconciliar a narrativa `next`.

Esse é exatamente o tipo de situação que o framework deve resolver sem delegar ao humano.

## Hipótese de arquitetura

Criar uma camada explícita de diagnóstico/reparo governado, sem substituir o `state.yml` como SSOT estrutural.

Modelo inicial:

- `DriftIssue`: fato detectado, severidade, fonte canônica, fonte divergente, impacto humano.
- `RepairPlan`: conjunto ordenado de ações, cada uma com autoridade, preview e validações.
- `RepairAction`: `auto`, `confirm`, `human-decision` ou `blocked`.
- `GovernanceDoctor`: serviço que agrega checks existentes e transforma falhas em diagnóstico acionável.
- `RepairExecutor`: aplica apenas reparos determinísticos com confirmação e preview.

## Primeiros drift patterns candidatos

1. Branch atual diverge de `active.yml`.
2. `state.yml § topology.cursor` diverge da branch/PR atual.
3. `state.yml § next` diverge da topologia derivável.
4. `tasks.md` não materializa o checkpoint ativo.
5. PR body não reflete o recorte aprovado.
6. Gate aprovado existe, mas topologia não avançou.
7. Topologia aponta próximo nó, mas não há PR/branch correspondente.
8. Review/status/dogfood em `research/` contradiz o estado governado.

## Regra de UX

O wizard deve explicar o problema como uma orientação de trabalho:

```text
Detectei uma divergência de estado.

O que aconteceu:
  Você está na branch do próximo PR, mas a projeção ativa ainda aponta para o PR anterior.

Por que isso importa:
  Os checks não conseguem saber qual frente de trabalho você está tentando continuar.

O reparo seguro:
  Atualizar a projeção ativa para a branch atual.

Antes de aplicar:
  mostrar diff e validações que serão rodadas.
```

Não renderizar nomes internos como requisito para a pessoa decidir. Detalhes técnicos ficam em modo expandido.

## Relação com CO-10.8, CO-10.9 e CO-10.10

- CO-10.8 deve reorganizar a arquitetura interna para que esse tipo de serviço exista em lugar previsível, testável e mantível.
- CO-10.9 deve falsificar jornadas de drift em consumidores simulados e no próprio repositório.
- CO-10.10 deve pedir revisão independente antes do Human Gate do nó de continuação.

## Não escopo imediato

- Não automatizar Human Gate.
- Não corrigir drift sem preview.
- Não transformar `research/` em fonte de autoridade.
- Não criar segunda topologia.
- Não iniciar `dualroot-collapse`, `co-capture` ou `co-events`.

## Critério de saída inicial

O próximo passo técnico deve produzir um plano de implementação para o `GovernanceDoctor`, com inventário de checks existentes, classificação de reparabilidade e uma primeira correção para o bug observado em `open-next-node`.
