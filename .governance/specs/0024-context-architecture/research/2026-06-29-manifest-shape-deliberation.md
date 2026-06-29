# Deliberação — shape do manifesto-por-repo (em formato q/r/d)

- Data: 2026-06-29 · Spec 0024 · Natureza: **research/deliberação, não-autoridade** (insumo de DEC; não decide sozinho).
- Continua [`2026-06-29-cross-repo-comms-manifest-and-discovery.md`](2026-06-29-cross-repo-comms-manifest-and-discovery.md) (que PROPÔS o manifesto-por-repo). Aqui se **delibera o shape**.
- Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git. Prior art **pública** nas referências.

> **O método q/r/d, refinado (insight da owner 2026-06-29) — esta deliberação é um exemplo VIVO dele:**
>
> - a **`question` é ITERATIVA** — não nasce com opções fixas; **as opções se constroem DURANTE as researches**.
>   Por isso, abaixo, cada question já carrega as opções + a comparação que a pesquisa amadureceu (+ a proposta
>   que vai ao gate).
> - as **`researches` embasam** — aqui aparecem **só como REFERÊNCIAS** (as fontes). ⚠️ **Num q/r/d de verdade,
>   cada uma seria um `research.md` próprio** (método · achados · evidência · data), não um link. _(ver
>   [[framework-heart-qrd]] / o template `research.md`.)_
> - a **`decision` só nasce DEPOIS** — quando question + researches estão bem embasadas e **prontas pro gate
>   humano**. O gate é o aceite; a decisão é o "depois".

---

## Questions (a pergunta + as opções amadurecidas na pesquisa)

### Q1 — `owner`: 1 dono ou vários? (um repo pode ter partes de times diferentes)

**Realidade levantada (owner):** um repo pode ter partes de times diferentes. O mercado lida com isso?

**Como o mercado faz (embasado por R1):**

- **Backstage** — `spec.owner` é **1 só** por entidade (resolve p/ 1 Group/User). Granularidade = **dividir o
  repo em vários Components**, cada um com seu owner.
- **CODEOWNERS** (GitHub/GitLab) — ownership **por caminho/glob**: `src/forms/** → team-A`, `src/grid/** →
team-B`. É o jeito canônico de "partes do mesmo repo são de times diferentes".
- **OpsLevel/Cortex** — **1 time responsável** por serviço (p/ "quem eu chamo às 2h?"); inferem/predizem o dono.
- **Princípio dominante:** **1 dono ACCOUNTABLE por unidade** (clareza de "quem responde"); compartilhamento
  tratado por **granularidade** (sub-unidade/capability) ou **caminho** (CODEOWNERS). Lista chapada de co-donos é
  **evitada** (dilui accountability — "todos = ninguém").

**Opções p/ o nosso manifesto:**

| opção         | como                                                                            | prós                                                              | contras                                 |
| ------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| **A** (atual) | 1 `owner` por repo                                                              | simples; accountability clara                                     | não reflete repo multi-time             |
| **B** ⭐      | `owner` no repo (responsável-chave) **+** `owner` opcional por `provides`/parte | reflete a realidade SEM perder o accountable; = modelo CODEOWNERS | um campo a mais (só onde precisa)       |
| **C**         | lista `owners: [...]` no repo                                                   | reflete multi-time                                                | **dilui accountability**; mercado evita |

**Proposta levada ao gate:** **B** — sempre 1 responsável-chave (nunca zero/ambíguo) + override por
capability/caminho onde a realidade pedir. → **decidido em D1**.

### Q2 — quais campos de conhecimento? (`provides` só, ou + `capabilities`/`architecture`)

**O que cada campo responde (a distinção que importa — embasado por R2):**

- **`provides`** → _"a que outro repo este se LIGA?"_ — os **contratos formais** que outro repo binda. Preciso →
  **gera a aresta derivável**.
- **`capabilities`** → _"quem SABE sobre X?"_ — o que o repo **sabe fazer** (semântico). É o que **roteia a
  exploration** ("o DS tem form validado?") + busca/IA. **É o coração da 🔴🔥** (mais central pro roteamento do
  que o `provides`).
- **`architecture`** → _"COMO é feito / o que quebra se eu mexer?"_ — stack/padrões/deps. P/ impacto/raciocínio.

**Trade-off:** mais campos = grafo de conhecimento mais rico (roteamento/IA melhores) **MAS** mais a manter +
risco de ficar **stale** + **abstração prematura**.

**A objeção de staleness (provocação da owner):** "metadado envelhece" — **se dissolve com arquitetura-as-code
lint** (embasado por R3): o `stack` é validável vs `package.json` e as `boundaries` viram regra de lint que
gateia o CI no drift. → o `architecture` vira **fonte de CHECK**, não doc passiva.

