# acme-governance — o meta-repo de GOVERNANÇA (Lente 5)

> O grafo de **registries** que uma app/form de intents gerenciaria (salvo em banco OU em arquivos). Aqui moram as **intents** (e, com o tempo: `proposals`, o banco derivado). Os **trabalhos** (explorations/deliveries) vivem nos REPOS, em **`.governance/works/<tipo>/<slug>_<num>/`** (`acme-design-system`, …), e são só **referenciados** aqui.

## Estrutura (nesta rodada)

    acme-governance/
      intents/
        login_1/
          intent.yml          ← a intent-registry (governança): objetivo + explores (pontos a explorar) + contratos
                              ↑ a intent NÃO tem deliberation.yml (q/r/d é etapa de work/exploration, não da intent)

_(o CONTEÚDO das investigações NÃO vive aqui: cada explore-point é respondido por uma `exploration` num repo, que declara `answers: acme-governance/intents/login_1#eN` — a intent deriva `answered-by` (A+). **A intent NÃO delibera** (q/r/d é etapa de work/exploration): o GATE da intent DERIVA do breakdown — uma work `derives-from` a exploration = **ACEITO**; nenhuma = **REJEITADO** (sem `deliberation.yml`). Os bancos derivados (`../_lib/`, TS) recomputam a projeção: o do repo deriva local; o de governança consome a projeção do repo (banco→banco).)_
