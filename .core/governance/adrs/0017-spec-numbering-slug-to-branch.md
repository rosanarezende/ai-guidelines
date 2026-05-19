# ADR 0017 — Numeração de Specs: Slug Semântico Até Branch, Sem Reserva Futura

**Status**: Aceita
**Origem histórica**: Spec 0008 sub-bloco B (canonizou a regra) — promovida a ADR pela Spec 0021 sub-bloco 4.B.2 (2026-05-17).

---

## Contexto

Numeração sequencial fixa de specs (`spec-0011-foo`, `spec-0012-bar`) traz dois problemas previsíveis quando o backlog é vivo:

1. **Reorganização de prioridade força renumeração.** Se a candidata `spec-0011-foo` ainda não foi instanciada e o time decide promover outra candidata à frente, mudar `spec-0012-bar` para `spec-0011-bar` exige churn editorial em todos os ponteiros (roadmap, docs, MEMORY do agente).

2. **Reserva de número à frente cria lacunas mortas.** "Vamos reservar 0011-0015 para o trabalho de governança" envelhece mal: 0011-0013 ficam ocupados por specs reais, 0014 nunca é instanciado (escopo absorvido em outra), 0015 nunca foi necessário. O leitor 2 anos depois enxerga lacunas e gasta tempo procurando "a spec que faltou".

O problema é estrutural: **número** carrega significado de **ordenação** + **identidade**. Quando você usa um para mudar prioridade, contamina o outro.

## Princípio

**Candidatas vivem por slug semântico até a criação do branch; número é alocado uma única vez, no momento do branch, como próximo sequencial disponível, sem reserva à frente.** Após a alocação, o número nunca muda — mesmo que a spec seja cancelada, absorvida ou superseded.

Quatro corolários decorrem do princípio:

1. **Antes do branch, identidade é o slug.** Candidatas em `roadmap/backlog.md` aparecem como `governance-coherence`, `roadmap-adapters`, `quality-harness-engineering` — sem número. Reorganizar prioridade é **mover linha** entre seções (Now / Next / Later), não renumerar.

2. **No ato do branch, alocação é determinística.** Próximo número sequencial disponível olhando pastas em `.specify/specs/`. Sem reserva à frente, sem pular intervalos por preferência estética.

3. **Após alocação, número é imutável.** Specs concluídas, canceladas, absorvidas ou superseded **mantêm** sua numeração como rastreabilidade histórica. ADR 0008 absorveu 0004 — 0004 segue numerada 0004, com status atualizado. Renumerar quebraria referências em commits, PRs, ADRs, MEMORY.

4. **Lacunas são honest historical artifact.** Se 0011 foi cancelada antes de gerar artefato, o número 0011 permanece "gasto" — não é reutilizado pela próxima candidata. Reaproveitamento ambíguo é pior que lacuna explícita.

## Opções avaliadas

| #   | Opção                                                            | Trade-off                                                                                                                                                  |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Numeração fixa desde candidata** (status quo pré-0008)         | Identidade estável desde sempre, mas renumeração ao reordenar prioridade gera churn editorial sem ganho.                                                   |
| B   | **Sem numeração ever** (só slug semântico durante todo o ciclo)  | Maximiza fluidez de prioridade, mas perde rastreabilidade compacta — "PR #312 implementou spec X" precisa de slug longo no commit message, no branch, etc. |
| C   | **Slug até branch, número no branch, imutável após** (escolhida) | Combina fluidez de prioridade (slug move livre) + identidade estável após commit ao trabalho (número não renumera). Lacunas como artifact aceito.          |
| D   | **Reservar números à frente** ("0011-0015 para governança")      | Permite "agrupar visualmente" trabalhos relacionados, mas envelhece mal: reservas viram lacunas mortas; reorganização as quebra de qualquer jeito.         |

## Onde se aplica

Este princípio rege:

- A política de abertura de spec: candidata em `backlog.md` aparece **sem número**. Número é alocado no ato de `git checkout -b feat/spec-XXXX-<slug>`.
- A política de promoção entre seções Now/Next/Later: **nunca** renumera; só move linha.
- A política de cancelamento/supersession: marca status, **mantém** numeração.
- A política de renumeração de ADRs (definida em 4.B.5): aplica o mesmo princípio — legado preserva, locais renumeram apenas quando há colisão de promoção a lar canônico.

Este princípio **não** rege:

- A política de versionamento do **pacote npm** — semver clássico, decisão separada.
- A política de nomeação de branches que não sejam de spec (fix, docs, chore) — slug livre, sem número.

## Consequências

- Memória histórica é **estável**: "spec 0019 falou sobre bootstrap consumidor" segue verdadeiro daqui a 5 anos, mesmo que prioridades tenham mudado N vezes.
- Reorganização de backlog é **barata**: mover linha em `backlog.md` não dispara renomeação de arquivos, branches, commits.
- Risco residual: leitor enxerga lacunas (0001-0002 ausentes em ADRs, eventual lacuna em specs canceladas pré-instanciação). **Aceito**: lacuna é mais honesta que reutilização ambígua.

---

_Operacionalização (checklist de abertura, alocação do número): [`.core/process/governance-foundation.md`](../../process/governance-foundation.md) § "Numeração de specs"._