**Proposta levada ao gate:** **os 3 campos** — o framework atende do dev-solo à grande empresa; os 3 ângulos
importam, e a staleness do `architecture` é resolvida por lint. → **decidido em D2**.

### Q3 — arestas cross-repo: DERIVADA ou EXPLÍCITA?

**Derivada:** só o consumidor declara `consumes: [{contract: acme-design-system/form-component}]` → o host
**deriva** `coordinates-with`. **Explícita:** declarar a aresta como entidade (`coordinates-with: [{with, on}]`).

| critério                          | DERIVADA (consumes→deriva)                       | EXPLÍCITA (declara a aresta)         |
| --------------------------------- | ------------------------------------------------ | ------------------------------------ |
| SSOT / "anota 1 lado"             | ✅ sem drift                                     | ❌ 2 lados podem discordar (2ª SSOT) |
| escrita                           | ✅ só `consumes`                                 | ❌ duplica provides/consumes         |
| expressividade                    | ❌ só o que é contrato formal                    | ✅ coordenação SEM contrato formal   |
| typo                              | ⚠️ nome errado = aresta some (precisa **check**) | ⚠️ idem, mais visível                |
| alinhamento (Backstage + Lente 3) | ✅                                               | ❌ mercado saiu disso                |

**Proposta levada ao gate:** **derivada como default** + explícita como escape hatch (coordenação sem contrato
formal) + check anti-typo. → **decidido em D3** (tentativo). _(embasado por R4.)_

---

## Researches (só as REFERÊNCIAS — num q/r/d real, cada uma seria um `research.md` documentado)

> ⚠️ Estas são as **fontes** que amadureceram as opções acima. Aqui só listamos as referências; num q/r/d de
> verdade cada uma teria seu `research.md` (método · achados · evidência) — esta deliberação **dogfooda** o gap.

- **R1** (embasa Q1 — ownership no mercado): [Backstage — descriptor (owner único)](https://backstage.io/docs/features/software-catalog/descriptor-format/) · [GitHub — about CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositories-settings-and-features/customizing-your-repository/about-code-owners) · [IDP landscape (OpsLevel/Cortex)](https://encore.cloud/resources/platform-engineering-tools).
- **R2** (embasa Q2 — as 3 faces): [Backstage — entity model (Component/API/Resource)](https://backstage.io/docs/features/software-catalog/descriptor-format/).
- **R3** (embasa Q2 — architecture vira CHECK, não envelhece): [Nx module boundaries](https://nx.dev/docs/features/enforce-module-boundaries) · [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) · [dependency-cruiser](https://github.com/sverweij/dependency-cruiser).
- **R4** (embasa Q3 — relações derivadas): [Backstage — relations read-only deduzidas](https://backstage.io/docs/features/software-catalog/descriptor-format/) (= a regra "anota 1 lado" da Lente 3).

---

## Decisions (o "depois" — só após q+r prontas pro gate humano; owner 2026-06-29)

### D1 (resolve Q1) — opção **B**

`owner` = **1 responsável-chave** (accountable, nunca vazio) **+** override opcional por `provides`/parte (modelo
CODEOWNERS). Reflete repo multi-time sem diluir accountability.

### D2 (resolve Q2) — **os 3 campos** (`provides` + `capabilities` + `architecture`)

Razão: o framework atende **do dev-solo à grande empresa** — os 3 ângulos importam. A staleness do `architecture`
é resolvida por arquitetura-lint (R3), o que **reforça** ter o campo.

### D3 (resolve Q3 — **TENTATIVO**, revisitar) — **derivada + escape hatch + check**

Derivada como default (alinha "anota 1 lado" + R4) **+** `coordinates-with` explícito como **escape hatch**
(coordenação sem contrato formal) **+** **check anti-typo** (`consumes` apontando p/ contrato que ninguém
`provides` → warning, não aresta calada). _(a owner não se sente 100% segura — revisitar quando o grafo cross-repo
estiver rodando no banco.)_

---

## Aplicado

`_templates/manifest.yml` (shape novo) + manifestos nos 3 work-repos (`acme-design-system`/`acme-mfe-identity`/
`acme-mfe-support`), commit `416edad4`. O grafo horizontal já é derivável dos arquivos (form-component →
{identity,support}; failure-event identity→support). **Próxima peça:** fiar na lib — `Manifest` no domínio +
`deriveContext` cruzar `provides×consumes` → o grafo horizontal + auto-discovery (varrer `.governance/`) + os 2
checks (anti-typo das arestas · freshness do `architecture`) → aparecer no dashboard.
