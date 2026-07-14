---
artifact-kind: inventory
subject: "Disposição da gramática operacional remanescente de G01 (F-AG01/F-003) no checkpoint internal-architecture-refactor-ddd-bdd (PR #46)"
date: 2026-07-12
disposition: evidence
---

# Disposição de G01 (gramática operacional) — PR #46

> **Autoridade:** nenhuma (inventário/evidência). O fechamento formal vive na
> decisão humana `[DEC-0024-G31]`; este artefato preserva a prova e o roteamento.
> **Contexto:** `[DEC-0024-G28]` dividiu G01: a gramática de
> artefatos/evidências FECHOU no PR #45; a **gramática operacional do work
> graph/runtime** é critério de saída DESTE checkpoint. Este documento prova
> que ela não ficou solta: mapeia o que o PR #46 materializou como contrato e
> o que permanece roteado com casa explícita (GG-0005).

## 1. O que G01 perguntava (fonte: `research/findings.md`)

- **F-AG01:** os 7 pilares MECE (ADR 0010) são a estrutura PRIMÁRIA do
  trabalho? Inversão `tipo→artefatos→lifecycle` × `pilares→artefatos→
lifecycle→tipo percebido`. Reenquadrado pela lente _estados > entidade_:
  "qual é a entidade?" pode ser pergunta malformada.
- **F-003:** `terminus` como hipótese de separador fino de classe — deferida,
  explicitamente NÃO coroar sem falsificação.
- Eixos de pressão que alimentam G01+: seleção (F-AA*), persistência (F-AB*),
  promoção (F-AD*), projeção (F-AE*), governança (F-AF\*).

## 2. O que o PR #46 MATERIALIZOU como contrato (fecha a parte do framework)

A gramática operacional do work graph **do próprio framework** deixou de ser
pergunta aberta — virou contrato executável, enforçado e testado:

| Componente da gramática                              | Contrato materializado                                                                                                                                                                                                                     | Enforcement                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Estrutura de contenção** (a "hierarquia primária") | `governed-work → topology-node → checkpoint → step → task` (matriz §8.1/8.2), homóloga à cadeia normativa do model.yml (`intent → execution-unit → repo-work`)                                                                             | snapshot + conformance fail-closed + `governance-graph:check` no validate    |
| **Tipagem ortogonal** (não hierárquica)              | `WorkItemKind` (7-MECE, ADR 0010) e `artifact-kind`/`disposition` (PR #45) são EIXOS, não níveis — a resposta à inversão de F-AG01: nenhum dos dois é "a estrutura"; a contenção é estrutural, o tipo é atributo                           | `artifact-kind:check`; tipos de nó fechados no snapshot                      |
| **Estados** (a lente _estados > entidade_, aplicada) | Estado próprio mínimo (`[ ]/[/]/[x]` + readiness declarada); TODO o resto é DERIVADO (`frenteProgression`: pendências posicionais, par de avanço, frente completa, executabilidade topológica; freshness; decisão efetiva de lane DEC-G29) | `SurfaceParity.test` (superfícies não re-derivam) + suites de decide/handoff |
| **Relações** (conjunto fechado)                      | 10 arestas do §8.2 (contains/stacked-on/continues-from/verifies/belongs-to/resolves/closed-by/supersedes/supported-by/derived-from)                                                                                                        | conformance do snapshot                                                      |
| **Autoridade e fronteira**                           | authority_order (PR #45) + camadas DDD guardadas (Blueprint + LayerBoundaries) + derived-only (nenhuma projeção decide)                                                                                                                    | 2 guards arquiteturais + reviewPolicy no domínio                             |
| **Vocabulário**                                      | `governed-work`/Frente-derivada/checkpoint/etapa/tarefa (G22/G25; §8.0 com proibidos e legados)                                                                                                                                            | contrato §8.0; snapshot rejeita `spec`/`frente` como tipo                    |

**Leitura da tese (INTERPRETAÇÃO):** a pergunta de F-AG01 estava malformada
como pergunta de ENTIDADE — o checkpoint a respondeu dissolvendo-a: contenção
é estrutura, tipo é eixo ortogonal, estado é derivação. É exatamente o
reenquadramento que o próprio finding sugeria, agora como código com guarda.

## 3. O que segue ROTEADO (não fecha aqui; casa explícita, sem silêncio)

| Resíduo                                                                                                    | Casa                                                                 | Por quê                                                                      |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **F-AG01 em escala consumidor** (7-MECE como estrutura primária de work-items de terceiros; promoção real) | `broad-flow-falsification` (G03, por DEC-G28)                        | precisa de FALSIFICAÇÃO com jornadas/consumidores, não de mais modelagem     |
| **F-003 (`terminus`)**                                                                                     | permanece finding ABERTO em `research/findings.md`                   | a instrução do finding é explícita: não coroar sem contraste; nada mudou     |
| **Eixos F-AE\* (projeções por consumidor)**                                                                | `broad-flow-falsification` (G05 resíduo, por DEC-G28)                | o snapshot atende CLI/mapa; consumidores reais são critério da falsificação  |
| **F-AD\*/F-AA\*/F-AB\*/F-AF\*** (promoção/seleção/persistência/governança)                                 | seguem findings de pesquisa; entram como insumos de G03/falsificação | são perguntas de investigação, não contratos prontos para fechar por decreto |

## 4. Decisão humana registrada

**[DEC-0024-G31] Gramática operacional do framework fechada por contrato; G01 residual roteado**

- A gramática operacional do work graph DO FRAMEWORK está fechada pelos
  contratos do PR #46: cadeia de contenção + tipagem ortogonal + estados
  derivados + conjunto fechado de relações + autoridade/vocabulário (§2 acima),
  com enforcement no `validate` e testes de paridade.
- F-AG01 em escala consumidor e os eixos de projeção/promoção seguem para
  `broad-flow-falsification` como critérios (reafirma DEC-G28); F-003
  permanece hipótese aberta não-coroada.
- Não decide: pilares como estrutura universal para consumidores; adoção de
  banco de grafo; `terminus`; Ready/Human Gate.

## 5. Critério de verificação (para `continuation-review-human-gate`)

A review final NÃO deve aceitar "G01 considerado": deve verificar (a) cada
linha da §2 tem o enforcement citado vivo; (b) cada linha da §3 aparece como
critério no checkpoint de destino; (c) `[DEC-0024-G31]` permanece coerente com
a implementação auditada — qualquer outra saída é GG-0005.
