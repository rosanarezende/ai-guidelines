# acme-governance — o meta-repo de GOVERNANÇA (Lente 5)

> O grafo de **registries** que uma app/form de intents gerenciaria (salvo em banco OU em arquivos). Aqui moram as **intents** (e, com o tempo: `proposals`, o banco derivado). Os **trabalhos** (explorations/deliveries) vivem nos REPOS, em **`.governance/works/<tipo>/<slug>_<num>/`** (`acme-design-system`, …), e são só **referenciados** aqui.

## Estrutura (nesta rodada)

    acme-governance/
      intents/
        login_1/
          intent.yml          ← a intent-registry (governança): objetivo + open-questions + contratos
          deliberation.yml    ← o mapa VIVO da deliberação (decisões append-only: decides/supported-by/results-in/supersedes)

_(o CONTEÚDO das investigações NÃO vive aqui: cada open-question é respondida por uma `exploration` num repo, que declara `answers: acme-governance/intents/login_1#qN` — a intent deriva `answered-by` (A+). Os bancos derivados (`../_banks/`, TS) recomputam a projeção: o do repo deriva local; o de governança consome a projeção do repo (banco→banco).)_
