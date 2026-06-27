# acme-governance — o meta-repo de GOVERNANÇA (Lente 5)

> O grafo de **registries** que uma app/form de intents gerenciaria (salvo em banco OU em arquivos). Aqui moram as **intents** (e, com o tempo: `proposals`, o banco derivado). Os **trabalhos** (explorations/deliveries) vivem nos REPOS (`acme-api`, `acme-design-system`, …) e são só **referenciados**.

## Estrutura (nesta rodada)

    acme-governance/
      intents/
        intent-0001/
          intent.yml          ← a intent-registry (governança)
          deliberation/       ← as questions do objetivo (a definir se vive aqui ou na exploration)

_(por ora há 2 variantes — `intent.robusta.yml` × `intent.enxuta.yml` — pra decidir quanto a intent EMBUTE × REFERENCIA.)_
