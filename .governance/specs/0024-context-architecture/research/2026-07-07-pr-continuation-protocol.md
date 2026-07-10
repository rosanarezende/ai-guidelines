---
artifact-kind: pre-coding-review
subject: "protocolo interino para PR grande e continuidade governada"
date: 2026-07-07
disposition: living
---

# Protocolo interino — PR grande e continuidade governada

Data: 2026-07-07  
Spec: 0024 — context-architecture  
PR observado: #45 — `artifact-taxonomy-and-model-review-contract`

## 1. Problema

O PR #45 cresceu além do recorte originalmente fácil de revisar. A auditoria de
readiness identificou o antigo **Gap B** da fatia-zero: ainda não há comando de
produto para abrir automaticamente o próximo PR governado dentro da mesma
continuação.

## 2. Fatos

- O runtime já possui `flow -- work`, `flow -- decide`, readiness e bloqueios de
  Ready/Human Gate/merge.
- O PR #45 está em modo Draft e stacked, com `state.yml § topology` como SSOT da
  sequência.
- A experiência anterior do PR #43 já mostrou que PR grande precisa de recorte
  honesto, body reconciliado e continuação ancorada antes de Human Gate.
- Implementar agora um comando "abrir próximo PR interno" sem contrato completo
  de branch/base/body/checkpoint criaria automação prematura.

## 3. Decisão operacional interina

Até existir comando governado próprio, PR grande deve usar este protocolo:

1. **Parar de adicionar features novas** quando `flow -- work` projetar
   readiness para a etapa ativa.
2. **Rodar revisão adversarial de readiness** antes da decisão humana.
3. **Corrigir pendências de honestidade pré-readiness**, especialmente PR body,
   docs, classificação de artefatos e pequenos riscos conhecidos.
4. **Declarar readiness** apenas depois da reconciliação.
5. **Abrir a próxima continuidade manualmente**, se a owner decidir avançar:
   - usar `flow -- decide` para a próxima decisão permitida;
   - preservar branch/base/PR state derivados de `state.yml`;
   - criar PR/body com cross-ref explícito ao PR anterior;
   - não mover Ready/Human Gate/merge por automação implícita.

## 4. O que fica fora desta readiness

- Criar um comando novo para abrir PR interno automaticamente.
- Avançar a etapa seguinte.
- Converter PR #45 para Ready.
- Exercer Human Gate.
- Fazer merge.

## 5. Critério para automação futura

Um comando futuro só deve nascer quando tiver contrato explícito para:

- checkpoint/etapa de origem e destino;
- branch base/head;
- Draft PR body preservando "Visão pretendida";
- cross-refs entre PRs;
- CI/readiness/reviews;
- rollback se branch, PR ou `active.yml` divergir;
- proibição clara de Ready/Human Gate/merge automático.

## 6. Disposição do Gap B

O Gap B deixa de ser débito silencioso deste PR: ele fica **diferido
explicitamente** como automação futura. Para a readiness do PR #45, o mecanismo
aceito é o protocolo interino acima, porque ele preserva decisão humana e evita
uma automação incompleta.
