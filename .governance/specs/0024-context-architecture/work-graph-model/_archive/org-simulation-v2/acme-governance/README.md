# acme-governance — o meta-repo de GOVERNANÇA (Lente 5)

> O grafo de **registries** que uma app/form de intents gerenciaria (salvo em banco OU em arquivos). Aqui moram as **intents** (e, com o tempo: `proposals`, o banco derivado). Os **trabalhos** (explorations/deliveries) vivem nos REPOS, em **`.governance/works/<tipo>/<slug>_<num>/`** (`acme-design-system`, …), e são só **referenciados** aqui.

## Estrutura (nesta rodada)

> Arquétipo **back/host** do padrão: o **produto** (o servidor que AGREGA as projeções publicadas + serve o
> dashboard) viveria em `src/`; a **governança da ORG** vive ao lado, em `intents/` + `proposals.yml`. _(≠ um
> work-repo, que carrega `.governance/`.)_

    acme-governance/
      src/index.js            ← o produto/host (mínimo na sim)
      intents/
        login_1/
          intent.yml          ← a intent-registry (governança): objetivo + explores (pontos a explorar) + contratos
                              ↑ a intent NÃO tem deliberation.yml (q/r/d é etapa de work/exploration, não da intent)
      proposals.yml           ← o intake (proposals)
      .cache/                 ← read-models derivados (gitignored)
      .gitignore · README.md · package.json

_(o CONTEÚDO das investigações NÃO vive aqui: cada explore-point é respondido por uma `exploration` num repo, que declara `answers: acme-governance/intents/login_1#eN` — a intent deriva `answered-by` (A+). **A intent NÃO delibera** (q/r/d é etapa de work/exploration): o GATE da intent DERIVA do breakdown — uma work `derives-from` a exploration = **ACEITO**; nenhuma = **REJEITADO** (sem `deliberation.yml`). Os bancos derivados (`../_lib/`, TS) recomputam a projeção: o do repo deriva local; o de governança consome a projeção do repo (banco→banco).)_
