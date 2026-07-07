---
artifact-kind: research
---

# Posicionamento open-source e naming do produto

> **Frente:** Spec 0024 · work-graph-model · governance-demo
> **Data da pesquisa:** 2026-07-06
> **QRDs alvo:** QRD-12 (natureza do app), QRD-13 (relação com CLI), QRD-37 (produto/nome), QRD-38 (extração — ver [research irmã](2026-07-06-work-graph-model-extraction-strategy.md)).
> **Regra:** repositório vence narrativa. Separo FATO de INTERPRETAÇÃO. Nenhuma stack é escolhida por inércia. Default mental = open-source, self-hostable, local-first.

> **Reconciliação 2026-07-07:** a owner decidiu pelo modelo hibrido:
> portal para contas/convites/memberships e governance host Git-backed no
> provedor do usuario. Esta pesquisa continua valida como base de
> posicionamento OSS/naming, mas a recomendacao "nao precisa de decisao de
> nome/repo agora para continuar" foi superada para as proximas grandes telas:
> o app visual deve caminhar para nome proprio e repo irmao do `ai-guidelines`.

## 1. Base verificada

**Arquivos locais lidos (fonte de verdade):**

- `governance-demo/APP-DECISIONS.md` — QRD-12, QRD-13, QRD-37 (research-open), QRD-38 (research-open).
- `governance-demo/APP-PRODUCT-STATEMENT.md` §1–§11 (produto local-first, self-hostable, OSS-first; app ≠ substituto da CLI; sem billing/tenant por default).
- `governance-demo/ARCHITECTURE.md` (packages/domain, contracts, test-fixtures; backend hexagonal; frontend Next/MUI).
- `governance-demo/README.md`, `frontend/README.md` (superfície ativa; SDK `@demo/backend`).
- `model.yml` (SSOT conceitual do work graph; file-first/event-log autoritativo).
- Git: branch `feat/spec-0024-artifact-taxonomy-and-model-review-contract`, HEAD `c934ade6`, PR [#45](https://github.com/rosanarezende/ai-guidelines/pull/45) (checks passing). Working tree quase limpo (`APP-DECISIONS.md` M; prompt desta rodada untracked).

**Fontes externas consultadas (primárias quando possível):**

- PostHog LICENSE: <https://github.com/PostHog/posthog/blob/master/LICENSE>
- Grafana licensing (AGPLv3 desde 2021): <https://grafana.com/licensing/>
- Twenty CRM (AGPL-3.0): <https://github.com/twentyhq/twenty>
- GitLab stewardship / open-core: <https://handbook.gitlab.com/handbook/company/stewardship/>
- OpenSSF OSPS Baseline: <https://baseline.openssf.org/> · Best Practices Badge: <https://www.bestpractices.dev/> · Scorecard: <https://github.com/ossf/scorecard>

> **Nota de confiança:** meu corpo de conhecimento tem corte em jan/2026; as buscas rodaram em jul/2026. Onde um fato depende de estado corrente (licença, aquisição, status de programa), marco a fonte e a data. Onde não pude abrir a fonte primária, digo "não verificado na fonte primária".

## 2. Fatos

- **F1 — O app já é OSS-first por decisão registrada.** QRD-12 e APP-PRODUCT-STATEMENT §7 definem o app como "superfície humana, local-first e self-hostable do framework", sem billing/tenant/plano pago por default. (Fonte: repo.)
- **F2 — CLI e app são superfícies distintas sobre o mesmo runtime.** QRD-13 e APP-PRODUCT-STATEMENT §5–§6: a CLI `ai-guidelines` é headless (terminal/CI/automação); o app é a superfície humana; ambos compartilham domínio/runtime/contratos/file-first; shell-out é ponte temporária, não arquitetura-alvo. (Fonte: repo.)
- **F3 — `governance-demo` é nome de fase, não nome de produto.** QRD-37 diz explicitamente que `governance-demo` "não deve ser tratado como nome público". (Fonte: repo.)
- **F4 — Padrão OSS consolidado: separar core/lib/CLI · app/server · hosted opcional · docs/site · adapters.** GitLab (open-core: Community MIT + Enterprise proprietária, mesma base), PostHog (MIT no core + diretório `ee/` sob licença própria), Grafana (core AGPLv3 desde 2021; plugins/agents Apache), Twenty (AGPL-3.0). (Fontes: links acima; detalhe de `ee/` do PostHog confirmado no LICENSE do repo; GitLab open-core no handbook de stewardship.)
- **F5 — AGPL é a licença "anti-SaaS-parasita" comum para app/server OSS que quer permitir hosted futuro sem virar open-core parasitável.** Grafana e Twenty usam AGPL-3.0 exatamente para forçar reciprocidade em quem hospeda. (Fonte: repos/licensing pages acima.)
- **F6 — OpenSSF oferece três instrumentos de maturidade/segurança complementares:** OSPS Baseline (checklist em 3 níveis, hosting-agnostic, self-assessment do mantenedor), Best Practices Badge (agora aceita critérios do Baseline), Scorecard (grading automatizado, orientado a GitHub). (Fonte: openssf.org, fev/2026 blog + baseline.openssf.org.)
- **F7 — O produto atual já tem os cinco corpos separáveis do F4 fisicamente:** `packages/*` (core/lib), `backend/` (runtime), `frontend/` (app), `mock-api/` + `test/` (dev/test), `tools/` (checks/CLIs), `acme/` (dogfood), docs (`APP-*.md`, `ARCHITECTURE.md`), e a CLI `ai-guidelines` (raiz do repo). (Fonte: repo.)

## 3. Interpretação

**Para este projeto:**

O produto **não precisa de decisão de nome/repo agora para continuar**, mas precisa de uma **decisão de posicionamento** para não modelar errado. O risco real não é "escolher o nome errado"; é **acoplar identidade de produto a `ai-guidelines` de forma que a Spec 0024 nunca feche** (QRD-38) e que o app cresça sem fronteira de contribuição própria.

O padrão F4 encaixa quase 1:1 no que já existe (F7). A leitura correta é: o repo já está _arquiteturalmente_ pronto para um dia virar "core + app + CLI + docs + adapters"; o que falta é **nomear as fronteiras de produto** e **decidir a licença do app/server** (que hoje é herdada implicitamente do repo).

Trade-offs de licença (INTERPRETAÇÃO):

- **CLI/core/lib (`packages/*`, runtime):** licença permissiva (MIT/Apache-2.0) maximiza adoção como dependência e reuso por adapters de terceiros. Alinha com "framework nasceu OSS" e com querer que outros construam sobre o modelo.
- **App/server (`frontend/` + backend HTTP):** AGPL-3.0 é o default defensável se houver intenção de hosted futuro — permite self-host livre e ainda protege contra um concorrente hospedar sem contribuir (F5). Mas AGPL **atrita com adoção corporativa** (muitas empresas bloqueiam AGPL). Alternativa: manter tudo permissivo agora e só endurecer se/quando houver hosted — endurecer licença depois é possível para código próprio, mas irreversível para o que já saiu sob a licença antiga.
- **Dual-licensing/open-core (GitLab/PostHog):** só faz sentido **depois** que existir um recurso "enterprise" real para segregar. Hoje não existe → decidir open-core agora seria cerimônia prematura (viola QRD-12).

## 4. Matriz de alternativas — onde o trabalho deve viver

| Alternativa                                                  | O que entrega                                                   | Custo/operação                                              | Lock-in                                     | Self-host | Maturidade p/ decidir               | Riscos                                                                             | Aderência ao modelo              |
| ------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- | --------- | ----------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| **A. Continuar em `work-graph-model` (Spec 0024)**           | zero fricção; histórico/testes/governança intactos              | nenhum                                                      | nenhum                                      | n/a       | alta                                | Spec 0024 nunca fecha; produto escondido dentro de spec dificulta contribuição OSS | alta agora, baixa no médio prazo |
| **B. Promover para app de 1ª classe na raiz do monorepo**    | visibilidade; `README` raiz aponta produto; preserva histórico  | baixo (mover pasta + reconciliar paths/guards)              | nenhum                                      | n/a       | média                               | mistura framework-repo com produto-repo; paths/CI a reconciliar                    | alta                             |
| **C. Repo separado agora**                                   | identidade própria; contribuição limpa; issues/roadmap próprios | alto (extração, CI, releases, docs, sincronização com core) | nenhum (mas cria acoplamento entre 2 repos) | n/a       | baixa (critérios ainda não batidos) | fork prematuro; core ainda instável; duplicação de governança                      | média                            |
| **D. Repo/produto separado DEPOIS, por critérios objetivos** | timing correto; core estabiliza primeiro                        | médio (planejar gatilhos)                                   | nenhum                                      | n/a       | alta                                | exige disciplina p/ não adiar indefinidamente                                      | alta                             |

## 5. Recomendação

**Decidir agora:**

1. **Fechar QRD-12 e QRD-13 como DECIDIDOS** (já estão maduros; hoje figuram como decisão mas o resto do doc os trata como base — apenas confirmar que não são mais research-open). O app é superfície humana OSS-first; CLI é superfície headless; ambos sobre o mesmo runtime.
2. **Posicionamento de produto (resolver QRD-37 parcialmente):** adotar o modelo de 5 corpos (F4) como **taxonomia-alvo**, sem ainda extrair: `core/packages` (permissivo) · `runtime/backend` · `app` · `CLI ai-guidelines` · `docs/adapters`. Registrar que `governance-demo` é codinome de fase.
3. **Nome público:** **manter aberto**, mas estabelecer o **critério**: o nome do produto deve ser distinto de `ai-guidelines` (que continua sendo o framework/CLI), curto, não amarrado a "demo"/"governance-demo", e verificável quanto a colisão de pacote npm/domínio/marca antes de cravar. Não escolher nesta rodada (decisão humana + checagem de disponibilidade).
4. **Licença:** **manter o core permissivo** (MIT/Apache-2.0) para `packages/*` e runtime reutilizável. **Não** introduzir AGPL nem open-core agora. Reabrir a decisão de licença do app/server **apenas** se/quando a QRD-36 (control plane hospedado) sair de research-open para "operado por nós".

**Manter aberto (não decidir agora):**

- Nome público e organização GitHub própria.
- AGPL vs permissivo no app/server (depende de QRD-36).
- Open-core/dual-license (depende de existir recurso enterprise real).

**Testar antes:**

- Rodar OpenSSF **Scorecard** + auto-avaliação **OSPS Baseline nível 1** no estado atual para medir a distância de maturidade OSS (barato, hosting-agnostic; F6). Isso vira baseline objetivo para "pronto para repo público".

## 6. Impacto em QRDs

- **Fechar:** QRD-12 e QRD-13 (confirmar como decididos; já maduros).
- **Avançar (parcial), manter research-open:** QRD-37 — decidir a **taxonomia de produto** e o **critério de nome**, mas não o nome. QRD-38 — ver [estratégia de extração](2026-07-06-work-graph-model-extraction-strategy.md).
- **Novos contratos/checks sugeridos (não implementar nesta rodada):**
  - `DOC`: registrar em `APP-PRODUCT-STATEMENT.md` a taxonomia de 5 corpos + licença-alvo por corpo.
  - `CHECK` (futuro): job de CI rodando OpenSSF Scorecard e publicando o grau como evidência de maturidade (adapter de "governança do próprio projeto").
  - Nenhum teste de produto muda; isto é decisão de packaging/licença.
