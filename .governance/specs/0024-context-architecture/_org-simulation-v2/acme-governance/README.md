# acme-governance — o meta-repo de GOVERNANÇA (Lente 5)

> O grafo de **registries** que uma app/form de intents gerenciaria (salvo em banco OU em arquivos). Aqui moram as **intents** (e, com o tempo: `proposals`, o banco derivado). Os **trabalhos** (explorations/deliveries) vivem nos REPOS (`acme-api`, `acme-design-system`, …) e são só **referenciados**.

## Estrutura (nesta rodada)

    acme-governance/
      intents/
        intent-0001/
          intent.yml          ← a intent-registry (governança): objetivo + open-questions + contratos

_(o CONTEÚDO das investigações NÃO vive aqui: cada open-question é respondida por uma `exploration` num repo, que declara `answers: intent-0001#qN` — a intent deriva `answered-by` (A+). O banco derivado (`../_derive.mjs`) recomputa a projeção a partir das registries.)_
