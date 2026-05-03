# NEXT — Spec [Número] [Título Curto]

> **Arquivo temporário.** Criar **apenas quando a spec gera débitos conscientes**
> (insights fora do escopo, refactors adiados, riscos não mitigados, dependências
> para specs futuras). Specs sem débitos não criam o arquivo. **DELETADO no
> encerramento pré-merge** (fase final do `tasks.md`); itens ainda relevantes
> migram antes para `.specify/specs/roadmap/backlog.md`.
>
> Fonte: `.core/process/spec-foundation.md` — política de NEXT.md.

---

## 🏛️ Insights e Débitos Adiados

Use esta seção para registrar:

- Insights técnicos que apareceram durante execução mas estão fora do escopo
  da spec atual.
- Débitos conscientes (TDD adiado, refactor postergado, edge case não coberto).
- Riscos identificados mas não mitigados (com motivo).

### 1. [Título do item]

- **O Problema**: descrição curta.
- **Insight**: o que poderia ser feito.
- **Ação**: para onde vai (Spec 0XXX, `roadmap/backlog.md`, backlog frio).

### 2. [...]

---

## ✂️ Itens descartados deliberadamente

> _Subseção opcional._ Incluir apenas se algo foi **avaliado e explicitamente
> rejeitado** durante a spec, com rationale que evita re-discussão futura. A
> maioria das specs não precisa desta subseção — a justificativa de não-fazer
> já vive em `spec.md` § "Fora do escopo".

- **[Item]** — rejeitado em [data]. Motivo: [...].

---

_Nota: itens **resolvidos** durante a spec foram movidos para o histórico em
`tasks.md` e `plan.md`. Itens adiados ficam aqui até o encerramento; depois
migram para `roadmap/backlog.md` ou são abandonados._
