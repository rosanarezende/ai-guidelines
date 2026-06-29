# Deliberação — shape do manifesto-por-repo (em formato q/r/d)

- Data: 2026-06-29 · Spec 0024 · Natureza: **research/deliberação, não-autoridade** (insumo de DEC; não decide sozinho).
- Continua [`2026-06-29-cross-repo-comms-manifest-and-discovery.md`](2026-06-29-cross-repo-comms-manifest-and-discovery.md) (que PROPÔS o manifesto-por-repo). Aqui se **delibera o shape**.
- **Estruturado como q/r/d** (insight da owner 2026-06-29): o que estava em ABERTO + as opções = **`questions`** ("o antes") · o benchmark/embasamento = **`researches`** · o que ficou = **`decisions`** ("o depois"). É também um **exemplo vivo** do formato q/r/d aplicado à modelagem.
- Prior art **pública** nas researches; padrões genéricos. Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git.

---

## Questions (o que estava em aberto + as opções)

### Q1 — `owner`: 1 dono ou vários? (um repo pode ter partes de times diferentes)

- **A** — 1 `owner` por repo.
- **B** — `owner` no repo (responsável-chave) **+** override opcional por `provides`/parte.
- **C** — lista `owners: [...]`.

### Q2 — quais campos de conhecimento? (`provides` só, ou + `capabilities`/`architecture`)

- só `provides` (contratos formais) · `provides` + `capabilities` · **os 3** (`provides` + `capabilities` + `architecture`).

### Q3 — arestas cross-repo: DERIVADA ou EXPLÍCITA?

- **derivada** (só `consumes` → host deriva `coordinates-with`) · **explícita** (declara `coordinates-with`) · híbrido.

---

## Researches (o embasamento — benchmark + prós/contras fundamentados)

### R1 (embasa Q1) — ownership no mercado

**1 dono _accountable_ por unidade** é o padrão (software catalogs = 1 `owner`/entidade; portais de on-call = 1
time pro "quem eu chamo às 2h"). Granularidade tratada por **caminho** (modelo CODEOWNERS: `src/forms/**→time-A`,
`src/grid/**→time-B`) ou por **sub-unidade**. **Lista chapada de co-donos é evitada** — dilui accountability
("todos = ninguém"). _(Backstage `spec.owner` obrigatório e único; CODEOWNERS path-based.)_

### R2 (embasa Q2) — as 3 faces respondem perguntas DISTINTAS

- `provides` → _"a que outro repo me LIGO?"_ — contrato formal → **aresta derivável**.
- `capabilities` → _"quem SABE sobre X?"_ — semântico → **roteia a exploration + busca/IA** (coração da 🔴🔥;
  mais central pro roteamento que o `provides`).
- `architecture` → _"COMO é feito / o que quebra se eu mexer?"_ — stack/padrões → impacto/raciocínio.

### R3 (embasa Q2) — "metadado envelhece" se dissolve com **arquitetura-as-code lint**

O `architecture` não é doc passiva: o `stack` é **validável vs `package.json`** (freshness check) e as
`boundaries` viram **regra de lint que gateia o CI** quando uma lib é adicionada / um padrão muda. Ferramentas
maduras: [Nx module boundaries](https://nx.dev/docs/features/enforce-module-boundaries) (checa imports TS +
`package.json`) · [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) (codifica o
grafo de dependência permitido) · [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
(ciclos/órfãos/regras custom). → vira **fonte de CHECK** (alinha "anota 1 lado + check anti-drift").

### R4 (embasa Q3) — derivada × explícita (prós/contras)

| critério                          | DERIVADA (`consumes`→deriva)              | EXPLÍCITA (declara a aresta)         |
| --------------------------------- | ----------------------------------------- | ------------------------------------ |
| SSOT / "anota 1 lado"             | ✅ sem drift                              | ❌ 2 lados podem discordar (2ª SSOT) |
| escrita                           | ✅ só `consumes`                          | ❌ duplica `provides`/`consumes`     |
| expressividade                    | ❌ só contrato formal                     | ✅ coordenação sem contrato formal   |
| typo                              | ⚠️ aresta some calada → precisa **check** | ⚠️ idem, mais visível                |
| alinhamento (Backstage + Lente 3) | ✅                                        | ❌ mercado saiu disso                |

---

## Decisions (o que ficou — owner 2026-06-29)

### D1 (resolve Q1) — opção **B**

`owner` = **1 responsável-chave** (accountable, nunca vazio) **+** override por `provides`/parte (modelo
CODEOWNERS). Reflete repo multi-time sem diluir accountability.

### D2 (resolve Q2) — **os 3 campos** (`provides` + `capabilities` + `architecture`)

Razão da owner: o framework atende **do dev-solo à grande empresa** — os 3 ângulos importam. A staleness do
`architecture` é resolvida por arquitetura-lint (R3), o que **reforça** ter o campo.

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
