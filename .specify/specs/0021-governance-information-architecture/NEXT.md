<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0021 Governance Information Architecture

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado)_

### Débitos da Fase 1 (Fundação Arquitetural)

_(A preencher conforme execução)_

### Débitos da Fase 2 (Reestruturação Física)

_(A preencher conforme execução)_

### Débitos da Fase 3 (Living Documentation + Engine)

_(A preencher conforme execução)_

### Débitos da Fase 4 (Migração)

_(A preencher conforme execução)_

---

## 💡 Insights e Descobertas

### Alteração do Boilerplate de Tasks (Spec 0021)

**Context**: A 0021 resultaria em ~3000-3500 linhas de código distribuídas em 6 sub-blocos (1.A-B, 2.A-C, 3.A-B, 4.A-B, Extra). O boilerplate original de `tasks.md` agrupava **todos** os sub-blocos sob uma única branch, gerando 1 PR-monolítica ou múltiplas micro-PRs (~200 linhas cada).

**Decisão**: Reestruturar para **5 PRs sequenciais** (PR0 + PR1-4), cada uma com:

- Um `[NEW-BRANCH]` por Fase (não por sub-bloco)
- Múltiplos commits atômicos por sub-bloco dentro da mesma PR
- Um `[PULL-REQUEST-READY]` e aprovação humana no final de cada Fase

**Implicação**: Reduz micro-gerenciamento (11 possíveis PRs → 5), sem perder atomicidade de commits (cada sub-bloco mantém seu commit incremental). Facilita review modular e permite gates de aprovação estratégicos entre Fases.

**Recomendação para próximas specs substanciais**: Usar este modelo quando tamanho previsto > 2000 linhas. Ajustar número de PRs conforme interdependências (fases desacopladas podem virar PRs paralelas).

_(Sem novos insights registrados nesta sessão)_
