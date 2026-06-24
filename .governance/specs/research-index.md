# Research Index — `.governance/`

> **Base de conhecimento navegável.** Pesquisas consolidadas vivem em `research-library/<domínio>/` (`architecture/`, `governance/`, `oss/`). Ao fechar uma spec, migre os researches de valor de `research/` local para cá (renomeados com prefixo `YYYY-MM-DD-`) e indexe-os abaixo. Cf. [`.core/process/governance-foundation.md`](../../.core/process/governance-foundation.md) §4.5.

---

## 🏗️ Arquitetura

- [Convergência taxonomy ↔ lifecycle (Spec 0023)](./research-library/architecture/2026-05-19-lifecycle-architecture.md) — invariantes universais leves (accountability + traceability + outcome registration), lifecycle intent categories como eixo de leitura (5 classes), runtime taxonomy-aware sem orchestration engine. Base do Bloco F da Spec 0023.
- [Superfícies de enforcement — evento ≠ estado contínuo](./research-library/architecture/2026-06-05-enforcement-surfaces.md) — uma restrição sobre um EVENTO não deve ser enforçada numa superfície de ESTADO CONTÍNUO; superfície de DECLARAÇÃO ≠ superfície de ENFORCEMENT. Taxonomia arquitetural viva da rodada "merge prematuro" (Spec 0024 / PR #35), 2026-06-05.

---

## 🗂️ Trilhas históricas (evidência, não migradas)

Trilhas de discovery preservadas em `.specify/` como **evidência citável** — referenciadas por link, não copiadas (cf. [ADR 0019](../../.core/governance/adrs/0019-governance-specs-root-in-maintainer.md); insight #4 do `NEXT.md` da 0023):

- [Spec 0023 — discovery model (trilha original)](../../.specify/specs/0023-governance-workflow-discovery-model/) — `research.md`, `research/boilerplates-audit.md`, `research/taxonomia-observacoes.md`. Discovery que pivotou para o "operational runtime" da 0023.

---

_Primeira entrada criada no fechamento da Spec 0023 (bootstrap alignment, `[DEC-0023-O01]`) — primeiro caso real de consolidação de research em `.governance/`._
