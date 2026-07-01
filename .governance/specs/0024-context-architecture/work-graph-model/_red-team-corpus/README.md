# Red-team corpus — fixtures adversariais reprodutíveis do modelo v2

> **O que é:** as fixtures concretas da [simulação adversarial](../deliberation/2026-07-01-adversarial-simulation-red-team-deliberation.md) (2026-07-01) — cada ataque red-team como um caso reproduzível, com o **expected-outcome** que um sistema correto DEVE produzir. É a **suíte que verifica se um controle é enforcement REAL ou cerimônia** — a materialização dos ataques que o Codex gerou (round 1) e dos veredictos reconciliados contra o repo (round 2).
>
> **Natureza:** evidência/teste, **não-autoridade** (o repo/gates vencem). Anonimizado (`acme-*`); nenhuma fonte confidencial.
>
> **Dogfood da Lei da independência (O1):** o corpus **pratica** a independência que descobriu — cada fixture separa `attack-by` (quem bolou o ataque) de `expected-by` (quem escreveu o resultado esperado) de `approved-by` (quem aprova no gate). O oráculo não pode ser governado pelo mesmo ator que ele julga.

## Como usar

1. Cada fixture tem um **`expected-outcome`** falsificável: rodar o cenário contra o modelo/sim e comparar.
2. Um controle só passa como **enforcement REAL** se produz o expected via **resolver/invariante + fail-closed + evidência independente** (a barra do round 2). "Controle nomeado" sem mecanismo = **cerimônia** → falha a fixture.
3. Quando a sim robusta sobre a v2 existir (roadmap [`features.md`](../features.md)), ela consome este corpus como regressão.

## Schema de uma fixture

```yaml
family: <slug da família>
attack-by: codex # quem gerou o ataque (round 1) — o adversário
fixtures:
  - id: A1 # o id da deliberação
    title: <o vetor, curto>
    priority: P0 | P1 | P2
    verdict: ADICIONAR | MANTER-mecanismo | REBAIXAR | MOVER # round 2 (reconciliado)
    targets: { lens: L8 | L9 | ..., control: "<o controle mirado>" }
    attack: | # o caso concreto (YAML/estado/sequência) — o payload hostil
    attacker-goal: <o que o atacante ganha se funcionar>
    expected-outcome: <o que o sistema CORRETO deve fazer — falsificável>
    expected-by: claude # quem escreveu o expected (consolidação) — ≠ attack-by (O1)
    approved-by: <owner — ⏳ gate> # a aprovação independente (O1)
```

## Índice das fixtures (21)

| id     | família             | prio   | veredito (round 2)         | arquivo                                  | status |
| ------ | ------------------- | ------ | -------------------------- | ---------------------------------------- | ------ |
| **A1** | input hostil        | **P0** | ADICIONAR (mecanismo)      | [A-input-hostil.yml](A-input-hostil.yml) | ✅     |
| **A2** | input hostil        | P1     | ADICIONAR                  | [A-input-hostil.yml](A-input-hostil.yml) | ✅     |
| **B1** | capability          | **P0** | ADICIONAR (dente)+REBAIXAR | B-capability.yml                         | ✅     |
| **B2** | capability          | P1     | ADICIONAR                  | B-capability.yml                         | ✅     |
| **C1** | agente & autoridade | —      | **MANTER-mecanismo**       | C-agente-autoridade.yml                  | ✅     |
| **C2** | agente & autoridade | **P0** | ADICIONAR                  | C-agente-autoridade.yml                  | ✅     |
| **C3** | agente & autoridade | P1     | ADICIONAR                  | C-agente-autoridade.yml                  | ✅     |
| **D1** | egress & classif.   | **P0** | MANTER-mecanismo+ADICIONAR | D-egress-classificacao.yml               | ✅     |
| **D2** | egress & classif.   | **P0** | ADICIONAR                  | D-egress-classificacao.yml               | ✅     |
| **E1** | proveniência        | **P0** | MANTER+ADICIONAR           | E-proveniencia.yml                       | ✅     |
| **E2** | proveniência        | P1     | ADICIONAR                  | E-proveniencia.yml                       | ✅     |
| **F1** | gaming              | —      | MANTER(contador)+MOVER     | F-gaming.yml                             | ✅     |
| **F2** | gaming              | **P0** | MANTER+ADICIONAR           | F-gaming.yml                             | ✅     |
| **F3** | gaming              | **P0** | ADICIONAR (break-glass)    | F-gaming.yml                             | ✅     |
| **G1** | SSOT                | P2     | ADICIONAR                  | G-ssot.yml                               | ✅     |
| **G2** | SSOT                | P1     | ADICIONAR                  | G-ssot.yml                               | ✅     |
| **H1** | standalone          | **P0** | MANTER-retenção+ADICIONAR  | H-standalone.yml                         | ✅     |
| **H2** | standalone          | P1     | ADICIONAR                  | H-standalone.yml                         | ✅     |
| **H3** | standalone          | P2     | ADICIONAR                  | H-standalone.yml                         | ✅     |
| **X**  | independência       | **P0** | ADICIONAR (headline)       | X-O1-independencia.yml                   | ✅     |
| **O1** | independência/meta  | **P0** | ADICIONAR (meta)           | X-O1-independencia.yml                   | ✅     |

_✅ as 21 fixtures escritas (round 1). Aguardando validação do Codex + gate da owner (`approved-by`). Veredictos e a régua de 7 eixos: [deliberação](../deliberation/2026-07-01-adversarial-simulation-red-team-deliberation.md)._
