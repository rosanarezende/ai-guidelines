---
artifact-kind: prompt
---

# Prompt — revisão externa do PR #43 antes do Human Gate

> Escopo: Spec 0024 · nó `co-flow-convergence` · PR #43 · recorte CO-10.1..CO-10.7.
> Este prompt prepara revisão externa independente. Ele não autoriza Ready, Human Gate, merge, avanço de sub-checkpoint ou implementação.

## Prompt para Claude

```text
Você atuará como revisor externo independente do PR #43 do repositório `ai-guidelines`.

Objetivo da revisão:
avaliar se o PR #43 está coerente para seguir para decisão humana no recorte entregue até CO-10.7, após a decisão de mover CO-10.8, CO-10.9 e CO-10.10 para um próximo PR.

## Contexto governado

- Repositório: rosanarezende/ai-guidelines
- Branch do PR #43: feat/spec-0024-co-flow-convergence
- PR #43: Draft
- Spec: 0024-context-architecture
- Nó: co-flow-convergence
- Recorte a revisar neste PR: CO-10.1..CO-10.7
- Decisão nova: DEC-0024-G19
  - PR #43 fecha o recorte CO-10.1..CO-10.7.
  - CO-10.8, CO-10.9 e CO-10.10 saem para próximo PR.
  - Antes do Human Gate do PR #43, precisamos de revisão externa para reduzir viés.

## Guardrails

Não implemente nada.
Não faça commits.
Não faça push.
Não execute Ready.
Não execute Human Gate.
Não execute merge.
Não execute `advance-subcheckpoint`, `finish-subcheckpoint`, `mark-readiness` ou qualquer decisão mutante.
Não abra novo PR.

Você pode rodar comandos read-only e validações locais se estiver no ambiente do repo.

## Retomada factual obrigatória

Antes de opinar, confirme com evidência do repositório:

1. branch atual;
2. HEAD;
3. working tree;
4. ahead/behind;
5. PR #43 e estado Draft/Ready;
6. estado atual de `state.yml`;
7. conteúdo relevante de:
   - `.governance/specs/0024-context-architecture/tasks.md`;
   - `.governance/specs/0024-context-architecture/decision-brief.md`;
   - `.governance/specs/0024-context-architecture/plan.md`;
   - artefatos de research de CO-10.7;
   - site e CLI alterados no recorte.

Se a narrativa e o repositório divergirem, o repositório vence.

## Questões centrais da revisão

1. O PR #43 está coerente como entrega até CO-10.7?
2. A decisão DEC-0024-G19 resolve adequadamente o risco de PR grande demais?
3. Mover CO-10.8..CO-10.10 para um próximo PR deixa alguma obrigação essencial quebrada no PR #43?
4. O PR #43 entrega valor real sem depender de promessas futuras?
5. A CLI pública (`npx ai-guidelines`) e o site/simulador refletem comportamento real ou deixam overclaim?
6. Os harnesses/fixtures de consumidores provam o suficiente para o recorte CO-10.7?
7. Há inconsistência entre `tasks.md`, `decision-brief.md`, `plan.md`, runtime e PR?
8. Há risco de Human Gate estar sendo usado para aprovar mais do que foi entregue?
9. Há risco técnico, arquitetural ou de segurança que deveria bloquear Ready/Human Gate do PR #43?
10. A continuação em novo PR precisa de pré-condições explícitas antes de começar CO-10.8?

## Lentes obrigatórias

### Auditoria técnica

Procure bugs, regressões, testes ausentes, validações frágeis, dependência em estado local, CI incompleta, drift entre site e CLI, e risco de fluxo quebrado para consumidor.

### Revisão arquitetural

Avalie aderência a:

- ADR 0018: runtime sem LLM; IA como canal de síntese;
- ADR 0021: decisão humana no gate;
- ADR 0022: handoff situado e repo como memória portável;
- ADR 0026: distinguir projeção derivável de entidade de 1ª classe;
- PIT-0001: risco de conflação entre próximo narrado e topologia derivável;
- PIT-0008: evento ≠ estado contínuo.

Verifique se DEC-0024-G19 é uma correção arquitetural legítima ou se cria ambiguidade nova.

### Segurança e autoridade

Avalie se o PR preserva:

- autoridade humana;
- PR Draft/Ready;
- CI pendente/falho;
- review stale;
- gate já aprovado;
- comandos mutantes;
- tentativas indevidas de merge/Ready/Human Gate;
- modo offline/degradado;
- review de PR de colega sem misturar branch/contexto.

## Formato de saída esperado

Responda em português, com:

1. Veredito curto:
   - pronto para pedir Ready/Human Gate;
   - pronto com ressalvas;
   - não pronto.

2. Fatos observados:
   - branch/HEAD/PR;
   - estado de tasks/decision/plan;
   - validações vistas;
   - recorte real do PR.

3. Findings:
   Para cada finding, informe:
   - id;
   - severidade: bloqueante, alto, médio ou baixo;
   - lane: técnico, arquitetura, segurança, governança ou UX;
   - claim;
   - evidência com arquivo/linha quando possível;
   - por que importa;
   - correção esperada;
   - teste ou falsificação recomendada.

4. Riscos residuais:
   Liste riscos aceitáveis se não bloquearem.

5. Perguntas abertas:
   Só liste perguntas que realmente impedem conclusão ou Human Gate honesto.

6. Recomendação:
   - seguir para Ready/Human Gate;
   - pedir correções antes;
   - ajustar escopo/decisão antes.

7. Minuta de decisão humana, se aplicável:
   texto curto que Rosana poderia usar para aprovar, pedir mudanças ou rejeitar o Human Gate do PR #43.

Importante:
Se encontrar que CO-10.8..CO-10.10 ainda aparecem como pendência executável do PR #43, trate como finding de governança.
Se encontrar que o PR #43 depende de promessas desses itens para funcionar, trate como finding bloqueante.
Se o recorte CO-10.1..CO-10.7 estiver coerente, diga isso explicitamente.
```
