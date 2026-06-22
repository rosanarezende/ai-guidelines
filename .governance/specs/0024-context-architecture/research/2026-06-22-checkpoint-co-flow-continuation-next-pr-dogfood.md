# PR #45 — Dogfood/status: abertura de PR semântico dentro de `co-flow-continuation`

Data: 2026-06-22  
Spec: 0024 — context-architecture  
Nó: `co-flow-continuation`  
Checkpoint semântico iniciado: `artifact-taxonomy-and-model-review-contract`  
PR aberto: #45  
Natureza: dogfood/status, não-autoridade. Este artefato registra observação de fluxo; não executa decisão, Ready, Human Gate, merge ou avanço.

## 1. Pergunta observada

Após o Human Gate aprovado do PR #44, a mantenedora quis testar se o framework
conseguia fechar o recorte anterior e abrir o próximo PR corretamente.

O caso é importante porque `co-flow-continuation` ainda tem checkpoints
semânticos pendentes. Portanto, o próximo trabalho não deveria abrir o nó
topológico `dualroot-collapse`; deveria abrir um PR novo dentro da continuação.

## 2. O que funcionou

- `open-next-node --brief-only --technical` bloqueou corretamente a abertura de
  `dualroot-collapse` enquanto havia checkpoints semânticos pendentes.
- `work --authorization explicit-work-request` projetou que o PR #44 estava
  pronto como recorte, mas que o próximo PR deveria continuar em
  `co-flow-continuation`.
- `repair --apply --updated-by '@rosanarezende'` corrigiu o drift de branch em
  `active.yml` com preview, confirmação e revalidação.
- `drift:check` e `active-specs:check` confirmaram o estado reconciliado após a
  troca para o branch do PR #45.
- O push do branch novo rodou `validate:changed` via hook e terminou verde.
- O Draft PR #45 foi aberto com base em `feat/spec-0024-co-flow-continuation`,
  sem tocar em `main`, sem abrir `dualroot-collapse` e sem executar Ready/Human
  Gate.

## 3. Adaptações manuais necessárias

- Não existe ainda um comando de produto para "abrir o próximo checkpoint
  semântico como PR". A sequência precisou ser orquestrada manualmente:
  criar branch, reparar `active.yml`, marcar o item em `tasks.md`, commitar,
  pushar e abrir PR.
- `open-next-node` conhece o próximo nó topológico, mas não materializa um PR
  para o próximo checkpoint semântico pendente.
- `work` já mostra o bloqueio correto, mas a narrativa de próxima ação ainda
  precisa evitar linguagem ambígua quando o próximo passo é um PR dentro do
  mesmo nó.
- O gerador de body atual é orientado a "next node"; para este caso, o texto do
  PR precisou ser escrito manualmente para não chamar o checkpoint semântico de
  nó governado.
- A linguagem runtime ainda usa "checkpoint semântico", "sub-checkpoint" e "nó"
  de forma pouco clara para humanos. Isso reforça a necessidade de uma DEC de
  vocabulário humano do lifecycle.

## 4. Melhoria de produto candidata

Criar um fluxo governado específico para materializar o próximo PR dentro do
mesmo nó, sem abrir o próximo nó topológico.

Uma forma possível:

```text
flow prepare next-pr
```

ou outro nome decidido pelo vocabulário final. O comando deveria:

1. identificar o próximo checkpoint semântico pendente em `tasks.md`;
2. sugerir branch e título de PR;
3. aplicar `active.yml` via reparo determinístico;
4. marcar o checkpoint como em andamento;
5. gerar body de PR com o perfil correto, sem linguagem de "novo nó";
6. pedir confirmação humana antes de escrever;
7. deixar claro que não executa Ready, Human Gate, merge, avanço de nó ou
   abertura de `dualroot-collapse`.

## 5. Estado resultante

- Branch: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- Commit inicial: `62de8359`.
- PR #45 aberto como Draft.
- `co-flow-continuation` permanece como nó ativo.
- `dualroot-collapse` permanece bloqueado até a continuação terminar.

## 6. Conclusão

O framework já detecta a fronteira correta entre "próximo nó topológico" e
"próximo PR dentro da continuação", mas ainda não oferece uma operação única e
segura para materializar esse PR. A abertura do PR #45 foi possível seguindo as
regras, porém exigiu coordenação manual de passos que deveriam ser suportados
pelo produto.
