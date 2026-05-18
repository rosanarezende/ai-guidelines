<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0021 Governance Information Architecture

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.

> **Histórico de saneamentos:**
> Sanitizado em 4.C.[SANITIZE-NEXT] (2026-05-18): débitos das Fases 0–3 consolidados como "todos fechados"; débitos da Fase 4 reduzidos de 10 itens para 1 genuinamente ativo (Fase 4 #5/7/8/9/10 + Insight "Harness Lock no boilerplate" migrados para `roadmap/backlog.md`; Fase 4 #2/4/6 removidos por estarem resolvidos; Fase 4 #1 removido por ser reserva intencional, não débito).

---

## 🏛️ Débitos Adiados

### Débitos das Fases 0–3

Todos os débitos das Fases 0–3 fechados durante a execução das próprias fases (rename `spike`, ADRs fundacionais, schema living-docs v0, drift guard, TemplateEngine v0, validação estrutural v0) ou absorvidos por sub-blocos da Fase 4 (rename `governance-foundation.md` em 4.B.1; consolidação ADRs em 4.B.4/5; cleanup docs em 4.C.1; engine activation em 4.C.0; equivalência mirror↔engine em 4.C.3). Trilha histórica completa: `tasks.md` desta spec + commits relacionados.

### Débitos da Fase 4 (Consolidação)

1. **4.A.2 permanece parcial até 4.D.[ARCHITECTURE].** Consistência total catálogo↔repo só fecha quando 4.D auditar, pós-cleanup, que todos os deltas declarados em `GOVERNANCE-CATALOG.md` §6 (ADRs em dois lares, `/docs/` como ilhas, `cli/` mjs vs `src/` DDD, `.specify/templates/` vs `recipes/`) foram resolvidos ou explicitamente postergados para spec futura. Único débito interno cross-bloco da 0021 ainda ativo; resolução planejada dentro deste mesmo PR.

---

## 💡 Insights e Descobertas

### Rastro histórico em specs congeladas (não débito)

Algumas referências históricas em `.specify/specs/` (paths antigos, "ponteiros" de versões passadas e trechos de auditoria) são **rastro intencional**. Esses trechos não são SSOT do layout atual e **não** devem ser "limpos" quando o resultado for perder rastreabilidade ou contexto de decisão.
