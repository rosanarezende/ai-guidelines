---
artifact-kind: gap
---

# PR #45 — Gap closure antes da taxonomia de artefatos

Data: 2026-06-22  
Spec: 0024 — context-architecture  
PR: #45 — `artifact-taxonomy-and-model-review-contract`  
Natureza: dogfood/escopo de entrada. Este artefato registra gaps descobertos ao abrir o PR #45; ele não executa decisão, Ready, Human Gate, merge ou avanço.

## 1. Por que este artefato existe

O PR #45 nasceu para implementar a taxonomia de artefatos e o contrato de
review pré-codificação/model-review definidos por `[DEC-0024-G21]`. Porém o
dogfood da própria abertura do PR mostrou três problemas anteriores à
taxonomia:

1. A seção **Visão pretendida** do PR ainda podia receber prompt solto, sem o
   padrão versionado de `.governance/visual-prompts`.
2. Não existe comando de produto para **abrir o próximo PR governado dentro do
   mesmo nó/continuação** quando ainda há checkpoints semânticos pendentes.
3. A linguagem do lifecycle ainda mistura "nó", "checkpoint semântico",
   "sub-checkpoint", "etapa" e "tarefa", o que aumenta o risco de humanos e
   agentes abrirem o próximo objeto errado.

Esses gaps precisam ser fechados antes de implementar a taxonomia, porque a
taxonomia depende justamente de artefatos que declaram sua natureza, autoridade
e lugar no fluxo.

## 2. Gap A — Visão pretendida sem padrão versionado

### Fato observado

O PR #45 foi corrigido manualmente para seguir o template de PR, mas o prompt de
visão pretendida ainda foi escrito como texto ad hoc.

### Correção esperada

- Criar um template versionado em `.governance/visual-prompts/` para visão
  pretendida de Draft PR.
- Expor esse template no catálogo de prompts visuais.
- Fazer `pr-body:create` gerar uma visão pretendida estruturada, com problema,
  mudança pretendida, estado esperado, trilho de autoridade e fora de escopo.
- Atualizar o body do PR #45 para usar o novo padrão.

### Critério de aceite

Um novo Draft PR execution não deve nascer com frase genérica de visão
pretendida. Ele deve carregar um prompt estruturado e rastreável ao padrão
versionado.

## 3. Gap B — Abrir próximo PR interno ainda é orquestração manual

### Fato observado

Para abrir o PR #45 foi necessário coordenar manualmente: branch, `active.yml`,
`tasks.md`, PR body, título, base/head e reconciliação da topologia.

### Correção esperada

Criar uma operação governada para preparar o próximo PR dentro do mesmo nó quando
há checkpoint semântico pendente. Nome provisório:

```text
flow prepare next-pr
```

O nome final depende da decisão de vocabulário do lifecycle.

### Comportamento esperado

O comando deve:

1. identificar o próximo checkpoint/unidade pendente em `tasks.md`;
2. sugerir branch, título e base/head corretos;
3. gerar body de PR pelo perfil correto, usando a visão pretendida padronizada;
4. preparar preview das alterações em `active.yml`, `tasks.md` e, quando
   necessário, `state.yml § topology`;
5. pedir confirmação humana antes de escrever;
6. deixar explícito que não executa Ready, Human Gate, merge, abertura do
   próximo nó topológico ou `dualroot-collapse`.

### Critério de aceite

A próxima abertura de PR governado dentro da continuação deve ser possível por
um caminho de produto com preview/confirm, sem exigir que o humano conheça todos
os arquivos internos.

### Disposição em 2026-07-07

A readiness do PR #45 não implementa esse comando. O gap foi reclassificado como
automação futura e recebeu protocolo interino em
`research/2026-07-07-pr-continuation-protocol.md`: quando um PR ficar grande, a
continuidade deve ser decidida por readiness + próximo movimento governado,
preservando decisão humana e proibindo Ready/Human Gate/merge automático.

## 4. Gap C — Vocabulário do lifecycle ainda não está modelado

### Fato observado

O repo ainda carrega linguagem antiga como "sub-checkpoint" e linguagem
transitória como "checkpoint semântico". A conversa de dogfood convergiu para a
hipótese humana:

```text
Spec > Fase > Checkpoint > Etapa > Tarefa
```

Mas essa hipótese ainda não foi registrada como decisão/modelo canônico.

### Correção esperada

Registrar uma decisão de vocabulário antes do rename amplo, respondendo:

- quais níveis são entidades de primeira classe;
- quais níveis são opcionais;
- qual termo substitui "nó topológico" na linguagem humana;
- quando usar Checkpoint, Etapa e Tarefa;
- como preservar compatibilidade com `state.yml § topology` sem confundir a
  pessoa usuária.

### Critério de aceite

O runtime e os documentos novos não devem introduzir mais ocorrências novas de
"sub-checkpoint" ou "checkpoint semântico" fora de contexto histórico. O rename
amplo pode ser incremental, mas a decisão precisa existir antes.

## 5. Ordem recomendada no PR #45

1. Padronizar **Visão pretendida** via `.governance/visual-prompts`.
2. Registrar/decidir o vocabulário humano do lifecycle.
3. Implementar a operação de preparação do próximo PR interno.
4. Só então implementar a taxonomia de artefatos e o contrato de model-review.

Essa ordem aplica `GG-0005 — Sem débito arquitetural silencioso`: a decisão
estruturante não é empurrada como "ajuste depois" enquanto o contexto está
fresco.
